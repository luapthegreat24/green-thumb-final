import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { DS } from "@/constants/app-design-system";
import { useResponsiveMetrics } from "@/hooks/use-responsive-metrics";

type AppCardProps = ViewProps & {
  elevated?: boolean;
};

export function AppCard({
  style,
  children,
  elevated = false,
  ...props
}: AppCardProps) {
  const { scaled } = useResponsiveMetrics();

  return (
    <View
      style={[
        styles.card,
        {
          padding: Math.round(scaled(DS.spacing.lg, 12, 20)),
          borderRadius: Math.round(scaled(DS.radius.lg, 14, 24)),
          gap: Math.round(scaled(DS.spacing.md, 10, 16)),
        },
        elevated ? DS.shadow.cardSoft : null,
        style,
      ]}
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
