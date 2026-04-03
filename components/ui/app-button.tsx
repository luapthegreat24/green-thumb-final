import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { DS } from "@/constants/app-design-system";

type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type AppButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  variant?: AppButtonVariant;
  leftIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export function AppButton({
  label,
  variant = "primary",
  leftIcon,
  containerStyle,
  disabled,
  ...props
}: AppButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        containerStyle,
      ]}
      {...props}
    >
      <View style={styles.row}>
        {leftIcon}
        <AppText
          variant="bodyStrong"
          style={[
            styles.label,
            variant === "primary" && styles.labelPrimary,
            variant === "danger" && styles.labelDanger,
          ]}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DS.spacing.md,
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: DS.colors.text,
  },
  labelPrimary: {
    color: DS.colors.surface,
  },
  labelDanger: {
    color: DS.colors.danger,
  },
  primary: {
    backgroundColor: DS.colors.primary,
    borderColor: DS.colors.primary,
  },
  secondary: {
    backgroundColor: DS.colors.surfaceAlt,
    borderColor: DS.colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: DS.colors.border,
  },
  danger: {
    backgroundColor: DS.colors.dangerSoft,
    borderColor: "rgba(196,98,58,0.3)",
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.9,
  },
});
