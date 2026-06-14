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
    // Keep shadows soft so cards read as a gentle lift, not a hard outline.
    // Light themes especially: a strong shadow looks like an ugly border.
    shadowOpacity: c.isDark ? l.opacity * 0.6 : l.opacity * 0.4,
    shadowRadius: l.radius,
    // Android elevation renders a tight shadow halo; keep it low so it doesn't
    // look like a border on light backgrounds.
    elevation:
      Platform.OS === "android"
        ? Math.max(1, Math.round(l.android * (c.isDark ? 0.4 : 0.5)))
        : 0,
  };
}
