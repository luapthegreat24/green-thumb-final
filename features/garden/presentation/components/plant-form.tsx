import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DS } from "@/constants/app-design-system";
import type { Plant, UpsertPlantInput } from "@/features/garden/domain/plant";

const C = {
  paper: "#FAF9F7",
  card: "#FFFFFF",
  muted: "#8A9585",
  text: "#0F1410",
  leafBg: "#F0F7F2",
  surfaceAlt: "#FFFBF7",
  accentGreen: "#3A7C52",
};

type PlantFormProps = {
  initialPlant?: Plant;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (input: UpsertPlantInput) => Promise<void>;
};

export function PlantForm({
  initialPlant,
  submitLabel,
  busy,
  onSubmit,
}: PlantFormProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialPlant?.name ?? "");
  const [species, setSpecies] = useState(initialPlant?.species ?? "");
  const [wateringFrequencyDays, setWateringFrequencyDays] = useState(
    String(initialPlant?.wateringFrequencyDays ?? 7),
  );
  const [notes, setNotes] = useState(initialPlant?.notes ?? "");
  const [imageUri, setImageUri] = useState<string | undefined>(
    initialPlant?.imageUri,
  );
  const [error, setError] = useState<string | null>(null);

  const valid = useMemo(() => {
    if (!name.trim() || !species.trim()) return false;
    const frequency = Number(wateringFrequencyDays);
    if (!Number.isFinite(frequency) || frequency <= 0) return false;
    return true;
  }, [name, species, wateringFrequencyDays]);

  const chooseFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Allow photo library access to attach a plant photo.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 0.85,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.base64) {
        setImageUri(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        setImageUri(asset.uri);
      }
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Allow camera access to capture a plant photo.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      base64: true,
      quality: 0.85,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.base64) {
        setImageUri(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        setImageUri(asset.uri);
      }
    }
  };

  const submit = async () => {
    setError(null);

    if (!name.trim() || !species.trim()) {
      setError("Plant name and species are required.");
      return;
    }

    const frequency = Number(wateringFrequencyDays);
    if (!Number.isFinite(frequency) || frequency <= 0) {
      setError("Watering frequency must be a positive number of days.");
      return;
    }

    // Date planted is now automatic: current date on create, preserved on edit.
    const datePlanted =
      initialPlant?.datePlanted ?? new Date().toISOString().slice(0, 10);

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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: C.paper }}
        contentContainerStyle={[
          styles.container,
          { flexGrow: 1 },
          { paddingBottom: insets.bottom + DS.spacing.xxxl + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
      >
        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Plant Photo</Text>
          {imageUri ? (
            <View>
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                contentFit="cover"
              />
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={48} color={C.muted} />
              <Text style={styles.imagePlaceholderText}>Add a photo</Text>
            </View>
          )}
          <View style={styles.imageButtonsRow}>
            <Pressable
              onPress={chooseFromGallery}
              style={({ pressed }) => [
                styles.imageButton,
                pressed && styles.imageButtonPressed,
              ]}
            >
              <Ionicons name="image" size={18} color={C.accentGreen} />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </Pressable>
            <Pressable
              onPress={takePhoto}
              style={({ pressed }) => [
                styles.imageButton,
                pressed && styles.imageButtonPressed,
              ]}
            >
              <Ionicons name="camera" size={18} color={C.accentGreen} />
              <Text style={styles.imageButtonText}>Camera</Text>
            </Pressable>
          </View>
        </View>

        {/* Plant Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Plant Details</Text>

          <View>
            <Text style={styles.fieldLabel}>Plant Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Monstera"
              placeholderTextColor={C.muted}
              style={styles.input}
            />
          </View>

          <View>
            <Text style={styles.fieldLabel}>Species / Type *</Text>
            <TextInput
              value={species}
              onChangeText={setSpecies}
              placeholder="Monstera deliciosa"
              placeholderTextColor={C.muted}
              style={styles.input}
            />
          </View>
        </View>

        {/* Care Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Care Information</Text>

          <View>
            <Text style={styles.fieldLabel}>Watering Frequency (days) *</Text>
            <TextInput
              value={wateringFrequencyDays}
              onChangeText={setWateringFrequencyDays}
              keyboardType="number-pad"
              placeholder="7"
              placeholderTextColor={C.muted}
              style={styles.input}
            />
          </View>

          <View>
            <Text style={styles.fieldLabel}>Notes & Reminders</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Sunlight, soil, reminders..."
              placeholderTextColor={C.muted}
              multiline
              style={[
                styles.input,
                { minHeight: 100, textAlignVertical: "top" },
              ]}
            />
          </View>
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Pressable
            disabled={!valid || busy}
            onPress={submit}
            style={({ pressed }) => [
              styles.submitButton,
              (!valid || busy) && styles.submitButtonDisabled,
              pressed && valid && !busy && styles.submitButtonPressed,
            ]}
          >
            <Text style={styles.submitButtonText}>
              {busy ? "Saving..." : submitLabel}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  section: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8DFD6",
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.muted,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1.2,
    borderColor: "#E8DFD6",
    borderRadius: 16,
    backgroundColor: C.surfaceAlt,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: C.text,
    fontSize: 14,
    fontFamily: "SpaceMono",
    minHeight: 50,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    backgroundColor: C.surfaceAlt,
    marginBottom: 8,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E8DFD6",
    borderStyle: "dashed",
    backgroundColor: C.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 8,
  },
  imagePlaceholderText: {
    fontFamily: "SpaceMono",
    color: C.muted,
    fontSize: 13,
  },
  imageButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  imageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.leafBg,
    borderWidth: 1,
    borderColor: "#D8E8DE",
    borderRadius: 14,
    paddingVertical: 12,
  },
  imageButtonPressed: {
    opacity: 0.8,
  },
  imageButtonText: {
    fontFamily: "SpaceMono",
    color: C.accentGreen,
    fontSize: 12,
  },
  actionSection: {
    gap: 10,
    marginTop: 2,
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: C.accentGreen,
    paddingVertical: 15,
  },
  submitButtonText: {
    fontFamily: "SpaceMono",
    color: "#FFFFFF",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  submitButtonDisabled: {
    opacity: 0.55,
    borderColor: "#D9D1C8",
    backgroundColor: C.muted,
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  error: {
    fontFamily: "SpaceMono",
    color: "#C4623A",
    fontSize: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
});
