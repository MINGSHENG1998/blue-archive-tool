import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppCard, IndexTab, PressScale, SlantPortrait } from '@/components/schale';
import { homeStrings } from '@/constants/strings/home';
import { fmt, useStrings } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useGameData } from '@/contexts/gamedata-context';
import { useBanners } from '@/contexts/banners-context';
import { useWatchlist } from '@/contexts/user-data-context';
import { useLanguage } from '@/contexts/language-context';
import { useColors } from '@/hooks/useColors';
import { characterImageUris, studentIconUris } from '@/services/gamedata';
import { bannerStudentName, localDuration, watchedRecruitments } from '@/services/home/view';
import { HomeRow, homeStyles } from './HomeRow';

/** The next pickup, then the next banner for each starred student. */
export function ComingUpWidget({ now }: { now: number }) {
  const router = useRouter();
  const c = useColors();
  const type = useType();
  const s = useStrings(homeStrings);
  const { locale } = useLanguage();
  const game = useGameData();
  const schedule = useBanners();
  const watch = useWatchlist();
  const watched = watchedRecruitments(schedule.banners, watch.ids, game.byId, now);
  const next = schedule.next;
  const openSchedule = () => router.replace('/(tabs)/banner');
  return <>
    <IndexTab title={s.comingUp} style={homeStyles.heading}
      right={<PressScale spark={false} onPress={openSchedule} accessibilityLabel={s.schedule}><Text style={[type.labelCaps, { color: c.primaryInk }]}>{s.schedule}</Text></PressScale>} />
    <AppCard padding={0} style={homeStyles.block}>
      {next ? <HomeRow first onPress={openSchedule}
        lead={<View style={styles.cluster}>{next.characters.slice(0, 3).map((char, i) => <SlantPortrait key={char.id} uris={characterImageUris(char)} label={char.name} size={34} style={{ marginLeft: i ? -12 : 0 }} />)}</View>}
        meta={s.next} title={next.characters.map(char => bannerStudentName(char, locale, game.byId, game.displayName)).join(', ')}
        caption={fmt(s.starts, { time: localDuration((next.startAt - now) / 1000, s) })} /> : null}
      {watched.map(({ id, banner, char }, i) => <HomeRow key={id} first={!next && i === 0} onPress={() => router.push({ pathname: '/student/[id]', params: { id } })}
        lead={<SlantPortrait uris={studentIconUris(id)} label={char.name} size={34} />}
        meta={s.watching} title={bannerStudentName(char, locale, game.byId, game.displayName)}
        caption={fmt(s.starts, { time: localDuration((banner.startAt - now) / 1000, s) })} />)}
      {!watched.length ? <HomeRow first={!next} icon="star-outline" title={watch.ids.length ? s.watchNoSchedule : s.watchEmpty}
        onPress={() => router.replace('/(tabs)/students')} /> : null}
    </AppCard>
  </>;
}

const styles = StyleSheet.create({
  cluster: { flexDirection: 'row' },
});
