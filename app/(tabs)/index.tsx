import { useState, type ReactNode } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenLayout, AppCard, Icon, IndexTab, MomoTalkCard, PressScale, SignalButton, SlantPortrait, Stamp, type IconName } from '@/components/schale';
import { LobbyResources } from '@/components/home/LobbyResources';
import { RecruitmentHero } from '@/components/home/RecruitmentHero';
import { useFocusedNow } from '@/components/home/useFocusedNow';
import { homeStrings } from '@/constants/strings/home';
import { fmt, useStrings } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useGameData, effectiveBulletTypes, liveEvents, liveRaids } from '@/contexts/gamedata-context';
import { useBanners } from '@/contexts/banners-context';
import { useAppConfig } from '@/contexts/app-config-context';
import { useWatchlist } from '@/contexts/user-data-context';
import { useLanguage } from '@/contexts/language-context';
import { useColors } from '@/hooks/useColors';
import { upcomingBirthdays, studentIconUris, studentOfTheDay, characterImageUris } from '@/services/gamedata';
import { activeAnnouncement, announcementText } from '@/services/appConfig';
import { bannerStudentName, greetingKey, localDuration, watchedRecruitments } from '@/services/home/view';

export default function HomeScreen() {
  const router = useRouter();
  const c = useColors();
  const type = useType();
  const s = useStrings(homeStrings);
  const { locale } = useLanguage();
  const now = useFocusedNow();
  const game = useGameData();
  const schedule = useBanners();
  const { config } = useAppConfig();
  const watch = useWatchlist();
  const [refreshing, setRefreshing] = useState(false);
  const announcement = activeAnnouncement(config, now);
  const events = liveEvents(game.config, new Date(now));
  const raids = liveRaids(game.config, game.raids, new Date(now), { names: game.raidNames });
  const student = studentOfTheDay(game.students, new Date(now));
  const birthdays = upcomingBirthdays(game.students, new Date(now)).filter(entry => entry.daysUntil === 0);
  const watched = watchedRecruitments(schedule.banners, watch.ids, game.byId, now);
  const next = schedule.next;
  const refresh = async () => { setRefreshing(true); try { await Promise.all([game.refresh(), schedule.refresh()]); } finally { setRefreshing(false); } };
  const openAnnouncement = () => { if (announcement?.url) void Linking.openURL(announcement.url).catch(() => Alert.alert(s.notice, s.linkError)); };
  const today = new Date(now).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  const eventRows = events.map(event => ({ event, name: game.eventName(event.id) })).filter(row => row.name);

  return <ScreenLayout title={s[greetingKey(now)]} subtitle={today} onRefresh={() => void refresh()} refreshing={refreshing}>
    <LobbyResources />

    {announcement ? <AppCard padding={16} style={styles.block}>
      <View style={styles.inline}><Icon name="bullhorn-outline" size={18} color={c.primaryInk} /><Text style={[type.labelCaps, { color: c.primaryInk }]}>{s.notice}</Text></View>
      <Text style={[type.body, { color: c.textPrimary, marginTop: 8 }]}>{announcementText(announcement, locale)}</Text>
      {announcement.url ? <SignalButton variant="ghost" compact label={s.readMore} icon="open-in-new" onPress={openAnnouncement} style={{ marginTop: 12, alignSelf: 'flex-start' }} /> : null}
    </AppCard> : null}

    <RecruitmentHero />

    {eventRows.length || raids.length ? <>
      <IndexTab title={s.happening} style={styles.heading} />
      <AppCard padding={0} style={styles.block}>
        {eventRows.map(({ event, name }, i) => <Row key={`event-${event.id}`} first={i === 0} icon="flag-variant" title={name!}
          caption={fmt(s.ends, { time: localDuration(event.secondsLeft, s) })} meta={s.event} />)}
        {raids.map((raid, i) => {
          const effective = [...new Set(raid.armorTypes.flatMap(armor => effectiveBulletTypes(armor, game.config)))].map(attack => game.label('BulletType', attack));
          return <Row key={`${raid.kind}-${raid.id}`} first={!eventRows.length && i === 0} icon="sword-cross" title={raid.name} meta={s.raid}
            caption={fmt(s.ends, { time: localDuration(raid.secondsLeft, s) })} onPress={() => router.push('/tools/raid')}
            extra={effective.length ? <View style={styles.tags}>{effective.map(label => <Stamp key={label} label={fmt(s.effective, { types: label })} tone="primary" size="sm" />)}</View> : null} />;
        })}
      </AppCard>
    </> : null}

    <IndexTab title={s.comingUp} style={styles.heading}
      right={<PressScale spark={false} onPress={() => router.replace('/(tabs)/banner')} accessibilityLabel={s.schedule}><Text style={[type.labelCaps, { color: c.primaryInk }]}>{s.schedule}</Text></PressScale>} />
    <AppCard padding={0} style={styles.block}>
      {next ? <Row first onPress={() => router.replace('/(tabs)/banner')}
        lead={<View style={styles.cluster}>{next.characters.slice(0, 3).map((char, i) => <SlantPortrait key={char.id} uris={characterImageUris(char)} label={char.name} size={34} style={{ marginLeft: i ? -12 : 0 }} />)}</View>}
        meta={s.next} title={next.characters.map(char => bannerStudentName(char, locale, game.byId, game.displayName)).join(', ')}
        caption={fmt(s.starts, { time: localDuration((next.startAt - now) / 1000, s) })} /> : null}
      {watched.map(({ id, banner, char }, i) => <Row key={id} first={!next && i === 0} onPress={() => router.push({ pathname: '/student/[id]', params: { id } })}
        lead={<SlantPortrait uris={studentIconUris(id)} label={char.name} size={34} />}
        meta={s.watching} title={bannerStudentName(char, locale, game.byId, game.displayName)}
        caption={fmt(s.starts, { time: localDuration((banner.startAt - now) / 1000, s) })} />)}
      {!watched.length ? <Row first={!next} icon="star-outline" title={watch.ids.length ? s.watchNoSchedule : s.watchEmpty}
        onPress={() => router.replace('/(tabs)/students')} /> : null}
    </AppCard>

    {student ? <>
      <IndexTab title={s.dailyStudent} style={styles.heading} />
      <MomoTalkCard studentId={student.Id} uris={studentIconUris(student.Id)} name={game.displayName(student)} header={s.dailyStudent} message={s.dailyMessage} unread={1}
        onPress={() => router.push({ pathname: '/student/[id]', params: { id: student.Id } })} style={{ marginBottom: 12 }} />
    </> : null}
    {birthdays.map(({ student: birthday }) => <MomoTalkCard key={birthday.Id} studentId={birthday.Id} uris={studentIconUris(birthday.Id)} name={game.displayName(birthday)}
      message={s.birthdayMessage} header={s.birthdays} typing={false} onPress={() => router.push({ pathname: '/student/[id]', params: { id: birthday.Id } })} style={{ marginBottom: 12 }} />)}
    <PressScale spark={false} onPress={() => router.push('/birthdays')} style={styles.link} accessibilityLabel={s.birthdayAll}>
      <Icon name="cake-variant-outline" size={18} color={c.primaryInk} />
      <Text style={[type.labelCaps, { color: c.primaryInk }]}>{s.birthdayAll}</Text>
    </PressScale>

    <Text style={[type.caption, { color: c.textMuted, marginTop: 28, textAlign: 'center' }]}>{s.dataSource}</Text>
  </ScreenLayout>;
}

/** One line in a grouped list: optional leading art/icon, small label, title, caption. */
function Row({ first, icon, lead, meta, title, caption, extra, onPress }: {
  first?: boolean; icon?: IconName; lead?: ReactNode; meta?: string; title: string; caption?: string; extra?: ReactNode; onPress?: () => void;
}) {
  const c = useColors();
  const type = useType();
  const body = <View style={[styles.row, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.isDark ? c.hairline : c.surfaceBorder }]}>
    {lead ?? (icon ? <View style={styles.iconSlot}><Icon name={icon} size={22} color={c.primaryInk} /></View> : null)}
    <View style={styles.flex}>
      {meta ? <Text style={[type.caption, { color: c.textMuted }]}>{meta}</Text> : null}
      <Text style={[type.bodyStrong, { color: c.textPrimary }]} numberOfLines={2}>{title}</Text>
      {caption ? <Text style={[type.caption, { color: c.textSecondary }]}>{caption}</Text> : null}
      {extra}
    </View>
    {onPress ? <Icon name="chevron-right" size={20} color={c.textMuted} /> : null}
  </View>;
  return onPress ? <PressScale spark={false} onPress={onPress} accessibilityLabel={title}>{body}</PressScale> : body;
}

const styles = StyleSheet.create({
  heading: { marginBottom: 10 },
  block: { marginBottom: 28 },
  inline: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  iconSlot: { width: 34, alignItems: 'center' },
  cluster: { flexDirection: 'row' },
  flex: { flex: 1, gap: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', minHeight: 44 },
});
