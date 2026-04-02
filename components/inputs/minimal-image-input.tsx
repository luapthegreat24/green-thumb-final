import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type PickedImage = {
  id: string;
  uri: string;
};

type MinimalImageInputProps = {
  images: PickedImage[];
  onImagesChange: (imgs: PickedImage[]) => void;
  onFeedback?: (msg: string) => void;
  maxImages?: number;
  uploadButtonLabel?: string;
};

export function MinimalImageInput({
  images,
  onImagesChange,
  onFeedback,
  maxImages = 1,
  uploadButtonLabel = "Attach Photo",
}: MinimalImageInputProps) {
  const addSampleImage = () => {
    if (images.length >= maxImages) {
      onFeedback?.(
        `You can only add up to ${maxImages} image${maxImages > 1 ? "s" : ""}.`,
      );
      return;
    }

    const next = [
      ...images,
      {
        id: `img-${Date.now()}`,
        uri: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=400&q=60",
      },
    ];

    onImagesChange(next);
    onFeedback?.("Sample photo attached");
  };

  const clearImages = () => {
    onImagesChange([]);
    onFeedback?.("Photo removed");
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={addSampleImage} style={styles.button}>
        <Text style={styles.buttonText}>{uploadButtonLabel}</Text>
      </Pressable>

      {images.length > 0 && (
        <View style={styles.row}>
          <Text style={styles.info}>1 photo attached</Text>
          <Pressable onPress={clearImages}>
            <Text style={styles.link}>Remove</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    gap: 10,
  },
  button: {
    borderWidth: 1,
    borderColor: "#2B5C36",
    backgroundColor: "#F5EFE0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#2B5C36",
    fontWeight: "700",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  info: {
    fontSize: 12,
    color: "#2E2212",
  },
  link: {
    fontSize: 12,
    color: "#B83C22",
    fontWeight: "700",
  },
});
