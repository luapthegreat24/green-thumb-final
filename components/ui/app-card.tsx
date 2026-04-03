import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { DS } from "@/constants/app-design-system";

type AppCardProps = ViewProps & {
  elevated?: boolean;
};

export function AppCard({
  style,
  children,
  elevated = false,
  ...props
}: AppCardProps) {
  return (
    <View
      style={[styles.card, elevated ? DS.shadow.cardSoft : null, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.lg,
    gap: DS.spacing.md,
  },
});
