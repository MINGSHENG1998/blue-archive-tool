import { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

type Props = Omit<ImageProps, "source" | "onError"> & {
  /** Tried in order; the next one loads when the current one fails. Empty entries are skipped. */
  uris: readonly (string | null | undefined)[];
  /** Its first letter is drawn on the placeholder once every uri has failed. */
  label?: string;
};

/**
 * A remote image that walks a list of mirrors and ends on a themed
 * placeholder, so a host that starts blocking hotlinks degrades to the next
 * source instead of leaving a blank hole.
 */
export function FallbackImage({ uris, label, style, ...rest }: Props) {
  const c = useColors();
  const sources = uris.filter((u): u is string => !!u);
  const key = sources.join("|");
  const [failed, setFailed] = useState({ key, count: 0 });
  // A new source list (e.g. a recycled list row) starts over from the first uri.
  const count = failed.key === key ? failed.count : 0;

  if (count >= sources.length) {
    const width = StyleSheet.flatten(style)?.width;
    return (
      <View
        testID="fallback-image-placeholder"
        accessibilityLabel={label}
        style={[
          style as StyleProp<ViewStyle>,
          styles.placeholder,
          { backgroundColor: c.elevatedBg },
        ]}
      >
        {label ? (
          <Text
            style={[
              styles.initial,
              {
                color: c.textMuted,
                fontSize: typeof width === "number" ? width * 0.4 : 14,
              },
            ]}
          >
            {label.charAt(0).toUpperCase()}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <Image
      {...rest}
      style={style}
      source={{ uri: sources[count] }}
      onError={() =>
        setFailed((f) => ({ key, count: (f.key === key ? f.count : 0) + 1 }))
      }
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initial: {
    fontWeight: "700",
  },
});
