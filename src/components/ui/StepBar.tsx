import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type StepBarProps = {
  currentStep: number;
  totalSteps?: number;
  steps?: string[];
  className?: string;
};

const defaultSteps = ["Pompe", "Scan", "Chauffeur", "Succès"];

export function StepBar({
  currentStep,
  totalSteps,
  steps = defaultSteps,
  className = "",
}: StepBarProps) {
  const visibleSteps = steps.slice(0, totalSteps ?? steps.length);
  const activeIndex = Math.max(0, Math.min(currentStep - 1, visibleSteps.length - 1));

  return (
    <View className={`gap-3 ${className}`}>
      {/* Barre de progression */}
      <View className="flex-row items-center">
        {visibleSteps.map((step, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;
          const isLast = index === visibleSteps.length - 1;

          return (
            <View key={step} className="flex-1 flex-row items-center">
              {/* Marqueur */}
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  isDone
                    ? "bg-yely-primary"
                    : isActive
                    ? "bg-yely-primaryDeep"
                    : "bg-yely-surfaceSecondary border border-yely-border"
                }`}
                style={
                  isDone || isActive
                    ? {
                        shadowColor: isDone ? "#0F9D58" : "#0A3D2B",
                        shadowOpacity: 0.35,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 4,
                      }
                    : undefined
                }
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <Text
                    className={`text-caption font-bold ${
                      isActive ? "text-white" : "text-yely-muted"
                    }`}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>

              {/* Ligne de connexion */}
              {!isLast ? (
                <View className="mx-1.5 h-1 flex-1 overflow-hidden rounded-full bg-yely-surfaceSecondary">
                  <View
                    className={`h-full rounded-full ${isDone ? "bg-yely-primary" : "bg-transparent"}`}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Labels */}
      <View className="flex-row">
        {visibleSteps.map((step, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <Text
              key={step}
              className={`flex-1 text-center text-caption font-bold ${
                isActive
                  ? "text-yely-primaryDeep"
                  : isDone
                  ? "text-yely-primary"
                  : "text-yely-mutedLight"
              }`}
            >
              {step}
            </Text>
          );
        })}
      </View>
    </View>
  );
}
