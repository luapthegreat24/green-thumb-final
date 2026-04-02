import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { P, SP, TY } from "@/constants/herbarium-theme";
import type { Plant } from "@/features/garden/domain/plant";
import { PlantForm } from "@/features/garden/presentation/components/plant-form";
import { useGarden } from "../../../../providers/garden-provider";

type PlantEditorScreenProps = {
  mode: "create" | "edit";
  plant?: Plant;
};

export function PlantEditorScreen({ mode, plant }: PlantEditorScreenProps) {
  const insets = useSafeAreaInsets();
  const { addPlant, updatePlant, deletePlant } = useGarden();
  const [busy, setBusy] = useState(false);

  const onBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)" as never);
  };

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

    Alert.alert("Delete plant", "This action cannot be undone.", [
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
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: P.p1 }}>
      <View
        style={{
          paddingHorizontal: SP.lg,
          paddingTop: insets.top + SP.md,
          gap: SP.sm,
        }}
      >
        <Pressable
          onPress={onBack}
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: P.p0,
            borderWidth: 1,
            borderColor: P.hair,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 7,
          }}
        >
          <Ionicons name="arrow-back" size={16} color={P.i1} />
          <Text style={{ ...TY.body, color: P.i1, fontWeight: "700" }}>
            Back
          </Text>
        </Pressable>
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
