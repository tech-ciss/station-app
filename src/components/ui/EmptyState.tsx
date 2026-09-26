import type { ReactNode } from "react";
import { Text, View } from "react-native";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({ icon, title, description, className = "" }: EmptyStateProps) {
  return (
    <View className={`items-center justify-center gap-3 px-6 py-8 ${className}`}>
      {icon ? (
        <View className="h-14 w-14 items-center justify-center rounded-full bg-yely-primaryLight">
          {icon}
        </View>
      ) : null}
      <View className="gap-1">
        <Text className="text-center text-headingSmall font-bold text-yely-text">{title}</Text>
        {description ? (
          <Text className="text-center text-bodySmall text-yely-muted">{description}</Text>
        ) : null}
      </View>
    </View>
  );
}
