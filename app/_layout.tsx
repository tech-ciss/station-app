import "@/theme/global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text, View } from "react-native";

import { useAuthBootstrap } from "@/hooks/use-auth-bootstrap";
import { useNavigationState } from "@/hooks/use-navigation-state";
import { getNavigationAccess } from "@/navigation/guards";
import { queryClient } from "@/services/api/query-client";

export default function RootLayout() {
  const { isBootstrapped } = useAuthBootstrap();
  const navigationState = useNavigationState();
  const access = getNavigationAccess(navigationState);

  if (!isBootstrapped) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View className="flex-1 items-center justify-center bg-yely-background px-6">
            <Text className="text-center text-body font-semibold text-yely-muted">
              Connexion en cours...
            </Text>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={false}>
              <Stack.Screen name="index" />
            </Stack.Protected>

            <Stack.Protected guard={access.auth}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>

            <Stack.Protected guard={access.pumpSelection || access.sessionFeatures}>
              <Stack.Screen name="(session)" />
            </Stack.Protected>

            <Stack.Protected guard={access.sessionFeatures}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="close-session" />
              <Stack.Screen name="transaction-details" />
            </Stack.Protected>
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
