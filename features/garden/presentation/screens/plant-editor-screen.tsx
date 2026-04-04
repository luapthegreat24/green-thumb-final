import { useFadeUp } from "@/hooks/use-screen-animations";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Plant } from "@/features/garden/domain/plant";
import { PlantForm } from "@/features/garden/presentation/components/plant-form";
import { useGarden } from "../../../../providers/garden-provider";

type PlantEditorScreenProps = {
  mode: "create" | "edit";
  plant?: Plant;
};

const C = {
  paper: "#FAF9F7",
  text: "#0F1410",
  accentGreen: "#3A7C52",
};

export function PlantEditorScreen({ mode, plant }: PlantEditorScreenProps) {
  const { addPlant, updatePlant } = useGarden();
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

  return (
    <SafeAreaView style={S.screen}>
      <Animated.View style={[S.header, useFadeUp(0)]}>
        <Pressable onPress={onBack} style={S.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.accentGreen} />
        </Pressable>
        <Text style={S.headerTitle}>
          {mode === "create" ? "Add Plant" : "Edit Plant"}
        </Text>
        <View style={S.backBtn} />
      </Animated.View>

      <Animated.View style={[useFadeUp(80), { flex: 1 }]}>
        <PlantForm
          initialPlant={plant}
          submitLabel={mode === "create" ? "Add Plant" : "Save Changes"}
          busy={busy}
          onSubmit={submit}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.paper,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.paper,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontFamily: "SpaceMono",
    fontSize: 17,
    color: C.text,
    fontWeight: "600",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
