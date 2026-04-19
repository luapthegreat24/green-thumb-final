import {
  Plant,
  Seed,
  WaterLog,
  getUserPlants,
  getUserSeeds,
  getWaterLogs,
} from "@/services/firestore";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

interface UseUserPlantsReturn {
  plants: Plant[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserPlants(userId: string | undefined): UseUserPlantsReturn {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlants = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userPlants = await getUserPlants(userId);
      setPlants(userPlants);
    } catch (err: any) {
      console.error("Error in useUserPlants:", err);
      setError(err.message || "Failed to load plants");
      Alert.alert("Error", "Failed to load your plants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, [userId]);

  return { plants, loading, error, refetch: fetchPlants };
}

interface UseWaterLogsReturn {
  logs: WaterLog[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWaterLogs(plantId: string | undefined): UseWaterLogsReturn {
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (!plantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const waterLogs = await getWaterLogs(plantId);
      setLogs(waterLogs);
    } catch (err: any) {
      console.error("Error in useWaterLogs:", err);
      setError(err.message || "Failed to load water logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [plantId]);

  return { logs, loading, error, refetch: fetchLogs };
}

interface UseUserSeedsReturn {
  seeds: Seed[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserSeeds(userId: string | undefined): UseUserSeedsReturn {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeeds = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userSeeds = await getUserSeeds(userId);
      setSeeds(userSeeds);
    } catch (err: any) {
      console.error("Error in useUserSeeds:", err);
      setError(err.message || "Failed to load seeds");
      Alert.alert("Error", "Failed to load your seeds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeeds();
  }, [userId]);

  return { seeds, loading, error, refetch: fetchSeeds };
}
