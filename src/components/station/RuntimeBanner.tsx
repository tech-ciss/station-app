import { Text, View } from "react-native";

import { useAuthStore } from "@/store/auth.store";
import { useSessionStore } from "@/store/session.store";

export function RuntimeBanner() {
  const user = useAuthStore((state) => state.user);
  const currentSession = useSessionStore((state) => state.currentSession);
  const selectedPump = useSessionStore((state) => state.selectedPump);

  if (!currentSession?.isActive) {
    return null;
  }

  return (
    <View className="flex-row items-center justify-between gap-3 rounded-yely bg-yely-primary px-4 py-3">
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <View className="h-2 w-2 rounded-full bg-white" />
          <Text className="text-caption font-bold uppercase text-white">Session active</Text>
        </View>
        <Text className="text-body font-bold text-white">{currentSession.stationName}</Text>
        {user?.stationCode ? (
          <Text className="text-caption font-semibold text-white opacity-80">{user.stationCode}</Text>
        ) : null}
      </View>

      <View className="items-end gap-1">
        <Text className="text-body font-bold text-white">{currentSession.pumpName}</Text>
        {selectedPump?.code ? (
          <Text className="text-caption font-semibold text-white opacity-80">{selectedPump.code}</Text>
        ) : null}
        {selectedPump?.fuelType ? (
          <Text className="text-caption font-semibold text-white opacity-75">
            {selectedPump.fuelType === "GASOIL" ? "Gasoil" : "Super"}
          </Text>
        ) : null}
        {user?.firstName ? (
          <Text className="text-caption text-white opacity-70">{user.firstName}</Text>
        ) : null}
      </View>
    </View>
  );
}
