import { useEffect, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { FallbackImage } from "@/components/FallbackImage";
import { categoryColors } from "@/constants/categoryColors";
import { RADIUS } from "@/constants/layout";
import { DUR, DUR_REDUCED } from "@/constants/motion";
import type { ThemeTokens } from "@/constants/theme";
import { display, fontFor } from "@/constants/typography";
import type { Locale } from "@/constants/i18n";
import { useLanguage } from "@/contexts/language-context";
import { useColors } from "@/hooks/useColors";
import { PressScale } from "./PressScale";
import { useScreenFocused } from "./useScreenFocused";

type Props = {
  /** SchaleDB id, if the caller wants it echoed for tests/analytics. */
  studentId?: number;
  /** Avatar candidates (studentIconUris / characterImageUris). */
  uris: readonly (string | null | undefined)[];
  name: string;
  message: string;
  /** Right side of the pink strip, e.g. "Student of the Day". */
  header?: string;
  /** Unread count shown as a pill on the strip. */
  unread?: number;
  /** Play the 700ms typing indicator before the bubble appears. Default true. */
  typing?: boolean;
  /** Optional Sensei reply bubble under the student's message. */
  reply?: string;
  /** A trailing row under the conversation (CTA, chips). */
  footer?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const TYPING_MS = 700;

/**
 * A student message rendered as in-game MomoTalk: the pink title strip with
 * an unread pill, a round avatar and a slate chat bubble with a tail. The
 * messenger colors are fixed brand constants, the card itself is themed.
 */
export function MomoTalkCard({
  studentId,
  uris,
  name,
  message,
  header,
  unread,
  typing = true,
  reply,
  footer,
  onPress,
  style,
}: Props) {
  const c = useColors();
  const reduced = useReducedMotion();
  const { locale } = useLanguage();
  const styles = useMemo(() => makeStyles(c, locale), [c, locale]);
  const playIntro = typing && !reduced;
  const [typed, setTyped] = useState(!playIntro);

  useEffect(() => {
    if (!playIntro) {
      setTyped(true);
      return;
    }
    setTyped(false);
    const timer = setTimeout(() => setTyped(true), TYPING_MS);
    return () => clearTimeout(timer);
  }, [playIntro, message]);

  const body = (
    <View style={styles.card} testID={studentId != null ? `momotalk-${studentId}` : undefined}>
      <View style={styles.strip}>
        <Text style={styles.brand}>MomoTalk</Text>
        {unread ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{unread > 99 ? "99+" : unread}</Text>
          </View>
        ) : null}
        <View style={styles.flex} />
        {header ? (
          <Text style={styles.header} numberOfLines={1}>
            {header}
          </Text>
        ) : null}
      </View>

      <View style={styles.thread}>
        <View style={styles.row}>
          <FallbackImage uris={uris} label={name} style={styles.avatar} />
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {typed ? (
              <Animated.View
                entering={FadeIn.duration(reduced ? DUR_REDUCED : DUR.short)}
                style={styles.bubble}
              >
                <View style={styles.tail} />
                <Text style={styles.message}>{message}</Text>
              </Animated.View>
            ) : (
              <View style={[styles.bubble, styles.typingBubble]} testID="momotalk-typing">
                <View style={styles.tail} />
                <TypingDots color={categoryColors.onBadge} />
              </View>
            )}
          </View>
        </View>
        {reply && typed ? (
          <Animated.View
            entering={FadeIn.delay(reduced ? 0 : 240).duration(reduced ? DUR_REDUCED : DUR.short)}
            style={styles.replyBubble}
          >
            <Text style={styles.message}>{reply}</Text>
          </Animated.View>
        ) : null}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </View>
  );

  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <PressScale onPress={onPress} style={style} accessibilityLabel={`${name}: ${message}`}>
      {body}
    </PressScale>
  );
}

function TypingDots({ color }: { color: string }) {
  return (
    <View style={dotStyles.row} accessible={false} importantForAccessibility="no-hide-descendants">
      {[0, 1, 2].map((i) => (
        <Dot key={i} index={i} color={color} />
      ))}
    </View>
  );
}

function Dot({ index, color }: { index: number; color: string }) {
  const o = useSharedValue(1);
  const focused = useScreenFocused();
  const reduced = useReducedMotion();
  useEffect(() => {
    cancelAnimation(o);
    o.value = 1;
    if (focused && !reduced) o.value = withDelay(index * 150, withRepeat(withTiming(0.3, { duration: 450 }), -1, true));
    return () => cancelAnimation(o);
  }, [index, o, focused, reduced]);
  const animated = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[dotStyles.dot, { backgroundColor: color }, animated]} />;
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 4, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

const AVATAR = 40;

const makeStyles = (c: ThemeTokens, locale: Locale) =>
  StyleSheet.create({
    flex: { flex: 1 },
    card: {
      borderRadius: RADIUS.panel,
      overflow: "hidden",
      backgroundColor: c.elevatedBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
    },
    strip: {
      height: 28,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: categoryColors.momoPink,
    },
    // Messenger ink on the pink strip: white would be ~2:1.
    brand: {
      ...display("bold", true),
      fontSize: 12,
      letterSpacing: 0.3,
      color: categoryColors.momoInk,
    },
    pill: {
      minWidth: 18,
      height: 16,
      paddingHorizontal: 5,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: categoryColors.momoInk,
    },
    pillText: {
      ...display("bold"),
      fontSize: 10,
      color: categoryColors.onBadge,
      includeFontPadding: false,
    },
    header: {
      ...fontFor(locale, "semibold"),
      fontSize: 11,
      color: categoryColors.momoInk,
      flexShrink: 1,
    },
    thread: { padding: 12, gap: 8 },
    row: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    avatar: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
      backgroundColor: c.surfaceBg,
    },
    name: {
      ...fontFor(locale, "bold"),
      fontSize: 13,
      color: c.textPrimary,
      marginBottom: 4,
    },
    bubble: {
      alignSelf: "flex-start",
      maxWidth: "92%",
      borderRadius: 10,
      padding: 10,
      backgroundColor: categoryColors.momoBubble,
    },
    typingBubble: { paddingVertical: 8 },
    tail: {
      position: "absolute",
      left: -4,
      top: 12,
      width: 10,
      height: 10,
      backgroundColor: categoryColors.momoBubble,
      transform: [{ rotate: "45deg" }],
    },
    message: {
      ...fontFor(locale, "medium"),
      fontSize: 14,
      lineHeight: 20,
      color: categoryColors.onBadge,
    },
    replyBubble: {
      alignSelf: "flex-end",
      maxWidth: "78%",
      borderRadius: 10,
      padding: 10,
      backgroundColor: categoryColors.momoSensei,
    },
    footer: { marginTop: 4 },
  });
