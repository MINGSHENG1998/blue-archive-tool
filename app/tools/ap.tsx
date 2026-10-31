import React, { useEffect, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { ScreenLayout } from '@/components/ScreenLayout';
import { AppCard } from '@/components/AppCard';
import { NavBar } from '@/components/schale/NavBar';
import { IndexTab } from '@/components/schale/IndexTab';
import { CostGauge } from '@/components/schale/CostGauge';
import { SignalButton } from '@/components/schale/SignalButton';
import { PressScale } from '@/components/schale/PressScale';
import { BottomSheet } from '@/components/schale/BottomSheet';
import { Icon } from '@/components/schale/Icon';
import { ItemInput } from '@/components/schale/Item';
import { useAp } from '@/contexts/user-data-context';
import { useLanguage } from '@/contexts/language-context';
import { AP_REGEN_MS, DEFAULT_AP_CAP, MAX_AP, MAX_AP_CAP } from '@/services/userdata/ap';
import { QUICK_SPEND, countdown, sameLocalDay, splitRemaining } from '@/services/gacha/apView';
import { gameIcons } from '@/constants/gameIcons';
import { RADIUS } from '@/constants/layout';
import { apStrings } from '@/constants/strings/ap';
import { fmt, useStrings } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';

function Rule({ lead, text }: { lead: ReactNode; text: string }) {
  const c = useColors(), type = useType();
  return <View style={styles.rule}><View style={styles.ruleLead}>{lead}</View><Text style={[type.body, { color: c.textSecondary, flex: 1 }]}>{text}</Text></View>;
}

export default function ApScreen() {
  const s = useStrings(apStrings), c = useColors(), type = useType(), { locale } = useLanguage();
  const ap = useAp(), focused = useIsFocused();
  const { ready: apReady, state: apState, current: readAp } = ap;
  const [now, setNow] = useState(Date.now), [reading, setReading] = useState('0'), [cap, setCap] = useState(String(DEFAULT_AP_CAP)), [spend, setSpend] = useState('20'), [message, setMessage] = useState(''), [how, setHow] = useState(false);
  useEffect(() => { if (apReady) { setReading(String(readAp() ?? 0)); setCap(String(apState?.cap ?? DEFAULT_AP_CAP)); } }, [apReady, apState, readAp]); // Only a saved reading changes the editor; timer ticks do not.
  useEffect(() => { if (!focused) return; setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, [focused]);
  const current = ap.current(now), maximum = ap.state?.cap ?? DEFAULT_AP_CAP, fullAt = ap.fullAt();
  const full = current !== null && current >= maximum;
  const validReading = /^\d+$/.test(reading) && Number(reading) <= MAX_AP && /^\d+$/.test(cap) && Number(cap) >= 1 && Number(cap) <= MAX_AP_CAP;
  const cost = Number(spend), canSpend = ap.ready && current !== null && /^\d+$/.test(spend) && cost > 0 && cost <= current;
  const doSpend = (amount: number) => { ap.spend(amount); setNow(Date.now()); setMessage(s.applied); };
  const phase = ap.state ? Math.max(0, now - ap.state.setAt) % AP_REGEN_MS : 0;
  const left = splitRemaining((fullAt ?? now) - now);
  const clock = fullAt === null ? '' : new Date(fullAt).toLocaleString(locale, sameLocalDay(fullAt, now) ? { hour: '2-digit', minute: '2-digit' } : { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  const caption = !ap.state ? s.regen : full ? s.noRegen : `${fmt(s.next, { time: countdown(AP_REGEN_MS - phase) })} · ${s.regen}`;
  return <ScreenLayout>
    <NavBar title={s.title} />
    <View style={styles.stack}>
      <AppCard style={{ gap: 14 }}>
        <View style={styles.hero} accessible accessibilityLabel={`${s.current}: ${current ?? '—'} / ${maximum}`}>
          <Image source={gameIcons.ap} style={styles.heroIcon} resizeMode="contain" />
          <Text adjustsFontSizeToFit minimumFontScale={.6} numberOfLines={1} style={[type.numXL, { color: full ? c.success : c.primaryInk, flexShrink: 1 }]}>{current ?? '—'}</Text>
          <Text style={[type.bodyStrong, { color: c.textMuted, paddingBottom: 6 }]}>/ {maximum}</Text>
        </View>
        {ap.state
          ? <Text style={[type.bodyStrong, { color: full ? c.success : c.textPrimary }]} numberOfLines={1}>{full ? s.full : fmt(s.fullAt, { time: clock, left: fmt(left.h ? s.hoursLeft : s.minutesLeft, left) })}</Text>
          : <Text style={[type.body, { color: c.textSecondary }]}>{ap.ready ? s.empty : s.unavailable}</Text>}
        <CostGauge value={current ?? 0} max={maximum} showValue={false} tone={full ? c.success : c.primaryColor} />
        <View style={styles.captionRow}>
          <Text style={[type.caption, { color: c.textMuted, flex: 1 }]} numberOfLines={1}>{caption}</Text>
          <Text accessibilityLiveRegion="polite" style={[type.caption, { color: c.success }]} numberOfLines={1}>{message}</Text>
        </View>
      </AppCard>

      <View style={styles.section}>
        <IndexTab title={s.spend} />
        <AppCard style={{ gap: 12 }}>
          <View style={styles.row}>{QUICK_SPEND.map(amount => {
            const off = !ap.ready || current === null || current < amount;
            return <PressScale key={amount} disabled={off} accessibilityLabel={fmt(s.spendChip, { n: amount })} onPress={() => { if (!off) doSpend(amount); }} style={[styles.chip, { backgroundColor: c.surfaceBg, opacity: off ? .45 : 1 }]}>
              <Image source={gameIcons.ap} style={styles.chipIcon} resizeMode="contain" />
              <Text style={[type.num, { color: c.textPrimary, fontSize: 18, lineHeight: 22 }]}>−{amount}</Text>
            </PressScale>;
          })}</View>
          <View style={styles.custom}>
            <ItemInput icon="ap" label={s.custom} value={Number(spend) || 0} onChange={next => setSpend(String(next))} />
            <SignalButton label={s.spendNow} variant="ink" icon="lightning-bolt" compact disabled={!canSpend} onPress={() => doSpend(cost)} />
          </View>
        </AppCard>
      </View>

      <View style={styles.section}>
        <IndexTab title={s.reading} />
        <AppCard style={{ gap: 12 }}>
          <View style={styles.row}>
            <ItemInput icon="ap" label={s.current} value={Number(reading) || 0} onChange={next => setReading(String(next))} />
            <ItemInput icon="ap" label={s.cap} value={Number(cap) || 0} onChange={next => setCap(String(next))} />
          </View>
          <SignalButton label={s.save} icon="check" disabled={!ap.ready || !validReading} onPress={() => { ap.set(Number(reading), Number(cap)); setNow(Date.now()); setMessage(s.updated); }} />
        </AppCard>
      </View>

      <View>
        <PressScale onPress={() => router.push('/reminders')} spark={false} accessibilityLabel={s.reminder} style={[styles.linkRow, { borderColor: c.hairline }]}>
          <Icon name="bell-outline" size={20} color={c.primaryInk} />
          <Text style={[type.bodyStrong, { color: c.textPrimary, flex: 1 }]} numberOfLines={1}>{s.reminder}</Text>
          <Icon name="chevron-right" size={20} color={c.textMuted} />
        </PressScale>
        <Pressable onPress={() => setHow(true)} hitSlop={8} accessibilityRole="button" style={styles.textLink}>
          <Icon name="information-outline" size={16} color={c.primaryInk} />
          <Text style={[type.caption, { color: c.primaryInk }]}>{s.how}</Text>
        </Pressable>
      </View>
    </View>

    <BottomSheet visible={how} onClose={() => setHow(false)} title={s.how}>
      <View style={styles.sheetStack}>
        <Rule lead={<Image source={gameIcons.ap} style={styles.ruleArt} resizeMode="contain" />} text={s.howRegen} />
        <Rule lead={<Icon name="arrow-collapse-up" size={22} color={c.primaryInk} />} text={s.howCap} />
        <Rule lead={<Icon name="cancel" size={22} color={c.primaryInk} />} text={s.howSpend} />
      </View>
    </BottomSheet>
  </ScreenLayout>;
}

const styles = StyleSheet.create({
  stack: { gap: 28, marginTop: 18 },
  section: { gap: 10 },
  hero: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  heroIcon: { width: 44, height: 44, marginBottom: 2 },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexGrow: 1, flexBasis: '20%', minWidth: 72, minHeight: 48, borderRadius: RADIUS.control, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  chipIcon: { width: 22, height: 22 },
  custom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  textLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, minHeight: 32, marginTop: 10 },
  sheetStack: { gap: 18 },
  rule: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ruleLead: { width: 28, alignItems: 'center', paddingTop: 1 },
  ruleArt: { width: 26, height: 26 },
});
