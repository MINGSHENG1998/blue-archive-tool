import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { AppCard, Icon, SignalButton } from '@/components/schale';
import { homeStrings } from '@/constants/strings/home';
import { useStrings } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useAppConfig } from '@/contexts/app-config-context';
import { useLanguage } from '@/contexts/language-context';
import { useColors } from '@/hooks/useColors';
import { activeAnnouncement, announcementText } from '@/services/appConfig';
import { homeStyles } from './HomeRow';

/** The remote Schale notice. Always first on Home when one is active; not configurable. */
export function AnnouncementCard({ now }: { now: number }) {
  const c = useColors();
  const type = useType();
  const s = useStrings(homeStrings);
  const { locale } = useLanguage();
  const { config } = useAppConfig();
  const announcement = activeAnnouncement(config, now);
  if (!announcement) return null;
  const open = () => { if (announcement.url) void Linking.openURL(announcement.url).catch(() => Alert.alert(s.notice, s.linkError)); };
  return <AppCard padding={16} style={homeStyles.block}>
    <View style={styles.inline}><Icon name="bullhorn-outline" size={18} color={c.primaryInk} /><Text style={[type.labelCaps, { color: c.primaryInk }]}>{s.notice}</Text></View>
    <Text style={[type.body, { color: c.textPrimary, marginTop: 8 }]}>{announcementText(announcement, locale)}</Text>
    {announcement.url ? <SignalButton variant="ghost" compact label={s.readMore} icon="open-in-new" onPress={open} style={styles.more} /> : null}
  </AppCard>;
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  more: { marginTop: 12, alignSelf: 'flex-start' },
});
