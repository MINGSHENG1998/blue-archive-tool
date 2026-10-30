import React, { useMemo } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { useColors } from "@/hooks/useColors";
import { RADIUS } from "@/constants/layout";
import type { ThemeTokens } from "@/constants/theme";

type Level = 1 | 2 | 3;
type Variant = "elevated" | "surface" | "hero";

type Props = ViewProps & {
  /** Kept for API compatibility. Depth now comes from the surface tone alone. */
  level?: Level;
  /** Inner padding. Default 20. Pass 0 for flush content. */
  padding?: number;
  /**
   * 'elevated' (default) = white sheet with a hairline edge; 'surface' = the
   * flatter tinted inset used inside another sheet; 'hero' = elevated.
   */
  variant?: Variant;
  /** Kept for API compatibility; ignored. */
  tone?: string;
  /** Kept for API compatibility; ignored. */
  serial?: string;
  /** Kept for API compatibility; ignored. */
  chamfer?: boolean;
  /** Kept for API compatibility; ignored. */
  on?: string;
  /** Kept for API compatibility; ignored. */
  spine?: boolean;
};

/**
 * The base surface. A flat sheet with a hairline edge and no shadow: depth
 * comes from the sheet sitting a step lighter (or darker) than the page, which
 * reads the same on every theme and on web, and never bleeds Android
 * elevation boxes on dark themes.
 */
export function AppCard({
  level: _level,
  padding = 20,
  variant = "elevated",
  tone: _tone,
  serial: _serial,
  chamfer: _chamfer,
  on: _on,
  spine: _spine,
  style,
  children,
  ...rest
}: Props) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View
      style={[variant === "surface" ? styles.surface : styles.sheet, { padding }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: c.elevatedBg,
      borderRadius: RADIUS.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.isDark ? c.hairline : c.surfaceBorder,
    },
    surface: {
      backgroundColor: c.surfaceBg,
      borderRadius: RADIUS.control,
    },
  });
