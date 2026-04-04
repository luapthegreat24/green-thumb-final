import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type ConfirmTone = "primary" | "danger";

type AppConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AppConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  onConfirm,
  onCancel,
}: AppConfirmModalProps) {
  const [renderModal, setRenderModal] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    if (visible) {
      setRenderModal(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.98,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 10,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setRenderModal(false);
      }
    });
  }, [opacity, scale, translateY, visible]);

  if (!renderModal) return null;

  return (
    <Modal transparent animationType="none" visible={renderModal}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale }, { translateY }],
            },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[
                styles.confirmBtn,
                tone === "danger" ? styles.confirmBtnDanger : null,
              ]}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.26)",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8DFD6",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  title: {
    fontFamily: "SpaceMono",
    fontSize: 15,
    color: "#0F1410",
  },
  message: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: "#8A9585",
    lineHeight: 18,
  },
  actions: {
    marginTop: 6,
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8DFD6",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#FFFBF7",
  },
  cancelText: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: "#0F1410",
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#3A7C52",
  },
  confirmBtnDanger: {
    backgroundColor: "#C4623A",
  },
  confirmText: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: "#FFFFFF",
  },
});
