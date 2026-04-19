import { auth } from "@/firebase.config";
import { BotanicalButton, BotanicalCard, BotanicalHeading, BotanicalInput, BotanicalScreen } from "@/features/botanical/ui";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { Alert, Text } from "react-native";

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    Haptics.selectionAsync();
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Login Error", error?.message ?? "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BotanicalScreen>
      <BotanicalHeading
        kicker="Field Access"
        title="Sign In"
        subtitle="Continue your journal and keep plant care records in one place."
      />

      <BotanicalCard>
        <BotanicalInput
          label="Email"
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <BotanicalInput
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </BotanicalCard>

      <BotanicalButton label={loading ? "Signing In..." : "Sign In"} onPress={handleLogin} disabled={loading} />
      <BotanicalButton label="Need an account? Sign Up" tone="secondary" onPress={() => router.push("/(auth)/signup")} />
      <Text>Use your Green Thumb account credentials to continue.</Text>
    </BotanicalScreen>
  );
}
