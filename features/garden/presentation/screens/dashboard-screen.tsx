import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { P, SP, TY } from "@/constants/herbarium-theme";
import { formatWateringLabel } from "@/features/garden/application/plant-utils";
import { useAuth } from "@/providers/auth-provider";
import { useGarden } from "@/providers/garden-provider";

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
  const { plants, schedules, loading, careLogs } = useGarden();

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    const plantsNeedingToday = schedules.filter((schedule) => {
      const scheduledDate = schedule.dueAt.split("T")[0];
      return scheduledDate <= today && schedule.status === "pending";
    }).length;

    const recentlyAdded = plants.slice(0, 3);
    const totalActions = careLogs.length;

    return {
      totalPlants: plants.length,
      plantsNeedingToday,
      recentlyAdded,
      totalActions,
    };
  }, [plants, schedules, careLogs]);

  // Get upcoming tasks (due today or overdue, sorted by date)
  const upcomingTasks = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const upcoming = schedules
      .filter((schedule) => schedule.status === "pending")
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 5)
      .map((schedule) => {
        const plant = plants.find((p) => p.id === schedule.plantId);
        const scheduledDate = schedule.dueAt.split("T")[0];
        const isOverdue = scheduledDate < today;
        const isToday = scheduledDate === today;

        return {
          ...schedule,
          plant,
          isOverdue,
          isToday,
          displayDate: scheduledDate,
        };
      });

    return upcoming;
  }, [schedules, plants]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={P.g1} />
        <Text style={styles.helper}>Loading your garden...</Text>
      </View>
    );
  }

  const displayName = profile?.displayName || user?.displayName || "there";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: P.p1 }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + SP.md,
          paddingBottom: insets.bottom + SP.xxxl + 84,
        },
      ]}
    >
      {/* Welcome Card */}
      <View style={styles.welcomeCard}>
        <View>
          <Text style={styles.greeting}>Hello, {displayName}! 👋</Text>
          <Text style={styles.subGreeting}>Welcome to your garden dashboard</Text>
        </View>
      </View>

      {/* Garden Summary */}
      {stats.totalPlants > 0 ? (
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Garden Summary</Text>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryText}>
              You're caring for{" "}
              <Text style={{ fontWeight: "800", color: P.g0 }}>
                {stats.totalPlants}
              </Text>{" "}
              {stats.totalPlants === 1 ? "plant" : "plants"}
            </Text>

            {stats.totalPlants > 0 && (
              <View style={styles.recentPlants}>
                {stats.recentlyAdded.map((plant) => (
                  <View key={plant.id} style={styles.plantTag}>
                    <Ionicons name="leaf" size={12} color={P.g0} />
                    <Text style={styles.plantTagText}>{plant.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="leaf-outline" size={40} color={P.g2} />
          <Text style={styles.emptyTitle}>No plants yet</Text>
          <Text style={styles.emptyText}>
            Start adding plants to build your garden
          </Text>
        </View>
      )}

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="bar-chart-outline"
          label="Total Plants"
          value={String(stats.totalPlants)}
          color={P.g0}
        />
        <StatCard
          icon="water-outline"
          label="Need Care Today"
          value={String(stats.plantsNeedingToday)}
          color={stats.plantsNeedingToday > 0 ? P.rust : P.g0}
        />
        <StatCard
          icon="checkmark-circle-outline"
          label="Care Actions"
          value={String(stats.totalActions)}
          color={P.g0}
        />
      </View>

      {/* Care Queue */}
      {upcomingTasks.length > 0 ? (
        <View style={styles.queueCard}>
          <Text style={styles.sectionTitle}>Upcoming Care Tasks</Text>
          <View style={styles.taskList}>
            {upcomingTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </View>
          <Text style={styles.queueHint}>
            Tap a task to mark as complete
          </Text>
        </View>
      ) : (
        <View style={styles.emptyQueueCard}>
          <Ionicons name="checkmark-done" size={32} color={P.g0} />
          <Text style={styles.emptyQueueTitle}>All caught up!</Text>
          <Text style={styles.emptyQueueText}>
            No pending care tasks. Great job!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

type StatCardProps = {
  icon: string;
  label: string;
  value: string;
  color: string;
};

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderColor: color + "22" }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "12" }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type TaskItemProps = {
  task: ReturnType<typeof useMemo> extends (infer T)[]
    ? T & {
        plant?: any;
        isOverdue: boolean;
        isToday: boolean;
        displayDate: string;
      }
    : never;
};

function TaskItem({ task }: any) {
  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case "watering":
        return "water-outline";
      case "fertilizing":
        return "flask-outline";
      case "pruning":
        return "cut-outline";
      default:
        return "leaf-outline";
    }
  };

  const getTaskColor = (taskType: string) => {
    switch (taskType) {
      case "watering":
        return P.g0;
      case "fertilizing":
        return "#D4A574";
      case "pruning":
        return "#5B7C6F";
      default:
        return P.g0;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return "Today";

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getTime() === yesterday.getTime()) return "Yesterday";

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const taskColor = getTaskColor(task.taskType);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.taskItem,
        task.isOverdue && styles.taskItemOverdue,
        pressed && styles.taskItemPressed,
      ]}
    >
      <View
        style={[
          styles.taskIconBg,
          { backgroundColor: taskColor + "22", borderColor: taskColor + "33" },
        ]}
      >
        <Ionicons name={getTaskIcon(task.taskType) as any} size={16} color={taskColor} />
      </View>

      <View style={styles.taskContent}>
        <Text style={styles.taskPlantName}>{task.plant?.name ?? "Unknown"}</Text>
        <Text style={styles.taskAction}>
          {task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1)}
        </Text>
      </View>

      <View
        style={[
          styles.taskDate,
          {
            backgroundColor: task.isOverdue
              ? P.rust + "22"
              : task.isToday
                ? P.g0 + "22"
                : P.p2,
          },
        ]}
      >
        <Text
          style={[
            styles.taskDateText,
            {
              color: task.isOverdue ? P.rust : task.isToday ? P.g0 : P.i2,
              fontWeight: task.isOverdue || task.isToday ? "800" : "600",
            },
          ]}
        >
          {formatDate(task.displayDate)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SP.lg,
    gap: SP.lg,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.p1,
    gap: SP.sm,
  },
  helper: {
    ...TY.body,
    color: P.i3,
  },

  // Welcome Card
  welcomeCard: {
    backgroundColor: P.p0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.sketch,
    padding: SP.lg,
    gap: SP.md,
  },
  greeting: {
    ...TY.display,
    fontSize: 28,
    color: P.i1,
  },
  subGreeting: {
    ...TY.body,
    color: P.i3,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: P.p0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.sketch,
    padding: SP.lg,
    gap: SP.md,
  },
  summaryContent: {
    gap: SP.md,
  },
  summaryText: {
    ...TY.body,
    color: P.i2,
    lineHeight: 24,
  },
  recentPlants: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SP.sm,
  },
  plantTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: P.gBg,
    borderWidth: 1,
    borderColor: "rgba(43,125,70,0.22)",
    borderRadius: 999,
    paddingHorizontal: SP.md,
    paddingVertical: 6,
  },
  plantTagText: {
    ...TY.body,
    fontSize: 12,
    color: P.g1,
    fontWeight: "700",
  },

  // Empty States
  emptyCard: {
    backgroundColor: P.p0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.sketch,
    padding: SP.xl,
    alignItems: "center",
    gap: SP.md,
  },
  emptyTitle: {
    ...TY.display,
    fontSize: 20,
    fontWeight: "800",
    color: P.i1,
  },
  emptyText: {
    ...TY.body,
    color: P.i3,
    textAlign: "center",
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    gap: SP.md,
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: P.p0,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: P.hair,
    padding: SP.md,
    alignItems: "center",
    gap: SP.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    ...TY.display,
    fontSize: 24,
    fontWeight: "800",
    color: P.i1,
  },
  statLabel: {
    ...TY.monoLabel,
    fontSize: 8,
    color: P.i3,
  },

  // Queue Section
  sectionTitle: {
    ...TY.display,
    fontSize: 22,
    fontWeight: "800",
    color: P.i1,
  },
  queueCard: {
    backgroundColor: P.p0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.sketch,
    padding: SP.lg,
    gap: SP.md,
  },
  taskList: {
    gap: SP.md,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.md,
    backgroundColor: P.p1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.hair,
    padding: SP.md,
  },
  taskItemOverdue: {
    borderColor: P.rust + "44",
    backgroundColor: P.rust + "08",
  },
  taskItemPressed: {
    opacity: 0.8,
  },
  taskIconBg: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  taskContent: {
    flex: 1,
    gap: 2,
  },
  taskPlantName: {
    ...TY.body,
    fontWeight: "800",
    color: P.i1,
    fontSize: 14,
  },
  taskAction: {
    ...TY.body,
    fontSize: 12,
    color: P.i3,
  },
  taskDate: {
    borderRadius: 8,
    paddingHorizontal: SP.sm,
    paddingVertical: 4,
  },
  taskDateText: {
    ...TY.body,
    fontSize: 11,
  },
  queueHint: {
    ...TY.body,
    fontSize: 11,
    color: P.i3,
    fontStyle: "italic",
  },

  // Empty Queue
  emptyQueueCard: {
    backgroundColor: P.p0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.sketch,
    padding: SP.xl,
    alignItems: "center",
    gap: SP.md,
  },
  emptyQueueTitle: {
    ...TY.display,
    fontSize: 20,
    fontWeight: "800",
    color: P.i1,
  },
  emptyQueueText: {
    ...TY.body,
    color: P.i3,
    textAlign: "center",
  },
});
