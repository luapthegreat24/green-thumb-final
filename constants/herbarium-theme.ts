import type { TextStyle } from "react-native";

export const P = {
  p0: "#FFFFFF",
  p1: "#F7F4EF",
  p2: "#EDE8DF",
  p3: "#E3DCCF",
  p4: "#D8D0C4",
  i0: "#1C2318",
  i1: "#243024",
  i2: "#4A5544",
  i3: "#8A9585",
  i4: "#A6B09E",
  g0: "#2A5C3F",
  g1: "#5C8B6E",
  g2: "#76A085",
  g3: "#98B8A4",
  g4: "#C5D9CC",
  gBg: "rgba(92,139,110,0.12)",
  rust: "#C4623A",
  amber: "#B87A2A",
  hair: "rgba(74,85,68,0.14)",
  sketch: "rgba(74,85,68,0.2)",
  heavy: "rgba(28,35,24,0.22)",
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
