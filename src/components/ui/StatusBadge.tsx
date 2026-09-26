import { Text, View } from "react-native";

type StatusBadgeType = "success" | "warning" | "danger" | "neutral" | "info";

type StatusBadgeProps = {
  label: string;
  type?: StatusBadgeType;
  dot?: boolean;
  className?: string;
};

const badgeConfig: Record<StatusBadgeType, { container: string; text: string; dot: string }> = {
  success: {
    container: "bg-yely-primaryLight border border-yely-primary/20",
    text: "text-yely-primaryDark",
    dot: "bg-yely-primary",
  },
  warning: {
    container: "bg-yely-warningSoft border border-yely-warningMid",
    text: "text-yely-warning",
    dot: "bg-yely-warning",
  },
  danger: {
    container: "bg-yely-dangerSoft border border-yely-dangerMid",
    text: "text-yely-danger",
    dot: "bg-yely-danger",
  },
  neutral: {
    container: "bg-yely-surfaceSecondary border border-yely-border",
    text: "text-yely-muted",
    dot: "bg-yely-muted",
  },
  info: {
    container: "bg-yely-infoSoft border border-blue-200",
    text: "text-yely-info",
    dot: "bg-yely-info",
  },
};

export function StatusBadge({ label, type = "neutral", dot = false, className = "" }: StatusBadgeProps) {
  const config = badgeConfig[type];

  return (
    <View className={`flex-row items-center gap-1.5 self-start rounded-full px-3 py-1 ${config.container} ${className}`}>
      {dot ? <View className={`h-1.5 w-1.5 rounded-full ${config.dot}`} /> : null}
      <Text className={`text-caption font-bold ${config.text}`}>{label}</Text>
    </View>
  );
}
