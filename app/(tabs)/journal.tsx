import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
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
import { useGarden } from "@/providers/garden-provider";
import {
  getDefaultTaskTitle,
  type TaskFrequency,
  type TaskStatus,
  type TaskType,
} from "@/types/care-task";

type Frequency = "once" | TaskFrequency;

type ScheduleItem = {
  id: string;
  plantId: string;
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
const FREQUENCIES: Frequency[] = ["once", "daily", "weekly"];
const FREQUENCIES_DISPLAY: Record<Frequency, string> = {
  once: "Once",
  daily: "Daily",
  weekly: "Weekly",
};
const WEEK_CHIP_WIDTH = 92;
const WEEK_CHIP_GAP = 10;
const WEEK_SNAP = WEEK_CHIP_WIDTH + WEEK_CHIP_GAP;

function prettyTime(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function normalizePlantName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export default function JournalScreen() {
  const router = useRouter();
  const { plants: userPlants } = useGarden();
  const {
    tasks: backendTasks,
    addTask: addCareTask,
    markAsCompleted,
    markAsPending,
    loading: tasksLoading,
    error: tasksError,
  } = useCareTasks();

  // Helper function to get start of current week (Monday)
  const getWeekStart = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(today);
    weekStart.setDate(diff);
    return weekStart;
  };

  const actualToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().slice(0, 10);
  }, []);
  const [weekOffset, setWeekOffset] = useState(0);

  // Generate current week (7 days, Monday-Sunday)
  const week = useMemo(() => {
    const weekStart = getWeekStart();
    weekStart.setDate(weekStart.getDate() + weekOffset * 7);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      days.push({
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
      });
    }
    return days;
  }, [weekOffset]);
  const weekScrollX = useRef(new Animated.Value(0)).current;
  const weekScrollRef = useRef<ScrollView>(null);
  const mainScrollRef = useRef<ScrollView>(null);
  const formRef = useRef<View>(null);

  // Initialize formOpacity to 0 (form hidden initially)
  const formOpacityRef = useRef<Animated.Value | null>(null);
  const formTranslateYRef = useRef<Animated.Value | null>(null);
  const formScaleRef = useRef<Animated.Value | null>(null);
  if (!formOpacityRef.current) {
    formOpacityRef.current = new Animated.Value(0);
  }
  if (!formTranslateYRef.current) {
    formTranslateYRef.current = new Animated.Value(14);
  }
  if (!formScaleRef.current) {
    formScaleRef.current = new Animated.Value(0.98);
  }
  const formOpacity = formOpacityRef.current;
  const formTranslateY = formTranslateYRef.current;
  const formScale = formScaleRef.current;
  const taskAnimations = useRef<Record<string, Animated.Value>>({});
  const checkAnimations = useRef<Record<string, Animated.Value>>({});
  const celebrateAnimations = useRef<Record<string, Animated.Value>>({});
  const previousAnimatedDate = useRef<string>("");
  const [formYPosition, setFormYPosition] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const hasTodayInWeek = week.some((d) => d.key === actualToday);
    return hasTodayInWeek ? actualToday : (week[0]?.key ?? actualToday);
  });
  const [showForm, setShowForm] = useState(false);
  const [renderForm, setRenderForm] = useState(false);

  const [plantName, setPlantName] = useState("");
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [showPlantSuggestions, setShowPlantSuggestions] = useState(false);
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("watering");
  const [time, setTime] = useState("09:00");
  const [frequency, setFrequency] = useState<Frequency>("once");
  const [notes, setNotes] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date(2025, 0, 1, 9, 0));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [invalidFields, setInvalidFields] = useState({
    plantName: false,
    title: false,
  });
  const selectingSuggestionRef = useRef(false);
  const lastAutoTitleRef = useRef("");

  // Filter plants based on user input
  const filteredPlants = useMemo(() => {
    const trimmed = plantName.toLowerCase().trim();
    if (!trimmed) return userPlants;
    return userPlants.filter(
      (plant) =>
        plant.name.toLowerCase().includes(trimmed) ||
        plant.species.toLowerCase().includes(trimmed),
    );
  }, [plantName, userPlants]);

  const handleSelectPlant = (plant: (typeof userPlants)[0]) => {
    selectingSuggestionRef.current = true;
    setSelectedPlantId(plant.id);
    setPlantName(plant.name);
    setInvalidFields((prev) => ({ ...prev, plantName: false }));
    setShowPlantSuggestions(false);
    setTimeout(() => {
      selectingSuggestionRef.current = false;
    }, 200);
  };

  const defaultTaskTitle = useMemo(
    () => getDefaultTaskTitle(taskType, plantName.trim() || "Plant"),
    [plantName, taskType],
  );

  useEffect(() => {
    setTitle((currentTitle) => {
      const trimmedTitle = currentTitle.trim();
      const shouldAutofill =
        trimmedTitle.length === 0 || trimmedTitle === lastAutoTitleRef.current;

      if (!shouldAutofill || currentTitle === defaultTaskTitle) {
        return currentTitle;
      }

      lastAutoTitleRef.current = defaultTaskTitle;
      return defaultTaskTitle;
    });
  }, [defaultTaskTitle]);

  const tasks = useMemo<ScheduleItem[]>(
    () =>
      backendTasks.map((task) => {
        const dateTime = task.dateTime;
        const recurringFrequency = task.frequency ?? "weekly";
        const frequency: Frequency = task.isRecurring
          ? recurringFrequency
          : "once";

        return {
          id: task.id,
          plantId: task.plantId,
          plantName: task.plantName,
          title: task.title,
          taskType: task.taskType,
          dateKey: dateTime.toISOString().slice(0, 10),
          time: `${String(dateTime.getHours()).padStart(2, "0")}:${String(
            dateTime.getMinutes(),
          ).padStart(2, "0")}`,
          frequency,
          status: task.status,
          notes: task.notes,
        };
      }),
    [backendTasks],
  );

  const selectedLabel =
    week.find((d) => d.key === selectedDate)?.label ?? "today";

  const weekRangeLabel = useMemo(() => {
    const start = week[0];
    const end = week[6];
    if (!start || !end) return "";

    const startDate = new Date(`${start.key}T00:00:00`);
    const endDate = new Date(`${end.key}T00:00:00`);
    const startText = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endText = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return `${startText} - ${endText}`;
  }, [week]);

  const weekTitle = useMemo(() => {
    if (weekOffset === 0) return "This Week";
    if (weekOffset === 1) return "Next Week";
    if (weekOffset === -1) return "Last Week";
    if (weekOffset > 1) return `${weekOffset} Weeks Ahead`;
    return `${Math.abs(weekOffset)} Weeks Ago`;
  }, [weekOffset]);

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

  const goToWeek = (delta: number) => {
    const nextWeekStart = getWeekStart();
    nextWeekStart.setDate(nextWeekStart.getDate() + (weekOffset + delta) * 7);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

    const nextStartKey = nextWeekStart.toISOString().slice(0, 10);
    const nextEndKey = nextWeekEnd.toISOString().slice(0, 10);
    const includesToday =
      actualToday >= nextStartKey && actualToday <= nextEndKey;
    const nextKey = includesToday ? actualToday : nextStartKey;

    setWeekOffset((prev) => prev + delta);
    setSelectedDate(nextKey);
  };

  const addTask = async () => {
    const trimmedPlantName = plantName.trim();
    const trimmedTitle = title.trim();
    const nextInvalidFields = {
      plantName: trimmedPlantName.length === 0,
      title: trimmedTitle.length === 0,
    };

    if (nextInvalidFields.plantName || nextInvalidFields.title) {
      setInvalidFields(nextInvalidFields);
      setToastMessage("Please fill in all required fields");
      setToastVisible(true);
      return;
    }

    const normalizedPlantName = normalizePlantName(trimmedPlantName);
    const matchedPlant = userPlants.find(
      (plant) => normalizePlantName(plant.name) === normalizedPlantName,
    );

    if (!matchedPlant || !normalizedPlantName) {
      setInvalidFields((prev) => ({ ...prev, plantName: true }));
      setToastMessage("Plant not found in your garden");
      setToastVisible(true);
      return;
    }

    const dateTime = new Date(`${selectedDate}T${time}:00`);
    const plantId = matchedPlant.id;

    try {
      await addCareTask({
        plantId,
        plantName: matchedPlant.name,
        taskType,
        title: trimmedTitle,
        dateTime,
        isRecurring: frequency !== "once",
        frequency: frequency === "once" ? null : frequency,
        notes: notes.trim() || undefined,
        reminderEnabled: false,
      });

      setInvalidFields({ plantName: false, title: false });
      setPlantName("");
      setSelectedPlantId(null);
      setShowPlantSuggestions(false);
      setTitle("");
      setTaskType("watering");
      setTime("09:00");
      setFrequency("once");
      setNotes("");
      setShowForm(false);
      lastAutoTitleRef.current = "";
      setToastMessage("Task added successfully");
      setToastVisible(true);
    } catch {
      // Firestore/auth issues are surfaced in the header error text.
    }
  };

  const toggleStatus = async (task: ScheduleItem) => {
    const nextStatus = task.status === "completed" ? "pending" : "completed";

    if (nextStatus === "completed") {
      await markAsCompleted(task.id);
      triggerCheckCelebration(task.id);
    } else {
      await markAsPending(task.id);
    }
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

  const getTaskAnimation = (taskId: string) => {
    if (!taskAnimations.current[taskId]) {
      taskAnimations.current[taskId] = new Animated.Value(1);
    }
    return taskAnimations.current[taskId];
  };

  const getCheckAnimation = (task: ScheduleItem) => {
    if (!checkAnimations.current[task.id]) {
      checkAnimations.current[task.id] = new Animated.Value(
        task.status === "completed" ? 1 : 0,
      );
    }
    return checkAnimations.current[task.id];
  };

  const getCelebrateAnimation = (taskId: string) => {
    if (!celebrateAnimations.current[taskId]) {
      celebrateAnimations.current[taskId] = new Animated.Value(0);
    }
    return celebrateAnimations.current[taskId];
  };

  const triggerCheckCelebration = (taskId: string) => {
    const anim = getCelebrateAnimation(taskId);
    anim.stopAnimation();
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 460,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    let scrollTimeoutId: ReturnType<typeof setTimeout> | null = null;

    if (showForm) {
      setRenderForm(true);
      formOpacity.setValue(0);
      formTranslateY.setValue(-10);
      formScale.setValue(0.975);

      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(formOpacity, {
            toValue: 1,
            duration: 280,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(formTranslateY, {
            toValue: 0,
            duration: 280,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(formScale, {
            toValue: 1,
            duration: 280,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ]).start();
      });

      if (formYPosition > 0) {
        scrollTimeoutId = setTimeout(() => {
          mainScrollRef.current?.scrollTo({
            y: formYPosition - 100,
            animated: true,
          });
        }, 120);
      }
    } else if (renderForm) {
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 0,
          duration: 280,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateY, {
          toValue: -10,
          duration: 280,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(formScale, {
          toValue: 0.975,
          duration: 280,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setRenderForm(false);
        }
      });
    }

    return () => {
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
      }
    };
  }, [
    showForm,
    renderForm,
    formYPosition,
    formOpacity,
    formTranslateY,
    formScale,
  ]);

  useEffect(() => {
    if (!week.some((d) => d.key === selectedDate)) {
      setSelectedDate(week[0]?.key ?? selectedDate);
    }
  }, [week, selectedDate]);

  useEffect(() => {
    const selectedIndex = week.findIndex((d) => d.key === selectedDate);
    if (selectedIndex < 0) return;

    const timeoutId = setTimeout(() => {
      weekScrollRef.current?.scrollTo({
        x: Math.max(0, selectedIndex * WEEK_SNAP),
        animated: true,
      });
    }, 40);

    return () => clearTimeout(timeoutId);
  }, [selectedDate, week]);

  useEffect(() => {
    const isNewDay = previousAnimatedDate.current !== selectedDate;
    const dayAnimations = tasksForDay.map((task) => {
      const anim = getTaskAnimation(task.id);
      if (isNewDay) {
        anim.setValue(0);
      }
      return anim;
    });

    if (isNewDay) {
      Animated.parallel(
        dayAnimations.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ).start();
    }

    previousAnimatedDate.current = selectedDate;
  }, [tasksForDay, selectedDate]);

  useEffect(() => {
    tasks.forEach((task) => {
      const anim = getCheckAnimation(task);
      Animated.timing(anim, {
        toValue: task.status === "completed" ? 1 : 0,
        duration: 170,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [tasks]);

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
        keyboardShouldPersistTaps="handled"
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
          <Text style={S.headerSub}>Synced with Firestore</Text>
          {tasksError ? (
            <Text style={[S.headerSub, { color: C.terracotta }]}>
              {tasksError}
            </Text>
          ) : null}
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
              <Text style={S.sectionTitle}>{weekTitle}</Text>
              <Text style={S.sectionHint}>Mon - Sun</Text>
            </View>
            <View style={S.weekHeaderActions}>
              <View style={S.weekNavGroup}>
                <Pressable onPress={() => goToWeek(-1)} style={S.weekNavBtn}>
                  <Ionicons name="chevron-back" size={14} color={C.green} />
                </Pressable>
                <Text style={S.weekRangeText}>{weekRangeLabel}</Text>
                <Pressable onPress={() => goToWeek(1)} style={S.weekNavBtn}>
                  <Ionicons name="chevron-forward" size={14} color={C.green} />
                </Pressable>
              </View>
            </View>
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
              const isToday = day.key === actualToday;
              const animatedScale = weekScrollX.interpolate({
                inputRange,
                outputRange: [0.995, 1, 0.995],
                extrapolate: "clamp",
              });
              const animatedOpacity = weekScrollX.interpolate({
                inputRange,
                outputRange: [0.96, 1, 0.96],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={day.key}
                  style={{
                    transform: [{ scale: animatedScale }],
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

          <View style={S.bottomInfoRow}>
            <View style={S.selectedPill}>
              <Ionicons name="sparkles-outline" size={12} color={C.green} />
              <Text style={S.selectedPillText}>
                {selectedLabel.charAt(0).toUpperCase() + selectedLabel.slice(1)}
              </Text>
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
        </View>

        {renderForm && (
          <Animated.View
            ref={formRef}
            onLayout={(e) => setFormYPosition(e.nativeEvent.layout.y)}
            style={[
              S.card,
              {
                opacity: formOpacity,
                transform: [
                  { translateY: formTranslateY },
                  { scale: formScale },
                ],
              },
            ]}
          >
            <Text style={S.sectionTitle}>
              New Task for{" "}
              {selectedLabel.charAt(0).toUpperCase() + selectedLabel.slice(1)}
            </Text>
            <View style={S.rule} />

            <Text
              style={[
                S.fieldLabel,
                invalidFields.plantName && S.fieldLabelError,
              ]}
            >
              Plant Name *
            </Text>
            <View style={{ position: "relative" }}>
              <TextInput
                style={[S.input, invalidFields.plantName && S.inputError]}
                value={plantName}
                onChangeText={(value) => {
                  setPlantName(value);
                  setSelectedPlantId(null);
                  if (invalidFields.plantName) {
                    setInvalidFields((prev) => ({ ...prev, plantName: false }));
                  }
                }}
                onFocus={() => {
                  if (!selectingSuggestionRef.current) {
                    setShowPlantSuggestions(true);
                  }
                }}
                onBlur={() => {
                  if (!selectingSuggestionRef.current) {
                    setTimeout(() => setShowPlantSuggestions(false), 100);
                  }
                }}
                placeholder="E.g. Monstera deliciosa"
                placeholderTextColor={C.muted}
              />
              {showPlantSuggestions && filteredPlants.length > 0 && (
                <View style={S.suggestionsContainer}>
                  <ScrollView
                    scrollEnabled={filteredPlants.length > 4}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    style={S.suggestionsList}
                  >
                    {filteredPlants.map((plant) => (
                      <Pressable
                        key={plant.id}
                        onPressIn={() => handleSelectPlant(plant)}
                        style={S.suggestionItem}
                      >
                        <View>
                          <Text style={S.suggestionName}>{plant.name}</Text>
                          <Text style={S.suggestionSpecies}>
                            {plant.species}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

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

            <Text
              style={[S.fieldLabel, invalidFields.title && S.fieldLabelError]}
            >
              Task Title *
            </Text>
            <TextInput
              style={[S.input, invalidFields.title && S.inputError]}
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                lastAutoTitleRef.current = "";
                if (invalidFields.title) {
                  setInvalidFields((prev) => ({ ...prev, title: false }));
                }
              }}
              placeholder={defaultTaskTitle}
              placeholderTextColor={C.muted}
            />

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
          <Text style={S.sectionTitle}>
            Tasks for{" "}
            {selectedLabel.charAt(0).toUpperCase() + selectedLabel.slice(1)}
          </Text>
          <View style={S.rule} />

          {tasksForDay.length === 0 ? (
            <View style={S.emptyWrap}>
              <Ionicons name="calendar-outline" size={20} color={C.muted} />
              <Text style={S.emptyText}>
                {tasksLoading ? "Loading Tasks..." : "No Tasks Scheduled"}
              </Text>
            </View>
          ) : (
            <View>
              {tasksForDay.map((task, index) => {
                const meta = TASK_STYLE[task.taskType];
                const taskAnimValue = getTaskAnimation(task.id);
                const checkAnimValue = getCheckAnimation(task);
                const celebrateAnimValue = getCelebrateAnimation(task.id);
                const taskTranslateY = taskAnimValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, 0],
                });
                const taskOpacity = taskAnimValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                });
                const checkScale = checkAnimValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.08],
                });
                const checkOpacity = checkAnimValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.88, 1],
                });
                const confettiOpacity = celebrateAnimValue.interpolate({
                  inputRange: [0, 0.15, 1],
                  outputRange: [0, 1, 0],
                });

                return (
                  <Animated.View
                    key={task.id}
                    style={[
                      {
                        width: "100%",
                        transform: [{ translateY: taskTranslateY }],
                        opacity: taskOpacity,
                      },
                    ]}
                  >
                    <Pressable
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
                            frequency: task.frequency,
                            status: task.status,
                            notes: task.notes ?? "",
                            dateKey: task.dateKey,
                          },
                        })
                      }
                      style={S.taskRowPressable}
                    >
                      <View
                        style={[
                          S.taskRow,
                          { flex: 1 },
                          task.status === "completed" && S.taskRowChecked,
                          index === tasksForDay.length - 1 && {
                            borderBottomWidth: 0,
                          },
                        ]}
                      >
                        <View
                          style={[
                            S.leftStripe,
                            { backgroundColor: meta.color },
                            task.status === "completed" && S.leftStripeChecked,
                          ]}
                        />

                        <View
                          style={[S.iconBubble, { backgroundColor: C.leafBg }]}
                        >
                          <Ionicons
                            name={meta.icon}
                            size={14}
                            color={meta.color}
                          />
                        </View>

                        <View style={[{ flex: 1, minWidth: 0 }]}>
                          <Text
                            style={[
                              S.taskTitle,
                              task.status === "completed" && S.taskTitleChecked,
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {task.title}
                          </Text>
                          <Text
                            style={[
                              S.taskMeta,
                              task.status === "completed" && S.taskMetaChecked,
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {task.plantName} · {prettyTime(task.time)} ·{" "}
                            {task.frequency}
                          </Text>
                          {task.notes ? (
                            <Text
                              style={S.taskNotes}
                              numberOfLines={2}
                              ellipsizeMode="tail"
                            >
                              {task.notes}
                            </Text>
                          ) : null}
                        </View>

                        <View style={S.taskRightActions}>
                          <View style={S.checkControlWrap}>
                            <Animated.View
                              pointerEvents="none"
                              style={[
                                S.confettiLayer,
                                { opacity: confettiOpacity },
                              ]}
                            >
                              <Animated.View
                                style={[
                                  S.confettiDot,
                                  S.confettiDotGreen,
                                  {
                                    transform: [
                                      {
                                        translateY:
                                          celebrateAnimValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, -16],
                                          }),
                                      },
                                    ],
                                  },
                                ]}
                              />
                              <Animated.View
                                style={[
                                  S.confettiDot,
                                  S.confettiDotAmber,
                                  {
                                    transform: [
                                      {
                                        translateX:
                                          celebrateAnimValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, 14],
                                          }),
                                      },
                                      {
                                        translateY:
                                          celebrateAnimValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, -10],
                                          }),
                                      },
                                    ],
                                  },
                                ]}
                              />
                              <Animated.View
                                style={[
                                  S.confettiDot,
                                  S.confettiDotSage,
                                  {
                                    transform: [
                                      {
                                        translateX:
                                          celebrateAnimValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, -14],
                                          }),
                                      },
                                      {
                                        translateY:
                                          celebrateAnimValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, -10],
                                          }),
                                      },
                                    ],
                                  },
                                ]}
                              />
                              <Animated.View
                                style={[
                                  S.confettiDot,
                                  S.confettiDotTerracotta,
                                  {
                                    transform: [
                                      {
                                        translateX:
                                          celebrateAnimValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, 10],
                                          }),
                                      },
                                      {
                                        translateY:
                                          celebrateAnimValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, 10],
                                          }),
                                      },
                                    ],
                                  },
                                ]}
                              />
                              <Animated.View
                                style={[
                                  S.confettiDot,
                                  S.confettiDotGreen,
                                  {
                                    transform: [
                                      {
                                        translateX:
                                          celebrateAnimValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, -10],
                                          }),
                                      },
                                      {
                                        translateY:
                                          celebrateAnimValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, 10],
                                          }),
                                      },
                                    ],
                                  },
                                ]}
                              />
                            </Animated.View>

                            <Animated.View
                              style={{
                                transform: [{ scale: checkScale }],
                                opacity: checkOpacity,
                              }}
                            >
                              <Pressable
                                onPress={(e) => {
                                  e.stopPropagation();
                                  void toggleStatus(task);
                                }}
                                style={[
                                  S.iconBtn,
                                  task.status === "completed" &&
                                    S.iconBtnChecked,
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
                                    task.status === "completed"
                                      ? C.green
                                      : C.muted
                                  }
                                />
                              </Pressable>
                            </Animated.View>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

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
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
    gap: 18,
  },

  card: {
    backgroundColor: C.card,
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: "#C8C0B4",
    padding: 18,
    gap: 14,
  },
  rule: { height: 1.4, backgroundColor: "#DCCFC1" },

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
  statDivider: { width: 1.4, height: 40, backgroundColor: "#D4C5B6" },

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
  weekHeaderActions: {
    alignItems: "flex-end",
  },
  weekNavGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weekNavBtn: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: "#E8DFD6",
    backgroundColor: "#F8FAF9",
    alignItems: "center",
    justifyContent: "center",
  },
  weekRangeText: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.muted,
    minWidth: 96,
    textAlign: "center",
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
  bottomInfoRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  selectedPill: {
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
  fieldLabelError: {
    color: C.terracotta,
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
  inputError: {
    borderColor: C.terracotta,
    backgroundColor: "#FFF7F4",
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
    borderRadius: 12,
  },
  taskRowChecked: {
    backgroundColor: "#FBFDFB",
  },
  taskRowPressable: {
    flexDirection: "row",
  },
  leftStripe: { width: 4, alignSelf: "stretch", borderRadius: 99 },
  leftStripeChecked: { opacity: 0.45 },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  taskTitle: { fontFamily: "SpaceMono", fontSize: 15, color: C.text },
  taskTitleChecked: {
    color: "#5D6B61",
    textDecorationLine: "line-through",
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
  },
  weekBadge: {
    backgroundColor: C.leafBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: C.accentGreen,
  },
  weekBadgeText: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    fontWeight: "600",
    color: C.accentGreen,
  },
  taskMeta: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  taskMetaChecked: {
    color: "#9AA59D",
  },
  taskNotes: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: C.text,
    marginTop: 4,
  },

  taskRightActions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7FAF8",
  },
  iconBtnChecked: {
    backgroundColor: "#EEF5F0",
  },
  checkControlWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  confettiLayer: {
    position: "absolute",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  confettiDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 99,
  },
  confettiDotGreen: {
    backgroundColor: C.accentGreen,
  },
  confettiDotAmber: {
    backgroundColor: C.amber,
  },
  confettiDotSage: {
    backgroundColor: C.sage,
  },
  confettiDotTerracotta: {
    backgroundColor: C.terracotta,
  },

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
  suggestionsContainer: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "#E8DFD6",
    zIndex: 10,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F0EB",
  },
  suggestionName: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: C.text,
    marginBottom: 2,
  },
  suggestionSpecies: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.muted,
  },
});
