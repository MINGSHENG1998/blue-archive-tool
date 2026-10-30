import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppCard, EmptyState, PortraitCrop, PressScale, SignalButton, Stamp } from '@/components/schale';
import { homeStrings } from '@/constants/strings/home';
import { fmt, useStrings } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useGameData } from '@/contexts/gamedata-context';
import { useLanguage } from '@/contexts/language-context';
import { useBanners } from '@/contexts/banners-context';
import { useColors } from '@/hooks/useColors';
import { studentPortraitUris } from '@/services/gamedata';
import { bannerStudentName, localDuration, recruitmentView } from '@/services/home/view';
import { useFocusedNow } from './useFocusedNow';

const ART_H = 196;
const ART_W = 108;
const ART_STEP = 54;
const MAX_ART = 2;

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
  const shown = characters.filter(char => char.studentId).slice(0, MAX_ART);
  const extra = names.length > 3 ? fmt(s.more, { n: names.length - 3 }) : '';
  const endsLocal = new Date(endAt).toLocaleString(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const artWidth = shown.length ? ART_W + ART_STEP * (shown.length - 1) : 0;

  return <AppCard padding={0} style={styles.card}>
    {/* The stage: a sky wash whose bottom edge crops the figures, like the in-game recruit frame. */}
    <View style={styles.stage}>
      <LinearGradient colors={[c.skyTop, c.skyMid]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.art, { width: artWidth }]} pointerEvents="box-none">
        {shown.map((char, i) => <PressScale key={char.studentId} spark={false} haptic={false} accessibilityLabel={names[characters.indexOf(char)]}
          style={[styles.figure, { right: (shown.length - 1 - i) * ART_STEP, zIndex: MAX_ART - i }]}
          onPress={() => router.push({ pathname: '/student/[id]', params: { id: char.studentId! } })}>
          <PortraitCrop uris={studentPortraitUris(char.studentId!)} label={names[characters.indexOf(char)]} width={ART_W} height={ART_H} />
        </PressScale>)}
      </View>
      {/* The copy column stops where the art begins, so names never sit on a face. */}
      <View style={[styles.copy, { paddingRight: artWidth + 8 }]}>
        <Stamp label={s.live} tone="live" pulse on={c.skyTop} />
        <Text style={[type.caption, { color: c.textSecondary, marginTop: 14 }]}>{s.recruiting}</Text>
        <Text style={[type.section, { color: c.textPrimary, marginTop: 2 }]} numberOfLines={4}>
          {names.slice(0, 3).join(', ')}{extra ? <Text style={{ color: c.textSecondary }}>{` ${extra}`}</Text> : null}
        </Text>
      </View>
    </View>
    <View style={styles.footer}>
      <View style={styles.flex}>
        <Text style={[type.numXL, { color: c.textPrimary }]}>{localDuration((endAt - now) / 1000, s)}</Text>
        <Text style={[type.caption, { color: c.textMuted }]}>{fmt(s.endsAt, { date: endsLocal })}</Text>
      </View>
      <SignalButton label={s.plan} icon="chart-timeline-variant" onPress={() => router.push('/tools/planner')} />
    </View>
  </AppCard>;
}

const styles = StyleSheet.create({
  card: { marginBottom: 28, overflow: 'hidden' },
  stage: { minHeight: ART_H + 14, overflow: 'hidden' },
  art: { position: 'absolute', right: 6, bottom: 0, height: ART_H },
  figure: { position: 'absolute', top: 0, width: ART_W, height: ART_H },
  copy: { paddingTop: 18, paddingLeft: 18, paddingBottom: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  flex: { flex: 1 },
});
