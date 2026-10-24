import { Stack } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";

import { AppCard } from "@/components/AppCard";
import { ScreenLayout } from "@/components/ScreenLayout";
import { StackScreenHeader } from "@/components/StackScreenHeader";
import { ThemedText } from "@/components/ThemedText";
import { i18n } from "@/constants/i18n";
import { RADIUS } from "@/constants/layout";
import type { ThemeTokens } from "@/constants/theme";
import { font, tabularNums } from "@/constants/typography";
import { useLanguage } from "@/contexts/language-context";
import { useColors } from "@/hooks/useColors";
import InlineAd from "@/services/ads/InlineAd";
import {
  THREE_STAR_RATE,
  addMisses,
  addPull,
  emptySession,
  formatRate,
  stats,
  undo,
  type GachaSession,
} from "@/services/gacha/session";
import { loadSession, saveSession } from "@/services/gacha/storage";

// Route-level error boundary: a render throw here degrades to an in-app
// error screen for this route only, instead of taking down the whole app.
export { ErrorBoundary } from "expo-router";


export default function GachaTrackerScreen() {
  const { locale } = useLanguage();
  const t = i18n[locale];
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [session, setSession] = useState<GachaSession>(emptySession);
  // Nothing is persisted until the stored session has been read back, so a
  // slow read cannot overwrite a real session with an empty one.
  const restored = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadSession().then((stored) => {
      if (cancelled) return;
      setSession(stored);
      restored.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (restored.current) saveSession(session);
  }, [session]);

  const s = stats(session);
  const luckLabel =
    s.luck === "lucky"
      ? t.gachaLucky
      : s.luck === "unlucky"
        ? t.gachaUnlucky
        : t.gachaEven;
  const luckColor =
    s.luck === "lucky"
      ? c.primaryColor
      : s.luck === "unlucky"
        ? c.hazardColor
        : c.textMuted;

  const confirmReset = () => {
    if (s.pulls === 0) return;
    Alert.alert(t.gachaReset, t.gachaResetConfirm, [
      { text: t.gachaCancel, style: "cancel" },
      {
        text: t.gachaReset,
        style: "destructive",
        onPress: () => setSession(emptySession()),
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenLayout>
        <StackScreenHeader
          title={t.gachaPageTitle}
          subtitle={t.gachaSubtitle}
        />

        <AppCard level={2} style={styles.card}>
          <View style={styles.rateBlock}>
            <ThemedText style={styles.rateValue}>
              {formatRate(s.threeStarRate)}
            </ThemedText>
            <ThemedText style={styles.rateLabel}>{t.gachaRate}</ThemedText>
            <ThemedText style={styles.rateExpected}>
              {t.gachaExpected.replace("{rate}", formatRate(THREE_STAR_RATE))}
            </ThemedText>
            <ThemedText style={[styles.luck, { color: luckColor }]}>
              {luckLabel}
            </ThemedText>
          </View>

          <View style={styles.statRow}>
            {[
              { label: t.gachaPulls, value: s.pulls },
              { label: t.gachaThreeStars, value: s.threeStars },
              { label: t.gachaPickups, value: s.pickups },
              { label: t.gachaSinceLast, value: s.sinceLastThreeStar },
            ].map((stat) => (
              <View key={stat.label} style={styles.stat}>
                <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
                <ThemedText style={styles.statLabel} numberOfLines={2}>
                  {stat.label}
                </ThemedText>
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard level={1} style={styles.card}>
          <View style={styles.buttonGrid}>
            <Button
              mode="contained-tonal"
              onPress={() => setSession((prev) => addPull(prev, "miss"))}
              style={styles.gridButton}
            >
              {t.gachaAddMiss}
            </Button>
            <Button
              mode="contained-tonal"
              onPress={() => setSession((prev) => addMisses(prev, 10))}
              style={styles.gridButton}
            >
              {t.gachaAddTen}
            </Button>
            <Button
              mode="contained"
              buttonColor={c.primaryColor}
              textColor={c.primaryText}
              onPress={() => setSession((prev) => addPull(prev, "threeStar"))}
              style={styles.gridButton}
            >
              {t.gachaAddThreeStar}
            </Button>
            <Button
              mode="contained"
              buttonColor={c.primaryColor}
              textColor={c.primaryText}
              onPress={() => setSession((prev) => addPull(prev, "pickup"))}
              style={styles.gridButton}
            >
              {t.gachaAddPickup}
            </Button>
          </View>

          <View style={styles.actionRow}>
            <Button
              mode="text"
              icon="undo"
              disabled={s.pulls === 0}
              onPress={() => setSession(undo)}
            >
              {t.gachaUndo}
            </Button>
            <Button
              mode="text"
              icon="delete-outline"
              textColor={c.hazardColor}
              disabled={s.pulls === 0}
              onPress={confirmReset}
            >
              {t.gachaReset}
            </Button>
          </View>
        </AppCard>

        <InlineAd />
      </ScreenLayout>
    </>
  );
}

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    card: { marginBottom: 16 },

    rateBlock: { alignItems: "center", paddingBottom: 20 },
    rateValue: {
      fontSize: 46,
      lineHeight: 54,
      color: c.textPrimary,
      ...tabularNums,
      ...font("extrabold"),
    },
    rateLabel: {
      fontSize: 12,
      color: c.textSecondary,
      letterSpacing: 1,
      textTransform: "uppercase",
      ...font("semibold"),
    },
    rateExpected: { fontSize: 12, color: c.textMuted, marginTop: 4 },
    luck: { fontSize: 13, marginTop: 10, ...font("semibold") },

    statRow: {
      flexDirection: "row",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.surfaceBorder,
      paddingTop: 16,
    },
    stat: { flex: 1, alignItems: "center" },
    statValue: {
      fontSize: 20,
      color: c.textPrimary,
      ...tabularNums,
      ...font("bold"),
    },
    statLabel: {
      fontSize: 10,
      color: c.textMuted,
      textAlign: "center",
      marginTop: 2,
    },

    buttonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    gridButton: { flexGrow: 1, flexBasis: "45%", borderRadius: RADIUS.control },
    actionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 12,
    },
  });
