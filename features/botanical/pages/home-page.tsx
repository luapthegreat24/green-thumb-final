import { BotanicalCard, BotanicalHeading, BotanicalScreen } from "@/features/botanical/ui";
import React from "react";
import { Text, View } from "react-native";

export function HomePage() {
  return (
    <BotanicalScreen>
      <BotanicalHeading
        kicker="Dashboard"
        title="Home"
        subtitle="A quick overview of your active plants, care tasks, and recent additions."
      />

      <BotanicalCard>
        <Text style={{ fontWeight: "700" }}>Today</Text>
        <Text>3 plants need attention</Text>
        <Text>1 watering task due</Text>
      </BotanicalCard>

      <BotanicalCard>
        <Text style={{ fontWeight: "700" }}>Collection</Text>
        <View style={{ gap: 6 }}>
          <Text>My Garden: 12 plants</Text>
          <Text>Plant Search: discover new species</Text>
          <Text>Profile: update preferences</Text>
        </View>
      </BotanicalCard>
    </BotanicalScreen>
  );
}
