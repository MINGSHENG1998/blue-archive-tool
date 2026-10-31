import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppCard, EmptyState, FilterPill, IndexTab, NavBar, NumberHero, PortraitCrop, ScreenLayout, SignalButton, Stamp } from "@/components/schale";
import { categoryColors } from "@/constants/categoryColors";
import { typeColor } from "@/constants/Colors";
import { GradeSheet, useStudentRegistration } from "@/components/students/Registration";
import { i18n, atkTypeLabels, defTypeLabels } from "@/constants/i18n";
import { bannerStrings } from "@/constants/strings/banners";
import { fmt, useStrings } from "@/constants/strings/define";
import { equipmentStrings, studentStrings } from "@/constants/strings/students";
import { useType } from "@/constants/typography";
import { useBanners } from "@/contexts/banners-context";
import { useGameData } from "@/contexts/gamedata-context";
import { useLanguage } from "@/contexts/language-context";
import { useColors } from "@/hooks/useColors";
import InlineAd from "@/services/ads/InlineAd";
import { scheduleDate } from "@/services/banners/view";
import { REGION, TERRAINS, adaptationGrade, daysUntilBirthday, parseBirthDay, studentIconUris, studentPortraitUrl, terrainAdaptation, toAtkType, toDefType, type GameStudent } from "@/services/gamedata";
export { ErrorBoundary } from "expo-router";

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { byId } = useGameData();
  const s = useStrings(studentStrings);
  const student = byId[Number(id)];
  return <>
    <Stack.Screen options={{ headerShown: false }} />
    {student ? <StudentDossier key={student.Id} student={student} /> : <ScreenLayout>
      <NavBar title={s.title} /><EmptyState title={s.missingStudent} />
    </ScreenLayout>}
  </>;
}

function StudentDossier({ student }: { student: GameStudent }) {
  const router = useRouter();
  const c = useColors();
  const type = useType();
  const { locale } = useLanguage();
  const t = i18n[locale];
  const s = useStrings(studentStrings);
  const b = useStrings(bannerStrings);
  const equipment = useStrings(equipmentStrings);
  const { displayName, label, isLimitedLabel, isLimitedTooltip } = useGameData();
  const { bannersFor, recent, status } = useBanners();
  const registration = useStudentRegistration(student);
  const [editing, setEditing] = useState(false);
  const name = displayName(student);
  const attack = toAtkType(student.BulletType);
  const armor = toDefType(student.ArmorType);
  const birthday = parseBirthDay(student.BirthDay);
  const birthdayDays = birthday ? daysUntilBirthday(birthday, new Date()) : null;
  const ids = new Set([student.Id, student.LinkedCharacterId].filter((id): id is number => id !== undefined));
  const appearances = [...new Map([
    ...[...ids].flatMap(id => bannersFor(id)),
    ...recent.filter(banner => banner.characters.some(character => character.studentId !== undefined && ids.has(character.studentId))),
  ].map(banner => [banner.id, banner])).values()].sort((a, z) => a.startAt - z.startAt);
  const row = (title: string, value: string | undefined) => value ? <View key={title} style={[styles.row, { borderBottomColor: c.hairline }]}>
    <Text style={[type.caption, styles.rowLabel, { color: c.textSecondary }]}>{title}</Text>
    <Text selectable style={[type.bodyStrong, styles.rowValue, { color: c.textPrimary }]}>{value}</Text>
  </View> : null;
  const position = student.Position === "Front" ? t.positionFront : student.Position === "Middle" ? t.positionMiddle : student.Position === "Back" ? t.positionBack : student.Position;

  return <>
    <ScreenLayout>
      <NavBar title={name} subtitle={label("School", student.School)} />
      <AppCard padding={0} style={styles.hero}>
        <LinearGradient colors={[c.skyTop, c.skyMid]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        <PortraitCrop uris={[studentPortraitUrl(student.Id), ...studentIconUris(student.Id)]} label={name}
          width={170} height={HERO_H} span={0.66} top={0} style={styles.portrait} />
        <View style={styles.heroText}>
          <Text style={[type.caption, { color: c.textSecondary }]}>{label("SquadType", student.SquadType)}</Text>
          <Text style={[type.num, { color: categoryColors.star, fontSize: 18 }]}>{"★".repeat(registration.entry?.stars ?? student.StarGrade)}</Text>
          <View style={styles.badges}>
            {attack ? <Stamp label={atkTypeLabels[attack][locale]} size="sm" color={typeColor[attack]?.background} on={c.skyTop} /> : null}
            {armor ? <Stamp label={defTypeLabels[armor][locale]} size="sm" color={typeColor[armor]?.background} on={c.skyTop} /> : null}
            {registration.entry ? <Stamp label={s.owned} tone="success" size="sm" on={c.skyTop} /> : null}
          </View>
        </View>
      </AppCard>
      <View style={styles.actions}>
        <SignalButton compact style={styles.flex} icon={registration.entry ? "check-circle" : "plus-circle-outline"} label={registration.entry ? s.unown : s.own} variant="ghost" disabled={!registration.ready} onPress={registration.toggleOwned} />
        <SignalButton compact style={styles.flex} icon={registration.watched ? "star" : "star-outline"} label={registration.watched ? s.unwatch : s.watch} variant="ghost" disabled={!registration.watchReady} onPress={registration.toggleWatch} />
      </View>
      {registration.entry ? <FilterPill label={s.grades} icon="pencil-outline" onPress={() => setEditing(true)} disabled={!registration.ready} /> : null}
      <SignalButton label={s.bond} onPress={() => router.push({ pathname: "/tools/bond", params: { studentId: String(student.Id) } } as never)} />

      <View style={styles.section}><IndexTab title={s.terrain} />
        <AppCard><View style={styles.terrain}>
          {TERRAINS.map(terrain => {
            const value = terrainAdaptation(student, terrain);
            return <View key={terrain} style={styles.terrainCell}>
              <NumberHero value={adaptationGrade(value) ?? "—"} label={label("AdaptationType", terrain)}
                tone={value === null ? c.textMuted : value >= 3 ? c.success : value <= 1 ? c.hazardColor : c.primaryInk} />
            </View>;
          })}
        </View></AppCard>
      </View>
      <View style={styles.section}><IndexTab title={s.profile} />
        <AppCard>
          {row(s.school, label("School", student.School))}
          {row(s.club, label("Club", student.Club))}
          {row(s.role, label("TacticRole", student.TacticRole))}
          {row(s.position, position)}
          {row(s.schoolYear, student.SchoolYear)}
          {row(s.age, student.CharacterAge)}
          {row(s.height, student.CharHeightMetric)}
          {row(s.hobby, student.Hobby)}
          {row(s.illustrator, student.Illustrator)}
          {row(s.voice, student.CharacterVoice)}
          {row(s.birthday, birthday ? `${t.monthNames[birthday.month - 1]} ${birthday.day}` : s.unknown)}
          {birthdayDays !== null ? <View style={styles.birthday}><Stamp label={birthdayDays === 0 ? s.birthdayToday : fmt(s.birthdayIn, { days: birthdayDays })} tone={birthdayDays === 0 ? "success" : "primary"} animate={false} /></View> : null}
        </AppCard>
      </View>
      <View style={styles.section}><IndexTab title={s.weapon} />
        <AppCard>{row(s.weapon, student.WeaponName ?? s.unknown)}{row(s.weaponType, student.WeaponType)}
          {row(s.equipment, student.Equipment?.map(slot => equipment[slot as keyof typeof equipment] ?? slot).join(" · ") ?? s.unknown)}
        </AppCard>
      </View>
      <InlineAd />
      <View style={styles.section}><IndexTab title={s.availability} />
        <AppCard>{(["japan", "global", "china"] as const).map(region => {
          const released = student.IsReleased[REGION[region]];
          const regionName = region === "japan" ? t.regionJapan : region === "global" ? t.regionGlobal : t.regionChina;
          return <View key={region} style={styles.region}>
            <Text style={[type.bodyStrong, { color: c.textPrimary }]}>{regionName}</Text>
            <Stamp label={released ? s.released : s.unreleased} tone={released ? "success" : "muted"} animate={false} size="sm" />
            <Text style={[type.body, { color: c.textSecondary, width: "100%" }]}>{isLimitedLabel(student, region) ?? s.unknown}</Text>
            {isLimitedTooltip(student, region) ? <Text style={[type.caption, { color: c.textMuted }]}>{isLimitedTooltip(student, region)}</Text> : null}
          </View>;
        })}</AppCard>
      </View>
      <View style={styles.section}><IndexTab title={s.appearances} />
        <Text style={[type.caption, { color: c.textMuted, marginBottom: 12 }]}>{s.bannerPrediction}</Text>
        {appearances.length ? appearances.map(banner => <AppCard key={banner.id} style={styles.banner}>
          <Stamp label={b[banner.type]} tone={banner.type === "Fes" ? "fes" : banner.type === "Collab" ? "collab" : banner.type === "New" ? "new" : "rerun"} animate={false} />
          {row(b.start, scheduleDate(banner.startAt, locale))}{row(b.end, scheduleDate(banner.endAt, locale))}
        </AppCard>) : <AppCard><Text style={[type.body, { color: c.textSecondary }]}>{status === "loading" ? s.bannersLoading : status === "error" ? s.bannersError : s.noBanners}</Text></AppCard>}
      </View>
    </ScreenLayout>
    <GradeSheet student={editing ? student : null} onClose={() => setEditing(false)} />
  </>;
}
const HERO_H = 250;

const styles = StyleSheet.create({
  hero: { marginBottom: 14, height: HERO_H, overflow: "hidden" },
  portrait: { position: "absolute", right: 0, bottom: 0 }, heroText: { width: "52%", padding: 18, gap: 10, justifyContent: "flex-end", flex: 1 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, actions: { flexDirection: "row", gap: 10, marginBottom: 12 }, flex: { flex: 1 },
  section: { marginTop: 26 }, terrain: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, terrainCell: { flex: 1, minWidth: 70 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  rowLabel: { minWidth: 80, flex: 1 }, rowValue: { flexGrow: 2, flexShrink: 1, maxWidth: "100%", textAlign: "right" },
  birthday: { marginTop: 16, alignItems: "flex-start" }, region: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, paddingVertical: 12 },
  banner: { marginBottom: 16 },
});
