import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

type AppToastProps = {
  message: string | null;
  visible: boolean;
  onHide: () => void;
  bottomOffset?: number;
};

export function AppToast({
  message,
  visible,
  onHide,
  bottomOffset = 20,
}: AppToastProps) {
  useEffect(() => {
    if (!visible || !message) return;

    const timer = setTimeout(onHide, 1800);
    return () => clearTimeout(timer);
  }, [visible, message, onHide]);

  if (!visible || !message) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.wrapper, { bottom: bottomOffset }]}
    >
      <View style={styles.toast}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
  },
  toast: {
    backgroundColor: "rgba(0, 0, 0, 0.82)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 420,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
