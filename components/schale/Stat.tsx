import type { ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useType } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";

export function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  const c = useColors();
  const type = useType();
  return <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
    <Text style={[type.num, { color: tone ?? c.textPrimary }]}>{value}</Text>
    <Text style={[type.caption, { color: c.textMuted }]}>{label}</Text>
  </View>;
}
export function StatRow({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[styles.row, { borderColor: c.hairline }, style]}>{children}</View>;
}
const styles = StyleSheet.create({ row: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth }, stat: { flex: 1, minWidth: 60, gap: 3 } });
