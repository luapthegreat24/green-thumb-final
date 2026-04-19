import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatbotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ seed?: string }>();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: params.seed
        ? `I can help with ${params.seed}. Ask me anything.`
        : "Ask me anything about your plants or seeds.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const canUseGroq = useMemo(() => !!GROQ_API_KEY, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      if (!canUseGroq) {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content:
              "Set EXPO_PUBLIC_GROQ_API_KEY in your environment to enable Groq chat.",
          },
        ]);
        return;
      }

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful gardening assistant for Green Thumb. Keep answers concise and practical.",
              },
              ...nextMessages.map((message) => ({
                role: message.role,
                content: message.content,
              })),
            ],
            temperature: 0.4,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Groq request failed with status ${response.status}`);
      }

      const data = await response.json();
      const reply =
        data?.choices?.[0]?.message?.content?.trim() ?? "No response returned.";

      setMessages((current) => [
        ...current,
        { role: "assistant", content: reply },
      ]);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error?.message ?? "Unable to reach Groq right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Groq Chatbot</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>

      {!canUseGroq ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Add EXPO_PUBLIC_GROQ_API_KEY to your environment to enable chat.
          </Text>
        </View>
      ) : null}

      <FlatList
        data={messages}
        keyExtractor={(_, index) => String(index)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user" ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={styles.bubbleText}>{item.content}</Text>
          </View>
        )}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about plants, seeds, watering..."
          value={input}
          onChangeText={setInput}
          editable={!loading}
          multiline
        />
        <Pressable
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAF7",
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  close: {
    color: "#2563EB",
    fontWeight: "600",
  },
  warningBox: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  warningText: {
    color: "#92400E",
    fontSize: 13,
  },
  list: {
    paddingVertical: 8,
    gap: 10,
  },
  bubble: {
    maxWidth: "88%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#DCFCE7",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E7EB",
  },
  bubbleText: {
    color: "#111827",
    fontSize: 14,
  },
  composer: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: "#111827",
    minWidth: 72,
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  sendText: {
    color: "#fff",
    fontWeight: "700",
  },
});
