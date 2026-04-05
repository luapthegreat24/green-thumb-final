import { Ionicons } from "@expo/vector-icons";
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
import { useResponsiveMetrics } from "@/hooks/use-responsive-metrics";

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
  const { isNarrow, screenPadding, scaled } = useResponsiveMetrics();

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop:
              insets.top + Math.round(scaled(DS.spacing.xxxl, 34, 62)),
            paddingHorizontal: screenPadding,
            paddingBottom: Math.round(scaled(DS.spacing.xxxl, 30, 62)),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={[
            styles.header,
            {
              marginTop: Math.round(scaled(DS.spacing.xxl, 20, 42)),
              marginBottom: Math.round(scaled(DS.spacing.xxl, 24, 46)),
            },
          ]}
        >
          <View style={styles.eyebrowContainer}>
            <View style={styles.eyebrowDot} />
            <AppText variant="mono" style={styles.eyebrow}>
              {eyebrow}
            </AppText>
          </View>
          <AppText
            variant="display"
            style={[
              styles.title,
              {
                fontSize: Math.round(scaled(40, 30, 42)),
                lineHeight: Math.round(scaled(48, 36, 50)),
              },
            ]}
          >
            {title}
          </AppText>
          <AppText
            variant="body"
            style={[
              styles.subtitle,
              {
                fontSize: Math.round(scaled(16, 14, 17)),
                lineHeight: Math.round(scaled(24, 20, 25)),
                maxWidth: isNarrow ? "100%" : "90%",
              },
            ]}
          >
            {subtitle}
          </AppText>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(500)}
          style={[
            styles.formContainer,
            { gap: Math.round(scaled(DS.spacing.xl, 14, 24)) },
          ]}
        >
          {children}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(500)}
          style={[
            styles.footerContainer,
            { marginTop: Math.round(scaled(DS.spacing.xxxl, 28, 56)) },
          ]}
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
  const { scaled } = useResponsiveMetrics();
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
            size={Math.round(scaled(22, 20, 24))}
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
          style={[
            styles.input,
            {
              fontSize: Math.round(scaled(16, 14, 17)),
              paddingHorizontal: Math.round(scaled(DS.spacing.md, 10, 14)),
            },
            !icon && styles.inputNoIcon,
            !icon && { paddingLeft: Math.round(scaled(DS.spacing.xl, 14, 24)) },
          ]}
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
  const { scaled } = useResponsiveMetrics();
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
        { marginTop: Math.round(scaled(DS.spacing.lg, 12, 18)) },
        (disabled || loading) && styles.primaryButtonDisabled,
      ]}
    >
      <Animated.View
        style={[
          styles.primaryButtonInner,
          {
            height: Math.round(scaled(56, 48, 58)),
            borderRadius: Math.round(scaled(12, 10, 14)),
          },
          animatedStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={DS.colors.surface} size="small" />
        ) : (
          <AppText
            variant="bodyStrong"
            style={[
              styles.primaryButtonText,
              { fontSize: Math.round(scaled(17, 15, 18)) },
            ]}
          >
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
  const { scaled } = useResponsiveMetrics();

  if (!message) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={[
        styles.notice,
        {
          gap: Math.round(scaled(12, 10, 14)),
          borderRadius: Math.round(scaled(16, 12, 18)),
          padding: Math.round(scaled(DS.spacing.xl, 14, 24)),
          marginBottom: Math.round(scaled(DS.spacing.lg, 12, 18)),
        },
      ]}
    >
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
  },
  header: {},
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
  },
  formContainer: {},
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
    color: DS.colors.text,
  },
  inputNoIcon: {
    paddingLeft: DS.spacing.xl,
  },
  primaryButton: {},
  primaryButtonInner: {
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
    backgroundColor: DS.colors.dangerSoft,
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
