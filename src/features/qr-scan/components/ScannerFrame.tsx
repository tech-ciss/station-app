import { Animated, Text, View } from "react-native";

type ScannerFrameProps = {
  size: number;
  scanLineTranslateY: Animated.AnimatedInterpolation<string | number>;
  isLocked?: boolean;
};

export function ScannerFrame({ size, scanLineTranslateY, isLocked = false }: ScannerFrameProps) {
  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 items-center justify-center"
    >
      <View
        className="relative overflow-hidden rounded-yely border border-yely-primary"
        style={{ height: size, width: size }}
      >
        <View className="absolute inset-6 rounded-yely border border-white opacity-20" />
        <View className="absolute left-5 top-5 h-12 w-12 border-l-4 border-t-4 border-yely-primary" />
        <View className="absolute right-5 top-5 h-12 w-12 border-r-4 border-t-4 border-yely-primary" />
        <View className="absolute bottom-5 left-5 h-12 w-12 border-b-4 border-l-4 border-yely-primary" />
        <View className="absolute bottom-5 right-5 h-12 w-12 border-b-4 border-r-4 border-yely-primary" />
        {!isLocked ? (
          <Animated.View
            className="absolute left-7 right-7 h-1 rounded-full bg-yely-primary"
            style={{
              top: 20,
              transform: [{ translateY: scanLineTranslateY }]
            }}
          />
        ) : null}
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-caption font-semibold uppercase text-white opacity-80">
            QR Chauffeur
          </Text>
        </View>
      </View>
    </View>
  );
}
