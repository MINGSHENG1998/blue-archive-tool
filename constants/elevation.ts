import { Platform, type ViewStyle } from "react-native";
import type { ThemeTokens } from "@/constants/theme";

// Soft, modern elevation. Replaces visible borders as the way to separate
// surfaces. On light themes a soft multi-layer-feel shadow reads well; on dark
// themes shadows barely show, so depth comes mostly from the lighter
// `elevatedBg` token — we keep only a faint shadow there to avoid a flat look.
export type ElevationLevel = 1 | 2 | 3;

const LEVELS: Record<ElevationLevel, { y: number; radius: number; opacity: number; android: number }> = {
  1: { y: 2, radius: 8, opacity: 0.1, android: 2 },
  2: { y: 6, radius: 16, opacity: 0.14, android: 5 },
  3: { y: 12, radius: 24, opacity: 0.2, android: 10 },
};

export function elevation(c: ThemeTokens, level: ElevationLevel = 1): ViewStyle {
  const l = LEVELS[level];
  return {
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: l.y },
    // dark themes: dampen shadow (it's barely visible and can muddy the look)
    shadowOpacity: c.isDark ? l.opacity * 0.6 : l.opacity,
    shadowRadius: l.radius,
    // Android elevation also tints with shadowColor; keep modest on dark.
    elevation: Platform.OS === "android" ? (c.isDark ? Math.round(l.android / 2) : l.android) : 0,
  };
}
