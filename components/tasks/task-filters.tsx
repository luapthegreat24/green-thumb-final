/**
 * Task Filters — Filter tasks by status
 */

import { AppButton } from "@/components/ui/app-button";
import { DS } from "@/constants/app-design-system";
import { TaskStatus } from "@/types/care-task";
import React from "react";
import { StyleSheet, View } from "react-native";

interface TaskFiltersProps {
  activeFilter: TaskStatus | "all";
  onFilterChange: (filter: TaskStatus | "all") => void;
}

export function TaskFilters({
  activeFilter,
  onFilterChange,
}: TaskFiltersProps) {
  const filters = [
    { id: "all" as const, label: "All" },
    { id: "pending" as const, label: "Pending" },
    { id: "completed" as const, label: "Done" },
    { id: "missed" as const, label: "Missed" },
  ];

  return (
    <View style={styles.container}>
      {filters.map((filter) => (
        <AppButton
          key={filter.id}
          variant={activeFilter === filter.id ? "primary" : "secondary"}
          label={filter.label}
          onPress={() => onFilterChange(filter.id)}
          containerStyle={styles.filterButton}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.screenX,
    paddingVertical: DS.spacing.md,
    justifyContent: "space-between",
  },
  filterButton: {
    flex: 1,
  },
});
