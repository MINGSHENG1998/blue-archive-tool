// Brand typography. The app uses Outfit — a geometric humanist sans with real
// display weight — as its single typeface. React Native does NOT synthesize
// weights for custom fonts: each weight must be loaded as its own family and
// referenced by name. So instead of `fontWeight`, prominent text picks a family
// via `font(weight)`. `fontWeight` is left in styles only as a web fallback.

import type { TextStyle } from "react-native";
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from "@expo-google-fonts/outfit";

// Family names as registered with expo-font (see app/_layout.tsx).
export const FONT_FAMILY = {
  regular: "Outfit_400Regular",
  medium: "Outfit_500Medium",
  semibold: "Outfit_600SemiBold",
  bold: "Outfit_700Bold",
  extrabold: "Outfit_800ExtraBold",
} as const;

export type FontWeightKey = keyof typeof FONT_FAMILY;

// Asset map consumed by useFonts() in the root layout.
export const FONT_ASSETS = {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
};

// Maps the numeric/keyword weights used across the codebase to a family key.
const WEIGHT_ALIASES: Record<string, FontWeightKey> = {
  "400": "regular",
  normal: "regular",
  "500": "medium",
  "600": "semibold",
  "700": "bold",
  bold: "bold",
  "800": "extrabold",
  "900": "extrabold",
};

/**
 * Returns the fontFamily for a weight. Accepts a family key ("semibold") or any
 * weight string already used in styles ("600", "bold"). Falls back to regular.
 */
export function font(weight: FontWeightKey | string = "regular"): TextStyle {
  const key =
    (FONT_FAMILY as Record<string, string>)[weight] !== undefined
      ? (weight as FontWeightKey)
      : WEIGHT_ALIASES[weight] ?? "regular";
  return { fontFamily: FONT_FAMILY[key] };
}

// Lock digit width so calculator results don't jitter as values change.
export const tabularNums: TextStyle = { fontVariant: ["tabular-nums"] };

/**
 * Canonical page-title look. Outfit ExtraBold with display tracking. Replaces the
 * old "system bold + faux italic" treatment that was copy-pasted across screens
 * (Outfit ships no italic, and synthetic obliquing looks cheap — the real
 * extrabold weight carries the presence instead).
 */
export const displayTitle: TextStyle = {
  ...font("extrabold"),
  fontWeight: "800",
  fontSize: 24,
  letterSpacing: -0.4,
};
