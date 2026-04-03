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

/**
 * Convert image URI to base64 data URL for storage in Firestore.
 * Accessible anywhere without cloud infrastructure setup.
 */
export async function convertImageToBase64(imageUri: string): Promise<string> {
  try {
    const response = await fetch(imageUri);
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
    throw new Error(
      `Failed to convert image to base64: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
