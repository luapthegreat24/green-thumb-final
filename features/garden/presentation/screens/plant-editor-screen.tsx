import { useFadeUp } from "@/hooks/use-screen-animations";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Animated, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/components/ui/app-header";
import { AppText } from "@/components/ui/app-text";
import { DS } from "@/constants/app-design-system";
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
    <View style={{ flex: 1, backgroundColor: DS.colors.bg }}>
      <Animated.View style={useFadeUp(0)}>
        <View
          style={{
            paddingHorizontal: DS.spacing.screenX,
            paddingTop: insets.top + DS.spacing.md,
            paddingBottom: DS.spacing.lg,
            gap: DS.spacing.md,
            backgroundColor: DS.colors.bg,
          }}
        >
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              {
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: DS.spacing.sm,
                backgroundColor: DS.colors.surface,
                borderWidth: 1,
                borderColor: DS.colors.borderSoft,
                borderRadius: DS.radius.pill,
                paddingHorizontal: DS.spacing.md,
                paddingVertical: DS.spacing.sm,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={DS.colors.primary} />
            <AppText style={{ color: DS.colors.primary, fontWeight: "700" }}>
              Back
            </AppText>
          </Pressable>
          <AppHeader
            eyebrow={mode === "create" ? "Add Plant" : "Edit Plant"}
            title={mode === "create" ? "Introduce your plant" : "Update plant"}
          />
        </View>
      </Animated.View>

      <Animated.View style={[useFadeUp(80), { flex: 1 }]}>
        <PlantForm
          initialPlant={plant}
          submitLabel={mode === "create" ? "Add Plant" : "Save Changes"}
          busy={busy}
          onSubmit={submit}
          onDelete={mode === "edit" ? onDelete : undefined}
        />
      </Animated.View>
    </View>
  );
}
