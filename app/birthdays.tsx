import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FallbackImage } from "@/components/FallbackImage";
import { Searchbar } from "react-native-paper";
import { Stack } from "expo-router";

import { AppCard } from "@/components/AppCard";
import { Collapsible } from "@/components/Collapsible";
import { ScreenLayout } from "@/components/ScreenLayout";
import { StackScreenHeader } from "@/components/StackScreenHeader";
import { ThemedText } from "@/components/ThemedText";
import { i18n } from "@/constants/i18n";
import { RADIUS } from "@/constants/layout";
import type { ThemeTokens } from "@/constants/theme";
import { font, tabularNums } from "@/constants/typography";
import { useGameData } from "@/contexts/gamedata-context";
import { useLanguage } from "@/contexts/language-context";
import { useColors } from "@/hooks/useColors";
import InlineAd from "@/services/ads/InlineAd";
import {
  birthdaysByMonth,
  studentIconUris,
  upcomingBirthdays,
  type GameStudent,
  type StudentBirthday,
} from "@/services/gamedata";

// Route-level error boundary: a render throw here degrades to an in-app
// error screen for this route only, instead of taking down the whole app.
export { ErrorBoundary } from "expo-router";


const UPCOMING_COUNT = 6;

/** One student row: portrait, localized name, their day, optional badge. */
function StudentRow({
  entry,
  trailing,
}: {
  entry: StudentBirthday;
  trailing?: string;
}) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { displayName } = useGameData();

  return (
    <View style={styles.row}>
      <FallbackImage
        uris={studentIconUris(entry.student.Id)}
        label={displayName(entry.student)}
        style={styles.avatar}
        resizeMode="cover"
      />
      <View style={styles.rowBody}>
        <ThemedText style={styles.rowName} numberOfLines={1}>
          {displayName(entry.student)}
        </ThemedText>
        <ThemedText style={styles.rowDate}>
          {entry.birthday.month}/{entry.birthday.day}
        </ThemedText>
      </View>
      {trailing ? (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{trailing}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

export default function BirthdaysScreen() {
  const { locale } = useLanguage();
  const t = i18n[locale];
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { students, displayName } = useGameData();
  const [query, setQuery] = useState("");

  // Deliberately not memoized on `students` alone: the day can turn over while
  // the screen is mounted, and a stale "Today" list is worse than re-sorting a
  // 272-item array on render.
  const today = new Date();
  const ranked = upcomingBirthdays(students, today);
  const todays = ranked.filter((entry) => entry.daysUntil === 0);
  const upcoming = ranked
    .filter((entry) => entry.daysUntil > 0)
    .slice(0, UPCOMING_COUNT);
  const months = useMemo(() => birthdaysByMonth(students), [students]);

  const trimmed = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!trimmed) return null;
    const hit = (student: GameStudent) =>
      student.Name.toLowerCase().includes(trimmed) ||
      displayName(student).toLowerCase().includes(trimmed);
    return ranked.filter((entry) => hit(entry.student));
  }, [trimmed, ranked, displayName]);

  const relativeLabel = (daysUntil: number) => {
    if (daysUntil === 0) return t.birthdayToday;
    if (daysUntil === 1) return t.birthdayTomorrow;
    return t.birthdayInDays.replace("{days}", String(daysUntil));
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenLayout>
        <StackScreenHeader
          title={t.birthdayPageTitle}
          subtitle={t.birthdaySubtitle}
        />

        <AppCard level={2} style={styles.card}>
          <ThemedText style={styles.sectionTitle}>
            {t.birthdayTodayHeading}
          </ThemedText>
          {todays.length === 0 ? (
            <ThemedText style={styles.empty}>{t.birthdayTodayEmpty}</ThemedText>
          ) : (
            todays.map((entry) => (
              <StudentRow
                key={entry.student.Id}
                entry={entry}
                trailing={t.birthdayToday}
              />
            ))
          )}
        </AppCard>

        <AppCard level={1} style={styles.card}>
          <ThemedText style={styles.sectionTitle}>
            {t.birthdayUpcomingHeading}
          </ThemedText>
          {upcoming.map((entry) => (
            <StudentRow
              key={entry.student.Id}
              entry={entry}
              trailing={relativeLabel(entry.daysUntil)}
            />
          ))}
        </AppCard>

        <InlineAd />

        <Searchbar
          placeholder={t.birthdaySearchPlaceholder}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          inputStyle={styles.searchInput}
        />

        {matches ? (
          <AppCard level={1} style={styles.card}>
            {matches.length === 0 ? (
              <ThemedText style={styles.empty}>{t.birthdayNoResults}</ThemedText>
            ) : (
              matches.map((entry) => (
                <StudentRow
                  key={entry.student.Id}
                  entry={entry}
                  trailing={relativeLabel(entry.daysUntil)}
                />
              ))
            )}
          </AppCard>
        ) : (
          <AppCard level={1} style={styles.card}>
            <ThemedText style={styles.sectionTitle}>
              {t.birthdayCalendarHeading}
            </ThemedText>
            {Object.entries(months).map(([month, entries]) => (
              <View key={month} style={styles.month}>
                <Collapsible
                  title={
                    t.monthNames[Number(month) - 1] + " (" + entries.length + ")"
                  }
                  isDefaultOpen={Number(month) === today.getMonth() + 1}
                >
                  {entries.map((entry) => (
                    <StudentRow key={entry.student.Id} entry={entry} />
                  ))}
                </Collapsible>
              </View>
            ))}
          </AppCard>
        )}
      </ScreenLayout>
    </>
  );
}

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    card: { marginBottom: 16 },
    sectionTitle: {
      fontSize: 15,
      marginBottom: 12,
      color: c.textPrimary,
      ...font("bold"),
    },
    empty: { fontSize: 13, color: c.textMuted },

    row: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.sm,
      backgroundColor: c.surfaceBg,
      marginRight: 12,
    },
    rowBody: { flex: 1 },
    rowName: { fontSize: 14, color: c.textPrimary, ...font("semibold") },
    rowDate: { fontSize: 12, color: c.textMuted, ...tabularNums },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.pill,
      backgroundColor: c.accentSoft,
    },
    badgeText: { fontSize: 11, color: c.primaryColor, ...font("semibold") },

    search: { marginBottom: 16, backgroundColor: c.elevatedBg },
    searchInput: { color: c.textPrimary, fontSize: 14 },

    month: { marginBottom: 10 },
  });
