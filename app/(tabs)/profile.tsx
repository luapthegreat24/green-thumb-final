/**
 * profile.tsx — User Profile Screen
 * Apple-minimalist design: card-based layout with iOS grouping, status indicators,
 * account info sections, and logout action.
 */

import React, { useRef, useEffect, ComponentProps } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth";
import { useSignOut } from "@/hooks/use-sign-out";
import Svg, { Path } from "react-native-svg";

const { width: SW } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — iOS system design language
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  pageBg:       "#F2F2F7",
  cardBg:       "#FFFFFF",
  heroBg:       "#1C1C1E",
  label:        "#1C1C1E",
  labelSec:     "#636366",
  labelTert:    "#8E8E93",
  labelInverse: "#FFFFFF",
  sysGreen:     "#34C759",
  sysGreenDark: "#248A3D",
  sysBlue:      "#007AFF",
  sysOrange:    "#FF9500",
  sysRed:       "#FF3B30",
  sysPurple:    "#BF5AF2",
  sysGray:      "#8E8E93",
  sysGray4:     "#D1D1D6",
  sysGray5:     "#E5E5EA",
  sysGray6:     "#F2F2F7",
  accent:       "#2D6A4F",
  accentMid:    "#40916C",
  accentLight:  "#D8F3DC",
  accentPale:   "#ECFBEE",
  sep:          "rgba(60,60,67,0.18)",
  shadow:       "#000000",
};

type IcName = ComponentProps<typeof Ionicons>["name"];

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATIONS
// ─────────────────────────────────────────────────────────────────────────────
const useFadeUp = (delay = 0) => {
  const opacity  = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY,  { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const IcChevronRight = ({ color = "rgba(60,60,67,0.28)", size = 8 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * 1.5} viewBox="0 0 8 12" fill="none">
    <Path d="M2 2l4 4-4 4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SectionHeader = ({ title, delay = 0 }: { title: string; delay?: number }) => {
  const anim = useFadeUp(delay);
  return (
    <Animated.View style={[s.sectionHeader, anim]}>
      <Text style={s.sectionTitle}>{title}</Text>
    </Animated.View>
  );
};

const InsetList = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <View style={[s.insetList, style]}>{children}</View>
);

const InsetDivider = ({ indent = 70 }: { indent?: number }) => (
  <View style={[s.insetDivider, { marginLeft: indent }]} />
);

interface StatRowProps {
  icon: IcName;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  last?: boolean;
}

const StatRow = ({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  last = false,
}: StatRowProps) => (
  <>
    <View style={s.statRow}>
      <View style={[s.statIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={s.statBody}>
        <Text style={s.statLabel}>{label}</Text>
        <Text style={s.statValue}>{value}</Text>
      </View>
      <IcChevronRight />
    </View>
    {!last && <InsetDivider indent={62} />}
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user } = useAuth();
  const { signOut } = useSignOut();
  const router = useRouter();

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await signOut();
    router.replace("/(auth)/login");
  };

  const handleLogoutPress = async () => {
    Haptics.selectionAsync();
    await handleLogout();
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.pageBg} />
      <SafeAreaView style={s.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} bounces>
          
          {/* ════════════════════════════════════════════════
              HERO — User intro card with avatar
              ════════════════════════════════════════════════ */}
          <Animated.View style={[s.heroCard, useFadeUp(50)]}>
            <View style={s.avatarContainer}>
              <View style={s.avatar}>
                <Ionicons name="person" size={36} color={T.accentMid} />
              </View>
            </View>
            <Text style={s.heroName}>{user?.displayName || "GreenThumb User"}</Text>
            <Text style={s.heroSub}>{user?.email}</Text>
            <View style={s.heroStatusChip}>
              <View style={s.heroStatusDot} />
              <Text style={s.heroStatusText}>Account Active</Text>
            </View>
          </Animated.View>

          {/* ════════════════════════════════════════════════
              ACCOUNT INFO
              ════════════════════════════════════════════════ */}
          <SectionHeader title="Account" delay={80} />
          <Animated.View style={[{ marginHorizontal: 16 }, useFadeUp(100)]}>
            <InsetList>
              <StatRow
                icon="mail-outline"
                iconColor={T.sysBlue}
                iconBg="#E5F1FF"
                label="Email"
                value={user?.email || "—"}
              />
              <InsetDivider indent={62} />
              <StatRow
                icon="person-outline"
                iconColor={T.accentMid}
                iconBg={T.accentPale}
                label="Display Name"
                value={user?.displayName || "Not set"}
                last
              />
            </InsetList>
          </Animated.View>

          {/* ════════════════════════════════════════════════
              GARDEN STATS
              ════════════════════════════════════════════════ */}
          <SectionHeader title="Garden Overview" delay={150} />
          <Animated.View style={[{ marginHorizontal: 16 }, useFadeUp(170)]}>
            <InsetList>
              <StatRow
                icon="leaf-outline"
                iconColor={T.sysGreen}
                iconBg="#E8F9ED"
                label="Total Plants"
                value="14 plants"
              />
              <InsetDivider indent={62} />
              <StatRow
                icon="water-outline"
                iconColor={T.sysBlue}
                iconBg="#E5F1FF"
                label="Last Watering"
                value="2 minutes ago"
              />
              <InsetDivider indent={62} />
              <StatRow
                icon="calendar-outline"
                iconColor={T.sysOrange}
                iconBg="#FFF3E0"
                label="Member Since"
                value="3 weeks"
                last
              />
            </InsetList>
          </Animated.View>

          {/* ════════════════════════════════════════════════
              ACTIONS
              ════════════════════════════════════════════════ */}
          <SectionHeader title="Actions" delay={220} />
          <Animated.View style={[{ marginHorizontal: 16 }, useFadeUp(240)]}>
            <InsetList>
              <TouchableOpacity
                style={s.actionRow}
                onPress={handleLogoutPress}
                activeOpacity={0.75}
              >
                <View style={[s.actionIcon, { backgroundColor: "#FFEBEB" }]}>
                  <Ionicons name="log-out-outline" size={16} color={T.sysRed} />
                </View>
                <View style={s.actionBody}>
                  <Text style={s.actionLabel}>Log Out</Text>
                  <Text style={s.actionSub}>Sign out from your account</Text>
                </View>
                <IcChevronRight />
              </TouchableOpacity>
            </InsetList>
          </Animated.View>

          {/* Footer spacer */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.pageBg },
  safe: { flex: 1 },
  scroll: { paddingTop: 20 },
  
  // Hero card
  heroCard: {
    marginHorizontal: 16,
    backgroundColor: T.cardBg,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 32,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  avatarContainer: { marginBottom: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.accentPale,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: T.accentMid,
  },
  heroName: {
    fontSize: 24,
    fontWeight: "700",
    color: T.label,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 14,
    color: T.labelSec,
    fontWeight: "400",
    marginBottom: 16,
  },
  heroStatusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(52,199,89,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(52,199,89,0.25)",
  },
  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.sysGreen,
  },
  heroStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: T.sysGreenDark,
  },

  // Sections
  sectionHeader: {
    marginHorizontal: 16,
    marginVertical: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: T.label,
    letterSpacing: -0.3,
  },

  // Inset lists
  insetList: {
    backgroundColor: T.cardBg,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  insetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.sep,
  },

  // Stat rows
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: T.cardBg,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statBody: { flex: 1, gap: 2 },
  statLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: T.label,
    letterSpacing: -0.15,
  },
  statValue: {
    fontSize: 12,
    color: T.labelSec,
    fontWeight: "400",
  },

  // Action rows
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: T.cardBg,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  actionBody: { flex: 1, gap: 1 },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: T.sysRed,
    letterSpacing: -0.15,
  },
  actionSub: {
    fontSize: 12,
    color: T.sysGray,
    fontWeight: "400",
  },
});
