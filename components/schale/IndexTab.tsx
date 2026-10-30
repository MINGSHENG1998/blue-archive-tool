import { useMemo, type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useType } from "@/constants/typography";
import type { ThemeTokens } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = {
  /** Kept for API compatibility; sections are not numbered. */
  index?: number;
  title: string;
  /** Kept for API compatibility; ignored. */
  meta?: string;
  /** A control on the right ("See all", a toggle, a count). */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Section heading: the title, with an optional control aligned on the right. */
export function IndexTab({ title, right, style }: Props) {
  const c = useColors();
  const type = useType();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={[styles.row, style]} accessibilityRole="header">
      <Text style={[type.section, styles.title]} numberOfLines={1}>
        {title}
      </Text>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      minHeight: 28,
    },
    title: { color: c.textPrimary, flexShrink: 1 },
    right: { flexShrink: 0 },
  });
