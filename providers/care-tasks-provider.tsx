import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAppToast } from "@/providers/app-toast-provider";
import { useAuth } from "@/providers/auth-provider";
import { useGarden } from "@/providers/garden-provider";
import {
  cancelTaskReminderNotification,
  createCareTaskDoc,
  deleteCareTaskDoc,
  scheduleTaskReminderNotification,
  subscribeCareTasks,
  updateCareTaskDoc,
} from "@/services/firebase/care-task-service";
import {
  deriveTaskStatus,
  getDefaultTaskTitle,
  type CareTask,
  type CreateTaskInput,
  type TaskStatus,
  type UpdateTaskInput,
} from "@/types/care-task";

interface CareTasksContextValue {
  tasks: CareTask[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addTask: (input: CreateTaskInput) => Promise<string>;
  updateTask: (taskId: string, input: UpdateTaskInput) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  markAsCompleted: (taskId: string) => Promise<void>;
  markAsPending: (taskId: string) => Promise<void>;
  getTasksByStatus: (status: TaskStatus) => CareTask[];
  getTasksForPlant: (plantId: string) => CareTask[];
}

const CareTasksContext = createContext<CareTasksContextValue | undefined>(
  undefined,
);

function mergeTaskWithNow(task: CareTask, now: Date) {
  return {
    ...task,
    status: deriveTaskStatus(task.dateTime, task.status, now),
  };
}

function addInterval(dateTime: Date, frequency?: string | null) {
  const nextDate = new Date(dateTime);
  if (frequency === "daily") {
    nextDate.setDate(nextDate.getDate() + 1);
    return nextDate;
  }

  nextDate.setDate(nextDate.getDate() + 7);
  return nextDate;
}

export function CareTasksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useAppToast();
  const { plants } = useGarden();
  const [rawTasks, setRawTasks] = useState<CareTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) {
      setRawTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeCareTasks(user.uid, (nextTasks) => {
      setRawTasks(nextTasks);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user, refreshTick]);

  useEffect(() => {
    if (!user || rawTasks.length === 0) return;

    rawTasks.forEach((task) => {
      if (task.status === "pending" && task.dateTime.getTime() < Date.now()) {
        void updateCareTaskDoc(task.id, { status: "missed" });
      }
    });
  }, [rawTasks, user, nowTick]);

  const tasks = useMemo(
    () => rawTasks.map((task) => mergeTaskWithNow(task, new Date(nowTick))),
    [nowTick, rawTasks],
  );

  const findPlantName = useCallback(
    (plantId: string, fallback?: string) => {
      return (
        plants.find((plant) => plant.id === plantId)?.name ??
        fallback ??
        "Plant"
      );
    },
    [plants],
  );

  const addTask = useCallback(
    async (input: CreateTaskInput) => {
      if (!user) throw new Error("You must be signed in.");

      setError(null);
      const plantName =
        input.plantName.trim() || findPlantName(input.plantId, input.plantName);
      const taskId = await createCareTaskDoc(user.uid, {
        ...input,
        plantName,
        title:
          input.title?.trim() || getDefaultTaskTitle(input.taskType, plantName),
      });

      const scheduledTask = {
        id: taskId,
        userId: user.uid,
        plantId: input.plantId,
        plantName,
        taskType: input.taskType,
        title:
          input.title?.trim() || getDefaultTaskTitle(input.taskType, plantName),
        dateTime: input.dateTime,
        status: "pending" as const,
        isRecurring: input.isRecurring,
        frequency: input.isRecurring ? (input.frequency ?? null) : null,
        notes: input.notes,
        reminderEnabled: input.reminderEnabled,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        notificationId: null,
      };

      const notificationId =
        await scheduleTaskReminderNotification(scheduledTask);
      if (notificationId) {
        await updateCareTaskDoc(taskId, { notificationId });
      }

      showToast("Task added successfully");

      return taskId;
    },
    [findPlantName, showToast, user],
  );

  const updateTask = useCallback(
    async (taskId: string, input: UpdateTaskInput) => {
      if (!user) throw new Error("You must be signed in.");

      setError(null);
      const currentTask = rawTasks.find((task) => task.id === taskId);
      if (!currentTask) {
        throw new Error("Task not found.");
      }

      const mergedTask: CareTask = {
        ...currentTask,
        ...input,
        plantId: input.plantId ?? currentTask.plantId,
        plantName: input.plantName ?? currentTask.plantName,
        taskType: input.taskType ?? currentTask.taskType,
        title: input.title ?? currentTask.title,
        dateTime: input.dateTime ?? currentTask.dateTime,
        status: input.status ?? currentTask.status,
        isRecurring: input.isRecurring ?? currentTask.isRecurring,
        frequency:
          input.frequency !== undefined
            ? input.frequency
            : (currentTask.frequency ?? null),
        notes: input.notes ?? currentTask.notes,
        reminderEnabled: input.reminderEnabled ?? currentTask.reminderEnabled,
        notificationId:
          input.notificationId ?? currentTask.notificationId ?? null,
        completedAt:
          input.completedAt !== undefined
            ? input.completedAt
            : (currentTask.completedAt ?? null),
      };

      if (currentTask.notificationId) {
        await cancelTaskReminderNotification(currentTask.notificationId);
      }

      await updateCareTaskDoc(taskId, {
        ...input,
        plantId: mergedTask.plantId,
        plantName: mergedTask.plantName,
        taskType: mergedTask.taskType,
        title: mergedTask.title,
        dateTime: mergedTask.dateTime,
        status: mergedTask.status,
        isRecurring: mergedTask.isRecurring,
        frequency: mergedTask.frequency,
        notes: mergedTask.notes,
        reminderEnabled: mergedTask.reminderEnabled,
        notificationId: null,
        completedAt: mergedTask.completedAt,
      });

      if (mergedTask.reminderEnabled && mergedTask.status !== "completed") {
        const notificationId =
          await scheduleTaskReminderNotification(mergedTask);
        if (notificationId) {
          await updateCareTaskDoc(taskId, { notificationId });
        }
      }

      showToast("Task updated successfully");
    },
    [rawTasks, showToast, user],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      setError(null);
      const currentTask = rawTasks.find((task) => task.id === taskId);
      if (currentTask?.notificationId) {
        await cancelTaskReminderNotification(currentTask.notificationId);
      }
      await deleteCareTaskDoc(taskId);
      showToast("Task deleted");
    },
    [rawTasks, showToast],
  );

  const markAsCompleted = useCallback(
    async (taskId: string) => {
      const currentTask = rawTasks.find((task) => task.id === taskId);
      if (!currentTask) {
        throw new Error("Task not found.");
      }

      if (currentTask.notificationId) {
        await cancelTaskReminderNotification(currentTask.notificationId);
      }

      const completedAt = new Date();
      await updateCareTaskDoc(taskId, {
        status: "completed",
        completedAt,
        notificationId: null,
      });

      if (currentTask.isRecurring && currentTask.frequency) {
        const nextDateTime = addInterval(
          currentTask.dateTime,
          currentTask.frequency,
        );
        const nextTaskInput: CreateTaskInput = {
          plantId: currentTask.plantId,
          plantName: currentTask.plantName,
          taskType: currentTask.taskType,
          title: currentTask.title,
          dateTime: nextDateTime,
          isRecurring: true,
          frequency: currentTask.frequency,
          notes: currentTask.notes,
          reminderEnabled: currentTask.reminderEnabled,
        };
        await addTask(nextTaskInput);
      }

      showToast("Task completed");
    },
    [addTask, rawTasks, showToast],
  );

  const markAsPending = useCallback(
    async (taskId: string) => {
      await updateTask(taskId, {
        status: "pending",
        completedAt: null,
      });
    },
    [updateTask],
  );

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => tasks.filter((task) => task.status === status),
    [tasks],
  );

  const getTasksForPlant = useCallback(
    (plantId: string) => tasks.filter((task) => task.plantId === plantId),
    [tasks],
  );

  const refresh = useCallback(() => {
    setError(null);
    setRefreshTick((current) => current + 1);
    setNowTick(Date.now());
  }, []);

  const value = useMemo<CareTasksContextValue>(
    () => ({
      tasks,
      loading,
      error,
      refresh,
      addTask,
      updateTask,
      deleteTask,
      markAsCompleted,
      markAsPending,
      getTasksByStatus,
      getTasksForPlant,
    }),
    [
      tasks,
      loading,
      error,
      refresh,
      addTask,
      updateTask,
      deleteTask,
      markAsCompleted,
      markAsPending,
      getTasksByStatus,
      getTasksForPlant,
    ],
  );

  return (
    <CareTasksContext.Provider value={value}>
      {children}
    </CareTasksContext.Provider>
  );
}

export function useCareTasks() {
  const context = useContext(CareTasksContext);
  if (context === undefined) {
    throw new Error("useCareTasks must be used within CareTasksProvider");
  }
  return context;
}
