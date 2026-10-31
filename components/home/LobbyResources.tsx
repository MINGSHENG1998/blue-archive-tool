import { ScrollView } from 'react-native';
import { Capsule } from '@/components/schale';
import { homeStrings } from '@/constants/strings/home';
import { useStrings } from '@/constants/strings/define';
import { countdownTo, formatCountdown, nextDailyReset, nextCafeReset, nextHeadpatReset } from '@/services/gamedata';
import { useFocusedNow } from './useFocusedNow';

/** The one-second clock is isolated from the Lobby's large content tree. */
export function LobbyResources() {
  const now = new Date(useFocusedNow(1000));
  const s = useStrings(homeStrings);
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }} style={{ marginBottom: 22 }}>
    <Capsule icon="clock-outline" label={s.daily} value={formatCountdown(countdownTo(nextDailyReset(now), now))} />
    <Capsule icon="coffee-outline" label={s.cafe} value={formatCountdown(countdownTo(nextCafeReset(now), now))} />
    <Capsule icon="hand-heart-outline" label={s.headpat} value={formatCountdown(countdownTo(nextHeadpatReset(now), now))} />
  </ScrollView>;
}
