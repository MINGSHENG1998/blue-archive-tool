import { useMemo } from "react";
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
  return (
    <View style={[s.tile, style]}>
      <View style={s.head}>
        <Image source={gameIcons[icon]} style={s.icon} resizeMode="contain" />
        <TextInput
          accessibilityLabel={label}
          keyboardType="number-pad"
          inputMode="numeric"
          selectTextOnFocus
          editable={editable}
          value={value ? String(value) : ""}
          placeholder="0"
          placeholderTextColor={c.textMuted}
          onChangeText={(text) => onChange(Number(text.replace(/[^0-9]/g, "")) || 0)}
          style={[type.num, s.input, { color: c.textPrimary }]}
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
