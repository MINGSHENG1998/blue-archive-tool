import { useEffect } from "react";
import { type DimensionValue } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { useScreenFocused } from "./useScreenFocused";

export function Skeleton({ width = "100%", height, radius = 4 }: { width?: DimensionValue; height: DimensionValue; radius?: number }) {
  const c = useColors();
  const reduced = useReducedMotion();
  const focused = useScreenFocused();
  const opacity = useSharedValue(.55);
  useEffect(() => {
    cancelAnimation(opacity);
    if (focused && !reduced) opacity.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    else opacity.value = .7;
    return () => cancelAnimation(opacity);
  }, [focused, reduced, opacity]);
  const motion = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View accessible={false} importantForAccessibility="no" style={[{ width, height, borderRadius: radius, backgroundColor: c.primaryA16 }, motion]} />;
}
