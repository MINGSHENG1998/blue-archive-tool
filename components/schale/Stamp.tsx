import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { bannerTone, categoryColors, type BannerTone } from "@/constants/categoryColors";
import { readableOn, withAlpha, type ThemeTokens } from "@/constants/theme";
import { font, hasCJK } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useScreenFocused } from "./useScreenFocused";

export type StampTone =
  | BannerTone
  | "live"
  | "primary"
  | "success"
  | "hazard"
  | "muted";

type Size = "sm" | "md" | "lg";

type Props = {
  label: string;
  /** Banner category tones are fixed brand colors; the rest follow the theme. */
  tone?: StampTone;
  /** Raw color override (wins over `tone`). */
  color?: string;
  /** A breathing dot before the label (LIVE). Pauses when the screen is unfocused. */
  pulse?: boolean;
  size?: Size;
  /** Kept for API compatibility; ignored. */
  animate?: boolean;
  /** Surface behind the tag, for the text contrast check. Default elevatedBg. */
  on?: string;
  style?: StyleProp<ViewStyle>;
};

const PULSE_MS = 1100;

const SIZES: Record<Size, { font: number; padH: number; height: number }> = {
  sm: { font: 11, padH: 7, height: 20 },
  md: { font: 12, padH: 9, height: 24 },
  lg: { font: 14, padH: 11, height: 28 },
};

function resolveTone(tone: StampTone, c: ThemeTokens): string {
  switch (tone) {
    case "live":
      return categoryColors.bannerNew;
    case "primary":
      return c.primaryInk;
    case "success":
      return c.success;
    case "hazard":
      return c.hazardColor;
    case "muted":
      return c.textMuted;
    default:
      return bannerTone(tone).tone;
  }
}

/**
 * Status tag (Live, Fes, Rerun, New, D-3, Today): a small tinted pill. The
 * tone tints the fill at low alpha and colors the text, nudged until the text
 * clears 4.5:1 on the surface in every theme.
 */
export function Stamp({
  label,
  tone = "primary",
  color,
  pulse = false,
  size = "md",
  on,
  style,
}: Props) {
  const c = useColors();
  const reduced = useReducedMotion();
  const focused = useScreenFocused();
  const paper = on ?? c.elevatedBg;
  const raw = color ?? resolveTone(tone, c);
  const styles = useMemo(
    () => makeStyles(raw, paper, SIZES[size], hasCJK(label)),
    [raw, paper, size, label]
  );

  const dot = useSharedValue(1);
  const looping = pulse && !reduced && focused;
  useEffect(() => {
    if (looping) {
      dot.value = withRepeat(withTiming(0.25, { duration: PULSE_MS }), -1, true);
    } else {
      cancelAnimation(dot);
      dot.value = 1;
    }
  }, [looping, dot]);
  const dotStyle = useAnimatedStyle(() => ({ opacity: dot.value }));

  return (
    <View style={[styles.pill, style]} accessibilityRole="text">
      {pulse ? <Animated.View style={[styles.dot, dotStyle]} /> : null}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const makeStyles = (
  raw: string,
  paper: string,
  size: (typeof SIZES)[Size],
  cjk: boolean
) => {
  const ink = readableOn(raw, paper, 4.5);
  return StyleSheet.create({
    pill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      height: size.height,
      paddingHorizontal: size.padH,
      borderRadius: size.height / 2,
      backgroundColor: withAlpha(raw, 0.14),
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: ink,
    },
    label: {
      ...font("bold"),
      fontWeight: "700",
      color: ink,
      fontSize: size.font,
      letterSpacing: cjk ? 0 : 0.2,
      includeFontPadding: false,
    },
  });
};
