import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { runOnJS, useAnimatedReaction, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { useType } from "@/constants/typography";
import { useLanguage } from "@/contexts/language-context";
import { useColors } from "@/hooks/useColors";

export function NumberHero({ value, label, unit, tone, countUp = true }: {
  value: number | string; label: string; unit?: string; tone?: string; countUp?: boolean;
}) {
  const c = useColors();
  const type = useType();
  const { locale } = useLanguage();
  const reduced = useReducedMotion();
  const numeric = typeof value === "number" && Number.isFinite(value);
  const [readout, setReadout] = useState(numeric ? value : 0);
  const progress = useSharedValue(numeric ? value : 0);
  useEffect(() => {
    if (numeric) progress.value = countUp && !reduced ? withTiming(value, { duration: 450 }) : value;
  }, [value, numeric, countUp, reduced, progress]);
  useAnimatedReaction(() => Math.round(progress.value), (next, previous) => {
    if (next !== previous) runOnJS(setReadout)(next);
  });
  const text = numeric ? (countUp && !reduced && Number.isInteger(value) ? readout : value).toLocaleString(locale) : String(value);
  return <View style={styles.wrap} accessible accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ""}`}>
    <Text style={[type.kicker, { color: c.textSecondary }]}>{label}</Text>
    <View style={styles.line}>
      <Text adjustsFontSizeToFit minimumFontScale={.55} numberOfLines={1} style={[type.numXL, { color: tone ?? c.primaryInk, flexShrink: 1 }]}>{text}</Text>
      {unit ? <Text style={[type.bodyStrong, { color: c.textSecondary, paddingBottom: 6 }]}>{unit}</Text> : null}
    </View>
  </View>;
}
const styles = StyleSheet.create({ wrap: { gap: 6 }, line: { flexDirection: "row", alignItems: "flex-end", gap: 8 } });
