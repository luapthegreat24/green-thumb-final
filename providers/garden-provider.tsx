import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  calculateNextWateringDate,
  filterPlants,
} from "@/features/garden/application/plant-utils";
import type {
  Plant,
  PlantCareAction,
  PlantFilters,
  PlantHistoryLog,
  UpsertPlantInput,
} from "@/features/garden/domain/plant";
import { useAppToast } from "@/providers/app-toast-provider";
import { useAuth } from "@/providers/auth-provider";
import {
  addCareLogDoc,
  addPlantDoc,
  createScheduleDoc,
  deleteCareLogDoc,
  deletePlantDoc,
  deleteScheduleDoc,
  subscribeCareLogs,
  subscribePlants,
  subscribeSchedules,
  updatePlantDoc,
  updateScheduleDoc,
  uploadPlantImage,
  type FirestoreCareLog,
  type FirestorePlant,
  type FirestoreSchedule,
} from "@/services/firebase/garden-service";
import { isLocalMediaUri } from "@/services/firebase/media-upload";

type GardenContextValue = {
  plants: Plant[];
  careLogs: FirestoreCareLog[];
  schedules: FirestoreSchedule[];
  loading: boolean;
  refreshing: boolean;
  filters: PlantFilters;
  filteredPlants: Plant[];
  setFilters: (next: Partial<PlantFilters>) => void;
  refresh: () => Promise<void>;
  addPlant: (input: UpsertPlantInput) => Promise<string>;
  updatePlant: (plantId: string, updates: UpsertPlantInput) => Promise<void>;
  deletePlant: (plantId: string) => Promise<void>;
  getPlantById: (plantId: string) => Plant | undefined;
  addHistoryLog: (
    plantId: string,
    action: PlantCareAction,
    note?: string,
  ) => Promise<void>;
  createSchedule: (input: {
    plantId: string;
    taskType: "watering" | "fertilizing" | "pruning";
    dueAt: string;
  }) => Promise<string>;
  updateSchedule: (
    scheduleId: string,
    updates: Partial<Pick<FirestoreSchedule, "dueAt" | "status" | "taskType">>,
  ) => Promise<void>;
};

const GardenContext = createContext<GardenContextValue | undefined>(undefined);

function toHistoryLogs(
  logs: FirestoreCareLog[],
  plantId: string,
): PlantHistoryLog[] {
  return logs
    .filter((entry) => entry.plantId === plantId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((entry) => ({
      id: entry.id,
      plantId: entry.plantId,
      action: entry.action,
      note: entry.note,
      createdAt: entry.createdAt,
    }));
}

function toPlants(plants: FirestorePlant[], logs: FirestoreCareLog[]): Plant[] {
  return plants.map((plant) => {
    const history = toHistoryLogs(logs, plant.id);
    const latestWaterLog = history.find((entry) => entry.action === "watered");

    return {
      id: plant.id,
      name: plant.name,
      species: plant.species,
      datePlanted: plant.datePlanted,
      wateringFrequencyDays: plant.wateringFrequencyDays,
      notes: plant.notes,
      imageUri: plant.imageUri,
      lastWateredAt: latestWaterLog?.createdAt ?? plant.lastWateredAt,
      createdAt: plant.createdAt,
      updatedAt: plant.updatedAt,
      history,
    };
  });
}

function computeWateringDueAt(plant: Plant) {
  return calculateNextWateringDate(plant).toISOString();
}

export function GardenProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useAppToast();
  const [rawPlants, setRawPlants] = useState<FirestorePlant[]>([]);
  const [careLogs, setCareLogs] = useState<FirestoreCareLog[]>([]);
  const [schedules, setSchedules] = useState<FirestoreSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFiltersState] = useState<PlantFilters>({
    query: "",
    watering: "all",
    status: "all",
    species: "",
    viewMode: "list",
  });

  useEffect(() => {
    if (!user) {
      setRawPlants([]);
      setCareLogs([]);
      setSchedules([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    let plantsReady = false;
    let logsReady = false;
    let schedulesReady = false;

    const finishIfReady = () => {
      if (plantsReady && logsReady && schedulesReady) {
        setLoading(false);
      }
    };

    const unsubPlants = subscribePlants(user.uid, (nextPlants) => {
      setRawPlants(nextPlants);
      plantsReady = true;
      finishIfReady();
    });

    const unsubLogs = subscribeCareLogs(user.uid, (nextLogs) => {
      setCareLogs(nextLogs);
      logsReady = true;
      finishIfReady();
    });

    const unsubSchedules = subscribeSchedules(user.uid, (nextSchedules) => {
      setSchedules(nextSchedules);
      schedulesReady = true;
      finishIfReady();
    });

    return () => {
      unsubPlants();
      unsubLogs();
      unsubSchedules();
    };
  }, [user]);

  const plants = useMemo(
    () => toPlants(rawPlants, careLogs),
    [rawPlants, careLogs],
  );

  const refresh = async () => {
    setRefreshing(true);
    // Realtime listeners keep data in sync; this exists for pull-to-refresh UX.
    setTimeout(() => setRefreshing(false), 300);
  };

  const setFilters = (next: Partial<PlantFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...next }));
  };

  const createSchedule = async (input: {
    plantId: string;
    taskType: "watering" | "fertilizing" | "pruning";
    dueAt: string;
  }) => {
    if (!user) throw new Error("You must be logged in.");

    const scheduleId = await createScheduleDoc({
      userId: user.uid,
      plantId: input.plantId,
      taskType: input.taskType,
      dueAt: input.dueAt,
      status: "pending",
    });

    showToast("Schedule created");
    return scheduleId;
  };

  const updateSchedule = async (
    scheduleId: string,
    updates: Partial<Pick<FirestoreSchedule, "dueAt" | "status" | "taskType">>,
  ) => {
    await updateScheduleDoc(scheduleId, updates);
    showToast("Schedule updated");
  };

  const addPlant = async (input: UpsertPlantInput) => {
    if (!user) throw new Error("You must be logged in.");

    // Upload image if it's a local file
    let finalImageUri = input.imageUri;
    if (input.imageUri && isLocalMediaUri(input.imageUri)) {
      const plantId = Math.random().toString(36).slice(2, 9);
      finalImageUri = await uploadPlantImage(
        user.uid,
        plantId,
        input.imageUri!,
      );
    }

    const plantInput: UpsertPlantInput = {
      ...input,
      imageUri: finalImageUri,
    };
    const plantId = await addPlantDoc(user.uid, plantInput);

    await addCareLogDoc({
      userId: user.uid,
      plantId,
      action: "note",
      note: "Plant added to garden",
    });

    const pseudoPlant: Plant = {
      id: plantId,
      name: input.name,
      species: input.species,
      datePlanted: input.datePlanted,
      wateringFrequencyDays: input.wateringFrequencyDays,
      notes: input.notes,
      imageUri: finalImageUri,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [],
    };

    await createSchedule({
      plantId,
      taskType: "watering",
      dueAt: computeWateringDueAt(pseudoPlant),
    });

    showToast("Plant added successfully");

    return plantId;
  };

  const updatePlant = async (plantId: string, updates: UpsertPlantInput) => {
    if (!user) throw new Error("You must be logged in.");

    // Upload image if it's a local file
    let finalUpdates = updates;
    if (updates.imageUri && isLocalMediaUri(updates.imageUri)) {
      const imageUrl = await uploadPlantImage(
        user.uid,
        plantId,
        updates.imageUri!,
      );
      finalUpdates = {
        ...updates,
        imageUri: imageUrl,
      };
    }

    await updatePlantDoc(plantId, finalUpdates);

    const existing = plants.find((item) => item.id === plantId);
    if (!existing) return;

    const wateringSchedule = schedules.find(
      (item) => item.plantId === plantId && item.taskType === "watering",
    );

    const nextPlant: Plant = {
      ...existing,
      ...finalUpdates,
      notes: finalUpdates.notes,
      imageUri: finalUpdates.imageUri,
      updatedAt: new Date().toISOString(),
    };

    const dueAt = computeWateringDueAt(nextPlant);

    if (wateringSchedule) {
      await updateSchedule(wateringSchedule.id, { dueAt, status: "pending" });
    } else if (user) {
      await createSchedule({ plantId, taskType: "watering", dueAt });
    }

    showToast("Plant updated successfully");
  };

  const deletePlant = async (plantId: string) => {
    await deletePlantDoc(plantId);

    const logsToDelete = careLogs.filter((log) => log.plantId === plantId);
    const schedulesToDelete = schedules.filter(
      (schedule) => schedule.plantId === plantId,
    );

    await Promise.all([
      ...logsToDelete.map((entry) => deleteCareLogDoc(entry.id)),
      ...schedulesToDelete.map((entry) => deleteScheduleDoc(entry.id)),
    ]);

    showToast("Plant deleted");
  };

  const getPlantById = (plantId: string) =>
    plants.find((plant) => plant.id === plantId);

  const addHistoryLog = async (
    plantId: string,
    action: PlantCareAction,
    note?: string,
  ) => {
    if (!user) throw new Error("You must be logged in.");

    await addCareLogDoc({ userId: user.uid, plantId, action, note });

    if (action === "watered") {
      const plant = plants.find((item) => item.id === plantId);
      if (!plant) return;

      await updatePlantDoc(plantId, {
        name: plant.name,
        species: plant.species,
        datePlanted: plant.datePlanted,
        wateringFrequencyDays: plant.wateringFrequencyDays,
        notes: plant.notes,
        imageUri: plant.imageUri,
      });

      const wateringSchedule = schedules.find(
        (item) => item.plantId === plantId && item.taskType === "watering",
      );
      const dueAt = computeWateringDueAt({
        ...plant,
        lastWateredAt: new Date().toISOString(),
      });

      if (wateringSchedule) {
        await updateSchedule(wateringSchedule.id, { dueAt, status: "pending" });
      } else {
        await createSchedule({ plantId, taskType: "watering", dueAt });
      }
    }

    showToast("Care history updated");
  };

  const filteredPlants = useMemo(
    () => filterPlants(plants, filters),
    [plants, filters],
  );

  const value = useMemo<GardenContextValue>(
    () => ({
      plants,
      careLogs,
      schedules,
      loading,
      refreshing,
      filters,
      filteredPlants,
      setFilters,
      refresh,
      addPlant,
      updatePlant,
      deletePlant,
      getPlantById,
      addHistoryLog,
      createSchedule,
      updateSchedule,
    }),
    [plants, careLogs, schedules, loading, refreshing, filters, filteredPlants],
  );

  return (
    <GardenContext.Provider value={value}>{children}</GardenContext.Provider>
  );
}

export function useGarden() {
  const context = useContext(GardenContext);
  if (!context) {
    throw new Error("useGarden must be used inside GardenProvider.");
  }

  return context;
}
