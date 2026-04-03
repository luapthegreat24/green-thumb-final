/**
 * Care Schedule Service — Firestore operations for careSchedules collection
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { firebaseDb } from "@/lib/firebase";
import {
  getDefaultScheduleTitle,
  type CareSchedule,
  type CreateScheduleInput,
  type UpdateScheduleInput,
} from "@/types/care-schedule";

export type FirestoreCareSchedule = {
  id: string;
  userId: string;
  plantId: string;
  plantName: string;
  taskType: string;
  title: string;
  dateTime: string;
  isRecurring: boolean;
  frequency?: string | null;
  daysOfWeek?: number[];
  reminderEnabled: boolean;
  status: string;
  notes?: string | null;
  lastCompletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type FirestoreCareScheduleDoc = Omit<FirestoreCareSchedule, "id"> & {
  dateTime?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastCompletedAt?: unknown;
};

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  if (value && typeof value === "object" && "toDate" in value) {
    const timestamp = value as { toDate: () => Date };
    return timestamp.toDate();
  }
  return new Date();
}

function toIso(date: Date): string {
  return date.toISOString();
}

function mapCareSchedule(
  id: string,
  data: FirestoreCareScheduleDoc,
): CareSchedule {
  return {
    id,
    userId: data.userId,
    plantId: data.plantId,
    plantName: data.plantName,
    taskType: data.taskType as any,
    title: data.title,
    dateTime: toDate(data.dateTime),
    isRecurring: data.isRecurring,
    frequency: (data.frequency ?? null) as any,
    daysOfWeek: data.daysOfWeek ?? undefined,
    reminderEnabled: data.reminderEnabled,
    status: (data.status ?? "active") as any,
    notes: data.notes ?? undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    lastCompletedAt: data.lastCompletedAt ? toDate(data.lastCompletedAt) : null,
  };
}

/**
 * Subscribe to user's care schedules with real-time updates
 */
export function subscribeCareSchedules(
  userId: string,
  onChange: (schedules: CareSchedule[]) => void,
): Unsubscribe {
  const q = query(
    collection(firebaseDb, "careSchedules"),
    where("userId", "==", userId),
  );

  return onSnapshot(q, (snapshot) => {
    onChange(
      snapshot.docs
        .map((snapshotDoc) =>
          mapCareSchedule(
            snapshotDoc.id,
            snapshotDoc.data() as FirestoreCareScheduleDoc,
          ),
        )
        .sort(
          (left, right) => left.dateTime.getTime() - right.dateTime.getTime(),
        ),
    );
  });
}

/**
 * Create a new care schedule
 */
export async function createCareScheduleDoc(
  userId: string,
  input: CreateScheduleInput,
): Promise<string> {
  const collectionRef = collection(firebaseDb, "careSchedules");
  const title =
    input.title?.trim() ||
    getDefaultScheduleTitle(input.taskType, input.plantName);

  const docRef = await addDoc(collectionRef, {
    userId,
    plantId: input.plantId,
    plantName: input.plantName.trim(),
    taskType: input.taskType,
    title,
    dateTime: toIso(input.dateTime),
    isRecurring: input.isRecurring,
    frequency: input.isRecurring ? (input.frequency ?? null) : null,
    daysOfWeek: input.daysOfWeek ?? [],
    reminderEnabled: input.reminderEnabled,
    status: "active",
    notes: input.notes?.trim() || null,
    lastCompletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Update an existing care schedule
 */
export async function updateCareScheduleDoc(
  scheduleId: string,
  input: UpdateScheduleInput,
): Promise<void> {
  const docRef = doc(firebaseDb, "careSchedules", scheduleId);
  const updates: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (input.plantId !== undefined) updates.plantId = input.plantId;
  if (input.plantName !== undefined) updates.plantName = input.plantName.trim();
  if (input.taskType !== undefined) updates.taskType = input.taskType;
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.dateTime !== undefined) updates.dateTime = toIso(input.dateTime);
  if (input.isRecurring !== undefined) updates.isRecurring = input.isRecurring;
  if (input.frequency !== undefined)
    updates.frequency = input.isRecurring ? input.frequency : null;
  if (input.daysOfWeek !== undefined) updates.daysOfWeek = input.daysOfWeek;
  if (input.reminderEnabled !== undefined)
    updates.reminderEnabled = input.reminderEnabled;
  if (input.status !== undefined) updates.status = input.status;
  if (input.notes !== undefined) updates.notes = input.notes?.trim() || null;
  if (input.lastCompletedAt !== undefined)
    updates.lastCompletedAt = input.lastCompletedAt
      ? toIso(input.lastCompletedAt)
      : null;

  await updateDoc(docRef, updates);
}

/**
 * Delete a care schedule
 */
export async function deleteCareScheduleDoc(scheduleId: string): Promise<void> {
  const docRef = doc(firebaseDb, "careSchedules", scheduleId);
  await deleteDoc(docRef);
}

/**
 * Mark schedule as completed (updates lastCompletedAt timestamp)
 */
export async function markScheduleCompleted(scheduleId: string): Promise<void> {
  await updateCareScheduleDoc(scheduleId, {
    lastCompletedAt: new Date(),
  });
}

/**
 * Toggle schedule active/paused status
 */
export async function toggleScheduleStatus(
  scheduleId: string,
  currentStatus: string,
): Promise<void> {
  const newStatus = currentStatus === "active" ? "paused" : "active";
  await updateCareScheduleDoc(scheduleId, {
    status: newStatus as any,
  });
}

/**
 * Archive a schedule (soft delete)
 */
export async function archiveSchedule(scheduleId: string): Promise<void> {
  await updateCareScheduleDoc(scheduleId, {
    status: "archived",
  });
}

/**
 * Get all active schedules that should run today
 */
export function getSchedulesForToday(
  schedules: CareSchedule[],
): CareSchedule[] {
  const today = new Date();
  const dayOfWeek = today.getDay();

  return schedules.filter((schedule) => {
    if (schedule.status !== "active") return false;

    if (!schedule.isRecurring) {
      // One-time: check if date matches today
      const scheduleDate = schedule.dateTime;
      return (
        scheduleDate.getFullYear() === today.getFullYear() &&
        scheduleDate.getMonth() === today.getMonth() &&
        scheduleDate.getDate() === today.getDate()
      );
    }

    switch (schedule.frequency) {
      case "daily":
        return true;

      case "weekly":
        return !schedule.daysOfWeek || schedule.daysOfWeek.includes(dayOfWeek);

      case "biweekly": {
        if (!schedule.daysOfWeek || !schedule.daysOfWeek.includes(dayOfWeek)) {
          return false;
        }
        // Check if 2 weeks have passed since creation
        const daysSinceCreation = Math.floor(
          (today.getTime() - schedule.createdAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return daysSinceCreation % 14 === 0;
      }

      case "monthly": {
        // Check if same day of month as schedule dateTime
        return today.getDate() === schedule.dateTime.getDate();
      }

      default:
        return false;
    }
  });
}
