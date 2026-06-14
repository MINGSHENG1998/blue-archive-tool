import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  PanResponder,
  type LayoutChangeEvent,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { RADIUS } from "@/constants/layout";
import type { ThemeTokens } from "@/constants/theme";

type Props = {
  label?: string;
  min: number;
  max: number;
  step?: number;
  low: number;
  high: number;
  /** Labels under each value (e.g. "Current" / "Target"). */
  lowLabel?: string;
  highLabel?: string;
  onChange: (low: number, high: number) => void;
};

const THUMB = 26;

/**
 * Dual-thumb range selector. The slider gives a fast, visual feel for the
 * span; the −/+ steppers next to each value give exact control (important for
 * wide ranges like character level 1–90). Thumbs clamp so low never exceeds
 * high. PanResponder-based (no native dependency), fully theme-driven.
 */
export function RangeSelector({
  label,
  min,
  max,
  step = 1,
  low,
  high,
  lowLabel,
  highLabel,
  onChange,
}: Props) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [trackWidth, setTrackWidth] = useState(0);
  // Latest values in a ref so PanResponder closures read fresh state.
  const valsRef = useRef({ low, high });
  valsRef.current = { low, high };
  const widthRef = useRef(0);
  widthRef.current = trackWidth;

  const span = Math.max(1, max - min);
  const usable = Math.max(1, trackWidth - THUMB);
  const toX = (v: number) => ((v - min) / span) * usable;
  const clampStep = (v: number) =>
    Math.min(max, Math.max(min, Math.round(v / step) * step));

  const onTrackLayout = (e: LayoutChangeEvent) =>
    setTrackWidth(e.nativeEvent.layout.width);

  const makeResponder = (which: "low" | "high") =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, gesture) => {
        const w = widthRef.current;
        if (w <= 0) return;
        const u = Math.max(1, w - THUMB);
        const ratio = Math.min(1, Math.max(0, (gesture.moveX - THUMB / 2) / u));
        const raw = clampStep(min + ratio * span);
        const cur = valsRef.current;
        if (which === "low") {
          const next = Math.min(raw, cur.high);
          if (next !== cur.low) onChange(next, cur.high);
        } else {
          const next = Math.max(raw, cur.low);
          if (next !== cur.high) onChange(cur.low, next);
        }
      },
    });

  const lowResponder = useMemo(() => makeResponder("low"), []);
  const highResponder = useMemo(() => makeResponder("high"), []);

  const stepLow = (delta: number) =>
    onChange(Math.min(clampStep(low + delta), high), high);
  const stepHigh = (delta: number) =>
    onChange(low, Math.max(clampStep(high + delta), low));

  const lowX = toX(low);
  const highX = toX(high);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.valueRow}>
        <ValueStepper
          styles={styles}
          caption={lowLabel}
          value={low}
          onDec={() => stepLow(-step)}
          onInc={() => stepLow(step)}
          decDisabled={low <= min}
          incDisabled={low >= high}
        />
        <View style={styles.rangeArrow}>
          <Text style={styles.rangeArrowText}>→</Text>
        </View>
        <ValueStepper
          styles={styles}
          caption={highLabel}
          value={high}
          onDec={() => stepHigh(-step)}
          onInc={() => stepHigh(step)}
          decDisabled={high <= low}
          incDisabled={high >= max}
        />
      </View>

      <View style={styles.track} onLayout={onTrackLayout}>
        <View style={styles.railBg} />
        <View
          style={[
            styles.railFill,
            { left: lowX + THUMB / 2, width: Math.max(0, highX - lowX) },
          ]}
        />
        <View
          style={[styles.thumb, { left: lowX }]}
          {...lowResponder.panHandlers}
        />
        <View
          style={[styles.thumb, { left: highX }]}
          {...highResponder.panHandlers}
        />
      </View>
    </View>
  );
}

function ValueStepper({
  styles,
  caption,
  value,
  onDec,
  onInc,
  decDisabled,
  incDisabled,
}: any) {
  return (
    <View style={styles.stepper}>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      <View style={styles.stepperRow}>
        <Pressable
          onPress={onDec}
          disabled={decDisabled}
          hitSlop={8}
          style={[styles.stepBtn, decDisabled && styles.stepBtnDisabled]}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable
          onPress={onInc}
          disabled={incDisabled}
          hitSlop={8}
          style={[styles.stepBtn, incDisabled && styles.stepBtnDisabled]}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    wrap: { gap: 12 },
    label: { color: c.textPrimary, fontSize: 14, fontWeight: "600" },
    valueRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    stepper: { flex: 1, alignItems: "center", gap: 4 },
    caption: { color: c.textMuted, fontSize: 12 },
    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.surfaceBg,
      borderRadius: RADIUS.control,
      paddingHorizontal: 6,
      paddingVertical: 6,
      alignSelf: "stretch",
    },
    stepBtn: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.sm,
      backgroundColor: c.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    stepBtnDisabled: { opacity: 0.4 },
    stepBtnText: { color: c.primaryColor, fontSize: 20, fontWeight: "700" },
    value: { color: c.textPrimary, fontSize: 18, fontWeight: "700" },
    rangeArrow: { paddingTop: 18 },
    rangeArrowText: { color: c.textMuted, fontSize: 16 },
    track: { height: THUMB, justifyContent: "center" },
    railBg: {
      position: "absolute",
      left: THUMB / 2,
      right: THUMB / 2,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.surfaceBorder,
    },
    railFill: {
      position: "absolute",
      height: 6,
      borderRadius: 3,
      backgroundColor: c.primaryColor,
    },
    thumb: {
      position: "absolute",
      width: THUMB,
      height: THUMB,
      borderRadius: THUMB / 2,
      backgroundColor: c.primaryColor,
      borderWidth: 3,
      borderColor: c.elevatedBg,
    },
  });
