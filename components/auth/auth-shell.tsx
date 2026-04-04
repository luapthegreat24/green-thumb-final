import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/app-text";
import { DS } from "@/constants/app-design-system";

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
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable
        onPress={() => router.back()}
        style={[styles.backButton, { top: insets.top + DS.spacing.md }]}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Ionicons name="arrow-back" size={24} color={DS.colors.text} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + DS.spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.header}
        >
          <View style={styles.eyebrowContainer}>
            <View style={styles.eyebrowDot} />
            <AppText variant="mono" style={styles.eyebrow}>
              {eyebrow}
            </AppText>
          </View>
          <AppText variant="display" style={styles.title}>
            {title}
          </AppText>
          <AppText variant="body" style={styles.subtitle}>
            {subtitle}
          </AppText>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.formContainer}
        >
          {children}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.footerContainer}
        >
          {footer}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  icon?: keyof typeof Ionicons.glyphMap;
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
  icon,
}: AuthFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = () => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: 300 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: 300 });
  };

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [DS.colors.surfaceAlt, DS.colors.primary],
    );
    const backgroundColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [DS.colors.surfaceAlt, DS.colors.surface],
    );

    return {
      borderColor,
      backgroundColor,
      shadowOpacity: focusAnim.value * 0.05,
      shadowRadius: focusAnim.value * 8,
      shadowColor: DS.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      elevation: focusAnim.value * 3,
    };
  });

  return (
    <View style={styles.field}>
      <AppText variant="bodyStrong" style={styles.fieldLabel}>
        {label}
      </AppText>
      <Animated.View style={[styles.inputWrapper, animatedContainerStyle]}>
        {icon && (
          <Ionicons
            name={icon}
            size={22}
            color={isFocused ? DS.colors.primary : DS.colors.textFaint}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={DS.colors.textFaint}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          autoComplete={autoComplete as any}
          style={[styles.input, !icon && styles.inputNoIcon]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={DS.colors.primary}
        />
      </Animated.View>
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
  const pressedAnim = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressedAnim.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => {
        pressedAnim.value = withTiming(0.97, { duration: 150 });
      }}
      onPressOut={() => {
        pressedAnim.value = withTiming(1, { duration: 150 });
      }}
      style={({ pressed }) => [
        styles.primaryButton,
        (disabled || loading) && styles.primaryButtonDisabled,
      ]}
    >
      <Animated.View style={[styles.primaryButtonInner, animatedStyle]}>
        {loading ? (
          <ActivityIndicator color={DS.colors.surface} size="small" />
        ) : (
          <AppText variant="bodyStrong" style={styles.primaryButtonText}>
            {label}
          </AppText>
        )}
      </Animated.View>
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
      <AppText variant="body" style={styles.linkText}>
        {text}
      </AppText>
      <Pressable
        onPress={onPress}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        {({ pressed }) => (
          <AppText
            variant="bodyStrong"
            style={[styles.linkAction, pressed && { opacity: 0.6 }]}
          >
            {action}
          </AppText>
        )}
      </Pressable>
    </View>
  );
}

export function AuthNotice({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.notice}>
      <View style={styles.noticeIconBox}>
        <Ionicons name="alert-circle" size={20} color={DS.colors.danger} />
      </View>
      <AppText variant="body" style={styles.noticeText}>
        {message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: DS.colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: DS.spacing.xl,
    paddingBottom: DS.spacing.xxxl,
  },
  header: {
    marginBottom: DS.spacing.xxxl,
    marginTop: DS.spacing.xxxl,
  },
  backButton: {
    position: "absolute",
    left: DS.spacing.md,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DS.spacing.md,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DS.colors.primaryMid,
    marginRight: 8,
  },
  eyebrow: {
    color: DS.colors.textMuted,
    letterSpacing: 2,
    fontSize: 12,
  },
  title: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "800",
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
    letterSpacing: -1,
  },
  subtitle: {
    color: DS.colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: "90%",
  },
  formContainer: {
    gap: DS.spacing.xl,
  },
  field: {
    gap: DS.spacing.sm,
  },
  fieldLabel: {
    color: DS.colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    height: 56,
  },
  inputIcon: {
    marginLeft: DS.spacing.md,
    marginRight: DS.spacing.xs,
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: DS.spacing.md,
    fontSize: 16,
    color: DS.colors.text,
  },
  inputNoIcon: {
    paddingLeft: DS.spacing.xl,
  },
  primaryButton: {
    marginTop: DS.spacing.lg,
  },
  primaryButtonInner: {
    height: 56,
    borderRadius: 12,
    backgroundColor: DS.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: DS.colors.surface,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  footerContainer: {
    marginTop: DS.spacing.xxxl,
    alignItems: "center",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  linkText: {
    color: DS.colors.textMuted,
    fontSize: 15,
  },
  linkAction: {
    color: DS.colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: DS.colors.dangerSoft,
    borderRadius: 16,
    padding: DS.spacing.xl,
    marginBottom: DS.spacing.lg,
  },
  noticeIconBox: {
    marginTop: 2,
  },
  noticeText: {
    color: DS.colors.danger,
    flex: 1,
    lineHeight: 22,
    fontSize: 15,
  },
});
