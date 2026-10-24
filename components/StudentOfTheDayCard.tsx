import { useMemo } from "react";
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
  studentIconUris,
  studentOfTheDay,
  studentPortraitUrl,
} from "@/services/gamedata";

/**
 * One student a day, the same one for every player. The pick is derived from
 * the in-game day (04:00 JST reset), not from device-local midnight, so two
 * players in different timezones always see the same student.
 */
export function StudentOfTheDayCard() {
  const { locale } = useLanguage();
  const t = i18n[locale];
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { students, displayName } = useGameData();

  // Only the in-game day matters, so this is stable for hours at a time even
  // though `new Date()` is read on every render.
  const student = studentOfTheDay(students, new Date());
  if (!student) return null;

  return (
    <AppCard level={2} padding={0} style={styles.card}>
      <View style={styles.body}>
        <ThemedText style={styles.heading}>{t.sotdHeading}</ThemedText>
        <ThemedText style={styles.name} numberOfLines={1}>
          {displayName(student)}
        </ThemedText>
        <ThemedText style={styles.meta} numberOfLines={1}>
          {student.School} · {"★".repeat(student.StarGrade)}
        </ThemedText>
      </View>
      <FallbackImage
        uris={[studentPortraitUrl(student.Id), ...studentIconUris(student.Id)]}
        label={student.Name}
        style={styles.portrait}
        resizeMode="cover"
      />
    </AppCard>
  );
}

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    card: { flexDirection: "row", overflow: "hidden", alignItems: "stretch" },
    body: { flex: 1, padding: 16, justifyContent: "center" },
    heading: {
      fontSize: 11,
      color: c.primaryColor,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 4,
      ...font("semibold"),
    },
    name: { fontSize: 20, color: c.textPrimary, ...font("extrabold") },
    meta: { fontSize: 12, color: c.textMuted, marginTop: 2, ...font("medium") },
    portrait: {
      width: 108,
      height: 108,
      borderTopRightRadius: RADIUS.card,
      borderBottomRightRadius: RADIUS.card,
      backgroundColor: c.surfaceBg,
    },
  });
