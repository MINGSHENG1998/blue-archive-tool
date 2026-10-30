// Shared base-page layout metrics. Use via components/ScreenLayout so every
// tab screen has consistent padding/margins (matching the home page).

export const LAYOUT = {
  screenPaddingH: 20,
  screenPaddingTop: 16,
  screenPaddingBottom: 40,
  titleMarginBottom: 16,
  sectionGap: 20,
};

// Corner radii. One system: sheets 16, controls 12, small tags 8, pills
// fully round. `panel`/`chip`/`capsule` are aliases kept for older callers.
export const RADIUS = {
  sm: 10,
  control: 12,
  card: 16,
  lg: 20,
  pill: 999,
  panel: 16,
  chip: 8,
  capsule: 999,
};

// Spacing scale. Prefer these over magic numbers in new code.
export const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// The one slant family. Skew CONTAINERS only and counter-skew their content;
// never skew text, inputs or CJK. Dividers lean the other way.
export const SLANT = {
  container: "-12deg",
  counter: "12deg",
  divider: "12deg",
  portrait: "-8deg",
  portraitCounter: "8deg",
  gauge: "-20deg",
} as const;

/** Cut top-right corner of a dossier panel, in px. */
export const CHAMFER = 14;

/** Offset of the solid "paper sheet" shadow behind a panel, by level. */
export const SHEET_OFFSET = { 1: 0, 2: 3, 3: 5 } as const;

/** Minimum interactive target (use hitSlop to reach it on thin shapes). */
export const HIT_TARGET = 44;
