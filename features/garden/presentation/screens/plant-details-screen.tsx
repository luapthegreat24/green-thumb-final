import { useFadeUp } from "@/hooks/use-screen-animations";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SP } from "@/constants/herbarium-theme";
import { formatWateringLabel } from "@/features/garden/application/plant-utils";
import type { Plant } from "@/features/garden/domain/plant";
import { useCareTasks } from "@/providers/care-tasks-provider";
import { useGarden } from "../../../../providers/garden-provider";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=600&q=60";

const C = {
  paper: "#FAF9F7",
  card: "#FFFFFF",
  border: "#EBE4DC",
  muted: "#8A9585",
  text: "#0F1410",
  green: "#2D6344",
  sage: "#5C8B6E",
  amber: "#B87A2A",
  terracotta: "#C4623A",
  leafBg: "#F0F7F2",
  rowBorder: "#F5F0EB",
  offWhite: "#FEFDFB",
  accentGreen: "#3A7C52",
};

export function PlantDetailsScreen({ plant }: { plant: Plant }) {
  const { deletePlant } = useGarden();
  const { tasks: careTasks } = useCareTasks();
  const insets = useSafeAreaInsets();
  const contentAnim = useFadeUp(0);
  const [busyDelete, setBusyDelete] = useState(false);

  const plantTaskData = useMemo(() => {
    const normalized = careTasks
      .filter((task) => task.plantId === plant.id)
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
      .map((task) => ({
        ...task,
        frequency: task.isRecurring ? (task.frequency ?? "weekly") : "once",
        time: `${String(task.dateTime.getHours()).padStart(2, "0")}:${String(
          task.dateTime.getMinutes(),
        ).padStart(2, "0")}`,
      }));

    const upcoming = normalized.filter((task) => task.status === "pending");
    const history = normalized
      .filter((task) => task.status !== "pending")
      .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());

    return { upcoming, history };
  }, [careTasks, plant.id]);

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

  const onBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)" as never);
  };

  const lastWatered = plant.lastWateredAt
    ? new Date(plant.lastWateredAt).toLocaleDateString()
    : "Not yet";

  const prettyTime = (time24: string) => {
    const [h, m] = time24.split(":").map(Number);
    const suffix = h >= 12 ? "pm" : "am";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  const formatTaskDateTime = (value: Date) => {
    return value.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.accentGreen} />
        </Pressable>
        <Text style={styles.headerTitle}>Plant Details</Text>
        <Pressable
          onPress={() => router.push(`/plants/${plant.id}/edit` as never)}
          style={styles.backBtn}
        >
          <Ionicons name="create-outline" size={20} color={C.accentGreen} />
        </Pressable>
      </View>

      <Animated.ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + SP.xxxl + 40,
          },
        ]}
        style={contentAnim}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Image
            source={{ uri: plant.imageUri ?? FALLBACK_IMAGE }}
            style={styles.heroImage}
            contentFit="cover"
          />

          <View style={styles.plantHeadRow}>
            <View style={styles.plantIconBubble}>
              <Ionicons name="leaf-outline" size={22} color={C.accentGreen} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.plantSpecies}>{plant.species}</Text>
              <Text style={styles.plantName}>{plant.name}</Text>
            </View>
          </View>

          <View style={styles.rule} />

          <View style={styles.metaGrid}>
            <Meta label="Date planted" value={plant.datePlanted} />
            <Meta
              label="Water every"
              value={`${plant.wateringFrequencyDays} days`}
            />
            <Meta label="Next watering" value={formatWateringLabel(plant)} />
            <Meta label="Last watered" value={lastWatered} />
          </View>

          {plant.notes ? (
            <Text style={styles.plantNotes}>{plant.notes}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Care Instructions</Text>
          <View style={styles.rule} />
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
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
          <View style={styles.rule} />

          {plantTaskData.upcoming.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="calendar-outline" size={20} color={C.muted} />
              <Text style={styles.emptyText}>No scheduled tasks yet.</Text>
            </View>
          ) : (
            <View>
              {plantTaskData.upcoming.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.scheduleRow,
                    index === plantTaskData.upcoming.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <View style={styles.scheduleIconWrap}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={C.accentGreen}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.scheduleTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.scheduleMeta} numberOfLines={1}>
                      {prettyTime(item.time)} · {item.frequency} ·{" "}
                      {formatTaskDateTime(item.dateTime)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Care History</Text>
          <View style={styles.rule} />

          <View style={{ gap: SP.sm }}>
            {plantTaskData.history.length === 0 ? (
              <Text style={styles.emptyText}>No history logs yet.</Text>
            ) : (
              plantTaskData.history.slice(0, 8).map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.scheduleRow,
                    index === plantTaskData.history.slice(0, 8).length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <View style={styles.scheduleIconWrap}>
                    <Ionicons
                      name={
                        item.status === "completed"
                          ? "checkmark-circle"
                          : "alert-circle-outline"
                      }
                      size={14}
                      color={
                        item.status === "completed"
                          ? C.accentGreen
                          : C.terracotta
                      }
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.scheduleTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.scheduleMeta} numberOfLines={1}>
                      {item.status} · {prettyTime(item.time)} ·{" "}
                      {formatTaskDateTime(item.dateTime)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.actionsGrid}>
            <Pressable
              style={[
                styles.actionDeleteMinimal,
                busyDelete && { opacity: 0.6 },
              ]}
              onPress={onDelete}
              disabled={busyDelete}
            >
              <Ionicons name="trash-outline" size={16} color={C.terracotta} />
              <Text style={styles.actionDeleteText}>
                {busyDelete ? "Deleting..." : "Delete plant"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
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
  screen: {
    flex: 1,
    backgroundColor: C.paper,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.paper,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E9E1",
  },
  headerTitle: {
    fontFamily: "SpaceMono",
    fontSize: 17,
    color: C.text,
    fontWeight: "600",
  },
  backBtn: { padding: 8, alignItems: "center", justifyContent: "center" },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#C8C0B4",
    padding: 18,
    gap: 14,
  },
  rule: { height: 1, backgroundColor: "#F5F0EB" },
  heroImage: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    backgroundColor: C.offWhite,
  },
  plantHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  plantIconBubble: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: C.leafBg,
    alignItems: "center",
    justifyContent: "center",
  },
  plantSpecies: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: C.muted,
  },
  plantName: {
    fontFamily: "SpaceMono",
    fontSize: 24,
    color: C.text,
    marginTop: 2,
  },
  metaGrid: {
    gap: SP.sm,
  },
  metaItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5DED5",
    borderRadius: 12,
    backgroundColor: "#FFFBF7",
    gap: 4,
  },
  metaLabel: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: C.muted,
    textTransform: "uppercase",
  },
  metaValue: {
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: C.text,
    fontWeight: "500",
  },
  plantNotes: {
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: C.text,
    lineHeight: 19,
  },
  sectionTitle: {
    fontFamily: "SpaceMono",
    fontSize: 15,
    color: C.text,
    fontWeight: "600",
  },
  emptyWrap: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
  },
  emptyText: {
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: C.muted,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.rowBorder,
    paddingVertical: 12,
  },
  scheduleIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: C.leafBg,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleTitle: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: C.text,
  },
  scheduleMeta: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  actionDeleteMinimal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "transparent",
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  actionDeleteText: {
    fontFamily: "SpaceMono",
    color: C.terracotta,
    fontSize: 11,
  },
});
