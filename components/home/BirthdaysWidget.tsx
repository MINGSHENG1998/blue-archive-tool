import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon, MomoTalkCard, PressScale } from '@/components/schale';
import { homeStrings } from '@/constants/strings/home';
import { useStrings } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useGameData } from '@/contexts/gamedata-context';
import { useColors } from '@/hooks/useColors';
import { studentIconUris, upcomingBirthdays } from '@/services/gamedata';

/** Birthdays falling today as MomoTalk messages, then the way into the full calendar. */
export function BirthdaysWidget({ now }: { now: number }) {
  const router = useRouter();
  const c = useColors();
  const type = useType();
  const s = useStrings(homeStrings);
  const game = useGameData();
  const today = upcomingBirthdays(game.students, new Date(now)).filter(entry => entry.daysUntil === 0);
  return <View style={styles.block}>
    {today.map(({ student }) => <MomoTalkCard key={student.Id} studentId={student.Id} uris={studentIconUris(student.Id)} name={game.displayName(student)}
      message={s.birthdayMessage} header={s.birthdays} typing={false} onPress={() => router.push({ pathname: '/student/[id]', params: { id: student.Id } })} style={styles.card} />)}
    <PressScale spark={false} onPress={() => router.push('/birthdays')} style={styles.link} accessibilityLabel={s.birthdayAll}>
      <Icon name="cake-variant-outline" size={18} color={c.secondaryInk} />
      <Text style={[type.labelCaps, { color: c.primaryInk }]}>{s.birthdayAll}</Text>
    </PressScale>
  </View>;
}

const styles = StyleSheet.create({
  // The 44px link already carries its own air; 16 more lines it up with a 28px section gap.
  block: { marginBottom: 16 },
  card: { marginBottom: 12 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', minHeight: 44 },
});
