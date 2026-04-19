/**
 * tabs.tsx — Garden Screen
 * Apple-minimalist design: showcase plants in inset lists with health status,
 * quick actions, and garden statistics using iOS design patterns.
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
import Svg, { Path, Circle } from "react-native-svg";

const { width: SW } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
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
  accent:       "#2D6A4F",
  accentMid:    "#40916C",
  accentLight:  "#D8F3DC",
  accentPale:   "#ECFBEE",
  sysGray:      "#8E8E93",
  sysGray5:     "#E5E5EA",
  sysGray6:     "#F2F2F7",
  sep:          "rgba(60,60,67,0.18)",
  shadow:       "#000000",
};

type IcName = ComponentProps<typeof Ionicons>["name"];
type PlantStatus = "Thriving" | "Needs water" | "Check soil";

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

const AnimBar = ({ value, delay = 0, height = 3, color = T.accentMid }:
  { value: number; delay?: number; height?: number; color?: string }) => {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: value / 100, duration: 900, delay, useNativeDriver: false }).start();
  }, []);
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: T.sysGray5, overflow: "hidden" }}>
      <Animated.View style={{
        width: w.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
        height, borderRadius: height / 2, backgroundColor: color,
      }} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const PlantMark = ({ size = 22, color = T.accentMid }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22V10M12 10C12 10 8 9 5 6C5 6 5 2 9 2C13 2 12 6 12 10ZM12 10C12 10 16 9 19 6C19 6 19 2 15 2C11 2 12 6 12 10Z"
      stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
    />
    <Path d="M9 22h6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const IcChevronRight = ({ color = "rgba(60,60,67,0.28)", size = 8 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * 1.5} viewBox="0 0 8 12" fill="none">
    <Path d="M2 2l4 4-4 4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SectionHeader = ({ title, action, delay = 0 }: { title: string; action?: string; delay?: number }) => {
  const anim = useFadeUp(delay);
  return (
    <Animated.View style={[s.sectionHeader, anim]}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity activeOpacity={0.6}>
          <Text style={s.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const InsetList = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <View style={[s.insetList, style]}>{children}</View>
);

const InsetDivider = ({ indent = 70 }: { indent?: number }) => (
  <View style={[s.insetDivider, { marginLeft: indent }]} />
);

const STATUS_CFG = {
  "Thriving":    { color: T.sysGreenDark, chipBg: "#E4F6E8", dot: T.sysGreen  },
  "Needs water": { color: "#0A5FCB",       chipBg: "#E1EDFF", dot: T.sysBlue   },
  "Check soil":  { color: "#A05900",       chipBg: "#FFF0DC", dot: T.sysOrange },
};

interface PlantRowProps {
  name: string;
  zone: string;
  health: number;
  status: PlantStatus;
  delay?: number;
  last?: boolean;
}

const PlantRow = ({
  name,
  zone,
  health,
  status,
  delay = 0,
  last = false,
}: PlantRowProps) => {
  const cfg = STATUS_CFG[status];
  return (
    <>
      <TouchableOpacity style={s.plantRow} activeOpacity={0.97}>
        <View style={s.plantAvatar}>
          <PlantMark size={19} color={T.accentMid} />
        </View>
        <View style={s.plantBody}>
          <View style={s.plantTopLine}>
            <Text style={s.plantName} numberOfLines={1}>{name}</Text>
            <View style={[s.plantBadge, { backgroundColor: cfg.chipBg }]}>
              <View style={[s.plantBadgeDot, { backgroundColor: cfg.dot }]} />
              <Text style={[s.plantBadgeText, { color: cfg.color }]}>{status}</Text>
            </View>
          </View>
          <Text style={s.plantZone}>{zone}</Text>
          <View style={s.plantBarRow}>
            <View style={{ flex: 1 }}>
              <AnimBar value={health} delay={delay + 260} height={3} color={cfg.dot} />
            </View>
            <Text style={s.plantBarPct}>{health}%</Text>
          </View>
        </View>
        <IcChevronRight />
      </TouchableOpacity>
      {!last && <InsetDivider indent={70} />}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GARDEN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function GardenScreen() {
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.pageBg} />
      <SafeAreaView style={s.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} bounces>
          
          {/* ════════════════════════════════════════════════
              GARDEN STATS HERO
              ════════════════════════════════════════════════ */}
          <Animated.View style={[s.statsCard, useFadeUp(50)]}>
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={s.statNumber}>14</Text>
                <Text style={s.statLabel}>Plants</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statNumber}>92%</Text>
                <Text style={s.statLabel}>Health</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statNumber}>3</Text>
                <Text style={s.statLabel}>Need Water</Text>
              </View>
            </View>
          </Animated.View>

          {/* ════════════════════════════════════════════════
              MY PLANTS
              ════════════════════════════════════════════════ */}
          <SectionHeader title="My Plants" action="View all" delay={100} />
          <Animated.View style={[{ marginHorizontal: 16 }, useFadeUp(120)]}>
            <InsetList>
              <PlantRow
                name="Monstera Deliciosa"
                zone="Living Room"
                health={95}
                status="Thriving"
                delay={100}
              />
              <InsetDivider indent={70} />
              <PlantRow
                name="Pothos"
                zone="Bedroom"
                health={88}
                status="Thriving"
                delay={150}
              />
              <InsetDivider indent={70} />
              <PlantRow
                name="Snake Plant"
                zone="Kitchen"
                health={73}
                status="Needs water"
                delay={200}
              />
              <InsetDivider indent={70} />
              <PlantRow
                name="Philodendron"
                zone="Office"
                health={68}
                status="Check soil"
                delay={250}
                last
              />
            </InsetList>
          </Animated.View>

          {/* ════════════════════════════════════════════════
              QUICK ACTIONS
              ════════════════════════════════════════════════ */}
          <SectionHeader title="Quick Actions" delay={300} />
          <Animated.View style={[s.actionGrid, useFadeUp(320)]}>
            {[
              { icon: "water-outline" as IcName, label: "Water All", color: T.sysBlue, bg: "#E5F1FF" },
              { icon: "sunny-outline" as IcName, label: "Lights", color: T.sysOrange, bg: "#FFF3E0" },
              { icon: "leaf-outline" as IcName, label: "Fertilize", color: T.sysGreen, bg: "#E8F9ED" },
              { icon: "settings-outline" as IcName, label: "Settings", color: T.sysGray, bg: T.sysGray6 },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={s.actionTile} activeOpacity={0.75}>
                <View style={[s.actionBox, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={s.actionLabel} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            ))}
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

  statsCard: {
    marginHorizontal: 16,
    backgroundColor: T.cardBg,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: "700",
    color: T.label,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: T.labelSec,
    fontWeight: "500",
    textAlign: "center",
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: T.sep,
    marginHorizontal: 12,
  },

  sectionHeader: {
    marginHorizontal: 16,
    marginVertical: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: T.label,
    letterSpacing: -0.3,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: "500",
    color: T.accentMid,
  },

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
    marginBottom: 20,
  },
  insetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.sep,
  },

  plantRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    backgroundColor: T.cardBg,
  },
  plantAvatar: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: T.accentPale,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  plantBody: { flex: 1, gap: 3 },
  plantTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  plantName: {
    fontSize: 15,
    fontWeight: "600",
    color: T.label,
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  plantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  plantBadgeDot: { width: 5, height: 5, borderRadius: 2.5 },
  plantBadgeText: { fontSize: 10, fontWeight: "700" },
  plantZone: {
    fontSize: 12,
    color: T.sysGray,
    fontWeight: "400",
  },
  plantBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  plantBarPct: {
    fontSize: 10,
    color: T.sysGray,
    fontWeight: "500",
    width: 30,
    textAlign: "right",
  },

  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  actionTile: {
    width: (SW - 32 - 36) / 4,
    alignItems: "center",
    gap: 7,
  },
  actionBox: {
    width: 58,
    height: 58,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actionLabel: {
    fontSize: 11,
    color: T.labelSec,
    fontWeight: "500",
    textAlign: "center",
  },
});
