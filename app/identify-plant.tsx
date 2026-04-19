import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  identifyPlant,
  preparePlantIdImage,
  PlantIdResponse,
} from "@/services/plantid";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export default function IdentifyPlantScreen() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlantIdResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async (source: "camera" | "gallery") => {
    try {
      Haptics.selectionAsync();
      setError(null);
      let result;

      if (source === "camera") {
        const cameraPermission =
          await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          Alert.alert("Permission Denied", "Camera access is required");
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          aspect: [1, 1],
          allowsEditing: true,
          base64: true,
        });
      } else {
        const galleryPermission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!galleryPermission.granted) {
          Alert.alert("Permission Denied", "Gallery access is required");
          return;
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          aspect: [1, 1],
          allowsEditing: true,
          base64: true,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setResults(null);
        await identifyPlantImage(result.assets[0].uri, result.assets[0].base64 ?? undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pick image");
    }
  };

  const identifyPlantImage = async (imageUri: string, imageBase64?: string) => {
    try {
      setLoading(true);
      setError(null);

      const base64 = await preparePlantIdImage(imageUri, imageBase64 ?? null);

      if (!base64 || base64.length === 0) {
        setError("Failed to process image. Please try another photo.");
        setLoading(false);
        return;
      }

      // Identify the plant
      const identificationResults = await identifyPlant(base64);

      if (!identificationResults.moderation.is_plant) {
        setError(
          `This doesn't appear to be a plant image. Confidence: ${(
            identificationResults.moderation.is_plant_prob * 100
          ).toFixed(1)}%`,
        );
        setResults(null);
        return;
      }

      setResults(identificationResults);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to identify plant";
      setError(errorMsg);
      setResults(null);

      // Log error for debugging
      console.error("Plant identification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResultPress = (plantName: string) => {
    Haptics.selectionAsync();
    // Navigate to Trefle search with the plant name
    router.push({
      pathname: "/(tabs)/plants",
      params: { searchQuery: plantName },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Preview */}
        {selectedImage && (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.previewImage}
            />
            <Pressable
              style={({ pressed }) => [
                styles.clearButton,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedImage(null);
                setResults(null);
                setError(null);
              }}
            >
              <ThemedText style={styles.clearButtonText}>
                Clear Image
              </ThemedText>
            </Pressable>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <ThemedText style={styles.loadingText}>
              Identifying plant...
            </ThemedText>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <ThemedText style={styles.errorHint}>
              Best results: bright light, a single plant, sharp leaves, and no heavy background clutter.
            </ThemedText>
            {Platform.OS === "web" && (
              <ThemedText style={styles.errorHint}>
                💡 On web, use a JPG or PNG photo when possible. If the camera flow fails, use Upload Image instead.
              </ThemedText>
            )}
          </View>
        )}

        {/* Results */}
        {results && results.suggestions.length > 0 && (
          <View style={styles.resultsContainer}>
            <ThemedText style={styles.resultsTitle}>Top Matches</ThemedText>
            {results.suggestions.slice(0, 5).map((suggestion, idx) => (
              <Pressable
                key={idx}
                style={({ pressed }) => [
                  styles.resultItem,
                  pressed && styles.pressed,
                ]}
                onPress={() => handleResultPress(suggestion.name)}
              >
                <View style={styles.resultContent}>
                  <ThemedText style={styles.resultName}>
                    {suggestion.name}
                  </ThemedText>
                  <ThemedText style={styles.resultProbability}>
                    {(suggestion.probability * 100).toFixed(1)}% confidence
                  </ThemedText>
                </View>
                {suggestion.similar_images && suggestion.similar_images[0] && (
                  <Image
                    source={{ uri: suggestion.similar_images[0].url }}
                    style={styles.resultImage}
                  />
                )}
              </Pressable>
            ))}
            <ThemedText style={styles.disclaimerText}>
              Tap a result to search for more details in Trefle database
            </ThemedText>
          </View>
        )}

        {/* No Selection State */}
        {!selectedImage && !loading && (
          <View style={styles.noImageContainer}>
            <ThemedText style={styles.noImageText}>
              Take a photo or upload an image to identify a plant
            </ThemedText>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.cameraButton,
              pressed && styles.pressed,
            ]}
            onPress={() => pickImage("camera")}
            disabled={loading}
            hitSlop={8}
          >
            <ThemedText style={styles.buttonText}>📷 Take Photo</ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.galleryButton,
              pressed && styles.pressed,
            ]}
            onPress={() => pickImage("gallery")}
            disabled={loading}
            hitSlop={8}
          >
            <ThemedText style={styles.buttonText}>🖼️ Upload Image</ThemedText>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <ThemedText style={styles.closeButtonText}>Close</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  pressed: {
    opacity: 0.7,
  },
  previewContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  clearButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#ff6b6b",
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  clearButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#c62828",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
  },
  errorHint: {
    color: "#c62828",
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
    opacity: 0.9,
  },
  noImageContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noImageText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
  },
  resultsContainer: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  resultItem: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    minHeight: 80,
  },
  resultContent: {
    flex: 1,
    marginRight: 16,
  },
  resultName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 6,
  },
  resultProbability: {
    fontSize: 14,
    opacity: 0.7,
  },
  resultImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  cameraButton: {
    backgroundColor: "#4CAF50",
  },
  galleryButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#999",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
