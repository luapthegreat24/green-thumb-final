import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { P, SP, TY } from "@/constants/herbarium-theme";

export default function JournalScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: P.p1 }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + SP.md,
          paddingBottom: insets.bottom + SP.xxxl + 64,
        },
      ]}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Journal</Text>
        <Text style={styles.title}>Recent activity</Text>
        <Text style={styles.subtitle}>
          A simple landing page for notes, reminders, and plant history.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What you can add here</Text>
        <Text style={styles.cardBody}>
          Watering notes, growth photos, repotting dates, or maintenance
          reminders.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SP.lg,
    gap: SP.lg,
  },
  hero: {
    gap: SP.sm,
  },
  eyebrow: {
    ...TY.monoLabel,
    color: P.g1,
    fontSize: 10,
  },
  title: {
    ...TY.display,
    fontSize: 34,
  },
  subtitle: {
    ...TY.body,
    color: P.i2,
    lineHeight: 22,
  },
  card: {
    backgroundColor: P.p0,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: P.sketch,
    padding: SP.lg,
    gap: SP.sm,
  },
  cardTitle: {
    ...TY.body,
    fontSize: 18,
    fontWeight: "800",
    color: P.i1,
  },
  cardBody: {
    ...TY.body,
    color: P.i2,
    lineHeight: 22,
  },
});
