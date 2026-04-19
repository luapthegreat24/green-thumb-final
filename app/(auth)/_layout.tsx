import { useAuth } from "@/contexts/auth";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { isLoggedIn, loading } = useAuth();

  if (!loading && isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack initialRouteName="index">
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          animation: "none",
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          animation: "none",
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          headerTitle: "Create Account",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
