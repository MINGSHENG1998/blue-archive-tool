import { StyleSheet, Text, View } from "react-native";
import { useType } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { Icon, type IconName } from "./Icon";
import { PressScale } from "./PressScale";

export function Capsule({ icon, value, label, onPress }: { icon: IconName; value: string | number; label?: string; onPress?: () => void }) {
  const c = useColors();
  const type = useType();
  const content = <><Icon name={icon} size={18} color={c.primaryInk} /><View style={styles.text}>
    {label ? <Text style={[type.caption, { color: c.textMuted }]}>{label}</Text> : null}
    <Text style={[type.num, { color: c.textPrimary }]}>{value}</Text>
  </View>{onPress ? <Icon name="plus" size={16} color={c.primaryInk} /> : null}</>;
  const style = [styles.wrap, { backgroundColor: c.elevatedBg, borderColor: c.hairline }];
  return onPress ? <PressScale style={style} onPress={onPress} accessibilityLabel={`${label ?? ""} ${value}`}>{content}</PressScale> : <View style={style}>{content}</View>;
}
const styles = StyleSheet.create({ wrap: { minHeight: 44, borderRadius: 15, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 }, text: { gap: 1 } });
