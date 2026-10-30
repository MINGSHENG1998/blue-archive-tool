import { Fragment, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppCard, EmptyState, FilterPill, Icon, IndexTab, PressScale, ScreenLayout, SearchField, Skeleton, SlantSegmented } from '@/components/schale';
import { RecruitmentHero } from '@/components/home/RecruitmentHero';
import { useFocusedNow } from '@/components/home/useFocusedNow';
import { BannerFile } from '@/components/banners/BannerFile';
import { bannerStrings } from '@/constants/strings/banners';
import { fmt, useStrings } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useBanners } from '@/contexts/banners-context';
import { useWatchlist } from '@/contexts/user-data-context';
import { useGameData } from '@/contexts/gamedata-context';
import { useLanguage } from '@/contexts/language-context';
import { useColors } from '@/hooks/useColors';
import { filterSchedule, nowMarkerIndex, scheduleMonth, type ScheduleFilter, type ScheduleSort } from '@/services/banners/view';
import InlineAd from '@/services/ads/InlineAd';

// The ScrollView mounts every ad: preserve the existing native-view cap.
const BANNERS_PER_AD = 5;
const MAX_INLINE_ADS = 3;
const FILTERS: ScheduleFilter[] = ['All', 'New', 'Rerun', 'Fes', 'Collab', 'Watched'];

export default function BannerScreen() {
  const c = useColors();
  const type = useType();
  const s = useStrings(bannerStrings);
  const { locale } = useLanguage();
  const schedule = useBanners();
  const watch = useWatchlist();
  const { byId } = useGameData();
  const now = useFocusedNow();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ScheduleFilter>('All');
  const [sort, setSort] = useState<ScheduleSort>('earliest');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const filtered = useMemo(() => filterSchedule(schedule.banners, query, locale, filter, watch.ids, sort, byId), [schedule.banners, query, locale, filter, watch.ids, sort, byId]);
  const refresh = async () => { setRefreshing(true); try { await schedule.refresh(); } finally { setRefreshing(false); } };
  const reset = () => { setQuery(''); setFilter('All'); setSort('earliest'); };
  const nowIndex = nowMarkerIndex(filtered, now, sort);
  const nowMarker = <View style={styles.now}><View style={[styles.dot, { backgroundColor: c.halo }]} /><Text style={[type.labelCaps, { color: c.primaryInk }]}>{s.now}</Text><View style={[styles.rule, { backgroundColor: c.halo }]} /><Text style={[type.num, { color: c.textSecondary, fontSize: 12 }]}>{new Date(now).toLocaleDateString(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' })} UTC</Text></View>;
  return <ScreenLayout title={s.title} onRefresh={() => void refresh()} refreshing={refreshing}
    headerRight={<PressScale onPress={() => void refresh()} accessibilityLabel={s.refresh} style={styles.refresh}><Icon name="refresh" size={24} color={c.primaryInk} /></PressScale>}>
    <RecruitmentHero showEmpty={false} />
    <View style={styles.filters}>
      <SearchField value={query} onChangeText={setQuery} placeholder={s.search} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 6, paddingHorizontal: 3 }}>{FILTERS.map(value => <FilterPill key={value} label={value === 'All' ? s.all : value === 'Watched' ? s.watched : s[value]} icon={value === 'Watched' ? 'star-outline' : undefined} selected={filter === value} onPress={() => setFilter(value)} />)}</ScrollView>
      <SlantSegmented value={sort} onChange={setSort} options={[{ value: 'earliest', label: s.earliest }, { value: 'latest', label: s.latest }, { value: 'rarity', label: s.rarity }]} />
    </View>
    <IndexTab title={s.timeline} style={{ marginBottom: 4 }} right={<Text style={[type.caption, { color: c.textMuted }]}>{fmt(s.count, { count: filtered.length })}</Text>} />
    {schedule.status === 'loading' ? <View accessibilityLabel={s.refresh} style={{ gap: 18, marginBottom: 24 }}>{[0, 1, 2].map(key => <AppCard key={key} padding={18}><Skeleton height={18} width="45%" /><View style={{ height: 14 }} /><Skeleton height={24} width="80%" /><View style={{ height: 16 }} /><Skeleton height={80} /></AppCard>)}</View> : schedule.status === 'error' ? <AppCard padding={16}><EmptyState title={s.error} body={s.errorBody} action={{ label: s.retry, onPress: () => void refresh() }} /></AppCard> : !filtered.length ? <EmptyState title={schedule.banners.length ? s.empty : s.noSchedule} body={schedule.banners.length ? s.emptyBody : s.noScheduleBody} action={{ label: schedule.banners.length ? s.clear : s.retry, onPress: schedule.banners.length ? reset : () => void refresh() }} /> : <View style={{ position: 'relative' }}>
      {nowIndex === null ? nowMarker : null}
      {filtered.map((banner, index) => {
        const month = scheduleMonth(banner.startAt);
        const monthStart = index === 0 || month !== scheduleMonth(filtered[index - 1].startAt);
        return <Fragment key={banner.id}>
          {index === nowIndex ? nowMarker : null}
          {monthStart ? <View style={styles.month}><Text style={[type.labelCaps, { color: c.textSecondary }]}>{new Date(banner.startAt).toLocaleDateString(locale, { timeZone: 'UTC', month: 'long', year: 'numeric' })}</Text></View> : null}
          <BannerFile banner={banner} now={now} expanded={expanded === banner.id} onToggle={() => setExpanded(previous => previous === banner.id ? null : banner.id)} />
          {(index + 1) % BANNERS_PER_AD === 0 && (index + 1) / BANNERS_PER_AD <= MAX_INLINE_ADS ? <View style={{ marginVertical: 24 }}><InlineAd /></View> : null}
        </Fragment>;
      })}
      {nowIndex === filtered.length ? nowMarker : null}
    </View>}
    <Text style={[type.caption, { color: c.textMuted, marginTop: 20 }]}>{s.prediction}</Text>
    {schedule.fetchedAt ? <View style={styles.footnote}><Text style={[type.caption, { color: c.textMuted, flex: 1 }]}>{schedule.source === 'cache' ? `${s.offline} · ` : ''}{fmt(s.updated, { time: new Date(schedule.fetchedAt).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) })}</Text></View> : null}
    <View style={{ marginTop: 28 }}><InlineAd /></View>
  </ScreenLayout>;
}
const styles = StyleSheet.create({ filters: { gap: 6, marginBottom: 24 }, refresh: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, month: { paddingTop: 18, paddingBottom: 8 }, now: { flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 16 }, dot: { width: 7, height: 7, borderRadius: 4 }, rule: { flex: 1, height: 1 }, footnote: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 8 } });
