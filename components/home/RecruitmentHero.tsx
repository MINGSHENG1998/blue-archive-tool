import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppCard, EmptyState, PortraitCrop, PressScale, SignalButton, SlantPortrait, Stamp } from '@/components/schale';
import { homeStrings } from '@/constants/strings/home';
import { fmt, useStrings } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useGameData } from '@/contexts/gamedata-context';
import { useLanguage } from '@/contexts/language-context';
import { useBanners } from '@/contexts/banners-context';
import { useColors } from '@/hooks/useColors';
import { characterImageUris, studentPortraitUris } from '@/services/gamedata';
import { bannerStudentName, localDuration, recruitmentView } from '@/services/home/view';
import { useFocusedNow } from './useFocusedNow';

// The window shows the art from the top of its canvas (where tall halos sit)
// to the hips, a little narrower than the art itself, and starts HEADROOM
// below the card's top edge so nothing touches it.
const ART_H = 200;
const ART_W = 160;
const ART_SPAN = 0.58;
const HEADROOM = 14;
const AVATAR = 26;

/** Live recruitment never depends on the success of the Firestore request. */
export function RecruitmentHero({ showEmpty = true }: { showEmpty?: boolean }) {
  const s = useStrings(homeStrings);
  const type = useType();
  const c = useColors();
  const router = useRouter();
  const now = useFocusedNow();
  const { locale } = useLanguage();
  const { config, byId, displayName } = useGameData();
  const { banners } = useBanners();
  const windows = recruitmentView(config, byId, banners, now);
  if (!windows.length) return showEmpty ? <AppCard padding={16} style={styles.card}><EmptyState title={s.noRecruit} body={s.noRecruitBody} action={{ label: s.schedule, onPress: () => router.replace('/(tabs)/banner') }} /></AppCard> : null;

  const endAt = Math.min(...windows.map(window => window.endAt));
  const characters = [...new Map(windows.flatMap(window => window.characters).map(char => [char.studentId ?? char.id, char])).values()];
  const names = characters.map(char => bannerStudentName(char, locale, byId, displayName));
  // One featured student carries the art (the first pickup, as the game's own
  // banner does); everyone on the banner shows as an avatar under the names.
  const featured = characters.find(char => char.studentId);
  const featuredName = featured ? names[characters.indexOf(featured)] : '';
  const extra = names.length > 3 ? fmt(s.more, { n: names.length - 3 }) : '';
  const endsLocal = new Date(endAt).toLocaleString(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const artWidth = featured ? ART_W : 0;
  const openStudent = (id: number) => router.push({ pathname: '/student/[id]', params: { id } });

  return <AppCard padding={0} style={styles.card}>
    {/* The stage: a sky wash whose bottom edge crops the figures, like the in-game recruit frame. */}
    <View style={styles.stage}>
      <LinearGradient colors={[c.skyTop, c.skyMid, c.stageEnd]} locations={[0, 0.55, 1]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      {featured ? <PressScale spark={false} haptic={false} accessibilityLabel={featuredName} style={styles.art}
        onPress={() => openStudent(featured.studentId!)}>
        <PortraitCrop uris={studentPortraitUris(featured.studentId!)} label={featuredName} width={ART_W} height={ART_H} span={ART_SPAN} />
      </PressScale> : null}
      {/* The copy column stops where the art begins, so names never sit on a face. */}
      <View style={[styles.copy, { paddingRight: artWidth + 8 }]}>
        <Stamp label={s.live} tone="live" pulse on={c.skyTop} />
        <Text style={[type.caption, { color: c.textSecondary, marginTop: 14 }]}>{s.recruiting}</Text>
        <Text style={[type.section, { color: c.textPrimary, marginTop: 2 }]} numberOfLines={4}>
          {names.slice(0, 3).join(', ')}{extra ? <Text style={{ color: c.textSecondary }}>{` ${extra}`}</Text> : null}
        </Text>
        <View style={styles.avatars}>
          {characters.map((char, i) => <SlantPortrait key={char.studentId ?? char.id} uris={characterImageUris(char)} label={names[i]} size={AVATAR}
            onPress={char.studentId ? () => openStudent(char.studentId!) : undefined} />)}
        </View>
      </View>
    </View>
    <View style={styles.footer}>
      <View style={styles.flex}>
        <Text style={[type.numXL, { color: c.secondaryInk }]}>{localDuration((endAt - now) / 1000, s)}</Text>
        <Text style={[type.caption, { color: c.textMuted }]}>{fmt(s.endsAt, { date: endsLocal })}</Text>
      </View>
      <SignalButton label={s.plan} icon="chart-timeline-variant" onPress={() => router.push('/tools/planner')} />
    </View>
  </AppCard>;
}

const styles = StyleSheet.create({
  card: { marginBottom: 28, overflow: 'hidden' },
  stage: { minHeight: ART_H + HEADROOM, overflow: 'hidden' },
  art: { position: 'absolute', right: 0, bottom: 0, width: ART_W, height: ART_H },
  copy: { paddingTop: 18, paddingLeft: 18, paddingBottom: 18 },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  flex: { flex: 1 },
});
