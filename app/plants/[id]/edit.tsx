import { useLocalSearchParams, router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { PlantEditorScreen } from "@/features/garden/presentation/screens/plant-editor-screen";
import { useGarden } from "@/providers/garden-provider";
import { P, TY } from "@/constants/herbarium-theme";

export default function EditPlantRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlantById } = useGarden();

  const plant = getPlantById(id);

  if (!plant) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: P.p1, padding: 24, gap: 10 }}>
        <Text style={{ ...TY.display, fontSize: 28 }}>Plant not found</Text>
        <Pressable onPress={() => router.replace("/(tabs)" as never)} style={{ paddingVertical: 10 }}>
          <Text style={{ ...TY.body, color: P.g1, fontWeight: "800" }}>Back to Garden</Text>
        </Pressable>
      </View>
    );
  }

  return <PlantEditorScreen mode="edit" plant={plant} />;
}
