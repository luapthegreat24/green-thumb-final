export type PlantSuggestion = {
  id: string;
  commonName: string;
  scientificName: string;
  imageUrl?: string;
  source: "api" | "ai";
};

export async function searchPlantSuggestions(
  term: string,
): Promise<PlantSuggestion[]> {
  const query = term.trim();
  if (query.length < 2) return [];

  return [
    {
      id: "stub-1",
      commonName: query,
      scientificName: `${query} sp.`,
      source: "ai",
    },
  ];
}
