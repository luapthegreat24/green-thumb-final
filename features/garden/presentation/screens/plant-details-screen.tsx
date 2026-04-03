import { useFadeUp } from "@/hooks/use-screen-animations";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppListItem } from "@/components/ui/app-list-item";
import { AppText } from "@/components/ui/app-text";
import { P, SP, TY } from "@/constants/herbarium-theme";
import { formatWateringLabel } from "@/features/garden/application/plant-utils";
import type { Plant, PlantCareAction } from "@/features/garden/domain/plant";
import { HistoryLogItem } from "@/features/garden/presentation/components/history-log-item";
import { useGarden } from "../../../../providers/garden-provider";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=600&q=60";

const ACTIONS: Array<{ action: PlantCareAction; label: string; icon: string }> =
  [
    { action: "watered", label: "Watered", icon: "water-outline" },
    { action: "fertilized", label: "Fertilized", icon: "flask-outline" },
    { action: "pruned", label: "Pruned", icon: "cut-outline" },
    { action: "note", label: "Note", icon: "create-outline" },
  ];

export function PlantDetailsScreen({ plant }: { plant: Plant }) {
  const { addHistoryLog, schedules, deletePlant } = useGarden();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState("");
  const [busyAction, setBusyAction] = useState<PlantCareAction | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const plantSchedules = schedules
    .filter((item) => item.plantId === plant.id && item.status === "pending")
    .sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt));

  const onDelete = () => {
    Alert.alert("Delete plant", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setBusyDelete(true);
          try {
            await deletePlant(plant.id);
            router.replace("/(tabs)/explore" as never);
          } finally {
            setBusyDelete(false);
          }
        },
      },
    ]);
  };

  const logAction = async (action: PlantCareAction) => {
    setBusyAction(action);
    try {
      await addHistoryLog(plant.id, action, note || undefined);
      setNote("");
    } finally {
      setBusyAction(null);
    }
  };

  const onBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)" as never);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: P.p1 }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + SP.md,
          paddingBottom: insets.bottom + SP.xxxl + 64,
        },
      ]}
    >
      <Animated.View style={useFadeUp(0)}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={16} color={P.i1} />
          <AppText variant="bodyStrong" style={styles.backText}>
            Back
          </AppText>
        </Pressable>

        <Image
          source={{ uri: plant.imageUri ?? FALLBACK_IMAGE }}
          style={styles.heroImage}
          contentFit="cover"
        />

        <AppCard>
          <AppText variant="display" style={styles.name}>
            {plant.name}
          </AppText>
          <AppText style={styles.species}>{plant.species}</AppText>

          <View style={styles.metaGrid}>
            <Meta label="Date planted" value={plant.datePlanted} />
            <Meta
              label="Water every"
              value={`${plant.wateringFrequencyDays} days`}
            />
            <Meta label="Next watering" value={formatWateringLabel(plant)} />
            <Meta
              label="Last watered"
              value={
                plant.lastWateredAt
                  ? new Date(plant.lastWateredAt).toLocaleDateString()
                  : "Not yet"
              }
            />
          </View>

          {plant.notes ? (
            <View style={styles.notesWrap}>
              <AppText variant="mono" style={styles.sectionLabel}>
                Notes
              </AppText>
              <AppText style={styles.notes}>{plant.notes}</AppText>
            </View>
          ) : null}

          <AppButton
            onPress={() => router.push(`/plants/${plant.id}/edit` as never)}
            variant="primary"
            label="Edit plant"
            leftIcon={<Ionicons name="create-outline" size={16} color={P.p0} />}
          />

          <AppButton
            onPress={onDelete}
            containerStyle={[busyDelete && { opacity: 0.7 }]}
            disabled={busyDelete}
            variant="danger"
            label={busyDelete ? "Deleting..." : "Delete plant"}
            leftIcon={
              <Ionicons name="trash-outline" size={16} color={P.rust} />
            }
          />
        </AppCard>

        <AppCard>
          <AppText variant="title" style={styles.sectionTitle}>
            Care Instructions
          </AppText>
          <View style={styles.metaGrid}>
            <Meta
              label="Watering frequency"
              value={`Every ${plant.wateringFrequencyDays} days`}
            />
            <Meta
              label="General care"
              value={plant.notes?.trim() || "No care notes added yet."}
            />
          </View>
        </AppCard>

        <AppCard>
          <AppText variant="title" style={styles.sectionTitle}>
            Upcoming Schedule
          </AppText>
          <View style={{ gap: SP.sm }}>
            {plantSchedules.length === 0 ? (
              <AppText style={styles.emptyHistory}>
                No scheduled tasks yet.
              </AppText>
            ) : (
              plantSchedules.map((item) => (
                <AppListItem
                  key={item.id}
                  title={
                    item.taskType.charAt(0).toUpperCase() +
                    item.taskType.slice(1)
                  }
                  subtitle={new Date(item.dueAt).toLocaleString()}
                />
              ))
            )}
          </View>
        </AppCard>

        <AppCard>
          <AppText variant="title" style={styles.sectionTitle}>
            Care History
          </AppText>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note for next log"
            placeholderTextColor={P.i3}
            style={styles.input}
          />

          <View style={styles.actionRow}>
            {ACTIONS.map((item) => (
              <Pressable
                key={item.action}
                onPress={() => logAction(item.action)}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && { opacity: 0.9 },
                ]}
                disabled={busyAction !== null}
              >
                <Ionicons name={item.icon as any} size={14} color={P.g1} />
                <Text style={styles.actionText}>
                  {busyAction === item.action ? "Saving..." : item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ gap: SP.sm }}>
            {plant.history.length === 0 ? (
              <AppText style={styles.emptyHistory}>
                No history logs yet.
              </AppText>
            ) : (
              plant.history.map((entry) => (
                <HistoryLogItem key={entry.id} log={entry} />
              ))
            )}
          </View>
        </AppCard>
      </Animated.View>
    </ScrollView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SP.lg,
    gap: SP.lg,
  },
  backButton: {
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
  },
  backText: {
    ...TY.body,
    color: P.i1,
    fontWeight: "700",
  },
  heroImage: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    backgroundColor: P.p2,
  },
  name: {
    ...TY.display,
    fontSize: 32,
  },
  species: {
    ...TY.body,
    color: P.i3,
    marginTop: -6,
  },
  metaGrid: {
    gap: SP.sm,
  },
  metaItem: {
    padding: SP.sm,
    borderWidth: 1,
    borderColor: P.hair,
    borderRadius: 12,
    backgroundColor: P.p1,
    gap: 4,
  },
  metaLabel: {
    ...TY.monoLabel,
    fontSize: 9,
  },
  metaValue: {
    ...TY.body,
    color: P.i1,
    fontWeight: "700",
  },
  notesWrap: {
    gap: 6,
  },
  sectionLabel: {
    ...TY.monoLabel,
    fontSize: 9,
  },
  notes: {
    ...TY.body,
    color: P.i2,
  },
  sectionTitle: {
    ...TY.display,
    fontSize: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: P.sketch,
    borderRadius: 12,
    backgroundColor: P.p1,
    paddingHorizontal: SP.md,
    paddingVertical: 11,
    color: P.i1,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SP.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: P.gBg,
    borderWidth: 1,
    borderColor: "rgba(43,125,70,0.22)",
    borderRadius: 999,
    paddingHorizontal: SP.md,
    paddingVertical: 9,
  },
  actionText: {
    ...TY.body,
    color: P.g1,
    fontWeight: "700",
  },
  emptyHistory: {
    ...TY.body,
    color: P.i3,
  },
});
