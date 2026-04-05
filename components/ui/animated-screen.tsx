import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";

type AnimatedScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
};

export function AnimatedScreen({ children, style, delay = 0 }: AnimatedScreenProps) {
  return (
    <Animated.View
      style={[{ flex: 1 }, style]}
      entering={FadeIn
        .delay(delay)
        .duration(260)
        .easing(Easing.out(Easing.cubic))
        .withInitialValues({
          opacity: 0,
          transform: [{ translateX: 14 }, { translateY: 2 }],
        })}
    >
      {children}
    </Animated.View>
  );
}
