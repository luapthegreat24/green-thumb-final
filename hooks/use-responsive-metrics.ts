import { useCallback, useMemo } from "react";
import { Platform, useWindowDimensions } from "react-native";

export function useResponsiveMetrics() {
  const { width, height } = useWindowDimensions();
  const shortSide = Math.min(width, height);

  const scale = useMemo(() => {
    if (shortSide < 360) return 0.9;
    if (shortSide < 390) return 0.96;
    if (shortSide > 460) return 1.08;
    return 1;
  }, [shortSide]);

  const scaled = useCallback(
    (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value * scale)),
    [scale],
  );

  return {
    width,
    height,
    shortSide,
    isNarrow: shortSide < 360,
    isCompact: shortSide < 390,
    isAndroid: Platform.OS === "android",
    screenPadding: Math.round(scaled(16, 12, 22)),
    sectionGap: Math.round(scaled(16, 12, 24)),
    scaled,
  };
}
