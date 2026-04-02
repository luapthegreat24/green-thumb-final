import { useGarden } from "@/providers/garden-provider";

type AddPlantInput = {
  name: string;
  commonName?: string;
  imageUrl: string;
  status: "Healthy" | "Needs Water" | "Needs Fertilizer";
  nextTask: string;
  species?: string;
  sunlightNeeds?: string;
};

export function useAppData() {
  const { addPlant: addGardenPlant } = useGarden();

  const addPlant = (input: AddPlantInput) => {
    return addGardenPlant({
      name: input.name,
      species: input.species ?? input.commonName ?? input.name,
      datePlanted: new Date().toISOString().slice(0, 10),
      wateringFrequencyDays: input.status === "Needs Water" ? 1 : 7,
      notes: input.nextTask,
      imageUri: input.imageUrl,
    });
  };

  return { addPlant };
}
