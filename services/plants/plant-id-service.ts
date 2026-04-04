const PLANT_ID_API_KEY = "iF0Cyu5bNJbgPdca1T33LJVBK0E6F7yCgfaMry7oHtnpeSv47y";
const PLANT_ID_BASE_URL = "https://plant.id/api/v3";

type PlantIdSuggestion = {
  id?: number | string;
  name?: string;
  probability?: number;
};

type PlantIdIdentificationResponse = {
  result?: {
    classification?: {
      suggestions?: PlantIdSuggestion[];
    };
  };
};

export type PlantIdMatch = {
  scientificName: string | null;
};

export type PlantIdImageInput = {
  base64?: string;
  imageUrl?: string;
};

export async function identifyPlant(input: PlantIdImageInput) {
  const imagePayload = input.base64?.trim() || input.imageUrl?.trim();
  if (!imagePayload) {
    throw new Error("Missing image input for Plant.id request.");
  }

  const response = await fetch(`${PLANT_ID_BASE_URL}/identification`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Api-Key": PLANT_ID_API_KEY,
    },
    body: JSON.stringify({
      images: [imagePayload],
      classification_level: "species",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Plant.id request failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as PlantIdIdentificationResponse;
  const topSuggestion =
    payload.result?.classification?.suggestions?.[0] ?? null;

  const scientificName = topSuggestion?.name?.trim() || null;
  if (!scientificName) {
    throw new Error("No plant name found in identification result.");
  }

  return {
    scientificName,
  } satisfies PlantIdMatch;
}
