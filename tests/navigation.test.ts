import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";

import { preserveStationAssignment } from "../src/features/auth/preserve-station-assignment.ts";
import { normalizePumpPhotoAnalysis } from "../src/features/transactions/services/pump-photo-ai.api.ts";
import { createSingleFlight } from "../src/hooks/use-single-flight.ts";
import { getNavigationAccess } from "../src/navigation/guards.ts";
import type { StationSession } from "../src/types/session.ts";

function readProjectFile(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

test("la politique de routes couvre les trois états d'authentification et de session", () => {
  const activeSession = { isActive: true } as StationSession;

  assert.deepEqual(
    getNavigationAccess({ isAuthenticated: false, currentSession: null }),
    { auth: true, pumpSelection: false, sessionFeatures: false }
  );
  assert.deepEqual(
    getNavigationAccess({ isAuthenticated: true, currentSession: null }),
    { auth: false, pumpSelection: true, sessionFeatures: false }
  );
  assert.deepEqual(
    getNavigationAccess({ isAuthenticated: true, currentSession: activeSession }),
    { auth: false, pumpSelection: false, sessionFeatures: true }
  );
});

test("le verrou single-flight ignore un deuxième déclenchement pendant l'opération", async () => {
  const run = createSingleFlight();
  let calls = 0;
  let releaseFirst!: () => void;

  const first = run(async () => {
    calls += 1;
    await new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
  });
  const second = await run(async () => {
    calls += 1;
  });

  assert.deepEqual(second, { executed: false });
  assert.equal(calls, 1);

  releaseFirst();
  await first;

  const third = await run(async () => {
    calls += 1;
  });
  assert.equal(third.executed, true);
  assert.equal(calls, 2);
});

test("le bootstrap conserve l'affectation station absente de /auth/me", () => {
  const persistedUser = {
    id: "cashier-1",
    name: "Caissier",
    phone: "+2250700000000",
    role: "CASHIER",
    stationId: "station-1",
    stationName: "Station test",
    stationCode: "ST-TEST"
  };

  assert.deepEqual(
    preserveStationAssignment(
      {
        id: "cashier-1",
        name: "Caissier",
        phone: "+2250700000000",
        role: "CASHIER"
      },
      persistedUser
    ),
    persistedUser
  );

  const anotherUser = preserveStationAssignment(
    {
      id: "cashier-2",
      name: "Autre caissier",
      phone: "+2250500000000",
      role: "CASHIER"
    },
    persistedUser
  );
  assert.equal(anotherUser.stationId, undefined);
});

test("la sélection de pompe conserve un contexte station après clôture", () => {
  const sessionStore = readProjectFile("src/store/session.store.ts");
  const pumpSelection = readProjectFile("src/features/station-session/SelectPumpScreen.tsx");

  assert.match(sessionStore, /stationContext: \{\s+id: session\.stationId/);
  assert.match(sessionStore, /stationContext: \{\s+id: response\.session\.stationId/);
  assert.match(pumpSelection, /user\?\.stationId \?\? stationContext\?\.id/);
  assert.match(pumpSelection, /fetchStationPumps\(stationId\)/);
});

test("la clôture utilise l'identifiant canonique de la session serveur sans temporisation", () => {
  const sessionStore = readProjectFile("src/store/session.store.ts");

  assert.match(sessionStore, /const response = await fetchCurrentWorkSession\(\);\s+return response\.session\?\.isActive/);
  assert.doesNotMatch(sessionStore, /setTimeout|function delay/);
});

test("la réponse documentée de l'IA terminal est normalisée depuis la racine", () => {
  assert.deepEqual(
    normalizePumpPhotoAnalysis({
      success: true,
      status: "accepted",
      amount: 35_000,
      liters: 40,
      unit_price: 875,
      detected_fuel_type: "super",
      fuel_confidence: 0.98,
      analysis: { amount: 1, liters: 2 }
    }),
    {
      amount: 35_000,
      liters: 40,
      fuelType: "SUPER",
      confidence: 0.98,
      raw: {
        success: true,
        status: "accepted",
        amount: 35_000,
        liters: 40,
        unit_price: 875,
        detected_fuel_type: "super",
        fuel_confidence: 0.98,
        analysis: { amount: 1, liters: 2 }
      }
    }
  );
});

test("les layouts utilisent Stack.Protected sans Redirect synchrone", () => {
  const rootLayout = readProjectFile("app/_layout.tsx");
  const sessionLayout = readProjectFile("app/(session)/_layout.tsx");
  const authLayout = readProjectFile("app/(auth)/_layout.tsx");
  const tabsLayout = readProjectFile("app/(tabs)/_layout.tsx");

  assert.match(rootLayout, /Stack\.Protected/);
  assert.match(sessionLayout, /Stack\.Protected/);

  for (const source of [rootLayout, sessionLayout, authLayout, tabsLayout]) {
    assert.doesNotMatch(source, /\bRedirect\b/);
  }
});

test("login, ouverture, fermeture et changement de pompe sont pilotés par les stores", () => {
  const criticalScreens = [
    "src/features/auth/LoginScreen.tsx",
    "src/features/station-session/SelectPumpScreen.tsx",
    "src/features/station-session/CloseSessionScreen.tsx",
    "src/features/qr-scan/ScanScreen.tsx"
  ];

  for (const path of criticalScreens) {
    const source = readProjectFile(path);
    assert.match(source, /useSingleFlight/);
    assert.doesNotMatch(source, /router\.replace/);
    assert.doesNotMatch(source, /\bRedirect\b/);
  }

  const authStore = readProjectFile("src/store/auth.store.ts");
  const loginStart = authStore.indexOf("login: async");
  const logoutStart = authStore.indexOf("logout: ()", loginStart);
  const loginSource = authStore.slice(loginStart, logoutStart);

  assert.ok(
    loginSource.indexOf("restoreCurrentSession") < loginSource.indexOf("isAuthenticated: true"),
    "l'authentification ne doit devenir visible qu'après la restauration de session"
  );
});

test("la transaction navigue une seule fois vers success, après publication dans le store", () => {
  const confirmation = readProjectFile("src/features/transactions/DriverConfirmScreen.tsx");
  const success = readProjectFile("src/features/transactions/SuccessScreen.tsx");
  const successNavigations = confirmation.match(/router\.replace\("\/\(session\)\/success"\)/g) ?? [];

  assert.match(confirmation, /useSingleFlight/);
  assert.match(confirmation, /useEffect\(\(\) => \{/);
  assert.match(confirmation, /currentTransaction\?\.id !== completedTransactionId/);
  assert.match(confirmation, /hasRequestedSuccessNavigation\.current = true;\s+router\.replace/);
  assert.match(confirmation, /disabled=\{!isFormValid \|\| isAnalyzingPhoto \|\| isCreatingTransaction\}/);
  assert.equal(successNavigations.length, 1);
  assert.doesNotMatch(success, /\bRedirect\b/);
});

test("la route index ne déclenche aucune redirection intermédiaire", () => {
  const indexRoute = readProjectFile("app/index.tsx");

  assert.doesNotMatch(indexRoute, /\bRedirect\b|router\./);
});
