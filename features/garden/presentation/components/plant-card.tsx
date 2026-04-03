import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DS } from "@/constants/app-design-system";
import { SP, TY } from "@/constants/herbarium-theme";
import {
  formatWateringLabel,
  getDaysUntilWatering,
  getPlantStatus,
} from "@/features/garden/application/plant-utils";
import type { Plant } from "@/features/garden/domain/plant";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=600&q=60";

type PlantCardProps = {
  plant: Plant;
  onPress: () => void;
  mode?: "list" | "grid";
};

export function PlantCard({ plant, onPress, mode = "list" }: PlantCardProps) {
  const days = getDaysUntilWatering(plant);
  const wateringLabel = formatWateringLabel(plant);
  const status = getPlantStatus(plant);
  const isNeedsWater = status === "Needs Water";
  const isAtRisk = status === "At Risk";
  const isHealthy = status === "Healthy";
  const isGrid = mode === "grid";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isGrid && styles.cardGrid,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: plant.imageUri ?? FALLBACK_IMAGE }}
          style={[styles.image, isGrid && styles.imageGrid]}
          contentFit="cover"
        />
        <View
          style={[
            styles.statusBadge,
            isNeedsWater && styles.statusBadgeUrgent,
            isAtRisk && styles.statusBadgeWarning,
            isHealthy && styles.statusBadgeHealthy,
          ]}
        >
          <Ionicons
            name={
              isNeedsWater
                ? "water"
                : isAtRisk
                  ? "alert-circle"
                  : "checkmark-circle"
            }
            size={12}
            color={DS.colors.surface}
          />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.textStack}>
          <Text style={styles.name}>{plant.name}</Text>
          <Text style={styles.species}>{plant.species}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.wateringInfo}>
            <Ionicons
              name={days <= 0 ? "water" : "water-outline"}
              size={13}
              color={days <= 0 ? DS.colors.danger : DS.colors.textMuted}
            />
            <Text
              style={[styles.wateringLabel, days <= 0 && styles.urgentText]}
            >
              {wateringLabel}
            </Text>
          </View>
          <View
            style={[
              styles.statusDot,
              isNeedsWater && styles.statusDotUrgent,
              isAtRisk && styles.statusDotWarning,
            ]}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DS.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS.colors.borderSoft,
    overflow: "hidden",
    ...DS.shadow.cardSoft,
  },
  cardGrid: {
    flex: 1,
  },
  cardPressed: {
    opacity: 0.82,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 140,
    backgroundColor: DS.colors.bg,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: DS.colors.bg,
  },
  imageGrid: {
    height: 160,
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DS.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: DS.colors.surface,
    ...DS.shadow.cardSoft,
  },
  statusBadgeHealthy: {
    backgroundColor: DS.colors.primary,
  },
  statusBadgeUrgent: {
    backgroundColor: DS.colors.danger,
  },
  statusBadgeWarning: {
    backgroundColor: DS.colors.amber,
  },
  content: {
    padding: SP.md,
    gap: 10,
  },
  textStack: {
    gap: 2,
  },
  name: {
    ...TY.body,
    fontSize: 16,
    fontWeight: "600",
    color: DS.colors.text,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  species: {
    ...TY.body,
    fontSize: 12,
    color: DS.colors.textFaint,
    fontWeight: "400",
    lineHeight: 15,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderSoft,
  },
  wateringInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  wateringLabel: {
    ...TY.body,
    fontSize: 10,
    color: DS.colors.textMuted,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  urgentText: {
    color: DS.colors.danger,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DS.colors.primary,
    opacity: 0.5,
  },
  statusDotUrgent: {
    backgroundColor: DS.colors.danger,
    opacity: 1,
  },
  statusDotWarning: {
    backgroundColor: DS.colors.amber,
    opacity: 1,
  },
});
