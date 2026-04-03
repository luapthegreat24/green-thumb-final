import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { DS } from "@/constants/app-design-system";

type AppListItemProps = Omit<PressableProps, "style"> & {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export function AppListItem({
  title,
  subtitle,
  left,
  right,
  containerStyle,
  ...props
}: AppListItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        pressed && styles.pressed,
        containerStyle,
      ]}
      {...props}
    >
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.content}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.spacing.sm,
    backgroundColor: DS.colors.bg,
    borderWidth: 1,
    borderColor: DS.colors.borderSoft,
    borderRadius: DS.radius.md,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm,
  },
  pressed: {
    opacity: 0.88,
  },
  left: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
