/**
 * Blue Archive design system tokens
 * Used across all screens for consistent UI/UX.
 */

export const BAColors = {
  // Primary brand
  primary: "#128AFA",
  primaryLight: "#4AAEFF",
  primaryDim: "rgba(18, 138, 250, 0.18)",
  primaryBorder: "rgba(18, 138, 250, 0.18)",
  primaryGlow: "rgba(18, 138, 250, 0.35)",

  // Backgrounds
  bgDeep: "#0A1628",      // page background
  bgCard: "#0F2347",      // elevated card bg
  bgCardAlt: "rgba(13, 31, 60, 0.85)", // semi-transparent card
  bgInput: "rgba(10, 22, 40, 0.8)",    // text input bg

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.45)",
  textMuted: "#64748B",
  textAccent: "#4AAEFF",

  // Borders
  borderSubtle: "rgba(18, 138, 250, 0.12)",
  borderMid: "rgba(18, 138, 250, 0.25)",
  borderInput: "rgba(18, 138, 250, 0.2)",

  // Status / semantic
  error: "#DC2626",
  errorBg: "rgba(220, 38, 38, 0.1)",
  errorBorder: "rgba(220, 38, 38, 0.3)",
  success: "#3DD68C",
  live: "#EF4444",

  // Banner type chips
  typeNew: "#EF4444",
  typeFes: "#F59E0B",
  typeCollab: "#8B5CF6",
  typeRerun: "#6B7280",
};

export const BARadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const BASpacing = {
  pageH: 20,   // horizontal page padding
  sectionGap: 24,
};

/** Skewed parallelogram section header — consistent across all pages */
export const BASectionTag = {
  skewX: "-12deg" as const,
};
