import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ComponentProps } from "react";
import type { StyleProp, TextStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

export type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type Props = {
  name: IconName;
  size?: number;
  /** Defaults to the theme's body ink. */
  color?: string;
  style?: StyleProp<TextStyle>;
};

/**
 * Decorative glyph (MaterialCommunityIcons). Replaces Paper IconButton /
 * List.Icon used as static decoration, which added a ripple and a fake button
 * to the accessibility tree. Hidden from screen readers: the surrounding
 * control carries the label.
 */
export function Icon({ name, size = 20, color, style }: Props) {
  const c = useColors();
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color ?? c.textPrimary}
      style={style}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
