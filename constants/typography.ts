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
//
// Vietnamese and Thai (checked against the bundled TTFs, Oct 2026):
//
//   Outfit  vi: 50 of 74 lowercase letters MISSING — ơ ư ĩ ũ and every letter
//               with a hook above or a dot below (ả ạ ặ ậ ế ễ ệ ỗ ộ ở ợ ự …).
//           th: no Thai at all.
//   Saira   vi: complete (all 134 letters, plus the combining marks).
//           th: no Thai at all.
//
// A face missing glyphs does not fail loudly: the platform swaps in its
// system font for just those characters, so "Tiếng Việt" in Outfit renders
// "Ti", a system "ế", "ng Vi", a system "ệ", "t" — two faces per word, at two
// x-heights. So body text in vi and th uses the platform's system face for the
// WHOLE string (Roboto/Noto on Android, SF/Thonburi on iOS), at the real
// weight: `fontFor(locale, weight)`, `useFont()`, and everything in useType().
// The locale-blind `font()` stays Outfit for callers that have not migrated.
// Saira stays for numerals everywhere, and for Vietnamese display text, which
// it covers in full.

import { useCallback, useMemo } from "react";
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

/** A family key ("semibold") or any weight string already used in styles ("600", "bold"). */
function weightKey(weight: FontWeightKey | string): FontWeightKey {
  return (FONT_FAMILY as Record<string, string>)[weight] !== undefined
    ? (weight as FontWeightKey)
    : WEIGHT_ALIASES[weight] ?? "regular";
}

/**
 * Returns the Outfit fontFamily for a weight. Accepts a family key
 * ("semibold") or any weight string already used in styles ("600", "bold").
 * Falls back to regular.
 *
 * Locale-blind: in vi/th this still answers Outfit, which cannot draw those
 * scripts. New code takes `fontFor(locale, weight)` or `useFont()` instead.
 */
export function font(weight: FontWeightKey | string = "regular"): TextStyle {
  return { fontFamily: FONT_FAMILY[weightKey(weight)] };
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

/**
 * vi / th: locales whose body text Outfit cannot draw (see the header). Not
 * CJK — they are cased and spaced like Latin, except that Thai is never
 * letter-spaced (see allowsTracking).
 */
export function usesSystemFace(locale: Locale): boolean {
  return locale === "vi" || locale === "th";
}

/**
 * True unless letter-spacing would damage the script: CJK crowds, and Thai
 * stacks vowels and tone marks on the consonant, so spacing it detaches them.
 */
export function allowsTracking(locale: Locale): boolean {
  return !isCJK(locale) && locale !== "th";
}

/** `letterSpacing` as tuned for Latin, or 0 where the script must not be tracked. */
export function trackingFor(locale: Locale, letterSpacing: number): number {
  return allowsTracking(locale) ? letterSpacing : 0;
}

// The real weight for the system face, which unlike Outfit does honour it.
const SYSTEM_WEIGHT: Record<FontWeightKey, NonNullable<TextStyle["fontWeight"]>> = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
};

/**
 * The platform's own UI face at a weight. `fontFamily` is set to undefined
 * rather than left out, so spreading this over a style that already named
 * Outfit really does clear it.
 */
export function systemFace(weight: FontWeightKey | string = "regular"): TextStyle {
  return { fontFamily: undefined, fontWeight: SYSTEM_WEIGHT[weightKey(weight)] };
}

/**
 * Locale-aware body face: Outfit for en/zh/ja/ko (zh/ja/ko text is all-CJK,
 * so the platform draws every character and nothing mixes), the system face
 * at the same weight for vi/th.
 */
export function fontFor(locale: Locale, weight: FontWeightKey | string = "regular"): TextStyle {
  return usesSystemFace(locale) ? systemFace(weight) : font(weight);
}

/** `fontFor` bound to the active locale: `const face = useFont(); face("bold")`. */
export function useFont(): (weight?: FontWeightKey | string) => TextStyle {
  const { locale } = useLanguage();
  return useCallback((weight = "regular") => fontFor(locale, weight), [locale]);
}

// Hiragana/katakana, CJK ideographs, Hangul, full-width forms.
const CJK_CHARS = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\uff00-\uffef]/;

/** True when a string contains CJK glyphs (for labels that may be Latin chrome in any locale). */
export function hasCJK(text: string): boolean {
  return CJK_CHARS.test(text);
}

const THAI_CHARS = /[\u0e00-\u0e7f]/;

/** True when a string contains Thai. */
export function hasThai(text: string): boolean {
  return THAI_CHARS.test(text);
}

// Exactly the Vietnamese letters Outfit lacks: Ĩ ĩ Ũ ũ Ơ ơ Ư ư, the Latin
// Extended Additional block (ạ ả ấ … ỹ), and the combining hook above and dot
// below that decomposed (NFD) text spells them with.
const OUTFIT_MISSING_LATIN = /[\u0128\u0129\u0168\u0169\u01a0\u01a1\u01af\u01b0\u0309\u0323\u1ea0-\u1ef9]/;

/**
 * True when Outfit would have to borrow glyphs to draw `text` — Thai, or a
 * Vietnamese letter it lacks. For text whose language is not the UI's own:
 * the "Tiếng Việt" pill in an English language picker, a student name from
 * another locale's overlay.
 */
export function needsSystemFace(text: string): boolean {
  return THAI_CHARS.test(text) || OUTFIT_MISSING_LATIN.test(text);
}

/**
 * The body face for one specific string: the system face when the string
 * itself needs it (whatever the UI locale), otherwise `fontFor(locale)`.
 */
export function fontForText(
  text: string,
  locale: Locale,
  weight: FontWeightKey | string = "regular",
): TextStyle {
  return needsSystemFace(text) ? systemFace(weight) : fontFor(locale, weight);
}

/**
 * Display face for LOCALIZED text: Saira (italic as asked) for English and
 * Vietnamese, which Saira draws in full; Outfit at the same weight, upright,
 * for zh/ja/ko; the system face, upright, for Thai. Do not use for numerals or
 * Latin chrome — those stay `display()` in every locale.
 */
export function displayFor(
  locale: Locale,
  weight: DisplayWeight,
  italic = false
): TextStyle {
  if (isCJK(locale)) return font(weight);
  if (locale === "th") return systemFace(weight);
  return display(weight, italic);
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

/**
 * displayTitle for a locale: without negative tracking for zh/ja/ko and Thai,
 * which it would crowd, and in the system face for vi/th. No lineHeight is
 * set, so the face's own ascent keeps Thai marks and stacked Vietnamese
 * diacritics clear of the line above.
 */
export function displayTitleFor(locale: Locale): TextStyle {
  if (isCJK(locale)) return { ...displayTitle, letterSpacing: 0 };
  if (usesSystemFace(locale)) {
    return {
      ...displayTitle,
      ...systemFace("extrabold"),
      letterSpacing: locale === "vi" ? -0.3 : 0,
    };
  }
  return displayTitle;
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

/**
 * Line height for a locale, from the Latin value tuned for Outfit:
 *
 * - zh/ja/ko: glyphs sit taller in the em box; 1.35x for headings.
 * - th: vowels and tone marks stack above and below the consonant, and a
 *   fixed line height shorter than that clips them on Android; 1.5x floor.
 * - vi: capitals carry two stacked diacritics (Ấ, Ễ) above cap height; a
 *   1.3x floor keeps them clear of the line above.
 */
function leadingFor(locale: Locale, size: number, line: number, heading: boolean): number {
  if (isCJK(locale)) return heading ? Math.round(size * 1.35) : line;
  if (locale === "th") return Math.max(line, Math.round(size * 1.5));
  if (locale === "vi") return Math.max(line, Math.round(size * 1.3));
  return line;
}

/** Pure builder behind useType(); exported for tests and non-hook callers. */
export function typeRamp(locale: Locale): TypeRamp {
  // Outfit's negative display tracking is tuned for Outfit; the system faces
  // vi falls back to are already tighter-fitted, so it gets half.
  const headingTracking = (tracking: number) =>
    locale === "vi" ? tracking / 2 : trackingFor(locale, tracking);

  const heading = (
    weight: FontWeightKey,
    size: number,
    line: number,
    tracking: number
  ): TextStyle => ({
    ...fontFor(locale, weight),
    fontWeight: weight === "extrabold" ? "800" : "700",
    fontSize: size,
    lineHeight: leadingFor(locale, size, line, true),
    letterSpacing: headingTracking(tracking),
  });

  const text = (
    weight: FontWeightKey,
    size: number,
    line: number,
    fontWeight?: TextStyle["fontWeight"]
  ): TextStyle => ({
    ...fontFor(locale, weight),
    ...(fontWeight ? { fontWeight } : {}),
    fontSize: size,
    lineHeight: leadingFor(locale, size, line, false),
  });

  return {
    hero: heading("extrabold", 30, 36, -0.7),
    title: heading("extrabold", 22, 28, -0.4),
    section: heading("bold", 18, 24, -0.2),
    kicker: text("medium", 13, 18),
    labelCaps: text("semibold", 13, 18, "600"),
    // Numerals are Latin digits in every locale, so Saira draws them all.
    numXL: { ...display("bold"), ...tabularNums, fontSize: 40, lineHeight: 46 },
    num: { ...display("semibold"), ...tabularNums, fontSize: 15, lineHeight: 19 },
    body: text("regular", 15, 21),
    bodyStrong: text("semibold", 15, 21, "600"),
    caption: text("medium", 13, 18),
    ghost: { ...display("bold"), ...tabularNums, fontSize: 40, lineHeight: 46 },
  };
}

/** Locale-aware type ramp for the active language. */
export function useType(): TypeRamp {
  const { locale } = useLanguage();
  return useMemo(() => typeRamp(locale), [locale]);
}
