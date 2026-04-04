import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter, useSegments } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { P } from "@/constants/herbarium-theme";

type TabItem = {
  key: "index" | "garden" | "journal" | "profile";
  label: string;
  icon: string;
  iconOn: string;
  route: "/" | "/garden" | "/journal" | "/profile";
};

type SpeedDialAction = {
  key: "chatbot" | "dictionary" | "addPlant";
  label: string;
  icon: "chatbubbles" | "book" | "leaf";
  color: string;
  borderColor: string;
  onPress: () => void;
};

const TABS: ReadonlyArray<TabItem> = [
  {
    key: "index",
    label: "Garden",
    icon: "leaf-outline",
    iconOn: "leaf",
    route: "/",
  },
  {
    key: "garden",
    label: "My Garden",
    icon: "grid-outline",
    iconOn: "grid",
    route: "/garden",
  },
  {
    key: "journal",
    label: "Journal",
    icon: "book-outline",
    iconOn: "book",
    route: "/journal",
  },
  {
    key: "profile",
    label: "Profile",
    icon: "person-outline",
    iconOn: "person",
    route: "/profile",
  },
];

function isTabRoute(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/garden" ||
    pathname === "/journal" ||
    pathname === "/profile"
  );
}

export function GlobalAppChrome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const pathname = usePathname();

  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const fabMenuAnim = useRef(new Animated.Value(0)).current;

  const isAuthScreen = segments[0] === "(auth)";
  const shouldShow = !isAuthScreen;

  useEffect(() => {
    if (!shouldShow && isFabMenuOpen) {
      setIsFabMenuOpen(false);
    }
  }, [isFabMenuOpen, shouldShow]);

  useEffect(() => {
    Animated.timing(fabMenuAnim, {
      toValue: isFabMenuOpen ? 1 : 0,
      duration: isFabMenuOpen ? 240 : 180,
      easing: isFabMenuOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fabMenuAnim, isFabMenuOpen]);

  const closeFabMenu = () => setIsFabMenuOpen(false);

  const speedDialActions: ReadonlyArray<SpeedDialAction> = useMemo(
    () => [
      {
        key: "chatbot",
        label: "Chatbot",
        icon: "chatbubbles",
        color: "#295D3B",
        borderColor: "#1E4A2D",
        onPress: () => {
          closeFabMenu();
          router.push("/chatbot");
        },
      },
      {
        key: "dictionary",
        label: "Plant Dictionary",
        icon: "book",
        color: "#3E556A",
        borderColor: "#2D4154",
        onPress: () => {
          closeFabMenu();
          router.push("/plant-dictionary");
        },
      },
      {
        key: "addPlant",
        label: "Add Plant",
        icon: "leaf",
        color: "#5A6E2A",
        borderColor: "#4A5C21",
        onPress: () => {
          closeFabMenu();
          router.push("/plants/new");
        },
      },
    ],
    [router],
  );

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

  const fabBaseBottom = insets.bottom + 90;
  const speedDialBaseBottom = fabBaseBottom + 52;

  if (!shouldShow) return null;

  return (
    <>
      <View style={[st.barOuter, { bottom: insets.bottom + 10 }]}> 
        <View style={st.tabRow}>
          {TABS.map((tab) => {
            const focused = isTabRoute(pathname) && pathname === tab.route;

            return (
              <Pressable
                key={tab.key}
                onPress={() => router.push(tab.route)}
                style={({ pressed }) => [
                  st.tabItem,
                  focused && st.tabItemActive,
                  pressed && st.tabItemPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
              >
                <View style={st.iconWrap}>
                  <Ionicons
                    name={(focused ? tab.iconOn : tab.icon) as any}
                    size={focused ? 23 : 21}
                    color={focused ? P.g0 : P.i3}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isFabMenuOpen && (
        <Pressable
          style={st.fabBackdrop}
          onPress={closeFabMenu}
          accessibilityRole="button"
          accessibilityLabel="Close action menu"
        />
      )}

      <View
        style={[st.speedDialLayer, { bottom: speedDialBaseBottom }]}
        pointerEvents={isFabMenuOpen ? "auto" : "none"}
      >
        {speedDialActions.map((action, index) => (
          <Animated.View
            key={action.key}
            style={[st.speedDialRow, getSpeedDialItemStyle(index)]}
          >
            <Pressable
              onPress={action.onPress}
              style={({ pressed }) => [
                st.speedDialAction,
                pressed && st.speedDialActionPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <View style={st.speedDialLabelPill}>
                <Text style={st.speedDialLabelText}>{action.label}</Text>
              </View>
              <View
                style={[
                  st.speedDialFab,
                  {
                    backgroundColor: action.color,
                    borderColor: action.borderColor,
                  },
                ]}
              >
                <Ionicons name={action.icon} size={18} color="#FFFFFF" />
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      <Animated.View
        style={[
          st.chatFabWrap,
          { bottom: fabBaseBottom, transform: [{ scale: mainFabScale }] },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            st.chatFabAura,
            {
              opacity: mainFabAuraOpacity,
              transform: [{ scale: mainFabAuraScale }],
            },
          ]}
        />
        <Pressable
          onPress={() => setIsFabMenuOpen((current) => !current)}
          style={({ pressed }) => [st.chatFab, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel={
            isFabMenuOpen ? "Close quick actions" : "Open quick actions"
          }
        >
          <Animated.View style={{ transform: [{ rotate: mainFabRotate }] }}>
            <Ionicons name="add" size={23} color="#F5FFF8" />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </>
  );
}

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
    zIndex: 20,
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
