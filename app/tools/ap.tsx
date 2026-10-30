import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { ScreenLayout } from '@/components/ScreenLayout';
import { AppCard } from '@/components/AppCard';
import { NavBar } from '@/components/schale/NavBar';
import { IndexTab } from '@/components/schale/IndexTab';
import { NumberHero } from '@/components/schale/NumberHero';
import { CostGauge } from '@/components/schale/CostGauge';
import { FilterPill } from '@/components/schale/FilterPill';
import { SignalButton } from '@/components/schale/SignalButton';
import { useAp } from '@/contexts/user-data-context';
import { useLanguage } from '@/contexts/language-context';
import { AP_REGEN_MS, DEFAULT_AP_CAP, MAX_AP, MAX_AP_CAP } from '@/services/userdata/ap';
import { apStrings } from '@/constants/strings/ap';
import { useStrings } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';

const duration = (ms: number) => { const seconds = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; };
function NumericField({ label, value, setValue }: { label: string; value: string; setValue: (value: string) => void }) {
  const c = useColors(), type = useType();
  return <View style={styles.field}><Text style={[type.caption, { color: c.textSecondary }]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={setValue} keyboardType="number-pad" inputMode="numeric" style={[type.num, styles.input, { color: c.textPrimary, backgroundColor: c.surfaceBg, borderColor: c.hairline }]} /></View>;
}
export default function ApScreen() {
  const s = useStrings(apStrings), c = useColors(), type = useType(), { locale } = useLanguage();
  const ap = useAp(), focused = useIsFocused();
  const { ready: apReady, state: apState, current: readAp } = ap;
  const [now, setNow] = useState(Date.now), [reading, setReading] = useState('0'), [cap, setCap] = useState(String(DEFAULT_AP_CAP)), [spend, setSpend] = useState('20'), [message, setMessage] = useState('');
  useEffect(() => { if (apReady) { setReading(String(readAp() ?? 0)); setCap(String(apState?.cap ?? DEFAULT_AP_CAP)); } }, [apReady, apState, readAp]); // Only a saved reading changes the editor; timer ticks do not.
  useEffect(() => { if (!focused) return; setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, [focused]);
  const current = ap.current(now), maximum = ap.state?.cap ?? DEFAULT_AP_CAP, fullAt = ap.fullAt();
  const full = current !== null && current >= maximum;
  const validReading = /^\d+$/.test(reading) && Number(reading) <= MAX_AP && /^\d+$/.test(cap) && Number(cap) >= 1 && Number(cap) <= MAX_AP_CAP;
  const cost = Number(spend), canSpend = ap.ready && current !== null && /^\d+$/.test(spend) && cost > 0 && cost <= current;
  const doSpend = (amount: number) => { ap.spend(amount); setNow(Date.now()); setMessage(s.applied); };
  const phase = ap.state ? Math.max(0, now - ap.state.setAt) % AP_REGEN_MS : 0;
  return <ScreenLayout>
    <NavBar title={s.title} />
    <View style={styles.stack}>
      <AppCard>
        <NumberHero value={current ?? '—'} label={s.ledger} unit={`/ ${maximum}`} countUp={false} />
        <CostGauge value={current ?? 0} max={maximum} label={full ? s.full : s.until} tone={full ? c.success : c.primaryColor} />
        {ap.state ? <View style={styles.timer}>
          <Text style={[type.numXL, { color: full ? c.success : c.primaryInk, fontSize: 36 }]}>{full ? '00:00:00' : duration((fullAt ?? now) - now)}</Text>
          <Text style={[type.bodyStrong, { color: c.textPrimary }]}>{full ? s.full : `${s.fullAt} · ${new Date(fullAt ?? now).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}</Text>
          <Text style={[type.caption, { color: c.textMuted }]}>{full ? s.noRegen : `${s.next} · ${duration(AP_REGEN_MS - phase)}`}</Text>
        </View> : <Text style={[type.body, { color: c.textSecondary }]}>{ap.ready ? s.empty : s.unavailable}</Text>}
      </AppCard>
      <IndexTab title={s.reading} />
      <AppCard style={{ gap: 12 }}>
        <View style={styles.row}><NumericField label={s.current} value={reading} setValue={setReading} /><NumericField label={s.cap} value={cap} setValue={setCap} /></View>
        <SignalButton label={s.save} icon="check" disabled={!ap.ready || !validReading} onPress={() => { ap.set(Number(reading), Number(cap)); setNow(Date.now()); setMessage(s.updated); }} />
        <Text accessibilityLiveRegion="polite" style={[type.caption, { color: c.success }]}>{message || (ap.ready ? s.saved : s.unavailable)}</Text>
        <Text style={[type.caption, { color: c.textMuted }]}>{s.regen}</Text>
      </AppCard>
      <IndexTab title={s.spend} />
      <AppCard style={{ gap: 12 }}>
        <View style={styles.row}>{[10, 20, 40, 60].map(cost => <FilterPill key={cost} label={`−${cost}`} selected={false} onPress={() => { if (ap.ready && current !== null && current >= cost) doSpend(cost); }} disabled={!ap.ready || current === null || current < cost} />)}</View>
        <NumericField label={s.custom} value={spend} setValue={setSpend} />
        <SignalButton label={s.spendNow} variant="ink" icon="lightning-bolt" disabled={!canSpend} onPress={() => doSpend(cost)} />
        <Text style={[type.caption, { color: c.textMuted }]}>{s.costHint}</Text>
      </AppCard>
      <SignalButton label={s.reminder} variant="ghost" icon="bell-outline" onPress={() => router.push('/reminders')} />
    </View>
  </ScreenLayout>;
}
const styles = StyleSheet.create({ stack: { gap: 18, marginTop: 18 }, row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' }, field: { flex: 1, minWidth: 110, gap: 6, marginVertical: 8 }, input: { minHeight: 48, borderWidth: 1, borderRadius: 3, paddingHorizontal: 12 }, timer: { gap: 8, paddingVertical: 14 } });
