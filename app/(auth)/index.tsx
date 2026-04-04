import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { DS } from "@/constants/app-design-system";

// --- Sub-components for better organization ---

function WelcomeHeader() {
  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
      <View style={styles.eyebrowContainer}>
        <View style={styles.eyebrowDot} />
        <AppText variant="mono" style={styles.eyebrow}>
          Green Thumb
        </AppText>
      </View>
    </Animated.View>
  );
}

function WelcomeHero() {
  return (
    <View style={styles.textContainer}>
      <Animated.View entering={FadeInDown.duration(500).delay(100)}>
        <AppText variant="display" style={styles.title}>
          Track,{"\n"}nurse, grow.
        </AppText>
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(500).delay(200)}>
        <AppText variant="body" style={styles.subtitle}>
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

  return (
    <View
      style={[
        styles.page,
        {
          paddingTop: insets.top + DS.spacing.xxxl,
          paddingBottom: Math.max(insets.bottom, DS.spacing.xl),
        },
      ]}
    >
      <View style={styles.content}>
        <WelcomeHeader />

        <View style={styles.bottomSpace}>
          <WelcomeHero />
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
    paddingHorizontal: DS.spacing.xl,
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
    paddingBottom: DS.spacing.lg,
  },
  textContainer: {
    marginBottom: DS.spacing.xxxl,
    gap: DS.spacing.lg,
  },
  title: {
    fontSize: 56,
    fontWeight: "900",
    color: DS.colors.text,
    letterSpacing: -2,
    lineHeight: 60,
  },
  subtitle: {
    color: DS.colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: "85%",
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
