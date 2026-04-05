import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, usePathname, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
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

type SpeedDialAction = {
  key: "chatbot" | "dictionary" | "addPlant";
  label: string;
  icon: "chatbubbles" | "book" | "leaf";
  color: string;
  borderColor: string;
  onPress: () => void;
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
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user, initializing } = useAuth();
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const fabMenuAnim = useRef(new Animated.Value(0)).current;

  const shouldHideChrome = pathname === "/chatbot";

  useEffect(() => {
    Animated.timing(fabMenuAnim, {
      toValue: isFabMenuOpen ? 1 : 0,
      duration: isFabMenuOpen ? 240 : 180,
      easing: isFabMenuOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fabMenuAnim, isFabMenuOpen]);

  const closeFabMenu = () => setIsFabMenuOpen(false);

  const onOpenChatbot = () => {
    closeFabMenu();
    router.push("/chatbot");
  };

  const onOpenPlantDictionary = () => {
    closeFabMenu();
    router.push("/plant-dictionary");
  };

  const onAddPlant = () => {
    closeFabMenu();
    router.push("/plants/new");
  };

  const fabBaseBottom = insets.bottom + 90;
  const speedDialBaseBottom = fabBaseBottom + 52;

  const speedDialActions: ReadonlyArray<SpeedDialAction> = [
    {
      key: "chatbot",
      label: "Chatbot",
      icon: "chatbubbles",
      color: "#295D3B",
      borderColor: "#1E4A2D",
      onPress: onOpenChatbot,
    },
    {
      key: "dictionary",
      label: "Plant Dictionary",
      icon: "book",
      color: "#3E556A",
      borderColor: "#2D4154",
      onPress: onOpenPlantDictionary,
    },
    {
      key: "addPlant",
      label: "Add Plant",
      icon: "leaf",
      color: "#5A6E2A",
      borderColor: "#4A5C21",
      onPress: onAddPlant,
    },
  ];

  const getSpeedDialItemStyle = (index: number) => {
    const translateDistance = (index + 1) * 66;
    const start = index * 0.12;
    const end = start + 0.38;

    return {
      opacity: fabMenuAnim.interpolate({
        inputRange: [0, start, end, 1],
        outputRange: [0, 0, 1, 1],
        extrapolate: "clamp",
      }),
      transform: [
        {
          translateY: fabMenuAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [14, -translateDistance],
          }),
        },
        {
          scale: fabMenuAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.84, 1],
          }),
        },
        {
          translateX: fabMenuAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [8, 0],
          }),
        },
      ],
    };
  };

  const mainFabRotate = fabMenuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const mainFabScale = fabMenuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  const mainFabAuraScale = fabMenuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const mainFabAuraOpacity = fabMenuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.34],
  });

  useEffect(() => {
    if (shouldHideChrome && isFabMenuOpen) {
      setIsFabMenuOpen(false);
    }
  }, [isFabMenuOpen, shouldHideChrome]);

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

  if (shouldHideChrome) {
    return (
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
          }}
          tabBar={() => null}
        >
          {TABS.map((tab) => (
            <Tabs.Screen
              key={tab.name}
              name={tab.name}
              options={{ title: tab.label }}
            />
          ))}
        </Tabs>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={() => null}
      >
        {TABS.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{ title: tab.label }}
          />
        ))}
      </Tabs>
    </View>
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
  chatFabWrap: {
    position: "absolute",
    right: 24,
    zIndex: 30,
  },
  chatFabAura: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#86C79A",
  },
  chatFab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: P.g1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#2A5F3A",
    shadowColor: P.i0,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 12,
    overflow: "hidden",
  },
  fabBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12, 18, 14, 0.08)",
    zIndex: 19,
  },
  speedDialLayer: {
    position: "absolute",
    right: 24,
    zIndex: 35,
  },
  speedDialRow: {
    position: "absolute",
    right: 0,
  },
  speedDialAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  speedDialActionPressed: {
    opacity: 0.82,
  },
  speedDialLabelPill: {
    maxWidth: 176,
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
    justifyContent: "center",
    backgroundColor: "#F7FAF6",
    borderWidth: 1,
    borderColor: "#D6E4DA",
    shadowColor: P.i0,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  speedDialLabelText: {
    color: P.g0,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.05,
  },
  speedDialFab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: P.g1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.4,
    borderColor: "#2A5F3A",
    shadowColor: P.i0,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 9,
  },
});
