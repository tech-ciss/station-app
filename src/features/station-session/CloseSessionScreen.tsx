import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Button,
  Card,
  LoadingState,
  ScreenContainer,
  StatusBadge,
  SyncStatusCard,
} from "@/components/ui";
import { getSessionTransactions } from "@/features/station-session/services/session-transactions";
import { useSingleFlight } from "@/hooks/use-single-flight";
import { toApiError } from "@/services/api/client";
import { useAuthStore } from "@/store/auth.store";
import { useSessionStore } from "@/store/session.store";
import { useTransactionStore } from "@/store/transaction.store";
import { formatLiters as formatLitersValue, formatMoney } from "@/utils/format";

// --- HELPERS ---
function formatDuration(openedAt: string, now: Date) {
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - new Date(openedAt).getTime()) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function DetailRow({ label, value, isBold = false }: { label: string; value: string; isBold?: boolean }) {
  return (
    <View className="flex-row justify-between items-center py-1">
      <Text className="text-bodySmall text-yely-muted">{label}</Text>
      <Text className={`text-bodySmall text-yely-text ${isBold ? "font-bold" : "font-medium"}`}>{value}</Text>
    </View>
  );
}

// --- ÉCRAN PRINCIPAL ---
export function CloseSessionScreen() {
  const currentSession = useSessionStore((state) => state.currentSession);
  const closeSession = useSessionStore((state) => state.closeSession);
  const user = useAuthStore((state) => state.user);
  const transactions = useTransactionStore((state) => state.transactions);
  const runCloseSession = useSingleFlight();

  const [now, setNow] = useState(new Date());
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const sessionTransactions = useMemo(() => {
    if (!currentSession) return [];
    return getSessionTransactions(transactions, currentSession);
  }, [currentSession, transactions]);

  // Agrégation optimisée des métriques en une seule passe
  const report = useMemo(() => {
    return sessionTransactions.reduce(
      (acc, t) => {
        acc.count++;
        acc.amount += t.amount;
        acc.liters += t.liters;
        if (t.fuelType === "SUPER") acc.superCount++;
        if (t.fuelType === "GASOIL") acc.gasoilCount++;
        return acc;
      },
      { count: 0, amount: 0, liters: 0, superCount: 0, gasoilCount: 0 }
    );
  }, [sessionTransactions]);

  if (!currentSession?.isActive) {
    return (
      <ScreenContainer>
        <LoadingState label="Mise à jour de la session..." />
      </ScreenContainer>
    );
  }

  const duration = formatDuration(currentSession.openedAt, now);

  async function handleConfirmClose() {
    if (!isConfirmed) return;

    await runCloseSession(async () => {
      setIsClosing(true);
      setCloseError(null);

      try {
        await closeSession();
      } catch (error) {
        setCloseError(toApiError(error).message);
        setIsClosing(false);
      }
    });
  }

  return (
    <ScreenContainer scroll={false} contentClassName="p-0 bg-yely-surfaceMuted">
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 px-5 pt-5 pb-8"
          showsVerticalScrollIndicator={false}
        >
          {/* En-tête de l'écran */}
          <View className="gap-1">
            <Text className="text-headingMedium font-bold text-yely-text">Clôture de session</Text>
            <Text className="text-bodySmall text-yely-muted">Vérifiez l'ensemble des données avant de fermer la pompe.</Text>
          </View>

          {/* Validation de sécurité : État de la Synchronisation réseau */}
          <SyncStatusCard />

          {/* ── LE RAPPORT DE FIN DE SERVICE (STYLE REÇU) ── */}
          <Card className="p-5 border-t-4 border-t-yely-text bg-white shadow-sm gap-4">
            <View className="flex-row justify-between items-start">
              <View className="gap-0.5">
                <Text className="text-caption font-bold text-yely-muted uppercase tracking-wider">Identifiants</Text>
                <Text className="text-body font-black text-yely-text">{currentSession.pumpName}</Text>
                <Text className="text-caption text-yely-mutedLight">{currentSession.stationName}</Text>
              </View>
              <StatusBadge label="Session en cours" type="success" />
            </View>

            <View className="h-px bg-dashed border-t border-dashed border-yely-border/80" />

            {/* Section Temps */}
            <View className="gap-1">
              <DetailRow label="Pompiste responsable" value={user?.name ?? currentSession.cashierId} />
              <DetailRow label="Ouverture de session" value={formatTime(currentSession.openedAt)} />
              <DetailRow label="Heure de fermeture" value={formatTime(now)} />
              <DetailRow label="Durée totale de service" value={duration} isBold />
            </View>

            <View className="h-px bg-dashed border-t border-dashed border-yely-border/80" />

            {/* Section Financière & Volumes */}
            <View className="py-1 gap-3 bg-yely-surfaceMuted p-4 rounded-xl border border-yely-border/40">
              <View className="flex-row justify-between items-center">
                <Text className="text-caption font-bold text-yely-muted uppercase">Volume Distribué</Text>
                <Text className="text-body font-black text-yely-text">{formatLitersValue(report.liters)}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-caption font-bold text-yely-muted uppercase">Recette Totale</Text>
                <Text className="text-headingSmall font-black text-yely-primaryDeep">{formatMoney(report.amount)}</Text>
              </View>
            </View>

            <View className="h-px bg-dashed border-t border-dashed border-yely-border/80" />

            {/* Répartition des ventes */}
            <View className="gap-1">
              <Text className="text-caption font-bold text-yely-muted uppercase tracking-wider mb-1">Détail des transactions ({report.count})</Text>
              <View className="flex-row justify-between items-center py-0.5">
                <View className="flex-row items-center gap-2">
                  <View className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                  <Text className="text-bodySmall text-yely-muted">Super</Text>
                </View>
                <Text className="text-bodySmall font-bold text-yely-text">{report.superCount} vente{report.superCount > 1 ? "s" : ""}</Text>
              </View>
              <View className="flex-row justify-between items-center py-0.5">
                <View className="flex-row items-center gap-2">
                  <View className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  <Text className="text-bodySmall text-yely-muted">Gasoil</Text>
                </View>
                <Text className="text-bodySmall font-bold text-yely-text">{report.gasoilCount} vente{report.gasoilCount > 1 ? "s" : ""}</Text>
              </View>
            </View>
          </Card>

          {/* ── ZONE DE CONFIRMATION ET DE SÉCURITÉ ── */}
          <View className="gap-3 mt-2">
            <Card className="flex-row gap-3 bg-orange-50 border border-orange-200 p-4 rounded-xl">
              <Ionicons className="warning shadow-sm" size={20} color="#E65100" />
              <View className="flex-1 gap-0.5">
                <Text className="text-bodySmall font-bold text-orange-800">Action irréversible</Text>
                <Text className="text-caption text-orange-700/90 leading-normal">
                  La clôture coupe l'accès de l'application à cette pompe. Assurez-vous que le réseau est stable pour finir les envois en attente.
                </Text>
              </View>
            </Card>

            {/* Case à cocher redessinée */}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isConfirmed }}
              onPress={() => setIsConfirmed((v) => !v)}
              className={`flex-row items-center gap-3.5 rounded-xl border-2 p-4 active:opacity-90 transition-all ${
                isConfirmed ? "border-emerald-500 bg-emerald-50" : "border-yely-border bg-white"
              }`}
            >
              <View
                className={`h-6 w-6 items-center justify-center rounded-md border-2 ${
                  isConfirmed ? "border-emerald-600 bg-emerald-600" : "border-yely-borderStrong bg-white"
                }`}
              >
                {isConfirmed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text className={`flex-1 text-bodySmall font-bold ${isConfirmed ? "text-emerald-900" : "text-yely-text"}`}>
                Je confirme avoir vérifié les totaux et l'état des synchronisations.
              </Text>
            </Pressable>

            {closeError ? (
              <Card variant="danger" className="flex-row items-start gap-3 p-4">
                <Ionicons name="alert-circle" size={20} color="#D32F2F" />
                <View className="flex-1 gap-0.5">
                  <Text className="text-bodySmall font-bold text-yely-danger">
                    Fermeture non confirmée
                  </Text>
                  <Text className="text-caption text-yely-danger">
                    {closeError}
                  </Text>
                </View>
              </Card>
            ) : null}
          </View>
        </ScrollView>

        {/* Footer persistant et sécurisé */}
        <View
          className="border-t border-yely-border bg-white px-5 pb-6 pt-4"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: -3 },
            elevation: 4,
          }}
        >
          <Button
            title="Clôturer définitivement la session"
            variant="danger"
            size="lg"
            className="rounded-xl"
            loading={isClosing}
            disabled={!isConfirmed || isClosing}
            onPress={handleConfirmClose}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
