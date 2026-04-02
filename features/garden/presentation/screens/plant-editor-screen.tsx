import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PlantForm } from "@/features/garden/presentation/components/plant-form";
import { useGarden } from "../../../../providers/garden-provider";
import type { Plant } from "@/features/garden/domain/plant";
import { P, SP, TY } from "@/constants/herbarium-theme";

type PlantEditorScreenProps = {
  mode: "create" | "edit";
  plant?: Plant;
};

export function PlantEditorScreen({ mode, plant }: PlantEditorScreenProps) {
  const insets = useSafeAreaInsets();
  const { addPlant, updatePlant, deletePlant } = useGarden();
  const [busy, setBusy] = useState(false);

  const submit = async (input: Parameters<typeof addPlant>[0]) => {
    setBusy(true);
    try {
      if (mode === "create") {
        const plantId = await addPlant(input);
        router.replace(`/plants/${plantId}` as never);
      } else if (plant) {
        await updatePlant(plant.id, input);
        router.replace(`/plants/${plant.id}` as never);
      }
    } finally {
      setBusy(false);
    }
  };

  const onDelete = () => {
    if (!plant) return;

    Alert.alert(
      "Delete plant",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await deletePlant(plant.id);
              router.replace("/(tabs)" as never);
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: P.p1 }}>
      <View style={{ paddingHorizontal: SP.lg, paddingTop: insets.top + SP.md, gap: SP.sm }}>
        <Text style={{ ...TY.monoLabel, fontSize: 10, color: P.g1 }}>
          {mode === "create" ? "Add Plant" : "Edit Plant"}
        </Text>
        <Text style={{ ...TY.display, fontSize: 32, color: P.i1 }}>
          {mode === "create" ? "New plant" : "Update details"}
        </Text>
      </View>
      <PlantForm
        initialPlant={plant}
        submitLabel={mode === "create" ? "Add Plant" : "Save Changes"}
        busy={busy}
        onSubmit={submit}
        onDelete={mode === "edit" ? onDelete : undefined}
      />
    </View>
  );
}
