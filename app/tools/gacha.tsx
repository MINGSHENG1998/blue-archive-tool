import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenLayout } from '@/components/ScreenLayout';
import { AppCard } from '@/components/AppCard';
import { NavBar } from '@/components/schale/NavBar';
import { IndexTab } from '@/components/schale/IndexTab';
import { NumberHero } from '@/components/schale/NumberHero';
import { CostGauge } from '@/components/schale/CostGauge';
import { SignalButton } from '@/components/schale/SignalButton';
import { SlantSegmented } from '@/components/schale/SlantSegmented';
import { PressScale } from '@/components/schale/PressScale';
import { BottomSheet } from '@/components/schale/BottomSheet';
import { Icon } from '@/components/schale/Icon';
import { Stat, StatRow } from '@/components/schale/Stat';
import InlineAd from '@/services/ads/InlineAd';
import { useAppConfig } from '@/contexts/app-config-context';
import { usePersistentState } from '@/services/userdata/usePersistentState';
import { addTrackedPulls, emptyTracker, trackerCharges, trackerStore, undoTrackedPull } from '@/services/gacha/tracker';
import { stats, formatRate, type PullKind } from '@/services/gacha/session';
import { safeCount, systemAt, type Pool, type SystemOverride } from '@/services/planner/planner';
import { gachaStrings } from '@/constants/strings/gacha';
import { useStrings } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';

export default function GachaScreen() {
  const c = useColors(), type = useType(), s = useStrings(gachaStrings), { config } = useAppConfig();
  const { value: state, ready, update } = usePersistentState(trackerStore);
  const [confirm, setConfirm] = useState(false), [keep, setKeep] = useState(true);
  const system = systemAt(Date.now(), config, state.override), charges = trackerCharges(state);
  const result = stats({ history: state.history.map(p => p.kind) });
  const spark = state.history.filter(p => p.system === 'spark').length;
  const progress = system === 'charge' ? charges[state.pool] : spark === 0 ? 0 : (spark - 1) % 200 + 1;
  const log = (kind: PullKind, count = 1) => update(prev => addTrackedPulls(prev, kind, prev.pool, count, system));
  const pad = [
    { label: s.miss, kind: 'miss' as const, count: 1, icon: 'minus' as const },
    { label: s.tenMisses, kind: 'miss' as const, count: 10, icon: 'numeric-10-box-outline' as const },
    { label: s.star, kind: 'threeStar' as const, count: 1, icon: 'star-outline' as const },
    { label: s.hit, kind: 'pickup' as const, count: 1, icon: 'bullseye-arrow' as const },
  ];
  const luckTone = result.luck === 'lucky' ? c.success : result.luck === 'unlucky' ? c.hazardColor : c.textMuted;
  return <ScreenLayout>
    <NavBar title={s.title} />
    <View style={styles.stack}>
      <AppCard style={{ gap: 12 }}>
        <NumberHero label={s.rate} value={formatRate(result.threeStarRate)} countUp={false} />
        <Text style={[type.bodyStrong, { color: luckTone }]}>{s[result.luck]}</Text>
        <StatRow><Stat label={s.pulls} value={result.pulls} /><Stat label={s.stars} value={result.threeStars} /><Stat label={s.pickup} value={result.pickups} /><Stat label={s.since} value={result.sinceLastThreeStar} /></StatRow>
        <Text style={[type.caption, { color: c.textMuted }]}>{s.base}</Text>
        <Text style={[type.caption, { color: c.textMuted }]}>{ready ? s.restored : s.loading}</Text>
      </AppCard>
      <IndexTab title={s.rules} />
      <AppCard style={{ gap: 14 }}>
        <SlantSegmented<SystemOverride> value={state.override} onChange={override => update(prev => ({ ...prev, override }))} options={[{ value: 'auto', label: s.auto }, { value: 'spark', label: s.spark }, { value: 'charge', label: s.charge }]} />
        <SlantSegmented<Pool> value={state.pool} onChange={pool => update(prev => ({ ...prev, pool }))} options={[{ value: 'standard', label: s.standard }, { value: 'limited', label: s.limited }]} />
        <CostGauge value={progress} max={200} label={system === 'charge' ? s.gauge : s.sparkCount} kicker={`${s[system]} · ${s[state.pool]}`} />
        {system === 'charge' && (progress === 100 || progress === 200) ? <Text style={[type.caption, { color: c.primaryInk }]}>{s.threshold}</Text> : null}
        <Text style={[type.caption, { color: c.textSecondary }]}>{system === 'charge' ? s.chargeHelp : s.sparkHelp}</Text>
      </AppCard>
      <IndexTab title={s.log} />
      <AppCard>
        <View style={styles.pad}>{pad.map((p, index) => <PressScale key={p.label} haptic spark disabled={!ready} accessibilityLabel={p.label} onPress={() => { if (ready) log(p.kind, p.count); }} style={[styles.key, { backgroundColor: index === 3 ? c.textPrimary : c.surfaceBg, borderColor: index === 3 ? c.primaryInk : c.hairline, opacity: ready ? 1 : .45 }]}>
          <Icon name={p.icon} size={30} color={index === 3 ? c.appBg : c.primaryInk} />
          <Text style={[type.bodyStrong, { color: index === 3 ? c.appBg : c.textPrimary, textAlign: 'center' }]}>{p.label}</Text>
        </PressScale>)}</View>
        <SignalButton label={s.undo} icon="undo" variant="ghost" disabled={!ready || !state.history.length} onPress={() => update(undoTrackedPull)} />
      </AppCard>
      <IndexTab title={s.history} />
      <AppCard style={{ gap: 12 }}>
        {state.history.length ? <View accessibilityLabel={s.history} style={styles.pips}>{state.history.slice(-60).map((p, index) => <View key={index} style={[styles.pip, { backgroundColor: p.kind === 'miss' ? c.surfaceBg : c.primaryA16, borderColor: p.kind === 'miss' ? c.hairline : c.primaryColor, borderRadius: p.kind === 'pickup' ? 12 : 2 }]}><Text style={[type.caption, { color: p.kind === 'miss' ? c.textMuted : c.primaryInk }]}>{p.kind === 'miss' ? '/' : p.kind === 'pickup' ? '◎' : '★'}</Text></View>)}</View> : <Text style={[type.body, { color: c.textSecondary }]}>{s.empty}</Text>}
        <Text style={[type.caption, { color: c.textMuted }]}>{s.historyHelp}</Text>
        <SignalButton label={s.reset} variant="ghost" icon="delete-outline" disabled={!ready || (!state.history.length && !charges.standard && !charges.limited)} onPress={() => setConfirm(true)} />
      </AppCard>
      <AppCard style={{ gap: 12 }}>
        <Text style={[type.section, { color: c.textPrimary }]}>{s.carry}</Text>
        <Text style={[type.caption, { color: c.textMuted }]}>{s.savedCharges}</Text>
        <View style={styles.row}>{(['standard', 'limited'] as const).map(pool => <View key={pool} style={styles.field}><Text style={[type.caption, { color: c.textSecondary }]}>{s[pool]}</Text><TextInput accessibilityLabel={`${s.carry} · ${s[pool]}`} keyboardType="number-pad" inputMode="numeric" value={String(state.initialCharges[pool])} onChangeText={text => update(prev => ({ ...prev, initialCharges: { ...prev.initialCharges, [pool]: safeCount(Number(text), 200) } }))} style={[type.num, styles.input, { color: c.textPrimary, backgroundColor: c.surfaceBg, borderColor: c.hairline }]} /></View>)}</View>
      </AppCard>
      <SignalButton label={s.planner} icon="calendar-month-outline" onPress={() => router.push('/tools/planner')} />
      <InlineAd />
    </View>
    <BottomSheet visible={confirm} onClose={() => setConfirm(false)} title={s.confirm}>
      <View style={styles.stack}><Text style={[type.body, { color: c.textSecondary }]}>{s.confirmBody}</Text><SlantSegmented value={keep ? 'keep' : 'clear'} onChange={v => setKeep(v === 'keep')} options={[{ value: 'keep', label: s.keepCharges }, { value: 'clear', label: s.clearCharges }]} /><SignalButton label={s.clear} icon="delete-outline" onPress={() => { update(prev => ({ ...emptyTracker(), override: prev.override, pool: prev.pool, initialCharges: keep ? trackerCharges(prev) : { standard: 0, limited: 0 } })); setConfirm(false); }} /><SignalButton label={s.cancel} variant="ghost" onPress={() => setConfirm(false)} /></View>
    </BottomSheet>
  </ScreenLayout>;
}
const styles = StyleSheet.create({ stack: { gap: 18, marginTop: 18 }, pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }, key: { flexGrow: 1, flexBasis: '44%', minHeight: 100, borderWidth: 1, borderRadius: 4, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 10 }, pips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }, pip: { width: 24, height: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center' }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, field: { flex: 1, minWidth: 110, gap: 6, marginVertical: 10 }, input: { borderWidth: 1, borderRadius: 3, minHeight: 48, paddingHorizontal: 12 } });
