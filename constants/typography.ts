// Brand typography. Two faces, loaded in app/_layout.tsx:
//
// - Outfit (body). A geometric humanist sans with real display weight.
// - Saira (display). Squarish geometric forms with REAL heavy italics, the
//   closest Google-Fonts match to the logo's forward-sheared gothic. Used for
//   Latin titles, numerals, serials ("01", "FORM 03"), stamps and caps labels.
//
// React Native does NOT synthesize weights or italics for custom fonts: each
// weight/style is its own family referenced by name (Android ignores
// fontStyle:'italic' for custom families). So instead of `fontWeight`, text
// picks a family via `font(weight)` / `display(weight, italic)`. `fontWeight`
// is left in styles only as a web fallback.
//
// Saira has no CJK glyphs. Localized display text in zh/ja/ko uses Outfit at
// the same weight, upright, never uppercased or letter-spaced (displayFor /
// useType). Numerals and Latin chrome stay Saira in every locale.

import { useMemo } from "react";
import type { TextStyle } from "react-native";
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from "@expo-google-fonts/outfit";
import {
  Saira_600SemiBold,
  Saira_700Bold,
  Saira_700Bold_Italic,
  Saira_800ExtraBold,
  Saira_800ExtraBold_Italic,
} from "@expo-google-fonts/saira";

import type { Locale } from "@/constants/i18n";
import { useLanguage } from "@/contexts/language-context";

// Family names as registered with expo-font (see app/_layout.tsx).
export const FONT_FAMILY = {
  regular: "Outfit_400Regular",
  medium: "Outfit_500Medium",
  semibold: "Outfit_600SemiBold",
  bold: "Outfit_700Bold",
  extrabold: "Outfit_800ExtraBold",
} as const;

export type FontWeightKey = keyof typeof FONT_FAMILY;

/** Saira families we ship. Only these five files are bundled (~500 KB). */
export const DISPLAY_FAMILY = {
  semibold: "Saira_600SemiBold",
  bold: "Saira_700Bold",
  boldItalic: "Saira_700Bold_Italic",
  extrabold: "Saira_800ExtraBold",
  extraboldItalic: "Saira_800ExtraBold_Italic",
} as const;

export type DisplayWeight = "semibold" | "bold" | "extrabold";

// Asset map consumed by useFonts() in the root layout.
export const FONT_ASSETS = {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Saira_600SemiBold,
  Saira_700Bold,
  Saira_700Bold_Italic,
  Saira_800ExtraBold,
  Saira_800ExtraBold_Italic,
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

/**
 * Saira display family by name. There is no SemiBold Italic file in the
 * bundle, so `display('semibold', true)` uses the Bold Italic — the nearest
 * real italic — rather than a synthetic oblique.
 */
export function display(weight: DisplayWeight, italic = false): TextStyle {
  if (!italic) return { fontFamily: DISPLAY_FAMILY[weight] };
  return {
    fontFamily:
      weight === "extrabold"
        ? DISPLAY_FAMILY.extraboldItalic
        : DISPLAY_FAMILY.boldItalic,
  };
}

/** zh / ja / ko: scripts Saira cannot draw and that must not be caps-styled. */
export function isCJK(locale: Locale): boolean {
  return locale === "zh" || locale === "ja" || locale === "ko";
}

// Hiragana/katakana, CJK ideographs, Hangul, full-width forms.
const CJK_CHARS = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\uff00-\uffef]/;

/** True when a string contains CJK glyphs (for labels that may be Latin chrome in any locale). */
export function hasCJK(text: string): boolean {
  return CJK_CHARS.test(text);
}

/**
 * Display face for LOCALIZED text: Saira (italic as asked) for English, Outfit
 * at the same weight, upright, for zh/ja/ko. Do not use for numerals or Latin
 * chrome — those stay `display()` in every locale.
 */
export function displayFor(
  locale: Locale,
  weight: DisplayWeight,
  italic = false
): TextStyle {
  return isCJK(locale) ? font(weight) : display(weight, italic);
}

// Lock digit width so calculator results don't jitter as values change.
export const tabularNums: TextStyle = { fontVariant: ["tabular-nums"] };

/**
 * Canonical page-title look: Outfit ExtraBold, upright, tight tracking. Titles
 * stay upright in every locale; Saira is reserved for numerals.
 */
export const displayTitle: TextStyle = {
  ...font("extrabold"),
  fontWeight: "800",
  fontSize: 26,
  letterSpacing: -0.6,
};

/** displayTitle without negative tracking for zh/ja/ko, which it would crowd. */
export function displayTitleFor(locale: Locale): TextStyle {
  return isCJK(locale) ? { ...displayTitle, letterSpacing: 0 } : displayTitle;
}

/** The named type ramp. */
export type TypeRamp = {
  /** 30/36 — screen title. */
  hero: TextStyle;
  /** 22/28 — page and hero-card titles. */
  title: TextStyle;
  /** 18/24 — section headings. */
  section: TextStyle;
  /** 13/18 medium — small secondary label above or beside content. Sentence case. */
  kicker: TextStyle;
  /** 13/18 semibold — tabs, chips, small control labels. Sentence case. */
  labelCaps: TextStyle;
  /** 40/46 tabular — calculator results, countdown hero. Saira. */
  numXL: TextStyle;
  /** 15/19 tabular — capsules, gauges, stats. Saira. */
  num: TextStyle;
  /** 15/21 — body copy. */
  body: TextStyle;
  /** 15/21 semibold — emphasized body. */
  bodyStrong: TextStyle;
  /** 13/18 medium — secondary lines; pair with c.textMuted. */
  caption: TextStyle;
  /** Large numerals; kept for API compatibility, sized like numXL. */
  ghost: TextStyle;
};

/** Pure builder behind useType(); exported for tests and non-hook callers. */
export function typeRamp(locale: Locale): TypeRamp {
  const cjk = isCJK(locale);
  // CJK glyphs sit taller in the em box; give them a little more leading and
  // drop the negative tracking that would crowd them.
  const heading = (
    weight: FontWeightKey,
    size: number,
    line: number,
    tracking: number
  ): TextStyle => ({
    ...font(weight),
    fontWeight: weight === "extrabold" ? "800" : "700",
    fontSize: size,
    lineHeight: cjk ? Math.round(size * 1.35) : line,
    letterSpacing: cjk ? 0 : tracking,
  });

  return {
    hero: heading("extrabold", 30, 36, -0.7),
    title: heading("extrabold", 22, 28, -0.4),
    section: heading("bold", 18, 24, -0.2),
    kicker: { ...font("medium"), fontSize: 13, lineHeight: 18 },
    labelCaps: { ...font("semibold"), fontWeight: "600", fontSize: 13, lineHeight: 18 },
    numXL: { ...display("bold"), ...tabularNums, fontSize: 40, lineHeight: 46 },
    num: { ...display("semibold"), ...tabularNums, fontSize: 15, lineHeight: 19 },
    body: { ...font("regular"), fontSize: 15, lineHeight: 21 },
    bodyStrong: { ...font("semibold"), fontWeight: "600", fontSize: 15, lineHeight: 21 },
    caption: { ...font("medium"), fontSize: 13, lineHeight: 18 },
    ghost: { ...display("bold"), ...tabularNums, fontSize: 40, lineHeight: 46 },
  };
}

/** Locale-aware type ramp for the active language. */
export function useType(): TypeRamp {
  const { locale } = useLanguage();
  return useMemo(() => typeRamp(locale), [locale]);
}
