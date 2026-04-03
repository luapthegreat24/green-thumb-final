import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CareTasksProvider } from "@/providers/care-tasks-provider";

type Frequency = "once" | "daily" | "weekly" | "monthly";

// Mock task data - in a real app, this would come from state management
const MOCK_TASKS: Record<
  string,
  {
    id: string;
    plantName: string;
    title: string;
    taskType: string;
    time: string;
    frequency: Frequency;
    status: string;
    notes?: string;
    dateKey: string;
  }
> = {
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
    frequency: "monthly",
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
  string,
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
  monthly: "Monthly",
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const contentOpacity = new Animated.Value(0);
  const [isEditing, setIsEditing] = useState(false);

  const task = useMemo(() => {
    return id ? MOCK_TASKS[id] : null;
  }, [id]);

  const [editedTitle, setEditedTitle] = useState(task?.title || "");
  const [editedNotes, setEditedNotes] = useState(task?.notes || "");

  React.useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!task) {
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

  const meta = TASK_STYLE[task.taskType];

  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}>
        <Pressable onPress={() => router.back()} style={S.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.accentGreen} />
        </Pressable>
        <Text style={S.headerTitle}>Task Details</Text>
        <Pressable onPress={() => setIsEditing(!isEditing)} style={S.backBtn}>
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
        {/* Task Header Card */}
        <View style={S.card}>
          <View style={S.taskHeaderRow}>
            <View style={[S.iconBubble, { backgroundColor: meta.color + "15" }]}>
              <Ionicons name={meta.icon} size={24} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.taskTypeLabel}>{meta.label}</Text>
              <Text style={S.taskPlantName}>{task.plantName}</Text>
            </View>
            <View style={S.statusBadge}>
              <Ionicons
                name={
                  task.status === "completed"
                    ? "checkmark-circle-outline"
                    : "ellipse-outline"
                }
                size={24}
                color={task.status === "completed" ? C.green : C.muted}
              />
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
            <Text style={S.taskTitle}>{task.title}</Text>
          )}
        </View>

        {/* Details Card */}
        <View style={S.card}>
          <Text style={S.sectionTitle}>Details</Text>
          <View style={S.rule} />

          <View style={S.detailRow}>
            <View style={S.detailCol}>
              <View style={S.detailLabelRow}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={C.muted}
                />
                <Text style={S.detailLabel}>Date</Text>
              </View>
              <Text style={S.detailValue}>
                {formatDate(task.dateKey)}
              </Text>
            </View>
            <View style={S.detailCol}>
              <View style={S.detailLabelRow}>
                <Ionicons name="time-outline" size={14} color={C.muted} />
                <Text style={S.detailLabel}>Time</Text>
              </View>
              <Text style={S.detailValue}>{prettyTime(task.time)}</Text>
            </View>
          </View>

          <View style={S.detailRow}>
            <View style={S.detailCol}>
              <View style={S.detailLabelRow}>
                <Ionicons name="repeat-outline" size={14} color={C.muted} />
                <Text style={S.detailLabel}>Frequency</Text>
              </View>
              <Text style={S.detailValue}>
                {FREQUENCIES_DISPLAY[task.frequency]}
              </Text>
            </View>
            <View style={S.detailCol}>
              <View style={S.detailLabelRow}>
                <Ionicons name="checkmark-done-outline" size={14} color={C.muted} />
                <Text style={S.detailLabel}>Status</Text>
              </View>
              <Text
                style={[
                  S.detailValue,
                  {
                    color:
                      task.status === "completed" ? C.green : C.accentGreen,
                  },
                ]}
              >
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes Card */}
        {task.notes || isEditing ? (
          <View style={S.card}>
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
              <Text style={S.notesText}>{task.notes}</Text>
            )}
          </View>
        ) : null}

        {/* Actions Card */}
        <View style={S.card}>
          <Text style={S.sectionTitle}>Actions</Text>
          <View style={S.rule} />

          <View style={S.actionsGrid}>
            <Pressable style={S.actionBtn}>
              <Ionicons name="repeat-outline" size={20} color={C.accentGreen} />
              <Text style={S.actionBtnText}>Reschedule</Text>
            </Pressable>
            <Pressable style={S.actionBtn}>
              <Ionicons name="pencil-outline" size={20} color={C.amber} />
              <Text style={S.actionBtnText}>Edit Task</Text>
            </Pressable>
            <Pressable style={S.actionBtn}>
              <Ionicons name="duplicate-outline" size={20} color={C.sage} />
              <Text style={S.actionBtnText}>Duplicate</Text>
            </Pressable>
            <Pressable style={S.actionBtn}>
              <Ionicons name="trash-outline" size={20} color={C.terracotta} />
              <Text style={S.actionBtnText}>Delete</Text>
            </Pressable>
          </View>
        </View>

        {isEditing && (
          <View style={S.card}>
            <View style={S.actionsRow}>
              <Pressable onPress={() => setIsEditing(false)} style={S.ghostBtn}>
                <Text style={S.mono}>Discard</Text>
              </Pressable>
              <Pressable onPress={() => setIsEditing(false)} style={S.primaryBtn}>
                <Text style={[S.mono, { color: "#FFFFFF" }]}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Animated.ScrollView>
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

  card: {
    backgroundColor: C.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#C8C0B4",
    padding: 18,
    gap: 14,
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
  taskPlantName: {
    fontFamily: "SpaceMono",
    fontSize: 16,
    color: C.text,
    fontWeight: "600",
    marginTop: 2,
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

  notesText: {
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: C.text,
    lineHeight: 20,
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
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

  emptyText: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: C.muted,
    textAlign: "center",
  },
});
