import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppCard, Icon, SignalButton } from '@/components/schale';
import { useStrings } from '@/constants/strings/define';
import { supportStrings } from '@/constants/strings/support';
import { useType } from '@/constants/typography';
import { useAdFreeContext } from '@/contexts/ad-free-context';
import { useColors } from '@/hooks/useColors';
import { dayKey, loadPrompt, retirePrompt, savePrompt, visitPrompt } from '@/services/home/supportPrompt';
import { homeStyles } from './HomeRow';

/** One-time "support the app" card for returning users. See services/home/supportPrompt. */
export function SupportPromptCard({ now }: { now: number }) {
  const c = useColors();
  const type = useType();
  const s = useStrings(supportStrings);
  const ad = useAdFreeContext();
  const [show, setShow] = useState(false);
  const day = dayKey(now);
  const eligible = !ad.hasTipped && !ad.passUntil;

  useEffect(() => {
    if (!ad.settled) return;
    let alive = true;
    void loadPrompt().then(prev => {
      const next = visitPrompt(prev, Date.now(), eligible);
      if (alive) setShow(next.show);
      return savePrompt(next.state);
    });
    return () => { alive = false; };
  }, [day, ad.settled, eligible]);

  if (!show || !eligible) return null;
  const retire = () => { setShow(false); void retirePrompt(); };
  const support = () => { retire(); router.navigate({ pathname: '/other', params: { support: '1' } } as never); };

  return <AppCard padding={16} style={homeStyles.block}>
    <View style={styles.inline}><Icon name="heart-outline" size={18} color={c.primaryInk} /><Text style={[type.labelCaps, { color: c.primaryInk }]}>{s.promptLabel}</Text></View>
    <Text style={[type.bodyStrong, { color: c.textPrimary, marginTop: 8 }]}>{s.promptTitle}</Text>
    <Text style={[type.body, { color: c.textSecondary, marginTop: 4 }]}>{s.promptBody}</Text>
    <View style={styles.actions}>
      <SignalButton compact label={s.promptSupport} icon="heart-outline" onPress={support} />
      <SignalButton compact variant="ghost" label={s.promptDismiss} onPress={retire} />
    </View>
  </AppCard>;
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
});
