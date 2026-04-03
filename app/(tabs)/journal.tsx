import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
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

type TaskType = "watering" | "fertilizing" | "pruning" | "repotting" | "note";
type TaskStatus = "pending" | "completed";
type Frequency = "once" | "daily" | "weekly" | "monthly";

type ScheduleItem = {
  id: string;
  plantName: string;
  title: string;
  taskType: TaskType;
  dateKey: string; // yyyy-mm-dd
  time: string; // HH:mm
  frequency: Frequency;
  status: TaskStatus;
  notes?: string;
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

const TASK_TYPES: TaskType[] = [
  "watering",
  "fertilizing",
  "pruning",
  "repotting",
  "note",
];
const FREQUENCIES: Frequency[] = ["once", "daily", "weekly", "monthly"];
const FREQUENCIES_DISPLAY: Record<Frequency, string> = {
  once: "Once",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};
const WEEK_CHIP_WIDTH = 92;
const WEEK_CHIP_GAP = 10;
const WEEK_SNAP = WEEK_CHIP_WIDTH + WEEK_CHIP_GAP;

function buildWeekDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      dayNum: d.getDate(),
      dayShort: d
        .toLocaleDateString("en-US", { weekday: "short" })
        .toLowerCase(),
      label: d
        .toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
        .toLowerCase(),
    };
  });
}

function prettyTime(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function seedTasks(week: ReturnType<typeof buildWeekDays>): ScheduleItem[] {
  return [
    {
      id: "t1",
      plantName: "Monstera",
      title: "Water the monstera",
      taskType: "watering",
      dateKey: week[0].key,
      time: "08:30",
      frequency: "weekly",
      status: "pending",
    },
    {
      id: "t2",
      plantName: "Snake plant",
      title: "Light feed",
      taskType: "fertilizing",
      dateKey: week[1].key,
      time: "10:00",
      frequency: "monthly",
      status: "pending",
    },
    {
      id: "t3",
      plantName: "Pothos",
      title: "Trim long vines",
      taskType: "pruning",
      dateKey: week[0].key,
      time: "14:15",
      frequency: "once",
      status: "completed",
    },
  ];
}

export default function JournalScreen() {
  const router = useRouter();
  const week = useMemo(() => buildWeekDays(), []);
  const weekScrollX = useRef(new Animated.Value(0)).current;
  const weekScrollRef = useRef<ScrollView>(null);
  const mainScrollRef = useRef<ScrollView>(null);
  const formRef = useRef<View>(null);
  const formOpacity = useRef(new Animated.Value(0)).current;
  const tasksOpacity = useRef(new Animated.Value(0)).current;
  const taskAnimations = useRef<Animated.Value[]>([]);
  const [formYPosition, setFormYPosition] = useState(0);
  const [selectedDate, setSelectedDate] = useState(week[0].key);
  const [tasks, setTasks] = useState<ScheduleItem[]>(() => seedTasks(week));
  const [showForm, setShowForm] = useState(false);

  const [plantName, setPlantName] = useState("");
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("watering");
  const [time, setTime] = useState("09:00");
  const [frequency, setFrequency] = useState<Frequency>("once");
  const [notes, setNotes] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date(2025, 0, 1, 9, 0));

  const selectedLabel =
    week.find((d) => d.key === selectedDate)?.label ?? "today";

  const taskCountByDay = useMemo(() => {
    return tasks.reduce<Record<string, number>>((acc, task) => {
      acc[task.dateKey] = (acc[task.dateKey] ?? 0) + 1;
      return acc;
    }, {});
  }, [tasks]);

  const tasksForDay = useMemo(
    () =>
      tasks
        .filter((t) => t.dateKey === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [selectedDate, tasks],
  );

  const totalPending = tasks.filter((t) => t.status === "pending").length;
  const totalDone = tasks.filter((t) => t.status === "completed").length;

  const addTask = () => {
    if (!plantName.trim() || !title.trim()) return;

    setTasks((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        plantName: plantName.trim(),
        title: title.trim(),
        taskType,
        dateKey: selectedDate,
        time,
        frequency,
        status: "pending",
        notes: notes.trim() || undefined,
      },
    ]);

    setPlantName("");
    setTitle("");
    setTaskType("watering");
    setTime("09:00");
    setFrequency("once");
    setNotes("");
    setShowForm(false);
  };

  const toggleStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "pending" ? "completed" : "pending",
            }
          : t,
      ),
    );
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const openTimePicker = () => {
    const [h, m] = time.split(":").map(Number);
    const newDate = new Date(2025, 0, 1, h, m);
    setPickerDate(newDate);
    setShowTimePicker(true);
  };

  const confirmTime = () => {
    const hours = String(pickerDate.getHours()).padStart(2, "0");
    const minutes = String(pickerDate.getMinutes()).padStart(2, "0");
    setTime(`${hours}:${minutes}`);
    setShowTimePicker(false);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setPickerDate(selectedDate);
    }
  };

  const formatTimeDisplay = (h: number, m: number) => {
    const suffix = h >= 12 ? "pm" : "am";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  useEffect(() => {
    Animated.timing(formOpacity, {
      toValue: showForm ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();

    if (showForm && formYPosition > 0) {
      setTimeout(() => {
        mainScrollRef.current?.scrollTo({
          y: formYPosition - 100,
          animated: true,
        });
      }, 100);
    }
  }, [showForm, formYPosition]);

  useEffect(() => {
    taskAnimations.current = tasksForDay.map(() => new Animated.Value(0));
    
    Animated.sequence([
      Animated.timing(tasksOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.stagger(
        60,
        taskAnimations.current.map((anim: Animated.Value) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          })
        )
      ),
    ]).start();

    return () => {
      tasksOpacity.setValue(0);
      taskAnimations.current.forEach((anim: Animated.Value) => anim.setValue(0));
    };
  }, [tasksForDay]);

  const scrollToForm = () => {
    if (formYPosition > 0) {
      mainScrollRef.current?.scrollTo({
        y: Math.max(0, formYPosition - 100),
        animated: true,
      });
    }
  };

  return (
    <SafeAreaView style={S.screen}>
      <ScrollView
        ref={mainScrollRef}
        contentContainerStyle={S.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.card}>
          <Text style={S.mono}>
            {new Date()
              .toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
              .toLowerCase()}
          </Text>
          <View style={S.rule} />
          <Text style={S.headerTitle}>Care Schedule</Text>
          <Text style={S.headerSub}>Frontend Only Preview</Text>
          <View style={S.rule} />

          <View style={S.statsRow}>
            <View style={S.statCell}>
              <Text style={S.statValue}>{tasks.length}</Text>
              <Text style={S.mono}>Total</Text>
            </View>
            <View style={S.statDivider} />
            <View style={S.statCell}>
              <Text style={S.statValue}>{totalPending}</Text>
              <Text style={S.mono}>Pending</Text>
            </View>
            <View style={S.statDivider} />
            <View style={S.statCell}>
              <Text style={[S.statValue, { color: C.green }]}>{totalDone}</Text>
              <Text style={S.mono}>Done</Text>
            </View>
          </View>
        </View>

        <View style={S.card}>
          <View style={S.rowBetween}>
            <View>
              <Text style={S.sectionTitle}>Week View</Text>
              <Text style={S.sectionHint}>Tap any day to load tasks</Text>
            </View>
            <Pressable onPress={() => setShowForm((v) => !v)} style={S.addBtn}>
              <View style={S.addBtnIconWrap}>
                <Ionicons
                  name={showForm ? "close" : "add"}
                  size={12}
                  color={C.green}
                />
              </View>
              <Text style={[S.mono, { color: C.green }]}>
                {showForm ? "Close" : "Add Task"}
              </Text>
            </Pressable>
          </View>
          <View style={S.rule} />

          <Animated.ScrollView
            ref={weekScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={S.weekRow}
            snapToInterval={WEEK_SNAP}
            decelerationRate={0.88}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: weekScrollX } } }],
              { useNativeDriver: true },
            )}
            scrollEventThrottle={8}
          >
            {week.map((day, index) => {
              const cellWidthWithGap = WEEK_SNAP;
              const center = index * cellWidthWithGap;
              const inputRange = [
                center - cellWidthWithGap * 2.5,
                center,
                center + cellWidthWithGap * 2.5,
              ];
              const active = day.key === selectedDate;
              const count = taskCountByDay[day.key] ?? 0;
              const isToday = day.key === week[0].key;
              const animatedScale = weekScrollX.interpolate({
                inputRange,
                outputRange: [0.98, 1, 0.98],
                extrapolate: "clamp",
              });
              const animatedOpacity = weekScrollX.interpolate({
                inputRange,
                outputRange: [0.85, 1, 0.85],
                extrapolate: "clamp",
              });
              const animatedLift = weekScrollX.interpolate({
                inputRange,
                outputRange: [1.5, 0, 1.5],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={day.key}
                  style={{
                    transform: [
                      { scale: animatedScale },
                      { translateY: animatedLift },
                    ],
                    opacity: animatedOpacity,
                  }}
                >
                  <Pressable
                    onPress={() => {
                      setSelectedDate(day.key);
                    }}
                    style={[
                      S.dayCell,
                      active &&
                        (isToday ? S.dayCellTodayActive : S.dayCellActive),
                      !active && isToday && S.dayCellToday,
                    ]}
                  >
                    <View style={[S.dayAccent, active && S.dayAccentActive]} />
                    <View style={S.dayTopRow}>
                      <Text style={[S.dayName, active && S.dayNameActive]}>
                        {day.dayShort}
                      </Text>
                      {count > 0 ? (
                        <View
                          style={[S.countBadge, active && S.countBadgeActive]}
                        >
                          <Text
                            style={[
                              S.countBadgeText,
                              active && S.countBadgeTextActive,
                            ]}
                          >
                            {count}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[S.dayNum, active && { color: "#FFFFFF" }]}>
                      {day.dayNum}
                    </Text>
                    <Text
                      style={[
                        S.dayBottomLabel,
                        active && S.dayBottomLabelActive,
                      ]}
                    >
                      {isToday ? "Today" : count > 0 ? "Scheduled" : "Open"}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.ScrollView>

          <View style={S.selectedPill}>
            <Ionicons name="sparkles-outline" size={12} color={C.green} />
            <Text style={S.selectedPillText}>{selectedLabel.charAt(0).toUpperCase() + selectedLabel.slice(1)}</Text>
          </View>
        </View>

        {showForm && (
          <Animated.View
            ref={formRef}
            onLayout={(e) => setFormYPosition(e.nativeEvent.layout.y)}
            style={[S.card, { opacity: formOpacity }]}
          >
            <Text style={S.sectionTitle}>New Task for {selectedLabel.charAt(0).toUpperCase() + selectedLabel.slice(1)}</Text>
            <View style={S.rule} />

            <Text style={S.fieldLabel}>Plant Name</Text>
            <TextInput
              style={S.input}
              value={plantName}
              onChangeText={setPlantName}
              placeholder="E.g. Monstera deliciosa"
              placeholderTextColor={C.muted}
            />

            <Text style={S.fieldLabel}>Task Title</Text>
            <TextInput
              style={S.input}
              value={title}
              onChangeText={setTitle}
              placeholder="E.g. Water thoroughly"
              placeholderTextColor={C.muted}
            />

            <Text style={S.fieldLabel}>Task Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={S.chipsRow}
            >
              {TASK_TYPES.map((type) => {
                const selected = type === taskType;
                const meta = TASK_STYLE[type];
                return (
                  <Pressable
                    key={type}
                    onPress={() => setTaskType(type)}
                    style={[
                      S.chip,
                      selected && {
                        borderColor: meta.color,
                        backgroundColor: C.leafBg,
                      },
                    ]}
                  >
                    <Ionicons name={meta.icon} size={13} color={meta.color} />
                    <Text style={[S.mono, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={S.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={S.fieldLabel}>Time</Text>
                <Pressable onPress={openTimePicker} style={S.timePickerButton}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={C.accentGreen}
                  />
                  <Text style={S.timePickerText}>
                    {(() => {
                      const [h, m] = time.split(":").map(Number);
                      return formatTimeDisplay(h, m);
                    })()}
                  </Text>
                </Pressable>
              </View>

              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={S.fieldLabel}>Frequency</Text>
                <View style={S.frequencyChipsWrapper}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={S.chipsRowCompact}
                    scrollEnabled={true}
                  >
                    {FREQUENCIES.map((f) => {
                      const selected = f === frequency;
                      return (
                        <Pressable
                          key={f}
                          onPress={() => setFrequency(f)}
                          style={[S.smallChip, selected && S.smallChipActive]}
                        >
                          <Text
                            style={[S.mono, selected && { color: "#FFFFFF" }]}
                          >
                            {FREQUENCIES_DISPLAY[f]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            </View>

            <Text style={S.fieldLabel}>Notes (Optional)</Text>
            <TextInput
              style={[S.input, S.inputNotes]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Any care notes..."
              placeholderTextColor={C.muted}
            />

            <View style={S.actionsRow}>
              <Pressable onPress={() => setShowForm(false)} style={S.ghostBtn}>
                <Text style={S.mono}>Cancel</Text>
              </Pressable>
              <Pressable onPress={addTask} style={S.primaryBtn}>
                <Text style={[S.mono, { color: "#FFFFFF" }]}>Save Task</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        <View style={S.card}>
          <Text style={S.sectionTitle}>Tasks for {selectedLabel.charAt(0).toUpperCase() + selectedLabel.slice(1)}</Text>
          <View style={S.rule} />

          {tasksForDay.length === 0 ? (
            <View style={S.emptyWrap}>
              <Ionicons name="calendar-outline" size={20} color={C.muted} />
              <Text style={S.emptyText}>No Tasks Scheduled</Text>
            </View>
          ) : (
            <Animated.View style={{ opacity: tasksOpacity }}>
              {tasksForDay.map((task, index) => {
                const meta = TASK_STYLE[task.taskType];
                const taskAnimValue = taskAnimations.current[index];
                const taskTranslateY = taskAnimValue
                  ? taskAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  : new Animated.Value(0);
                const taskOpacity = taskAnimValue
                  ? taskAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    })
                  : new Animated.Value(1);

                return (
                  <Animated.View
                    key={task.id}
                    style={[
                      {
                        transform: [{ translateY: taskTranslateY }],
                        opacity: taskOpacity,
                      },
                    ]}
                  >
                    <Pressable onPress={() => router.push({ pathname: "/tasks/[id]", params: { id: task.id } })} style={S.taskRowPressable}>
                      <View
                        style={[
                          S.taskRow,
                          index === tasksForDay.length - 1 && {
                            borderBottomWidth: 0,
                          },
                        ]}
                      >
                        <View
                          style={[S.leftStripe, { backgroundColor: meta.color }]}
                        />

                        <View style={[S.iconBubble, { backgroundColor: C.leafBg }]}>
                          <Ionicons name={meta.icon} size={14} color={meta.color} />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={S.taskTitle}>{task.title}</Text>
                          <Text style={S.taskMeta}>
                            {task.plantName} · {prettyTime(task.time)} ·{" "}
                            {task.frequency}
                          </Text>
                          {task.notes ? (
                            <Text style={S.taskNotes}>{task.notes}</Text>
                          ) : null}
                        </View>

                        <View style={S.taskRightActions}>
                          <Pressable
                            onPress={() => toggleStatus(task.id)}
                            style={S.iconBtn}
                          >
                            <Ionicons
                              name={
                                task.status === "completed"
                                  ? "checkmark-circle"
                                  : "ellipse-outline"
                              }
                              size={18}
                              color={
                                task.status === "completed" ? C.green : C.muted
                              }
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => removeTask(task.id)}
                            style={S.iconBtn}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color={C.terracotta}
                            />
                          </Pressable>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {showTimePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showTimePicker}
        >
          <View style={S.timePickerModalOverlay}>
            <View style={S.timePickerModalContainer}>
              <View style={S.timePickerModalContent}>
                <Text style={S.timePickerModalTitle}>Select Time</Text>
                <DateTimePicker
                  value={pickerDate}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
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
  content: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 100, gap: 18 },

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

  headerTitle: {
    fontFamily: "SpaceMono",
    fontSize: 34,
    color: C.accentGreen,
    lineHeight: 40,
  },
  headerSub: {
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: C.muted,
    marginTop: -2,
  },

  statsRow: { flexDirection: "row", alignItems: "center" },
  statCell: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontFamily: "SpaceMono", fontSize: 26, color: C.accentGreen },
  statDivider: { width: 1, height: 40, backgroundColor: "#F0E9E1" },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: "SpaceMono",
    fontSize: 17,
    color: C.text,
  },
  sectionHint: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAF9",
    borderWidth: 1.2,
    borderColor: "#E8DFD6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBtnIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "#EFF5F1",
    alignItems: "center",
    justifyContent: "center",
  },

  weekRow: {
    flexDirection: "row",
    gap: WEEK_CHIP_GAP,
    paddingRight: 20,
    paddingLeft: 4,
    paddingVertical: 12,
  },
  dayCell: {
    width: WEEK_CHIP_WIDTH,
    height: 110,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: "#E8DFD6",
    backgroundColor: C.offWhite,
    paddingVertical: 12,
    paddingHorizontal: 11,
    gap: 7,
  },
  dayCellActive: {
    backgroundColor: C.accentGreen,
    borderColor: "#2A5F3A",
  },
  dayCellToday: {
    borderColor: "#BFD2C4",
    backgroundColor: "#F4F9F5",
    height: 122,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  dayCellTodayActive: {
    backgroundColor: C.accentGreen,
    borderColor: "#2A5F3A",
    height: 122,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  dayAccent: {
    height: 3,
    borderRadius: 99,
    backgroundColor: "#E0EFE5",
    marginBottom: 3,
  },
  dayAccentActive: { backgroundColor: "#F0F8F3" },
  dayTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayName: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.muted,
  },
  dayNameActive: { color: "#DFEEE4" },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5FBF7",
  },
  countBadgeActive: { backgroundColor: "#FFFFFF" },
  countBadgeText: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.accentGreen,
    fontWeight: "600",
  },
  countBadgeTextActive: { color: C.green },
  dayNum: { fontFamily: "SpaceMono", fontSize: 19, color: C.text },
  dayBottomLabel: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: C.muted,
  },
  dayBottomLabelActive: { color: "#DFEEE4" },
  selectedPill: {
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: "#E0DDD5",
    backgroundColor: "#F9FAFB",
  },
  selectedPillText: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: C.accentGreen,
  },

  fieldLabel: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: C.muted,
    marginBottom: 8,
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

  chipsRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  chipsRowCompact: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 2,
    paddingRight: 8,
  },
  frequencyChipsWrapper: {
    overflow: "visible",
    height: 48,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.2,
    borderColor: "#E8DFD6",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: C.offWhite,
  },
  smallChip: {
    borderWidth: 1.2,
    borderColor: "#E8DFD6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.offWhite,
    minHeight: 36,
    justifyContent: "center",
  },
  smallChipActive: {
    backgroundColor: C.accentGreen,
    borderColor: C.accentGreen,
  },

  twoCol: { flexDirection: "row", gap: 10 },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 2 },
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

  emptyWrap: { alignItems: "center", gap: 10, paddingVertical: 24 },
  emptyText: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: C.muted,
  },

  taskRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#FAFAF8",
    paddingVertical: 13,
  },
  taskRowPressable: {
    flexDirection: "row",
  },
  leftStripe: { width: 4, alignSelf: "stretch", borderRadius: 99 },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  taskTitle: { fontFamily: "SpaceMono", fontSize: 15, color: C.text },
  taskMeta: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  taskNotes: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: C.text,
    marginTop: 4,
  },

  taskRightActions: { flexDirection: "row", alignItems: "center" },
  iconBtn: { paddingHorizontal: 6, paddingVertical: 4 },

  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.2,
    borderColor: "#E8DFD6",
    borderRadius: 14,
    backgroundColor: C.offWhite,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  timePickerText: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: C.text,
    textAlign: "center",
    flex: 1,
  },

  timePickerDisplayText: {
    fontFamily: "SpaceMono",
    fontSize: 32,
    color: C.accentGreen,
  },

  timePickerModalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  timePickerModalContainer: {
    backgroundColor: C.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 0,
    maxHeight: "80%",
  },
  timePickerModalContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
    alignItems: "center",
  },
  timePickerModalTitle: {
    fontFamily: "SpaceMono",
    fontSize: 16,
    color: C.text,
    marginBottom: 16,
  },
  timePickerNative: {
    width: "100%",
    height: 220,
  },
  timePickerFooter: {
    position: "relative",
    flexDirection: "row",
    gap: 12,
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E8DFD6",
  },
  timePickerCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "#E8DFD6",
    alignItems: "center",
    backgroundColor: C.offWhite,
  },
  timePickerCancelText: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: C.text,
  },
  timePickerConfirm: {
    flex: 1,
    backgroundColor: C.accentGreen,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  timePickerConfirmText: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: "#FFFFFF",
  },
});
