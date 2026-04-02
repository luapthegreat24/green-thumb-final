import type { TextStyle } from "react-native";

export const P = {
  p0: "#FFFFFF",
  p1: "#F7F7F5",
  p2: "#EFEFEC",
  p3: "#E4E4E0",
  p4: "#D4D4D0",
  i0: "#111318",
  i1: "#1E2228",
  i2: "#4A4F57",
  i3: "#757B85",
  i4: "#A7ABB2",
  g0: "#14351F",
  g1: "#1F6B3A",
  g2: "#2B7D46",
  g3: "#6B9A7A",
  g4: "#B8C9BD",
  gBg: "rgba(43,125,70,0.08)",
  rust: "#D15C4A",
  amber: "#C08A2D",
  hair: "rgba(17,19,24,0.08)",
  sketch: "rgba(17,19,24,0.14)",
  heavy: "rgba(17,19,24,0.18)",
} as const;

export const SP = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 36,
  xxxl: 56,
} as const;

export const TY: Record<string, TextStyle> = {
  display: {
    fontFamily: "System",
    fontWeight: "700",
    letterSpacing: -0.8,
    color: P.i1,
  },
  serif: {
    fontFamily: "System",
    color: P.i1,
  },
  mono: {
    fontFamily: "System",
    color: P.i2,
  },
  monoLabel: {
    fontFamily: "System",
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: P.i3,
  },
  body: {
    fontFamily: "System",
    fontWeight: "400",
    color: P.i1,
  },
};
