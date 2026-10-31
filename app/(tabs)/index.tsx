import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenLayout, AppCard, EmptyState, Icon, PressScale } from '@/components/schale';
import { AnnouncementCard } from '@/components/home/AnnouncementCard';
import { BirthdaysWidget } from '@/components/home/BirthdaysWidget';
import { ComingUpWidget } from '@/components/home/ComingUpWidget';
import { CustomizeHomeSheet } from '@/components/home/CustomizeHomeSheet';
import { DailyStudentWidget } from '@/components/home/DailyStudentWidget';
import { HappeningWidget } from '@/components/home/HappeningWidget';
import { homeStyles } from '@/components/home/HomeRow';
import { LobbyResources } from '@/components/home/LobbyResources';
import { RecruitmentHero } from '@/components/home/RecruitmentHero';
import { ToolsWidget } from '@/components/home/ToolsWidget';
import { useFocusedNow } from '@/components/home/useFocusedNow';
import { useHomeLayout } from '@/components/home/useHomeLayout';
import { homeStrings } from '@/constants/strings/home';
import { useStrings } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useGameData } from '@/contexts/gamedata-context';
import { useBanners } from '@/contexts/banners-context';
import { useLanguage } from '@/contexts/language-context';
import { useColors } from '@/hooks/useColors';
import { homeAdSlot, type HomeWidgetId } from '@/services/home/layout';
import { greetingKey } from '@/services/home/view';
import InlineAd from '@/services/ads/InlineAd';

export default function HomeScreen() {
  const c = useColors();
  const type = useType();
  const s = useStrings(homeStrings);
  const { locale } = useLanguage();
  const now = useFocusedNow();
  const game = useGameData();
  const schedule = useBanners();
  const home = useHomeLayout();
  const [editing, setEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => { setRefreshing(true); try { await Promise.all([game.refresh(), schedule.refresh()]); } finally { setRefreshing(false); } };
  const today = new Date(now).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  const customize = () => setEditing(true);

  const widget = (id: HomeWidgetId) => {
    switch (id) {
      case 'resources': return <LobbyResources key={id} />;
      case 'recruitment': return <RecruitmentHero key={id} />;
      case 'happening': return <HappeningWidget key={id} now={now} />;
      case 'comingUp': return <ComingUpWidget key={id} now={now} />;
      case 'dailyStudent': return <DailyStudentWidget key={id} now={now} />;
      case 'birthdays': return <BirthdaysWidget key={id} now={now} />;
      case 'tools': return <ToolsWidget key={id} tools={home.layout.pinnedTools} onCustomize={customize} />;
    }
  };

  return <ScreenLayout title={s[greetingKey(now)]} subtitle={today} onRefresh={() => void refresh()} refreshing={refreshing}
    headerRight={<PressScale spark={false} onPress={customize} accessibilityLabel={s.customize} style={styles.edit}><Icon name="view-dashboard-edit-outline" size={24} color={c.primaryInk} /></PressScale>}>
    <AnnouncementCard now={now} />

    {home.settled ? home.visible.length ? home.visible.flatMap((id, i) => i === homeAdSlot(home.visible)
        ? [widget(id), <View key="ad" style={styles.ad}><InlineAd /></View>] : [widget(id)])
      : <AppCard padding={16} style={homeStyles.block}><EmptyState title={s.emptyTitle} body={s.emptyBody} action={{ label: s.customize, onPress: customize }} /></AppCard>
      : null}

    <Text style={[type.caption, styles.source, { color: c.textMuted }]}>{s.dataSource}</Text>
    <CustomizeHomeSheet visible={editing} onClose={() => setEditing(false)} home={home} />
  </ScreenLayout>;
}

const styles = StyleSheet.create({
  edit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  // Every widget ends with its own section gap, so the footnote only needs a nudge.
  source: { marginTop: 8, textAlign: 'center' },
  ad: { marginBottom: 28 },
});
