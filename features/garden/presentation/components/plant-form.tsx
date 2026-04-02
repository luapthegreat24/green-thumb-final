import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Plant, UpsertPlantInput } from "@/features/garden/domain/plant";
import { P, SP, TY } from "@/constants/herbarium-theme";

type PlantFormProps = {
  initialPlant?: Plant;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (input: UpsertPlantInput) => Promise<void>;
  onDelete?: () => void;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=600&q=60";

export function PlantForm({ initialPlant, submitLabel, busy, onSubmit, onDelete }: PlantFormProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialPlant?.name ?? "");
  const [species, setSpecies] = useState(initialPlant?.species ?? "");
  const [datePlanted, setDatePlanted] = useState(initialPlant?.datePlanted ?? new Date().toISOString().slice(0, 10));
  const [wateringFrequencyDays, setWateringFrequencyDays] = useState(String(initialPlant?.wateringFrequencyDays ?? 7));
  const [notes, setNotes] = useState(initialPlant?.notes ?? "");
  const [imageUri, setImageUri] = useState<string | undefined>(initialPlant?.imageUri);
  const [error, setError] = useState<string | null>(null);

  const valid = useMemo(() => {
    if (!name.trim() || !species.trim()) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePlanted.trim())) return false;
    const frequency = Number(wateringFrequencyDays);
    if (!Number.isFinite(frequency) || frequency <= 0) return false;
    return true;
  }, [name, species, datePlanted, wateringFrequencyDays]);

  const chooseFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow photo library access to attach a plant photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow camera access to capture a plant photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    setError(null);

    if (!name.trim() || !species.trim()) {
      setError("Plant name and species are required.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePlanted.trim())) {
      setError("Date planted must use format YYYY-MM-DD.");
      return;
    }

    const frequency = Number(wateringFrequencyDays);
    if (!Number.isFinite(frequency) || frequency <= 0) {
      setError("Watering frequency must be a positive number of days.");
      return;
    }

    await onSubmit({
      name,
      species,
      datePlanted,
      wateringFrequencyDays: frequency,
      notes,
      imageUri,
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: P.p1 }}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: insets.bottom + SP.xxxl + 64 },
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.label}>Plant Image</Text>
        <Image source={{ uri: imageUri ?? FALLBACK_IMAGE }} style={styles.image} contentFit="cover" />
        <View style={styles.row}>
          <Pressable onPress={chooseFromGallery} style={styles.secondaryButton}>
            <Ionicons name="images-outline" size={16} color={P.g0} />
            <Text style={styles.secondaryButtonText}>Gallery</Text>
          </Pressable>
          <Pressable onPress={takePhoto} style={styles.secondaryButton}>
            <Ionicons name="camera-outline" size={16} color={P.g0} />
            <Text style={styles.secondaryButtonText}>Camera</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Plant Name *</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Monstera" placeholderTextColor={P.i3} style={styles.input} />

        <Text style={styles.label}>Plant Type / Species *</Text>
        <TextInput value={species} onChangeText={setSpecies} placeholder="Monstera deliciosa" placeholderTextColor={P.i3} style={styles.input} />

        <Text style={styles.label}>Date Planted (YYYY-MM-DD) *</Text>
        <TextInput value={datePlanted} onChangeText={setDatePlanted} placeholder="2026-04-02" placeholderTextColor={P.i3} autoCapitalize="none" style={styles.input} />

        <Text style={styles.label}>Watering Frequency (days) *</Text>
        <TextInput value={wateringFrequencyDays} onChangeText={setWateringFrequencyDays} keyboardType="number-pad" placeholder="7" placeholderTextColor={P.i3} style={styles.input} />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput value={notes} onChangeText={setNotes} placeholder="Sunlight, soil, reminders..." placeholderTextColor={P.i3} multiline style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable disabled={!valid || busy} onPress={submit} style={({ pressed }) => [styles.primaryButton, (!valid || busy) && styles.disabledButton, pressed && valid && !busy && styles.pressedButton]}>
          <Text style={styles.primaryButtonText}>{busy ? "Saving..." : submitLabel}</Text>
        </Pressable>

        {onDelete ? (
          <Pressable onPress={onDelete} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete Plant</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SP.lg,
    gap: SP.md,
  },
  card: {
    backgroundColor: P.p0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.sketch,
    padding: SP.md,
    gap: SP.sm,
  },
  label: {
    ...TY.monoLabel,
    fontSize: 9,
    color: P.i3,
  },
  input: {
    borderWidth: 1,
    borderColor: P.sketch,
    borderRadius: 12,
    backgroundColor: P.p1,
    paddingHorizontal: SP.md,
    paddingVertical: 12,
    color: P.i1,
    fontSize: 15,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: P.p2,
  },
  row: {
    flexDirection: "row",
    gap: SP.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: P.p2,
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    ...TY.body,
    color: P.g0,
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: SP.sm,
    backgroundColor: P.g0,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: P.p0,
    fontSize: 15,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.55,
  },
  pressedButton: {
    opacity: 0.9,
  },
  deleteButton: {
    marginTop: SP.sm,
    alignItems: "center",
    paddingVertical: 10,
  },
  deleteButtonText: {
    ...TY.body,
    color: P.rust,
    fontWeight: "800",
  },
  error: {
    ...TY.body,
    color: P.rust,
  },
});
