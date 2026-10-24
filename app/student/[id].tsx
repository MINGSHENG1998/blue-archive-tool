import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { FallbackImage } from "@/components/FallbackImage";

import { AppCard } from "@/components/AppCard";
import { ScreenLayout } from "@/components/ScreenLayout";
import { StackScreenHeader } from "@/components/StackScreenHeader";
import { ThemedText } from "@/components/ThemedText";
import { typeColor } from "@/constants/Colors";
import { categoryColors } from "@/constants/categoryColors";
import { i18n, atkTypeLabels, defTypeLabels } from "@/constants/i18n";
import { RADIUS } from "@/constants/layout";
import type { ThemeTokens } from "@/constants/theme";
import { font } from "@/constants/typography";
import { useGameData } from "@/contexts/gamedata-context";
import { useLanguage } from "@/contexts/language-context";
import { useColors } from "@/hooks/useColors";
import InlineAd from "@/services/ads/InlineAd";
import {
  REGION,
  parseBirthDay,
  studentIconUris,
  studentPortraitUrl,
  toAtkType,
  toDefType,
} from "@/services/gamedata";

// Route-level error boundary: a render throw here degrades to an in-app
// error screen for this route only, instead of taking down the whole app.
export { ErrorBoundary } from "expo-router";


export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useLanguage();
  const t = i18n[locale];
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { byId, displayName, label } = useGameData();

  const student = byId[Number(id)];

  // A stale deep link, or an id from a newer snapshot than this build has.
  if (!student) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenLayout>
          <StackScreenHeader title={t.studentsPageTitle} />
          <AppCard level={1}>
            <ThemedText style={styles.missing}>{t.studentsNoResults}</ThemedText>
          </AppCard>
        </ScreenLayout>
      </>
    );
  }

  const atk = toAtkType(student.BulletType);
  const def = toDefType(student.ArmorType);
  const birthday = parseBirthDay(student.BirthDay);
  const positionLabel =
    student.Position === "Front"
      ? t.positionFront
      : student.Position === "Middle"
        ? t.positionMiddle
        : t.positionBack;

  const rows: { label: string; value: string }[] = [
    { label: t.studentsSchool, value: label("School", student.School) },
    { label: t.studentDetailClub, value: label("Club", student.Club) },
    {
      label: t.studentDetailRole,
      value: label("TacticRole", student.TacticRole),
    },
    { label: t.studentDetailPosition, value: positionLabel },
    { label: t.studentDetailWeapon, value: student.WeaponType },
  ];
  if (birthday) {
    rows.push({
      label: t.studentDetailBirthday,
      value: `${t.monthNames[birthday.month - 1]} ${birthday.day}`,
    });
  }

  const regions: { label: string; released: boolean }[] = [
    { label: t.regionJapan, released: student.IsReleased[REGION.japan] },
    { label: t.regionGlobal, released: student.IsReleased[REGION.global] },
    { label: t.regionChina, released: student.IsReleased[REGION.china] },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenLayout>
        <StackScreenHeader
          title={displayName(student)}
          subtitle={student.Name !== displayName(student) ? student.Name : undefined}
        />

        <AppCard level={2} padding={0} style={styles.hero}>
          <FallbackImage
            uris={[studentPortraitUrl(student.Id), ...studentIconUris(student.Id)]}
            label={student.Name}
            style={styles.portrait}
            resizeMode="cover"
          />
          <View style={styles.heroBody}>
            <ThemedText style={styles.stars}>
              {"★".repeat(student.StarGrade)}
            </ThemedText>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.classBadge]}>
                <ThemedText style={styles.badgeText}>
                  {label("SquadType", student.SquadType)}
                </ThemedText>
              </View>
              {atk ? (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: typeColor[atk].background },
                  ]}
                >
                  <ThemedText style={styles.badgeText}>
                    {atkTypeLabels[atk][locale]}
                  </ThemedText>
                </View>
              ) : null}
              {def ? (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: typeColor[def].background },
                  ]}
                >
                  <ThemedText style={styles.badgeText}>
                    {defTypeLabels[def][locale]}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>
        </AppCard>

        <AppCard level={1} style={styles.card}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <ThemedText style={styles.rowLabel}>{row.label}</ThemedText>
              <ThemedText style={styles.rowValue}>{row.value}</ThemedText>
            </View>
          ))}
        </AppCard>

        <AppCard level={1} style={styles.card}>
          <ThemedText style={styles.sectionLabel}>
            {t.studentDetailAvailability}
          </ThemedText>
          <View style={styles.regionRow}>
            {regions.map((region) => (
              <View
                key={region.label}
                style={[
                  styles.regionPill,
                  region.released
                    ? styles.regionReleased
                    : styles.regionUnreleased,
                ]}
              >
                <ThemedText
                  style={[
                    styles.regionText,
                    region.released
                      ? styles.regionTextReleased
                      : styles.regionTextUnreleased,
                  ]}
                >
                  {region.label}
                </ThemedText>
              </View>
            ))}
          </View>
        </AppCard>

        <InlineAd />
      </ScreenLayout>
    </>
  );
}

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    missing: { fontSize: 13, color: c.textMuted },

    hero: { flexDirection: "row", overflow: "hidden", marginBottom: 16 },
    portrait: {
      width: 132,
      height: 132,
      backgroundColor: c.surfaceBg,
    },
    heroBody: { flex: 1, padding: 16, justifyContent: "center" },
    stars: { fontSize: 16, color: categoryColors.star, marginBottom: 10 },

    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.pill,
    },
    classBadge: { backgroundColor: categoryColors.classSpecial },
    badgeText: {
      fontSize: 10,
      color: categoryColors.onBadge,
      ...font("semibold"),
    },

    card: { marginBottom: 16 },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 7,
    },
    rowLabel: { fontSize: 13, color: c.textSecondary },
    rowValue: {
      fontSize: 13,
      color: c.textPrimary,
      flexShrink: 1,
      textAlign: "right",
      ...font("semibold"),
    },

    sectionLabel: {
      fontSize: 12,
      color: c.textSecondary,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 12,
      ...font("semibold"),
    },
    regionRow: { flexDirection: "row", gap: 8 },
    regionPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: RADIUS.pill,
    },
    regionReleased: { backgroundColor: c.accentSoft },
    regionUnreleased: { backgroundColor: c.surfaceBg },
    regionText: { fontSize: 12, ...font("semibold") },
    regionTextReleased: { color: c.primaryColor },
    regionTextUnreleased: { color: c.textMuted },
  });
