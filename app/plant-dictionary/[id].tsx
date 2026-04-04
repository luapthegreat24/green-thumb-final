import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SP } from "@/constants/herbarium-theme";
import { getDictionaryPlantById } from "@/lib/plant-dictionary-data";
import {
  getDictionaryPlantProfile,
  type TreflePlantProfile,
} from "@/services/plants/trefle-service";

const C = {
  paper: "#FAF9F7",
  card: "#FFFFFF",
  border: "#C8C0B4",
  rule: "#F5F0EB",
  muted: "#8A9585",
  text: "#0F1410",
  accentGreen: "#3A7C52",
  offWhite: "#FEFDFB",
  panel: "#F4FAF6",
};

type DisplayPlant = {
  id: string;
  commonName: string;
  scientificName: string;
  imageUri: string;
  overview: string;
  family: string | null;
  genus: string | null;
  rank: string | null;
  author: string | null;
  year: string | null;
  observations: string | null;
  edible: boolean | null;
  status: string | null;
  light: number | null;
  atmosphericHumidity: number | null;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  minPrecipMm: number | null;
  maxPrecipMm: number | null;
  daysToHarvest: number | null;
  growthMonths: string[] | null;
  fruitMonths: string[] | null;
};

function mapLocalPlantToProfile(plant: {
  id: string;
  commonName: string;
  scientificName: string;
  imageUri: string;
}): DisplayPlant {
  return {
    id: plant.id,
    commonName: plant.commonName,
    scientificName: plant.scientificName,
    imageUri: plant.imageUri,
    overview:
      "Featured reference entry. Live taxonomy details are loading from the plant catalog.",
    family: null,
    genus: null,
    rank: null,
    author: null,
    year: null,
    observations: null,
    edible: null,
    status: null,
    light: null,
    atmosphericHumidity: null,
    minTemperatureC: null,
    maxTemperatureC: null,
    minPrecipMm: null,
    maxPrecipMm: null,
    daysToHarvest: null,
    growthMonths: null,
    fruitMonths: null,
  };
}

function mapTrefleProfile(plant: TreflePlantProfile): DisplayPlant {
  return {
    id: plant.id,
    commonName: plant.commonName,
    scientificName: plant.scientificName,
    imageUri: plant.imageUri,
    overview:
      plant.observations ??
      `${plant.commonName} is a live catalog entry with scientific taxonomy and reference data.`,
    family: plant.family,
    genus: plant.genus,
    rank: plant.rank,
    author: plant.author,
    year: plant.year,
    observations: plant.observations,
    edible: plant.edible,
    status: plant.status,
    light: plant.light,
    atmosphericHumidity: plant.atmosphericHumidity,
    minTemperatureC: plant.minTemperatureC,
    maxTemperatureC: plant.maxTemperatureC,
    minPrecipMm: plant.minPrecipMm,
    maxPrecipMm: plant.maxPrecipMm,
    daysToHarvest: plant.daysToHarvest,
    growthMonths: plant.growthMonths,
    fruitMonths: plant.fruitMonths,
  };
}

export default function DictionaryPlantDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const localPlant = getDictionaryPlantById(id ?? "");

  const [plant, setPlant] = useState<DisplayPlant | null>(
    localPlant ? mapLocalPlantToProfile(localPlant) : null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPlantProfile() {
      if (!id) {
        setPlant(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const apiPlant = await getDictionaryPlantProfile(id);
        if (active) {
          setPlant(
            apiPlant
              ? mapTrefleProfile(apiPlant)
              : localPlant
                ? mapLocalPlantToProfile(localPlant)
                : null,
          );
        }
      } catch {
        if (active) {
          setPlant(localPlant ? mapLocalPlantToProfile(localPlant) : null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPlantProfile();

    return () => {
      active = false;
    };
  }, [id, localPlant]);

  if (loading && !plant) {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.accentGreen} />
          <Text style={s.loadingText}>Loading plant profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!plant) {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.notFoundWrap}>
          <Ionicons name="leaf-outline" size={28} color={C.muted} />
          <Text style={s.notFoundTitle}>Plant not found</Text>
          <Text style={s.notFoundSub}>
            The selected dictionary entry is unavailable.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [s.backPrimary, pressed && s.pressed]}
          >
            <Text style={s.backPrimaryText}>Back to Dictionary</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const climateBits = [
    plant.light !== null
      ? plant.light <= 3
        ? "Low-light"
        : plant.light <= 6
          ? "Moderate light"
          : plant.light <= 8
            ? "Bright light"
            : "Full sun"
      : null,
    plant.atmosphericHumidity !== null
      ? plant.atmosphericHumidity <= 3
        ? "Dry-air tolerant"
        : plant.atmosphericHumidity <= 6
          ? "Average humidity"
          : "Humidity-loving"
      : null,
    plant.minTemperatureC !== null || plant.maxTemperatureC !== null
      ? `${plant.minTemperatureC ?? "—"}°C to ${plant.maxTemperatureC ?? "—"}°C`
      : null,
    plant.minPrecipMm !== null || plant.maxPrecipMm !== null
      ? `${plant.minPrecipMm ?? "—"}-${plant.maxPrecipMm ?? "—"} mm rain`
      : null,
  ].filter(Boolean);

  const harvestBits = [
    plant.daysToHarvest !== null
      ? `Harvest in about ${plant.daysToHarvest} days`
      : null,
    plant.growthMonths?.length
      ? `Growing season: ${plant.growthMonths.join(", ")}`
      : null,
    plant.fruitMonths?.length
      ? `Fruit window: ${plant.fruitMonths.join(", ")}`
      : null,
    plant.edible ? "Edible crop" : null,
  ].filter(Boolean);

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={C.accentGreen} />
        </Pressable>
        <Text style={s.headerTitle}>Plant Profile</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.content,
          {
            paddingBottom: insets.bottom + SP.xxxl + 40,
          },
        ]}
      >
        <View style={s.card}>
          <Image
            source={{ uri: plant.imageUri }}
            style={s.heroImage}
            contentFit="cover"
          />

          <View style={s.entryHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.commonName}>{plant.commonName}</Text>
              <Text style={s.scientificName}>{plant.scientificName}</Text>
            </View>
          </View>

          <View style={s.rule} />

          <Text style={s.overview}>{plant.overview}</Text>

          <View style={s.quickFactsRow}>
            <MiniFact label="Family" value={plant.family ?? "—"} />
            <MiniFact label="Genus" value={plant.genus ?? "—"} />
            <MiniFact label="Rank" value={plant.rank ?? "—"} />
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Scientific Classification</Text>
          <View style={s.rule} />

          <InfoRow
            icon="layers-outline"
            label="Family"
            value={plant.family ?? "Not available"}
          />
          <InfoRow
            icon="git-branch-outline"
            label="Genus"
            value={plant.genus ?? "Not available"}
          />
          <InfoRow
            icon="pricetags-outline"
            label="Rank"
            value={plant.rank ?? "Not available"}
          />
          <InfoRow
            icon="person-outline"
            label="Author"
            value={plant.author ?? "Not available"}
          />
          <InfoRow
            icon="calendar-outline"
            label="Year"
            value={plant.year ?? "Not available"}
          />
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Climate Suitability</Text>
          <View style={s.rule} />
          <View style={s.notePanel}>
            <Text style={s.noteText}>
              {climateBits.length > 0
                ? climateBits.join(" • ")
                : "Climate preference data is not available yet."}
            </Text>
          </View>
          <View style={s.metaGrid}>
            <InfoRow
              icon="thermometer-outline"
              label="Temperature"
              value={
                plant.minTemperatureC !== null || plant.maxTemperatureC !== null
                  ? `${plant.minTemperatureC ?? "—"}°C to ${plant.maxTemperatureC ?? "—"}°C`
                  : "Not available"
              }
            />
            <InfoRow
              icon="rainy-outline"
              label="Rainfall"
              value={
                plant.minPrecipMm !== null || plant.maxPrecipMm !== null
                  ? `${plant.minPrecipMm ?? "—"}-${plant.maxPrecipMm ?? "—"} mm`
                  : "Not available"
              }
            />
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Harvest & Crop</Text>
          <View style={s.rule} />
          <View style={s.notePanel}>
            <Text style={s.noteText}>
              {harvestBits.length > 0
                ? harvestBits.join(" • ")
                : "Harvest and crop guidance is not available yet."}
            </Text>
          </View>
          <View style={s.metaGrid}>
            <InfoRow
              icon="time-outline"
              label="Days to harvest"
              value={
                plant.daysToHarvest !== null
                  ? String(plant.daysToHarvest)
                  : "Not available"
              }
            />
            <InfoRow
              icon="leaf-outline"
              label="Growing months"
              value={plant.growthMonths?.join(", ") ?? "Not available"}
            />
            <InfoRow
              icon="nutrition-outline"
              label="Fruit months"
              value={plant.fruitMonths?.join(", ") ?? "Not available"}
            />
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Reference Notes</Text>
          <View style={s.rule} />

          <View style={s.notePanel}>
            <Text style={s.noteText}>
              {plant.observations ??
                "No additional observation notes were returned for this entry."}
            </Text>
          </View>

          <View style={s.metaGrid}>
            <InfoRow
              icon="checkmark-circle-outline"
              label="Catalog status"
              value={plant.status ?? "Not available"}
            />
            <InfoRow
              icon="nutrition-outline"
              label="Edible"
              value={
                plant.edible === null
                  ? "Not available"
                  : plant.edible
                    ? "Yes"
                    : "No"
              }
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.miniFact}>
      <Text style={s.miniFactLabel}>{label}</Text>
      <Text style={s.miniFactValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={s.metaItem}>
      <View style={s.metaLabelRow}>
        <Ionicons name={icon} size={14} color={C.accentGreen} />
        <Text style={s.metaLabel}>{label}</Text>
      </View>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
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
    fontSize: 16,
    color: C.text,
    fontWeight: "600",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: C.muted,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    gap: 14,
  },
  heroImage: {
    width: "100%",
    height: 230,
    borderRadius: 20,
    backgroundColor: C.offWhite,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF4ED",
  },
  entryLabel: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  scientificName: {
    marginTop: 2,
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: C.muted,
    fontStyle: "italic",
  },
  commonName: {
    marginTop: 4,
    fontFamily: "SpaceMono",
    fontSize: 22,
    color: C.text,
  },
  sourcePill: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#D5E4D9",
    backgroundColor: "#F3F8F4",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sourcePillText: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: C.accentGreen,
  },
  rule: {
    height: 1,
    backgroundColor: C.rule,
  },
  overview: {
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: C.text,
    lineHeight: 19,
  },
  quickFactsRow: {
    flexDirection: "row",
    gap: 8,
  },
  miniFact: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5DED5",
    backgroundColor: "#FFFBF7",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 4,
  },
  miniFactLabel: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  miniFactValue: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.text,
  },
  sectionTitle: {
    fontFamily: "SpaceMono",
    fontSize: 15,
    color: C.text,
    fontWeight: "600",
  },
  metaItem: {
    borderWidth: 1,
    borderColor: "#E5DED5",
    borderRadius: 12,
    backgroundColor: "#FFFBF7",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  metaLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  },
  metaGrid: {
    gap: 10,
  },
  notePanel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DAE8DE",
    backgroundColor: C.panel,
    padding: 12,
  },
  noteText: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    lineHeight: 18,
    color: "#5B665D",
  },
  notFoundWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 10,
  },
  notFoundTitle: {
    fontFamily: "SpaceMono",
    fontSize: 20,
    color: C.text,
  },
  notFoundSub: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: C.muted,
    textAlign: "center",
  },
  backPrimary: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFE2D3",
    backgroundColor: "#EFF7F2",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backPrimaryText: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: C.accentGreen,
  },
  pressed: {
    opacity: 0.82,
  },
});
