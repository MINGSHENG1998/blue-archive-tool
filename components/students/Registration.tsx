import { StyleSheet, Text, View } from "react-native";
import { BottomSheet, FilterPill, SignalButton } from "@/components/schale";
import { studentStrings } from "@/constants/strings/students";
import { fmt, useStrings } from "@/constants/strings/define";
import { useType } from "@/constants/typography";
import { useRoster, useWatchlist } from "@/contexts/user-data-context";
import { useGameData } from "@/contexts/gamedata-context";
import { useColors } from "@/hooks/useColors";
import type { GameStudent } from "@/services/gamedata";
import { unitEntry, unitIdOf, type RosterInput } from "@/services/userdata/roster";
import { watchesUnit } from "@/services/students/view";

/** Write one canonical unit and clear old linked entries so either combat form stays in sync. */
export function useStudentRegistration(student: GameStudent) {
  const roster = useRoster();
  const watchlist = useWatchlist();
  const entry = unitEntry(roster.entries, student);
  const watched = watchesUnit(watchlist.ids, student);
  const set = (input: RosterInput | null) => {
    if (!roster.ready) return;
    const id = unitIdOf(student);
    roster.set(id, input);
    if (student.LinkedCharacterId !== undefined) {
      const other = id === student.Id ? student.LinkedCharacterId : student.Id;
      roster.set(other, null);
    }
  };
  const toggleWatch = () => {
    if (!watchlist.ready) return;
    watchlist.setWatched(unitIdOf(student), !watched);
    if (student.LinkedCharacterId !== undefined) {
      const other = unitIdOf(student) === student.Id ? student.LinkedCharacterId : student.Id;
      watchlist.setWatched(other, false);
    }
  };
  return { entry, watched, ready: roster.ready, watchReady: watchlist.ready, set, toggleWatch,
    toggleOwned: () => set(entry ? null : { stars: student.StarGrade }) };
}

export function GradeSheet({ student, onClose, onView }: {
  student: GameStudent | null; onClose: () => void; onView?: (id: number) => void;
}) {
  const s = useStrings(studentStrings);
  const { displayName } = useGameData();
  return <BottomSheet visible={!!student} onClose={onClose} title={student ? fmt(s.editGrades, { name: displayName(student) }) : s.grades}>
    {student ? <GradeEditor student={student} onView={onView} /> : null}
  </BottomSheet>;
}

export function GradeEditor({ student, onView }: { student: GameStudent; onView?: (id: number) => void }) {
  const s = useStrings(studentStrings);
  const type = useType();
  const c = useColors();
  const { entry, ready, set, toggleOwned } = useStudentRegistration(student);
  return <View style={styles.content}>
    <Text style={[type.body, { color: c.textSecondary }]}>{ready ? s.saved : s.loading}</Text>
    <Text style={[type.bodyStrong, { color: c.textPrimary }]}>{s.starGrade}</Text>
    <View style={styles.row}>
      {Array.from({ length: 6 - student.StarGrade }, (_, index) => index + student.StarGrade).map(stars =>
        <FilterPill key={stars} label={`${stars}★`} selected={entry?.stars === stars} disabled={!ready}
          accessibilityLabel={`${s.starGrade}: ${stars}`} onPress={() => set({ stars, ue: entry?.ue })} />)}
    </View>
    {entry?.stars === 5 ? <>
      <Text style={[type.bodyStrong, { color: c.textPrimary }]}>{s.weaponGrade}</Text>
      <View style={styles.row}>{[0, 1, 2, 3, 4].map(ue => <FilterPill key={ue}
        label={ue ? `${ue}★` : s.noWeapon} selected={(entry.ue ?? 0) === ue} disabled={!ready}
        accessibilityLabel={`${s.weaponGrade}: ${ue}`} onPress={() => set({ stars: 5, ue })} />)}</View>
    </> : null}
    <SignalButton label={entry ? s.unown : s.own} variant="ghost" disabled={!ready} onPress={toggleOwned} />
    {onView ? <SignalButton label={s.dossier} onPress={() => onView(student.Id)} /> : null}
  </View>;
}

const styles = StyleSheet.create({ content: { gap: 12, paddingVertical: 10 }, row: { flexDirection: "row", flexWrap: "wrap", gap: 5 } });
