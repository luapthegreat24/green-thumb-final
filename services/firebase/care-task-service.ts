import * as Notifications from "expo-notifications";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { firebaseDb } from "@/lib/firebase";
import {
  deriveTaskStatus,
  getDefaultTaskTitle,
  TASK_TYPE_LABELS,
  type CareTask,
  type CreateTaskInput,
  type TaskFrequency,
  type TaskStatus,
  type TaskType,
  type UpdateTaskInput,
} from "@/types/care-task";

export type FirestoreCareTask = {
  id: string;
  userId: string;
  plantId: string;
  plantName: string;
  taskType: TaskType;
  title: string;
  dateTime: string;
  status: TaskStatus;
  isRecurring: boolean;
  frequency?: TaskFrequency | null;
  notes?: string | null;
  reminderEnabled: boolean;
  notificationId?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

type FirestoreCareTaskDoc = Omit<
  FirestoreCareTask,
  "id" | "dateTime" | "createdAt" | "updatedAt" | "completedAt"
> & {
  dateTime?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  completedAt?: unknown;
};

function toDate(value: unknown) {
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  if (value && typeof value === "object" && "toDate" in value) {
    const timestamp = value as { toDate: () => Date };
    return timestamp.toDate();
  }
  return new Date();
}

function toIso(value: unknown) {
  return toDate(value).toISOString();
}

function mapCareTask(id: string, data: FirestoreCareTaskDoc): CareTask {
  const dateTime = toDate(data.dateTime);
  const status = deriveTaskStatus(dateTime, data.status ?? "pending");

  return {
    id,
    userId: data.userId,
    plantId: data.plantId,
    plantName: data.plantName,
    taskType: data.taskType,
    title: data.title,
    dateTime,
    status,
    isRecurring: data.isRecurring,
    frequency: data.frequency ?? null,
    notes: data.notes ?? undefined,
    reminderEnabled: data.reminderEnabled,
    notificationId: data.notificationId ?? null,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    completedAt: data.completedAt ? toDate(data.completedAt) : null,
  };
}

export function subscribeCareTasks(
  userId: string,
  onChange: (tasks: CareTask[]) => void,
): Unsubscribe {
  const q = query(
    collection(firebaseDb, "careTasks"),
    where("userId", "==", userId),
  );

  return onSnapshot(q, (snapshot) => {
    onChange(
      snapshot.docs
        .map((snapshotDoc) =>
          mapCareTask(
            snapshotDoc.id,
            snapshotDoc.data() as FirestoreCareTaskDoc,
          ),
        )
        .sort(
          (left, right) => left.dateTime.getTime() - right.dateTime.getTime(),
        ),
    );
  });
}

export async function createCareTaskDoc(
  userId: string,
  input: CreateTaskInput,
) {
  const docRef = doc(collection(firebaseDb, "careTasks"));
  const title =
    input.title?.trim() || getDefaultTaskTitle(input.taskType, input.plantName);

  await setDoc(docRef, {
    id: docRef.id,
    userId,
    plantId: input.plantId,
    plantName: input.plantName.trim(),
    taskType: input.taskType,
    title,
    dateTime: input.dateTime.toISOString(),
    status: "pending",
    isRecurring: input.isRecurring,
    frequency: input.isRecurring ? (input.frequency ?? null) : null,
    notes: input.notes?.trim() || null,
    reminderEnabled: input.reminderEnabled,
    notificationId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
  });

  return docRef.id;
}

export async function updateCareTaskDoc(
  taskId: string,
  updates: UpdateTaskInput,
) {
  const data: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.plantId !== undefined) data.plantId = updates.plantId;
  if (updates.plantName !== undefined)
    data.plantName = updates.plantName.trim();
  if (updates.taskType !== undefined) data.taskType = updates.taskType;
  if (updates.title !== undefined) data.title = updates.title.trim();
  if (updates.dateTime !== undefined)
    data.dateTime = updates.dateTime.toISOString();
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.isRecurring !== undefined) data.isRecurring = updates.isRecurring;
  if (updates.frequency !== undefined) data.frequency = updates.frequency;
  if (updates.notes !== undefined) data.notes = updates.notes.trim() || null;
  if (updates.reminderEnabled !== undefined)
    data.reminderEnabled = updates.reminderEnabled;
  if (updates.notificationId !== undefined)
    data.notificationId = updates.notificationId;
  if (updates.completedAt !== undefined) {
    data.completedAt = updates.completedAt
      ? updates.completedAt.toISOString()
      : null;
  }

  await updateDoc(doc(firebaseDb, "careTasks", taskId), data);
}

export async function deleteCareTaskDoc(taskId: string) {
  await deleteDoc(doc(firebaseDb, "careTasks", taskId));
}

export async function scheduleTaskReminderNotification(task: CareTask) {
  if (!task.reminderEnabled) return null;
  if (task.dateTime.getTime() <= Date.now()) return null;

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") {
    return null;
  }

  await Notifications.setNotificationChannelAsync("care-tasks", {
    name: "Care Tasks",
    importance: Notifications.AndroidImportance.HIGH,
  });

  return Notifications.scheduleNotificationAsync({
    content: {
      title: task.title,
      body: `${TASK_TYPE_LABELS[task.taskType]} for ${task.plantName} is due now.`,
      sound: true,
    },
    trigger: { date: task.dateTime } as Notifications.DateTriggerInput,
  });
}

export async function cancelTaskReminderNotification(
  notificationId?: string | null,
) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Ignore stale notification ids.
  }
}
