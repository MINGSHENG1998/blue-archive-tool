import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Share, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppCard, BottomSheet, CostGauge, EmptyState, FilterPill, IndexTab, SearchField, SignalButton, SlantSegmented } from "@/components/schale";
import { GradeSheet } from "@/components/students/Registration";
import { StudentTile } from "@/components/students/StudentTile";
import { atkTypeLabels, defTypeLabels } from "@/constants/i18n";
import { fmt, useStrings } from "@/constants/strings/define";
import { studentStrings } from "@/constants/strings/students";
import { useType } from "@/constants/typography";
import { useGameData } from "@/contexts/gamedata-context";
import { useLanguage } from "@/contexts/language-context";
import { useRoster, useWatchlist } from "@/contexts/user-data-context";
import type { AtkType, DefType } from "@/dto/game.dto";
import { useColors } from "@/hooks/useColors";
import InlineAd from "@/services/ads/InlineAd";
import { schoolsOf, type GameStudent } from "@/services/gamedata";
import { collectionGroups, selectStudentFiles, watchesUnit, type FileFilters } from "@/services/students/view";
import { MAX_IMPORT_LENGTH, unitEntry, unitIdOf, type RosterImportError } from "@/services/userdata/roster";
export { ErrorBoundary } from "expo-router";

const ATTACKS: AtkType[] = ["explosive", "piercing", "mystic", "sonic", "chemical"];
const ARMORS: DefType[] = ["light", "heavy", "special", "elastic", "composite"];
const toggle = <T,>(list: readonly T[] = [], value: T): T[] => list.includes(value) ? list.filter(x => x !== value) : [...list, value];

export default function StudentsScreen() {
  const router = useRouter();
  const c = useColors();
  const type = useType();
  const s = useStrings(studentStrings);
  const { locale } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { students, displayName, label } = useGameData();
  const roster = useRoster();
  const watchlist = useWatchlist();
  const [mode, setMode] = useState<"browse" | "register">("browse");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FileFilters>({ region: "global" });
  const [sheet, setSheet] = useState<"filters" | "collection" | "import" | null>(null);
  const [editing, setEditing] = useState<GameStudent | null>(null);
  const [paste, setPaste] = useState("");
  const [feedback, setFeedback] = useState("");
  const results = useMemo(() => selectStudentFiles(students, { ...filters, query }, roster.entries, watchlist.ids, displayName),
    [students, filters, query, roster.entries, watchlist.ids, displayName]);
  const stats = useMemo(() => collectionGroups(students, roster.entries, filters.region), [students, roster.entries, filters.region]);
  const schools = useMemo(() => schoolsOf(students), [students]);
  const columns = width >= 650 ? 5 : width >= 420 ? 4 : 3;
  const portraitSize = Math.max(48, Math.min(112, Math.floor((Math.min(width, 800) - 40) / columns - 24)));
  const filterCount = (filters.schools?.length ?? 0) + (filters.rarities?.length ?? 0) + (filters.atkTypes?.length ?? 0) +
    (filters.defTypes?.length ?? 0) + (filters.squads?.length ?? 0) + Number(!!filters.watched) + Number(!!filters.missingLimited) + Number(!!filters.owned && filters.owned !== "all");
  const patch = (next: Partial<FileFilters>) => setFilters(prev => ({ ...prev, ...next }));
  const openDossier = (id: number) => { setEditing(null); router.push(`/student/${id}` as never); };
  const toggleOwned = (student: GameStudent) => {
    if (!roster.ready) return;
    const id = unitIdOf(student);
    roster.set(id, unitEntry(roster.entries, student) ? null : { stars: student.StarGrade });
    if (student.LinkedCharacterId !== undefined) roster.set(id === student.Id ? student.LinkedCharacterId : student.Id, null);
  };
  const share = async () => {
    if (!roster.ready) return;
    try { await Share.share({ message: roster.exportText() }); } catch { setFeedback(s.shareError); }
  };
  const importRoster = () => {
    if (!roster.ready) return;
    const result = roster.importText(paste);
    const errors: Record<RosterImportError, string> = { empty: s.importEmpty, header: s.importHeader, version: s.importVersion, entry: s.importEntry, tooLarge: s.importLarge };
    setFeedback(result.ok ? fmt(s.imported, { count: result.count }) : errors[result.reason]);
    if (result.ok) setPaste("");
  };
  const facet = <T,>(title: string, values: readonly T[], selected: readonly T[] | undefined, onPress: (value: T) => void, name: (value: T) => string) =>
    <View style={styles.facet}><Text style={[type.bodyStrong, { color: c.textPrimary }]}>{title}</Text>
      <View style={styles.row}>{values.map(value => <FilterPill key={String(value)} label={name(value)} selected={selected?.includes(value)} onPress={() => onPress(value)} />)}</View>
    </View>;
  return <View style={[styles.root, { backgroundColor: c.appBg }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <FlatList key={columns} data={results} numColumns={columns} keyExtractor={student => String(student.Id)}
      keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} initialNumToRender={20} maxToRenderPerBatch={20} windowSize={7}
      contentContainerStyle={[styles.list, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 28 }]}
      ListHeaderComponent={<View style={styles.header}>
        <Text accessibilityRole="header" style={[type.hero, { color: c.textPrimary, marginTop: 8 }]}>{s.title}</Text>
        <SlantSegmented value={mode} onChange={setMode} options={[{ value: "browse", label: s.browse }, { value: "register", label: s.register }]} />
        {mode === "register" ? <AppCard padding={16} style={styles.collection}>
          {roster.ready ? <>
            <View style={styles.collectionTop}>
              <Text style={[type.numXL, { color: c.textPrimary }]}>{stats.overall.total ? Math.round(stats.overall.owned / stats.overall.total * 100) : 0}%</Text>
              <Text style={[type.caption, { color: c.textSecondary, flex: 1 }]}>{fmt(s.progress, stats.overall)}</Text>
            </View>
            <CostGauge value={stats.overall.owned} max={stats.overall.total} showValue={false} cells={20} />
            <Text style={[type.caption, { color: c.textSecondary }]}>{s.registerHelp}</Text>
          </> : <Text style={[type.body, { color: c.textSecondary }]}>{s.loading}</Text>}
          <View style={styles.row}>
            <FilterPill label={s.collection} disabled={!roster.ready} onPress={() => setSheet("collection")} />
            <FilterPill label={s.export} disabled={!roster.ready} onPress={() => { void share(); }} />
            <FilterPill label={s.import} disabled={!roster.ready} onPress={() => { setFeedback(""); setSheet("import"); }} />
          </View>
        </AppCard> : null}
        <SearchField value={query} onChangeText={setQuery} placeholder={s.search} />
        <View style={styles.row}>
          <FilterPill label={`${s.filters}${filterCount ? ` · ${filterCount}` : ""}`} selected={filterCount > 0} onPress={() => setSheet("filters")} icon="filter-variant" />
          <FilterPill label={s.owned} selected={filters.owned === "owned"} disabled={!roster.ready} onPress={() => patch({ owned: filters.owned === "owned" ? "all" : "owned" })} />
          <FilterPill label={s.watched} selected={filters.watched} disabled={!watchlist.ready} onPress={() => patch({ watched: !filters.watched })} />
        </View>
        {feedback && sheet !== "import" ? <Text accessibilityLiveRegion="polite" style={[type.body, { color: c.primaryInk }]}>{feedback}</Text> : null}
        <InlineAd />
        <IndexTab title={fmt(s.count, { count: results.length })} />
      </View>}
      renderItem={({ item }) => <StudentTile student={item} name={displayName(item)} size={portraitSize}
        entry={roster.ready ? unitEntry(roster.entries, item) : undefined} watched={watchesUnit(watchlist.ids, item)}
        register={mode === "register"} ready={roster.ready} onPress={() => mode === "register" ? toggleOwned(item) : openDossier(item.Id)} onGrades={() => setEditing(item)} />}
      ListEmptyComponent={<EmptyState title={s.empty} body={s.emptyBody} />} />
    <BottomSheet visible={sheet === "filters"} onClose={() => setSheet(null)} title={s.filters}>
      {facet(s.school, schools, filters.schools, value => patch({ schools: toggle(filters.schools, value) }), value => label("School", value))}
      {facet(s.rarity, [3, 2, 1], filters.rarities, value => patch({ rarities: toggle(filters.rarities, value) }), value => `${value}★`)}
      {facet(s.attack, ATTACKS, filters.atkTypes, value => patch({ atkTypes: toggle(filters.atkTypes, value) }), value => atkTypeLabels[value][locale])}
      {facet(s.armor, ARMORS, filters.defTypes, value => patch({ defTypes: toggle(filters.defTypes, value) }), value => defTypeLabels[value][locale])}
      {facet(s.squad, ["Main", "Support"], filters.squads, value => patch({ squads: toggle(filters.squads, value) }), value => label("SquadType", value))}
      <View style={styles.row}>{(["all", "owned", "missing"] as const).map(value => <FilterPill key={value} label={s[value]} selected={(filters.owned ?? "all") === value}
        disabled={value !== "all" && !roster.ready} onPress={() => patch({ owned: value })} />)}</View>
      <View style={styles.row}>
        <FilterPill label={s.watched} selected={filters.watched} disabled={!watchlist.ready} onPress={() => patch({ watched: !filters.watched })} />
        <FilterPill label={s.missingLimited} selected={filters.missingLimited} disabled={!roster.ready} onPress={() => patch({ missingLimited: !filters.missingLimited })} />
        <FilterPill label={s.global} selected={filters.region === "global"} onPress={() => patch({ region: filters.region ? undefined : "global" })} />
      </View>
      <View style={styles.sheetActions}><SignalButton label={s.clear} variant="ghost" onPress={() => { setFilters({ region: "global" }); setQuery(""); }} />
        <SignalButton label={s.apply} onPress={() => setSheet(null)} /></View>
    </BottomSheet>
    <BottomSheet visible={sheet === "collection"} onClose={() => setSheet(null)} title={s.collection}>
      <Text style={[type.caption, { color: c.textSecondary, marginBottom: 20 }]}>{s.linked}</Text>
      <IndexTab title={s.bySchool} />
      {stats.schools.map(group => <CostGauge key={group.key} label={`${label("School", group.key)} · ${Math.round(group.owned / group.total * 100)}%`} value={group.owned} max={group.total} style={styles.gauge} />)}
      <IndexTab title={s.byRarity} />
      {stats.rarities.map(group => <CostGauge key={group.key} label={`${group.key}★ · ${Math.round(group.owned / group.total * 100)}%`} value={group.owned} max={group.total} style={styles.gauge} />)}
    </BottomSheet>
    <BottomSheet visible={sheet === "import"} onClose={() => setSheet(null)} title={s.import}>
      <Text style={[type.body, { color: c.textSecondary, marginBottom: 12 }]}>{s.backupHelp}</Text>
      <TextInput value={paste} onChangeText={setPaste} placeholder="BAT1 10000:5:2 10001:3" accessibilityLabel={s.paste}
        placeholderTextColor={c.textMuted} multiline maxLength={MAX_IMPORT_LENGTH} autoCorrect={false} autoCapitalize="none"
        style={[type.body, styles.paste, { color: c.textPrimary, borderColor: c.hairline, backgroundColor: c.surfaceBg }]} />
      {feedback ? <Text accessibilityLiveRegion="polite" style={[type.bodyStrong, styles.gauge, { color: c.primaryInk }]}>{feedback}</Text> : null}
      <SignalButton label={s.merge} disabled={!roster.ready} onPress={importRoster} />
    </BottomSheet>
    <GradeSheet student={editing} onClose={() => setEditing(null)} onView={openDossier} />
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, list: { paddingHorizontal: 20, width: "100%", maxWidth: 800, alignSelf: "center" },
  header: { gap: 12, marginBottom: 8 }, collection: { gap: 12 }, collectionTop: { flexDirection: "row", alignItems: "center", gap: 12 }, row: { flexDirection: "row", flexWrap: "wrap", gap: 4, alignItems: "center" },
  facet: { marginBottom: 16, gap: 6 }, sheetActions: { gap: 14, marginTop: 18, marginBottom: 8 }, gauge: { marginBottom: 18 },
  paste: { minHeight: 150, maxHeight: 250, textAlignVertical: "top", padding: 12, borderWidth: 1, borderRadius: 4, marginBottom: 16 },
});
