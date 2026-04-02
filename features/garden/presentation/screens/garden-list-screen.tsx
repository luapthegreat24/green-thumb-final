import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PlantCard } from "@/features/garden/presentation/components/plant-card";
import { useGarden } from "../../../../providers/garden-provider";
import { P, SP, TY } from "@/constants/herbarium-theme";

const WATER_FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Need Water" },
  { key: "week", label: "This Week" },
] as const;

export function GardenListScreen() {
  const insets = useSafeAreaInsets();
  const { filteredPlants, filters, setFilters, loading, refreshing, refresh } = useGarden();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={P.g1} />
        <Text style={styles.helper}>Loading your garden...</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <FlatList
        data={filteredPlants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + SP.md,
            paddingBottom: insets.bottom + SP.xxxl + 84,
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={P.g1} />}
        ListHeaderComponent={
          <View style={{ gap: SP.md }}>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>Garden Management</Text>
              <Text style={styles.title}>My Plants</Text>
              <Text style={styles.subtitle}>Track watering, update details, and keep plant care history in one place.</Text>
            </View>

            <TextInput
              value={filters.query}
              onChangeText={(text) => setFilters({ query: text })}
              placeholder="Search by plant name or species"
              placeholderTextColor={P.i3}
              style={styles.searchInput}
            />

            <View style={styles.filterRow}>
              {WATER_FILTERS.map((filter) => (
                <Pressable
                  key={filter.key}
                  onPress={() => setFilters({ watering: filter.key })}
                  style={({ pressed }) => [
                    styles.filterChip,
                    filters.watering === filter.key && styles.filterChipActive,
                    pressed && styles.filterChipPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.watering === filter.key && styles.filterChipTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <PlantCard
            plant={item}
            onPress={() => router.push(`/plants/${item.id}` as never)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: SP.md }} />}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="leaf-outline" size={30} color={P.g2} />
            <Text style={styles.emptyTitle}>No plants yet</Text>
            <Text style={styles.emptyText}>Tap the floating + button to add your first plant.</Text>
          </View>
        }
      />

      <Pressable onPress={() => router.push("/plants/new" as never)} style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}>
        <Ionicons name="add" size={28} color={P.p0} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: P.p1,
  },
  content: {
    padding: SP.lg,
    gap: SP.md,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.p1,
    gap: SP.sm,
  },
  helper: {
    ...TY.body,
    color: P.i3,
  },
  hero: {
    gap: SP.sm,
  },
  eyebrow: {
    ...TY.monoLabel,
    fontSize: 10,
    color: P.g1,
  },
  title: {
    ...TY.display,
    fontSize: 36,
  },
  subtitle: {
    ...TY.body,
    color: P.i2,
    lineHeight: 22,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: P.sketch,
    backgroundColor: P.p0,
    borderRadius: 14,
    paddingHorizontal: SP.md,
    paddingVertical: 12,
    fontSize: 15,
    color: P.i1,
  },
  filterRow: {
    flexDirection: "row",
    gap: SP.sm,
  },
  filterChip: {
    paddingHorizontal: SP.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: P.p2,
    borderWidth: 1,
    borderColor: P.hair,
  },
  filterChipActive: {
    backgroundColor: P.g0,
  },
  filterChipPressed: {
    opacity: 0.85,
  },
  filterChipText: {
    ...TY.body,
    color: P.i2,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: P.p0,
  },
  emptyCard: {
    marginTop: SP.md,
    backgroundColor: P.p0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.sketch,
    padding: SP.xl,
    alignItems: "center",
    gap: SP.sm,
  },
  emptyTitle: {
    ...TY.body,
    fontSize: 20,
    fontWeight: "800",
    color: P.i1,
  },
  emptyText: {
    ...TY.body,
    color: P.i3,
    textAlign: "center",
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    right: SP.lg,
    bottom: SP.xxxl,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.g0,
    shadowColor: P.i0,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
