import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const TABS_CONFIG = [
  { name: "index", label: "Home", icon: "🏠" },
  { name: "explore", label: "Schedule", icon: "📅" },
  { name: "tabs", label: "Garden", icon: "🌿" },
  { name: "seeds", label: "Seeds", icon: "🌱" },
  { name: "plants", label: "Plants", icon: "🔍" },
  { name: "profile", label: "Profile", icon: "👤" },
];

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tabConfig = TABS_CONFIG.find((t) => t.name === route.name);

          const onPress = () => {
            Haptics.selectionAsync();
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            Haptics.selectionAsync();
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tabButton,
                isFocused && styles.activeTab,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={tabConfig?.label}
            >
              <View
                style={[
                  styles.iconContainer,
                  isFocused && styles.activeIconContainer,
                ]}
              >
                <Text style={styles.icon}>{tabConfig?.icon}</Text>
              </View>
              {isFocused && (
                <Text style={styles.label}>{tabConfig?.label}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    backgroundColor: "transparent",
    zIndex: 1000,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 24,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 56,
    borderRadius: 16,
    maxWidth: "100%",
  },
  activeTab: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  pressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  activeIconContainer: {
    backgroundColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#14532D",
    marginTop: 4,
    textAlign: "center",
  },
});
