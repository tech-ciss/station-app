import { Text, TextInput, type TextInputProps, View } from "react-native";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

export function Input({ label, error, hint, leftSlot, rightSlot, className = "", ...props }: InputProps) {
  const hasError = Boolean(error);

  return (
    <View className="gap-2">
      {label ? (
        <Text className="text-bodySmall font-bold text-yely-text">{label}</Text>
      ) : null}
      <View
        className={`min-h-touch flex-row items-center rounded-yely border bg-yely-surface ${
          hasError ? "border-yely-danger" : "border-yely-borderStrong"
        } ${className}`}
        style={{
          shadowColor: "#000000",
          shadowOpacity: 0.04,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      >
        {leftSlot ? <View className="pl-4">{leftSlot}</View> : null}
        <TextInput
          placeholderTextColor="#A0B0AA"
          className={`flex-1 px-4 text-field text-yely-text ${leftSlot ? "pl-2" : ""} ${rightSlot ? "pr-2" : ""}`}
          {...props}
        />
        {rightSlot ? <View className="pr-4">{rightSlot}</View> : null}
      </View>
      {error ? (
        <Text className="text-caption font-semibold text-yely-danger">{error}</Text>
      ) : hint ? (
        <Text className="text-caption text-yely-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
