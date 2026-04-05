import React, { useMemo } from "react";
import { Text, type TextProps } from "react-native";

import { DS } from "@/constants/app-design-system";
import { useResponsiveMetrics } from "@/hooks/use-responsive-metrics";

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
  const { scaled } = useResponsiveMetrics();

  const variantStyles = useMemo(
    () => ({
      display: {
        ...DS.typography.display,
        fontSize: Math.round(scaled(DS.typography.display.fontSize, 28, 40)),
        lineHeight: Math.round(
          scaled(DS.typography.display.lineHeight, 34, 46),
        ),
      },
      title: {
        ...DS.typography.title,
        fontSize: Math.round(scaled(DS.typography.title.fontSize, 18, 24)),
        lineHeight: Math.round(scaled(DS.typography.title.lineHeight, 22, 30)),
      },
      body: {
        ...DS.typography.body,
        fontSize: Math.round(scaled(DS.typography.body.fontSize, 13, 16)),
        lineHeight: Math.round(scaled(DS.typography.body.lineHeight, 18, 24)),
      },
      bodyStrong: {
        ...DS.typography.bodyStrong,
        fontSize: Math.round(scaled(DS.typography.bodyStrong.fontSize, 13, 16)),
        lineHeight: Math.round(
          scaled(DS.typography.bodyStrong.lineHeight, 18, 24),
        ),
      },
      caption: {
        ...DS.typography.caption,
        fontSize: Math.round(scaled(DS.typography.caption.fontSize, 11, 13)),
        lineHeight: Math.round(
          scaled(DS.typography.caption.lineHeight, 14, 18),
        ),
      },
      mono: {
        ...DS.typography.mono,
        fontSize: Math.round(scaled(DS.typography.mono.fontSize, 9, 11)),
        lineHeight: Math.round(scaled(DS.typography.mono.lineHeight, 12, 16)),
      },
    }),
    [scaled],
  );

  return (
    <Text style={[variantStyles[variant], style]} {...props}>
      {children}
    </Text>
  );
}
