export type PlantCareAction = "watered" | "fertilized" | "pruned" | "note";

export type PlantHistoryLog = {
  id: string;
  plantId: string;
  action: PlantCareAction;
  note?: string;
  createdAt: string;
};

export type Plant = {
  id: string;
  name: string;
  species: string;
  datePlanted: string;
  wateringFrequencyDays: number;
  notes?: string;
  imageUri?: string;
  lastWateredAt?: string;
  createdAt: string;
  updatedAt: string;
  history: PlantHistoryLog[];
};

export type UpsertPlantInput = {
  name: string;
  species: string;
  datePlanted: string;
  wateringFrequencyDays: number;
  notes?: string;
  imageUri?: string;
};

export type PlantFilters = {
  query: string;
  watering: "all" | "today" | "week";
  status: "all" | "needs-water" | "at-risk" | "healthy";
  species: string;
  viewMode: "list" | "grid";
};
