import {
  forwardRef,
  useImperativeHandle,
  type PropsWithChildren,
  type ReactElement,
} from "react";
import { RefreshControl, StyleSheet } from "react-native";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  noheader?: boolean;
  headerImage?: ReactElement;
  keyboardShouldPersistTaps?:
    | boolean
    | "always"
    | "never"
    | "handled"
    | SharedValue<boolean | "always" | "never" | "handled" | undefined>
    | undefined;
  headerBackgroundColor?: { dark: string; light: string };
  onRefresh?: () => void;
  refreshing?: boolean;
}>;

const ParallaxScrollView = forwardRef(function ParallaxScrollView(
  {
    children,
    noheader = false,
    headerImage,
    keyboardShouldPersistTaps,
    headerBackgroundColor,
    onRefresh,
    refreshing = false,
  }: Props,
  ref
) {
  const colorScheme = useColorScheme() ?? "light";
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);
  const bottom = useBottomTabOverflow();
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  useImperativeHandle(ref, () => ({
    resetScroll: () => {
      scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    },
  }));

  return (
    <ThemedView style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ bottom }}
        contentContainerStyle={{ paddingBottom: bottom }}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps || "always"}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              progressViewOffset={!noheader ? HEADER_HEIGHT : 0}
            />
          ) : undefined
        }
      >
        {!noheader && (
          <Animated.View
            style={[
              styles.header,
              {
                backgroundColor: headerBackgroundColor
                  ? headerBackgroundColor[colorScheme]
                  : { light: "#A1CEDC", dark: "#1D3D47" }[colorScheme],
              },
              headerAnimatedStyle,
            ]}
          >
            {headerImage ?? null}
          </Animated.View>
        )}
        <ThemedView style={styles.content}>{children}</ThemedView>
      </Animated.ScrollView>
    </ThemedView>
  );
});

export default ParallaxScrollView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: "hidden",
  },
});
