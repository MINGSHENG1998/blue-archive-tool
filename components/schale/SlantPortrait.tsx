import { useMemo, type ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { FallbackImage } from "@/components/FallbackImage";
import type { ThemeTokens } from "@/constants/theme";
import { font } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { PressScale } from "./PressScale";

type Props = {
  /** Image candidates (studentIconUris / characterImageUris). */
  uris: readonly (string | null | undefined)[];
  /** Student name: accessibility label and placeholder initial. */
  label: string;
  /** Kept for API compatibility; ignored. */
  tone?: string;
  /** Frame size in px (square). Default 64. */
  size?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Fade out (e.g. not owned in Register mode). */
  dimmed?: boolean;
  /** Overlay pinned to the top-right corner, outside the clip (star, stamp). */
  badge?: ReactNode;
  /** Optional caption under the frame. */
  caption?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Student icon in a slightly skewed frame with a thick colored bottom bar,
 * after the game's formation and memorial thumbnails. The frame is skewed and
 * the art counter-skewed so faces stay upright; overlap several with a
 * negative marginLeft (-14) and descending zIndex.
 */
export function SlantPortrait({
  uris,
  label,
  tone,
  size = 64,
  onPress,
  onLongPress,
  dimmed = false,
  badge,
  caption,
  style,
}: Props) {
  const c = useColors();
  const styles = useMemo(
    () => makeStyles(c, size, tone ?? c.primaryColor),
    [c, size, tone]
  );

  const frame = (
    <View style={[styles.wrap, dimmed && styles.dimmed]}>
      <View style={styles.frame}>
        <View style={styles.art}>
          <FallbackImage uris={uris} label={label} style={styles.image} resizeMode="cover" />
        </View>
      </View>
      {caption ? (
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </View>
  );

  // The badge is a sibling of the pressable frame, never a child: it is often
  // a button itself (watch star), and buttons must not nest.
  const badgeView = badge ? <View style={styles.badge}>{badge}</View> : null;

  if (!onPress && !onLongPress) {
    return (
      <View style={style}>
        <View accessible accessibilityRole="image" accessibilityLabel={label}>{frame}</View>
        {badgeView}
      </View>
    );
  }
  return (
    <View style={style}>
      <PressScale
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityLabel={label}
        accessibilityState={dimmed ? { selected: false } : undefined}
        hitSlop={size < 44 ? (44 - size) / 2 : undefined}
      >
        {frame}
      </PressScale>
      {badgeView}
    </View>
  );
}

const makeStyles = (c: ThemeTokens, size: number, _tone: string) => {
  // Square icon art; slightly rounder at small sizes so it reads as an avatar.
  const radius = Math.round(size * (size < 56 ? 0.28 : 0.2));
  return StyleSheet.create({
    wrap: { width: size, alignItems: "center" },
    dimmed: { opacity: 0.38 },
    frame: {
      width: size,
      height: size,
      borderRadius: radius,
      overflow: "hidden",
      backgroundColor: c.surfaceBg,
    },
    art: StyleSheet.absoluteFillObject,
    image: { width: "100%", height: "100%" },
    badge: { position: "absolute", top: -6, right: -6 },
    caption: {
      marginTop: 6,
      maxWidth: size + 8,
      ...font("medium"),
      fontSize: 12,
      color: c.textSecondary,
      textAlign: "center",
    },
  });
};
