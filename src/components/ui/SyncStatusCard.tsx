import type { ComponentProps } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

type SyncStatusCardProps = {
  syncedCount?: number;
  pendingCount?: number;
  failedCount?: number;
  className?: string;
};

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export function SyncStatusCard({
  syncedCount = 0,
  pendingCount = 0,
  failedCount = 0,
  className = "",
}: SyncStatusCardProps) {
  let label = "Synchronisé";
  let type: "success" | "warning" | "danger" = "success";
  let icon: IoniconName = "cloud-done-outline";

  if (failedCount > 0) {
    label = `${failedCount} erreur(s) sync`;
    type = "danger";
    icon = "cloud-offline-outline";
  } else if (pendingCount > 0) {
    label = `${pendingCount} en attente`;
    type = "warning";
    icon = "cloud-upload-outline";
  }

  return (
    <Card className={`p-3 gap-2 ${className}`}>
      <View className="flex-row items-center gap-3">

        {/* ✅ Icône visuelle */}
        <Ionicons name={icon} size={18} color="#6B7F79" />

        {/* ✅ Texte principal */}
        <Text className="flex-1 text-bodySmall font-semibold text-yely-text">
          {label}
        </Text>

        {/* ✅ Badge */}
        <StatusBadge label={type === "success" ? "OK" : type === "warning" ? "Attente" : "Erreur"} type={type} dot />
      </View>
    </Card>
  );
}
