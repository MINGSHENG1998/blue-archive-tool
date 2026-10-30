import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated";
import { RADIUS } from "@/constants/layout";
import { SPRING_SLIDE } from "@/constants/motion";
import { useType } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { hapticSelect } from "./feedback";
import { Icon, type IconName } from "./Icon";

const INSET = 3;

export type SegmentOption<T extends string = string> = { value: T; label: string; icon?: IconName; disabled?: boolean };

/** Segmented control: a tinted track with a white thumb that slides to the selection. */
export function SlantSegmented<T extends string>({ options, value, onChange, style }: {
  options: readonly SegmentOption<T>[]; value: T; onChange: (value: T) => void; style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const type = useType();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = options.findIndex(option => option.value === value);
  const cell = options.length ? width / options.length : 0;
  const x = useSharedValue(0);
  useEffect(() => {
    const next = Math.max(0, index) * cell;
    x.value = reduced ? next : withSpring(next, SPRING_SLIDE);
  }, [index, cell, reduced, x]);
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return <View style={[styles.track, { backgroundColor: c.surfaceBg }, style]}
    onLayout={event => setWidth(event.nativeEvent.layout.width - INSET * 2)} accessibilityRole="tablist">
    {index >= 0 && cell > 0 ? <Animated.View pointerEvents="none" style={[styles.thumb, {
      width: cell, backgroundColor: c.elevatedBg, borderColor: c.isDark ? c.hairline : c.surfaceBorder,
    }, thumb]} /> : null}
    {options.map(option => {
      const selected = option.value === value;
      const color = option.disabled ? c.textMuted : selected ? c.textPrimary : c.textSecondary;
      return <Pressable key={option.value} style={styles.option} disabled={option.disabled} accessibilityRole="tab"
        accessibilityState={{ selected, disabled: option.disabled }} accessibilityLabel={option.label}
        onPress={() => { if (!selected) { hapticSelect(); onChange(option.value); } }}>
        {option.icon ? <Icon name={option.icon} size={18} color={color} /> : null}
        <Text numberOfLines={1} style={[type.labelCaps, { color, textAlign: "center", flexShrink: 1 }]}>{option.label}</Text>
      </Pressable>;
    })}
  </View>;
}
const styles = StyleSheet.create({
  track: { padding: INSET, borderRadius: RADIUS.control, flexDirection: "row", position: "relative" },
  thumb: { position: "absolute", top: INSET, bottom: INSET, left: INSET, borderRadius: RADIUS.control - INSET, borderWidth: StyleSheet.hairlineWidth },
  option: { flex: 1, minHeight: 40, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
});
