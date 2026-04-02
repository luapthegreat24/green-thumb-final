import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatWateringLabel, getDaysUntilWatering } from "@/features/garden/application/plant-utils";
import type { Plant } from "@/features/garden/domain/plant";
import { P, SP, TY } from "@/constants/herbarium-theme";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=600&q=60";

type PlantCardProps = {
  plant: Plant;
  onPress: () => void;
};

export function PlantCard({ plant, onPress }: PlantCardProps) {
  const days = getDaysUntilWatering(plant);
  const wateringLabel = formatWateringLabel(plant);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <Image source={{ uri: plant.imageUri ?? FALLBACK_IMAGE }} style={styles.image} contentFit="cover" />
      <View style={styles.content}>
        <Text style={styles.name}>{plant.name}</Text>
        <Text style={styles.species}>{plant.species}</Text>
        <View style={styles.metaRow}>
          <Ionicons
            name={days <= 0 ? "water" : "water-outline"}
            size={14}
            color={days <= 0 ? P.rust : P.g1}
          />
          <Text style={[styles.metaText, days <= 0 && styles.urgentText]}>{wateringLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: P.p0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.sketch,
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.9,
  },
  image: {
    width: "100%",
    height: 138,
    backgroundColor: P.p2,
  },
  content: {
    padding: SP.md,
    gap: 6,
  },
  name: {
    ...TY.body,
    fontSize: 18,
    fontWeight: "800",
    color: P.i1,
  },
  species: {
    ...TY.body,
    fontSize: 13,
    color: P.i3,
  },
  metaRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    ...TY.body,
    color: P.g1,
    fontWeight: "700",
  },
  urgentText: {
    color: P.rust,
  },
});
