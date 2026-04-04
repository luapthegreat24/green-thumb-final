export type DictionaryPlant = {
  id: string;
  commonName: string;
  scientificName: string;
  imageUri: string;
  overview: string;
  light: string;
  water: string;
  humidity: string;
  soil: string;
  toxicity: string;
};

export const DICTIONARY_PLANTS: ReadonlyArray<DictionaryPlant> = [
  {
    id: "monstera-deliciosa",
    commonName: "Swiss Cheese Plant",
    scientificName: "Monstera deliciosa",
    imageUri:
      "https://images.unsplash.com/photo-1525498128493-380d1990a112?auto=format&fit=crop&w=600&q=60",
    overview:
      "A bold tropical aroid known for natural leaf fenestrations and fast vertical growth indoors.",
    light: "Bright, indirect light",
    water: "Water when top 2-3 cm of soil dries",
    humidity: "Medium to high humidity preferred",
    soil: "Chunky, well-draining aroid mix",
    toxicity: "Toxic to pets if ingested",
  },
  {
    id: "ficus-lyrata",
    commonName: "Fiddle Leaf Fig",
    scientificName: "Ficus lyrata",
    imageUri:
      "https://images.unsplash.com/photo-1593482892290-f54927ae0e5f?auto=format&fit=crop&w=600&q=60",
    overview:
      "Architectural indoor tree with large violin-shaped leaves that prefers consistency and stable light.",
    light: "Bright filtered light, avoid deep shade",
    water: "Let upper soil dry, then water deeply",
    humidity: "Average to medium humidity",
    soil: "Fast-draining indoor plant soil",
    toxicity: "Mildly toxic to pets",
  },
  {
    id: "epipremnum-aureum",
    commonName: "Golden Pothos",
    scientificName: "Epipremnum aureum",
    imageUri:
      "https://images.unsplash.com/photo-1611211232932-da3113c5b960?auto=format&fit=crop&w=600&q=60",
    overview:
      "A resilient trailing plant prized for variegated leaves and adaptability across indoor environments.",
    light: "Low to bright indirect light",
    water: "Water when top half of soil is dry",
    humidity: "Average home humidity is fine",
    soil: "Loose potting mix with drainage",
    toxicity: "Toxic to pets if chewed",
  },
  {
    id: "sansevieria-trifasciata",
    commonName: "Snake Plant",
    scientificName: "Dracaena trifasciata",
    imageUri:
      "https://images.unsplash.com/photo-1593691509543-c55fb32e8f91?auto=format&fit=crop&w=600&q=60",
    overview:
      "An upright, drought-tolerant species ideal for low-maintenance spaces and low-light corners.",
    light: "Low to bright indirect light",
    water: "Water sparingly after soil fully dries",
    humidity: "Low to average humidity",
    soil: "Cactus/succulent style drainage mix",
    toxicity: "Toxic to pets if consumed",
  },
  {
    id: "ocimum-basilicum",
    commonName: "Sweet Basil",
    scientificName: "Ocimum basilicum",
    imageUri:
      "https://images.unsplash.com/photo-1615485925873-6b08a7f32279?auto=format&fit=crop&w=600&q=60",
    overview:
      "A fragrant culinary herb that grows quickly with warmth, sunlight, and regular moisture.",
    light: "4-6 hours of direct sun",
    water: "Keep evenly moist, not soggy",
    humidity: "Average humidity with airflow",
    soil: "Nutrient-rich, well-draining soil",
    toxicity: "Non-toxic and edible",
  },
  {
    id: "chlorophytum-comosum",
    commonName: "Spider Plant",
    scientificName: "Chlorophytum comosum",
    imageUri:
      "https://images.unsplash.com/photo-1604762512526-9f80fdf6f3ec?auto=format&fit=crop&w=600&q=60",
    overview:
      "A classic arching houseplant that produces baby plantlets and thrives with minimal care.",
    light: "Bright to medium indirect light",
    water: "Water when top layer begins to dry",
    humidity: "Average to slightly higher humidity",
    soil: "General indoor potting mix",
    toxicity: "Non-toxic to cats and dogs",
  },
];

export function getDictionaryPlantById(id: string) {
  return DICTIONARY_PLANTS.find((plant) => plant.id === id);
}
