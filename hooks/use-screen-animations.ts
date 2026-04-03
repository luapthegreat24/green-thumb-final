/**
 * Herbarium Screen Animations
 * Reusable animation hooks for premium screen transitions
 */

import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

/** Staggered fade + rise entrance (Pressed Specimen style) */
export function useFadeUp(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { opacity, transform: [{ translateY }] };
}

/** Spring press scale feedback */
export function usePressScale() {
  const scale = useRef(new Animated.Value(1)).current;
  const cfg = { useNativeDriver: true, speed: 60, bounciness: 4 } as const;

  return {
    scale,
    onPressIn: () => Animated.spring(scale, { toValue: 0.965, ...cfg }).start(),
    onPressOut: () => Animated.spring(scale, { toValue: 1, ...cfg }).start(),
  };
}

/** Full screen fade in (for page transitions) */
export function useFadeIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  return { opacity };
}
