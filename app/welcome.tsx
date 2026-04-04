import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@/components/ui/app-text";
import { DS } from "@/constants/app-design-system";
import { useAuth } from "@/providers/auth-provider";

export default function WelcomeScreen() {
  const WELCOME_DELAY_MS = 2500;
  const { user } = useAuth();
  const router = useRouter();
  const hasScheduledNavigation = useRef(false);
  const orbPulse = useSharedValue(0);
  const railProgress = useSharedValue(0);

  // Extract a readable username
  const username =
    user?.displayName || user?.email?.split("@")[0] || "Green Thumb";

  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(orbPulse.value, [0, 1], [1, 1.22]) }],
    opacity: interpolate(orbPulse.value, [0, 1], [0.25, 0.5]),
  }));

  const leafAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(orbPulse.value, [0, 1], [-2, 2])}deg` },
      { translateY: interpolate(orbPulse.value, [0, 1], [0, -3]) },
    ],
  }));

  const railAnimatedStyle = useAnimatedStyle(() => ({
    width: `${interpolate(railProgress.value, [0, 1], [14, 100])}%`,
  }));

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (hasScheduledNavigation.current) {
      return;
    }

    hasScheduledNavigation.current = true;

    orbPulse.value = withRepeat(
      withTiming(1, {
        duration: 1200,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );

    railProgress.value = withTiming(1, {
      duration: WELCOME_DELAY_MS,
      easing: Easing.out(Easing.cubic),
    });

    // Navigate to dashboard after a short welcome delay.
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, WELCOME_DELAY_MS);

    return () => clearTimeout(timer);
  }, [WELCOME_DELAY_MS, orbPulse, railProgress, router, user]);

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(500)}
        style={[styles.backdropOrb, styles.backdropOrbA, orbAnimatedStyle]}
      />
      <Animated.View
        entering={FadeIn.duration(700)}
        style={[styles.backdropOrb, styles.backdropOrbB, orbAnimatedStyle]}
      />

      <Animated.View
        entering={FadeInDown.duration(700).springify()}
        exiting={FadeOut}
        style={styles.content}
      >
        <Animated.View style={[styles.iconContainer, leafAnimatedStyle]}>
          <Ionicons name="leaf" size={48} color={DS.colors.primary} />
        </Animated.View>

        <AppText variant="caption" style={styles.kicker}>
          GREEN THUMB
        </AppText>

        <AppText variant="title" style={styles.title}>
          Welcome, {username}
        </AppText>

        <AppText variant="body" style={styles.subtitle}>
          Preparing your garden dashboard
        </AppText>

        <View style={styles.rail}>
          <Animated.View style={[styles.railFill, railAnimatedStyle]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DS.colors.bg,
    overflow: "hidden",
    paddingHorizontal: DS.spacing.xl,
  },
  backdropOrb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: DS.colors.primary,
  },
  backdropOrbA: {
    width: 280,
    height: 280,
    top: -70,
    right: -90,
  },
  backdropOrbB: {
    width: 220,
    height: 220,
    bottom: -50,
    left: -80,
    backgroundColor: DS.colors.amber,
  },
  content: {
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.borderSoft,
    borderRadius: DS.radius.lg,
    paddingVertical: DS.spacing.xxl,
    paddingHorizontal: DS.spacing.xl,
    shadowColor: "#1C2318",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  iconContainer: {
    backgroundColor: DS.colors.surfaceAlt,
    padding: DS.spacing.lg,
    borderRadius: DS.spacing.xl,
    marginBottom: DS.spacing.md,
    shadowColor: "#1C2318",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  kicker: {
    letterSpacing: 1.4,
    fontWeight: "700",
    marginBottom: DS.spacing.sm,
    color: DS.colors.primaryMid,
  },
  title: {
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 34,
    marginBottom: DS.spacing.sm,
    color: DS.colors.text,
    textAlign: "center",
  },
  subtitle: {
    color: DS.colors.textMuted,
    textAlign: "center",
    marginBottom: DS.spacing.lg,
  },
  rail: {
    width: "100%",
    height: 8,
    backgroundColor: DS.colors.primarySoft,
    borderRadius: DS.radius.pill,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: DS.colors.borderSoft,
  },
  railFill: {
    height: "100%",
    backgroundColor: DS.colors.primary,
    borderRadius: DS.radius.pill,
  },
});
