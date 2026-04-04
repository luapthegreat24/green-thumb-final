import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SP } from "@/constants/herbarium-theme";
import { identifyPlant } from "@/services/plants/plant-id-service";
import {
  searchDictionaryPlants,
  type TreflePlantCard,
} from "@/services/plants/trefle-service";

type SearchMode = "all" | "common" | "scientific";

const MODES: ReadonlyArray<{ key: SearchMode; label: string }> = [
  { key: "all", label: "All" },
  { key: "common", label: "Common" },
  { key: "scientific", label: "Scientific" },
];

const C = {
  paper: "#FAF9F7",
  tintA: "#EFF5EE",
  tintB: "#F2F7F4",
  card: "#FFFFFF",
  border: "#C8C0B4",
  rule: "#F5F0EB",
  muted: "#8A9585",
  text: "#0F1410",
  accentGreen: "#3A7C52",
  offWhite: "#FEFDFB",
  leafBg: "#F0F7F2",
  inputBorder: "#E5DED5",
  strongGreen: "#2F6B49",
  darkMuted: "#5E685F",
};

export default function PlantDictionaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("all");
  const [remotePlants, setRemotePlants] = useState<TreflePlantCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<string | null>(null);
  const [identifiedImageUri, setIdentifiedImageUri] = useState<string | null>(
    null,
  );
  const [identifiedScientificName, setIdentifiedScientificName] = useState<
    string | null
  >(null);
  const [autoOpenResult, setAutoOpenResult] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setRemotePlants([]);
      setSearching(false);
      setSearchError(null);
      return;
    }

    const handle = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);

      try {
        const results = await searchDictionaryPlants(trimmed);
        setRemotePlants(results);
      } catch {
        setRemotePlants([]);
        setSearchError("Live search is currently unavailable.");
      } finally {
        setSearching(false);
      }
    }, 320);

    return () => clearTimeout(handle);
  }, [query]);

  const filteredPlants = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matchesMode = (commonName: string, scientificName: string) => {
      if (mode === "common")
        return commonName.toLowerCase().includes(normalized);
      if (mode === "scientific")
        return scientificName.toLowerCase().includes(normalized);
      return (
        commonName.toLowerCase().includes(normalized) ||
        scientificName.toLowerCase().includes(normalized)
      );
    };

    if (normalized.length < 2) return [];

    return remotePlants.filter((plant) =>
      matchesMode(plant.commonName, plant.scientificName),
    );
  }, [mode, query, remotePlants]);

  const runIdentification = async (base64: string, imageUri: string) => {
    setSearchError(null);
    setIdentifying(true);
    setCameraStatus("Analyzing plant image...");
    setIdentifiedImageUri(imageUri);
    setIdentifiedScientificName(null);

    try {
      const result = await identifyPlant({ base64 });

      const identifiedName = result.scientificName;
      if (!identifiedName) {
        throw new Error("No plant name found in identification result.");
      }

      setIdentifiedScientificName(result.scientificName);

      setQuery(identifiedName);
      setMode("all");
      setAutoOpenResult(true);
      setCameraStatus(`Identified: ${identifiedName}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Plant identification failed. Please retry.";
      setSearchError(message);
      setCameraStatus("Identification failed. Tap retry.");
    } finally {
      setIdentifying(false);
    }
  };

  useEffect(() => {
    if (!autoOpenResult || searching || identifying) return;

    if (query.trim().length < 2) {
      setAutoOpenResult(false);
      return;
    }

    if (filteredPlants.length > 0) {
      const first = filteredPlants[0];
      setAutoOpenResult(false);
      router.push({
        pathname: "/plant-dictionary/[id]",
        params: { id: first.id },
      });
      return;
    }

    setAutoOpenResult(false);
    setSearchError("Plant identified, but no dictionary match was found.");
  }, [autoOpenResult, filteredPlants, identifying, query, router, searching]);

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setSearchError("Media library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: true,
      allowsEditing: false,
    });

    if (result.canceled) return;
    const base64 = result.assets[0]?.base64;
    const imageUri = result.assets[0]?.uri;
    if (!base64) {
      setSearchError("Unable to read selected image. Please try again.");
      return;
    }
    if (!imageUri) {
      setSearchError("Unable to preview selected image. Please try again.");
      return;
    }

    await runIdentification(base64, imageUri);
  };

  const captureWithCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setSearchError("Camera permission is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
      allowsEditing: false,
    });

    if (result.canceled) return;
    const base64 = result.assets[0]?.base64;
    const imageUri = result.assets[0]?.uri;
    if (!base64) {
      setSearchError("Unable to read captured image. Please try again.");
      return;
    }
    if (!imageUri) {
      setSearchError("Unable to preview captured image. Please try again.");
      return;
    }

    await runIdentification(base64, imageUri);
  };

  const handleCameraIdentify = async () => {
    if (identifying) return;

    Alert.alert("Identify Plant", "Choose image source", [
      { text: "Camera", onPress: () => void captureWithCamera() },
      { text: "Upload", onPress: () => void pickFromGallery() },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView style={s.screen}>
      <View pointerEvents="none" style={s.bgOrbA} />
      <View pointerEvents="none" style={s.bgOrbB} />

      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={C.accentGreen} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Plant Dictionary</Text>
          <Text style={s.headerSub}>Discovery</Text>
        </View>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          s.content,
          {
            paddingBottom: insets.bottom + SP.xxxl + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.introCard}>
          <View style={s.introIconWrap}>
            <Ionicons name="library-outline" size={18} color={C.accentGreen} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.introTitle}>Plant Lookup</Text>
            <Text style={s.introSub}>
              Type at least 2 letters to search the live Trefle catalog and
              display results.
            </Text>
            <View style={s.introMetaRow}>
              <View style={s.introMetaPill}>
                <Ionicons
                  name="search-outline"
                  size={12}
                  color={C.strongGreen}
                />
                <Text style={s.introMetaText}>Enter 2+ characters</Text>
              </View>
              <View style={s.introMetaPill}>
                <Ionicons name="scan-outline" size={12} color={C.strongGreen} />
                <Text style={s.introMetaText}>Live catalog search</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Search Plants</Text>
          <View style={s.rule} />

          <View style={s.searchInputWrap}>
            <View style={s.searchIconBubble}>
              <Ionicons name="search" size={16} color={C.accentGreen} />
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Try pothos or epipremnum"
              placeholderTextColor={C.muted}
              style={s.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>

          <View style={s.modeRow}>
            {MODES.map((item) => {
              const active = mode === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setMode(item.key)}
                  style={({ pressed }) => [
                    s.modePill,
                    active && s.modePillActive,
                    pressed && s.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Search mode ${item.label}`}
                >
                  <Text
                    style={[s.modePillText, active && s.modePillTextActive]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.helperText}>
            Guide: type at least 2 characters, choose a mode, then open a result
            card.
          </Text>
          {(searching || identifying) && (
            <View style={s.searchStatusRow}>
              <ActivityIndicator size="small" color={C.accentGreen} />
              <Text style={s.searchStatusText}>
                {identifying
                  ? (cameraStatus ?? "Analyzing image...")
                  : (cameraStatus ?? "Searching catalog...")}
              </Text>
            </View>
          )}
          {!searching && !identifying && cameraStatus ? (
            <Text style={s.searchStatusText}>{cameraStatus}</Text>
          ) : null}
          {!searching && !identifying && searchError ? (
            <Text style={s.searchErrorText}>{searchError}</Text>
          ) : null}
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Visual Identification</Text>
          <View style={s.rule} />

          <Pressable
            onPress={handleCameraIdentify}
            style={({ pressed }) => [
              s.cameraCard,
              identifying && s.cameraCardLoading,
              pressed && s.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Use camera to identify a plant"
          >
            <View style={s.cameraIconWrap}>
              {identifying ? (
                <ActivityIndicator size="small" color={C.accentGreen} />
              ) : (
                <Ionicons
                  name="camera-outline"
                  size={18}
                  color={C.accentGreen}
                />
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.cameraTitle}>Identify Plant With Camera</Text>
              <Text style={s.cameraSub} numberOfLines={1}>
                {identifying
                  ? "Processing image..."
                  : "Take or upload a photo to auto-search dictionary"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={C.muted} />
          </Pressable>

          {identifiedImageUri ? (
            <View style={s.identPreviewCard}>
              <View style={s.identPreviewImageWrap}>
                <Image
                  source={{ uri: identifiedImageUri }}
                  style={s.identPreviewImage}
                  contentFit="cover"
                />
              </View>
              <View style={s.identPreviewMeta}>
                <Text style={s.identPreviewTitle}>Identified Plant</Text>
                <Text style={s.identPreviewScientific}>
                  {identifiedScientificName ?? "Scientific name not available"}
                </Text>
              </View>
            </View>
          ) : null}

          {searchError ? (
            <Pressable
              onPress={handleCameraIdentify}
              style={({ pressed }) => [s.retryBtn, pressed && s.pressed]}
            >
              <Text style={s.retryBtnText}>Retry Identification</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={s.card}>
          <View style={s.listHeader}>
            <Text style={s.sectionTitle}>Browse Results</Text>
            <Text style={s.resultCount}>{filteredPlants.length} plants</Text>
          </View>
          <View style={s.rule} />

          {filteredPlants.map((plant, index) => (
            <Pressable
              key={plant.id}
              onPress={() =>
                router.push({
                  pathname: "/plant-dictionary/[id]",
                  params: { id: plant.id },
                })
              }
              style={({ pressed }) => [
                s.resultRow,
                index === filteredPlants.length - 1 && s.resultRowLast,
                pressed && s.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Plant ${plant.commonName}`}
            >
              <Image
                source={{ uri: plant.imageUri }}
                style={s.resultThumb}
                contentFit="cover"
              />

              <View style={s.cardNameBlock}>
                <Text style={s.commonName}>{plant.commonName}</Text>
                <Text style={s.scientificName}>{plant.scientificName}</Text>
              </View>

              <View style={s.resultArrowWrap}>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={C.accentGreen}
                />
              </View>
            </Pressable>
          ))}

          {filteredPlants.length === 0 && (
            <View style={s.emptyWrap}>
              <Ionicons name="leaf-outline" size={20} color={C.muted} />
              <Text style={s.emptyText}>
                {query.trim().length < 2
                  ? "Start typing to search (min 2 characters)."
                  : "No plants matched your search."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.paper,
  },
  bgOrbA: {
    position: "absolute",
    top: 70,
    right: -44,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: C.tintA,
  },
  bgOrbB: {
    position: "absolute",
    top: 330,
    left: -56,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: C.tintB,
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
  headerCenter: {
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  headerSub: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: C.muted,
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
  introCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D7E2D9",
    backgroundColor: "#F6FAF7",
  },
  introIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F3EB",
    borderWidth: 1,
    borderColor: "#CFE2D3",
  },
  introTitle: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: C.text,
  },
  introSub: {
    marginTop: 4,
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.darkMuted,
    lineHeight: 16,
  },
  introMetaRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  introMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#CFE2D3",
    backgroundColor: "#FFFFFF",
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  introMetaText: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: C.strongGreen,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    fontFamily: "SpaceMono",
    fontSize: 16,
    color: C.text,
    fontWeight: "600",
  },
  rule: {
    height: 1,
    backgroundColor: C.rule,
  },
  searchInputWrap: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.inputBorder,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.offWhite,
  },
  searchIconBubble: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D4E2D8",
    backgroundColor: "#EDF5EF",
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: C.text,
    paddingVertical: 0,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
  },
  modePill: {
    flex: 1,
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.offWhite,
  },
  modePillActive: {
    backgroundColor: C.strongGreen,
    borderColor: C.strongGreen,
  },
  modePillText: {
    fontFamily: "SpaceMono",
    color: "#6B756D",
    fontSize: 13,
  },
  modePillTextActive: {
    color: "#EFF8F2",
  },
  helperText: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: "#6E786F",
    lineHeight: 18,
  },
  searchStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchStatusText: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.accentGreen,
  },
  searchErrorText: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.muted,
  },
  cameraCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D6E4DA",
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#F7FBF8",
  },
  cameraCardLoading: {
    opacity: 0.86,
  },
  cameraIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#ECF5EF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D6E4DA",
  },
  cameraTitle: {
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: C.text,
  },
  cameraSub: {
    marginTop: 1,
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.muted,
  },
  retryBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D4E3D8",
    backgroundColor: "#F2F8F4",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  retryBtnText: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.strongGreen,
  },
  identPreviewCard: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CFE1D4",
    backgroundColor: "#F2F8F4",
    padding: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  identPreviewImageWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFE1D4",
    padding: 2,
    backgroundColor: "#FFFFFF",
  },
  identPreviewImage: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: C.leafBg,
  },
  identPreviewMeta: {
    flex: 1,
    gap: 4,
  },
  identPreviewTitle: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: "#5F6F64",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  identPreviewScientific: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: "#2D4637",
    fontStyle: "italic",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultCount: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: "#6C776E",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.rule,
    borderRadius: 14,
    backgroundColor: "#FCFBF9",
  },
  resultRowLast: {
    borderBottomWidth: 0,
  },
  resultThumb: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: C.leafBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
  },
  cardNameBlock: {
    flex: 1,
    gap: 3,
  },
  commonName: {
    fontFamily: "SpaceMono",
    fontSize: 15,
    color: C.text,
  },
  scientificName: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: "#5E695F",
    fontStyle: "italic",
  },
  resultArrowWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D4E3D8",
    backgroundColor: "#F2F8F4",
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
  pressed: {
    opacity: 0.82,
  },
});
