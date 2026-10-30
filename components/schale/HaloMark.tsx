import { useEffect, useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import type { ThemeTokens } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { useScreenFocused } from "./useScreenFocused";

type Props = {
  /** Outer box in px. Default 48. */
  size?: number;
  /** Surface the mark sits on; paints the slash-cut gap. Default appBg. */
  on?: string;
  /** Orbit the ticks (ambient). Default true. Ignored with reduced motion. */
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
};

const ORBIT_MS = 8000;
const SPIN_MS = 1200;

/**
 * The app emblem: two tilted elliptical rings with a slash-cut gap (the logo's
 * hollow cut) and four ticks orbiting the outer ring. Pure geometry — it
 * evokes a student halo without using any official halo or logo art. Used in
 * the sky band, empty states and (as HaloSpinner) for loading.
 */
export function HaloMark(props: Props) {
  return <Halo {...props} period={ORBIT_MS} pulse={false} />;
}

/** Loading indicator: the same mark, spinning fast with a breathing inner ring. */
export function HaloSpinner({
  size = 28,
  accessibilityLabel,
  ...rest
}: Omit<Props, "animate"> & { accessibilityLabel?: string }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
    >
      <Halo {...rest} size={size} animate period={SPIN_MS} pulse />
    </View>
  );
}

function Halo({
  size = 48,
  on,
  animate = true,
  style,
  period,
  pulse,
}: Props & { period: number; pulse: boolean }) {
  const c = useColors();
  const reduced = useReducedMotion();
  const focused = useScreenFocused();
  const styles = useMemo(() => makeStyles(c, size, on), [c, size, on]);

  const turn = useSharedValue(0);
  const breath = useSharedValue(1);
  const running = animate && !reduced && focused;

  useEffect(() => {
    if (!running) {
      cancelAnimation(turn);
      cancelAnimation(breath);
      return;
    }
    turn.value = 0;
    turn.value = withRepeat(
      withTiming(360, { duration: period, easing: Easing.linear }),
      -1
    );
    if (pulse) {
      breath.value = withRepeat(withTiming(0.4, { duration: 600 }), -1, true);
    }
    return () => {
      cancelAnimation(turn);
      cancelAnimation(breath);
    };
  }, [running, period, pulse, turn, breath]);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value}deg` }],
  }));
  const innerStyle = useAnimatedStyle(() => ({ opacity: breath.value }));

  return (
    <View
      style={[styles.box, style]}
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[styles.ringB, innerStyle]} />
      <View style={styles.ringA}>
        {/* Ticks live inside the squashed ring, so a plain rotation makes
            them travel an ellipse and foreshorten like a halo in perspective. */}
        <Animated.View style={[StyleSheet.absoluteFill, orbitStyle]}>
          {[0, 90, 180, 270].map((deg) => (
            <View
              key={deg}
              style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${deg}deg` }] }]}
            >
              <View style={styles.tick} />
            </View>
          ))}
        </Animated.View>
      </View>
      <View style={styles.gap} />
    </View>
  );
}

const TILT = "-14deg";
const SQUASH = 0.34;

const makeStyles = (c: ThemeTokens, size: number, on?: string) => {
  const stroke = Math.max(1.5, size / 24);
  const inner = size * 0.72;
  const tickW = Math.max(2.5, size / 14);
  const tickH = Math.max(5, size / 5);
  const gapW = Math.max(3, size * 0.12);
  const gapH = Math.max(6, size * 0.24);
  return StyleSheet.create({
    box: {
      width: size,
      height: size,
      alignItems: "center",
      justifyContent: "center",
    },
    ringA: {
      position: "absolute",
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: stroke,
      borderColor: c.halo,
      transform: [{ rotate: TILT }, { scaleY: SQUASH }],
    },
    ringB: {
      position: "absolute",
      width: inner,
      height: inner,
      borderRadius: inner / 2,
      borderWidth: Math.max(1, stroke / 2),
      borderColor: c.haloSoft,
      transform: [{ rotate: TILT }, { scaleY: SQUASH + 0.04 }],
    },
    tick: {
      position: "absolute",
      left: size / 2 - stroke - tickW / 2,
      // Ticks sit on the stroke's centre line (children start inside the border).
      top: -stroke / 2 - tickH / 2,
      width: tickW,
      height: tickH,
      borderRadius: tickW / 2,
      backgroundColor: c.halo,
    },
    // Upper-right point on the tilted outer ellipse, where the slash cuts it.
    gap: {
      position: "absolute",
      left: size * 0.707 - gapW / 2,
      top: size * 0.297 - gapH / 2,
      width: gapW,
      height: gapH,
      backgroundColor: on ?? c.appBg,
      transform: [{ rotate: "35deg" }],
    },
  });
};
