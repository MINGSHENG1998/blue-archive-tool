import { useEffect, type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

type Props = {
  duration: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * Fades its children in once, on mount.
 *
 * Use this instead of reanimated's `entering` / `exiting` / `layout` props.
 * On Android Fabric, reanimated 3 starts a layout animation from a lambda
 * queued on the UI thread; if the view is removed before that lambda runs, it
 * still emits an Update for a view whose Delete is already queued and the app
 * dies with "Unable to find viewState for tag N" (react-native-reanimated
 * issue 7493, fixed only in 4.3.2 / 4.4.2). That crash put
 * 2.0.1-2.0.3 over Play's bad-behavior crash threshold.
 *
 * A shared value + useAnimatedStyle commits through a clone of the live shadow
 * tree instead, so an unmounted view is simply skipped.
 */
export function FadeInView({ duration, delay = 0, style, children }: Props) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
    return () => cancelAnimation(opacity);
  }, [opacity, delay, duration]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[style, fade]}>{children}</Animated.View>;
}
