import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SlantPortrait, Stamp } from "@/components/schale";
import { studentStrings } from "@/constants/strings/students";
import { fmt, useStrings } from "@/constants/strings/define";
import { useType } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { studentIconUris, type GameStudent } from "@/services/gamedata";
import type { RosterEntry } from "@/services/userdata/roster";

export const StudentTile = memo(function StudentTile({ student, name, size, entry, watched, register, ready, onPress, onGrades }: {
  student: GameStudent; name: string; size: number; entry?: RosterEntry; watched: boolean;
  register: boolean; ready: boolean; onPress: () => void; onGrades: () => void;
}) {
  const c = useColors();
  const type = useType();
  const s = useStrings(studentStrings);
  return <View style={styles.tile}>
    <SlantPortrait uris={studentIconUris(student.Id)} label={register ? `${name} · ${entry ? s.unown : s.own}` : name}
      size={size} dimmed={register && !entry} onPress={register && !ready ? undefined : onPress}
      badge={entry ? <Stamp label="✓" tone="success" size="sm" animate={false} /> : undefined} />
    <Text numberOfLines={2} style={[type.caption, styles.name, { color: c.textPrimary }]}>{name}</Text>
    <Text style={[type.caption, { color: c.textSecondary }]}>{"★".repeat(entry?.stars ?? student.StarGrade)}{watched ? " ◇" : ""}</Text>
    {register ? <Pressable accessibilityRole="button" accessibilityLabel={fmt(s.editGrades, { name })}
      onPress={onGrades} disabled={!ready} style={styles.gradeButton}>
      <Text style={[type.caption, { color: c.primaryInk }]}>{s.grades}</Text>
    </Pressable> : null}
  </View>;
});

const styles = StyleSheet.create({
  tile: { flex: 1, alignItems: "center", paddingHorizontal: 5, paddingTop: 6, paddingBottom: 14, gap: 4 },
  name: { minHeight: 32, textAlign: "center" }, gradeButton: { minHeight: 44, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
});
