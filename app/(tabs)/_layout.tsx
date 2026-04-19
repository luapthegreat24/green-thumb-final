/**
 * Green Thumb — Tab Layout (_layout.tsx)
 *
 * Responsive navigation:
 *
 *   < 744px  (phone)  → floating icon-only pill at bottom
 *   ≥ 744px  (tablet) → fixed left sidebar, icon + label, vine active state
 *
 * Both share identical tokens, icons, and spring physics.
 * Sidebar is modern editorial — no heavy borders, just ink hierarchy + a
 * sliding vine accent bar on the active item.
 *
 * Place at: app/(tabs)/_layout.tsx
 * Requires: react-native-svg, react-native-safe-area-context
 */

import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

// ── Breakpoint ──────────────────────────────────────────────────────────────────
const TABLET_BP = 744; // px — matches iPadOS split-view minimum

// ── Tokens ──────────────────────────────────────────────────────────────────────
const C = {
  paper: "#F2EDDF",
  paperWarm: "#ECE5D2",
  paperDark: "#E4DACA",
  paperLine: "#CFC8B2",
  ink: "#2C2416",
  inkMid: "#4A3D2C",
  inkLight: "#7A6E5E",
  inkFaint: "#B0A898",
  inkGhost: "#C8C0B0",
  vine: "#4A6C3A",
  moss: "#3C5830",
  sage: "#8BAF7C",
  sagePale: "#C2D9B8",
  sageWash: "#DCF0D4",
  ochre: "#C8903A",
  ochreLight: "#E0B870",
} as const;

const SANS = Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif";
const SERIF = Platform.OS === "ios" ? "Georgia" : "serif";

// ── Tabs config ─────────────────────────────────────────────────────────────────
const TABS = [
  { name: "index", label: "Home", icon: "home" },
  { name: "plants", label: "My Garden", icon: "garden" },
  { name: "explore", label: "Plant Search", icon: "search" },
  { name: "profile", label: "Profile", icon: "profile" },
] as const;

// ── Shared icon set ─────────────────────────────────────────────────────────────
function Icon({
  id,
  active,
  size = 22,
  color,
}: {
  id: string;
  active?: boolean;
  size?: number;
  color?: string;
}) {
  const stroke = color ?? (active ? C.vine : C.inkFaint);
  const fill = active ? C.sageWash : "none";
  const sw = active ? "1.8" : "1.4";

  const icons: Record<string, React.ReactElement> = {
    home: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 10.8L12 3L21 10.8V20.5C21 20.78 20.78 21 20.5 21H15V15H9V21H3.5C3.22 21 3 20.78 3 20.5V10.8Z"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
          fill={fill}
        />
      </Svg>
    ),
    garden: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 22V13"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />
        <Path
          d="M12 16C10 15.2 8 13.5 7.5 11C9.8 10 12 12.5 12 16Z"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
          fill={fill}
        />
        <Path
          d="M12 13C14 12.2 16 10.5 16.5 8C14.2 7 12 9.5 12 13Z"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
          fill={fill}
        />
        <Path
          d="M9.5 22H14.5"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      </Svg>
    ),
    calendar: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
          x="3"
          y="4"
          width="18"
          height="17"
          rx="3"
          stroke={stroke}
          strokeWidth={sw}
          fill={fill}
        />
        <Line x1="3" y1="9" x2="21" y2="9" stroke={stroke} strokeWidth="1.2" />
        <Line
          x1="8"
          y1="2"
          x2="8"
          y2="6"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />
        <Line
          x1="16"
          y1="2"
          x2="16"
          y2="6"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />
        <Circle cx="8" cy="14" r="1.1" fill={stroke} />
        <Circle cx="12" cy="14" r="1.1" fill={stroke} />
        <Circle cx="16" cy="14" r="1.1" fill={stroke} />
        <Circle cx="8" cy="18" r="0.9" fill={stroke} />
        <Circle cx="12" cy="18" r="0.9" fill={stroke} />
      </Svg>
    ),
    journal: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 5C10 4 6.5 4 4.5 5V20C6.5 19 10 19 12 20V5Z"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
          fill={fill}
        />
        <Path
          d="M12 5C14 4 17.5 4 19.5 5V20C17.5 19 14 19 12 20V5Z"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
          fill={fill}
        />
        <Line
          x1="6"
          y1="9"
          x2="10"
          y2="9"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.65"
        />
        <Line
          x1="6"
          y1="12"
          x2="10"
          y2="12"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.65"
        />
        <Line
          x1="14"
          y1="9"
          x2="18"
          y2="9"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.65"
        />
        <Line
          x1="14"
          y1="12"
          x2="18"
          y2="12"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.65"
        />
      </Svg>
    ),
    profile: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle
          cx="12"
          cy="8"
          r="4"
          stroke={stroke}
          strokeWidth={sw}
          fill={fill}
        />
        <Path
          d="M4.5 21C4.5 17.4 7.9 14.5 12 14.5C16.1 14.5 19.5 17.4 19.5 21"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      </Svg>
    ),
    search: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle
          cx="11"
          cy="11"
          r="6"
          stroke={stroke}
          strokeWidth={sw}
          fill={fill}
        />
        <Line
          x1="15.5"
          y1="15.5"
          x2="21"
          y2="21"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      </Svg>
    ),
  };
  return icons[id] ?? icons.home;
}

// ════════════════════════════════════════════════════════════════════════════════
// MOBILE — Floating icon-only pill (unchanged from before)
// ════════════════════════════════════════════════════════════════════════════════
const N = TABS.length;
const BAR_H = 64;

function MobileDot({ index, tabW }: { index: number; tabW: number }) {
  const DOT_W = 20;
  const x = useRef(
    new Animated.Value(index * tabW + tabW / 2 - DOT_W / 2),
  ).current;
  useEffect(() => {
    Animated.spring(x, {
      toValue: index * tabW + tabW / 2 - DOT_W / 2,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [index, tabW]);
  return (
    <Animated.View
      style={[mob.dot, { width: DOT_W, transform: [{ translateX: x }] }]}
      pointerEvents="none"
    />
  );
}

function MobileTab({
  tab,
  active,
  onPress,
  tabW,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
  onPress(): void;
  tabW: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const bg = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(bg, {
      toValue: active ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [active]);
  const bgColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(220,240,212,0)", "rgba(220,240,212,0.55)"],
  });
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.8,
          speed: 100,
          bounciness: 0,
          useNativeDriver: true,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          speed: 60,
          bounciness: 10,
          useNativeDriver: true,
        }).start()
      }
      style={[mob.tabBtn, { width: tabW }]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Animated.View
        style={[
          mob.iconWrap,
          { transform: [{ scale }], backgroundColor: bgColor },
        ]}
      >
        <Icon id={tab.icon} active={active} size={24} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function MobilePill({
  state,
  navigation,
}: {
  state: { index: number; routes: Array<{ name: string; key: string }> };
  navigation: { emit: Function; navigate: Function };
}) {
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const PILL_W = W - 40;
  const tabW = PILL_W / N;

  return (
    <View
      style={[mob.wrap, { bottom: Math.max(insets.bottom + 16, 24) }]}
      pointerEvents="box-none"
    >
      <View style={[mob.pill, { width: PILL_W }]}>
        <View style={[mob.row, { height: BAR_H - 8 }]}>
          {TABS.map((tab, i) => {
            const active = state.index === i;
            const route = state.routes[i];
            return (
              <MobileTab
                key={tab.name}
                tab={tab}
                active={active}
                tabW={tabW}
                onPress={() => {
                  const e = navigation.emit({
                    type: "tabPress",
                    target: route?.key ?? tab.name,
                    canPreventDefault: true,
                  });
                  if (!active && !e.defaultPrevented)
                    navigation.navigate(tab.name);
                }}
              />
            );
          })}
        </View>
        <MobileDot index={state.index} tabW={tabW} />
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// TABLET / DESKTOP — Left sidebar
// ════════════════════════════════════════════════════════════════════════════════
const SIDEBAR_W = 220; // full sidebar
const SIDEBAR_W_NARROW = 76; // icon-only mode when screen is tight

function SidebarItem({
  tab,
  active,
  onPress,
  narrow,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
  onPress(): void;
  narrow: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const labelO = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bgAnim, {
        toValue: active ? 1 : 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(labelO, {
        toValue: active ? 1 : 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [active]);

  const rowBg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(220,240,212,0)", "rgba(220,240,212,0.60)"],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.96,
          speed: 100,
          bounciness: 0,
          useNativeDriver: true,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          speed: 60,
          bounciness: 8,
          useNativeDriver: true,
        }).start()
      }
      style={side.itemWrap}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={tab.label}
    >
      <Animated.View
        style={[
          side.itemRow,
          narrow && side.itemRowNarrow,
          { transform: [{ scale }], backgroundColor: rowBg },
        ]}
      >
        {/* Active accent bar — left edge */}
        {active && <View style={side.accentBar} />}

        {/* Icon */}
        <View style={[side.iconBox, active && side.iconBoxActive]}>
          <Icon id={tab.icon} active={active} size={20} />
        </View>

        {/* Label — hidden in narrow mode */}
        {!narrow && (
          <Animated.Text
            style={[
              side.label,
              active && side.labelActive,
              { opacity: labelO },
            ]}
            numberOfLines={1}
          >
            {tab.label}
          </Animated.Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

function Sidebar({
  state,
  navigation,
  width: screenW,
}: {
  state: { index: number; routes: Array<{ name: string; key: string }> };
  navigation: { emit: Function; navigate: Function };
  width: number;
}) {
  const insets = useSafeAreaInsets();

  // Collapse to icon-only when screen is between tablet bp and 860
  const narrow = screenW < 860;
  const sideW = narrow ? SIDEBAR_W_NARROW : SIDEBAR_W;

  return (
    <View
      style={[
        side.sidebar,
        {
          width: sideW,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 8,
        },
      ]}
    >
      {/* Wordmark */}
      <View style={[side.brand, narrow && side.brandNarrow]}>
        {/* Leaf mark */}
        <View style={side.brandLeaf}>
          <Icon id="garden" color={C.vine} size={15} />
        </View>
        {!narrow && (
          <View>
            <Text style={side.brandName}>Green Thumb</Text>
            <Text style={side.brandSub}>Plant Monitor</Text>
          </View>
        )}
      </View>

      {/* Hairline rule */}
      <View style={side.rule} />

      {/* Nav items */}
      <View style={side.navList}>
        {TABS.map((tab, i) => {
          const active = state.index === i;
          const route = state.routes[i];
          return (
            <SidebarItem
              key={tab.name}
              tab={tab}
              active={active}
              narrow={narrow}
              onPress={() => {
                const e = navigation.emit({
                  type: "tabPress",
                  target: route?.key ?? tab.name,
                  canPreventDefault: true,
                });
                if (!active && !e.defaultPrevented)
                  navigation.navigate(tab.name);
              }}
            />
          );
        })}
      </View>

      {/* Bottom rule + version tag */}
      <View style={{ marginTop: "auto" }}>
        <View style={side.rule} />
        {!narrow && <Text style={side.version}>v1.0 · Green Thumb</Text>}
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SMART TAB BAR — picks mobile pill or sidebar based on width
// ════════════════════════════════════════════════════════════════════════════════
function SmartTabBar(props: {
  state: { index: number; routes: Array<{ name: string; key: string }> };
  navigation: { emit: Function; navigate: Function };
}) {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BP;

  if (isTablet) {
    return <Sidebar {...props} width={width} />;
  }
  return <MobilePill {...props} />;
}

// ── Layout ──────────────────────────────────────────────────────────────────────
export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BP;
  const narrow = width < 860;
  const sideW = isTablet ? (narrow ? SIDEBAR_W_NARROW : SIDEBAR_W) : 0;

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: C.paper }}>
      {/* Sidebar lives outside Tabs so content doesn't re-mount */}
      {isTablet && (
        <Tabs
          initialRouteName="index"
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <Sidebar {...(props as any)} width={width} />}
        >
          {TABS.map((t) => (
            <Tabs.Screen
              key={t.name}
              name={t.name}
              options={{ title: t.label }}
            />
          ))}
        </Tabs>
      )}

      {/* Mobile pill */}
      {!isTablet && (
        <Tabs
          initialRouteName="index"
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <MobilePill {...(props as any)} />}
        >
          {TABS.map((t) => (
            <Tabs.Screen
              key={t.name}
              name={t.name}
              options={{ title: t.label }}
            />
          ))}
        </Tabs>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// STYLES — Mobile
// ════════════════════════════════════════════════════════════════════════════════
const mob = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 100,
  },
  pill: {
    height: BAR_H,
    borderRadius: BAR_H / 2,
    backgroundColor: C.paperWarm,
    overflow: "hidden",
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabBtn: {
    height: BAR_H,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    bottom: 7,
    left: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.vine,
    opacity: 0.65,
  },
});

// ════════════════════════════════════════════════════════════════════════════════
// STYLES — Sidebar
// ════════════════════════════════════════════════════════════════════════════════
const side = StyleSheet.create({
  sidebar: {
    backgroundColor: C.paperWarm,
    borderRightWidth: StyleSheet.hairlineWidth * 2,
    borderRightColor: C.paperLine,
    paddingHorizontal: 12,
    // Subtle right shadow
    shadowColor: C.ink,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 50,
  },

  // Wordmark
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 20,
  },
  brandNarrow: {
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  brandLeaf: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.sageWash,
    borderWidth: 1,
    borderColor: C.sagePale,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  brandName: {
    fontFamily: SERIF,
    fontSize: 15,
    fontWeight: "400",
    color: C.ink,
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  brandSub: {
    fontFamily: SANS,
    fontSize: 10,
    color: C.inkFaint,
    fontWeight: "400",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 1,
  },

  // Hairline
  rule: {
    height: StyleSheet.hairlineWidth * 1.5,
    backgroundColor: C.paperLine,
    marginHorizontal: 4,
    marginVertical: 6,
    opacity: 0.7,
  },

  // Nav list
  navList: {
    gap: 2,
    marginTop: 8,
  },

  // Item
  itemWrap: {
    borderRadius: 12,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    position: "relative",
  },
  itemRowNarrow: {
    justifyContent: "center",
    gap: 0,
    paddingHorizontal: 0,
  },

  // Active left bar
  accentBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: C.vine,
  },

  // Icon box
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconBoxActive: {
    backgroundColor: C.sageWash,
  },

  // Label
  label: {
    fontFamily: SANS,
    fontSize: 14,
    fontWeight: "400",
    color: C.inkLight,
    letterSpacing: -0.1,
    flex: 1,
  },
  labelActive: {
    color: C.vine,
    fontWeight: "500",
  },

  // Version footer
  version: {
    fontFamily: SANS,
    fontSize: 10,
    color: C.inkGhost,
    letterSpacing: 0.5,
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
});
