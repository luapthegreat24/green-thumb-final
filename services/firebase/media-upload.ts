import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export function isLocalMediaUri(uri: string) {
  return (
    uri.startsWith("file://") ||
    uri.startsWith("content://") ||
    uri.startsWith("ph://") ||
    uri.startsWith("assets-library://") ||
    uri.startsWith("blob:") ||
    uri.startsWith("data:image/")
  );
}

const MAX_IMAGE_BYTES = 900_000;
const IMAGE_WIDTH_STEPS = [1600, 1280, 1024, 800];
const IMAGE_COMPRESS_STEPS = [0.82, 0.7, 0.58];

async function getImageBlobSize(imageUri: string) {
  const response = await fetch(imageUri);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: HTTP ${response.status}`);
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new Error("Image blob is empty or invalid");
  }

  return blob.size;
}

async function prepareImageUri(imageUri: string) {
  const size = await getImageBlobSize(imageUri);
  if (size <= MAX_IMAGE_BYTES) {
    return imageUri;
  }

  for (const width of IMAGE_WIDTH_STEPS) {
    for (const compress of IMAGE_COMPRESS_STEPS) {
      const result = await manipulateAsync(imageUri, [{ resize: { width } }], {
        compress,
        format: SaveFormat.JPEG,
      });

      const resizedSize = await getImageBlobSize(result.uri);
      if (resizedSize <= MAX_IMAGE_BYTES) {
        return result.uri;
      }
    }
  }

  throw new Error(
    "Image is too large to upload. Please choose a smaller photo or crop it before trying again.",
  );
}

/**
 * Convert image URI to base64 data URL for storage in Firestore.
 * Accessible anywhere without cloud infrastructure setup.
 */
export async function convertImageToBase64(imageUri: string): Promise<string> {
  try {
    const preparedImageUri = await prepareImageUri(imageUri);
    const response = await fetch(preparedImageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error("Image blob is empty or invalid");
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error("Failed to read image as base64"));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Image is too large to upload")
    ) {
      throw error;
    }

    throw new Error(
      `Failed to convert image to base64: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
