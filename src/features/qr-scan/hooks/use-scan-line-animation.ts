import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export function useScanLineAnimation(travel: number) {
  const scanProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanProgress, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(scanProgress, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true
        })
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [scanProgress]);

  return scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, travel]
  });
}
