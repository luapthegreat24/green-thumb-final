import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatWateringLabel } from "@/features/garden/application/plant-utils";
import { HistoryLogItem } from "@/features/garden/presentation/components/history-log-item";
import type { Plant, PlantCareAction } from "@/features/garden/domain/plant";
import { useGarden } from "../../../../providers/garden-provider";
import { P, SP, TY } from "@/constants/herbarium-theme";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=600&q=60";

const ACTIONS: Array<{ action: PlantCareAction; label: string; icon: string }> = [
  { action: "watered", label: "Watered", icon: "water-outline" },
  { action: "fertilized", label: "Fertilized", icon: "flask-outline" },
  { action: "pruned", label: "Pruned", icon: "cut-outline" },
  { action: "note", label: "Note", icon: "create-outline" },
];

export function PlantDetailsScreen({ plant }: { plant: Plant }) {
  const { addHistoryLog } = useGarden();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState("");
  const [busyAction, setBusyAction] = useState<PlantCareAction | null>(null);

  const logAction = async (action: PlantCareAction) => {
    setBusyAction(action);
    try {
      await addHistoryLog(plant.id, action, note || undefined);
      setNote("");
    } finally {
      setBusyAction(null);
    }
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
      <Image source={{ uri: plant.imageUri ?? FALLBACK_IMAGE }} style={styles.heroImage} contentFit="cover" />

      <View style={styles.card}>
        <Text style={styles.name}>{plant.name}</Text>
        <Text style={styles.species}>{plant.species}</Text>

        <View style={styles.metaGrid}>
          <Meta label="Date planted" value={plant.datePlanted} />
          <Meta label="Water every" value={`${plant.wateringFrequencyDays} days`} />
          <Meta label="Next watering" value={formatWateringLabel(plant)} />
          <Meta label="Last watered" value={plant.lastWateredAt ? new Date(plant.lastWateredAt).toLocaleDateString() : "Not yet"} />
        </View>

        {plant.notes ? (
          <View style={styles.notesWrap}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.notes}>{plant.notes}</Text>
          </View>
        ) : null}

        <Pressable onPress={() => router.push(`/plants/${plant.id}/edit` as never)} style={styles.editButton}>
          <Ionicons name="create-outline" size={16} color={P.p0} />
          <Text style={styles.editButtonText}>Edit plant</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Care History</Text>

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
              style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.9 }]}
              disabled={busyAction !== null}
            >
              <Ionicons name={item.icon as any} size={14} color={P.g1} />
              <Text style={styles.actionText}>{busyAction === item.action ? "Saving..." : item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: SP.sm }}>
          {plant.history.length === 0 ? (
            <Text style={styles.emptyHistory}>No history logs yet.</Text>
          ) : (
            plant.history.map((entry) => <HistoryLogItem key={entry.id} log={entry} />)
          )}
        </View>
      </View>
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
    gap: SP.md,
  },
  heroImage: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    backgroundColor: P.p2,
  },
  card: {
    backgroundColor: P.p0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.sketch,
    padding: SP.md,
    gap: SP.md,
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
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: P.g0,
    borderRadius: 12,
    paddingVertical: 12,
  },
  editButtonText: {
    color: P.p0,
    fontWeight: "800",
    fontSize: 15,
  },
  sectionTitle: {
    ...TY.display,
    fontSize: 24,
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
