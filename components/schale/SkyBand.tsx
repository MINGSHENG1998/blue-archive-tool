import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  type SharedValue,
} from "react-native-reanimated";

import type { ThemeTokens } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = {
  /** Band height in px (ScreenLayout passes insets.top + 220). */
  height: number;
  /** Scroll offset; drives the 0.5x parallax and the fade-out by 180px. */
  scrollY?: SharedValue<number>;
};

/** Shard positions as fractions of the band (x from the right, y from the top). */
const SHARDS = [
  { right: 0.12, top: 0.22, scale: 1 },
  { right: 0.31, top: 0.4, scale: 0.7 },
  { right: 0.07, top: 0.55, scale: 0.55 },
];

/**
 * The "Blue" layer: a diagonal daylight gradient behind the top of a screen,
 * with slanted light shafts and a few triangle shards, fading into appBg.
 * Every theme renders a different time of day from its own tokens. Purely
 * decorative: no pointer events, hidden from accessibility.
 */
export function SkyBand({ height, scrollY }: Props) {
  const c = useColors();
  const reduced = useReducedMotion();
  const styles = useMemo(() => makeStyles(c, height), [c, height]);

  const motion = useAnimatedStyle(() => {
    const y = scrollY ? scrollY.value : 0;
    // Pull-to-refresh overscroll (y < 0) should not drag the sky down.
    const clamped = Math.max(0, y);
    return {
      opacity: interpolate(clamped, [0, 180], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: reduced ? 0 : -clamped * 0.5 }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.band, motion]}
    >
      <LinearGradient
        colors={[c.skyTop, c.skyMid, c.skyFade]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.shaft, styles.shaftWide]} />
      <View style={[styles.shaft, styles.shaftMid]} />
      <View style={[styles.shaft, styles.shaftThin]} />
      {SHARDS.map((s, i) => (
        <View
          key={i}
          style={[
            styles.shard,
            {
              right: `${s.right * 100}%`,
              top: height * s.top,
              transform: [{ rotate: `${18 + i * 47}deg` }, { scale: s.scale }],
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const makeStyles = (c: ThemeTokens, height: number) =>
  StyleSheet.create({
    band: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height,
      overflow: "hidden",
    },
    shaft: {
      position: "absolute",
      top: -40,
      height: height + 80,
      backgroundColor: c.primaryA08,
      transform: [{ rotate: "24deg" }],
    },
    shaftWide: { right: 70, width: 34 },
    shaftMid: { right: 38, width: 14 },
    shaftThin: { right: 18, width: 6 },
    shard: {
      position: "absolute",
      width: 0,
      height: 0,
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderBottomWidth: 10,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderBottomColor: c.haloSoft,
    },
  });
