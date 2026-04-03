import * as Location from "expo-location";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchWeatherForCoordinates,
  type WeatherSnapshot,
} from "@/services/weather/meteosource-service";

type WeatherContextValue = {
  weather: WeatherSnapshot | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const WeatherContext = createContext<WeatherContextValue | undefined>(
  undefined,
);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndStoreWeather = async () => {
    try {
      setError(null);

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        throw new Error("Location permission denied.");
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextWeather = await fetchWeatherForCoordinates(
        position.coords.latitude,
        position.coords.longitude,
      );

      setWeather(nextWeather);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to fetch weather";
      setError(message);
    }
  };

  useEffect(() => {
    let alive = true;

    const bootstrap = async () => {
      await fetchAndStoreWeather();
      if (alive) {
        setLoading(false);
      }
    };

    bootstrap();

    return () => {
      alive = false;
    };
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await fetchAndStoreWeather();
    setRefreshing(false);
  };

  const value = useMemo<WeatherContextValue>(
    () => ({
      weather,
      loading,
      refreshing,
      error,
      refresh,
    }),
    [weather, loading, refreshing, error],
  );

  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error("useWeather must be used inside WeatherProvider.");
  }

  return context;
}
