import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import type { PlantCareAction, UpsertPlantInput } from "@/features/garden/domain/plant";
import { firebaseDb } from "@/lib/firebase";

export type FirestorePlant = {
  id: string;
  userId: string;
  name: string;
  species: string;
  datePlanted: string;
  wateringFrequencyDays: number;
  notes?: string;
  imageUri?: string;
  lastWateredAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type FirestoreCareLog = {
  id: string;
  userId: string;
  plantId: string;
  action: PlantCareAction;
  note?: string;
  createdAt: string;
};

export type FirestoreSchedule = {
  id: string;
  userId: string;
  plantId: string;
  taskType: "watering" | "fertilizing" | "pruning";
  dueAt: string;
  status: "pending" | "done";
  createdAt: string;
  updatedAt: string;
};

type PlantDoc = Omit<FirestorePlant, "id"> & {
  createdAt?: unknown;
  updatedAt?: unknown;
};

type CareLogDoc = Omit<FirestoreCareLog, "id"> & {
  createdAt?: unknown;
};

type ScheduleDoc = Omit<FirestoreSchedule, "id"> & {
  createdAt?: unknown;
  updatedAt?: unknown;
};

function toIso(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value) {
    const asTimestamp = value as { toDate: () => Date };
    return asTimestamp.toDate().toISOString();
  }
  return new Date().toISOString();
}

function mapPlant(id: string, data: PlantDoc): FirestorePlant {
  return {
    id,
    userId: data.userId,
    name: data.name,
    species: data.species,
    datePlanted: data.datePlanted,
    wateringFrequencyDays: data.wateringFrequencyDays,
    notes: data.notes,
    imageUri: data.imageUri,
    lastWateredAt: data.lastWateredAt,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

function mapCareLog(id: string, data: CareLogDoc): FirestoreCareLog {
  return {
    id,
    userId: data.userId,
    plantId: data.plantId,
    action: data.action,
    note: data.note,
    createdAt: toIso(data.createdAt),
  };
}

function mapSchedule(id: string, data: ScheduleDoc): FirestoreSchedule {
  return {
    id,
    userId: data.userId,
    plantId: data.plantId,
    taskType: data.taskType,
    dueAt: data.dueAt,
    status: data.status,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export function subscribePlants(
  userId: string,
  onChange: (plants: FirestorePlant[]) => void,
): Unsubscribe {
  const q = query(
    collection(firebaseDb, "plants"),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc"),
  );

  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((docSnap) => mapPlant(docSnap.id, docSnap.data() as PlantDoc)));
  });
}

export function subscribeCareLogs(
  userId: string,
  onChange: (logs: FirestoreCareLog[]) => void,
): Unsubscribe {
  const q = query(
    collection(firebaseDb, "care_logs"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((docSnap) => mapCareLog(docSnap.id, docSnap.data() as CareLogDoc)));
  });
}

export function subscribeSchedules(
  userId: string,
  onChange: (schedules: FirestoreSchedule[]) => void,
): Unsubscribe {
  const q = query(
    collection(firebaseDb, "schedules"),
    where("userId", "==", userId),
    orderBy("dueAt", "asc"),
  );

  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((docSnap) => mapSchedule(docSnap.id, docSnap.data() as ScheduleDoc)));
  });
}

export async function addPlantDoc(userId: string, input: UpsertPlantInput) {
  const ref = await addDoc(collection(firebaseDb, "plants"), {
    userId,
    name: input.name.trim(),
    species: input.species.trim(),
    datePlanted: input.datePlanted,
    wateringFrequencyDays: input.wateringFrequencyDays,
    notes: input.notes?.trim() || null,
    imageUri: input.imageUri ?? null,
    lastWateredAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function updatePlantDoc(plantId: string, updates: UpsertPlantInput) {
  await updateDoc(doc(firebaseDb, "plants", plantId), {
    name: updates.name.trim(),
    species: updates.species.trim(),
    datePlanted: updates.datePlanted,
    wateringFrequencyDays: updates.wateringFrequencyDays,
    notes: updates.notes?.trim() || null,
    imageUri: updates.imageUri ?? null,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlantDoc(plantId: string) {
  await deleteDoc(doc(firebaseDb, "plants", plantId));
}

export async function addCareLogDoc(input: {
  userId: string;
  plantId: string;
  action: PlantCareAction;
  note?: string;
}) {
  const ref = await addDoc(collection(firebaseDb, "care_logs"), {
    userId: input.userId,
    plantId: input.plantId,
    action: input.action,
    note: input.note?.trim() || null,
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

export async function deleteCareLogDoc(logId: string) {
  await deleteDoc(doc(firebaseDb, "care_logs", logId));
}

export async function createScheduleDoc(input: {
  userId: string;
  plantId: string;
  taskType: "watering" | "fertilizing" | "pruning";
  dueAt: string;
  status?: "pending" | "done";
}) {
  const ref = await addDoc(collection(firebaseDb, "schedules"), {
    userId: input.userId,
    plantId: input.plantId,
    taskType: input.taskType,
    dueAt: input.dueAt,
    status: input.status ?? "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function updateScheduleDoc(
  scheduleId: string,
  updates: Partial<Pick<FirestoreSchedule, "dueAt" | "status" | "taskType">>,
) {
  await updateDoc(doc(firebaseDb, "schedules", scheduleId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteScheduleDoc(scheduleId: string) {
  await deleteDoc(doc(firebaseDb, "schedules", scheduleId));
}
