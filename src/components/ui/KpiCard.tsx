import { Text, View } from "react-native";
import type { ReactNode } from "react";

import { Card } from "./Card";

type KpiCardTone = "default" | "primary" | "danger" | "warning";

type KpiCardProps = {
  label: string;
  value: string;
  tone?: KpiCardTone;
  icon?: ReactNode;
  className?: string;
};

const toneStyles: Record<KpiCardTone, { card: string; label: string; value: string }> = {
  default: {
    card: "",
    label: "text-yely-muted",
    value: "text-yely-text",
  },
  primary: {
    card: "border-yely-primary/30 bg-yely-primaryLight",
    label: "text-yely-primaryDark",
    value: "text-yely-primaryDark",
  },
  danger: {
    card: "border-yely-dangerMid bg-yely-dangerSoft",
    label: "text-yely-danger",
    value: "text-yely-danger",
  },
  warning: {
    card: "border-yely-warningMid bg-yely-warningSoft",
    label: "text-yely-warning",
    value: "text-yely-warning",
  },
};

export function KpiCard({ label, value, tone = "default", icon, className = "" }: KpiCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card className={`min-h-[96px] flex-1 justify-between gap-2 ${styles.card} ${className}`}>
      <View className="flex-row items-center justify-between">
        <Text className={`text-caption font-bold uppercase tracking-wide ${styles.label}`}>
          {label}
        </Text>
        {icon ? <View className="opacity-60">{icon}</View> : null}
      </View>
      <Text className={`text-headingSmall font-bold ${styles.value}`} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </Card>
  );
}
