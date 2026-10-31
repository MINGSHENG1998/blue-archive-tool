import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppCard, IndexTab, Stamp } from '@/components/schale';
import { homeStrings } from '@/constants/strings/home';
import { fmt, useStrings } from '@/constants/strings/define';
import { useGameData, effectiveBulletTypes, liveEvents, liveRaids } from '@/contexts/gamedata-context';
import { localDuration } from '@/services/home/view';
import { HomeRow, homeStyles } from './HomeRow';

/** Live events and raids, with the attack types that hit each raid boss hard. Renders nothing when nothing is live. */
export function HappeningWidget({ now }: { now: number }) {
  const router = useRouter();
  const s = useStrings(homeStrings);
  const game = useGameData();
  const at = new Date(now);
  const events = liveEvents(game.config, at).map(event => ({ event, name: game.eventName(event.id) })).filter(row => row.name);
  const raids = liveRaids(game.config, game.raids, at, { names: game.raidNames });
  if (!events.length && !raids.length) return null;
  return <>
    <IndexTab title={s.happening} style={homeStyles.heading} />
    <AppCard padding={0} style={homeStyles.block}>
      {events.map(({ event, name }, i) => <HomeRow key={`event-${event.id}`} first={i === 0} icon="flag-variant" title={name!}
        caption={fmt(s.ends, { time: localDuration(event.secondsLeft, s) })} meta={s.event} />)}
      {raids.map((raid, i) => {
        const effective = [...new Set(raid.armorTypes.flatMap(armor => effectiveBulletTypes(armor, game.config)))].map(attack => game.label('BulletType', attack));
        return <HomeRow key={`${raid.kind}-${raid.id}`} first={!events.length && i === 0} icon="sword-cross" title={raid.name} meta={s.raid}
          caption={fmt(s.ends, { time: localDuration(raid.secondsLeft, s) })} onPress={() => router.push('/tools/raid')}
          extra={effective.length ? <View style={styles.tags}>{effective.map(label => <Stamp key={label} label={fmt(s.effective, { types: label })} tone="primary" size="sm" />)}</View> : null} />;
      })}
    </AppCard>
  </>;
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
});
