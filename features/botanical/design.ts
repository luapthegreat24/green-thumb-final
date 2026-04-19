import { Platform } from "react-native";

export const botanical = {
  color: {
    parchment: "#F5EFE0",
    parchmentDeep: "#EADFC8",
    parchmentSoft: "#FBF7EE",
    ink: "#20180C",
    inkMuted: "#5E4D33",
    inkGhost: "#9A8669",
    vine: "#3A7048",
    vineDark: "#2B5C36",
    vineWash: "rgba(58,112,72,0.10)",
    wax: "#B83C22",
    line: "rgba(30,20,8,0.16)",
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  font: {
    display: Platform.OS === "ios" ? "Georgia" : "serif",
    body: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
    mono: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
} as const;
