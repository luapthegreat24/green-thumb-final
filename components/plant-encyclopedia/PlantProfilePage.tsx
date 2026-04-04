import React, { useEffect, useMemo, useState } from "react";

import { requestGroqReply } from "@/lib/groq-chat";

export interface TrefleSpeciesResponse {
  data: TrefleSpeciesData;
  meta?: {
    last_modified?: string | null;
    images_count?: number | null;
    sources_count?: number | null;
    synonyms_count?: number | null;
  };
}

export interface TrefleSpeciesData {
  id: number | string;
  common_name: string | null;
  slug: string | null;
  scientific_name: string | null;
  year: number | null;
  bibliography: string | null;
  author: string | null;
  status: string | null;
  rank: string | null;
  family_common_name: string | null;
  genus_id: number | null;
  image_url: string | null;
  genus: string | null;
  family: string | null;
  duration: string[] | null;
  edible_part: string[] | null;
  edible: boolean | null;
  vegetable: boolean | null;
  observations: string | null;
  taxonomy?: TrefleTaxonomicRank | null;
  main_species?: TrefleMainSpecies | null;
  images?: {
    flower?: Array<{
      id: number;
      url: string;
      copyright: string | null;
    }> | null;
    leaf?: Array<{ id: number; url: string; copyright: string | null }> | null;
    habit?: Array<{ id: number; url: string; copyright: string | null }> | null;
    fruit?: Array<{ id: number; url: string; copyright: string | null }> | null;
    bark?: Array<{ id: number; url: string; copyright: string | null }> | null;
    other?: Array<{ id: number; url: string; copyright: string | null }> | null;
  } | null;
  common_names?: Record<string, string[]> | null;
  distributions?: {
    native?: Array<{ id: number; name: string; slug: string }> | null;
    introduced?: Array<{ id: number; name: string; slug: string }> | null;
    doubtful?: Array<{ id: number; name: string; slug: string }> | null;
    absent?: Array<{ id: number; name: string; slug: string }> | null;
    extinct?: Array<{ id: number; name: string; slug: string }> | null;
  } | null;
  synonyms?: Array<{ id: number; name: string; author: string | null }> | null;
  sources?: Array<{
    id: string;
    name: string;
    url: string | null;
    citation: string | null;
  }> | null;
}

export interface TrefleTaxonomicRank {
  kingdom?: string | null;
  subkingdom?: string | null;
  division?: string | null;
  class?: string | null;
  order?: string | null;
  family?: string | null;
  genus?: string | null;
}

export interface TrefleMainSpecies {
  specifications?: TrefleSpecifications | null;
  flower?: TrefleFlower | null;
  foliage?: TrefleFoliage | null;
  fruit_or_seed?: TrefleFruitOrSeed | null;
  growth?: TrefleGrowth | null;
}

export interface TrefleSpecifications {
  growth_habit?: string | null;
  growth_form?: string | null;
  growth_rate?: string | null;
  average_height?: {
    cm?: number | null;
    m?: number | null;
  } | null;
  maximum_height?: {
    cm?: number | null;
    m?: number | null;
  } | null;
  shape_and_orientation?: string | null;
  toxicity?: string | null;
  ligneous_type?: string | null;
  bloom_months?: string[] | null;
  fruit_months?: string[] | null;
  growth_months?: string[] | null;
  planting_days_to_harvest?: number | null;
  planting_row_spacing_cm?: number | null;
  planting_spread_cm?: number | null;
  fruit_seed_persistence?: string | null;
}

export interface TrefleFlower {
  color?: string[] | null;
  conspicuous?: boolean | null;
}

export interface TrefleFoliage {
  color?: string[] | null;
  texture?: string | null;
  leaf_retention?: boolean | null;
}

export interface TrefleFruitOrSeed {
  conspicuous?: boolean | null;
  color?: string[] | null;
  shape?: string | null;
}

export interface TrefleGrowth {
  description?: string | null;
  days_to_harvest?: number | null;
  ph_minimum?: number | null;
  ph_maximum?: number | null;
  light?: number | null;
  atmospheric_humidity?: number | null;
  ground_humidity?: number | null;
  minimum_precipitation?: {
    mm?: number | null;
  } | null;
  maximum_precipitation?: {
    mm?: number | null;
  } | null;
  minimum_temperature?: {
    deg_c?: number | null;
  } | null;
  maximum_temperature?: {
    deg_c?: number | null;
  } | null;
  soil_nutriments?: number | null;
  soil_salinity?: number | null;
  soil_texture?: string | null;
  frost_free_days_minimum?: number | null;
  minimum_root_depth_cm?: number | null;
  bloom_months?: string[] | null;
  fruit_months?: string[] | null;
  growth_months?: string[] | null;
}

export interface PlantProfilePageProps {
  species: TrefleSpeciesResponse | TrefleSpeciesData;
  className?: string;
}

type AiSpeciesEnrichment = {
  observations?: string | null;
  family?: string | null;
  genus?: string | null;
  rank?: string | null;
  author?: string | null;
  year?: number | null;
  status?: string | null;
  family_common_name?: string | null;
  duration?: string[] | null;
  edible_part?: string[] | null;
  edible?: boolean | null;
  vegetable?: boolean | null;
  growth_description?: string | null;
  growth_habit?: string | null;
  growth_form?: string | null;
  growth_rate?: string | null;
  toxicity?: string | null;
  light?: number | null;
  atmospheric_humidity?: number | null;
  soil_texture?: string | null;
};

const serifHeading = "font-serif tracking-tight text-zinc-900";
const bodyText = "text-sm leading-6 text-zinc-700";
const softCard =
  "rounded-[28px] border border-emerald-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]";

function hasValue(value: unknown): value is string | number | boolean {
  return value !== null && value !== undefined && value !== "";
}

function toArrayText(value?: string[] | null) {
  const items = (value ?? []).map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items.join(", ") : null;
}

function formatBool(
  value: boolean | null | undefined,
  truthy: string,
  falsy: string,
) {
  if (value === null || value === undefined) return null;
  return value ? truthy : falsy;
}

function formatHeight(
  height?: { cm?: number | null; m?: number | null } | null,
) {
  if (!height) return null;
  if (hasValue(height.m)) return `${height.m} m`;
  if (hasValue(height.cm)) return `${height.cm} cm`;
  return null;
}

function describeLight(light?: number | null) {
  if (light === null || light === undefined) return null;
  if (light <= 3) return "Low-light tolerant";
  if (light <= 6) return "Moderate light";
  if (light <= 8) return "Bright light";
  return "Full sun";
}

function describeHumidity(humidity?: number | null) {
  if (humidity === null || humidity === undefined) return null;
  if (humidity <= 3) return "Dry-air tolerant";
  if (humidity <= 6) return "Average humidity";
  if (humidity <= 8) return "Humid conditions preferred";
  return "High humidity required";
}

function describeTemperature(minTemp?: number | null, maxTemp?: number | null) {
  if (minTemp === null || minTemp === undefined) {
    if (maxTemp === null || maxTemp === undefined) return null;
    return `Performs up to ${maxTemp}°C`;
  }
  if (maxTemp === null || maxTemp === undefined) {
    return `Performs from ${minTemp}°C`;
  }
  return `Best between ${minTemp}°C and ${maxTemp}°C`;
}

function describePrecipitation(
  minPrecip?: number | null,
  maxPrecip?: number | null,
) {
  if (minPrecip === null || minPrecip === undefined) {
    if (maxPrecip === null || maxPrecip === undefined) return null;
    return `Needs up to ${maxPrecip} mm rainfall`;
  }
  if (maxPrecip === null || maxPrecip === undefined) {
    return `Needs at least ${minPrecip} mm rainfall`;
  }
  return `Prefers ${minPrecip}-${maxPrecip} mm rainfall`;
}

function toTaxonomyRows(species: TrefleSpeciesData) {
  const taxonomy = species.taxonomy;
  const rows = [
    { label: "Kingdom", value: taxonomy?.kingdom },
    { label: "Subkingdom", value: taxonomy?.subkingdom },
    { label: "Division", value: taxonomy?.division },
    { label: "Class", value: taxonomy?.class },
    { label: "Order", value: taxonomy?.order },
    { label: "Family", value: taxonomy?.family ?? species.family },
    { label: "Genus", value: taxonomy?.genus ?? species.genus },
  ];

  return rows.filter((row) => hasValue(row.value));
}

function parseAiJson(raw: string) {
  const trimmed = raw.trim();
  const unfenced = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/, "");
  const match = unfenced.match(/\{[\s\S]*\}/);
  const candidate = match ? match[0] : unfenced;

  try {
    return JSON.parse(candidate) as AiSpeciesEnrichment;
  } catch {
    return null;
  }
}

async function enrichSpeciesWithGroq(species: TrefleSpeciesData) {
  try {
    const reply = await requestGroqReply([
      {
        role: "system",
        content:
          "You enhance plant profile entries using factual botanical language. Return ONLY valid JSON with keys: observations, family, genus, rank, author, year, status, family_common_name, duration, edible_part, edible, vegetable, growth_description, growth_habit, growth_form, growth_rate, toxicity, light, atmospheric_humidity, soil_texture. Provide concise, useful values. Use null when truly unknown.",
      },
      {
        role: "user",
        content: `Enhance this profile and provide the best final values for all keys below.\n\n${JSON.stringify(
          {
            common_name: species.common_name,
            scientific_name: species.scientific_name,
            known: {
              observations: species.observations,
              family: species.family,
              genus: species.genus,
              rank: species.rank,
              author: species.author,
              year: species.year,
              status: species.status,
              family_common_name: species.family_common_name,
              duration: species.duration,
              edible_part: species.edible_part,
              edible: species.edible,
              vegetable: species.vegetable,
              growth_habit: species.main_species?.specifications?.growth_habit,
              growth_form: species.main_species?.specifications?.growth_form,
              growth_rate: species.main_species?.specifications?.growth_rate,
              toxicity: species.main_species?.specifications?.toxicity,
              growth_description: species.main_species?.growth?.description,
              light: species.main_species?.growth?.light,
              atmospheric_humidity:
                species.main_species?.growth?.atmospheric_humidity,
              soil_texture: species.main_species?.growth?.soil_texture,
            },
          },
        )}`,
      },
    ]);

    const ai = parseAiJson(reply);
    if (!ai) return species;

    return {
      ...species,
      observations:
        (typeof ai.observations === "string" ? ai.observations : null) ??
        species.observations,
      family:
        (typeof ai.family === "string" ? ai.family : null) ?? species.family,
      genus: (typeof ai.genus === "string" ? ai.genus : null) ?? species.genus,
      rank: (typeof ai.rank === "string" ? ai.rank : null) ?? species.rank,
      author:
        (typeof ai.author === "string" ? ai.author : null) ?? species.author,
      year:
        (typeof ai.year === "number" && Number.isFinite(ai.year)
          ? ai.year
          : null) ?? species.year,
      status:
        (typeof ai.status === "string" ? ai.status : null) ?? species.status,
      family_common_name:
        (typeof ai.family_common_name === "string"
          ? ai.family_common_name
          : null) ?? species.family_common_name,
      duration:
        (Array.isArray(ai.duration)
          ? ai.duration.filter((v): v is string => typeof v === "string")
          : null) ?? species.duration,
      edible_part:
        (Array.isArray(ai.edible_part)
          ? ai.edible_part.filter((v): v is string => typeof v === "string")
          : null) ?? species.edible_part,
      edible: typeof ai.edible === "boolean" ? ai.edible : species.edible,
      vegetable:
        typeof ai.vegetable === "boolean" ? ai.vegetable : species.vegetable,
      main_species: {
        ...species.main_species,
        specifications: {
          ...species.main_species?.specifications,
          growth_habit:
            (typeof ai.growth_habit === "string" ? ai.growth_habit : null) ??
            species.main_species?.specifications?.growth_habit,
          growth_form:
            (typeof ai.growth_form === "string" ? ai.growth_form : null) ??
            species.main_species?.specifications?.growth_form,
          growth_rate:
            (typeof ai.growth_rate === "string" ? ai.growth_rate : null) ??
            species.main_species?.specifications?.growth_rate,
          toxicity:
            (typeof ai.toxicity === "string" ? ai.toxicity : null) ??
            species.main_species?.specifications?.toxicity,
        },
        growth: {
          ...species.main_species?.growth,
          description:
            (typeof ai.growth_description === "string"
              ? ai.growth_description
              : null) ?? species.main_species?.growth?.description,
          light:
            (typeof ai.light === "number" && Number.isFinite(ai.light)
              ? ai.light
              : null) ?? species.main_species?.growth?.light,
          atmospheric_humidity:
            (typeof ai.atmospheric_humidity === "number" &&
            Number.isFinite(ai.atmospheric_humidity)
              ? ai.atmospheric_humidity
              : null) ?? species.main_species?.growth?.atmospheric_humidity,
          soil_texture:
            (typeof ai.soil_texture === "string" ? ai.soil_texture : null) ??
            species.main_species?.growth?.soil_texture,
        },
      },
    };
  } catch {
    return species;
  }
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className={`${serifHeading} text-xl`}>{children}</h2>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-zinc-900">{value}</div>
    </div>
  );
}

function IconChip({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-lg text-emerald-700">
          {icon}
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            {label}
          </div>
          <div className="mt-1 text-sm text-zinc-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

export function PlantProfilePage({
  species: input,
  className,
}: PlantProfilePageProps) {
  const baseSpecies = useMemo(
    () => ("data" in input ? input.data : input),
    [input],
  );
  const [species, setSpecies] = useState<TrefleSpeciesData>(baseSpecies);

  useEffect(() => {
    let active = true;
    setSpecies(baseSpecies);

    void (async () => {
      const enriched = await enrichSpeciesWithGroq(baseSpecies);
      if (active) setSpecies(enriched);
    })();

    return () => {
      active = false;
    };
  }, [baseSpecies]);

  const taxonomyRows = toTaxonomyRows(species);
  const main = species.main_species;
  const specs = main?.specifications;
  const growth = main?.growth;
  const flower = main?.flower;
  const foliage = main?.foliage;
  const fruit = main?.fruit_or_seed;

  const commonName =
    species.common_name ?? species.scientific_name ?? "Unknown plant";
  const scientificLine = [species.scientific_name, species.author]
    .filter(Boolean)
    .join(" ");
  const descriptionText =
    species.observations ??
    growth?.description ??
    `${commonName} is a botanical species${species.family ? ` in the ${species.family} family` : ""}${species.genus ? ` and genus ${species.genus}` : ""}.`;

  // Reference metadata
  const duration = toArrayText(species.duration);
  const ediblePart = toArrayText(species.edible_part);
  const scientificRank = species.rank ?? null;
  const familyCommonName = species.family_common_name ?? null;
  const bibliography = species.bibliography ?? null;

  // Flower info
  const flowerColors = toArrayText(flower?.color ?? null);
  const flowerConspicuous = formatBool(flower?.conspicuous, "Yes", "No");
  const bloomMonths = toArrayText(specs?.bloom_months ?? null);

  // Foliage info
  const foliageColors = toArrayText(foliage?.color ?? null);
  const leafRetention = formatBool(
    foliage?.leaf_retention,
    "Evergreen",
    "Deciduous",
  );
  const foliageTexture = foliage?.texture ?? null;

  // Fruit info
  const fruitColors = toArrayText(fruit?.color ?? null);
  const fruitShape = fruit?.shape ?? null;
  const fruitConspicuous = formatBool(fruit?.conspicuous, "Yes", "No");
  const fruitMonths = toArrayText(specs?.fruit_months ?? null);
  const fruitSeedPersistence = specs?.fruit_seed_persistence ?? null;

  // Height
  const averageHeight = formatHeight(specs?.average_height ?? null);
  const maximumHeight = formatHeight(specs?.maximum_height ?? null);

  // Growth specs
  const growthHabit = specs?.growth_habit ?? null;
  const growthForm = specs?.growth_form ?? null;
  const growthRate = specs?.growth_rate ?? null;
  const shapeOrientation = specs?.shape_and_orientation ?? null;
  const growthDescription = growth?.description ?? null;
  const growthMonths = toArrayText(specs?.growth_months ?? null);
  const ligneous = specs?.ligneous_type ?? null;

  // Environmental conditions
  const light = growth?.light;
  const atmosphericHumidity = growth?.atmospheric_humidity ?? null;
  const groundHumidity = growth?.ground_humidity ?? null;
  const minPrecip = growth?.minimum_precipitation?.mm ?? null;
  const maxPrecip = growth?.maximum_precipitation?.mm ?? null;
  const minTemp = growth?.minimum_temperature?.deg_c ?? null;
  const maxTemp = growth?.maximum_temperature?.deg_c ?? null;
  const phMin = growth?.ph_minimum ?? null;
  const phMax = growth?.ph_maximum ?? null;
  const soilTexture = growth?.soil_texture ?? null;
  const soilNutriments = growth?.soil_nutriments ?? null;
  const soilSalinity = growth?.soil_salinity ?? null;
  const frostFreeDaysMin = growth?.frost_free_days_minimum ?? null;
  const minRootDepth = growth?.minimum_root_depth_cm ?? null;

  // Cultivation info
  const daysToHarvest = growth?.days_to_harvest ?? null;
  const plantingDaysToHarvest = specs?.planting_days_to_harvest ?? null;
  const plantingRowSpacing = specs?.planting_row_spacing_cm ?? null;
  const plantingSpread = specs?.planting_spread_cm ?? null;

  const lightProfile = describeLight(light);
  const humidityProfile = describeHumidity(atmosphericHumidity);
  const temperatureProfile = describeTemperature(minTemp, maxTemp);
  const precipitationProfile = describePrecipitation(minPrecip, maxPrecip);

  const climateSummary = [
    lightProfile,
    humidityProfile,
    temperatureProfile,
    precipitationProfile,
  ]
    .filter(Boolean)
    .join(" • ");

  const harvestSummary = [
    hasValue(daysToHarvest) ? `Harvest in about ${daysToHarvest} days` : null,
    hasValue(plantingDaysToHarvest)
      ? `Planting-to-harvest ~${plantingDaysToHarvest} days`
      : null,
    hasValue(growthMonths) ? `Main growing season: ${growthMonths}` : null,
    hasValue(fruitMonths) ? `Fruit window: ${fruitMonths}` : null,
    species.edible ? "Suitable for edible use" : null,
    species.vegetable ? "Classified as vegetable crop" : null,
  ]
    .filter(Boolean)
    .join(" • ");

  // Safety
  const toxicity = specs?.toxicity ?? null;

  // Distributions
  const nativeZones = species.distributions?.native ?? null;
  const introducedZones = species.distributions?.introduced ?? null;
  const doubtfulZones = species.distributions?.doubtful ?? null;

  // Images
  const imageGallery = species.images ?? null;
  const allImages = [
    ...(imageGallery?.flower ?? []),
    ...(imageGallery?.leaf ?? []),
    ...(imageGallery?.habit ?? []),
    ...(imageGallery?.fruit ?? []),
    ...(imageGallery?.bark ?? []),
    ...(imageGallery?.other ?? []),
  ];

  // Other names & references
  const commonNamesByLang = species.common_names ?? null;
  const synonyms = species.synonyms ?? null;
  const sources = species.sources ?? null;

  return (
    <article
      className={`min-h-screen bg-[linear-gradient(180deg,#f8fbf8_0%,#ffffff_28%,#f7faf7_100%)] ${className ?? ""}`}
    >
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* HEADER */}
        <header className="mb-6 flex items-end justify-between gap-6 border-b border-emerald-100 pb-5">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-700">
              Plant Encyclopedia
            </p>
            <h1
              className={`${serifHeading} mt-2 text-3xl sm:text-4xl lg:text-5xl`}
            >
              {commonName}
            </h1>
            {scientificLine ? (
              <p className="mt-3 text-base italic text-zinc-600 sm:text-lg">
                {scientificLine}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {hasValue(species.family_common_name) ? (
                <Badge>{species.family_common_name}</Badge>
              ) : null}
              {hasValue(species.genus) ? <Badge>{species.genus}</Badge> : null}
              {hasValue(species.status) ? (
                <Badge>{species.status}</Badge>
              ) : null}
              {hasValue(ligneous) ? <Badge>{ligneous}</Badge> : null}
              {hasValue(duration) ? <Badge>{duration}</Badge> : null}
            </div>
          </div>

          {hasValue(species.image_url) ? (
            <div className="hidden shrink-0 rounded-[32px] border border-emerald-100 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.08)] lg:block">
              <img
                src={species.image_url ?? undefined}
                alt={commonName}
                className="h-40 w-40 rounded-[24px] object-cover sm:h-48 sm:w-48"
              />
            </div>
          ) : null}
        </header>

        {hasValue(species.image_url) ? (
          <section className={`${softCard} mb-6 overflow-hidden lg:hidden`}>
            <img
              src={species.image_url ?? undefined}
              alt={commonName}
              className="h-72 w-full object-cover"
            />
          </section>
        ) : null}

        {/* PLANT DESCRIPTION */}
        <section className={`${softCard} mb-6 p-6 sm:p-8`}>
          <SectionTitle>Description</SectionTitle>
          <p className={`${bodyText} mt-3`}>{descriptionText}</p>
          {hasValue(growthDescription) &&
          growthDescription !== descriptionText ? (
            <div className="mt-4 border-t border-zinc-100 pt-4">
              <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Growing Notes
              </p>
              <p className={`${bodyText}`}>{growthDescription}</p>
            </div>
          ) : null}
        </section>

        {/* IMAGE GALLERY */}
        {allImages.length > 0 ? (
          <section className={`${softCard} mb-6 p-6 sm:p-8`}>
            <SectionTitle>Image Gallery</SectionTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {allImages.slice(0, 8).map((img, idx) => (
                <img
                  key={idx}
                  src={img.url}
                  alt={`Plant image ${idx + 1}`}
                  className="h-32 w-full rounded-2xl border border-zinc-200 object-cover"
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className={`${softCard} p-6 sm:p-8`}>
            <SectionTitle>Reference Summary</SectionTitle>
            <p className={`${bodyText} mt-3`}>
              {species.observations ?? "No summary available for this entry."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {hasValue(averageHeight) ? (
                <InfoRow label="Average height" value={averageHeight!} />
              ) : null}
              {hasValue(maximumHeight) ? (
                <InfoRow label="Maximum height" value={maximumHeight!} />
              ) : null}
              {hasValue(duration) ? (
                <InfoRow label="Duration" value={duration!} />
              ) : null}
              {hasValue(species.edible) ? (
                <InfoRow label="Edible" value={species.edible ? "Yes" : "No"} />
              ) : null}
              {hasValue(species.vegetable) ? (
                <InfoRow
                  label="Vegetable"
                  value={species.vegetable ? "Yes" : "No"}
                />
              ) : null}
              {hasValue(species.year) ? (
                <InfoRow label="Described" value={String(species.year)} />
              ) : null}
              {hasValue(daysToHarvest) ? (
                <InfoRow
                  label="Days to harvest"
                  value={String(daysToHarvest)}
                />
              ) : null}
              {hasValue(bloomMonths) ? (
                <InfoRow label="Bloom months" value={bloomMonths!} />
              ) : null}
              {hasValue(fruitMonths) ? (
                <InfoRow label="Fruit months" value={fruitMonths!} />
              ) : null}
              {hasValue(growthMonths) ? (
                <InfoRow label="Growth season" value={growthMonths!} />
              ) : null}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {hasValue(familyCommonName) ? (
                <InfoRow label="Family common name" value={familyCommonName!} />
              ) : null}
              {hasValue(scientificRank) ? (
                <InfoRow label="Rank" value={scientificRank!} />
              ) : null}
              {hasValue(bibliography) ? (
                <InfoRow label="Bibliography" value={bibliography!} />
              ) : null}
              {hasValue(species.status) ? (
                <InfoRow label="Status" value={species.status!} />
              ) : null}
            </div>
          </section>

          <aside className="space-y-6">
            <section className={`${softCard} p-6`}>
              <SectionTitle>Climate Suitability</SectionTitle>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Thrives in
                  </div>
                  <div className="mt-1 text-sm text-zinc-900">
                    {climateSummary ||
                      "Detailed climate preferences are not available yet."}
                  </div>
                </div>
                {hasValue(phMin) || hasValue(phMax) ? (
                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      Soil pH target
                    </div>
                    <div className="mt-1 text-sm text-zinc-900">
                      {hasValue(phMin) ? phMin : "—"} to{" "}
                      {hasValue(phMax) ? phMax : "—"}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className={`${softCard} p-6`}>
              <SectionTitle>Scientific Classification</SectionTitle>
              <div className="mt-4 space-y-3">
                {taxonomyRows.length > 0 ? (
                  taxonomyRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                    >
                      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                        {row.label}
                      </div>
                      <div className="text-sm text-zinc-900">{row.value}</div>
                    </div>
                  ))
                ) : (
                  <p className={bodyText}>
                    Taxonomic rank details are not available.
                  </p>
                )}
              </div>
            </section>

            <section className={`${softCard} p-6`}>
              <SectionTitle>Care & Environment</SectionTitle>
              <div className="mt-4 grid gap-3">
                {hasValue(light) ? (
                  <IconChip icon="☀" label="Light" value={`${light}/10`} />
                ) : null}
                {hasValue(atmosphericHumidity) ? (
                  <IconChip
                    icon="💨"
                    label="Atmospheric humidity"
                    value={`${atmosphericHumidity}/10`}
                  />
                ) : null}
                {hasValue(groundHumidity) ? (
                  <IconChip
                    icon="🌿"
                    label="Ground humidity"
                    value={`${groundHumidity}/10`}
                  />
                ) : null}
                {hasValue(minPrecip) ||
                hasValue(maxPrecip) ||
                hasValue(minTemp) ||
                hasValue(maxTemp) ? (
                  <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-lg text-emerald-700">
                        💧
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          Water / Temp Range
                        </div>
                        <div className="mt-1 space-y-1 text-sm text-zinc-900">
                          {hasValue(minPrecip) || hasValue(maxPrecip)
                            ? `${hasValue(minPrecip) ? `${minPrecip}` : "—"} to ${hasValue(maxPrecip) ? `${maxPrecip}` : "—"} mm precipitation`
                            : null}
                          {hasValue(minTemp) || hasValue(maxTemp)
                            ? `${hasValue(minTemp) ? `${minTemp}°C` : "—"} to ${hasValue(maxTemp) ? `${maxTemp}°C` : "—"}`
                            : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {hasValue(phMin) || hasValue(phMax) ? (
                  <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-lg text-emerald-700">
                        🧪
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          Soil pH
                        </div>
                        <div className="mt-1 text-sm text-zinc-900">
                          {hasValue(phMin) ? phMin : "—"} to{" "}
                          {hasValue(phMax) ? phMax : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {hasValue(soilTexture) ? (
                  <IconChip
                    icon="🪴"
                    label="Soil texture"
                    value={soilTexture!}
                  />
                ) : null}
                {hasValue(soilNutriments) || hasValue(soilSalinity) ? (
                  <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      Soil Profile
                    </div>
                    <div className="mt-2 grid gap-2 text-sm text-zinc-900">
                      {hasValue(soilNutriments) ? (
                        <div>Nutriments: {soilNutriments}/10</div>
                      ) : null}
                      {hasValue(soilSalinity) ? (
                        <div>Salinity: {soilSalinity}/10</div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {hasValue(minRootDepth) ? (
                  <IconChip
                    icon="🌾"
                    label="Min root depth"
                    value={`${minRootDepth} cm`}
                  />
                ) : null}
                {hasValue(frostFreeDaysMin) ? (
                  <IconChip
                    icon="❄️"
                    label="Frost-free days"
                    value={`${frostFreeDaysMin} min`}
                  />
                ) : null}
              </div>
            </section>
          </aside>
        </div>

        {/* GROWTH & BOTANICAL SPECS */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className={`${softCard} p-6 sm:p-8`}>
            <SectionTitle>Growth & Botanical Specs</SectionTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {hasValue(growthHabit) ? (
                <InfoRow label="Growth habit" value={growthHabit!} />
              ) : null}
              {hasValue(growthForm) ? (
                <InfoRow label="Growth form" value={growthForm!} />
              ) : null}
              {hasValue(growthRate) ? (
                <InfoRow label="Growth rate" value={growthRate!} />
              ) : null}
              {hasValue(shapeOrientation) ? (
                <InfoRow
                  label="Shape / orientation"
                  value={shapeOrientation!}
                />
              ) : null}
              {hasValue(ligneous) ? (
                <InfoRow label="Woody type" value={ligneous!} />
              ) : null}
              {hasValue(flowerColors) ? (
                <InfoRow label="Flower color" value={flowerColors!} />
              ) : null}
              {hasValue(flowerConspicuous) ? (
                <InfoRow
                  label="Conspicuous flowers"
                  value={flowerConspicuous!}
                />
              ) : null}
              {hasValue(foliageColors) ? (
                <InfoRow label="Foliage color" value={foliageColors!} />
              ) : null}
              {hasValue(foliageTexture) ? (
                <InfoRow label="Foliage texture" value={foliageTexture!} />
              ) : null}
              {hasValue(leafRetention) ? (
                <InfoRow label="Leaf retention" value={leafRetention!} />
              ) : null}
              {hasValue(fruitColors) ? (
                <InfoRow label="Fruit color" value={fruitColors!} />
              ) : null}
              {hasValue(fruitShape) ? (
                <InfoRow label="Fruit shape" value={fruitShape!} />
              ) : null}
              {hasValue(fruitConspicuous) ? (
                <InfoRow label="Conspicuous fruit" value={fruitConspicuous!} />
              ) : null}
              {hasValue(fruitSeedPersistence) ? (
                <InfoRow
                  label="Fruit/seed persistence"
                  value={fruitSeedPersistence!}
                />
              ) : null}
              {hasValue(growthDescription) ? (
                <InfoRow label="Growth note" value={growthDescription!} />
              ) : null}
            </div>
          </section>

          {/* CULTIVATION & PLANTING */}
          <section className={`${softCard} p-6 sm:p-8`}>
            <SectionTitle>Cultivation & Planting</SectionTitle>
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                Harvest & Crop Guidance
              </div>
              <div className="mt-1 text-sm text-zinc-900">
                {harvestSummary ||
                  "Harvest and crop timing data is still limited for this entry."}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {hasValue(plantingDaysToHarvest) ? (
                <InfoRow
                  label="Days to harvest"
                  value={String(plantingDaysToHarvest)}
                />
              ) : null}
              {hasValue(plantingRowSpacing) ? (
                <InfoRow
                  label="Row spacing"
                  value={`${plantingRowSpacing} cm`}
                />
              ) : null}
              {hasValue(plantingSpread) ? (
                <InfoRow
                  label="Planting spread"
                  value={`${plantingSpread} cm`}
                />
              ) : null}
            </div>
          </section>
        </div>

        {/* DISTRIBUTION */}
        <section className={`${softCard} mt-6 p-6 sm:p-8`}>
          <SectionTitle>Distribution</SectionTitle>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {nativeZones && nativeZones.length > 0 ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                  Native
                </div>
                <div className="mt-2 text-sm text-zinc-900">
                  {nativeZones.map((z) => z.name).join(", ")}
                </div>
              </div>
            ) : null}
            {introducedZones && introducedZones.length > 0 ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-blue-700">
                  Introduced
                </div>
                <div className="mt-2 text-sm text-zinc-900">
                  {introducedZones.map((z) => z.name).join(", ")}
                </div>
              </div>
            ) : null}
            {doubtfulZones && doubtfulZones.length > 0 ? (
              <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-yellow-700">
                  Doubtful
                </div>
                <div className="mt-2 text-sm text-zinc-900">
                  {doubtfulZones.map((z) => z.name).join(", ")}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* SAFETY & USAGE */}
        <section className={`${softCard} mt-6 p-6 sm:p-8`}>
          <SectionTitle>Safety & Usage</SectionTitle>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                Edibility & Toxicity
              </div>
              <div className="mt-2 space-y-2 text-sm text-zinc-800">
                {species.edible ? (
                  <p>
                    {hasValue(ediblePart)
                      ? `Edible parts: ${ediblePart}`
                      : "Edible (parts not specified)."}
                  </p>
                ) : null}
                {species.vegetable ? <p>Vegetable: Yes</p> : null}
                {hasValue(toxicity) ? <p>Toxicity: {toxicity}</p> : null}
                {!species.edible &&
                !species.vegetable &&
                !hasValue(toxicity) ? (
                  <p>No specific safety or usage notes available.</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* ALTERNATIVE NAMES */}
        {commonNamesByLang && Object.keys(commonNamesByLang).length > 0 ? (
          <section className={`${softCard} mt-6 p-6 sm:p-8`}>
            <SectionTitle>Common Names by Language</SectionTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(commonNamesByLang).map(([lang, names]) => (
                <div
                  key={lang}
                  className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"
                >
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    {lang}
                  </div>
                  <div className="mt-2 text-sm text-zinc-900">
                    {(names as string[]).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* SYNONYMS */}
        {synonyms && synonyms.length > 0 ? (
          <section className={`${softCard} mt-6 p-6 sm:p-8`}>
            <SectionTitle>Synonyms</SectionTitle>
            <div className="mt-4 space-y-3">
              {synonyms.map((syn, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"
                >
                  <div className="text-sm font-medium italic text-zinc-900">
                    {syn.name}
                  </div>
                  {hasValue(syn.author) ? (
                    <div className="mt-1 text-xs text-zinc-600">
                      {syn.author}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* SOURCES */}
        {sources && sources.length > 0 ? (
          <section className={`${softCard} mt-6 p-6 sm:p-8`}>
            <SectionTitle>Data Sources & Citations</SectionTitle>
            <div className="mt-4 space-y-3">
              {sources.map((src, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-200 p-4"
                >
                  <div className="text-sm font-medium text-zinc-900">
                    {src.name}
                  </div>
                  {hasValue(src.url) ? (
                    <a
                      href={src.url ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-emerald-600 hover:underline"
                    >
                      Visit source →
                    </a>
                  ) : null}
                  {hasValue(src.citation) ? (
                    <p className="mt-2 text-xs text-zinc-600">{src.citation}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}

export default PlantProfilePage;
