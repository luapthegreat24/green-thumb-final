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
import { AppText } from "@/components/ui/app-text";
import { DS } from "@/constants/app-design-system";
import { useAuth } from "../../providers/auth-provider";

function validateEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email.trim());
}

export default function LoginScreen() {
  const { user, login, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const formError = error ?? localError;

  const canSubmit = useMemo(() => {
    return validateEmail(email) && password.trim().length >= 8;
  }, [email, password]);

  if (user) {
    return <Redirect href="/welcome" />;
  }

  const onSubmit = async () => {
    clearError();
    setLocalError(null);

    if (!email.trim() || !password.trim()) {
      setLocalError("Email and password are required.");
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
      await login(email, password);
      router.replace("/welcome");
    } catch {
      // handled by context error state
    }
  };

  return (
    <AuthShell
      eyebrow="Green Thumb"
      title="Welcome back"
      subtitle="Sign in to your plant journal and continue where you left off."
      footer={
        <View style={{ alignItems: "center", gap: DS.spacing.sm }}>
          <AppText
            variant="caption"
            style={{ color: DS.colors.textFaint, textAlign: "center" }}
          >
            Secure session persistence is enabled through Firebase Auth.
          </AppText>
          <AuthLink
            text="Need an account?"
            action="Create one"
            onPress={() => router.push("/signup" as never)}
          />
        </View>
      }
    >
      <AuthNotice message={formError} />
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
        autoComplete="password"
      />
      <AuthButton
        label="Sign in"
        onPress={onSubmit}
        loading={loading}
        disabled={!canSubmit}
      />
    </AuthShell>
  );
}
