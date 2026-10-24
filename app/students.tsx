import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { FallbackImage } from "@/components/FallbackImage";
import { Chip, Searchbar, Switch } from "react-native-paper";

import { AppCard } from "@/components/AppCard";
import { ScreenLayout } from "@/components/ScreenLayout";
import { StackScreenHeader } from "@/components/StackScreenHeader";
import { ThemedText } from "@/components/ThemedText";
import { i18n, atkTypeLabels, defTypeLabels } from "@/constants/i18n";
import { RADIUS } from "@/constants/layout";
import type { ThemeTokens } from "@/constants/theme";
import { font } from "@/constants/typography";
import { useGameData } from "@/contexts/gamedata-context";
import { useLanguage } from "@/contexts/language-context";
import type { AtkType, DefType } from "@/dto/game.dto";
import { useColors } from "@/hooks/useColors";
import InlineAd from "@/services/ads/InlineAd";
import {
  filterStudents,
  schoolsOf,
  studentIconUris,
  type GameStudent,
} from "@/services/gamedata";

// Route-level error boundary: a render throw here degrades to an in-app
// error screen for this route only, instead of taking down the whole app.
export { ErrorBoundary } from "expo-router";


const RARITIES = [3, 2, 1];
const ATK_TYPES: AtkType[] = ["explosive", "piercing", "mystic", "sonic"];
const DEF_TYPES: DefType[] = ["light", "heavy", "special", "elastic"];

/** Toggle `value` in `list`, treating it as a set. */
function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export default function StudentsScreen() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = i18n[locale];
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { students, displayName, label } = useGameData();

  const [query, setQuery] = useState("");
  const [rarities, setRarities] = useState<number[]>([]);
  const [atkTypes, setAtkTypes] = useState<AtkType[]>([]);
  const [defTypes, setDefTypes] = useState<DefType[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [globalOnly, setGlobalOnly] = useState(true);

  const schoolOptions = useMemo(() => schoolsOf(students), [students]);

  const results = useMemo(
    () =>
      filterStudents(
        students,
        {
          query,
          rarities,
          atkTypes,
          defTypes,
          schools,
          region: globalOnly ? "global" : undefined,
        },
        displayName,
      ).sort((a, b) => b.StarGrade - a.StarGrade || a.Name.localeCompare(b.Name)),
    [students, query, rarities, atkTypes, defTypes, schools, globalOnly, displayName],
  );

  const hasFilters =
    rarities.length > 0 ||
    atkTypes.length > 0 ||
    defTypes.length > 0 ||
    schools.length > 0;

  const clearFilters = () => {
    setRarities([]);
    setAtkTypes([]);
    setDefTypes([]);
    setSchools([]);
  };

  const renderChips = <T,>(
    values: T[],
    selected: T[],
    onToggle: (value: T) => void,
    labelOf: (value: T) => string,
  ) => (
    <View style={styles.chips}>
      {values.map((value) => {
        const isSelected = selected.includes(value);
        return (
          <Chip
            key={String(value)}
            compact
            selected={isSelected}
            onPress={() => onToggle(value)}
            style={[styles.chip, isSelected && styles.chipSelected]}
            textStyle={[styles.chipText, isSelected && styles.chipTextSelected]}
          >
            {labelOf(value)}
          </Chip>
        );
      })}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenLayout>
        <StackScreenHeader
          title={t.studentsPageTitle}
          subtitle={t.studentsSubtitle}
        />

        <Searchbar
          placeholder={t.studentsSearchPlaceholder}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          inputStyle={styles.searchInput}
        />

        <AppCard level={1} style={styles.card}>
          <View style={styles.filterHeader}>
            <ThemedText style={styles.sectionLabel}>
              {t.studentsFilters}
            </ThemedText>
            {hasFilters ? (
              <Pressable onPress={clearFilters} hitSlop={8}>
                <ThemedText style={styles.clear}>
                  {t.studentsClearFilters}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>

          <ThemedText style={styles.facetLabel}>{t.studentsRarity}</ThemedText>
          {renderChips(
            RARITIES,
            rarities,
            (value) => setRarities((prev) => toggle(prev, value)),
            (value) => "★".repeat(value),
          )}

          <ThemedText style={styles.facetLabel}>{t.studentsAtkType}</ThemedText>
          {renderChips(
            ATK_TYPES,
            atkTypes,
            (value) => setAtkTypes((prev) => toggle(prev, value)),
            (value) => atkTypeLabels[value][locale],
          )}

          <ThemedText style={styles.facetLabel}>{t.studentsDefType}</ThemedText>
          {renderChips(
            DEF_TYPES,
            defTypes,
            (value) => setDefTypes((prev) => toggle(prev, value)),
            (value) => defTypeLabels[value][locale],
          )}

          <ThemedText style={styles.facetLabel}>{t.studentsSchool}</ThemedText>
          {renderChips(
            schoolOptions,
            schools,
            (value) => setSchools((prev) => toggle(prev, value)),
            (value) => label("School", value),
          )}

          <View style={styles.switchRow}>
            <ThemedText style={styles.switchLabel}>
              {t.studentsGlobalOnly}
            </ThemedText>
            <Switch
              value={globalOnly}
              onValueChange={setGlobalOnly}
              color={c.primaryColor}
            />
          </View>
        </AppCard>

        <InlineAd />

        <ThemedText style={styles.count}>
          {t.studentsCount.replace("{n}", String(results.length))}
        </ThemedText>

        {results.length === 0 ? (
          <AppCard level={1} style={styles.card}>
            <ThemedText style={styles.empty}>{t.studentsNoResults}</ThemedText>
          </AppCard>
        ) : (
          <View style={styles.grid}>
            {results.map((student: GameStudent) => (
              <Pressable
                key={student.Id}
                style={styles.gridItem}
                onPress={() =>
                  // expo-router generates its typed-route table from the dev
                  // server, so routes added since the last `expo start` are not
                  // in it yet. Same cast the home screen uses.
                  router.push(`/student/${student.Id}` as any)
                }
              >
                <FallbackImage
                  uris={studentIconUris(student.Id)}
                  label={displayName(student)}
                  style={styles.gridIcon}
                  resizeMode="cover"
                />
                <ThemedText style={styles.gridName} numberOfLines={1}>
                  {displayName(student)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}
      </ScreenLayout>
    </>
  );
}

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    search: { marginBottom: 16, backgroundColor: c.elevatedBg },
    searchInput: { color: c.textPrimary, fontSize: 14 },
    card: { marginBottom: 16 },

    filterHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    sectionLabel: {
      fontSize: 12,
      color: c.textSecondary,
      letterSpacing: 1,
      textTransform: "uppercase",
      ...font("semibold"),
    },
    clear: { fontSize: 12, color: c.primaryColor, ...font("semibold") },
    facetLabel: { fontSize: 11, color: c.textMuted, marginTop: 14, marginBottom: 6 },

    chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: { backgroundColor: c.surfaceBg },
    chipSelected: { backgroundColor: c.accentSoft },
    chipText: { fontSize: 11, color: c.textSecondary },
    chipTextSelected: { color: c.primaryColor },

    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16,
    },
    switchLabel: { fontSize: 13, color: c.textSecondary },

    count: { fontSize: 12, color: c.textMuted, marginBottom: 10 },
    empty: { fontSize: 13, color: c.textMuted },

    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    gridItem: { width: "22%", alignItems: "center" },
    gridIcon: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: RADIUS.sm,
      backgroundColor: c.surfaceBg,
    },
    gridName: {
      fontSize: 10,
      color: c.textSecondary,
      marginTop: 4,
      textAlign: "center",
    },
  });
