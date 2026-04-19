import { BotanicalButton, BotanicalCard, BotanicalHeading, BotanicalScreen } from "@/features/botanical/ui";
import { useRouter } from "expo-router";
import React from "react";
import { Text } from "react-native";

export function WelcomePage() {
  const router = useRouter();

  return (
    <BotanicalScreen>
      <BotanicalHeading
        kicker="Green Thumb"
        title="Welcome to Your Herbarium"
        subtitle="A calm, paper-inspired workspace for tracking plants, adding specimens, and keeping your garden healthy."
      />

      <BotanicalCard>
        <Text>
          Build your collection with a consistent botanical journal style across every page.
        </Text>
      </BotanicalCard>

      <BotanicalButton label="Sign In" onPress={() => router.push("/(auth)/login")} />
      <BotanicalButton label="Create Account" tone="secondary" onPress={() => router.push("/(auth)/signup")} />
    </BotanicalScreen>
  );
}
