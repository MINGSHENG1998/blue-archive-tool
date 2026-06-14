import React, { useMemo } from "react";
import { View, StyleSheet, type ViewProps, type ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";
import { elevation, type ElevationLevel } from "@/constants/elevation";
import { RADIUS } from "@/constants/layout";
import type { ThemeTokens } from "@/constants/theme";

type Props = ViewProps & {
  /** Visual elevation level (depth). Default 1. */
  level?: ElevationLevel;
  /** Inner padding. Default 20. Pass 0 for flush content. */
  padding?: number;
  /** Use the higher-contrast surface tint (default) or the flatter inset surface. */
  variant?: "elevated" | "surface";
};

/**
 * The modern base surface: borderless, softly elevated, generously rounded.
 * Replaces the old bordered Card pattern. Depth comes from elevation + the
 * lighter `elevatedBg`/`surfaceBg` tokens, not outlines.
 */
export function AppCard({
  level = 1,
  padding = 20,
  variant = "elevated",
  style,
  children,
  ...rest
}: Props) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c, variant), [c, variant]);
  return (
    <View
      style={[styles.card, elevation(c, level), { padding }, style as ViewStyle]}
      {...rest}
    >
      {children}
    </View>
  );
}

const makeStyles = (c: ThemeTokens, variant: "elevated" | "surface") =>
  StyleSheet.create({
    card: {
      backgroundColor: variant === "elevated" ? c.elevatedBg : c.surfaceBg,
      borderRadius: RADIUS.card,
    },
  });
