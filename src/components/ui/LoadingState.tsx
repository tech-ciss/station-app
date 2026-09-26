import { ActivityIndicator, Text, View } from "react-native";

type LoadingStateProps = {
  label?: string;
  className?: string;
};

export function LoadingState({ label = "Chargement...", className = "" }: LoadingStateProps) {
  return (
    <View className={`items-center justify-center gap-3 px-6 py-8 ${className}`}>
      <ActivityIndicator color="#0F9D58" />
      <Text className="text-bodySmall font-medium text-yely-muted">{label}</Text>
    </View>
  );
}
