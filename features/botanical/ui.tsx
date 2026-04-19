import React from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewProps,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { botanical } from "@/features/botanical/design";

export function BotanicalScreen({
  children,
  scrollProps,
}: {
  children: React.ReactNode;
  scrollProps?: ScrollViewProps;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.bgLayer} />
      <View style={styles.ringA} />
      <View style={styles.ringB} />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export function BotanicalHeading({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.headingWrap}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.rule} />
    </View>
  );
}

export function BotanicalCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function BotanicalInput({ label, style, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={botanical.color.inkGhost}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

export function BotanicalButton({
  label,
  onPress,
  disabled,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary";
}) {
  const isPrimary = tone === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnSecondary,
        pressed && !disabled && { opacity: 0.85 },
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={[styles.btnText, !isPrimary && { color: botanical.color.ink }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function BotanicalChoiceRow({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View style={styles.choiceRow}>
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.choice, selected && styles.choiceOn]}
          >
            <Text style={[styles.choiceText, selected && styles.choiceTextOn]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: botanical.color.parchment,
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: botanical.color.parchment,
  },
  ringA: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(160,130,60,0.11)",
  },
  ringB: {
    position: "absolute",
    bottom: 60,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(160,120,40,0.06)",
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: botanical.spacing.lg,
    paddingBottom: 120,
    gap: botanical.spacing.md,
  },
  headingWrap: {
    paddingTop: botanical.spacing.md,
  },
  kicker: {
    color: botanical.color.inkGhost,
    fontFamily: botanical.font.mono,
    fontWeight: "700",
    letterSpacing: 2,
    fontSize: 10,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 6,
    color: botanical.color.ink,
    fontFamily: botanical.font.display,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 8,
    color: botanical.color.inkMuted,
    fontFamily: botanical.font.body,
    fontSize: 14,
    lineHeight: 21,
  },
  rule: {
    marginTop: botanical.spacing.sm,
    height: 2,
    backgroundColor: botanical.color.vine,
    opacity: 0.6,
    borderRadius: 2,
  },
  card: {
    borderWidth: 1.5,
    borderColor: botanical.color.line,
    backgroundColor: botanical.color.parchmentSoft,
    borderRadius: botanical.radius.md,
    padding: botanical.spacing.md,
    gap: botanical.spacing.sm,
  },
  inputWrap: {
    gap: 6,
  },
  inputLabel: {
    color: botanical.color.inkGhost,
    fontFamily: botanical.font.mono,
    fontWeight: "700",
    letterSpacing: 1.4,
    fontSize: 10,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1.5,
    borderColor: botanical.color.line,
    borderRadius: botanical.radius.sm,
    height: 50,
    paddingHorizontal: 12,
    color: botanical.color.ink,
    fontSize: 15,
    backgroundColor: botanical.color.parchment,
  },
  btn: {
    height: 50,
    borderRadius: botanical.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  btnPrimary: {
    backgroundColor: botanical.color.vineDark,
    borderColor: "#1F4429",
  },
  btnSecondary: {
    backgroundColor: botanical.color.parchmentDeep,
    borderColor: botanical.color.line,
  },
  btnText: {
    color: botanical.color.parchmentSoft,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: botanical.spacing.sm,
  },
  choice: {
    borderWidth: 1.5,
    borderColor: botanical.color.line,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: botanical.color.parchment,
  },
  choiceOn: {
    borderColor: botanical.color.vine,
    backgroundColor: botanical.color.vineWash,
  },
  choiceText: {
    color: botanical.color.inkMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  choiceTextOn: {
    color: botanical.color.vineDark,
  },
});
