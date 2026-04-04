import { requestGroqReply } from "@/lib/groq-chat";

const TREFLE_API_TOKEN = "usr-J4Eb0gQoSZBCKdepwO-PRuBEHyVVrj63lZIAhxsQ_R4";
const TREFLE_BASE_URL = "https://trefle.io/api/v1";

export type TreflePlantCard = {
  id: string;
  commonName: string;
  scientificName: string;
  imageUri: string;
};

export type TreflePlantProfile = TreflePlantCard & {
  family: string | null;
  genus: string | null;
  rank: string | null;
  author: string | null;
  year: string | null;
  observations: string | null;
  edible: boolean | null;
  status: string | null;
  light: number | null;
  atmosphericHumidity: number | null;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  minPrecipMm: number | null;
  maxPrecipMm: number | null;
  daysToHarvest: number | null;
  growthMonths: string[] | null;
  fruitMonths: string[] | null;
};

type TrefleSearchItem = {
  id?: number | string;
  slug?: string;
  common_name?: string | null;
  scientific_name?: string | null;
  image_url?: string | null;
};

type TrefleSpeciesItem = {
  id?: number | string;
  slug?: string;
  common_name?: string | null;
  scientific_name?: string | null;
  image_url?: string | null;
  family?: string | null;
  genus?: string | null;
  rank?: string | null;
  author?: string | null;
  year?: number | null;
  observations?: string | null;
  edible?: boolean | null;
  status?: string | null;
  main_species?: {
    growth?: {
      light?: number | null;
      atmospheric_humidity?: number | null;
      minimum_temperature?: { deg_c?: number | null } | null;
      maximum_temperature?: { deg_c?: number | null } | null;
      minimum_precipitation?: { mm?: number | null } | null;
      maximum_precipitation?: { mm?: number | null } | null;
      days_to_harvest?: number | null;
    } | null;
    specifications?: {
      growth_months?: string[] | null;
      fruit_months?: string[] | null;
    } | null;
  } | null;
};

type TrefleSearchResponse = {
  data?: TrefleSearchItem[];
};

type TrefleSpeciesResponse = {
  data?: TrefleSpeciesItem | null;
};

type AiProfileEnrichment = {
  observations: string | null;
  family: string | null;
  genus: string | null;
  rank: string | null;
  author: string | null;
  year: string | null;
  status: string | null;
  edible: boolean | null;
  light: number | null;
  atmosphericHumidity: number | null;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  minPrecipMm: number | null;
  maxPrecipMm: number | null;
  daysToHarvest: number | null;
  growthMonths: string[] | null;
  fruitMonths: string[] | null;
};

function toStringId(value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function normalizeCard(item: TrefleSearchItem): TreflePlantCard | null {
  const id = toStringId(item.slug ?? item.id);
  const scientificName = item.scientific_name?.trim() ?? "";
  const commonName = item.common_name?.trim() || scientificName || id;

  if (!id || !scientificName) return null;

  return {
    id,
    commonName,
    scientificName,
    imageUri:
      item.image_url ??
      "https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=600&q=60",
  };
}

function normalizeProfile(item: TrefleSpeciesItem): TreflePlantProfile | null {
  const card = normalizeCard(item);
  if (!card) return null;
  const growth = item.main_species?.growth;
  const specs = item.main_species?.specifications;

  return {
    ...card,
    family: item.family ?? null,
    genus: item.genus ?? null,
    rank: item.rank ?? null,
    author: item.author ?? null,
    year: typeof item.year === "number" ? String(item.year) : null,
    observations: item.observations ?? null,
    edible: typeof item.edible === "boolean" ? item.edible : null,
    status: item.status ?? null,
    light: typeof growth?.light === "number" ? growth.light : null,
    atmosphericHumidity:
      typeof growth?.atmospheric_humidity === "number"
        ? growth.atmospheric_humidity
        : null,
    minTemperatureC:
      typeof growth?.minimum_temperature?.deg_c === "number"
        ? growth.minimum_temperature.deg_c
        : null,
    maxTemperatureC:
      typeof growth?.maximum_temperature?.deg_c === "number"
        ? growth.maximum_temperature.deg_c
        : null,
    minPrecipMm:
      typeof growth?.minimum_precipitation?.mm === "number"
        ? growth.minimum_precipitation.mm
        : null,
    maxPrecipMm:
      typeof growth?.maximum_precipitation?.mm === "number"
        ? growth.maximum_precipitation.mm
        : null,
    daysToHarvest:
      typeof growth?.days_to_harvest === "number"
        ? growth.days_to_harvest
        : null,
    growthMonths: Array.isArray(specs?.growth_months)
      ? specs.growth_months.filter((v): v is string => typeof v === "string")
      : null,
    fruitMonths: Array.isArray(specs?.fruit_months)
      ? specs.fruit_months.filter((v): v is string => typeof v === "string")
      : null,
  };
}

async function trefleJson<T>(path: string) {
  const response = await fetch(`${TREFLE_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${TREFLE_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Trefle request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as T;
}

function safeJsonObject(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.replace(/^```json\s*/i, "").replace(/```$/, "");
  const match = fenced.match(/\{[\s\S]*\}/);
  const candidate = match ? match[0] : fenced;

  try {
    return JSON.parse(candidate) as Partial<AiProfileEnrichment>;
  } catch {
    return null;
  }
}

async function enrichProfileWithGroq(profile: TreflePlantProfile) {
  const payload = {
    commonName: profile.commonName,
    scientificName: profile.scientificName,
    known: {
      observations: profile.observations,
      family: profile.family,
      genus: profile.genus,
      rank: profile.rank,
      author: profile.author,
      year: profile.year,
      status: profile.status,
      edible: profile.edible,
      light: profile.light,
      atmosphericHumidity: profile.atmosphericHumidity,
      minTemperatureC: profile.minTemperatureC,
      maxTemperatureC: profile.maxTemperatureC,
      minPrecipMm: profile.minPrecipMm,
      maxPrecipMm: profile.maxPrecipMm,
      daysToHarvest: profile.daysToHarvest,
      growthMonths: profile.growthMonths,
      fruitMonths: profile.fruitMonths,
    },
  };

  try {
    const reply = await requestGroqReply([
      {
        role: "system",
        content:
          "You enhance botanical profile fields with factual language. Return ONLY valid JSON with keys: observations, family, genus, rank, author, year, status, edible, light, atmosphericHumidity, minTemperatureC, maxTemperatureC, minPrecipMm, maxPrecipMm, daysToHarvest, growthMonths, fruitMonths. Use null when unknown.",
      },
      {
        role: "user",
        content: `Enhance this plant profile and provide the best final values for these keys.\n\n${JSON.stringify(payload)}`,
      },
    ]);

    const json = safeJsonObject(reply);
    if (!json) return profile;

    const merged: TreflePlantProfile = {
      ...profile,
      observations:
        (typeof json.observations === "string" ? json.observations : null) ??
        profile.observations,
      family:
        (typeof json.family === "string" ? json.family : null) ??
        profile.family,
      genus:
        (typeof json.genus === "string" ? json.genus : null) ?? profile.genus,
      rank: (typeof json.rank === "string" ? json.rank : null) ?? profile.rank,
      author:
        (typeof json.author === "string" ? json.author : null) ??
        profile.author,
      year: (typeof json.year === "string" ? json.year : null) ?? profile.year,
      status:
        (typeof json.status === "string" ? json.status : null) ??
        profile.status,
      edible: typeof json.edible === "boolean" ? json.edible : profile.edible,
      light: typeof json.light === "number" ? json.light : profile.light,
      atmosphericHumidity:
        typeof json.atmosphericHumidity === "number"
          ? json.atmosphericHumidity
          : profile.atmosphericHumidity,
      minTemperatureC:
        typeof json.minTemperatureC === "number"
          ? json.minTemperatureC
          : profile.minTemperatureC,
      maxTemperatureC:
        typeof json.maxTemperatureC === "number"
          ? json.maxTemperatureC
          : profile.maxTemperatureC,
      minPrecipMm:
        typeof json.minPrecipMm === "number"
          ? json.minPrecipMm
          : profile.minPrecipMm,
      maxPrecipMm:
        typeof json.maxPrecipMm === "number"
          ? json.maxPrecipMm
          : profile.maxPrecipMm,
      daysToHarvest:
        typeof json.daysToHarvest === "number"
          ? json.daysToHarvest
          : profile.daysToHarvest,
      growthMonths: Array.isArray(json.growthMonths)
        ? json.growthMonths.filter((v): v is string => typeof v === "string")
        : profile.growthMonths,
      fruitMonths: Array.isArray(json.fruitMonths)
        ? json.fruitMonths.filter((v): v is string => typeof v === "string")
        : profile.fruitMonths,
    };

    return merged;
  } catch {
    return profile;
  }
}

export async function searchDictionaryPlants(query: string) {
  const normalized = query.trim();
  if (!normalized) return [] as TreflePlantCard[];

  const response = await trefleJson<TrefleSearchResponse>(
    `/species/search?q=${encodeURIComponent(normalized)}&page=1`,
  );

  return (response.data ?? [])
    .map(normalizeCard)
    .filter((item): item is TreflePlantCard => item !== null)
    .slice(0, 20);
}

export async function getDictionaryPlantProfile(idOrSlug: string) {
  const normalized = idOrSlug.trim();
  if (!normalized) return null;

  const response = await trefleJson<TrefleSpeciesResponse>(
    `/species/${encodeURIComponent(normalized)}`,
  );

  if (!response.data) return null;

  const normalizedProfile = normalizeProfile(response.data);
  if (!normalizedProfile) return null;

  return enrichProfileWithGroq(normalizedProfile);
}
