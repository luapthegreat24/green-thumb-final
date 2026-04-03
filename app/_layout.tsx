import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/providers/auth-provider";
import { CareTasksProvider } from "@/providers/care-tasks-provider";
import { GardenProvider } from "@/providers/garden-provider";
import { WeatherProvider } from "@/providers/weather-provider";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <WeatherProvider>
        <GardenProvider>
          <CareTasksProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="plants/new" />
                <Stack.Screen name="plants/[id]" />
                <Stack.Screen name="plants/[id]/edit" />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: "modal", title: "Modal" }}
                />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </CareTasksProvider>
        </GardenProvider>
      </WeatherProvider>
    </AuthProvider>
  );
}
