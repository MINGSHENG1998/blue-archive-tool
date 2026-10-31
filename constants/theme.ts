// Portable theme sheet. Structure + token vocabulary mirror the sibling "triplet"
// app (C:\project\triplet\src\lib\theme.ts) so the two codebases share one mental
// model. Word-game-only tokens from the triplet are intentionally omitted.
// Add a theme = supply the 13 ThemeCore fields; buildTheme() fills the rest.
//
// 2.0 "Schale Field Tablet" tokens (sky band, dossier panels, signal yellow,
// halo, tap spark) are all DERIVED here from those 13 fields, never hand-tuned
// per theme. Where a derived color must stay legible (small ink, halo strokes,
// the yellow CTA's edge, success green) buildTheme nudges it until it clears its
// contrast floor, so a new theme cannot ship an unreadable variant. The floors
// are pinned by constants/__tests__/theme-contrast-test.ts.

export type ThemeId =
  | "arona" | "plana" | "baBlue" | "paper" | "cozy" | "calico" | "sea" | "tropical" | "cafe";

export interface ThemeCore {
  isDark: boolean;
  appBg: string;
  surfaceBg: string;
  elevatedBg: string;
  surfaceBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primaryColor: string;
  primaryText: string;
  hazardColor: string;
  hazardBg: string;
  hazardBorder: string;
  /** Optional override for the CTA yellow. No shipped theme needs it. */
  signal?: string;
  /** Optional override for the halo emblem / spark tint. */
  halo?: string;
}

export interface ThemeTokens extends ThemeCore {
  accentSoft: string;
  overlay: string;
  shadow: string;

  /** Primary hue that is safe for SMALL text/icons (AA on appBg + elevatedBg). */
  primaryInk: string;
  /** Primary at 8% — ghost numerals, faint washes. */
  primaryA08: string;
  /** Primary at 16% — the dossier "paper sheet" shadow, indicator fills. */
  primaryA16: string;
  /** Primary at 28% — indicator keylines, pressed fills. */
  primaryA28: string;
  /** Hairline rule / panel edge (textPrimary at 10-14%). */
  hairline: string;
  /** Halo emblem stroke; non-text UI, >= 3:1 on appBg. */
  halo: string;
  haloSoft: string;
  /** Sky band gradient stops (top -> mid -> transparent appBg). */
  skyTop: string;
  skyMid: string;
  skyFade: string;
  /** The in-game yellow. Reserved for THE primary CTA and title underlines. */
  signal: string;
  /** Navy ink that sits on `signal` (>= 7:1). */
  onSignal: string;
  /** Border/lip that separates `signal` from light backgrounds (>= 3:1 on appBg). */
  signalEdge: string;
  /** Gloss highlight across the top of a signal button. */
  signalHi: string;
  /** Text-over-art scrim (appBg at 88%) and its transparent end stop. */
  scrim: string;
  scrimFade: string;
  /** Touch Spark parts. */
  sparkFill: string;
  sparkRing: string;
  sparkShard: string;
  /** Positive state green (>= 3:1 on appBg) and its soft wash. */
  success: string;
  successBg: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  tokens: ThemeTokens;
}

/** The in-game yellow (title underline / primary CTA). */
export const SIGNAL = "#FFE03D";
/** The in-game navy that sits on the yellow. */
export const SIGNAL_INK = "#16365C";
/** The official site's status green, darkened per theme until it reads. */
const SUCCESS_BASE = "#4ADB7A";
const WHITE = "#FFFFFF";
const BLACK = "#000000";

// ── Color math ────────────────────────────────────────────────────────────────

type RGB = [number, number, number];

function parseHex(hex: string): RGB | null {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3 ? raw.split("").map((ch) => ch + ch).join("") : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: RGB): string {
  const ch = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

/**
 * "#rrggbb" -> "rgba(r,g,b,alpha)". Use this (never an rgba literal) for alpha
 * variants in components; lint:colors forbids literals outside constants.
 * Falls back to the input for values that are not 3/6-digit hex.
 */
export function withAlpha(hex: string, alpha: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

/** Linear per-channel blend: t=0 -> a, t=1 -> b. Returns "#rrggbb". */
export function mix(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return a;
  return toHex([
    ca[0] + (cb[0] - ca[0]) * t,
    ca[1] + (cb[1] - ca[1]) * t,
    ca[2] + (cb[2] - ca[2]) * t,
  ]);
}

// Darkens a hex color toward black by `amount` (0..1). Used to tint shadows so
// they carry the surface hue instead of reading as a flat pure-black halo.
function darken(hex: string, amount: number): string {
  return mix(hex, BLACK, amount);
}

/** WCAG relative luminance of a hex color (0..1). */
export function luminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors (1..21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Walks `color` toward `toward` in 4% steps until it clears `min` against every
 * background. Returns the first passing blend (or `toward` itself), so a value
 * that already passes comes back untouched.
 */
function ensureContrast(
  color: string,
  backgrounds: string[],
  min: number,
  toward: string
): string {
  for (let t = 0; t <= 1.0001; t += 0.04) {
    const candidate = t === 0 ? color : mix(color, toward, t);
    if (backgrounds.every((bg) => contrastRatio(candidate, bg) >= min)) {
      return candidate;
    }
  }
  return toward;
}

/**
 * A version of `color` that clears `min` contrast on `bg`, walking toward
 * white on dark backgrounds and toward black on light ones. For tone-colored
 * small text (stamps, badges) drawn on a themed surface.
 */
export function readableOn(color: string, bg: string, min = 4.5): string {
  return ensureContrast(color, [bg], min, luminance(bg) < 0.25 ? WHITE : BLACK);
}

// ── Derivation ────────────────────────────────────────────────────────────────

export function buildTheme(core: ThemeCore): ThemeTokens {
  const { isDark, appBg, elevatedBg, primaryColor: primary, textPrimary } = core;
  // Light themes darken toward their own ink; dark themes lighten toward white.
  const inkward = isDark ? WHITE : textPrimary;
  const surfaces = [appBg, elevatedBg];

  const primaryInk = ensureContrast(
    isDark ? primary : mix(primary, textPrimary, 0.4),
    surfaces,
    4.5,
    inkward
  );

  const halo = ensureContrast(
    core.halo ?? (isDark ? mix(primary, WHITE, 0.35) : mix(primary, textPrimary, 0.25)),
    [appBg],
    3,
    inkward
  );

  const signal = core.signal ?? SIGNAL;
  const signalEdge = ensureContrast(
    isDark ? mix(signal, BLACK, 0.22) : mix(signal, SIGNAL_INK, 0.55),
    [appBg],
    3,
    isDark ? WHITE : SIGNAL_INK
  );

  const success = ensureContrast(SUCCESS_BASE, surfaces, 3, inkward);

  return {
    ...core,
    accentSoft: withAlpha(primary, 0.12),
    overlay: isDark ? withAlpha(BLACK, 0.5) : withAlpha(BLACK, 0.35),
    // Dark themes: shadows barely show, so keep near-black. Light themes: tint
    // the shadow with a deeply darkened surface hue so cards lift warmly instead
    // of casting a hard grey outline.
    shadow: isDark ? BLACK : darken(core.surfaceBg, 0.78),

    primaryInk,
    primaryA08: withAlpha(primary, 0.08),
    primaryA16: withAlpha(primary, 0.16),
    primaryA28: withAlpha(primary, 0.28),
    hairline: withAlpha(textPrimary, isDark ? 0.1 : 0.14),
    halo,
    haloSoft: withAlpha(halo, 0.28),
    // Each theme's sky reads as Kivotos at a different time of day.
    skyTop: mix(appBg, primary, isDark ? 0.3 : 0.22),
    skyMid: mix(appBg, primary, isDark ? 0.12 : 0.08),
    // appBg at alpha 0, NOT the 'transparent' keyword: iOS interpolates a
    // gradient through transparent black and bands grey.
    skyFade: withAlpha(appBg, 0),
    signal,
    onSignal: SIGNAL_INK,
    signalEdge,
    signalHi: withAlpha(mix(signal, WHITE, 0.5), 0.55),
    scrim: withAlpha(appBg, 0.88),
    scrimFade: withAlpha(appBg, 0),
    sparkFill: withAlpha(halo, 0.35),
    sparkRing: isDark ? mix(halo, WHITE, 0.5) : halo,
    // White shards vanish on light themes; use the halo there.
    sparkShard: isDark ? WHITE : halo,
    success,
    successBg: withAlpha(success, isDark ? 0.16 : 0.14),
  };
}

const CORES: Record<ThemeId, ThemeCore> = {
  baBlue: {
    isDark: true,
    appBg: "#0A1628", surfaceBg: "#0F172A", elevatedBg: "#0F2347",
    surfaceBorder: "#243049", textPrimary: "#FFFFFF", textSecondary: "#94A3B8",
    textMuted: "#64748B", primaryColor: "#128AFA", primaryText: "#0F172A",
    hazardColor: "#DC2626", hazardBg: "#2A1620", hazardBorder: "#DC2626",
  },
  // The default. Arona, the Shittim Chest's OS: a clear sky-blue world, white
  // sheets, navy ink, her bright cyan-blue as the accent.
  arona: {
    isDark: false,
    appBg: "#EEF6FC", surfaceBg: "#DEEDF8", elevatedBg: "#FFFFFF",
    surfaceBorder: "#CFE2F1", textPrimary: "#15304F", textSecondary: "#41617F",
    textMuted: "#56718B", primaryColor: "#2A9DF4", primaryText: "#FFFFFF",
    hazardColor: "#D23F3F", hazardBg: "#FDE8E8", hazardBorder: "#D23F3F",
  },
  // Plana, Arona's counterpart: the same tablet after dark. Near-black
  // sheets, cool silver ink, a pale steel-blue accent.
  plana: {
    isDark: true,
    appBg: "#111318", surfaceBg: "#191C23", elevatedBg: "#20242D",
    surfaceBorder: "#2E3340", textPrimary: "#ECEEF3", textSecondary: "#AEB5C3",
    textMuted: "#868E9E", primaryColor: "#A9BCDD", primaryText: "#111318",
    hazardColor: "#E5675F", hazardBg: "#3A2224", hazardBorder: "#E5675F",
  },
  paper: {
    isDark: false,
    appBg: "#f4ead4", surfaceBg: "#ede0c0", elevatedBg: "#faf3df",
    surfaceBorder: "#cdb88a", textPrimary: "#3a2f22", textSecondary: "#6a5a44",
    textMuted: "#9a8a70", primaryColor: "#6f8f6a", primaryText: "#fbf6e6",
    hazardColor: "#c66a55", hazardBg: "#fbe5dd", hazardBorder: "#c66a55",
  },
  cozy: {
    isDark: true,
    appBg: "#1a1814", surfaceBg: "#25221c", elevatedBg: "#322d24",
    surfaceBorder: "#3d382e", textPrimary: "#f0e2b4", textSecondary: "#c8b88a",
    textMuted: "#9e8e6c", primaryColor: "#8a9a5e", primaryText: "#1a1814",
    hazardColor: "#d97964", hazardBg: "#3d2520", hazardBorder: "#d97964",
  },
  calico: {
    isDark: true,
    appBg: "#2a2528", surfaceBg: "#322d30", elevatedBg: "#3a3439",
    surfaceBorder: "#4a434a", textPrimary: "#fff7ea", textSecondary: "#d8c8bd",
    textMuted: "#9a8d88", primaryColor: "#ee9d6e", primaryText: "#2a2528",
    hazardColor: "#e8705a", hazardBg: "#3a2420", hazardBorder: "#e8705a",
  },
  sea: {
    isDark: false,
    appBg: "#eef7fc", surfaceBg: "#dcecf8", elevatedBg: "#fffffd",
    surfaceBorder: "#c2ddef", textPrimary: "#1311a0", textSecondary: "#4744a8",
    textMuted: "#8b93bf", primaryColor: "#006aff", primaryText: "#fffffd",
    hazardColor: "#ff5a6e", hazardBg: "#ffe4e8", hazardBorder: "#ff5a6e",
  },
  tropical: {
    isDark: false,
    appBg: "#eaf5f0", surfaceBg: "#d8ebe3", elevatedBg: "#fbfdfb",
    surfaceBorder: "#c2ddd1", textPrimary: "#0d4a5b", textSecondary: "#3a6b78",
    textMuted: "#8aa39c", primaryColor: "#0a9e90", primaryText: "#fbfdfb",
    hazardColor: "#ff6b5c", hazardBg: "#ffe5e0", hazardBorder: "#ff6b5c",
  },
  cafe: {
    isDark: true,
    appBg: "#211a14", surfaceBg: "#2b2219", elevatedBg: "#342a20",
    surfaceBorder: "#463a2c", textPrimary: "#ecdcc2", textSecondary: "#c3a982",
    textMuted: "#948468", primaryColor: "#b98a5a", primaryText: "#211a14",
    hazardColor: "#d4794f", hazardBg: "#3a251a", hazardBorder: "#d4794f",
  },
};

// English fallback names. Localized names live in constants/strings/themes.ts
// (`themeStrings`); UI should prefer those via useStrings().
const NAMES: Record<ThemeId, string> = {
  arona: "Arona", plana: "Plana", baBlue: "BA Blue", paper: "Paper", cozy: "Cozy",
  calico: "Calico", sea: "Sea Breeze", tropical: "Tropical", cafe: "Café",
};

export const THEMES: Record<ThemeId, Theme> = Object.fromEntries(
  (Object.keys(CORES) as ThemeId[]).map((id) => [
    id,
    { id, name: NAMES[id], tokens: buildTheme(CORES[id]) },
  ])
) as Record<ThemeId, Theme>;

export const THEME_ORDER: ThemeId[] = [
  "arona", "plana", "baBlue", "paper", "cozy", "calico", "sea", "tropical", "cafe",
];

export const DEFAULT_THEME_ID: ThemeId = "arona";
