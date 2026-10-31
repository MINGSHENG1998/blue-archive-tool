import { useRouter } from 'expo-router';
import { IndexTab, MomoTalkCard } from '@/components/schale';
import { homeStrings } from '@/constants/strings/home';
import { useStrings } from '@/constants/strings/define';
import { useGameData } from '@/contexts/gamedata-context';
import { studentIconUris, studentOfTheDay } from '@/services/gamedata';
import { homeStyles } from './HomeRow';

/** A different student each day, as a MomoTalk message. */
export function DailyStudentWidget({ now }: { now: number }) {
  const router = useRouter();
  const s = useStrings(homeStrings);
  const game = useGameData();
  const student = studentOfTheDay(game.students, new Date(now));
  if (!student) return null;
  return <>
    <IndexTab title={s.dailyStudent} style={homeStyles.heading} />
    <MomoTalkCard studentId={student.Id} uris={studentIconUris(student.Id)} name={game.displayName(student)} header={s.dailyStudent} message={s.dailyMessage} unread={1}
      onPress={() => router.push({ pathname: '/student/[id]', params: { id: student.Id } })} style={homeStyles.block} />
  </>;
}
