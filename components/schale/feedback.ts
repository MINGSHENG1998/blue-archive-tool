// Haptics for the Schale components. Fire-and-forget: a device without a
// vibrator (or web) must never surface a rejected promise, and nothing waits
// on the buzz before acting on the press.

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const enabled = Platform.OS === "ios" || Platform.OS === "android";

/** Light impact for presses (buttons, tiles, tab bar). */
export function hapticPress(): void {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Selection tick for value changes (segments, filters, toggles). */
export function hapticSelect(): void {
  if (!enabled) return;
  Haptics.selectionAsync().catch(() => {});
}
