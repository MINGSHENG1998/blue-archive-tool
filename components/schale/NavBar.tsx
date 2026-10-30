import { useRouter } from "expo-router";
import { Fragment, useMemo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { commonStrings } from "@/constants/strings/common";
import { useStrings } from "@/constants/strings/define";
import type { ThemeTokens } from "@/constants/theme";
import { useType } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { hapticPress } from "./feedback";
import { Icon } from "./Icon";

type Props = {
  title: string;
  subtitle?: string;
  /** Right-side actions. Pass several nodes as an array for a spaced row. */
  right?: ReactNode | ReactNode[];
  /** Override the back action (default: router.back(), or Home when there is no history). */
  onBack?: () => void;
};

/**
 * Header for screens pushed onto the stack: a round back button, the title,
 * and optional right-side actions. Rendered as the first child of ScreenLayout
 * so it scrolls with the content.
 */
export function NavBar({ title, subtitle, right, onBack }: Props) {
  const router = useRouter();
  const c = useColors();
  const type = useType();
  const s = useStrings(commonStrings);
  const styles = useMemo(() => makeStyles(c), [c]);

  const back = () => {
    hapticPress();
    if (onBack) return onBack();
    // A deep link (notification, shared URL) can open a stack screen with no
    // history; fall back to Home instead of a no-op.
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const actions = (Array.isArray(right) ? right : right ? [right] : []).filter(
    Boolean
  );

  return (
    <View style={styles.bar}>
      <Pressable
        onPress={back}
        hitSlop={8}
        style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
        accessibilityRole="button"
        accessibilityLabel={s.back}
        testID="navbar-back"
      >
        <Icon name="chevron-left" size={26} color={c.textPrimary} />
      </Pressable>

      <View style={styles.titleCol}>
        <Text
          style={[type.title, styles.title]}
          numberOfLines={2}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[type.caption, styles.subtitle]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((node, i) => (
            <Fragment key={i}>{node}</Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 4,
      marginBottom: 20,
      minHeight: 44,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginLeft: -6,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.elevatedBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.isDark ? c.hairline : c.surfaceBorder,
    },
    backPressed: { opacity: 0.7 },
    titleCol: { flex: 1 },
    title: { color: c.textPrimary },
    subtitle: { color: c.textSecondary, marginTop: 2 },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 44,
    },
  });
