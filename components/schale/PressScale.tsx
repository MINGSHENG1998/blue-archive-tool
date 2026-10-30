import type { ReactNode } from "react";
import {
  Pressable,
  type AccessibilityRole,
  type AccessibilityState,
  type GestureResponderEvent,
  type Insets,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { PRESS_SCALE, SPRING_PRESS } from "@/constants/motion";
import { hapticPress } from "./feedback";
import { useSpark } from "./SparkProvider";

// One node does both jobs: layout styles and the press scale share a box, so
// percentage widths and flex from the caller behave like a plain View.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  children: ReactNode;
  /** Applied to the scaling container (size, margins, layout). */
  style?: StyleProp<ViewStyle>;
  /** Emit the tap spark on press-in. Default true. */
  spark?: boolean;
  /** Light haptic on press-in. Default true. */
  haptic?: boolean;
  disabled?: boolean;
  /** Pressed scale. Default 0.97. */
  scaleTo?: number;
  hitSlop?: number | Insets;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  testID?: string;
};

/**
 * The shared press feel for tappable surfaces (lobby tiles, portraits, list
 * rows): springs to 0.97 on the UI thread, a light haptic and the game's tap
 * spark. Only wrap things that DO something — a pressable look on a static
 * card is a lie the hand notices.
 */
export function PressScale({
  onPress,
  onLongPress,
  children,
  style,
  spark = true,
  haptic = true,
  disabled = false,
  scaleTo = PRESS_SCALE,
  hitSlop,
  accessibilityRole = "button",
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  testID,
}: Props) {
  const reduced = useReducedMotion();
  const { emit } = useSpark();
  const scale = useSharedValue(1);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[style, animated]}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...accessibilityState }}
      testID={testID}
      onPressIn={(e) => {
        if (!reduced) scale.value = withSpring(scaleTo, SPRING_PRESS);
        if (haptic) hapticPress();
        if (spark) emit(e.nativeEvent.pageX, e.nativeEvent.pageY);
      }}
      onPressOut={() => {
        scale.value = reduced ? 1 : withSpring(1, SPRING_PRESS);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
