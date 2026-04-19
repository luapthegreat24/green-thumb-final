# Trefle API Guide for Green Thumb

This guide shows how to use the Trefle API to look up basic plant information in a beginner-friendly gardening app.

## What You Need

- A Trefle API key
- A `fetch` call from your app
- A small helper for searching plants
- A second helper for loading plant details

## API Key Setup

Put your Trefle key in an environment variable instead of hardcoding it in your files.

```bash
EXPO_PUBLIC_TREFLE_API_KEY=your_trefle_key_here
```

Use the key you provided in your local `.env` file.

## Base URL

```ts
const TREFLE_BASE_URL = "https://trefle.io/api/v1";
```

## 1. Search for a Plant by Name

Use the plant search endpoint to find matches by name.

```ts
const TREFLE_API_KEY = process.env.EXPO_PUBLIC_TREFLE_API_KEY;

export async function searchPlants(query: string) {
  const url = `${TREFLE_BASE_URL}/plants/search?token=${TREFLE_API_KEY}&q=${encodeURIComponent(query)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to search plants");
  }

  const data = await response.json();
  return data.data;
}
```

### Example usage

```ts
const plants = await searchPlants("basil");
console.log(plants);
```

## 2. Fetch Essential Plant Details

Use the plant ID to get details like common name, scientific name, description, and images.

```ts
export async function getPlantDetails(plantId: number) {
  const url = `${TREFLE_BASE_URL}/plants/${plantId}?token=${TREFLE_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch plant details");
  }

  const data = await response.json();
  return data.data;
}
```

## 3. Show User-Friendly Plant Info

When you display plant data in the app, keep it simple:

```ts
export function formatPlantDetails(plant: any) {
  return {
    commonName: plant.common_name || "Unknown common name",
    scientificName: plant.scientific_name || "Unknown scientific name",
    description:
      plant.main_species?.growth?.description ||
      plant.description ||
      "No description available.",
    imageUrl: plant.image_url || plant.images?.[0]?.url || null,
  };
}
```

## Beginner-Friendly Example

Here is a simple helper file you can use in your app:

```ts
const TREFLE_BASE_URL = "https://trefle.io/api/v1";
const TREFLE_API_KEY = process.env.EXPO_PUBLIC_TREFLE_API_KEY;

type TreflePlant = {
  id: number;
  common_name?: string;
  scientific_name?: string;
  image_url?: string;
  main_species?: {
    growth?: {
      description?: string;
    };
  };
};

export async function searchPlants(query: string): Promise<TreflePlant[]> {
  const response = await fetch(
    `${TREFLE_BASE_URL}/plants/search?token=${TREFLE_API_KEY}&q=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error("Search request failed");
  }

  const json = await response.json();
  return json.data;
}

export async function getPlantDetails(plantId: number): Promise<TreflePlant> {
  const response = await fetch(
    `${TREFLE_BASE_URL}/plants/${plantId}?token=${TREFLE_API_KEY}`,
  );

  if (!response.ok) {
    throw new Error("Details request failed");
  }

  const json = await response.json();
  return json.data;
}
```

## 4. Display in the App

Use the helpers like this:

```ts
const results = await searchPlants("lavender");
const firstPlant = results[0];
const details = await getPlantDetails(firstPlant.id);

console.log({
  commonName: details.common_name,
  scientificName: details.scientific_name,
  description: details.main_species?.growth?.description,
  imageUrl: details.image_url,
});
```

## Recommended UI Fields

Show these fields to users:

- Common name
- Scientific name
- Short description
- Image

Optional fields you can add later:

- Plant family
- Growth type
- Water needs
- Sunlight needs

## Simple App Flow

1. User types a plant name.
2. App calls `searchPlants(query)`.
3. Show a list of matching plants.
4. User taps one result.
5. App calls `getPlantDetails(plantId)`.
6. Display the plant name, description, and image.

## Tips

- Keep the screen simple for beginners.
- Use short labels like "Common Name" and "Scientific Name".
- Show a loading indicator while the request runs.
- Show a friendly error message if the request fails.

## Notes

- Trefle API results may vary depending on the plant.
- Some plants may not have a description or image.
- Always handle missing fields safely.

## Environment File Example

```bash
EXPO_PUBLIC_TREFLE_API_KEY=your_key_here
```

Do not commit your `.env` file to version control.
