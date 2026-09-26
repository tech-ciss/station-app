import type { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenContainerProps = PropsWithChildren<{
  scroll?: boolean;
  className?: string;
}>;

export function ScreenContainer({
  children,
  scroll = true,
  className = ""
}: ScreenContainerProps) {
  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName={`flex-grow gap-5 px-5 py-5 ${className}`}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 gap-5 px-5 py-5 ${className}`}>{children}</View>
  );

  return (
    <SafeAreaView className="flex-1 bg-yely-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
