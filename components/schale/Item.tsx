import { useMemo, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { gameIcons, type GameIconName } from "@/constants/gameIcons";
import { RADIUS } from "@/constants/layout";
import type { ThemeTokens } from "@/constants/theme";
import { useType } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";

/** Saira's tabular digits are ~0.6em wide; a little slack covers the caret. */
const DIGIT_EM = 0.62;

/**
 * Largest font size (max → min) at which `text` fits `width`. A TextInput
 * cannot adjustsFontSizeToFit, and three tiles share a phone-width row, so a
 * 5-digit Pyroxene balance at the full size would scroll out of view.
 */
export function fitNumberFont(width: number, text: string, max = 20, min = 12) {
  if (!(width > 0)) return max;
  const fit = Math.floor(width / (Math.max(text.length, 1) * DIGIT_EM));
  return Math.max(min, Math.min(max, fit));
}

const grouped = (n: number) =>
  Number.isFinite(n) ? Math.round(n).toLocaleString() : "0";

/**
 * An item and its count, read the way the game shows it: the icon, then the
 * number. `label` is for screen readers and an optional caption; the icon
 * carries the meaning visually.
 */
export function ItemAmount({
  icon,
  value,
  label,
  caption = false,
  size = 28,
  tone,
  style,
}: {
  icon: GameIconName;
  value: number | string;
  label: string;
  /** Show the label as a small caption under the number. */
  caption?: boolean;
  size?: number;
  /** Number color. Default textPrimary. */
  tone?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const type = useType();
  const shown = typeof value === "number" ? grouped(value) : value;
  return (
    <View
      style={[styles.amount, style]}
      accessible
      accessibilityLabel={`${label} ${shown}`}
    >
      <Image source={gameIcons[icon]} style={{ width: size, height: size }} resizeMode="contain" />
      <View>
        <Text style={[type.num, { color: tone ?? c.textPrimary, fontSize: Math.max(15, size * 0.6) }]}>
          {shown}
        </Text>
        {caption ? (
          <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * A numeric field for an item the player owns: the icon, a short label, and
 * a large tabular input. Non-digits are stripped; empty reads as 0.
 */
export function ItemInput({
  icon,
  label,
  value,
  onChange,
  editable = true,
  style,
}: {
  icon: GameIconName;
  label: string;
  value: number;
  onChange: (next: number) => void;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const type = useType();
  const s = useMemo(() => makeStyles(c), [c]);
  const [inputWidth, setInputWidth] = useState(0);
  const fontSize = fitNumberFont(inputWidth, value ? String(value) : "0");
  return (
    <View style={[s.tile, style]}>
      <View style={s.head}>
        <Image source={gameIcons[icon]} style={s.icon} resizeMode="contain" />
        <TextInput
          onLayout={(e) => setInputWidth(e.nativeEvent.layout.width)}
          accessibilityLabel={label}
          keyboardType="number-pad"
          inputMode="numeric"
          selectTextOnFocus
          editable={editable}
          value={value ? String(value) : ""}
          placeholder="0"
          placeholderTextColor={c.textMuted}
          onChangeText={(text) => onChange(Number(text.replace(/[^0-9]/g, "")) || 0)}
          style={[type.num, s.input, { color: c.textPrimary, fontSize, lineHeight: Math.round(fontSize * 1.3) }]}
        />
      </View>
      <Text
        style={[type.caption, { color: c.textSecondary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: { flexDirection: "row", alignItems: "center", gap: 8 },
});

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    tile: {
      flex: 1,
      minWidth: 96,
      paddingHorizontal: 10,
      paddingVertical: 10,
      gap: 4,
      borderRadius: RADIUS.control,
      backgroundColor: c.surfaceBg,
    },
    head: { flexDirection: "row", alignItems: "center", gap: 6 },
    icon: { width: 28, height: 28 },
    input: {
      flex: 1,
      minWidth: 0,
      fontSize: 20,
      lineHeight: 26,
      minHeight: 36,
      paddingVertical: 0,
    },
  });
