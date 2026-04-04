import { Redirect, router } from "expo-router";
import React, { useMemo, useState } from "react";
import { View } from "react-native";

import {
  AuthButton,
  AuthField,
  AuthLink,
  AuthNotice,
  AuthShell,
} from "@/components/auth/auth-shell";
import { useAuth } from "../../providers/auth-provider";

function validateEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email.trim());
}

export default function SignupScreen() {
  const { user, signup, loading, error, clearError } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const formError = error ?? localError;

  const canSubmit = useMemo(() => {
    return (
      displayName.trim().length > 0 &&
      validateEmail(email) &&
      password.trim().length >= 8
    );
  }, [displayName, email, password]);

  if (user) {
    return <Redirect href="/welcome" />;
  }

  const onSubmit = async () => {
    clearError();
    setLocalError(null);

    // ... validation

    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setLocalError("Name, email, and password are required.");
      return;
    }

    if (!validateEmail(email)) {
      setLocalError("Enter a valid email address.");
      return;
    }

    if (password.trim().length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }

    try {
      await signup(displayName, email, password);
      router.replace("/welcome");
    } catch {
      // handled by context error state
    }
  };

  return (
    <AuthShell
      eyebrow="Green Thumb"
      title="Create your account"
      subtitle="Set up a private plant profile and start syncing your collection."
      footer={
        <View>
          <AuthLink
            text="Already have an account?"
            action="Sign in"
            onPress={() => router.push("/login" as never)}
          />
        </View>
      }
    >
      <AuthNotice message={formError} />
      <AuthField
        icon="person-outline"
        label="Name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Your display name"
        autoComplete="name"
      />
      <AuthField
        icon="mail-outline"
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
      />
      <AuthField
        icon="lock-closed-outline"
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Minimum 8 characters"
        secureTextEntry
        autoComplete="new-password"
      />
      <AuthButton
        label="Create account"
        onPress={onSubmit}
        loading={loading}
        disabled={!canSubmit}
      />
    </AuthShell>
  );
}
