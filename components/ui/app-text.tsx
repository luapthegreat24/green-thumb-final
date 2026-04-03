import React from "react";
import { StyleSheet, Text, type TextProps } from "react-native";

import { DS } from "@/constants/app-design-system";

type AppTextVariant =
  | "display"
  | "title"
  | "body"
  | "bodyStrong"
  | "caption"
  | "mono";

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
};

export function AppText({
  variant = "body",
  style,
  children,
  ...props
}: AppTextProps) {
  return (
    <Text style={[styles[variant], style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  display: DS.typography.display,
  title: DS.typography.title,
  body: DS.typography.body,
  bodyStrong: DS.typography.bodyStrong,
  caption: DS.typography.caption,
  mono: DS.typography.mono,
});
