import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from "react";
import {
  ScrollView,
  View,
  RefreshControl,
  StyleSheet,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import { LAYOUT } from "@/constants/layout";
import { displayTitle } from "@/constants/typography";

export type ScreenLayoutRef = { resetScroll: () => void };

type Props = {
  children: ReactNode;
  /** Optional page title; renders the standard title + accent + subtitle block. */
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
};

/**
 * Canonical base page wrapper for tab screens. Provides themed background,
 * standard padding/insets (constants/layout.ts), an optional title header, a
 * scroll view with pull-to-refresh, and an imperative resetScroll() for focus
 * resets. Keeps every page visually consistent with the home screen.
 */
export const ScreenLayout = forwardRef<ScreenLayoutRef, Props>(
  function ScreenLayout(
    {
      children,
      title,
      subtitle,
      onRefresh,
      refreshing = false,
      keyboardShouldPersistTaps = "handled",
    },
    ref
  ) {
    const c = useColors();
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);

    useImperativeHandle(ref, () => ({
      resetScroll: () =>
        scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true }),
    }));

    return (
      <View style={[styles.root, { backgroundColor: c.appBg }]}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          contentContainerStyle={{
            paddingHorizontal: LAYOUT.screenPaddingH,
            paddingTop: insets.top + LAYOUT.screenPaddingTop,
            paddingBottom: LAYOUT.screenPaddingBottom,
          }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={c.primaryColor}
                colors={[c.primaryColor]}
              />
            ) : undefined
          }
        >
          {title ? (
            <View style={[styles.header, { marginBottom: LAYOUT.titleMarginBottom }]}>
              <ThemedText type="title" style={styles.title}>
                {title}
              </ThemedText>
              <View style={[styles.accent, { backgroundColor: c.primaryColor }]} />
              {subtitle ? (
                <ThemedText style={[styles.subtitle, { color: c.textSecondary }]}>
                  {subtitle}
                </ThemedText>
              ) : null}
            </View>
          ) : null}
          {children}
        </ScrollView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
  title: {
    ...displayTitle,
  },
  accent: {
    width: 44,
    height: 3,
    borderRadius: 2,
    marginTop: 6,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
  },
});
