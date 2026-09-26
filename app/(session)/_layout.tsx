import { Stack } from "expo-router";

import { GuardedFeatureLayout } from "@/components/layout/GuardedFeatureLayout";
import { hasActiveSession } from "@/navigation/guards";
import { useSessionStore } from "@/store/session.store";

export default function SessionLayout() {
  const currentSession = useSessionStore((state) => state.currentSession);
  const isSessionActive = hasActiveSession(currentSession);

  return (
    <GuardedFeatureLayout>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right"
        }}
      >
        <Stack.Protected guard={!isSessionActive}>
          <Stack.Screen name="select-pump" />
        </Stack.Protected>

        <Stack.Protected guard={isSessionActive}>
          <Stack.Screen name="scan" />
          <Stack.Screen name="driver-confirm" />
          <Stack.Screen name="success" />
        </Stack.Protected>
      </Stack>
    </GuardedFeatureLayout>
  );
}
