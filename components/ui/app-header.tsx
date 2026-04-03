import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { DS } from "@/constants/app-design-system";

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
  return (
    <View style={[styles.wrap, style]} {...props}>
      {eyebrow ? (
        <AppText variant="mono" style={{ color: DS.colors.primaryMid }}>
          {eyebrow}
        </AppText>
      ) : null}
      <AppText variant="display">{title}</AppText>
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
