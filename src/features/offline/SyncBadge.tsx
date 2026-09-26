import { Text, View } from "react-native";

import { useSyncStatus } from "@/features/offline/hooks/use-sync-status";

export function SyncBadge() {
  const { isSyncing, pendingCount, failedCount } = useSyncStatus();

  const label = isSyncing
    ? "Synchronisation..."
    : failedCount > 0
      ? "Erreur"
      : pendingCount > 0
        ? "En attente"
        : "Synchronisé";

  const [backgroundClassName, textClassName] = (isSyncing
    ? "bg-yely-primaryLight text-yely-primaryDark"
    : failedCount > 0
      ? "bg-yely-dangerSoft text-yely-danger"
      : pendingCount > 0
        ? "bg-yely-warningSoft text-yely-warning"
        : "bg-yely-primaryLight text-yely-primaryDark"
  ).split(" ");

  return (
    <View className={`self-start rounded-full px-3 py-1 ${backgroundClassName}`}>
      <Text className={`text-caption font-semibold ${textClassName}`}>{label}</Text>
    </View>
  );
}
