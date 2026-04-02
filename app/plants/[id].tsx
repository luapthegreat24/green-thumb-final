import { useLocalSearchParams, router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { PlantDetailsScreen } from "@/features/garden/presentation/screens/plant-details-screen";
import { useGarden } from "@/providers/garden-provider";
import { P, TY } from "@/constants/herbarium-theme";

export default function PlantDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlantById } = useGarden();

  const plant = getPlantById(id);

  if (!plant) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: P.p1, padding: 24, gap: 10 }}>
        <Text style={{ ...TY.display, fontSize: 28 }}>Plant not found</Text>
        <Text style={{ ...TY.body, color: P.i3, textAlign: "center" }}>
          This plant may have been deleted.
        </Text>
        <Pressable onPress={() => router.replace("/(tabs)" as never)} style={{ paddingVertical: 10 }}>
          <Text style={{ ...TY.body, color: P.g1, fontWeight: "800" }}>Back to Garden</Text>
        </Pressable>
      </View>
    );
  }

  return <PlantDetailsScreen plant={plant} />;
}
