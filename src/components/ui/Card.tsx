import type { PropsWithChildren } from "react";
import { View } from "react-native";

type CardVariant = "default" | "success" | "muted" | "danger" | "warning" | "info" | "deep";

type CardProps = PropsWithChildren<{
  variant?: CardVariant;
  className?: string;
  elevated?: boolean;
}>;

const variantClassName: Record<CardVariant, string> = {
  default: "border-yely-border bg-yely-surface",
  success: "border-yely-primary/30 bg-yely-primaryLight",
  muted: "border-yely-border bg-yely-surfaceSecondary",
  danger: "border-yely-dangerMid bg-yely-dangerSoft",
  warning: "border-yely-warningMid bg-yely-warningSoft",
  info: "border-blue-200 bg-yely-infoSoft",
  deep: "border-0 bg-yely-primaryDeep",
};

export function Card({ children, variant = "default", elevated = false, className = "" }: CardProps) {
  const shadowClass = elevated
    ? "shadow-card-lg"
    : variant === "default"
    ? "shadow-card"
    : "";

  return (
    <View
      className={`rounded-yely border p-4 ${variantClassName[variant]} ${shadowClass} ${className}`}
      style={
        elevated || variant === "default"
          ? {
              shadowColor: "#000000",
              shadowOpacity: elevated ? 0.12 : 0.07,
              shadowRadius: elevated ? 20 : 8,
              shadowOffset: { width: 0, height: elevated ? 6 : 2 },
              elevation: elevated ? 8 : 3,
            }
          : undefined
      }
    >
      {children}
    </View>
  );
}
