/**
 * DashboardScreen — Herbarium
 *
 * Design language: "Pressed Specimen" — botanical field journal meets luxury wellness.
 * Earthy sage/forest greens on warm off-white paper. Organic rule-lines. Editorial
 * typographic rhythm with monospace accents. Asymmetric layouts. Slow, intentional
 * Animated.timing entrances + spring press feedback.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { useResponsiveMetrics } from "@/hooks/use-responsive-metrics";
import { useFadeUp, usePressScale } from "@/hooks/use-screen-animations";
import { useAuth } from "@/providers/auth-provider";
import { useCareTasks } from "@/providers/care-tasks-provider";
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

const JOURNAL_TASK_STYLE = {
  watering: {
    icon: "water-outline",
    color: D.forest,
    label: "Watering",
  },
  fertilizing: {
    icon: "flask-outline",
    color: D.amber,
    label: "Fertilizing",
  },
  pruning: {
    icon: "cut-outline",
    color: D.sage,
    label: "Pruning",
  },
  repotting: {
    icon: "cube-outline",
    color: D.terracotta,
    label: "Repotting",
  },
  note: {
    icon: "create-outline",
    color: D.inkFaint,
    label: "Note",
  },
} as const;

type Frequency = "once" | "daily" | "weekly";

function prettyTime(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scaled, screenPadding } = useResponsiveMetrics();
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
  const { tasks: careTasks, markAsCompleted, markAsPending } = useCareTasks();

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

  const todaysCareTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().slice(0, 10);

    return careTasks
      .filter((task) => task.dateTime.toISOString().slice(0, 10) === todayKey)
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
      .slice(0, 6)
      .map((task) => ({
        ...task,
        frequency: task.isRecurring ? (task.frequency ?? "weekly") : "once",
        dateKey: task.dateTime.toISOString().slice(0, 10),
        time: `${String(task.dateTime.getHours()).padStart(2, "0")}:${String(
          task.dateTime.getMinutes(),
        ).padStart(2, "0")}`,
      }));
  }, [careTasks]);

  const toggleTaskStatus = async (taskId: string, status: string) => {
    if (status === "completed") {
      await markAsPending(taskId);
      return;
    }
    await markAsCompleted(taskId);
  };

  if (loading) {
    return (
      <View style={S.loadScreen}>
        <ActivityIndicator size="large" color={D.forest} />
        <Text style={S.faint}>Loading your garden…</Text>
      </View>
    );
  }

  const name = profile?.displayName || user?.displayName || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
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
          paddingHorizontal: screenPadding,
          gap: Math.round(scaled(SP.lg, 12, 20)),
          paddingTop: insets.top + SP.sm,
          paddingBottom: insets.bottom + SP.xl + 64,
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
          <Text
            style={[
              S.mastheadHello,
              {
                fontSize: Math.round(scaled(15, 13, 16)),
                lineHeight: Math.round(scaled(19, 17, 21)),
              },
            ]}
          >
            {`${greeting},`}
          </Text>
          <Text
            style={[
              S.mastheadName,
              {
                fontSize: Math.round(scaled(34, 27, 36)),
                lineHeight: Math.round(scaled(38, 31, 40)),
              },
            ]}
          >
            {name}
          </Text>
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
          4. CARE TASKS (TODAY)
      ─────────────────────────────────────────── */}
      <Animated.View style={[S.card, S.careScheduleCard, tasksSectionAnim]}>
        <View style={S.careScheduleHead}>
          <Text style={S.careScheduleTitle}>Tasks for Today</Text>
          <Text style={S.careScheduleCount}>
            {todaysCareTasks.length}{" "}
            {todaysCareTasks.length === 1 ? "task" : "tasks"}
          </Text>
        </View>
        <View style={S.rule} />

        {todaysCareTasks.length === 0 ? (
          <View style={S.emptyWrapCompact}>
            <Ionicons name="calendar-outline" size={20} color={D.inkFaint} />
            <Text style={S.faint}>No Tasks Scheduled</Text>
          </View>
        ) : (
          <View>
            {todaysCareTasks.map((task, index) => {
              const meta = JOURNAL_TASK_STYLE[task.taskType];

              return (
                <Pressable
                  key={task.id}
                  onPress={() =>
                    router.push({
                      pathname: "/tasks/[id]",
                      params: {
                        id: task.id,
                        plantId: task.plantId,
                        plantName: task.plantName,
                        title: task.title,
                        taskType: task.taskType,
                        time: task.time,
                        frequency: task.frequency as Frequency,
                        status: task.status,
                        notes: task.notes ?? "",
                        dateKey: task.dateKey,
                      },
                    })
                  }
                  style={S.journalTaskRowPressable}
                >
                  <View
                    style={[
                      S.journalTaskRow,
                      { flex: 1 },
                      task.status === "completed" && S.journalTaskRowChecked,
                      index === todaysCareTasks.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <View
                      style={[
                        S.journalLeftStripe,
                        { backgroundColor: meta.color },
                        task.status === "completed" &&
                          S.journalLeftStripeChecked,
                      ]}
                    />

                    <View
                      style={[
                        S.journalIconBubble,
                        { backgroundColor: D.leafBg },
                      ]}
                    >
                      <Ionicons
                        name={meta.icon as any}
                        size={14}
                        color={meta.color}
                      />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[
                          S.journalTaskTitle,
                          task.status === "completed" &&
                            S.journalTaskTitleChecked,
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {task.title?.trim() || `${meta.label} task`}
                      </Text>
                      <Text
                        style={[
                          S.journalTaskMeta,
                          task.status === "completed" &&
                            S.journalTaskMetaChecked,
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {(task.plantName?.trim() || "Plant") +
                          " · " +
                          prettyTime(task.time || "09:00") +
                          " · " +
                          (task.frequency || "once")}
                      </Text>
                    </View>

                    <View style={S.journalTaskRightActions}>
                      <Pressable
                        onPress={(event) => {
                          event.stopPropagation();
                          void toggleTaskStatus(task.id, task.status);
                        }}
                        style={[
                          S.journalIconBtn,
                          task.status === "completed" &&
                            S.journalIconBtnChecked,
                        ]}
                      >
                        <Ionicons
                          name={
                            task.status === "completed"
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={24}
                          color={
                            task.status === "completed" ? D.forest : D.inkFaint
                          }
                        />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: D.paper },
  scroll: { gap: SP.lg },
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
  journalTaskRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#FAFAF8",
    paddingVertical: 13,
    borderRadius: 12,
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
  emptyWrapCompact: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
  },

  careScheduleCard: {
    borderRadius: 28,
    padding: 18,
    gap: 14,
  },
  careScheduleHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  careScheduleTitle: {
    fontFamily: "SpaceMono",
    fontSize: 15,
    color: D.ink,
    fontWeight: "600" as const,
  },
  careScheduleCount: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: D.inkFaint,
  },
  rule: {
    height: 1,
    backgroundColor: "#F5F0EB",
  },

  // ── Care schedule rows (journal design)
  taskRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#FAFAF8",
    paddingVertical: 13,
    borderRadius: 12,
  },
  journalTaskRowPressable: {
    flexDirection: "row",
    width: "100%",
    alignSelf: "stretch",
  },
  journalTaskRowChecked: {
    backgroundColor: "#FBFDFB",
  },
  journalLeftStripe: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 99,
  },
  journalLeftStripeChecked: {
    opacity: 0.45,
  },
  journalIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  journalTaskTitle: {
    fontFamily: "SpaceMono",
    fontSize: 15,
    color: D.ink,
  },
  journalTaskTitleChecked: {
    color: "#5D6B61",
    textDecorationLine: "line-through",
  },
  journalTaskMeta: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: D.inkFaint,
    marginTop: 2,
  },
  journalTaskMetaChecked: {
    color: "#9AA59D",
  },
  journalTaskRightActions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  journalIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7FAF8",
  },
  journalIconBtnChecked: {
    backgroundColor: "#EEF5F0",
  },
});
