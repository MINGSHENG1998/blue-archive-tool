import { StyleSheet, Text, View } from "react-native";
import { RADIUS } from "@/constants/layout";
import { useType } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { Icon, type IconName } from "./Icon";
import { PressScale } from "./PressScale";

/** Filter chip. Selected chips invert to solid ink; `tone` colors the selected fill. */
export function FilterPill({ label, selected = false, onPress, tone, icon, disabled = false, accessibilityLabel }: {
  label: string; selected?: boolean; onPress: () => void; tone?: string; icon?: IconName; disabled?: boolean; accessibilityLabel?: string;
}) {
  const c = useColors();
  const type = useType();
  const fill = selected ? tone ?? c.textPrimary : c.elevatedBg;
  const ink = selected ? (tone ? c.primaryText : c.appBg) : c.textSecondary;
  return <PressScale onPress={onPress} disabled={disabled} spark={false} accessibilityLabel={accessibilityLabel ?? label}
    accessibilityState={{ selected }} style={styles.target}>
    <View style={[styles.chip, {
      backgroundColor: fill,
      borderColor: selected ? fill : c.isDark ? c.hairline : c.surfaceBorder,
      opacity: disabled ? .5 : 1,
    }]}>
      {icon ? <Icon name={icon} size={16} color={ink} /> : null}
      <Text style={[type.labelCaps, { color: ink }]}>{label}</Text>
    </View>
  </PressScale>;
}
const styles = StyleSheet.create({
  target: { minHeight: 44, justifyContent: "center" },
  chip: {
    minHeight: 34, paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.pill,
    flexDirection: "row", alignItems: "center", gap: 6,
  },
});
