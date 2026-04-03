const METEOSOURCE_API_KEY = "p314ejozmsn2jghmyrz8fyh50t90iuvev43zjiuq";
const METEOSOURCE_BASE_URL = "https://www.meteosource.com/api/v1/free";

type MeteosourceCurrent = {
  summary?: string;
  weather?: string;
  icon?: number;
  temperature?: number;
  humidity?: number;
  relative_humidity?: number;
  precipitation?: {
    total?: number;
    type?: string;
  };
  probability?: {
    precipitation?: number;
  };
  cloud_cover?: {
    total?: number;
  };
};

type MeteosourceHourlyItem = {
  humidity?: number;
  relative_humidity?: number;
  probability?: {
    precipitation?: number;
  };
  precipitation?: {
    total?: number;
    type?: string;
  };
};

type MeteosourceDailyItem = {
  day?: string;
  weather?: string;
  icon?: number;
  all_day?: {
    temperature_min?: number;
    temperature_max?: number;
    precipitation?: {
      total?: number;
      type?: string;
    };
  };
};

type MeteosourcePointResponse = {
  current?: MeteosourceCurrent;
  hourly?: {
    data?: MeteosourceHourlyItem[];
  };
  daily?: {
    data?: MeteosourceDailyItem[];
  };
};

type MeteosourceNearestPlaceResponse = {
  name?: string;
  adm_area1?: string | null;
  country?: string;
};

export type WeatherForecastItem = {
  dayLabel: string;
  iconCode: number;
  iconKey: string;
  tempMin: number;
  tempMax: number;
};

export type WeatherSnapshot = {
  locationLabel: string;
  condition: string;
  iconCode: number;
  iconKey: string;
  temperature: number;
  humidity: number | null;
  rainProbability: number | null;
  forecast: WeatherForecastItem[];
  insight: string;
  updatedAtIso: string;
};

function toQuery(params: Record<string, string | number>) {
  return Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");
}

async function getJson<T>(
  path: string,
  params: Record<string, string | number>,
) {
  const query = toQuery({ ...params, key: METEOSOURCE_API_KEY });
  const response = await fetch(`${METEOSOURCE_BASE_URL}${path}?${query}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Weather request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as T;
}

function toDayLabel(dateString?: string) {
  if (!dateString) return "-";
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function clampPercent(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function pickFirstNumber(values: unknown[]) {
  for (const value of values) {
    const numeric = asNumber(value);
    if (numeric !== null) return numeric;
  }
  return null;
}

function roundTemp(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.round(value);
}

function pickRainProbability(point: MeteosourcePointResponse) {
  // Probability is typically forecast-derived; prefer hourly forecast values.
  const currentProbability = clampPercent(
    pickFirstNumber([
      point.current?.probability?.precipitation,
      (point.current as unknown as { precipitation_probability?: unknown })
        ?.precipitation_probability,
    ]) ?? undefined,
  );
  if (currentProbability !== null) return currentProbability;

  const nextHours = (point.hourly?.data ?? []).slice(0, 12);
  const hourlyProbabilities = nextHours
    .map((item) =>
      clampPercent(
        pickFirstNumber([
          item.probability?.precipitation,
          (item as unknown as { precipitation_probability?: unknown })
            ?.precipitation_probability,
        ]) ?? undefined,
      ),
    )
    .filter((value): value is number => value !== null);

  if (hourlyProbabilities.length > 0) {
    return Math.max(...hourlyProbabilities);
  }

  // Fallback when explicit probability is unavailable: infer chance from hourly rain amounts.
  const hourlyPrecip = nextHours
    .map((item) => asNumber(item.precipitation?.total) ?? 0)
    .filter((value) => value > 0);
  if (hourlyPrecip.length > 0) {
    const rainyHourRatio = hourlyPrecip.length / Math.max(1, nextHours.length);
    return clampPercent(rainyHourRatio * 100);
  }

  const todayRain = point.daily?.data?.[0]?.all_day?.precipitation?.total ?? 0;
  if ((asNumber(todayRain) ?? 0) > 0) return 70;

  return 0;
}

function pickHumidity(point: MeteosourcePointResponse) {
  const current = point.current;
  const firstHourly = point.hourly?.data?.[0];

  const humidity = pickFirstNumber([
    current?.humidity,
    current?.relative_humidity,
    (current as unknown as { humidity_relative?: unknown })?.humidity_relative,
    firstHourly?.humidity,
    firstHourly?.relative_humidity,
    (firstHourly as unknown as { humidity_relative?: unknown })
      ?.humidity_relative,
  ]);

  return clampPercent(humidity ?? undefined);
}

function buildInsight(snapshot: {
  condition: string;
  temperature: number;
  rainProbability: number | null;
}) {
  const conditionText = snapshot.condition.toLowerCase();

  if (
    (snapshot.rainProbability !== null && snapshot.rainProbability >= 60) ||
    conditionText.includes("rain")
  ) {
    return "Rain expected today - skip watering.";
  }

  if (snapshot.temperature >= 30) {
    return "Hot weather - increase watering frequency.";
  }

  if (snapshot.temperature <= 8) {
    return "Cool weather - reduce watering and check soil moisture.";
  }

  return "Good conditions for plant growth.";
}

export async function fetchWeatherForCoordinates(lat: number, lon: number) {
  const [place, point] = await Promise.all([
    getJson<MeteosourceNearestPlaceResponse>("/nearest_place", {
      lat,
      lon,
      language: "en",
    }),
    getJson<MeteosourcePointResponse>("/point", {
      lat,
      lon,
      sections: "current,daily,hourly",
      timezone: "auto",
      units: "metric",
      language: "en",
    }),
  ]);

  if (__DEV__) {
    console.log("[weather] Meteosource /point response", point);
    console.log("[weather] Meteosource /nearest_place response", place);
  }

  const condition = point.current?.summary ?? "Weather unavailable";
  const temperature = roundTemp(point.current?.temperature);
  const humidity = pickHumidity(point);
  const rainProbability = pickRainProbability(point);
  const forecast = (point.daily?.data ?? []).slice(0, 5).map((item) => ({
    dayLabel: toDayLabel(item.day),
    iconCode: item.icon ?? 1,
    iconKey: item.weather ?? "not_available",
    tempMin: roundTemp(item.all_day?.temperature_min),
    tempMax: roundTemp(item.all_day?.temperature_max),
  }));

  const locationBits = [place.name, place.adm_area1, place.country].filter(
    Boolean,
  );
  const locationLabel = locationBits.join(", ") || "Your location";

  const snapshot: WeatherSnapshot = {
    locationLabel,
    condition,
    iconCode: point.current?.icon ?? 1,
    iconKey: point.current?.weather ?? "not_available",
    temperature,
    humidity,
    rainProbability,
    forecast,
    insight: buildInsight({ condition, temperature, rainProbability }),
    updatedAtIso: new Date().toISOString(),
  };

  return snapshot;
}
