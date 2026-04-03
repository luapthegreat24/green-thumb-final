/**
 * Care Schedule types for plant maintenance recurring schedules
 * Represents repeatable care templates stored in careSchedules collection
 */

export type TaskType =
  | "watering"
  | "fertilizing"
  | "pruning"
  | "repotting"
  | "note";

export type TaskFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "once";

export type TaskStatus = "active" | "completed" | "paused" | "archived";

export interface CareSchedule {
  id: string;
  userId: string;
  plantId: string;
  plantName: string;
  taskType: TaskType;
  title: string;
  dateTime: Date;
  isRecurring: boolean;
  frequency?: TaskFrequency | null;
  daysOfWeek?: number[]; // 0-6, where 0 is Sunday
  reminderEnabled: boolean;
  status: TaskStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lastCompletedAt?: Date | null;
}

export interface CreateScheduleInput {
  plantId: string;
  plantName: string;
  taskType: TaskType;
  title?: string;
  dateTime: Date;
  isRecurring: boolean;
  frequency?: TaskFrequency | null;
  daysOfWeek?: number[];
  reminderEnabled: boolean;
  notes?: string;
}

export interface UpdateScheduleInput {
  plantId?: string;
  plantName?: string;
  taskType?: TaskType;
  title?: string;
  dateTime?: Date;
  isRecurring?: boolean;
  frequency?: TaskFrequency | null;
  daysOfWeek?: number[];
  reminderEnabled?: boolean;
  status?: TaskStatus;
  notes?: string;
  lastCompletedAt?: Date | null;
}

export const SCHEDULE_FREQUENCY_LABELS: Record<TaskFrequency, string> = {
  once: "Once",
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

export const SCHEDULE_STATUS_LABELS: Record<TaskStatus, string> = {
  active: "Active",
  completed: "Completed",
  paused: "Paused",
  archived: "Archived",
};

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  watering: "Water",
  fertilizing: "Fertilise",
  pruning: "Prune",
  repotting: "Repot",
  note: "Note",
};

export function getDefaultScheduleTitle(taskType: TaskType, plantName: string) {
  return `${TASK_TYPE_LABELS[taskType]} - ${plantName}`;
}

export function formatScheduleFrequency(
  frequency: TaskFrequency | null | undefined,
  daysOfWeek?: number[],
): string {
  if (!frequency || frequency === "once") return "One time";
  if (frequency === "daily") return "Every day";
  if (frequency === "weekly" && daysOfWeek && daysOfWeek.length > 0) {
    const days = daysOfWeek.map((d) => DAY_LABELS[d]).join(", ");
    return `Weekly: ${days}`;
  }
  if (frequency === "weekly") return "Weekly";
  if (frequency === "biweekly") return "Every 2 weeks";
  if (frequency === "monthly") return "Monthly";
  return "N/A";
}
