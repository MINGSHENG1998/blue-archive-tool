/**
 * Resolves the legacy Colors keys against the ACTIVE theme's tokens, so
 * ThemedView/ThemedText and any useThemeColor("background") caller follow the
 * selected theme (not just a light/dark family). See constants/theme.ts.
 */

import { useTheme } from "@/contexts/theme-context";
import type { ThemeTokens } from "@/constants/theme";

type LegacyColorName =
  | "text"
  | "background"
  | "tint"
  | "icon"
  | "tabIconDefault"
  | "tabIconSelected";

type ColorTokenKey =
  | "textPrimary"
  | "appBg"
  | "primaryColor"
  | "textSecondary";

const TOKEN_FOR: Record<LegacyColorName, ColorTokenKey> = {
  text: "textPrimary",
  background: "appBg",
  tint: "primaryColor",
  icon: "textSecondary",
  tabIconDefault: "textSecondary",
  tabIconSelected: "primaryColor",
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: LegacyColorName
) {
  const { theme } = useTheme();
  const scheme = theme.tokens.isDark ? "dark" : "light";
  const colorFromProps = props[scheme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return theme.tokens[TOKEN_FOR[colorName]];
}
