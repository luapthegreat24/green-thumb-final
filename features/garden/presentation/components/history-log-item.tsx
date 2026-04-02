import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { PlantHistoryLog } from "@/features/garden/domain/plant";
import { P, SP, TY } from "@/constants/herbarium-theme";

function iconForAction(action: PlantHistoryLog["action"]) {
  switch (action) {
    case "watered":
      return "water-outline";
    case "fertilized":
      return "flask-outline";
    case "pruned":
      return "cut-outline";
    default:
      return "document-text-outline";
  }
}

export function HistoryLogItem({ log }: { log: PlantHistoryLog }) {
  return (
    <View style={styles.item}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconForAction(log.action)} size={14} color={P.g1} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.title}>{log.action.toUpperCase()}</Text>
        {log.note ? <Text style={styles.note}>{log.note}</Text> : null}
        <Text style={styles.date}>{new Date(log.createdAt).toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    gap: SP.sm,
    alignItems: "flex-start",
    backgroundColor: P.p0,
    borderWidth: 1,
    borderColor: P.hair,
    borderRadius: 14,
    padding: SP.md,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.gBg,
  },
  title: {
    ...TY.monoLabel,
    fontSize: 9,
  },
  note: {
    ...TY.body,
    color: P.i1,
  },
  date: {
    ...TY.body,
    color: P.i3,
    fontSize: 12,
  },
});
