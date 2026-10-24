import { useIsFocused } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { ThemedText } from "@/components/ThemedText";
import { i18n } from "@/constants/i18n";
import type { ThemeTokens } from "@/constants/theme";
import { font, tabularNums } from "@/constants/typography";
import { useLanguage } from "@/contexts/language-context";
import { useColors } from "@/hooks/useColors";
import {
  countdownTo,
  formatCountdown,
  nextCafeReset,
  nextDailyReset,
  nextHeadpatReset,
} from "@/services/gamedata";

/**
 * The three recurring in-game resets, counting down live.
 *
 * Isolated into its own component so the one-second tick re-renders these three
 * rows instead of the whole home screen (which owns entrance animations and a
 * list of pressable cards).
 */
export function ResetTimers() {
  const { locale } = useLanguage();
  const t = i18n[locale];
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const isFocused = useIsFocused();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // No point burning a wakeup a second while the user is on another tab.
    if (!isFocused) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [isFocused]);

  // Targets are recomputed from `now`, so each one rolls over to the following
  // occurrence by itself the moment it fires. No completion callbacks needed.
  const rows = [
    { key: "daily", label: t.resetDaily, target: nextDailyReset(now) },
    { key: "cafe", label: t.resetCafe, target: nextCafeReset(now) },
    { key: "headpat", label: t.resetHeadpat, target: nextHeadpatReset(now) },
  ];

  return (
    <AppCard level={2} padding={16}>
      <ThemedText style={styles.heading}>{t.resetHeading}</ThemedText>
      {rows.map((row) => (
        <View key={row.key} style={styles.row}>
          <ThemedText style={styles.label}>{row.label}</ThemedText>
          <ThemedText style={styles.value}>
            {formatCountdown(countdownTo(row.target, now))}
          </ThemedText>
        </View>
      ))}
    </AppCard>
  );
}

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    heading: {
      fontSize: 13,
      color: c.textSecondary,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 10,
      ...font("semibold"),
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 5,
    },
    label: { fontSize: 13, color: c.textSecondary, ...font("medium") },
    value: {
      fontSize: 17,
      color: c.textPrimary,
      ...tabularNums,
      ...font("bold"),
    },
  });
