import type { PropsWithChildren } from "react";
import { View } from "react-native";

import { SessionBottomNav } from "@/components/layout/SessionBottomNav";

export function GuardedFeatureLayout({ children }: PropsWithChildren) {
  return (
    <View className="flex-1 bg-yely-surface">
      <View className="flex-1">{children}</View>
      <SessionBottomNav />
    </View>
  );
}
