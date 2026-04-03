import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { P } from "@/constants/herbarium-theme";
import { useAuth } from "../../providers/auth-provider";

// ─── Tab definitions ──────────────────────────────────────────────────────────
// Add / remove tabs here — the bar renders from this array automatically.
type TabDef = {
  name: string;
  label: string;
  icon: string;
  iconOn: string;
};

const TABS = [
  {
    name: "index",
    label: "Garden",
    icon: "leaf-outline",
    iconOn: "leaf",
  },
  {
    name: "garden",
    label: "My Garden",
    icon: "grid-outline",
    iconOn: "grid",
  },
  {
    name: "journal",
    label: "Journal",
    icon: "book-outline",
    iconOn: "book",
  },
  {
    name: "profile",
    label: "Profile",
    icon: "person-outline",
    iconOn: "person",
  },
] satisfies ReadonlyArray<TabDef>;

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────

type TabBarProps = {
  state: any;
  descriptors: any;
  navigation: any;
};

type TabIconButtonProps = {
  icon: string;
  iconOn: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel: string;
};

function TabIconButton({
  icon,
  iconOn,
  isFocused,
  onPress,
  onLongPress,
  accessibilityLabel,
}: TabIconButtonProps) {
  const focusAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: isFocused ? 1 : 0,
      friction: 8,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [focusAnim, isFocused]);

  const scale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  const translateY = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        st.tabItem,
        isFocused && st.tabItemActive,
        pressed && st.tabItemPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View
        style={[st.iconWrap, { transform: [{ scale }, { translateY }] }]}
      >
        <Ionicons
          name={(isFocused ? iconOn : icon) as any}
          size={isFocused ? 23 : 21}
          color={isFocused ? P.g0 : P.i3}
        />
      </Animated.View>
    </Pressable>
  );
}

function HerbariumTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[st.barOuter, { bottom: insets.bottom + 10 }]}>
      {/* Tab items */}
      <View style={st.tabRow}>
        {state.routes.map((route: any, index: number) => {
          const tabDef = TABS.find((t) => t.name === route.name);
          if (!tabDef) return null;

          const isFocused = state.index === index;
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <TabIconButton
              key={route.key}
              icon={tabDef.icon}
              iconOn={tabDef.iconOn}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityLabel={options.title ?? tabDef.label}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: P.p1,
        }}
      >
        <ActivityIndicator size="large" color={P.g1} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href={"/login" as never} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <HerbariumTabBar {...props} />}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.label }}
        />
      ))}
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  barOuter: {
    position: "absolute",
    left: 24,
    right: 24,
    height: 58,
    borderRadius: 28,
    backgroundColor: P.p0,
    borderWidth: 1,
    borderColor: P.hair,
    overflow: "hidden",
    shadowColor: P.i0,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 8,
  },

  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
    paddingHorizontal: 12,
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
    borderRadius: 20,
    height: 40,
  },
  tabItemActive: {
    backgroundColor: P.gBg,
  },
  tabItemPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  iconWrap: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});
