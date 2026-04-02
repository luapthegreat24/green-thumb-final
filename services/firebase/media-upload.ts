import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { firebaseStorage } from "@/lib/firebase";

const DATA_URI_REGEX = /^data:(.+);base64,(.+)$/;

function isWebRuntime() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function detectImageExtensionFromMime(mimeType: string) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}

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

export async function uploadImageUri(
  storagePathWithoutExtension: string,
  imageUri: string,
): Promise<string> {
  const dataUriMatch = imageUri.match(DATA_URI_REGEX);
  if (dataUriMatch) {
    // Keep data URIs inline for now. On web this avoids Storage CORS during local dev,
    // and on native it avoids RN BlobManager issues in Firebase SDK uploadString.
    if (isWebRuntime()) {
      return imageUri;
    }
    return imageUri;
  }

  const response = await fetch(imageUri);
  const blob = await response.blob();
  const mimeType = blob.type || "image/jpeg";
  const extension = detectImageExtensionFromMime(mimeType);
  const storageRef = ref(
    firebaseStorage,
    `${storagePathWithoutExtension}.${extension}`,
  );

  await uploadBytes(storageRef, blob, { contentType: mimeType });
  return await getDownloadURL(storageRef);
}
