/**
 * Task Form — Create or edit care task with date and recurrence selection
 */

import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedView } from "@/components/themed-view";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { DS } from "@/constants/app-design-system";
import { useGarden } from "@/providers/garden-provider";
import {
  getDefaultTaskTitle,
  TASK_FREQUENCY_LABELS,
  TASK_TYPE_LABELS,
  type CareTask,
  type TaskFrequency,
  type TaskType,
} from "@/types/care-task";

export type TaskFormValues = {
  plantId: string;
  plantName: string;
  taskType: TaskType;
  title: string;
  dateTime: Date;
  isRecurring: boolean;
  frequency: TaskFrequency | null;
  notes: string;
  reminderEnabled: boolean;
};

interface TaskFormProps {
  task?: CareTask;
  initialTaskType?: TaskType;
  initialDate?: Date;
  initialHour?: number;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

function combineDateAndTime(
  baseDate: Date,
  nextValue: Date,
  mode: "date" | "time",
) {
  const merged = new Date(baseDate);
  if (mode === "date") {
    merged.setFullYear(
      nextValue.getFullYear(),
      nextValue.getMonth(),
      nextValue.getDate(),
    );
    return merged;
  }

  merged.setHours(nextValue.getHours(), nextValue.getMinutes(), 0, 0);
  return merged;
}

export function TaskForm({
  task,
  initialTaskType = "watering",
  initialDate,
  initialHour,
  onSubmit,
  onCancel,
  submitLabel,
}: TaskFormProps) {
  const { plants } = useGarden();

  const defaultPlant = useMemo(() => plants[0], [plants]);

  const initializeDateTime = () => {
    if (task?.dateTime) {
      return task.dateTime;
    }

    if (initialDate && typeof initialHour === "number") {
      const date = new Date(initialDate);
      date.setHours(initialHour, 0, 0, 0);
      return date;
    }

    return new Date(Date.now() + 60 * 60 * 1000);
  };

  const [plantId, setPlantId] = useState(
    task?.plantId ?? defaultPlant?.id ?? "",
  );
  const [plantName, setPlantName] = useState(
    task?.plantName ?? defaultPlant?.name ?? "",
  );
  const [taskType, setTaskType] = useState<TaskType>(
    task?.taskType ?? initialTaskType,
  );
  const [title, setTitle] = useState(task?.title ?? "");
  const [dateTime, setDateTime] = useState(initializeDateTime());
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring ?? false);
  const [frequency, setFrequency] = useState<TaskFrequency | null>(
    task?.frequency ?? null,
  );
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [reminderEnabled, setReminderEnabled] = useState(
    task?.reminderEnabled ?? true,
  );
  const [saving, setSaving] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);

  useEffect(() => {
    if (!task && defaultPlant) {
      setPlantId(defaultPlant.id);
      setPlantName(defaultPlant.name);
    }
  }, [defaultPlant, task]);

  useEffect(() => {
    if (!task && plants.length > 0 && !plantId) {
      setPlantId(plants[0].id);
      setPlantName(plants[0].name);
    }
  }, [plantId, plants, task]);

  const selectedPlant = plants.find((plant) => plant.id === plantId);

  useEffect(() => {
    if (selectedPlant) {
      setPlantName(selectedPlant.name);
      if (!title.trim()) {
        setTitle(getDefaultTaskTitle(taskType, selectedPlant.name));
      }
    }
  }, [selectedPlant, taskType, title]);

  const canSubmit =
    plantId.trim().length > 0 &&
    plantName.trim().length > 0 &&
    dateTime.getTime() > 0;

  const handleChangeDate = (_event: unknown, nextValue?: Date) => {
    if (!nextValue) {
      setPickerMode(null);
      return;
    }

    setDateTime((current) =>
      combineDateAndTime(current, nextValue, pickerMode ?? "date"),
    );
    setPickerMode(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert(
        "Missing information",
        "Choose a plant and a date/time for the task.",
      );
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        plantId,
        plantName,
        taskType,
        title: title.trim() || getDefaultTaskTitle(taskType, plantName),
        dateTime,
        isRecurring,
        frequency: isRecurring ? frequency : null,
        notes: notes.trim(),
        reminderEnabled,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedView style={styles.card}>
        <View style={styles.headerBlock}>
          <AppText style={styles.formTitle}>Task Details</AppText>
          <AppText style={styles.formSubtitle}>
            Choose plant, care type, and schedule.
          </AppText>
        </View>

        <View style={styles.sectionBlock}>
          <AppText style={styles.sectionLabel}>Plant</AppText>
          <View style={styles.chipWrap}>
            {plants.length === 0 ? (
              <AppText style={styles.emptyState}>
                No plants available yet.
              </AppText>
            ) : (
              plants.map((plant) => (
                <AppButton
                  key={plant.id}
                  variant={plantId === plant.id ? "primary" : "secondary"}
                  label={plant.name}
                  onPress={() => {
                    setPlantId(plant.id);
                    setPlantName(plant.name);
                  }}
                  containerStyle={styles.chipButton}
                />
              ))
            )}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <AppText style={styles.sectionLabel}>Task Type</AppText>
          <View style={styles.chipWrap}>
            {(
              [
                "watering",
                "fertilizing",
                "pruning",
                "repotting",
                "note",
              ] as TaskType[]
            ).map((type) => (
              <AppButton
                key={type}
                variant={taskType === type ? "primary" : "secondary"}
                label={TASK_TYPE_LABELS[type]}
                onPress={() => setTaskType(type)}
                containerStyle={styles.chipButton}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <AppText style={styles.sectionLabel}>Title</AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={getDefaultTaskTitle(taskType, plantName || "Plant")}
            placeholderTextColor={DS.colors.textFaint}
            style={styles.input}
          />
        </View>

        <View style={styles.sectionBlock}>
          <AppText style={styles.sectionLabel}>Schedule</AppText>
          <View style={styles.datetimeRow}>
            <Pressable
              onPress={() => setPickerMode("date")}
              style={styles.datetimeButton}
            >
              <AppText style={styles.datetimeButtonLabel}>Date</AppText>
            </Pressable>
            <Pressable
              onPress={() => setPickerMode("time")}
              style={styles.datetimeButton}
            >
              <AppText style={styles.datetimeButtonLabel}>Time</AppText>
            </Pressable>
          </View>
          <AppText style={styles.datetimeValue}>
            {new Intl.DateTimeFormat(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(dateTime)}
          </AppText>

          {pickerMode ? (
            <DateTimePicker
              value={dateTime}
              mode={pickerMode}
              display="default"
              onChange={handleChangeDate}
            />
          ) : null}

          <View style={styles.inlineRow}>
            <AppText style={styles.sectionLabel}>Recurrence</AppText>
            <View style={styles.chipWrapInline}>
              <AppButton
                variant={!isRecurring ? "primary" : "secondary"}
                label="Once"
                onPress={() => {
                  setIsRecurring(false);
                  setFrequency(null);
                }}
                containerStyle={styles.chipButton}
              />
              <AppButton
                variant={
                  isRecurring && frequency === "daily" ? "primary" : "secondary"
                }
                label={TASK_FREQUENCY_LABELS.daily}
                onPress={() => {
                  setIsRecurring(true);
                  setFrequency("daily");
                }}
                containerStyle={styles.chipButton}
              />
              <AppButton
                variant={
                  isRecurring && frequency === "weekly"
                    ? "primary"
                    : "secondary"
                }
                label={TASK_FREQUENCY_LABELS.weekly}
                onPress={() => {
                  setIsRecurring(true);
                  setFrequency("weekly");
                }}
                containerStyle={styles.chipButton}
              />
            </View>
          </View>

          <View style={styles.toggleRow}>
            <AppText style={styles.sectionLabel}>Reminder</AppText>
            <AppButton
              variant={reminderEnabled ? "primary" : "secondary"}
              label={reminderEnabled ? "On" : "Off"}
              onPress={() => setReminderEnabled((current) => !current)}
            />
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <AppText style={styles.sectionLabel}>Notes</AppText>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional task notes"
            placeholderTextColor={DS.colors.textFaint}
            multiline
            style={[styles.input, styles.notesInput]}
          />
        </View>

        <View style={styles.footer}>
          {onCancel ? (
            <AppButton
              variant="secondary"
              label="Cancel"
              onPress={onCancel}
              containerStyle={styles.footerButton}
            />
          ) : null}
          <AppButton
            variant="primary"
            label={
              saving
                ? "Saving..."
                : (submitLabel ?? (task ? "Update Task" : "Create Task"))
            }
            onPress={handleSubmit}
            containerStyle={styles.footerButton}
          />
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DS.spacing.sm,
    paddingVertical: DS.spacing.sm,
    paddingBottom: DS.spacing.xl,
  },
  card: {
    backgroundColor: DS.colors.bg,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.colors.borderSoft,
    padding: DS.spacing.md,
    gap: DS.spacing.sm,
  },
  headerBlock: {
    gap: DS.spacing.xs,
    marginBottom: DS.spacing.xs,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: DS.colors.text,
  },
  formSubtitle: {
    fontSize: 12,
    color: DS.colors.textMuted,
  },
  sectionBlock: {
    gap: DS.spacing.xs,
    paddingTop: DS.spacing.xs,
  },
  sectionLabel: {
    ...DS.typography.mono,
    fontSize: 10,
    color: DS.colors.textFaint,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DS.spacing.xs,
  },
  chipWrapInline: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DS.spacing.xs,
    justifyContent: "flex-end",
    flex: 1,
  },
  chipButton: {
    marginRight: 0,
  },
  emptyState: {
    color: DS.colors.textMuted,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: DS.colors.borderSoft,
    borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.surface,
    paddingHorizontal: DS.spacing.sm,
    paddingVertical: DS.spacing.sm,
    color: DS.colors.text,
    fontSize: 14,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  datetimeRow: {
    flexDirection: "row",
    gap: DS.spacing.xs,
  },
  datetimeButton: {
    flex: 1,
    borderRadius: DS.radius.sm,
    borderWidth: 1,
    borderColor: DS.colors.borderSoft,
    backgroundColor: DS.colors.surface,
    paddingVertical: DS.spacing.sm,
    alignItems: "center",
  },
  datetimeButtonLabel: {
    color: DS.colors.textMuted,
    fontWeight: "600",
  },
  datetimeValue: {
    color: DS.colors.textMuted,
    fontSize: 12,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: DS.spacing.sm,
    marginTop: DS.spacing.xs,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: DS.spacing.xs,
  },
  footer: {
    flexDirection: "row",
    gap: DS.spacing.xs,
    marginTop: DS.spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
});
