import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import type { ThemeTokens } from "@/constants/theme";
import { useType } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";

type Props = {
  value: number;
  max: number;
  /** Number of slanted cells. Default 10. */
  cells?: number;
  /** Left label, e.g. "Bond EXP". */
  label?: string;
  /** Small caps line under the label, e.g. "RANK 20 → 21". */
  kicker?: string;
  /** Fill color. Default primaryColor. */
  tone?: string;
  /** Show "value / max" on the right. Default true. */
  showValue?: boolean;
  /** Formats the value readout. Default: grouped integer. */
  format?: (n: number) => string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Fill fraction (0..1) of each cell for `value` out of `max`. Whole cells are
 * 1, at most one partial cell, the rest 0. Non-finite input or max <= 0 reads
 * as empty; values past max read as full.
 */
export function gaugeCells(value: number, max: number, cells: number): number[] {
  const n = Math.max(1, Math.floor(cells));
  const frac =
    Number.isFinite(value) && Number.isFinite(max) && max > 0
      ? Math.min(1, Math.max(0, value / max))
      : 0;
  const filled = frac * n;
  return Array.from({ length: n }, (_, i) =>
    Math.min(1, Math.max(0, filled - i))
  );
}

const groupDigits = (n: number) =>
  Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const CELL_STAGGER = 25;

/**
 * Progress as the battle EX-cost bar: a row of slanted cells that fill left to
 * right (with one partial cell), entering on a 25ms stagger. Used for bond
 * EXP, level ranges, spark/charge progress and raid tiers.
 */
export function CostGauge({
  value,
  max,
  cells = 10,
  label,
  kicker,
  tone,
  showValue = true,
  format = groupDigits,
  style,
}: Props) {
  const c = useColors();
  const type = useType();
  const styles = useMemo(() => makeStyles(c, tone ?? c.primaryColor), [c, tone]);
  const fills = useMemo(() => gaugeCells(value, max, cells), [value, max, cells]);
  const safeMax = Number.isFinite(max) && max > 0 ? max : 0;
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;

  return (
    <View
      style={style}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: safeMax, now: Math.min(safeValue, safeMax) }}
    >
      {label || kicker || showValue ? (
        <View style={styles.labels}>
          <View style={styles.labelCol}>
            {label ? (
              <Text style={[type.bodyStrong, styles.label]} numberOfLines={1}>
                {label}
              </Text>
            ) : null}
            {kicker ? (
              <Text style={[type.kicker, styles.kicker]} numberOfLines={1}>
                {kicker}
              </Text>
            ) : null}
          </View>
          {showValue ? (
            <Text style={[type.num, styles.value]}>
              {format(safeValue)}
              <Text style={styles.max}> / {format(safeMax)}</Text>
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={styles.track}>
        {fills.map((f, i) => (
          <Cell key={i} index={i} fill={f} styles={styles} />
        ))}
      </View>
    </View>
  );
}

function Cell({
  index,
  fill,
  styles,
}: {
  index: number;
  fill: number;
  styles: ReturnType<typeof makeStyles>;
}) {
  const reduced = useReducedMotion();
  const enter = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      enter.value = 1;
      return;
    }
    enter.value = withDelay(
      index * CELL_STAGGER,
      withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) })
    );
  }, [reduced, index, enter]);

  const animated = useAnimatedStyle(() => ({
    opacity: 0.4 + 0.6 * enter.value,
    transform: [{ scaleY: 0.5 + 0.5 * enter.value }],
  }));

  return (
    <Animated.View style={[styles.cell, animated]}>
      {fill > 0 ? (
        <View style={[styles.fill, { width: `${fill * 100}%` }]} />
      ) : null}
    </Animated.View>
  );
}

const makeStyles = (c: ThemeTokens, tone: string) =>
  StyleSheet.create({
    labels: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 8,
    },
    labelCol: { flexShrink: 1 },
    label: { color: c.textPrimary },
    kicker: { color: c.textMuted, marginTop: 2 },
    value: { color: c.textPrimary },
    max: { color: c.textMuted },
    track: { flexDirection: "row", gap: 3 },
    cell: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      overflow: "hidden",
      backgroundColor: c.primaryA16,
    },
    fill: { height: "100%", backgroundColor: tone },
  });
