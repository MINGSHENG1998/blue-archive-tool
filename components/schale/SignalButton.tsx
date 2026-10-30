import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { RADIUS } from "@/constants/layout";
import { SPRING_PRESS } from "@/constants/motion";
import type { ThemeTokens } from "@/constants/theme";
import { font } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { hapticPress } from "./feedback";
import { HaloSpinner } from "./HaloMark";
import { Icon, type IconName } from "./Icon";

export type SignalVariant = "signal" | "ghost" | "ink";

type Props = {
  label: string;
  onPress: () => void;
  /**
   * 'signal' = the game's yellow. Use it for the ONE primary action on a
   * screen. 'ghost' (tinted) and 'ink' (solid ink) are secondary actions.
   */
  variant?: SignalVariant;
  icon?: IconName;
  disabled?: boolean;
  /** Shows a spinner and ignores presses. */
  loading?: boolean;
  /** 40px tall instead of 52 (hitSlop keeps the 44px target). */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

const PRESSED_SCALE = 0.97;

/** Primary and secondary buttons. Solid shapes, sentence-case labels. */
export function SignalButton({
  label,
  onPress,
  variant = "signal",
  icon,
  disabled = false,
  loading = false,
  compact = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: Props) {
  const c = useColors();
  const reduced = useReducedMotion();
  const inactive = disabled || loading;
  const styles = useMemo(
    () => makeStyles(c, variant, inactive, compact),
    [c, variant, inactive, compact]
  );

  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const press = (down: boolean) => {
    const to = down ? PRESSED_SCALE : 1;
    scale.value = reduced ? to : withSpring(to, SPRING_PRESS);
  };

  const ink = styles.label.color as string;

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      onPressIn={() => {
        if (inactive) return;
        press(true);
        hapticPress();
      }}
      onPressOut={() => press(false)}
      hitSlop={compact ? { top: 4, bottom: 4, left: 4, right: 4 } : 0}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      testID={testID}
      style={style}
    >
      <Animated.View style={[styles.body, animated]}>
        <View style={styles.row}>
          {loading ? (
            <HaloSpinner size={compact ? 18 : 22} on={styles.body.backgroundColor as string} />
          ) : icon ? (
            <Icon name={icon} size={compact ? 18 : 20} color={ink} />
          ) : null}
          <Text numberOfLines={1} style={styles.label}>
            {label}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const makeStyles = (
  c: ThemeTokens,
  variant: SignalVariant,
  inactive: boolean,
  compact: boolean
) => {
  const fill = inactive
    ? c.surfaceBg
    : variant === "signal"
      ? c.signal
      : variant === "ink"
        ? c.textPrimary
        : c.primaryA08;
  const text = inactive
    ? c.textMuted
    : variant === "signal"
      ? c.onSignal
      : variant === "ink"
        ? c.appBg
        : c.primaryInk;

  return StyleSheet.create({
    body: {
      height: compact ? 40 : 52,
      paddingHorizontal: compact ? 16 : 22,
      borderRadius: compact ? RADIUS.control : RADIUS.card,
      backgroundColor: fill,
      justifyContent: "center",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    label: {
      ...font("bold"),
      fontWeight: "700",
      color: text,
      fontSize: compact ? 14 : 16,
      includeFontPadding: false,
    },
  });
};
