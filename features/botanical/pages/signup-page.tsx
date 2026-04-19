import { auth, db } from "@/firebase.config";
import { BotanicalButton, BotanicalCard, BotanicalHeading, BotanicalInput, BotanicalScreen } from "@/features/botanical/ui";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Timestamp, doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Alert } from "react-native";

export function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    Haptics.selectionAsync();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);

      await updateProfile(userCredential.user, {
        displayName: name.trim(),
      });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: name.trim(),
        email: email.trim(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Sign Up Error", error?.message ?? "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BotanicalScreen>
      <BotanicalHeading
        kicker="New Specimen Keeper"
        title="Create Account"
        subtitle="Start your herbarium with a profile tailored to your plant care workflow."
      />

      <BotanicalCard>
        <BotanicalInput label="Full Name" placeholder="Jane Planter" value={name} onChangeText={setName} autoCapitalize="words" />
        <BotanicalInput
          label="Email"
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <BotanicalInput label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />
        <BotanicalInput
          label="Confirm Password"
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </BotanicalCard>

      <BotanicalButton label={loading ? "Creating Account..." : "Create Account"} onPress={handleSignup} disabled={loading} />
      <BotanicalButton label="Already have an account? Sign In" tone="secondary" onPress={() => router.push("/(auth)/login")} />
    </BotanicalScreen>
  );
}
