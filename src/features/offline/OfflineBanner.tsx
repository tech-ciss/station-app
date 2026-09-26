import { Text, View } from "react-native";

export function OfflineBanner() {
  return (
    <View className="rounded-yely bg-yely-warningSoft px-3 py-2">
      <Text className="text-sm font-medium text-yely-warning">Pret pour sync offline</Text>
    </View>
  );
}
