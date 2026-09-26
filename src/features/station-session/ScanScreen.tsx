import { Text, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSessionStore } from "@/store/session.store";

export function ScanScreen() {
  const currentSession = useSessionStore((state) => state.currentSession);

  return (
    <ScreenContainer>
      <View className="gap-1">
        <Text className="text-2xl font-bold text-yely-ink">Scan QR</Text>
        <Text className="text-base text-yely-muted">
          {currentSession?.stationName} - {currentSession?.pumpId}
        </Text>
      </View>

      <View className="min-h-[320px] items-center justify-center rounded-yely border-2 border-dashed border-yely-line bg-white px-6">
        <View className="h-44 w-44 items-center justify-center rounded-yely bg-yely-greenSoft">
          <Text className="text-center text-5xl font-bold text-yely-green">QR</Text>
        </View>
        <Text className="mt-5 text-center text-base text-yely-muted">
          Camera non branchee pour ce ticket.
        </Text>
      </View>

      <Card className="gap-2">
        <Text className="font-semibold text-yely-ink">Mode offline-friendly</Text>
        <Text className="text-sm text-yely-muted">
          La prochaine etape simulera une lecture QR et prepare le flux transaction.
        </Text>
      </Card>

      <Button label="Simuler un scan" onPress={() => router.push("/(session)/driver-confirm")} />
    </ScreenContainer>
  );
}
