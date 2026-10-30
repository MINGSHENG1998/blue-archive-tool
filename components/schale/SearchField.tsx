import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { RADIUS } from "@/constants/layout";
import { commonStrings } from "@/constants/strings/common";
import { useStrings } from "@/constants/strings/define";
import { useType } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { Icon } from "./Icon";

/** Search input: a tinted well with a leading magnifier and a clear button. */
export function SearchField({ value, onChangeText, placeholder, style, ...rest }: TextInputProps & {
  value: string; onChangeText: (value: string) => void;
}) {
  const c = useColors();
  const type = useType();
  const s = useStrings(commonStrings);
  return <View style={[styles.wrap, { backgroundColor: c.surfaceBg }]}>
    <Icon name="magnify" size={20} color={c.textMuted} />
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder ?? s.search}
      placeholderTextColor={c.textMuted} selectionColor={c.primaryColor} accessibilityLabel={placeholder ?? s.search}
      autoCorrect={false} autoCapitalize="none" returnKeyType="search" {...rest}
      style={[type.body, styles.input, { color: c.textPrimary }, style]} />
    {value.length ? <Pressable onPress={() => onChangeText("")} style={styles.clear} accessibilityRole="button" accessibilityLabel={s.clear}>
      <Icon name="close-circle" size={18} color={c.textMuted} />
    </Pressable> : null}
  </View>;
}
const styles = StyleSheet.create({
  wrap: { minHeight: 46, flexDirection: "row", alignItems: "center", paddingLeft: 14, borderRadius: RADIUS.control },
  input: { flex: 1, minHeight: 46, paddingHorizontal: 10, paddingVertical: 10 },
  clear: { width: 44, minHeight: 46, alignItems: "center", justifyContent: "center" },
});
