import { useIsFocused } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FallbackImage } from "@/components/FallbackImage";

import { AppCard } from "@/components/AppCard";
import { ThemedText } from "@/components/ThemedText";
import { i18n } from "@/constants/i18n";
import { RADIUS } from "@/constants/layout";
import type { ThemeTokens } from "@/constants/theme";
import { font } from "@/constants/typography";
import { useGameData } from "@/contexts/gamedata-context";
import { useLanguage } from "@/contexts/language-context";
import { useColors } from "@/hooks/useColors";
import {
  formatDuration,
  selectLiveGachas,
  studentIconUris,
} from "@/services/gamedata";

/** Durations are shown to the minute, so there is nothing to gain from ticking faster. */
const TICK_MS = 30_000;

/**
 * What is actually running on the Global server right now, read straight from
 * SchaleDB's config.
 *
 * This is deliberately independent of the Firestore banner list: Firestore is
 * the curated forward schedule and needs a human to maintain it, while this
 * strip is always correct on its own. When the schedule has not been updated
 * yet, this still shows the truth.
 */
export function LiveNowBanner() {
  const { locale } = useLanguage();
  const t = i18n[locale];
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { config, byId, displayName } = useGameData();
  const isFocused = useIsFocused();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!isFocused) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, [isFocused]);

  const live = selectLiveGachas(config, byId, now);
  if (live.length === 0) return null;

  return (
    <AppCard level={2} padding={16} style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.dot} />
        <ThemedText style={styles.heading}>{t.liveNowHeading}</ThemedText>
      </View>
      {live.map((entry) => (
        <View key={entry.start} style={styles.entry}>
          <View style={styles.icons}>
            {entry.students.map((student) => (
              <FallbackImage
                key={student.Id}
                uris={studentIconUris(student.Id)}
                label={student.Name}
                style={styles.icon}
                resizeMode="cover"
              />
            ))}
          </View>
          <View style={styles.entryBody}>
            <ThemedText style={styles.names} numberOfLines={2}>
              {entry.students.map(displayName).join(" · ")}
            </ThemedText>
            <ThemedText style={styles.timeLeft}>
              {t.liveNowEndsIn.replace(
                "{time}",
                formatDuration(entry.secondsLeft),
              )}
            </ThemedText>
          </View>
        </View>
      ))}
    </AppCard>
  );
}

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    card: { marginBottom: 16 },
    headingRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    dot: {
      width: 7,
      height: 7,
      borderRadius: RADIUS.pill,
      backgroundColor: c.primaryColor,
      marginRight: 8,
    },
    heading: {
      fontSize: 12,
      color: c.primaryColor,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      ...font("semibold"),
    },
    entry: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
    icons: { flexDirection: "row", marginRight: 12 },
    icon: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.sm,
      backgroundColor: c.surfaceBg,
      marginRight: 6,
    },
    entryBody: { flex: 1 },
    names: { fontSize: 14, color: c.textPrimary, ...font("semibold") },
    timeLeft: { fontSize: 12, color: c.textMuted, marginTop: 2, ...font("medium") },
  });
