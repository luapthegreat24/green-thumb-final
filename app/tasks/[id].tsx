import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppToast } from "@/components/ui/app-toast";
import { useCareTasks } from "@/providers/care-tasks-provider";
import type { TaskFrequency } from "@/types/care-task";

type Frequency = "once" | "daily" | "weekly";
type TaskType = "watering" | "fertilizing" | "pruning" | "repotting" | "note";
type TaskStatus = "pending" | "completed" | "missed";

type TaskDetail = {
  id: string;
  plantId?: string;
  plantName: string;
  title: string;
  taskType: TaskType;
  time: string;
  frequency: Frequency;
  status: TaskStatus;
  notes?: string;
  dateKey: string;
};

function areTaskDetailsEqual(
  left: TaskDetail | null,
  right: TaskDetail | null,
) {
  if (left === right) return true;
  if (!left || !right) return false;

  return (
    left.id === right.id &&
    left.plantId === right.plantId &&
    left.plantName === right.plantName &&
    left.title === right.title &&
    left.taskType === right.taskType &&
    left.time === right.time &&
    left.frequency === right.frequency &&
    left.status === right.status &&
    left.notes === right.notes &&
    left.dateKey === right.dateKey
  );
}

// Mock task data - in a real app, this would come from state management
const MOCK_TASKS: Record<string, TaskDetail> = {
  t1: {
    id: "t1",
    plantName: "Monstera",
    title: "Water the monstera",
    taskType: "watering",
    time: "08:30",
    frequency: "weekly",
    status: "pending",
    dateKey: "2025-01-15",
    notes: "Water thoroughly until it drains from the bottom",
  },
  t2: {
    id: "t2",
    plantName: "Snake plant",
    title: "Light feed",
    taskType: "fertilizing",
    time: "10:00",
    frequency: "weekly",
    status: "pending",
    dateKey: "2025-01-16",
    notes: "Use diluted fertilizer",
  },
  t3: {
    id: "t3",
    plantName: "Pothos",
    title: "Trim long vines",
    taskType: "pruning",
    time: "14:15",
    frequency: "once",
    status: "completed",
    dateKey: "2025-01-15",
  },
};

const C = {
  paper: "#FAF9F7",
  card: "#FFFFFF",
  border: "#EBE4DC",
  muted: "#8A9585",
  text: "#0F1410",
  green: "#2D6344",
  sage: "#5C8B6E",
  amber: "#B87A2A",
  terracotta: "#C4623A",
  leafBg: "#F0F7F2",
  rowBorder: "#F5F0EB",
  offWhite: "#FEFDFB",
  accentGreen: "#3A7C52",
};

const TASK_STYLE: Record<
  TaskType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
  watering: { icon: "water-outline", color: C.accentGreen, label: "Watering" },
  fertilizing: { icon: "flask-outline", color: C.amber, label: "Fertilizing" },
  pruning: { icon: "cut-outline", color: C.sage, label: "Pruning" },
  repotting: { icon: "cube-outline", color: C.terracotta, label: "Repotting" },
  note: { icon: "create-outline", color: C.muted, label: "Note" },
};

const FREQUENCIES_DISPLAY: Record<Frequency, string> = {
  once: "Once",
  daily: "Daily",
  weekly: "Weekly",
};

function prettyTime(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function TaskDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const contentOpacity = React.useRef(new Animated.Value(0)).current;
  const [isEditing, setIsEditing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const {
    tasks: backendTasks,
    updateTask,
    deleteTask: removeCareTask,
  } = useCareTasks();

  const task = useMemo<TaskDetail | null>(() => {
    if (!id) return null;

    const firestoreTask = backendTasks.find((item) => item.id === id);
    if (firestoreTask) {
      const dateTime = firestoreTask.dateTime;
      const frequency: Frequency = firestoreTask.isRecurring
        ? (firestoreTask.frequency ?? "weekly")
        : "once";
      return {
        id: firestoreTask.id,
        plantId: firestoreTask.plantId,
        plantName: firestoreTask.plantName,
        title: firestoreTask.title,
        taskType: firestoreTask.taskType,
        time: `${String(dateTime.getHours()).padStart(2, "0")}:${String(
          dateTime.getMinutes(),
        ).padStart(2, "0")}`,
        frequency,
        status: firestoreTask.status,
        notes: firestoreTask.notes,
        dateKey: dateTime.toISOString().slice(0, 10),
      };
    }

    if (MOCK_TASKS[id]) {
      return MOCK_TASKS[id];
    }

    const pick = (value: unknown) =>
      Array.isArray(value) ? value[0] : (value as string | undefined);

    const plantId = pick(params.plantId);
    const plantName = pick(params.plantName);
    const title = pick(params.title);
    const taskType = pick(params.taskType) as TaskType | undefined;
    const time = pick(params.time);
    const frequency = pick(params.frequency) as Frequency | undefined;
    const status = pick(params.status) as TaskStatus | undefined;
    const notes = pick(params.notes);
    const dateKey = pick(params.dateKey);

    if (
      !plantName ||
      !title ||
      !taskType ||
      !time ||
      !frequency ||
      !status ||
      !dateKey
    ) {
      return null;
    }

    return {
      id,
      plantId,
      plantName,
      title,
      taskType,
      time,
      frequency,
      status,
      notes,
      dateKey,
    };
  }, [backendTasks, id, params]);

  const [taskData, setTaskData] = useState<TaskDetail | null>(task);

  React.useEffect(() => {
    setTaskData((current) =>
      areTaskDetailsEqual(current, task) ? current : task,
    );
  }, [task]);

  const [editedTitle, setEditedTitle] = useState(task?.title || "");
  const [editedPlantName, setEditedPlantName] = useState(task?.plantName || "");
  const [editedTaskType, setEditedTaskType] = useState<TaskType>(
    task?.taskType || "watering",
  );
  const [editedTime, setEditedTime] = useState(task?.time || "09:00");
  const [editedFrequency, setEditedFrequency] = useState<Frequency>(
    task?.frequency || "once",
  );
  const [editedStatus, setEditedStatus] = useState<TaskStatus>(
    task?.status || "pending",
  );
  const [editedDateKey, setEditedDateKey] = useState(task?.dateKey || "");
  const [editedNotes, setEditedNotes] = useState(task?.notes || "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  React.useEffect(() => {
    if (taskData && !isEditing) {
      setEditedPlantName(taskData.plantName);
      setEditedTitle(taskData.title);
      setEditedTaskType(taskData.taskType);
      setEditedTime(taskData.time);
      setEditedFrequency(taskData.frequency);
      setEditedStatus(taskData.status);
      setEditedDateKey(taskData.dateKey);
      setEditedNotes(taskData.notes || "");
    }
  }, [taskData, isEditing]);

  React.useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!taskData) {
    return (
      <SafeAreaView style={S.screen}>
        <View style={S.header}>
          <Pressable onPress={() => router.back()} style={S.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.accentGreen} />
          </Pressable>
          <Text style={S.headerTitle}>Task</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={S.content}>
          <View style={S.card}>
            <Text style={S.emptyText}>Task Not Found</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const activeTaskType = isEditing ? editedTaskType : taskData.taskType;
  const meta = TASK_STYLE[activeTaskType] ?? TASK_STYLE.note;

  const saveChanges = async () => {
    const nextPlantName = editedPlantName.trim() || taskData.plantName;
    const nextTitle = editedTitle.trim() || taskData.title;
    const nextDateKey = editedDateKey || taskData.dateKey;
    const nextNotes = editedNotes.trim() || undefined;

    setTaskData((prev) =>
      prev
        ? {
            ...prev,
            plantName: nextPlantName,
            title: nextTitle,
            taskType: editedTaskType,
            time: editedTime,
            frequency: editedFrequency,
            status: editedStatus,
            dateKey: nextDateKey,
            notes: nextNotes,
          }
        : prev,
    );

    const [year, month, day] = nextDateKey.split("-").map(Number);
    const [hour, minute] = editedTime.split(":").map(Number);
    const dateTime = new Date(year, month - 1, day, hour, minute);

    try {
      await updateTask(taskData.id, {
        plantId: taskData.plantId,
        plantName: nextPlantName,
        taskType: editedTaskType,
        title: nextTitle,
        dateTime,
        status: editedStatus,
        isRecurring: editedFrequency !== "once",
        frequency:
          editedFrequency === "once"
            ? null
            : (editedFrequency as TaskFrequency),
        notes: nextNotes,
      });
      setIsEditing(false);
      setToastMessage("Task updated successfully");
      setToastVisible(true);
    } catch {
      Alert.alert("Unable to save", "Please try again.");
    }
  };

  const discardChanges = () => {
    if (taskData) {
      setEditedPlantName(taskData.plantName);
      setEditedTitle(taskData.title);
      setEditedTaskType(taskData.taskType);
      setEditedTime(taskData.time);
      setEditedFrequency(taskData.frequency);
      setEditedStatus(taskData.status);
      setEditedDateKey(taskData.dateKey);
      setEditedNotes(taskData.notes || "");
    }
    setIsEditing(false);
  };

  const openDatePicker = () => {
    const [year, month, day] = editedDateKey.split("-").map(Number);
    if (year && month && day) {
      setPickerDate(new Date(year, month - 1, day));
    } else {
      setPickerDate(new Date());
    }
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    const [hour, minute] = editedTime.split(":").map(Number);
    if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
      setPickerDate(new Date(2025, 0, 1, hour, minute));
    } else {
      setPickerDate(new Date(2025, 0, 1, 9, 0));
    }
    setShowTimePicker(true);
  };

  const confirmDate = () => {
    const year = pickerDate.getFullYear();
    const month = String(pickerDate.getMonth() + 1).padStart(2, "0");
    const day = String(pickerDate.getDate()).padStart(2, "0");
    setEditedDateKey(`${year}-${month}-${day}`);
    setShowDatePicker(false);
  };

  const confirmTime = () => {
    const hours = String(pickerDate.getHours()).padStart(2, "0");
    const minutes = String(pickerDate.getMinutes()).padStart(2, "0");
    setEditedTime(`${hours}:${minutes}`);
    setShowTimePicker(false);
  };

  const handlePickerChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setPickerDate(selectedDate);
    }
  };

  const deleteTask = async () => {
    try {
      await removeCareTask(taskData.id);
      router.back();
    } catch {
      Alert.alert("Unable to remove", "Please try again.");
    }
  };

  const confirmDeleteTask = () => {
    Alert.alert(
      "Remove task",
      "This will remove the task from your schedule.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void deleteTask();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}>
        <Pressable onPress={() => router.back()} style={S.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.accentGreen} />
        </Pressable>
        <Text style={S.headerTitle}>Task Details</Text>
        <Pressable
          onPress={() => {
            if (isEditing) {
              discardChanges();
              return;
            }
            setIsEditing(true);
          }}
          style={S.backBtn}
        >
          <Ionicons
            name={isEditing ? "close" : "create-outline"}
            size={20}
            color={C.accentGreen}
          />
        </Pressable>
      </View>

      <Animated.ScrollView
        contentContainerStyle={S.content}
        style={{ opacity: contentOpacity }}
        showsVerticalScrollIndicator={false}
      >
        {isEditing && (
          <View style={S.editingBanner}>
            <Ionicons name="create-outline" size={14} color={C.accentGreen} />
            <Text style={S.editingBannerText}>Editing Mode</Text>
          </View>
        )}

        {/* Task Header Card */}
        <View style={[S.card, isEditing && S.cardEditing]}>
          <View style={S.taskHeaderRow}>
            <View
              style={[S.iconBubble, { backgroundColor: meta.color + "15" }]}
            >
              <Ionicons name={meta.icon} size={24} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              {isEditing ? (
                <View style={S.editTypeRow}>
                  {(Object.keys(TASK_STYLE) as TaskType[]).map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setEditedTaskType(type)}
                      style={[
                        S.miniTypeChip,
                        editedTaskType === type && S.miniTypeChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          S.miniTypeChipText,
                          editedTaskType === type && S.miniTypeChipTextActive,
                        ]}
                      >
                        {TASK_STYLE[type].label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={S.taskTypeLabel}>{meta.label}</Text>
              )}

              {isEditing ? (
                <TextInput
                  style={[S.input, S.inlineInput]}
                  value={editedPlantName}
                  onChangeText={setEditedPlantName}
                  placeholder="Plant name"
                  placeholderTextColor={C.muted}
                />
              ) : (
                <Text style={S.taskPlantName}>{taskData.plantName}</Text>
              )}
            </View>
          </View>

          <View style={S.rule} />

          {isEditing ? (
            <TextInput
              style={S.input}
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Edit task title..."
              placeholderTextColor={C.muted}
            />
          ) : (
            <Text style={S.taskTitle}>{taskData.title}</Text>
          )}
        </View>

        {/* Details Card */}
        <View style={[S.card, isEditing && S.cardEditing]}>
          <Text style={S.sectionTitle}>Details</Text>
          <View style={S.rule} />

          <View style={S.detailRow}>
            <View style={S.detailCol}>
              <View style={S.detailLabelRow}>
                <Ionicons name="calendar-outline" size={14} color={C.muted} />
                <Text style={S.detailLabel}>Date</Text>
              </View>
              {isEditing ? (
                <Pressable onPress={openDatePicker} style={S.detailPickerBtn}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={C.accentGreen}
                  />
                  <Text style={S.detailPickerText}>
                    {formatDate(editedDateKey)}
                  </Text>
                </Pressable>
              ) : (
                <Text style={S.detailValue}>
                  {formatDate(taskData.dateKey)}
                </Text>
              )}
            </View>
            <View style={S.detailCol}>
              <View style={S.detailLabelRow}>
                <Ionicons name="time-outline" size={14} color={C.muted} />
                <Text style={S.detailLabel}>Time</Text>
              </View>
              {isEditing ? (
                <Pressable onPress={openTimePicker} style={S.detailPickerBtn}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={C.accentGreen}
                  />
                  <Text style={S.detailPickerText}>
                    {prettyTime(editedTime)}
                  </Text>
                </Pressable>
              ) : (
                <Text style={S.detailValue}>{prettyTime(taskData.time)}</Text>
              )}
            </View>
          </View>

          <View style={S.detailRow}>
            <View style={S.detailCol}>
              <View style={S.detailLabelRow}>
                <Ionicons name="repeat-outline" size={14} color={C.muted} />
                <Text style={S.detailLabel}>Frequency</Text>
              </View>
              {isEditing ? (
                <View style={S.segmentRow}>
                  {(Object.keys(FREQUENCIES_DISPLAY) as Frequency[]).map(
                    (f) => (
                      <Pressable
                        key={f}
                        onPress={() => setEditedFrequency(f)}
                        style={[
                          S.segmentChip,
                          editedFrequency === f && S.segmentChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            S.segmentChipText,
                            editedFrequency === f && S.segmentChipTextActive,
                          ]}
                        >
                          {FREQUENCIES_DISPLAY[f]}
                        </Text>
                      </Pressable>
                    ),
                  )}
                </View>
              ) : (
                <Text style={S.detailValue}>
                  {FREQUENCIES_DISPLAY[taskData.frequency]}
                </Text>
              )}
            </View>
            <View style={S.detailCol}>
              <View style={S.detailLabelRow}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={14}
                  color={C.muted}
                />
                <Text style={S.detailLabel}>Status</Text>
              </View>
              {isEditing ? (
                <View style={S.segmentRow}>
                  {(["pending", "completed"] as TaskStatus[]).map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setEditedStatus(s)}
                      style={[
                        S.segmentChip,
                        editedStatus === s && S.segmentChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          S.segmentChipText,
                          editedStatus === s && S.segmentChipTextActive,
                        ]}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text
                  style={[
                    S.detailValue,
                    {
                      color:
                        taskData.status === "completed"
                          ? C.green
                          : C.accentGreen,
                    },
                  ]}
                >
                  {taskData.status.charAt(0).toUpperCase() +
                    taskData.status.slice(1)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Notes Card */}
        {taskData.notes || isEditing ? (
          <View style={[S.card, isEditing && S.cardEditing]}>
            <Text style={S.sectionTitle}>Notes</Text>
            <View style={S.rule} />
            {isEditing ? (
              <TextInput
                style={[S.input, S.inputNotes]}
                value={editedNotes}
                onChangeText={setEditedNotes}
                multiline
                placeholder="Add notes..."
                placeholderTextColor={C.muted}
              />
            ) : (
              <Text style={S.notesText}>{taskData.notes}</Text>
            )}
          </View>
        ) : null}

        {/* Actions Card */}
        <View style={S.card}>
          <View style={S.actionsGrid}>
            <Pressable
              style={[S.actionBtn, S.deleteBtnMinimal]}
              onPress={confirmDeleteTask}
            >
              <Ionicons name="trash-outline" size={16} color={C.terracotta} />
              <Text style={[S.actionBtnText, S.deleteBtnTextMinimal]}>
                Remove Task
              </Text>
            </Pressable>
          </View>
        </View>

        {isEditing && (
          <View style={S.card}>
            <View style={S.actionsRow}>
              <Pressable onPress={discardChanges} style={S.ghostBtn}>
                <Text style={S.mono}>Discard</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void saveChanges();
                }}
                style={S.primaryBtn}
              >
                <Text style={[S.mono, { color: "#FFFFFF" }]}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Animated.ScrollView>

      <AppToast
        message={toastMessage}
        visible={toastVisible}
        position="top"
        topOffset={72}
        onHide={() => {
          setToastVisible(false);
          setToastMessage(null);
        }}
      />

      {showDatePicker && (
        <Modal transparent animationType="slide" visible={showDatePicker}>
          <View style={S.timePickerModalOverlay}>
            <View style={S.timePickerModalContainer}>
              <View style={S.timePickerModalContent}>
                <Text style={S.timePickerModalTitle}>Select Date</Text>
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="spinner"
                  onChange={handlePickerChange}
                  textColor={C.text}
                  style={S.timePickerNative}
                />
              </View>
              <View style={S.timePickerFooter}>
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  style={S.timePickerCancelBtn}
                >
                  <Text style={S.timePickerCancelText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={confirmDate} style={S.timePickerConfirm}>
                  <Text style={S.timePickerConfirmText}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showTimePicker && (
        <Modal transparent animationType="slide" visible={showTimePicker}>
          <View style={S.timePickerModalOverlay}>
            <View style={S.timePickerModalContainer}>
              <View style={S.timePickerModalContent}>
                <Text style={S.timePickerModalTitle}>Select Time</Text>
                <DateTimePicker
                  value={pickerDate}
                  mode="time"
                  display="spinner"
                  onChange={handlePickerChange}
                  textColor={C.text}
                  style={S.timePickerNative}
                />
              </View>
              <View style={S.timePickerFooter}>
                <Pressable
                  onPress={() => setShowTimePicker(false)}
                  style={S.timePickerCancelBtn}
                >
                  <Text style={S.timePickerCancelText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={confirmTime} style={S.timePickerConfirm}>
                  <Text style={S.timePickerConfirmText}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.paper,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E9E1",
  },
  headerTitle: {
    fontFamily: "SpaceMono",
    fontSize: 17,
    color: C.text,
    fontWeight: "600",
  },
  backBtn: { padding: 8, alignItems: "center", justifyContent: "center" },

  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
    gap: 16,
  },

  editingBanner: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: C.leafBg,
    borderWidth: 1,
    borderColor: "#D8E8DE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  editingBannerText: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.accentGreen,
  },

  card: {
    backgroundColor: C.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#C8C0B4",
    padding: 18,
    gap: 14,
  },
  cardEditing: {
    borderColor: "#9EC3AE",
    backgroundColor: "#FFFEFC",
  },
  rule: { height: 1, backgroundColor: "#F5F0EB" },

  mono: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: "#97A099",
  },

  taskHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBubble: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  taskTypeLabel: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: C.muted,
  },
  editTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  miniTypeChip: {
    borderWidth: 1,
    borderColor: "#E5DED5",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: C.card,
  },
  miniTypeChipActive: {
    borderColor: C.accentGreen,
    backgroundColor: C.leafBg,
  },
  miniTypeChipText: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: C.muted,
  },
  miniTypeChipTextActive: {
    color: C.accentGreen,
  },
  taskPlantName: {
    fontFamily: "SpaceMono",
    fontSize: 16,
    color: C.text,
    fontWeight: "600",
    marginTop: 2,
  },
  inlineInput: {
    marginTop: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 13,
  },
  statusBadge: { alignItems: "center", justifyContent: "center" },

  taskTitle: {
    fontFamily: "SpaceMono",
    fontSize: 18,
    color: C.text,
    lineHeight: 24,
  },

  sectionTitle: {
    fontFamily: "SpaceMono",
    fontSize: 15,
    color: C.text,
    fontWeight: "600",
  },

  detailRow: { flexDirection: "row", gap: 12 },
  detailCol: { flex: 1, gap: 8 },
  detailLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailLabel: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.muted,
  },
  detailValue: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: C.text,
    fontWeight: "500",
  },
  detailPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: C.leafBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D8E8DE",
  },
  detailPickerText: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: C.accentGreen,
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  segmentChip: {
    borderWidth: 1,
    borderColor: "#E5DED5",
    backgroundColor: "#FFFBF7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  segmentChipActive: {
    borderColor: C.accentGreen,
    backgroundColor: C.leafBg,
  },
  segmentChipText: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.muted,
  },
  segmentChipTextActive: {
    color: C.accentGreen,
  },

  notesText: {
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: C.text,
    lineHeight: 20,
  },

  actionsGrid: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  actionBtn: {
    flex: 1,
    minWidth: "48%",
    backgroundColor: "#F8FAF9",
    borderWidth: 1.2,
    borderColor: "#E8DFD6",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
  },
  actionBtnText: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.text,
  },
  deleteBtnMinimal: {
    flex: 0,
    alignSelf: "flex-start",
    flexDirection: "row",
    paddingVertical: 2,
    paddingHorizontal: 0,
    borderRadius: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    minWidth: undefined,
    gap: 4,
    opacity: 0.85,
  },
  deleteBtnTextMinimal: {
    color: C.terracotta,
    fontSize: 11,
  },

  input: {
    borderWidth: 1.2,
    borderColor: "#E8DFD6",
    borderRadius: 16,
    backgroundColor: "#FFFBF7",
    color: C.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "SpaceMono",
    fontSize: 14,
  },
  inputNotes: { minHeight: 72, textAlignVertical: "top" },

  actionsRow: { flexDirection: "row", gap: 10 },
  ghostBtn: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: "#E8DFD6",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: C.accentGreen,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },

  timePickerModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  timePickerModalContainer: {
    backgroundColor: C.offWhite,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
  },
  timePickerModalContent: {
    paddingTop: 14,
    paddingHorizontal: 10,
  },
  timePickerModalTitle: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: C.muted,
    textAlign: "center",
    marginBottom: 4,
  },
  timePickerNative: {
    alignSelf: "center",
  },
  timePickerFooter: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: C.rowBorder,
    backgroundColor: C.offWhite,
  },
  timePickerCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D9E0DA",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  timePickerCancelText: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: C.muted,
  },
  timePickerConfirm: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.accentGreen,
  },
  timePickerConfirmText: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: "#FFFFFF",
  },

  emptyText: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: C.muted,
    textAlign: "center",
  },
});
