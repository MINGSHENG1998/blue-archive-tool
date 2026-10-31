import { useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { FallbackImage } from "@/components/FallbackImage";

// SchaleDB portraits are full-body art on a transparent canvas (679 x 1280).
const ART_ASPECT = 679 / 1280;

type Props = {
  /** Portrait first, then any fallbacks (icon art is cropped the same way). */
  uris: readonly (string | null | undefined)[];
  label: string;
  width: number;
  height: number;
  /** Fraction of the art's height shown in the window. Default 0.5 (top of the canvas to the waist). */
  span?: number;
  /** Fraction of the art's height cut off above the window. Default 0: tall hats and halos sit at the very top of the canvas, so any cut clips them. */
  top?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A fixed window onto a full-body portrait: the art is scaled so `span` of
 * its height fills the window and shifted up by `top`, which frames the head
 * and shoulders the same way for every student.
 */
export function PortraitCrop({ uris, label, width, height, span = 0.5, top = 0, style }: Props) {
  const art = useMemo(() => {
    const artHeight = height / span;
    const artWidth = artHeight * ART_ASPECT;
    return {
      position: "absolute" as const,
      width: artWidth,
      height: artHeight,
      top: -artHeight * top,
      left: (width - artWidth) / 2,
    };
  }, [width, height, span, top]);

  return (
    <View style={[styles.window, { width, height }, style]} accessibilityRole="image" accessibilityLabel={label}>
      <FallbackImage uris={uris} label={label} style={art} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  window: { overflow: "hidden" },
});
