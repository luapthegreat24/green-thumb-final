/**
 * JournalScreen — Herbarium
 *
 * Design language: "Pressed Specimen" — exact match to Dashboard + Profile.
 *
 * Structural decisions:
 *   • Masthead: same datestamp / rule / big title / rule / stat-trio as Dashboard
 *   • Quick actions: horizontal icon-chips for instant task creation
 *   • Task list: grouped into today/upcoming/missed/completed sections
 *   • Composer: expands inline beneath a rule, no modal
 *   • Tips: quiet footnote card at the bottom — plain rules, no colour fill
 *   • Zero emoji — Ionicons only
 *   • All type lowercase monospace headers
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TaskForm, type TaskFormValues } from "@/components/tasks/task-form";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { AppToast } from "@/components/ui/app-toast";
import { SP, TY } from "@/constants/herbarium-theme";
import { useAuth } from "@/providers/auth-provider";
import { useCareTasks } from "@/providers/care-tasks-provider";
import { useGarden } from "@/providers/garden-provider";
import {
  getDefaultTaskTitle,
  type CareTask,
  type TaskType,
} from "@/types/care-task";

// ─── Design tokens — identical to Dashboard & Profile ────────────────────────

const D = {
  paper: "#F7F4EF",
  paperMid: "#EDE8DF",
  paperRule: "#D8D0C4",
  white: "#FFFFFF",

  forest: "#2A5C3F",
  sage: "#5C8B6E",
  mist: "#C5D9CC",
  leafBg: "#EBF2ED",

  terracotta: "#C4623A",
  terracottaSoft: "#F0E0D8",
  amber: "#B87A2A",
  amberSoft: "#F2E8D5",

  inkDark: "#1C2318",
  inkMid: "#4A5544",
  inkFaint: "#8A9585",

  rule: "#C8C0B4",
  paperRuleLight: "#E8E2D8",

  r: { sm: 6, md: 12, lg: 20, pill: 999 },
} as const;

// ─── Animation hooks ──────────────────────────────────────────────────────────

function useFadeUp(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
}

function usePressScale(to = 0.965) {
  const scale = useRef(new Animated.Value(1)).current;
  const cfg = { useNativeDriver: true, speed: 60, bounciness: 4 } as const;
  return {
    scale,
    onPressIn: () => Animated.spring(scale, { toValue: to, ...cfg }).start(),
    onPressOut: () => Animated.spring(scale, { toValue: 1, ...cfg }).start(),
  };
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Rule({ style }: { style?: object }) {
  return <View style={[{ height: 1, backgroundColor: D.rule }, style]} />;
}

function Mono({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <Text style={[S.mono, style]}>{children}</Text>;
}

// ─── Stat cell — identical structure to Dashboard masthead ────────────────────

function StatCell({
  value,
  label,
  accent = false,
  delay = 0,
}: {
  value: string;
  label: string;
  accent?: boolean;
  delay?: number;
}) {
  const anim = useFadeUp(delay);
  return (
    <Animated.View style={[S.statCell, anim]}>
      <Text style={[S.statValue, accent && { color: D.terracotta }]}>
        {value}
      </Text>
      <Mono style={accent ? { color: D.terracotta } : undefined}>{label}</Mono>
    </Animated.View>
  );
}

// ─── Quick action chip ────────────────────────────────────────────────────────

const ACTION_CFG = [
  {
    icon: "water-outline",
    label: "water",
    taskType: "watering" as TaskType,
    color: D.forest,
    bg: D.leafBg,
  },
  {
    icon: "flask-outline",
    label: "fertilise",
    taskType: "fertilizing" as TaskType,
    color: D.amber,
    bg: D.amberSoft,
  },
  {
    icon: "cut-outline",
    label: "prune",
    taskType: "pruning" as TaskType,
    color: D.inkMid,
    bg: D.paperMid,
  },
  {
    icon: "create-outline",
    label: "note",
    taskType: "note" as TaskType,
    color: D.sage,
    bg: D.leafBg,
  },
] as const;

function ActionChip({
  icon,
  label,
  color,
  bg,
  onPress,
  onLongPress,
}: {
  icon: string;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.94);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={220}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={[S.actionChip, { transform: [{ scale }] }]}>
        <View style={[S.actionChipIcon, { backgroundColor: bg }]}>
          <Ionicons name={icon as any} size={16} color={color} />
        </View>
        <Mono style={{ color: D.inkMid }}>{label}</Mono>
      </Animated.View>
    </Pressable>
  );
}

// ─── Care tip row ─────────────────────────────────────────────────────────────

const TIPS = [
  { icon: "water-outline", text: "Water when soil is dry 1–2 inches deep" },
  { icon: "sync-outline", text: "Rotate plants monthly for even growth" },
  {
    icon: "sunny-outline",
    text: "Most plants need 6+ hours of indirect light",
  },
  { icon: "thermometer-outline", text: "Keep temperatures between 16–24°C" },
] as const;

function TipRow({
  icon,
  text,
  last,
}: {
  icon: string;
  text: string;
  last?: boolean;
}) {
  return (
    <View style={[S.tipRow, last && { borderBottomWidth: 0 }]}>
      <View style={S.tipIcon}>
        <Ionicons name={icon as any} size={13} color={D.sage} />
      </View>
      <Text style={S.tipText}>{text}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { plants } = useGarden();
  const { tasks, loading, error, refresh, addTask, updateTask } =
    useCareTasks();

  const [composerOpen, setComposerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CareTask | null>(null);
  const [composerTaskType, setComposerTaskType] =
    useState<TaskType>("watering");
  const [quickCreating, setQuickCreating] = useState<TaskType | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastNonce, setToastNonce] = useState(0);

  const firstName = profile?.displayName?.split(" ")[0]?.toLowerCase() ?? "my";
  const journalTitle = `${firstName}'s journal`;

  const dateLabel = new Date()
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toLowerCase();

  const stats = useMemo(
    () => ({
      total: tasks.length,
      upcoming: tasks.filter((t) => t.status === "pending").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      missed: tasks.filter((t) => t.status === "missed").length,
    }),
    [tasks],
  );

  const grouped = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const today: CareTask[] = [];
    const upcoming: CareTask[] = [];
    const completed: CareTask[] = [];
    const missed: CareTask[] = [];

    tasks.forEach((task) => {
      const dueAt = task.dateTime.getTime();
      if (task.status === "completed") {
        completed.push(task);
        return;
      }
      if (task.status === "missed") {
        missed.push(task);
        return;
      }

      if (dueAt < tomorrowStart.getTime()) {
        today.push(task);
      } else {
        upcoming.push(task);
      }
    });

    const byDateAsc = (a: CareTask, b: CareTask) =>
      a.dateTime.getTime() - b.dateTime.getTime();
    const byDateDesc = (a: CareTask, b: CareTask) =>
      b.dateTime.getTime() - a.dateTime.getTime();

    return {
      today: today.sort(byDateAsc),
      upcoming: upcoming.sort(byDateAsc),
      completed: completed.sort(byDateDesc),
      missed: missed.sort(byDateAsc),
    };
  }, [tasks]);

  const preferredPlant = useMemo(() => {
    if (plants.length === 0) return null;

    if (editingTask) {
      return (
        plants.find((plant) => plant.id === editingTask.plantId) ?? plants[0]
      );
    }

    if (tasks.length > 0) {
      const latestTask = tasks.reduce((latest, current) =>
        current.updatedAt.getTime() > latest.updatedAt.getTime()
          ? current
          : latest,
      );
      return (
        plants.find((plant) => plant.id === latestTask.plantId) ?? plants[0]
      );
    }

    return plants[0];
  }, [editingTask, plants, tasks]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastNonce((current) => current + 1);
    setToastVisible(true);
  };

  const buildQuickTaskDate = (taskType: TaskType) => {
    const date = new Date();
    if (taskType === "fertilizing" || taskType === "pruning") {
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
      return date;
    }

    if (taskType === "note") {
      date.setMinutes(0, 0, 0);
      return date;
    }

    date.setHours(date.getHours() + 1, 0, 0, 0);
    return date;
  };

  const quickCreateTask = async (taskType: TaskType) => {
    if (quickCreating) return;

    const plant = preferredPlant;
    if (!plant) {
      showToast("Add a plant first to create care tasks");
      return;
    }

    try {
      setQuickCreating(taskType);
      await addTask({
        plantId: plant.id,
        plantName: plant.name,
        taskType,
        title: getDefaultTaskTitle(taskType, plant.name),
        dateTime: buildQuickTaskDate(taskType),
        isRecurring: false,
        reminderEnabled: false,
      });
      showToast("Task added");
    } catch {
      showToast("Could not add task");
    } finally {
      setQuickCreating(null);
    }
  };

  const closeComposer = () => {
    setComposerOpen(false);
    setEditingTask(null);
  };

  const openComposer = (taskType: TaskType = "watering") => {
    setComposerTaskType(taskType);
    setEditingTask(null);
    setComposerOpen(true);
  };

  const startEdit = (task: CareTask) => {
    setComposerTaskType(task.taskType);
    setEditingTask(task);
    setComposerOpen(true);
  };

  const handleSubmit = async (values: TaskFormValues) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          plantId: values.plantId,
          plantName: values.plantName,
          taskType: values.taskType,
          title: values.title,
          dateTime: values.dateTime,
          isRecurring: values.isRecurring,
          frequency: values.frequency,
          notes: values.notes,
          reminderEnabled: values.reminderEnabled,
        });
        showToast("Task updated");
      } else {
        await addTask(values);
        showToast("Task created");
      }
      closeComposer();
    } catch {
      showToast("Could not save task");
    }
  };

  // Add-task button press scale
  const {
    scale: addScale,
    onPressIn: addPressIn,
    onPressOut: addPressOut,
  } = usePressScale();

  // Keep animation hooks stable across renders.
  const mastheadAnim = useFadeUp(0);
  const actionsAnim = useFadeUp(80);
  const composerAnim = useFadeUp(0);
  const sectionsAnim = useFadeUp(160);
  const tasksAnimDefault = useFadeUp(200);
  const tasksAnimWithComposer = useFadeUp(280);
  const errorAnim = useFadeUp(0);
  const tipsAnim = useFadeUp(400);
  const footerAnim = useFadeUp(480);

  return (
    <View style={S.screen}>
      <ScrollView
        style={S.screen}
        contentContainerStyle={[
          S.scroll,
          {
            paddingTop: insets.top + SP.sm,
            paddingBottom: insets.bottom + SP.xxxl + 92,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading && tasks.length === 0}
            onRefresh={refresh}
            tintColor={D.forest}
          />
        }
      >
        {/* ══════════════════════════════════════════════════
          1. MASTHEAD — same editorial structure as Dashboard
          datestamp / rule / big title / rule / stat trio
      ══════════════════════════════════════════════════ */}
        <Animated.View style={[S.card, mastheadAnim]}>
          {/* Datestamp row */}
          <View style={S.mastheadTopRow}>
            <Mono>{dateLabel}</Mono>
            {/* Add task chip — top right, mirrors dashboard's leaf count */}
            <Pressable
              onPress={() => openComposer()}
              onPressIn={addPressIn}
              onPressOut={addPressOut}
            >
              <Animated.View
                style={[S.addChip, { transform: [{ scale: addScale }] }]}
              >
                <Ionicons name="add" size={12} color={D.forest} />
                <Mono style={{ color: D.forest }}>new task</Mono>
              </Animated.View>
            </Pressable>
          </View>

          <Rule />

          {/* Journal title — same SpaceMono display type as name in Dashboard */}
          <View style={S.mastheadBody}>
            <Mono>care journal</Mono>
            <Text style={S.mastheadTitle}>{journalTitle}</Text>
          </View>

          <Rule />

          {/* Stat trio — identical layout to Dashboard */}
          <View style={S.statRow}>
            <StatCell value={String(stats.total)} label="total" delay={60} />
            <View style={S.statDivider} />
            <StatCell
              value={String(stats.upcoming)}
              label="upcoming"
              delay={130}
            />
            <View style={S.statDivider} />
            <StatCell
              value={String(stats.completed)}
              label="done"
              delay={200}
            />
            <View style={S.statDivider} />
            <StatCell
              value={String(stats.missed)}
              label="missed"
              accent={stats.missed > 0}
              delay={270}
            />
          </View>
        </Animated.View>

        {/* ══════════════════════════════════════════════════
          2. QUICK ACTIONS — horizontal scrolling chips
          Each chip: coloured icon bubble + mono label
      ══════════════════════════════════════════════════ */}
        <Animated.View style={[S.card, actionsAnim]}>
          <View style={S.sectionHead}>
            <Text style={S.sectionTitle}>quick actions</Text>
            <Mono>tap to add · hold to customize</Mono>
          </View>
          <Rule />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={S.actionChipsRow}
          >
            {ACTION_CFG.map((a) => (
              <ActionChip
                key={a.taskType}
                icon={a.icon}
                label={a.label}
                color={a.color}
                bg={quickCreating === a.taskType ? D.paperMid : a.bg}
                onPress={() => quickCreateTask(a.taskType)}
                onLongPress={() => openComposer(a.taskType)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ══════════════════════════════════════════════════
          3. COMPOSER — inline expansion
          Appears between actions and task list when open.
          Same card shell, ruled header.
      ══════════════════════════════════════════════════ */}
        {composerOpen && (
          <Animated.View style={[S.card, composerAnim]}>
            <View style={S.sectionHead}>
              <Text style={S.sectionTitle}>
                {editingTask ? "edit task" : "new task"}
              </Text>
              {/* Close button — top right */}
              <Pressable onPress={closeComposer} style={S.closeBtn}>
                <Ionicons name="close" size={14} color={D.inkFaint} />
              </Pressable>
            </View>
            <Rule />
            <TaskForm
              key={editingTask?.id ?? composerTaskType}
              task={editingTask ?? undefined}
              initialTaskType={composerTaskType}
              submitLabel={editingTask ? "update task" : "create task"}
              onCancel={closeComposer}
              onSubmit={handleSubmit}
            />
          </Animated.View>
        )}

        {/* ══════════════════════════════════════════════════
          4. TASK LIST — sectioned by urgency
          Mirrors care queue in Dashboard exactly.
      ══════════════════════════════════════════════════ */}
        <Animated.View
          style={[
            S.card,
            composerOpen ? tasksAnimWithComposer : tasksAnimDefault,
          ]}
        >
          <View style={S.sectionHead}>
            <Text style={S.sectionTitle}>care tasks</Text>
            <Mono>{tasks.length} total entries</Mono>
          </View>
          <Rule />

          {loading && tasks.length === 0 ? (
            <View style={S.emptyState}>
              <ActivityIndicator size="small" color={D.sage} />
              <Mono>loading task feed…</Mono>
            </View>
          ) : tasks.length > 0 ? (
            <Animated.View style={[S.sectionStack, sectionsAnim]}>
              <View style={S.taskSection}>
                <View style={S.taskSectionHead}>
                  <Mono style={S.taskSectionTitle}>today</Mono>
                  <Mono>{grouped.today.length}</Mono>
                </View>
                {grouped.today.length > 0 ? (
                  <View style={S.taskList}>
                    {grouped.today.map((task, i) => (
                      <TaskListItem
                        key={task.id}
                        task={task}
                        index={i}
                        onEdit={startEdit}
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={S.sectionEmpty}>no tasks due today</Text>
                )}
              </View>

              <View style={S.taskSection}>
                <View style={S.taskSectionHead}>
                  <Mono style={S.taskSectionTitle}>upcoming</Mono>
                  <Mono>{grouped.upcoming.length}</Mono>
                </View>
                {grouped.upcoming.length > 0 ? (
                  <View style={S.taskList}>
                    {grouped.upcoming.map((task, i) => (
                      <TaskListItem
                        key={task.id}
                        task={task}
                        index={i}
                        onEdit={startEdit}
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={S.sectionEmpty}>no upcoming tasks</Text>
                )}
              </View>

              {grouped.missed.length > 0 && (
                <View style={S.taskSection}>
                  <View style={S.taskSectionHead}>
                    <Mono style={[S.taskSectionTitle, { color: D.terracotta }]}>
                      missed
                    </Mono>
                    <Mono style={{ color: D.terracotta }}>
                      {grouped.missed.length}
                    </Mono>
                  </View>
                  <View style={S.taskList}>
                    {grouped.missed.map((task, i) => (
                      <TaskListItem
                        key={task.id}
                        task={task}
                        index={i}
                        onEdit={startEdit}
                      />
                    ))}
                  </View>
                </View>
              )}

              <View style={S.taskSection}>
                <View style={S.taskSectionHead}>
                  <Mono style={S.taskSectionTitle}>completed</Mono>
                  <Mono>{grouped.completed.length}</Mono>
                </View>
                {grouped.completed.length > 0 ? (
                  <View style={S.taskList}>
                    {grouped.completed.map((task, i) => (
                      <TaskListItem
                        key={task.id}
                        task={task}
                        index={i}
                        onEdit={startEdit}
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={S.sectionEmpty}>nothing completed yet</Text>
                )}
              </View>
            </Animated.View>
          ) : (
            <View style={S.emptyState}>
              <View style={S.emptyIconWrap}>
                <Ionicons name="leaf-outline" size={22} color={D.mist} />
              </View>
              <Text style={S.emptyTitle}>no tasks here yet</Text>
              <Mono>tap a quick action to add your first task</Mono>
            </View>
          )}
        </Animated.View>

        {/* ══════════════════════════════════════════════════
          6. ERROR BANNER — only when present
      ══════════════════════════════════════════════════ */}
        {error && (
          <Animated.View style={[S.errorBanner, errorAnim]}>
            <View style={S.errorPip} />
            <Text style={S.errorText}>{error}</Text>
          </Animated.View>
        )}

        {/* ══════════════════════════════════════════════════
          7. CARE TIPS — quiet footnote card
          Plain ruled rows, no green fill — subtle reference
          matches the botanical annotation tone.
      ══════════════════════════════════════════════════ */}
        <Animated.View style={[S.card, tipsAnim]}>
          <View style={S.sectionHead}>
            <Text style={S.sectionTitle}>care notes</Text>
            <Mono>field observations</Mono>
          </View>
          <Rule />
          {TIPS.map((tip, i) => (
            <TipRow
              key={i}
              icon={tip.icon}
              text={tip.text}
              last={i === TIPS.length - 1}
            />
          ))}
        </Animated.View>

        {/* Botanical footer — matches Profile */}
        <Animated.View style={[S.footer, footerAnim]}>
          <View style={S.footerRule} />
          <Mono style={{ textAlign: "center" }}>
            herbarium · care journal · {String(new Date().getFullYear())}
          </Mono>
        </Animated.View>
      </ScrollView>

      <AppToast
        key={String(toastNonce)}
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        bottomOffset={insets.bottom + 22}
      />
    </View>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: D.paper },
  scroll: { paddingHorizontal: SP.lg, gap: SP.lg },

  // ── Mono atom
  mono: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    letterSpacing: 0.8,
    color: D.inkFaint,
    textTransform: "uppercase" as const,
  },

  // ── Card shell — identical to Dashboard & Profile
  card: {
    backgroundColor: D.white,
    borderRadius: D.r.lg,
    borderWidth: 1,
    borderColor: D.rule,
    padding: SP.lg,
    gap: SP.md,
  },

  // ── Masthead
  mastheadTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: D.leafBg,
    borderRadius: D.r.pill,
    borderWidth: 1,
    borderColor: D.mist,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mastheadBody: { gap: 3 },
  mastheadTitle: {
    fontFamily: "SpaceMono",
    fontSize: 30,
    color: D.forest,
    fontWeight: "400" as const,
    letterSpacing: -0.5,
    lineHeight: 36,
  },

  // ── Stat trio — exact copy of Dashboard
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
    fontFamily: "SpaceMono",
    fontSize: 22,
    color: D.inkDark,
    lineHeight: 26,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: D.rule,
    marginHorizontal: SP.sm,
  },

  // ── Section head (matches Dashboard SectionHead)
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SP.sm,
  },
  sectionTitle: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: D.inkDark,
    fontWeight: "400" as const,
    letterSpacing: 0.2,
    flex: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: D.r.pill,
    backgroundColor: D.paperMid,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Quick action chips
  actionChipsRow: {
    flexDirection: "row",
    gap: SP.md,
    paddingRight: SP.sm,
  },
  actionChip: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  actionChipIcon: {
    width: 52,
    height: 52,
    borderRadius: D.r.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: D.rule,
  },

  // ── Task list — ruled rows
  taskList: { gap: 0 },
  sectionStack: { gap: SP.lg },
  taskSection: { gap: SP.sm },
  taskSectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskSectionTitle: {
    color: D.inkDark,
  },
  sectionEmpty: {
    ...TY.body,
    fontSize: 12,
    color: D.inkFaint,
    paddingVertical: 6,
  },

  // ── Empty state
  emptyState: {
    paddingVertical: SP.xl,
    alignItems: "center",
    gap: SP.md,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: D.r.md,
    backgroundColor: D.paperMid,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: "SpaceMono",
    fontSize: 15,
    color: D.inkDark,
    fontWeight: "400" as const,
  },

  // ── Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: D.terracottaSoft,
    borderRadius: D.r.md,
    borderWidth: 1,
    borderColor: "rgba(196,98,58,0.3)",
    paddingHorizontal: SP.md,
    paddingVertical: SP.md,
  },
  errorPip: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: D.terracotta,
    marginTop: 2,
    flexShrink: 0,
  },
  errorText: {
    ...TY.body,
    fontSize: 12,
    color: D.terracotta,
    flex: 1,
  },

  // ── Care tips — ruled rows
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SP.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: D.paperRuleLight,
  },
  tipIcon: {
    width: 28,
    height: 28,
    borderRadius: D.r.sm,
    backgroundColor: D.leafBg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tipText: {
    ...TY.body,
    fontSize: 12,
    color: D.inkMid,
    lineHeight: 20,
    flex: 1,
    paddingTop: 4,
  },

  // ── Footer — matches Profile
  footer: {
    paddingTop: SP.lg,
    paddingBottom: SP.sm,
    alignItems: "center",
    gap: SP.sm,
  },
  footerRule: {
    width: 40,
    height: 1,
    backgroundColor: D.rule,
  },
});
