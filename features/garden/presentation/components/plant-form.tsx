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

type PlantFormProps = {
  initialPlant?: Plant;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (input: UpsertPlantInput) => Promise<void>;
  onDelete?: () => void;
};

export function PlantForm({
  initialPlant,
  submitLabel,
  busy,
  onSubmit,
  onDelete,
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
        style={{ flex: 1, backgroundColor: DS.colors.bg }}
        contentContainerStyle={[
          styles.container,
          { flexGrow: 1 },
          { paddingBottom: insets.bottom + DS.spacing.xxxl + 64 },
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
              <Ionicons
                name="image-outline"
                size={48}
                color={DS.colors.textFaint}
              />
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
              <Ionicons name="image" size={18} color={DS.colors.primary} />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </Pressable>
            <Pressable
              onPress={takePhoto}
              style={({ pressed }) => [
                styles.imageButton,
                pressed && styles.imageButtonPressed,
              ]}
            >
              <Ionicons name="camera" size={18} color={DS.colors.primary} />
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
              placeholderTextColor={DS.colors.textFaint}
              style={styles.input}
            />
          </View>

          <View>
            <Text style={styles.fieldLabel}>Species / Type *</Text>
            <TextInput
              value={species}
              onChangeText={setSpecies}
              placeholder="Monstera deliciosa"
              placeholderTextColor={DS.colors.textFaint}
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
              placeholderTextColor={DS.colors.textFaint}
              style={styles.input}
            />
          </View>

          <View>
            <Text style={styles.fieldLabel}>Notes & Reminders</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Sunlight, soil, reminders..."
              placeholderTextColor={DS.colors.textFaint}
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
            <View style={styles.submitIconBadge}>
              <Ionicons
                name="leaf-outline"
                size={16}
                color={DS.colors.surface}
              />
            </View>
            <Text style={styles.submitButtonText}>
              {busy ? "Saving..." : submitLabel}
            </Text>
          </Pressable>

          {onDelete ? (
            <Pressable onPress={onDelete} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete Plant</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DS.spacing.screenX,
    paddingTop: DS.spacing.lg,
    gap: DS.spacing.xl,
  },
  section: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.borderSoft,
    padding: DS.spacing.lg,
    gap: DS.spacing.lg,
    ...DS.shadow.cardSoft,
  },
  sectionLabel: {
    ...DS.typography.mono,
    fontSize: 11,
    color: DS.colors.textFaint,
    marginBottom: DS.spacing.xs,
  },
  fieldLabel: {
    ...DS.typography.bodyStrong,
    fontSize: 14,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: DS.colors.borderSoft,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.bg,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.md,
    color: DS.colors.text,
    fontSize: 15,
    fontFamily: "System",
    minHeight: 50,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.surfaceAlt,
    marginBottom: DS.spacing.sm,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: DS.radius.md,
    borderWidth: 2,
    borderColor: DS.colors.borderSoft,
    borderStyle: "dashed",
    backgroundColor: DS.colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: DS.spacing.md,
    marginBottom: DS.spacing.sm,
  },
  imagePlaceholderText: {
    ...DS.typography.body,
    color: DS.colors.textFaint,
    fontSize: 14,
  },
  imageButtonsRow: {
    flexDirection: "row",
    gap: DS.spacing.md,
  },
  imageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DS.spacing.sm,
    backgroundColor: DS.colors.primarySoft,
    borderWidth: 1,
    borderColor: DS.colors.borderSoft,
    borderRadius: DS.radius.md,
    paddingVertical: DS.spacing.md,
  },
  imageButtonPressed: {
    opacity: 0.8,
  },
  imageButtonText: {
    ...DS.typography.bodyStrong,
    color: DS.colors.primary,
    fontSize: 14,
  },
  actionSection: {
    gap: DS.spacing.md,
    marginTop: DS.spacing.md,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DS.spacing.sm,
    minHeight: 54,
    borderWidth: 1,
    borderColor: DS.colors.primary,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.primary,
    paddingHorizontal: DS.spacing.lg,
    paddingVertical: DS.spacing.md,
    ...DS.shadow.cardSoft,
  },
  submitIconBadge: {
    width: 26,
    height: 26,
    borderRadius: DS.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  submitButtonText: {
    ...DS.typography.bodyStrong,
    color: DS.colors.surface,
    fontSize: 15,
    letterSpacing: 0.2,
    fontWeight: "700",
  },
  submitButtonDisabled: {
    opacity: 0.55,
    borderColor: DS.colors.borderSoft,
    backgroundColor: DS.colors.textFaint,
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: DS.spacing.md,
  },
  deleteButtonText: {
    ...DS.typography.bodyStrong,
    color: DS.colors.danger,
    fontSize: 15,
    fontWeight: "700",
  },
  error: {
    ...DS.typography.body,
    color: DS.colors.danger,
    paddingHorizontal: DS.spacing.lg,
    paddingVertical: DS.spacing.md,
  },
});
