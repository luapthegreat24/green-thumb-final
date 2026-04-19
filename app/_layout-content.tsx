import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function RootLayoutContent() {
  const { isLoggedIn, loading } = useAuth();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? Colors.dark : Colors.light;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen
        name="chatbot"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />

      {isLoggedIn ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}
