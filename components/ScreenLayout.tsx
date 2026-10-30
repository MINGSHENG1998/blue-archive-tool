import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { LAYOUT } from "@/constants/layout";
import type { ThemeTokens } from "@/constants/theme";
import { useType } from "@/constants/typography";

export type ScreenLayoutRef = { resetScroll: () => void };

type Props = {
  children: ReactNode;
  /** Optional page title. */
  title?: string;
  /** One short line under the title. Use for facts, not taglines. */
  subtitle?: string;
  /** Kept for API compatibility; ignored. */
  kicker?: string;
  /** Rendered to the right of the title (a refresh button, a count). */
  headerRight?: ReactNode;
  /** Kept for API compatibility; ignored. */
  sky?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
};

/**
 * Canonical base page wrapper: themed background, standard padding/insets
 * (constants/layout.ts), an optional title row, a scroll view with
 * pull-to-refresh, and an imperative resetScroll() for focus resets. Stack
 * screens render <NavBar/> as their first child instead of a title.
 */
export const ScreenLayout = forwardRef<ScreenLayoutRef, Props>(
  function ScreenLayout(
    {
      children,
      title,
      subtitle,
      headerRight,
      onRefresh,
      refreshing = false,
      keyboardShouldPersistTaps = "handled",
    },
    ref
  ) {
    const c = useColors();
    const reduced = useReducedMotion();
    const type = useType();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => makeStyles(c), [c]);
    const scrollRef = useRef<ScrollView>(null);

    useImperativeHandle(ref, () => ({
      resetScroll: () =>
        scrollRef.current?.scrollTo({ x: 0, y: 0, animated: !reduced }),
    }));

    return (
      <View style={styles.root}>
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
                progressBackgroundColor={c.elevatedBg}
              />
            ) : undefined
          }
        >
          {title ? (
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text
                  style={[type.hero, styles.title]}
                  numberOfLines={2}
                  accessibilityRole="header"
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={[type.body, styles.subtitle]}>{subtitle}</Text>
                ) : null}
              </View>
              {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
            </View>
          ) : null}
          {children}
        </ScrollView>
      </View>
    );
  }
);

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.appBg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 8,
      marginBottom: LAYOUT.titleMarginBottom + 4,
    },
    headerText: { flex: 1 },
    headerRight: {},
    title: { color: c.textPrimary },
    subtitle: { color: c.textSecondary, marginTop: 4 },
  });
