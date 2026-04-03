/**
 * Care Schedules Provider — Manages recurring care schedule state
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/providers/auth-provider";
import {
  archiveSchedule,
  createCareScheduleDoc,
  deleteCareScheduleDoc,
  markScheduleCompleted,
  subscribeCareSchedules,
  toggleScheduleStatus,
  updateCareScheduleDoc,
} from "@/services/firebase/care-schedule-service";
import {
  type CareSchedule,
  type CreateScheduleInput,
  type UpdateScheduleInput,
} from "@/types/care-schedule";

interface CareSchedulesContextValue {
  schedules: CareSchedule[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addSchedule: (input: CreateScheduleInput) => Promise<string>;
  updateSchedule: (
    scheduleId: string,
    input: UpdateScheduleInput,
  ) => Promise<void>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  markCompleted: (scheduleId: string) => Promise<void>;
  toggleStatus: (scheduleId: string, currentStatus: string) => Promise<void>;
  archiveSchedule: (scheduleId: string) => Promise<void>;
  getSchedulesForPlant: (plantId: string) => CareSchedule[];
  getActiveSchedules: () => CareSchedule[];
}

const CareSchedulesContext = createContext<
  CareSchedulesContextValue | undefined
>(undefined);

export function CareSchedulesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const userId = user?.uid;
  const [schedules, setSchedules] = useState<CareSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to schedules on mount
  useEffect(() => {
    if (!userId) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeCareSchedules(userId, (newSchedules) => {
      setSchedules(newSchedules);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const refresh = useCallback(() => {
    // Real-time listener will handle refresh automatically
    // This is here for manual refresh triggers if needed
  }, []);

  const addSchedule = useCallback(
    async (input: CreateScheduleInput): Promise<string> => {
      if (!userId) throw new Error("User not authenticated");
      try {
        const scheduleId = await createCareScheduleDoc(userId, input);
        return scheduleId;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create schedule";
        setError(message);
        throw err;
      }
    },
    [userId],
  );

  const updateSchedule = useCallback(
    async (scheduleId: string, input: UpdateScheduleInput): Promise<void> => {
      try {
        await updateCareScheduleDoc(scheduleId, input);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update schedule";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const deleteSchedule = useCallback(
    async (scheduleId: string): Promise<void> => {
      try {
        await deleteCareScheduleDoc(scheduleId);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete schedule";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const markCompleted = useCallback(
    async (scheduleId: string): Promise<void> => {
      try {
        await markScheduleCompleted(scheduleId);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to mark completed";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const toggleStatusFn = useCallback(
    async (scheduleId: string, currentStatus: string): Promise<void> => {
      try {
        await toggleScheduleStatus(scheduleId, currentStatus);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to toggle status";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const archiveScheduleFn = useCallback(
    async (scheduleId: string): Promise<void> => {
      try {
        await archiveSchedule(scheduleId);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to archive schedule";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const getSchedulesForPlant = useCallback(
    (plantId: string): CareSchedule[] => {
      return schedules.filter(
        (s) => s.plantId === plantId && s.status === "active",
      );
    },
    [schedules],
  );

  const getActiveSchedules = useCallback((): CareSchedule[] => {
    return schedules.filter((s) => s.status === "active");
  }, [schedules]);

  const value: CareSchedulesContextValue = {
    schedules,
    loading,
    error,
    refresh,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    markCompleted,
    toggleStatus: toggleStatusFn,
    archiveSchedule: archiveScheduleFn,
    getSchedulesForPlant,
    getActiveSchedules,
  };

  return (
    <CareSchedulesContext.Provider value={value}>
      {children}
    </CareSchedulesContext.Provider>
  );
}

export function useCareSchedules(): CareSchedulesContextValue {
  const context = useContext(CareSchedulesContext);
  if (!context) {
    throw new Error(
      "useCareSchedules must be used within CareSchedulesProvider",
    );
  }
  return context;
}
