/**
 * DashboardScreen — Herbarium
 *
 * Design language: "Pressed Specimen" — botanical field journal meets luxury wellness.
 * Earthy sage/forest greens on warm off-white paper. Organic rule-lines. Editorial
 * typographic rhythm with monospace accents. Asymmetric layouts. Slow, intentional
 * Animated.timing entrances + spring press feedback.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SP, TY } from "@/constants/herbarium-theme";
import { useFadeUp, usePressScale } from "@/hooks/use-screen-animations";
import { useAuth } from "@/providers/auth-provider";
import { useGarden } from "@/providers/garden-provider";
import { useWeather } from "@/providers/weather-provider";

// ─── Design tokens (self-contained, no P import needed) ──────────────────────

const D = {
  paper: "#F7F4EF", // warm off-white background
  paperMid: "#EDE8DF", // slightly darker surface
  paperRule: "#D8D0C4", // hairline rules
  white: "#FFFFFF", // card surface

  forest: "#2A5C3F", // primary green — deep
  sage: "#5C8B6E", // secondary green — mid
  mist: "#C5D9CC", // ghost green — borders
  leafBg: "#EBF2ED", // tinted green surface

  terracotta: "#C4623A", // warm alert / overdue
  terracottaSoft: "#F0E0D8", // soft alert surface
  amber: "#B87A2A", // fertilize accent
  amberSoft: "#F2E8D5", // fertilize surface

  ink: "#1C2318", // primary text
  inkMid: "#4A5544", // secondary text
  inkFaint: "#8A9585", // tertiary text / labels

  rule: "#C8C0B4", // visible dividers

  r: {
    sm: 6,
    md: 12,
    lg: 20,
    pill: 999,
  },
} as const;

// ─── Primitive atoms ──────────────────────────────────────────────────────────

function Rule({ style }: { style?: object }) {
  return <View style={[{ height: 1, backgroundColor: D.rule }, style]} />;
}

/** Monospaced uppercase specimen-tag label */
function Mono({ children, style }: { children: string; style?: object }) {
  return <Text style={[S.mono, style]}>{children}</Text>;
}

// ─── Stat cell (inside masthead) ──────────────────────────────────────────────

function StatCell({
  value,
  label,
  urgent = false,
  delay = 0,
}: {
  value: string;
  label: string;
  urgent?: boolean;
  delay?: number;
}) {
  const anim = useFadeUp(delay);
  return (
    <Animated.View style={[S.statCell, anim]}>
      <Text style={[S.statValue, urgent && { color: D.terracotta }]}>
        {value}
      </Text>
      <Mono style={urgent ? { color: D.terracotta } : undefined}>{label}</Mono>
    </Animated.View>
  );
}

// ─── Section header atom ──────────────────────────────────────────────────────

function SectionHead({
  title,
  sub,
  badge,
}: {
  title: string;
  sub?: string;
  badge?: { label: string; urgent?: boolean };
}) {
  return (
    <View style={S.sectionHead}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={S.sectionTitle}>{title}</Text>
        {sub && <Mono>{sub}</Mono>}
      </View>
      {badge && (
        <View style={[S.badge, badge.urgent && S.badgeUrgent]}>
          <Mono
            style={badge.urgent ? { color: D.terracotta } : { color: D.sage }}
          >
            {badge.label}
          </Mono>
        </View>
      )}
    </View>
  );
}

// ─── Plant chip ───────────────────────────────────────────────────────────────

function PlantChip({ name, delay }: { name: string; delay: number }) {
  const anim = useFadeUp(delay);
  return (
    <Animated.View style={[S.plantChip, anim]}>
      <View style={S.chipDot} />
      <Text style={S.chipText}>{name}</Text>
    </Animated.View>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

const TASK_CFG: Record<
  string,
  { icon: string; color: string; bg: string; verb: string }
> = {
  watering: {
    icon: "water-outline",
    color: D.forest,
    bg: D.leafBg,
    verb: "Water",
  },
  fertilizing: {
    icon: "flask-outline",
    color: D.amber,
    bg: D.amberSoft,
    verb: "Fertilise",
  },
  pruning: {
    icon: "cut-outline",
    color: D.inkMid,
    bg: D.paperMid,
    verb: "Prune",
  },
};

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff > 1) return `${diff}d ago`;
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toLowerCase();
}

function TaskRow({ task, index }: { task: any; index: number }) {
  const cfg = TASK_CFG[task.taskType] ?? TASK_CFG.watering;
  const { scale, onPressIn, onPressOut } = usePressScale();
  const anim = useFadeUp(80 + index * 55);

  return (
    <Animated.View style={anim}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
        <Animated.View
          style={[
            S.taskRow,
            task.isOverdue && S.taskRowOverdue,
            { transform: [{ scale }] },
          ]}
        >
          {/* Coloured left stripe */}
          <View
            style={[
              S.taskStripe,
              { backgroundColor: task.isOverdue ? D.terracotta : cfg.color },
            ]}
          />

          {/* Icon bubble */}
          <View style={[S.taskIconBubble, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
          </View>

          {/* Plant + verb */}
          <View style={S.taskMeta}>
            <Text style={S.taskPlant} numberOfLines={1}>
              {task.plant?.name ?? "Unknown"}
            </Text>
            <Mono>{cfg.verb.toLowerCase()}</Mono>
          </View>

          {/* Date chip */}
          <View
            style={[
              S.taskDate,
              task.isOverdue
                ? S.taskDateOverdue
                : task.isToday
                  ? S.taskDateToday
                  : S.taskDateDefault,
            ]}
          >
            <Mono
              style={
                task.isOverdue
                  ? { color: D.terracotta }
                  : task.isToday
                    ? { color: D.forest }
                    : undefined
              }
            >
              {fmtDate(task.displayDate)}
            </Mono>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Weather section ──────────────────────────────────────────────────────────

function weatherIcon(key: string, code: number): string {
  const t = key.toLowerCase();
  if (t.includes("thunder") || [14, 15].includes(code))
    return "thunderstorm-outline";
  if (t.includes("rain") || [10, 11, 12, 13].includes(code))
    return "rainy-outline";
  if (t.includes("snow") || [16, 17].includes(code)) return "snow-outline";
  if (t.includes("cloud") || [5, 6, 7].includes(code)) return "cloud-outline";
  if (t.includes("fog") || code === 9) return "cloudy-outline";
  return "sunny-outline";
}

function WeatherCard({
  loading,
  error,
  weather,
}: {
  loading: boolean;
  error: string | null;
  weather: any;
}) {
  const anim = useFadeUp(100);

  if (loading) {
    return (
      <Animated.View style={[S.card, S.rowCenter, anim]}>
        <ActivityIndicator size="small" color={D.sage} />
        <Text style={S.faint}>Fetching local weather…</Text>
      </Animated.View>
    );
  }
  if (error) {
    return (
      <Animated.View style={[S.card, anim]}>
        <Text style={S.bodyStrong}>Unable to fetch weather</Text>
        <Text style={[S.faint, { marginTop: 4 }]}>{error}</Text>
      </Animated.View>
    );
  }
  if (!weather) return null;

  return (
    <Animated.View style={[S.card, anim]}>
      {/* Top: temperature block + meta pills */}
      <View style={S.weatherTop}>
        <View style={{ flex: 1, gap: 4 }}>
          {/* Condition badge */}
          <View style={S.conditionBadge}>
            <Ionicons
              name={weatherIcon(weather.iconKey, weather.iconCode) as any}
              size={12}
              color={D.sage}
            />
            <Text style={S.conditionText}>
              {weather.condition.toLowerCase()}
            </Text>
          </View>

          {/* Giant temperature — landmark element */}
          <Text style={S.tempDisplay}>{weather.temperature}°</Text>
          <Text style={S.locationText}>{weather.locationLabel}</Text>
        </View>

        {/* Right: stacked meta pills */}
        <View style={S.weatherPills}>
          {weather.rainProbability !== null && (
            <View style={S.metaPill}>
              <Ionicons name="rainy-outline" size={11} color={D.sage} />
              <View style={{ gap: 1 }}>
                <Mono>rain</Mono>
                <Text style={S.metaPillValue}>{weather.rainProbability}%</Text>
              </View>
            </View>
          )}
          {weather.humidity !== null && (
            <View style={S.metaPill}>
              <Ionicons name="water-outline" size={11} color={D.sage} />
              <View style={{ gap: 1 }}>
                <Mono>humidity</Mono>
                <Text style={S.metaPillValue}>{weather.humidity}%</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Botanical insight banner */}
      <View style={S.insightBanner}>
        <View style={S.insightPip} />
        <Text style={S.insightText}>{weather.insight}</Text>
      </View>

      <Rule style={{ marginVertical: SP.sm }} />

      {/* 5-day horizontal forecast */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: SP.sm }}
      >
        {weather.forecast.slice(0, 5).map((item: any, i: number) => (
          <View key={i} style={S.forecastChip}>
            <Mono>{item.dayLabel.slice(0, 3)}</Mono>
            <Ionicons
              name={weatherIcon(item.iconKey, item.iconCode) as any}
              size={13}
              color={D.sage}
            />
            <Text style={S.forecastTemp}>
              {item.tempMax}°/{item.tempMin}°
            </Text>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
  const {
    plants,
    schedules,
    loading,
    careLogs,
    refreshing: gardenRefreshing,
    refresh: refreshGarden,
  } = useGarden();
  const {
    weather,
    loading: weatherLoading,
    error: weatherError,
    refreshing: weatherRefreshing,
    refresh: refreshWeather,
  } = useWeather();

  const mastheadAnim = useFadeUp(0);
  const gardenSectionAnim = useFadeUp(180);
  const tasksSectionAnim = useFadeUp(250);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      totalPlants: plants.length,
      plantsNeedingToday: schedules.filter(
        (s) => s.dueAt.split("T")[0] <= today && s.status === "pending",
      ).length,
      recentlyAdded: plants.slice(0, 4),
      totalActions: careLogs.length,
    };
  }, [plants, schedules, careLogs]);

  const upcomingTasks = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return schedules
      .filter((s) => s.status === "pending")
      .sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))
      .slice(0, 6)
      .map((s) => {
        const d = s.dueAt.split("T")[0];
        return {
          ...s,
          plant: plants.find((p) => p.id === s.plantId),
          isOverdue: d < today,
          isToday: d === today,
          displayDate: d,
        };
      });
  }, [schedules, plants]);

  if (loading) {
    return (
      <View style={S.loadScreen}>
        <ActivityIndicator size="large" color={D.forest} />
        <Text style={S.faint}>Loading your garden…</Text>
      </View>
    );
  }

  const name = (
    profile?.displayName ||
    user?.displayName ||
    "there"
  ).toLowerCase();
  const refreshing = gardenRefreshing || weatherRefreshing;
  const onRefresh = () => Promise.all([refreshGarden(), refreshWeather()]);
  const dateLabel = new Date()
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toLowerCase();

  return (
    <ScrollView
      style={S.screen}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={D.forest}
        />
      }
      contentContainerStyle={[
        S.scroll,
        {
          paddingTop: insets.top + SP.sm,
          paddingBottom: insets.bottom + SP.xxxl + 84,
        },
      ]}
    >
      {/* ───────────────────────────────────────────
          1. MASTHEAD
          Editorial structure: date / rule / big name / rule / stat trio
      ─────────────────────────────────────────── */}
      <Animated.View style={[S.card, mastheadAnim]}>
        {/* Datestamp + plant count */}
        <View style={S.mastheadTopRow}>
          <Mono>{dateLabel}</Mono>
          <View style={S.rowCenter}>
            <Ionicons
              name="leaf"
              size={10}
              color={D.sage}
              style={{ marginRight: 4 }}
            />
            <Mono>{`${stats.totalPlants} plants`}</Mono>
          </View>
        </View>

        <Rule />

        {/* Hero greeting */}
        <View style={S.mastheadBody}>
          <Text style={S.mastheadHello}>hello,</Text>
          <Text style={S.mastheadName}>{name}</Text>
        </View>

        <Rule />

        {/* Stat trio */}
        <View style={S.statRow}>
          <StatCell
            value={String(stats.totalPlants)}
            label="plants"
            delay={60}
          />
          <View style={S.statDivider} />
          <StatCell
            value={String(stats.plantsNeedingToday)}
            label="due today"
            urgent={stats.plantsNeedingToday > 0}
            delay={130}
          />
          <View style={S.statDivider} />
          <StatCell
            value={String(stats.totalActions)}
            label="care logs"
            delay={200}
          />
        </View>
      </Animated.View>

      {/* ───────────────────────────────────────────
          2. WEATHER
      ─────────────────────────────────────────── */}
      <WeatherCard
        loading={weatherLoading}
        error={weatherError}
        weather={weather}
      />

      {/* ───────────────────────────────────────────
          3. GARDEN COLLECTION
      ─────────────────────────────────────────── */}
      {stats.totalPlants > 0 ? (
        <Animated.View style={[S.card, gardenSectionAnim]}>
          <SectionHead
            title="your garden"
            sub={`${stats.totalPlants} specimen${stats.totalPlants !== 1 ? "s" : ""} in care`}
          />
          <Rule />
          <View style={S.chipRow}>
            {stats.recentlyAdded.map((p, i) => (
              <PlantChip key={p.id} name={p.name} delay={220 + i * 60} />
            ))}
            {stats.totalPlants > 4 && (
              <View style={[S.plantChip, { backgroundColor: D.paperMid }]}>
                <Text style={S.chipText}>+{stats.totalPlants - 4} more</Text>
              </View>
            )}
          </View>
        </Animated.View>
      ) : (
        <Animated.View style={[S.card, S.emptyCard, gardenSectionAnim]}>
          <Ionicons name="leaf-outline" size={26} color={D.mist} />
          <Text style={S.emptyTitle}>no plants yet</Text>
          <Text style={S.faint}>add your first specimen to begin</Text>
        </Animated.View>
      )}

      {/* ───────────────────────────────────────────
          4. CARE SCHEDULE
      ─────────────────────────────────────────── */}
      {upcomingTasks.length > 0 ? (
        <Animated.View style={[S.card, tasksSectionAnim]}>
          <SectionHead
            title="care schedule"
            sub="upcoming tasks"
            badge={
              stats.plantsNeedingToday > 0
                ? { label: `${stats.plantsNeedingToday} due`, urgent: true }
                : undefined
            }
          />
          <Rule />
          <View style={{ gap: 0 }}>
            {upcomingTasks.map((t, i) => (
              <TaskRow key={t.id} task={t} index={i} />
            ))}
          </View>
          <Mono style={{ textAlign: "center", marginTop: SP.sm }}>
            tap to mark complete
          </Mono>
        </Animated.View>
      ) : (
        <Animated.View style={[S.card, S.emptyCard, tasksSectionAnim]}>
          <View style={S.allDoneIcon}>
            <Ionicons name="checkmark-done" size={20} color={D.forest} />
          </View>
          <Text style={S.emptyTitle}>all caught up</Text>
          <Text style={S.faint}>no pending tasks — well tended!</Text>
        </Animated.View>
      )}
    </ScrollView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: D.paper },
  scroll: { paddingHorizontal: SP.lg, gap: SP.lg },
  loadScreen: {
    flex: 1,
    backgroundColor: D.paper,
    alignItems: "center",
    justifyContent: "center",
    gap: SP.sm,
  },

  // ── Atoms
  mono: {
    fontFamily: "System",
    fontSize: 10,
    letterSpacing: 0.9,
    color: D.inkFaint,
    textTransform: "uppercase" as const,
    fontWeight: "500" as const,
  },
  faint: { ...TY.body, fontSize: 13, color: D.inkFaint },
  bodyStrong: {
    ...TY.body,
    fontSize: 15,
    fontWeight: "700" as const,
    color: D.ink,
  },
  rowCenter: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: SP.sm,
  },

  // ── Card shell
  card: {
    backgroundColor: D.white,
    borderRadius: D.r.lg,
    borderWidth: 1,
    borderColor: D.rule,
    padding: SP.lg,
    gap: SP.lg,
  },

  // ── Masthead
  mastheadTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SP.md,
  },
  mastheadBody: { gap: 2, marginBottom: SP.sm },
  mastheadHello: {
    ...TY.body,
    fontSize: 12,
    color: D.inkFaint,
    fontWeight: "500" as const,
    letterSpacing: 0.3,
  },
  mastheadName: {
    fontFamily: "System",
    fontSize: 34,
    color: D.forest,
    fontWeight: "400" as const,
    letterSpacing: -0.5,
    lineHeight: 40,
  },

  // ── Stat trio
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontFamily: "System",
    fontSize: 28,
    color: D.ink,
    fontWeight: "400" as const,
    lineHeight: 32,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: D.rule,
    marginHorizontal: SP.md,
  },

  // ── Section head
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SP.sm,
  },
  sectionTitle: {
    fontFamily: "System",
    fontSize: 14,
    color: D.ink,
    fontWeight: "400" as const,
    letterSpacing: 0.2,
  },
  badge: {
    backgroundColor: D.leafBg,
    borderRadius: D.r.pill,
    borderWidth: 1,
    borderColor: D.mist,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeUrgent: {
    backgroundColor: D.terracottaSoft,
    borderColor: "rgba(196,98,58,0.3)",
  },

  // ── Plant chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: SP.md },
  plantChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: D.leafBg,
    borderRadius: D.r.pill,
    borderWidth: 1,
    borderColor: D.mist,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: D.sage },
  chipText: {
    ...TY.body,
    fontSize: 13,
    color: D.forest,
    fontWeight: "600" as const,
  },

  // ── Weather
  weatherTop: { flexDirection: "row", gap: SP.md },
  conditionBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: D.leafBg,
    borderRadius: D.r.pill,
    borderWidth: 1,
    borderColor: D.mist,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  conditionText: {
    ...TY.body,
    fontSize: 11,
    color: D.sage,
    fontWeight: "600" as const,
  },
  tempDisplay: {
    fontFamily: "System",
    fontSize: 56,
    color: D.ink,
    fontWeight: "400" as const,
    lineHeight: 62,
    letterSpacing: -1.5,
    marginTop: 2,
  },
  locationText: { ...TY.body, fontSize: 11, color: D.inkFaint },
  weatherPills: { gap: SP.sm, justifyContent: "flex-start", paddingTop: 2 },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: D.paper,
    borderRadius: D.r.md,
    borderWidth: 1,
    borderColor: D.rule,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metaPillValue: {
    fontFamily: "System",
    fontSize: 14,
    color: D.ink,
  },
  insightBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: D.leafBg,
    borderRadius: D.r.md,
    borderWidth: 1,
    borderColor: D.mist,
    padding: SP.md,
  },
  insightPip: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: D.sage,
    marginTop: 5,
    flexShrink: 0,
  },
  insightText: {
    ...TY.body,
    fontSize: 12,
    color: D.forest,
    fontWeight: "600" as const,
    flex: 1,
    lineHeight: 18,
  },
  forecastChip: {
    alignItems: "center",
    gap: 5,
    backgroundColor: D.paper,
    borderRadius: D.r.md,
    borderWidth: 1,
    borderColor: D.rule,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 62,
  },
  forecastTemp: { fontFamily: "System", fontSize: 10, color: D.ink },

  // ── Task rows
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.sm,
    paddingVertical: SP.sm,
    paddingRight: SP.sm,
    borderBottomWidth: 1,
    borderBottomColor: D.paperRule,
    overflow: "hidden",
  },
  taskRowOverdue: { backgroundColor: "rgba(196,98,58,0.04)" },
  taskStripe: { width: 3, height: 36, borderRadius: 2, flexShrink: 0 },
  taskIconBubble: {
    width: 32,
    height: 32,
    borderRadius: D.r.sm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  taskMeta: { flex: 1, gap: 2 },
  taskPlant: {
    ...TY.body,
    fontSize: 13,
    fontWeight: "700" as const,
    color: D.ink,
  },
  taskDate: {
    borderRadius: D.r.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  taskDateDefault: { backgroundColor: D.paperMid },
  taskDateToday: { backgroundColor: D.leafBg },
  taskDateOverdue: { backgroundColor: D.terracottaSoft },

  // ── Empty states
  emptyCard: { alignItems: "center", paddingVertical: SP.xxl, gap: SP.md },
  emptyTitle: {
    fontFamily: "System",
    fontSize: 17,
    color: D.ink,
    fontWeight: "400" as const,
  },
  allDoneIcon: {
    width: 56,
    height: 56,
    borderRadius: D.r.md,
    backgroundColor: D.leafBg,
    alignItems: "center",
    justifyContent: "center",
  },
});
