import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppCard, FilterPill, Icon, PressScale, SignalButton, SlantPortrait, Stamp } from '@/components/schale';
import { atkTypeLabels, defTypeLabels } from '@/constants/i18n';
import { bannerStrings } from '@/constants/strings/banners';
import { homeStrings } from '@/constants/strings/home';
import { fmt, useStrings } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useGameData } from '@/contexts/gamedata-context';
import { useLanguage } from '@/contexts/language-context';
import { useWatchlist, useRoster } from '@/contexts/user-data-context';
import { useColors } from '@/hooks/useColors';
import { characterImageUris } from '@/services/gamedata';
import { daysUntil, isLive, type Banner } from '@/services/banners';
import { calendarUrl, scheduleDate } from '@/services/banners/view';
import { bannerStudentName, localDuration } from '@/services/home/view';
import { categoryColors, type BannerTone } from '@/constants/categoryColors';
import { ownsUnit, unitIdOf } from '@/services/userdata/roster';
import { watchesUnit } from '@/services/students/view';

export function BannerFile({ banner, now, expanded, onToggle }: { banner: Banner; now: number; expanded: boolean; onToggle: () => void }) {
  const c = useColors();
  const type = useType();
  const s = useStrings(bannerStrings);
  const duration = useStrings(homeStrings);
  const { locale } = useLanguage();
  const { byId, displayName } = useGameData();
  const watch = useWatchlist();
  const roster = useRoster();
  const router = useRouter();
  const live = isLive(banner, now);
  const names = banner.characters.map(char => bannerStudentName(char, locale, byId, displayName) || s.unknown);
  const unitFor = (id: number) => byId[id] ?? { Id: id };
  const isWatched = (id: number) => watchesUnit(watch.ids, unitFor(id));
  const isOwned = (id: number) => ownsUnit(roster.entries, unitFor(id));
  const toggleWatch = (id: number) => {
    if (!watch.ready) return;
    const student = unitFor(id), unit = unitIdOf(student);
    watch.setWatched(unit, !isWatched(id));
    if (student.LinkedCharacterId !== undefined) watch.setWatched(unit === student.Id ? student.LinkedCharacterId : student.Id, false);
  };
  const toggleOwned = (id: number, rarity: number) => {
    if (!roster.ready) return;
    const student = unitFor(id), unit = unitIdOf(student);
    roster.set(unit, isOwned(id) ? null : { stars: Math.min(5, Math.max(1, rarity)) });
    if (student.LinkedCharacterId !== undefined) roster.set(unit === student.Id ? student.LinkedCharacterId : student.Id, null);
  };
  const openCalendar = () => { void Linking.openURL(calendarUrl(banner, fmt(s.calendarTitle, { names: names.join(' / ') }), s.calendarNote)).catch(() => Alert.alert(s.calendar, s.calendarError)); };
  const typeName = ['New', 'Rerun', 'Fes', 'Collab'].includes(banner.rawType) ? s[banner.type] : banner.rawType || s[banner.type];
  return <AppCard padding={0} style={{ marginBottom: 12 }}>
    <PressScale onPress={onToggle} accessibilityLabel={`${names.join(', ')}. ${expanded ? s.hide : s.show}`} accessibilityState={{ expanded }} style={styles.summary}>
      <View style={styles.line}><Stamp label={typeName} tone={banner.type.toLowerCase() as BannerTone} animate={false} />{live ? <Stamp label={s.live} tone="live" size="sm" animate={false} /> : <Stamp label={fmt(s.inDays, { days: daysUntil(banner.startAt, now) })} tone="muted" size="sm" animate={false} />}<View style={{ flex: 1 }} /><Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={22} color={c.textMuted} /></View>
      <Text style={[type.section, { color: c.textPrimary, marginTop: 10 }]}>{names.join(', ') || typeName}</Text>
      <Text style={[type.caption, { color: c.textSecondary, marginTop: 4 }]}>{scheduleDate(banner.startAt, locale)} - {scheduleDate(banner.endAt, locale)}</Text>
      <Text style={[type.num, { color: live ? c.primaryInk : c.textPrimary, marginTop: 8 }]}>{fmt(live ? s.endsIn : s.startsIn, { time: localDuration(((live ? banner.endAt : banner.startAt) - now) / 1000, duration) })}</Text>
    </PressScale>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.portraits}>
      {banner.characters.map((char, index) => {
        const id = char.studentId;
        const watched = !!id && isWatched(id);
        const owned = !!id && isOwned(id);
        return <View key={char.id} style={{ width: 76, alignItems: 'center', gap: 3 }}>
          <SlantPortrait uris={characterImageUris(char)} label={names[index]} size={60} caption={names[index]} dimmed={owned}
            onPress={id ? () => router.push({ pathname: '/student/[id]', params: { id } }) : undefined}
            badge={id ? <PressScale spark={false} disabled={!watch.ready} onPress={event => { event.stopPropagation(); toggleWatch(id); }} accessibilityLabel={fmt(watched ? s.unwatch : s.watch, { name: names[index] })} accessibilityState={{ selected: watched }} hitSlop={8} style={[styles.star, { backgroundColor: c.elevatedBg, borderColor: c.isDark ? c.hairline : c.surfaceBorder }]}><Icon name={watched ? 'star' : 'star-outline'} size={16} color={watched ? categoryColors.star : c.textMuted} /></PressScale> : undefined} />
          {owned ? <Text style={[type.caption, { color: c.textMuted }]}>{s.owned}</Text> : null}
        </View>;
      })}
    </ScrollView>
    {expanded ? <View style={[styles.details, { borderTopColor: c.hairline }]}>
            {banner.characters.map((char, index) => {
        const id = char.studentId;
        const owned = !!id && isOwned(id);
        return <View key={char.id} style={[styles.student, { borderBottomColor: c.hairline }]}>
          <View style={[styles.line, { flexWrap: 'wrap' }]}><Text style={[type.bodyStrong, { color: c.textPrimary }]}>{names[index]}</Text><Text style={[type.caption, { color: c.primaryInk }]}>{'★'.repeat(Math.min(5, Math.max(1, char.rarity)))}</Text>{char.isNew ? <Stamp label={s.newStudent} tone="new" size="sm" animate={false} /> : null}{char.isLimited ? <Stamp label={s.limited} tone="fes" size="sm" animate={false} /> : null}</View>
          <Text style={[type.caption, { color: c.textSecondary, marginVertical: 5 }]}>{[char.cls ? s[char.cls] : null, char.atkType ? atkTypeLabels[char.atkType]?.[locale] ?? char.atkType : null, char.defType ? defTypeLabels[char.defType]?.[locale] ?? char.defType : null].filter(Boolean).join(' · ')}</Text>
          {id ? <View style={[styles.line, { flexWrap: 'wrap' }]}>
            <FilterPill icon={isWatched(id) ? 'star' : 'star-outline'} label={fmt(isWatched(id) ? s.unwatch : s.watch, { name: names[index] })} selected={isWatched(id)} disabled={!watch.ready} onPress={() => toggleWatch(id)} />
            <FilterPill icon={owned ? 'check-circle' : 'plus-circle-outline'} label={owned ? s.owned : s.register} accessibilityLabel={fmt(owned ? s.unown : s.own, { name: names[index] })} selected={owned} disabled={!roster.ready} onPress={() => toggleOwned(id, char.rarity)} />
          </View> : <Text style={[type.caption, { color: c.textMuted }]}>{s.unavailable}</Text>}
        </View>;
      })}
      <SignalButton label={s.calendar} variant="ghost" compact icon="calendar-plus" onPress={openCalendar} style={{ alignSelf: 'flex-start', marginTop: 12 }} />
    </View> : null}
  </AppCard>;
}
const styles = StyleSheet.create({ line: { flexDirection: 'row', gap: 10, alignItems: 'center' }, summary: { padding: 18, minHeight: 44 }, portraits: { gap: 10, paddingHorizontal: 18, paddingTop: 2, paddingBottom: 18 }, star: { width: 28, height: 28, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, details: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth }, student: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth } });
