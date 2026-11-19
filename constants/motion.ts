// Motion vocabulary. Everything runs on reanimated 3 (UI thread). The curve
// EASE_OUT = 1-(1-t)^3 is the game's own tap-wave easing.
//
// Reduced motion: every non-essential animation checks reanimated's
// useReducedMotion() and falls back to a plain fade <= 150ms (or nothing).
// Ambient loops also pause while their screen is unfocused (useIsFocused).
//
// No layout animations (`entering` / `exiting` / `layout` props): on Android
// Fabric they crash reanimated 3 with "Unable to find viewState for tag N".
// Mount fades go through components/schale/FadeInView. ESLint enforces this.

import { Easing, type WithSpringConfig } from "react-native-reanimated";

export const DUR = {
  micro: 120,
  short: 220,
  medium: 360,
  long: 600,
} as const;

/** Fade length allowed when reduced motion is on. */
export const DUR_REDUCED = 150;

export const EASE_OUT = Easing.out(Easing.cubic);

/** Press-in scale / button lip. */
export const SPRING_PRESS: WithSpringConfig = { damping: 18, stiffness: 320 };
/** Sliding indicators (tab highlight, segmented pill). */
export const SPRING_SLIDE: WithSpringConfig = { damping: 18, stiffness: 220 };
/** Rubber-stamp slam: underdamped so it lands with a little bounce. */
export const SPRING_STAMP: WithSpringConfig = { damping: 9, stiffness: 260, mass: 0.8 };

/** Delay between staggered siblings, ms. */
export const STAGGER = 40;
/** Stagger stops growing after this many items so long lists don't lag in. */
export const STAGGER_CAP = 6;

/** Scale a pressed surface springs to. */
export const PRESS_SCALE = 0.97;
