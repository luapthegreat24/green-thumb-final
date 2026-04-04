import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

type AppToastProps = {
  message: string | null;
  visible: boolean;
  onHide: () => void;
  position?: "top" | "bottom";
  topOffset?: number;
  bottomOffset?: number;
};

export function AppToast({
  message,
  visible,
  onHide,
  position = "bottom",
  topOffset = 20,
  bottomOffset = 20,
}: AppToastProps) {
  const DURATION_MS = 2300;
  const [renderToast, setRenderToast] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-18)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!visible || !message) {
      return;
    }

    setRenderToast(true);
    opacity.setValue(0);
    translateY.setValue(position === "top" ? -18 : 18);
    scale.setValue(0.92);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 130,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 130,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: position === "top" ? -10 : 10,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.96,
          duration: 170,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setRenderToast(false);
          onHide();
        }
      });
    }, DURATION_MS);

    return () => clearTimeout(timer);
  }, [visible, message, onHide, opacity, position, scale, translateY]);

  if (!renderToast || !message) return null;

  const edgeStyle =
    position === "top" ? { top: topOffset } : { bottom: bottomOffset };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrapper,
        edgeStyle,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <View style={styles.toast}>
        <View style={styles.row}>
          <View style={styles.leadingPill} />
          <Text style={styles.text}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 100,
  },
  toast: {
    backgroundColor: "#FCFFFD",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DDEAE2",
    paddingHorizontal: 13,
    paddingVertical: 10,
    maxWidth: 380,
    shadowColor: "#3A7C52",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  leadingPill: {
    width: 3,
    height: 16,
    borderRadius: 99,
    backgroundColor: "#3A7C52",
  },
  text: {
    color: "#1E2A21",
    fontSize: 12.5,
    fontFamily: "SpaceMono",
    flexShrink: 1,
  },
});
