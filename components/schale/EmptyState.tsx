import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useType } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { HaloMark } from "./HaloMark";
import { SignalButton } from "./SignalButton";

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode | { label: string; onPress: () => void } }) {
  const c = useColors();
  const type = useType();
  return <View style={styles.wrap}>
    <HaloMark size={40} />
    <Text accessibilityRole="header" style={[type.bodyStrong, styles.center, { color: c.textPrimary }]}>{title}</Text>
    {body ? <Text style={[type.body, styles.center, { color: c.textSecondary, maxWidth: 300 }]}>{body}</Text> : null}
    {action && typeof action === "object" && "label" in action && "onPress" in action ? <SignalButton label={action.label} onPress={action.onPress} variant="ghost" compact style={styles.action} /> : action as ReactNode}
  </View>;
}
const styles = StyleSheet.create({ wrap: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 20, gap: 8 }, center: { textAlign: "center" }, action: { marginTop: 8 } });
