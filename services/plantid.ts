/**
 * Plant ID service for image-based plant identification
 * Uses plant.id API (https://plant.id/api/v3)
 */

import * as ImageManipulator from "expo-image-manipulator";

const PLANT_ID_API_URL = "https://plant.id/api/v3";
const PLANT_ID_API_KEY = "iF0Cyu5bNJbgPdca1T33LJVBK0E6F7yCgfaMry7oHtnpeSv47y";

export type PlantIdResult = {
  id: string;
  name: string;
  probability: number;
  confirmed: boolean;
  similar_images?: Array<{
    id: string;
    url: string;
    license: string;
  }>;
};

export type PlantIdResponse = {
  suggestions: PlantIdResult[];
  moderation: {
    is_plant: boolean;
    is_plant_prob: number;
  };
};

const MAX_IMAGE_WIDTH = 1280;

function stripDataUrlPrefix(value: string): string {
  if (!value.includes(",")) {
    return value;
  }

  return value.split(",")[1] ?? value;
}

/**
 * Convert image URI to base64 (for mobile)
 * Returns clean base64 string without data: prefix
 */
export async function imageUriToBase64(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_IMAGE_WIDTH } }],
      {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      },
    );

    if (result.base64) {
      return result.base64;
    }

    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultText = reader.result;
        if (typeof resultText === "string") {
          resolve(stripDataUrlPrefix(resultText));
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(
      `Failed to convert image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Normalize an image URI into a plant.id-friendly JPEG base64 payload.
 */
export async function preparePlantIdImage(uri: string, base64?: string | null): Promise<string> {
  if (base64) {
    return stripDataUrlPrefix(base64);
  }

  return imageUriToBase64(uri);
}

/**
 * Identify a plant from an image using the plant.id API
 * @param imageBase64 Base64-encoded image data (without "data:image/..." prefix)
 * @returns Plant identification results
 */
export async function identifyPlant(
  imageBase64: string,
): Promise<PlantIdResponse> {
  try {
    if (!imageBase64 || imageBase64.length === 0) {
      throw new Error("Image data is empty");
    }

    const response = await fetch(`${PLANT_ID_API_URL}/identification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": PLANT_ID_API_KEY,
      },
      body: JSON.stringify({
        images: [imageBase64],
        moderation: true,
        similar_images: true,
      }),
    });

    if (!response.ok) {
      let errorMsg = `Plant ID API error: ${response.status}`;
      try {
        const error = await response.json();
        errorMsg = error?.error || error?.message || errorMsg;
      } catch {
        // Continue with default error message
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data as PlantIdResponse;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

    // Provide helpful messages for common issues
    if (
      errorMsg.includes("Failed to fetch") ||
      errorMsg.includes("ERR_BLOCKED")
    ) {
      throw new Error(
        "Network request blocked. Please disable any ad blockers or browser extensions and try again. Android/iOS may work better due to fewer blocking restrictions.",
      );
    }

    if (errorMsg.includes("400")) {
      throw new Error(
        "Invalid image format. Please ensure you're using a clear, well-lit photo of a plant.",
      );
    }

    throw new Error(`Failed to identify plant: ${errorMsg}`);
  }
}

/**
 * Get details about a specific plant from plant.id database
 */
export async function getPlantIdDetails(plantName: string): Promise<any> {
  try {
    const response = await fetch(
      `${PLANT_ID_API_URL}/plant_details?q=${encodeURIComponent(plantName)}`,
      {
        headers: {
          "Api-Key": PLANT_ID_API_KEY,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch plant details: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `Failed to get plant details: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
