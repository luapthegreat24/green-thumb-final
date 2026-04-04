/**
 * Care Task types for plant maintenance scheduling and tracking
 */

export type TaskType =
  | "watering"
  | "fertilizing"
  | "pruning"
  | "repotting"
  | "note";
export type TaskStatus = "pending" | "completed" | "missed";
export type TaskFrequency = "daily" | "weekly";

export interface CareTask {
  id: string;
  userId: string;
  plantId: string;
  plantName: string;
  taskType: TaskType;
  title: string;
  dateTime: Date;
  status: TaskStatus;
  isRecurring: boolean;
  frequency?: TaskFrequency | null;
  notes?: string;
  reminderEnabled: boolean;
  notificationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
}

export interface CreateTaskInput {
  plantId: string;
  plantName: string;
  taskType: TaskType;
  title?: string;
  dateTime: Date;
  isRecurring: boolean;
  frequency?: TaskFrequency | null;
  notes?: string;
  reminderEnabled: boolean;
}

export interface UpdateTaskInput {
  plantId?: string;
  plantName?: string;
  taskType?: TaskType;
  title?: string;
  dateTime?: Date;
  status?: TaskStatus;
  isRecurring?: boolean;
  frequency?: TaskFrequency | null;
  notes?: string;
  reminderEnabled?: boolean;
  notificationId?: string | null;
  completedAt?: Date | null;
}

export const TASK_TYPE_ICONS: Record<TaskType, string> = {
  watering: "water-outline",
  fertilizing: "flask-outline",
  pruning: "cut-outline",
  repotting: "flower",
  note: "create-outline",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  watering: "Watering",
  fertilizing: "Fertilizing",
  pruning: "Pruning",
  repotting: "Repotting",
  note: "Note",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Upcoming",
  completed: "Completed",
  missed: "Missed",
};

export const TASK_FREQUENCY_LABELS: Record<TaskFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
};

export function getDefaultTaskTitle(taskType: TaskType, plantName: string) {
  const cleanedPlantName = plantName.trim() || "your plant";

  switch (taskType) {
    case "watering":
      return `Give ${cleanedPlantName} a good watering`;
    case "fertilizing":
      return `Feed ${cleanedPlantName} with fertilizer`;
    case "pruning":
      return `Prune and tidy ${cleanedPlantName}`;
    case "repotting":
      return `Repot ${cleanedPlantName} into fresh soil`;
    case "note":
      return `Add a care note for ${cleanedPlantName}`;
    default:
      return `${TASK_TYPE_LABELS[taskType]} care for ${cleanedPlantName}`;
  }
}

export function deriveTaskStatus(
  dateTime: Date,
  currentStatus: TaskStatus,
  now: Date = new Date(),
) {
  if (currentStatus === "completed") {
    return "completed" as const;
  }

  return dateTime.getTime() < now.getTime()
    ? ("missed" as const)
    : ("pending" as const);
}
