import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View, type GestureResponderEvent } from "react-native";

type ButtonVariant = "primary" | "secondary" | "danger" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  title?: string;
  label?: string; // Rétrocompatibilité
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  fullWidth?: boolean;
};

const variantStyles: Record<ButtonVariant, { container: string; text: string; loader: string }> = {
  primary: {
    container: "bg-yely-primary border border-transparent active:bg-yely-primaryDeep",
    text: "text-white",
    loader: "#FFFFFF",
  },
  secondary: {
    container: "bg-yely-primaryLight border border-yely-primary/20 active:bg-yely-primaryLight/80",
    text: "text-yely-primaryDark",
    loader: "#0A7A44",
  },
  danger: {
    container: "bg-yely-danger border border-transparent active:bg-yely-danger/90",
    text: "text-white",
    loader: "#FFFFFF",
  },
  outline: {
    container: "border border-yely-borderStrong bg-transparent active:bg-yely-surfaceMuted",
    text: "text-yely-text",
    loader: "#1A2620",
  },
  ghost: {
    container: "bg-transparent border border-transparent active:bg-yely-primaryLight/30",
    text: "text-yely-primary",
    loader: "#0F9D58",
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: "h-10 px-4 rounded-yely", text: "text-bodySmall font-semibold" },
  md: { container: "h-12 px-5 rounded-yely", text: "text-body font-semibold" },
  lg: { container: "h-[56px] px-6 rounded-yely-lg", text: "text-body font-bold" },
};

export function Button({
  title,
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  className = "",
  fullWidth = true, // Souvent true par défaut sur les interfaces mobiles métiers
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const buttonTitle = title ?? label ?? "";
  
  const styles = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      className={`
        flex-row items-center justify-center gap-2 relative overflow-hidden
        ${sizeStyle.container} 
        ${styles.container} 
        ${fullWidth ? "w-full" : "self-start"}
        ${isDisabled ? "pointer-events-none" : ""} 
        ${className}
      `}
      // Utilisation de la fonction de style de Pressable pour gérer proprement le feedback tactile
      style={({ pressed }) => ({
        opacity: isDisabled ? 0.45 : pressed ? 0.9 : 1,
      })}
    >
      {/* Conteneur de contenu - rendu invisible mais garde sa place si loading pour éviter le layout shift */}
      <View className={`flex-row items-center justify-center gap-2 ${loading ? "opacity-0" : "opacity-100"}`}>
        {leftIcon && <View aria-hidden>{leftIcon}</View>}
        <Text className={`text-center ${sizeStyle.text} ${styles.text}`}>
          {buttonTitle}
        </Text>
        {rightIcon && <View aria-hidden>{rightIcon}</View>}
      </View>

      {/* Loader en position absolue centré : évite les sauts de dimensions */}
      {loading && (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator color={styles.loader} size={size === "sm" ? "small" : "large"} />
        </View>
      )}
    </Pressable>
  );
}
