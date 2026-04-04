import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { requestGroqReply } from "@/lib/groq-chat";
import { useAppToast } from "@/providers/app-toast-provider";
import { useCareTasks } from "@/providers/care-tasks-provider";
import { useGarden } from "@/providers/garden-provider";

const C = {
  paper: "#F6F3EE",
  card: "#FFFFFF",
  text: "#182118",
  muted: "#6F7E72",
  accent: "#2F6B49",
  border: "#DED5C8",
  userBubble: "#2F6B49",
  botBubble: "#FFFFFF",
  botTint: "#EFF6F0",
  headerTint: "#EAF3ED",
};

const SYSTEM_PROMPT =
  "You are Green Thumb, a concise and practical plant-care assistant for home gardeners.";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const FALLBACK_PROMPTS = [
  "How often should I water pothos?",
  "Best low-light indoor plants?",
  "Why are my leaves turning yellow?",
  "How do I treat root rot?",
  "What soil mix works for herbs?",
  "How much sun does basil need?",
];

function getRelativeDueLabel(date: Date) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDue = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dayDiff = Math.round(
    (startDue.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDiff <= 0) return "today";
  if (dayDiff === 1) return "tomorrow";
  return `in ${dayDiff} days`;
}

export default function ChatbotScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useAppToast();
  const { plants } = useGarden();
  const { tasks } = useCareTasks();
  const scrollRef = useRef<ScrollView>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi, I'm Green Thumb. Ask me anything about plant care.",
    },
  ]);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const messagesAnim = useRef(new Animated.Value(0)).current;
  const composerAnim = useRef(new Animated.Value(0)).current;
  const blobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(messagesAnim, {
        toValue: 1,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(composerAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blobAnim, {
          toValue: 1,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(blobAnim, {
          toValue: 0,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => {
      loop.stop();
    };
  }, [blobAnim, composerAnim, headerAnim, messagesAnim]);

  const send = async (forcedText?: string) => {
    const value = (forcedText ?? text).trim();
    if (!value || loading) return;

    const userMessage: UiMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: value,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setText("");
    setLoading(true);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });

    try {
      const reply = await requestGroqReply([
        { role: "system", content: SYSTEM_PROMPT },
        ...nextMessages.map((m) => ({ role: m.role, content: m.content })),
      ]);

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: reply,
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send message.";
      showToast(message);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (loading) return;
    void send(prompt);
  };

  const headerAnimatedStyle = {
    opacity: headerAnim,
    transform: [
      {
        translateY: headerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0],
        }),
      },
    ],
  };

  const messagesAnimatedStyle = {
    opacity: messagesAnim,
    transform: [
      {
        translateY: messagesAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  const composerAnimatedStyle = {
    opacity: composerAnim,
    transform: [
      {
        translateY: composerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  const topBlobStyle = {
    transform: [
      {
        translateY: blobAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 8],
        }),
      },
      {
        translateX: blobAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5],
        }),
      },
    ],
  };

  const bottomBlobStyle = {
    transform: [
      {
        translateY: blobAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
      {
        translateX: blobAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 4],
        }),
      },
    ],
  };

  const quickPrompts = useMemo(() => {
    const promptSet = new Set<string>();

    const upcomingTasks = tasks
      .filter((task) => task.status === "pending")
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
      .slice(0, 3);

    upcomingTasks.forEach((task) => {
      const dueLabel = getRelativeDueLabel(task.dateTime);
      promptSet.add(
        `Help me plan ${task.taskType} for ${task.plantName} due ${dueLabel}.`,
      );
    });

    plants.slice(0, 3).forEach((plant) => {
      promptSet.add(
        `Give me a weekly care routine for my ${plant.name} (${plant.species}).`,
      );
      promptSet.add(
        `What signs tell me my ${plant.name} needs water or fertilizer?`,
      );
    });

    if (promptSet.size < 6) {
      FALLBACK_PROMPTS.forEach((prompt) => promptSet.add(prompt));
    }

    return Array.from(promptSet).slice(0, 6);
  }, [plants, tasks]);

  return (
    <SafeAreaView style={S.screen}>
      <Animated.View style={[S.bgBlobTop, topBlobStyle]} />
      <Animated.View style={[S.bgBlobBottom, bottomBlobStyle]} />

      <Animated.View style={[S.header, headerAnimatedStyle]}>
        <Pressable onPress={() => router.back()} style={S.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={C.accent} />
        </Pressable>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>Green Thumb</Text>
          <View style={S.statusPill}>
            <View style={S.statusDot} />
            <Text style={S.statusText}>Plant Care Assistant</Text>
          </View>
        </View>
        <View style={S.iconBtn} />
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 6 : 0}
      >
        <Animated.View style={[S.messagesLayer, messagesAnimatedStyle]}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={S.messagesWrap}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <View
                  key={message.id}
                  style={[S.messageRow, isUser && S.messageRowUser]}
                >
                  {!isUser ? (
                    <View style={S.botAvatar}>
                      <Ionicons
                        name="leaf-outline"
                        size={13}
                        color={C.accent}
                      />
                    </View>
                  ) : null}
                  <View style={[S.bubble, isUser ? S.userBubble : S.botBubble]}>
                    <Text
                      style={[S.bubbleText, isUser && { color: "#FFFFFF" }]}
                    >
                      {message.content}
                    </Text>
                  </View>
                </View>
              );
            })}
            {loading ? (
              <View style={S.loadingRow}>
                <View style={S.botAvatar}>
                  <Ionicons name="leaf-outline" size={13} color={C.accent} />
                </View>
                <ActivityIndicator size="small" color={C.accent} />
                <Text style={S.loadingText}>Green Thumb is thinking...</Text>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>

        <Animated.View style={[S.bottomPanel, composerAnimatedStyle]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={S.quickWrap}
            keyboardShouldPersistTaps="handled"
          >
            {quickPrompts.map((prompt) => (
              <Pressable
                key={prompt}
                style={S.quickChip}
                onPress={() => {
                  handleQuickPrompt(prompt);
                }}
                disabled={loading}
              >
                <Text style={S.quickChipText}>{prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={S.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Ask about watering, light, soil..."
              placeholderTextColor={C.muted}
              style={S.input}
              multiline
              blurOnSubmit={false}
            />
            <Pressable
              onPress={() => {
                void send();
              }}
              style={[S.sendBtn, loading && { opacity: 0.6 }]}
              disabled={loading}
            >
              <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.paper,
  },
  bgBlobTop: {
    position: "absolute",
    top: -90,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: C.headerTint,
  },
  bgBlobBottom: {
    position: "absolute",
    bottom: -120,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "#E9EFE5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(246,243,238,0.92)",
  },
  headerCenter: {
    alignItems: "center",
    gap: 4,
  },
  headerTitle: {
    fontFamily: "SpaceMono",
    fontSize: 18,
    color: C.text,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: C.accent,
  },
  statusText: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: C.muted,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 14,
  },
  messagesLayer: {
    flex: 1,
  },
  bottomPanel: {
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "rgba(246,243,238,0.95)",
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  quickWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  quickChip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#FDF9F2",
  },
  quickChipText: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.text,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.botTint,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: C.border,
  },
  userBubble: {
    backgroundColor: C.userBubble,
    borderColor: C.userBubble,
    borderBottomRightRadius: 8,
  },
  botBubble: {
    backgroundColor: C.botBubble,
    borderBottomLeftRadius: 8,
  },
  bubbleText: {
    fontFamily: "SpaceMono",
    fontSize: 12.5,
    color: C.text,
    lineHeight: 19,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 1,
  },
  loadingText: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: C.muted,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderWidth: 1.2,
    borderColor: C.border,
    borderRadius: 16,
    backgroundColor: "#FFFBF7",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: C.text,
    textAlignVertical: "top",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.accent,
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
