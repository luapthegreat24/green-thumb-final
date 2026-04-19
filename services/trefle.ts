import { Platform } from "react-native";

const TREFLE_BASE_URL = "https://trefle.io/api/v1";
const TREFLE_PROXY_BASE_URL =
  process.env.EXPO_PUBLIC_TREFLE_PROXY_URL || "http://127.0.0.1:8787";

type TrefleImage = {
  url?: string;
};

export type TreflePlant = {
  id: number;
  common_name?: string | null;
  scientific_name?: string | null;
  image_url?: string | null;
  description?: string | null;
  family_common_name?: string | null;
  main_species?: {
    growth?: {
      description?: string | null;
    };
  };
  images?: TrefleImage[];
};

export type PlantSummary = {
  id: number;
  commonName: string;
  scientificName: string;
  imageUrl: string | null;
};

export type PlantDetails = PlantSummary & {
  description: string;
  familyCommonName: string | null;
};

const getApiKey = () => {
  const apiKey = process.env.EXPO_PUBLIC_TREFLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_TREFLE_API_KEY");
  }
  return apiKey;
};

const buildUrl = (path: string, params: Record<string, string>) => {
  const baseUrl =
    Platform.OS === "web" ? TREFLE_PROXY_BASE_URL : TREFLE_BASE_URL;
  const url = new URL(`${baseUrl}${path}`);
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  return url.toString();
};

const normalizePlant = (plant: TreflePlant): PlantSummary => ({
  id: plant.id,
  commonName: plant.common_name?.trim() || "Unknown common name",
  scientificName: plant.scientific_name?.trim() || "Unknown scientific name",
  imageUrl: plant.image_url || plant.images?.[0]?.url || null,
});

const normalizePlantDetails = (plant: TreflePlant): PlantDetails => ({
  ...normalizePlant(plant),
  description:
    plant.main_species?.growth?.description?.trim() ||
    plant.description?.trim() ||
    "No description available.",
  familyCommonName: plant.family_common_name?.trim() || null,
});

export async function searchPlants(query: string): Promise<PlantSummary[]> {
  let response: Response;
  try {
    response = await fetch(
      buildUrl("/plants/search", {
        token: getApiKey(),
        q: query,
      }),
    );
  } catch (err) {
    const details = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`Failed to search plants: ${details}`);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error || "Failed to search plants");
  }

  const json = await response.json();
  const plants: TreflePlant[] = json?.data ?? [];
  return plants.map(normalizePlant);
}

export async function getPlantDetails(plantId: number): Promise<PlantDetails> {
  let response: Response;
  try {
    response = await fetch(
      buildUrl(`/plants/${plantId}`, {
        token: getApiKey(),
      }),
    );
  } catch (err) {
    const details = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`Failed to fetch plant details: ${details}`);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error || "Failed to fetch plant details");
  }

  const json = await response.json();
  return normalizePlantDetails(json?.data as TreflePlant);
}
