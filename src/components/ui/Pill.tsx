import type { ReactNode } from "react";
import { Text, View } from "react-native";

type PillProps = {
  label: string;
  icon?: ReactNode;
  className?: string;
};

export function Pill({ label, icon, className = "" }: PillProps) {
  return (
    <View
      className={`min-h-8 flex-row items-center gap-1 self-start rounded-full bg-yely-surfaceSecondary px-3 ${className}`}
    >
      {icon ? <View>{icon}</View> : null}
      <Text className="text-caption font-semibold text-yely-text">{label}</Text>
    </View>
  );
}
