/**
 * Task List Item — Displays individual care task with status and actions
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";

import { ThemedView } from "@/components/themed-view";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { DS } from "@/constants/app-design-system";
import { useCareTasks } from "@/providers/care-tasks-provider";
import {
  TASK_FREQUENCY_LABELS,
  TASK_STATUS_LABELS,
  TASK_TYPE_ICONS,
  TASK_TYPE_LABELS,
  type CareTask,
} from "@/types/care-task";

interface TaskListItemProps {
  task: CareTask;
  onEdit?: (task: CareTask) => void;
  index?: number;
}

export function TaskListItem({ task, onEdit, index = 0 }: TaskListItemProps) {
  const { markAsCompleted, markAsPending, deleteTask } = useCareTasks();

  const statusColor =
    task.status === "completed"
      ? DS.colors.primary
      : task.status === "missed"
        ? DS.colors.danger
        : DS.colors.primaryMid;

  const formatDateTime = (date: Date) =>
    new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);

  const toggleStatus = async () => {
    try {
      if (task.status === "completed") {
        await markAsPending(task.id);
      } else {
        await markAsCompleted(task.id);
      }
    } catch {
      Alert.alert("Error", "Failed to update task status");
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTask(task.id);
          } catch {
            Alert.alert("Error", "Failed to delete task");
          }
        },
      },
    ]);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(400)}
      layout={LinearTransition}
    >
      <ThemedView style={[styles.container, { borderLeftColor: statusColor }]}>
        <View style={styles.content}>
          <View
            style={[styles.iconBox, { backgroundColor: `${statusColor}18` }]}
          >
            <Ionicons
              name={TASK_TYPE_ICONS[task.taskType] as any}
              size={20}
              color={statusColor}
            />
          </View>

          <View style={styles.info}>
            <View style={styles.header}>
              <AppText style={styles.plantName}>{task.plantName}</AppText>
              <AppText style={[styles.statusBadge, { color: statusColor }]}>
                {TASK_STATUS_LABELS[task.status]}
              </AppText>
            </View>

            <AppText style={styles.taskTitle}>{task.title}</AppText>
            <AppText style={styles.taskType}>
              {TASK_TYPE_LABELS[task.taskType]}
            </AppText>

            <View style={styles.meta}>
              <AppText style={styles.metaText}>
                📅 {formatDateTime(task.dateTime)}
              </AppText>
              {task.isRecurring && task.frequency ? (
                <AppText style={styles.metaText}>
                  ↻ {TASK_FREQUENCY_LABELS[task.frequency]}
                </AppText>
              ) : null}
              {task.reminderEnabled ? (
                <AppText style={styles.metaText}>🔔 Reminder on</AppText>
              ) : null}
            </View>

            {task.notes ? (
              <AppText style={styles.notes}>{task.notes}</AppText>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          <AppButton
            variant={task.status === "completed" ? "secondary" : "primary"}
            label="✓"
            onPress={toggleStatus}
            containerStyle={styles.actionButton}
          />

          {onEdit ? (
            <AppButton
              variant="secondary"
              label="✎"
              onPress={() => onEdit(task)}
              containerStyle={styles.actionButton}
            />
          ) : null}

          <AppButton
            variant="secondary"
            label="✕"
            onPress={handleDelete}
            containerStyle={styles.actionButton}
          />
        </View>
      </ThemedView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: DS.colors.surface,
    borderRadius: 12,
    padding: DS.spacing.md,
    marginBottom: DS.spacing.sm,
    borderLeftWidth: 4,
    ...DS.shadow.card,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    gap: DS.spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: DS.spacing.xs,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  plantName: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.colors.text,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    marginLeft: DS.spacing.xs,
  },
  taskType: {
    fontSize: 13,
    color: DS.colors.textMuted,
  },
  meta: {
    flexDirection: "row",
    gap: DS.spacing.sm,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: 12,
    color: DS.colors.textFaint,
  },
  notes: {
    fontSize: 12,
    color: DS.colors.textMuted,
    fontStyle: "italic",
    marginTop: DS.spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: DS.spacing.xs,
    marginLeft: DS.spacing.md,
  },
  actionButton: {
    paddingHorizontal: DS.spacing.sm,
    paddingVertical: DS.spacing.xs,
  },
});
