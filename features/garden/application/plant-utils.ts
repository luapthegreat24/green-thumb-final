import type { Plant, PlantFilters } from "@/features/garden/domain/plant";

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function calculateNextWateringDate(plant: Plant) {
  const base = new Date(plant.lastWateredAt ?? plant.datePlanted);
  const next = new Date(base);
  next.setDate(next.getDate() + plant.wateringFrequencyDays);
  return next;
}

export function getDaysUntilWatering(plant: Plant) {
  const next = calculateNextWateringDate(plant);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  next.setHours(0, 0, 0, 0);

  const diffMs = next.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function formatWateringLabel(plant: Plant) {
  const days = getDaysUntilWatering(plant);

  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return "Water today";
  if (days === 1) return "Water tomorrow";
  return `Water in ${days}d`;
}

export function filterPlants(plants: Plant[], filters: PlantFilters) {
  const query = filters.query.trim().toLowerCase();

  return plants.filter((plant) => {
    const matchesQuery =
      !query ||
      plant.name.toLowerCase().includes(query) ||
      plant.species.toLowerCase().includes(query);

    if (!matchesQuery) return false;

    if (filters.watering === "all") return true;

    const days = getDaysUntilWatering(plant);
    if (filters.watering === "today") return days <= 0;
    return days <= 7;
  });
}
