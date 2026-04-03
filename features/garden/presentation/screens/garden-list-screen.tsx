import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppText } from "@/components/ui/app-text";
import { DS } from "@/constants/app-design-system";
import { SP, TY } from "@/constants/herbarium-theme";
import { getPlantStatus } from "@/features/garden/application/plant-utils";
import { PlantCard } from "@/features/garden/presentation/components/plant-card";
import { useFadeUp, usePressScale } from "@/hooks/use-screen-animations";
import { useAuth } from "../../../../providers/auth-provider";
import { useGarden } from "../../../../providers/garden-provider";

const HEALTH_FILTERS = [
  { key: "all", label: "All" },
  { key: "healthy", label: "Healthy" },
  { key: "at-risk", label: "At Risk" },
  { key: "needs-water", label: "Needs Water" },
] as const;

const WATER_FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
] as const;

const TYPE_FILTERS = [{ key: "", label: "All Types" }] as const; // Removed from UI

type FilterChipItem = { key: string; label: string };

export function GardenListScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const {
    plants,
    filteredPlants,
    filters,
    setFilters,
    loading,
    refreshing,
    refresh,
  } = useGarden();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const filterPanelAnim = useRef(new Animated.Value(0)).current;

  // Get user's first name for personalized greeting
  const firstName = profile?.displayName
    ? profile.displayName.split(" ")[0]
    : "My";
  const gardenTitle = `${firstName}'s Garden`;

  useEffect(() => {
    Animated.timing(filterPanelAnim, {
      toValue: filtersExpanded ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [filterPanelAnim, filtersExpanded]);

  const visiblePlants = filteredPlants;
  const hasAnyFilters =
    filters.query.trim().length > 0 ||
    filters.watering !== "all" ||
    filters.status !== "all" ||
    filters.species.trim().length > 0;
  const activeFilterCount =
    Number(filters.query.trim().length > 0) +
    Number(filters.watering !== "all") +
    Number(filters.status !== "all") +
    Number(filters.species.trim().length > 0);

  const healthStats = useMemo(() => {
    const healthy = plants.filter(
      (plant) => getPlantStatus(plant) === "Healthy",
    ).length;
    const atRisk = plants.filter(
      (plant) => getPlantStatus(plant) === "At Risk",
    ).length;
    const needsWater = plants.filter(
      (plant) => getPlantStatus(plant) === "Needs Water",
    ).length;
    return { healthy, atRisk, needsWater };
  }, [plants]);

  const resetFilters = () => {
    setFilters({
      query: "",
      watering: "all",
      status: "all",
      species: "",
    });
  };

  // Keep animation hooks stable across renders to avoid hook-order mismatches.
  const headerAnim = useFadeUp(0);
  const controlsAnim = useFadeUp(80);
  const plantsHeaderAnim = useFadeUp(160);
  const plantsGridAnim = useFadeUp(240);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={DS.colors.primary} />
        <AppText style={styles.helper}>Loading your garden...</AppText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={DS.colors.primary}
        />
      }
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + SP.md,
          paddingBottom: insets.bottom + SP.xxxl + 84,
        },
      ]}
    >
      <View style={styles.stack}>
        <Animated.View style={headerAnim}>
          <AppCard elevated style={styles.headerCard}>
            <View style={styles.headerBody}>
              <AppText variant="display" style={{ color: DS.colors.primary }}>
                {gardenTitle}
              </AppText>
              <AppText style={styles.headerSubtitle}>
                A calm grid of plant health, watering, and care.
              </AppText>
            </View>

            <View style={styles.sectionRule} />

            <View style={styles.statRow}>
              <SummaryStat value={String(plants.length)} label="plants" />
              <View style={styles.statDivider} />
              <SummaryStat
                value={String(healthStats.healthy)}
                label="healthy"
              />
              <View style={styles.statDivider} />
              <SummaryStat
                value={String(healthStats.atRisk + healthStats.needsWater)}
                label="needs care"
                urgent={healthStats.atRisk + healthStats.needsWater > 0}
              />
            </View>
          </AppCard>
        </Animated.View>

        <Animated.View style={controlsAnim}>
          <AppCard elevated style={styles.controlsCard}>
            <View style={styles.filterCardHeader}>
              <View style={styles.controlsTopRow}>
                <View style={styles.controlsHeadingStack}>
                  <AppText variant="mono" style={styles.controlsLabel}>
                    Search and filters
                  </AppText>
                  <AppText variant="caption" style={styles.controlsHint}>
                    Search by plant name or type, then narrow the collection.
                  </AppText>
                </View>

                <Pressable
                  onPress={() => router.push("/plants/new" as never)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.addPlantButton,
                    pressed && styles.addPlantButtonPressed,
                  ]}
                >
                  <Ionicons
                    name="add-outline"
                    size={16}
                    color={DS.colors.primary}
                  />
                  <AppText variant="mono" style={styles.addPlantButtonText}>
                    Plant
                  </AppText>
                </Pressable>
              </View>
            </View>

            <View style={styles.filterCardRule} />

            <View style={styles.filterSectionBlock}>
              <AppText variant="mono" style={styles.blockLabel}>
                Search
              </AppText>
              <View style={styles.searchRow}>
                <View style={styles.searchWrap}>
                  <View style={styles.searchIconWrap}>
                    <Ionicons
                      name="search"
                      size={14}
                      color={DS.colors.primaryMid}
                    />
                  </View>
                  <TextInput
                    value={filters.query}
                    onChangeText={(text) => setFilters({ query: text })}
                    placeholder="Search plants"
                    placeholderTextColor={DS.colors.textFaint}
                    style={styles.searchInput}
                  />
                  {filters.query ? (
                    <Pressable
                      onPress={() => setFilters({ query: "" })}
                      hitSlop={10}
                      style={({ pressed }) => [
                        styles.clearButton,
                        pressed && styles.clearButtonPressed,
                      ]}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={DS.colors.textFaint}
                      />
                    </Pressable>
                  ) : null}
                </View>

                <Pressable
                  onPress={() => setFiltersExpanded((prev) => !prev)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.filterToggleButton,
                    filtersExpanded && styles.filterToggleButtonActive,
                    pressed && styles.filterToggleButtonPressed,
                  ]}
                >
                  <Ionicons
                    name="funnel-outline"
                    size={16}
                    color={
                      filtersExpanded ? DS.colors.primary : DS.colors.textMuted
                    }
                  />
                  {activeFilterCount > 0 ? (
                    <View style={styles.filterCountBadge}>
                      <AppText variant="mono" style={styles.filterCountText}>
                        {activeFilterCount}
                      </AppText>
                    </View>
                  ) : null}
                </Pressable>
              </View>
            </View>

            {hasAnyFilters ? (
              <View style={styles.searchActionsRow}>
                <Pressable
                  onPress={resetFilters}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.clearAllButton,
                    pressed && styles.clearAllButtonPressed,
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={14}
                    color={DS.colors.textMuted}
                  />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.filterCardRule} />
            <Animated.View
              style={[
                styles.filterPanel,
                {
                  opacity: filterPanelAnim,
                  maxHeight: filterPanelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 420],
                  }),
                  transform: [
                    {
                      translateY: filterPanelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-8, 0],
                      }),
                    },
                  ],
                },
              ]}
              pointerEvents={filtersExpanded ? "auto" : "none"}
            >
              <View style={styles.filterGroup}>
                <FilterSection
                  label="Health"
                  chips={HEALTH_FILTERS}
                  activeKey={filters.status}
                  onChange={(key) =>
                    setFilters({ status: key as typeof filters.status })
                  }
                />
                <FilterSection
                  label="Watering"
                  chips={WATER_FILTERS}
                  activeKey={filters.watering}
                  onChange={(key) =>
                    setFilters({ watering: key as typeof filters.watering })
                  }
                />
              </View>
            </Animated.View>
          </AppCard>
        </Animated.View>

        <Animated.View style={plantsHeaderAnim}>
          <View style={styles.plantsHeader}>
            <View style={styles.plantsHeaderContent}>
              <Ionicons name="leaf" size={14} color={DS.colors.primary} />
              <AppText variant="mono" style={styles.plantsLabel}>
                PLANTS
              </AppText>
            </View>
            <View style={styles.plantsHeaderDivider} />
          </View>
        </Animated.View>

        <Animated.View style={plantsGridAnim}>
          {plants.length === 0 ? (
            <View style={styles.gridWrap}>
              <View style={styles.gridCell}>
                <AddPlantCard />
              </View>
            </View>
          ) : visiblePlants.length === 0 ? (
            <View style={styles.emptyCollection}>
              <Ionicons
                name="leaf-outline"
                size={28}
                color={DS.colors.primaryMid}
              />
              <AppText variant="bodyStrong">Plants not found</AppText>
              <AppText variant="caption">
                Try different filters or clear the search.
              </AppText>
              <AppButton
                label="Clear filters"
                variant="secondary"
                onPress={resetFilters}
              />
            </View>
          ) : (
            <View style={styles.gridWrap}>
              {visiblePlants.map((plant) => (
                <View style={styles.gridCell} key={plant.id}>
                  <PlantCard
                    plant={plant}
                    mode="grid"
                    onPress={() => router.push(`/plants/${plant.id}` as never)}
                  />
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    </ScrollView>
  );
}

function FilterSection({
  label,
  chips,
  activeKey,
  onChange,
}: {
  label: string;
  chips: ReadonlyArray<FilterChipItem>;
  activeKey: string;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.filterSection}>
      <View style={styles.filterSectionHeader}>
        <AppText variant="mono" style={styles.filterLabel}>
          {label}
        </AppText>
        <AppText variant="mono" style={styles.filterSectionCount}>
          {chips.length}
        </AppText>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {chips.map((chip) => (
          <FilterChip
            key={chip.key || chip.label}
            label={chip.label}
            active={activeKey === chip.key}
            onPress={() => onChange(chip.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChipPressable,
        pressed && styles.filterChipPressed,
      ]}
    >
      <View
        style={[
          styles.filterChip,
          active ? styles.filterChipActive : styles.filterChipInactive,
        ]}
      >
        <AppText
          variant="caption"
          style={[
            styles.filterChipText,
            active
              ? styles.filterChipTextActive
              : styles.filterChipTextInactive,
          ]}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

function SummaryStat({
  value,
  label,
  urgent = false,
}: {
  value: string;
  label: string;
  urgent?: boolean;
}) {
  return (
    <View style={styles.statCell}>
      <AppText
        style={[styles.statValue, urgent && { color: DS.colors.danger }]}
      >
        {value}
      </AppText>
      <AppText
        variant="mono"
        style={[styles.statLabel, urgent && { color: DS.colors.danger }]}
      >
        {label}
      </AppText>
    </View>
  );
}

function AddPlantCard() {
  const { scale, onPressIn, onPressOut } = usePressScale();
  return (
    <Pressable
      onPress={() => router.push("/plants/new" as never)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.addCard,
        pressed && styles.addCardPressed,
      ]}
    >
      <Animated.View
        style={[styles.addCardContent, { transform: [{ scale }] }]}
      >
        <View style={styles.addCardIconBox}>
          <Ionicons name="add" size={32} color={DS.colors.primaryMid} />
        </View>
        <AppText style={styles.addCardLabel}>Add Plant</AppText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: DS.colors.bg,
  },
  content: {
    padding: SP.lg,
  },
  stack: {
    gap: SP.lg,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DS.colors.bg,
    gap: SP.sm,
  },
  helper: {
    ...TY.body,
    color: DS.colors.textFaint,
  },
  headerCard: {
    gap: SP.md,
  },
  headerBody: {
    gap: 2,
    marginBottom: SP.sm,
  },
  headerSubtitle: {
    ...TY.body,
    color: DS.colors.textMuted,
  },
  sectionRule: {
    height: 1,
    backgroundColor: DS.colors.border,
    marginVertical: SP.sm,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontFamily: "System",
    fontSize: 28,
    color: DS.colors.text,
    fontWeight: "400",
    lineHeight: 32,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: DS.colors.border,
    marginHorizontal: SP.md,
  },
  statLabel: {
    ...TY.monoLabel,
    fontSize: 9,
    color: DS.colors.textFaint,
  },
  controlsCard: {
    gap: SP.md,
    paddingTop: SP.md,
    paddingBottom: SP.md,
  },
  filterCardHeader: {
    gap: SP.md,
  },
  filterCardRule: {
    height: 1,
    backgroundColor: DS.colors.borderSoft,
    marginVertical: SP.sm,
  },
  filterSectionBlock: {
    gap: SP.xs,
  },
  blockLabel: {
    color: DS.colors.textFaint,
    letterSpacing: 1,
    fontSize: 9,
  },
  controlsTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SP.md,
  },
  controlsHeadingStack: {
    flex: 1,
    gap: 2,
  },
  controlsLabel: {
    color: DS.colors.textFaint,
    letterSpacing: 1,
    fontSize: 10,
  },
  controlsHint: {
    color: DS.colors.textMuted,
  },
  addPlantButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minHeight: 36,
    borderWidth: 1,
    borderColor: DS.colors.primary,
    borderRadius: 8,
    backgroundColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addPlantButtonPressed: {
    opacity: 0.6,
  },
  addPlantButtonText: {
    color: DS.colors.primary,
    fontSize: 9,
    letterSpacing: 0.6,
    fontWeight: "500",
  },
  clearAllButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: DS.colors.borderSoft,
  },
  clearAllButtonPressed: {
    opacity: 0.6,
  },
  clearAllText: {
    color: DS.colors.textMuted,
    fontSize: 10,
  },
  searchActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  filterToggleButton: {
    position: "relative",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: DS.colors.borderSoft,
  },
  filterToggleButtonActive: {
    borderColor: DS.colors.primary,
    backgroundColor: DS.colors.primarySoft,
  },
  filterToggleButtonPressed: {
    opacity: 0.6,
  },
  filterToggleText: {
    color: DS.colors.textMuted,
    fontSize: 10,
  },
  filterToggleTextActive: {
    color: DS.colors.primary,
  },
  filterCountBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: DS.colors.amber,
    borderWidth: 1,
    borderColor: DS.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  filterCountText: {
    color: DS.colors.surface,
    fontSize: 8,
    fontWeight: "600",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DS.colors.border,
    backgroundColor: DS.colors.surface,
    paddingHorizontal: 12,
  },
  searchIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DS.colors.primarySoft,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 15,
    color: DS.colors.text,
  },
  clearButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: DS.colors.surfaceAlt,
  },
  clearButtonPressed: {
    opacity: 0.6,
  },
  filterPanel: {
    overflow: "hidden",
  },
  filterGroup: {
    gap: SP.lg,
    paddingTop: SP.sm,
    paddingBottom: SP.sm,
  },
  filterSection: {
    gap: SP.sm,
    borderWidth: 1,
    borderColor: DS.colors.border,
    borderRadius: 16,
    backgroundColor: DS.colors.surface,
    padding: SP.md,
    paddingBottom: SP.sm,
  },
  filterLabel: {
    ...TY.monoLabel,
    fontSize: 9,
    color: DS.colors.textFaint,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  filterSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  filterSectionCount: {
    color: DS.colors.textFaint,
    fontSize: 9,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: SP.xs,
  },
  filterChipPressable: {
    borderRadius: 8,
  },
  filterChipPressed: {
    opacity: 0.85,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    minHeight: 30,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: DS.colors.primary,
    borderColor: DS.colors.primary,
  },
  filterChipInactive: {
    backgroundColor: DS.colors.surface,
    borderColor: DS.colors.borderSoft,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: DS.colors.surface,
  },
  filterChipTextInactive: {
    color: DS.colors.textMuted,
  },
  emptyCollection: {
    alignItems: "center",
    gap: SP.sm,
    paddingVertical: SP.xl,
  },
  plantsHeader: {
    paddingHorizontal: SP.sm,
    gap: SP.sm,
    marginBottom: SP.md,
  },
  plantsHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  plantsLabel: {
    color: DS.colors.textFaint,
    letterSpacing: 1,
    fontSize: 10,
  },
  plantsHeaderDivider: {
    height: 1,
    backgroundColor: DS.colors.border,
    marginVertical: SP.xs,
  },
  emptyTitle: {
    ...TY.body,
    fontSize: 20,
    fontWeight: "800",
    color: DS.colors.text,
  },
  emptyText: {
    ...TY.body,
    color: DS.colors.textFaint,
    textAlign: "center",
    lineHeight: 20,
  },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SP.md,
    justifyContent: "flex-start",
    paddingHorizontal: SP.sm,
  },
  gridCell: {
    width: "48%",
    maxWidth: 190,
  },
  addCard: {
    backgroundColor: "transparent",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: DS.colors.borderSoft,
    borderStyle: "dashed",
    overflow: "hidden",
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  addCardPressed: {
    opacity: 0.6,
  },
  addCardContent: {
    alignItems: "center",
    gap: 12,
  },
  addCardIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: DS.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  addCardLabel: {
    ...TY.body,
    fontSize: 14,
    fontWeight: "600",
    color: DS.colors.primaryMid,
    letterSpacing: -0.3,
  },
});
