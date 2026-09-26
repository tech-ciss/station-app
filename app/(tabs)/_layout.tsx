import { Stack } from "expo-router";

import { GuardedFeatureLayout } from "@/components/layout/GuardedFeatureLayout";

export default function TabsLayout() {
  return (
    <GuardedFeatureLayout>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="history" />
        <Stack.Screen name="service" />
        <Stack.Screen name="profile" />
      </Stack>
    </GuardedFeatureLayout>
  );
}
