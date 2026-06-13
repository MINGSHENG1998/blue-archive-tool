// Portable theme sheet. Structure + token vocabulary mirror the sibling "triplet"
// app (C:\project\triplet\src\lib\theme.ts) so the two codebases share one mental
// model. Word-game-only tokens from the triplet are intentionally omitted.
// Add a theme = supply the 13 ThemeCore fields; buildTheme() fills the rest.

export type ThemeId =
  | "baBlue" | "paper" | "cozy" | "calico" | "sea" | "tropical" | "cafe";

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
}

export interface ThemeTokens extends ThemeCore {
  accentSoft: string;
  overlay: string;
  shadow: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  tokens: ThemeTokens;
}

// "#rrggbb" -> "rgba(r,g,b,alpha)". Falls back to the input for non-hex values.
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function buildTheme(core: ThemeCore): ThemeTokens {
  return {
    ...core,
    accentSoft: hexToRgba(core.primaryColor, 0.12),
    overlay: core.isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.35)",
    shadow: "#000000",
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

const NAMES: Record<ThemeId, string> = {
  baBlue: "BA Blue", paper: "Paper", cozy: "Cozy", calico: "Calico",
  sea: "Sea Breeze", tropical: "Tropical", cafe: "Café",
};

export const THEMES: Record<ThemeId, Theme> = Object.fromEntries(
  (Object.keys(CORES) as ThemeId[]).map((id) => [
    id,
    { id, name: NAMES[id], tokens: buildTheme(CORES[id]) },
  ])
) as Record<ThemeId, Theme>;

export const THEME_ORDER: ThemeId[] = [
  "baBlue", "paper", "cozy", "calico", "sea", "tropical", "cafe",
];

export const DEFAULT_THEME_ID: ThemeId = "baBlue";
