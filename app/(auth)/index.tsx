import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { DS } from "@/constants/app-design-system";
import { useResponsiveMetrics } from "@/hooks/use-responsive-metrics";

// --- Sub-components for better organization ---

function WelcomeHeader({ isNarrow }: { isNarrow: boolean }) {
  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
      <View style={styles.eyebrowContainer}>
        <View style={styles.eyebrowDot} />
        <AppText
          variant="mono"
          style={[styles.eyebrow, isNarrow && { letterSpacing: 1.4 }]}
        >
          Green Thumb
        </AppText>
      </View>
    </Animated.View>
  );
}

function WelcomeHero({
  isNarrow,
  scaled,
}: {
  isNarrow: boolean;
  scaled: (value: number, min: number, max: number) => number;
}) {
  return (
    <View
      style={[
        styles.textContainer,
        { marginBottom: Math.round(scaled(DS.spacing.xxxl, 28, 56)) },
      ]}
    >
      <Animated.View entering={FadeInDown.duration(500).delay(100)}>
        <AppText
          variant="display"
          style={[
            styles.title,
            {
              fontSize: Math.round(scaled(56, 38, 58)),
              lineHeight: Math.round(scaled(60, 42, 62)),
            },
          ]}
        >
          Track,{"\n"}nurse, grow.
        </AppText>
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(500).delay(200)}>
        <AppText
          variant="body"
          style={[
            styles.subtitle,
            {
              fontSize: Math.round(scaled(16, 14, 17)),
              lineHeight: Math.round(scaled(24, 20, 25)),
              maxWidth: isNarrow ? "100%" : "85%",
            },
          ]}
        >
          A minimalist botanical space to track your personal garden and
          continue exactly where you left off.
        </AppText>
      </Animated.View>
    </View>
  );
}

function WelcomeActions() {
  const handleCreateAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(auth)/signup");
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(auth)/login");
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(300)}
      style={styles.actionsContainer}
    >
      <AppButton
        label="Create Account"
        onPress={handleCreateAccount}
        containerStyle={styles.primaryButton}
      />
      <AppButton
        label="Sign In"
        variant="secondary"
        onPress={handleSignIn}
        containerStyle={styles.secondaryButton}
      />
    </Animated.View>
  );
}

// --- Main Screen Component ---

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { isNarrow, scaled, screenPadding } = useResponsiveMetrics();

  return (
    <View
      style={[
        styles.page,
        {
          paddingTop: insets.top + Math.round(scaled(DS.spacing.xxxl, 34, 60)),
          paddingBottom: Math.max(insets.bottom, DS.spacing.xl),
        },
      ]}
    >
      <View style={[styles.content, { paddingHorizontal: screenPadding }]}>
        <WelcomeHeader isNarrow={isNarrow} />

        <View
          style={[
            styles.bottomSpace,
            { paddingBottom: Math.round(scaled(DS.spacing.lg, 12, 20)) },
          ]}
        >
          <WelcomeHero isNarrow={isNarrow} scaled={scaled} />
          <WelcomeActions />
        </View>
      </View>
    </View>
  );
}

// --- Stylesheet ---

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: DS.colors.surface,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
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
  bottomSpace: {
    justifyContent: "flex-end",
  },
  textContainer: {
    gap: DS.spacing.lg,
  },
  title: {
    fontWeight: "900",
    color: DS.colors.text,
    letterSpacing: -2,
  },
  subtitle: {
    color: DS.colors.textMuted,
  },
  actionsContainer: {
    gap: DS.spacing.md,
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: DS.colors.primary,
    borderWidth: 0,
  },

  secondaryButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: DS.colors.surfaceAlt,
    borderWidth: 0,
  },
});
