import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { DS } from "@/constants/app-design-system";
import { useResponsiveMetrics } from "@/hooks/use-responsive-metrics";

type AppHeaderProps = ViewProps & {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function AppHeader({
  eyebrow,
  title,
  subtitle,
  style,
  ...props
}: AppHeaderProps) {
  const { scaled } = useResponsiveMetrics();

  return (
    <View
      style={[
        styles.wrap,
        { gap: Math.round(scaled(DS.spacing.sm, 6, 10)) },
        style,
      ]}
      {...props}
    >
      {eyebrow ? (
        <AppText variant="mono" style={{ color: DS.colors.primaryMid }}>
          {eyebrow}
        </AppText>
      ) : null}
      <AppText
        variant="display"
        style={{
          fontSize: Math.round(scaled(DS.typography.display.fontSize, 28, 38)),
          lineHeight: Math.round(
            scaled(DS.typography.display.lineHeight, 34, 44),
          ),
        }}
      >
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: DS.spacing.sm,
  },
  subtitle: {
    color: DS.colors.textMuted,
  },
});
