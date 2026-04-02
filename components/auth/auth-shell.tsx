import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { P, SP, TY } from "@/constants/herbarium-theme";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <View style={styles.page}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <Ionicons name="leaf" size={14} color={P.g1} />
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.form}>{children}</View>
        </View>
        {footer}
      </View>
    </View>
  );
}

type AuthFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  autoComplete?: string;
};

export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "none",
  secureTextEntry = false,
  autoComplete,
}: AuthFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={P.i3}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        autoComplete={autoComplete as any}
        style={styles.input}
      />
    </View>
  );
}

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function AuthButton({
  label,
  onPress,
  loading,
  disabled,
}: AuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryButton,
        (disabled || loading) && styles.primaryButtonDisabled,
        pressed && !disabled && !loading && styles.primaryButtonPressed,
      ]}
    >
      <Text style={styles.primaryButtonText}>
        {loading ? "Please wait..." : label}
      </Text>
    </Pressable>
  );
}

type AuthLinkProps = {
  text: string;
  action: string;
  onPress: () => void;
};

export function AuthLink({ text, action, onPress }: AuthLinkProps) {
  return (
    <View style={styles.linkRow}>
      <Text style={styles.linkText}>{text} </Text>
      <Pressable onPress={onPress}>
        <Text style={styles.linkAction}>{action}</Text>
      </Pressable>
    </View>
  );
}

export function AuthNotice({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <View style={styles.notice}>
      <Ionicons name="alert-circle-outline" size={14} color={P.rust} />
      <Text style={styles.noticeText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: P.p1,
    justifyContent: "center",
    padding: SP.lg,
  },
  container: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    gap: SP.md,
  },
  glowOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(43,125,70,0.08)",
    top: -40,
    right: -70,
  },
  glowTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(208,140,70,0.06)",
    bottom: -50,
    left: -60,
  },
  card: {
    backgroundColor: P.p0,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: P.sketch,
    padding: SP.xl,
    shadowColor: P.i0,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: SP.sm,
  },
  eyebrow: {
    ...TY.monoLabel,
    fontSize: 10,
  },
  title: {
    ...TY.display,
    fontSize: 30,
    lineHeight: 36,
    marginBottom: SP.sm,
  },
  subtitle: {
    ...TY.body,
    fontSize: 15,
    lineHeight: 22,
    color: P.i2,
    marginBottom: SP.lg,
  },
  form: {
    gap: SP.md,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    ...TY.monoLabel,
    fontSize: 9,
  },
  input: {
    borderWidth: 1.5,
    borderColor: P.sketch,
    borderRadius: 16,
    backgroundColor: P.p1,
    paddingHorizontal: SP.md,
    paddingVertical: 14,
    fontSize: 15,
    color: P.i0,
  },
  primaryButton: {
    marginTop: SP.xs,
    backgroundColor: P.g0,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: P.p0,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingTop: SP.sm,
  },
  linkText: {
    ...TY.body,
    color: P.i2,
  },
  linkAction: {
    ...TY.body,
    color: P.g1,
    fontWeight: "800",
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(209,92,74,0.08)",
    borderColor: "rgba(209,92,74,0.25)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: SP.md,
    paddingVertical: 10,
  },
  noticeText: {
    ...TY.body,
    color: P.rust,
    flex: 1,
  },
});
