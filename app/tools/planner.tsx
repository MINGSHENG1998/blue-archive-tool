import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppCard } from '@/components/AppCard';
import { ScreenLayout } from '@/components/ScreenLayout';
import { NavBar } from '@/components/schale/NavBar';
import { IndexTab } from '@/components/schale/IndexTab';
import { SignalButton } from '@/components/schale/SignalButton';
import { SlantSegmented } from '@/components/schale/SlantSegmented';
import { FilterPill } from '@/components/schale/FilterPill';
import { CostGauge } from '@/components/schale/CostGauge';
import { BottomSheet } from '@/components/schale/BottomSheet';
import { NumberHero } from '@/components/schale/NumberHero';
import { Stat, StatRow } from '@/components/schale/Stat';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { plannerStrings } from '@/constants/strings/planner';
import { useStrings } from '@/constants/strings/define';
import { useLanguage } from '@/contexts/language-context';
import { useBanners } from '@/contexts/banners-context';
import { useAppConfig } from '@/contexts/app-config-context';
import { createPlannerStore } from '@/services/userdata/planner';
import { usePersistentState } from '@/services/userdata/usePersistentState';
import { defaultPlanner, normalizePlanner, projectTargets, type PlannerTarget, type Pool, type SystemOverride } from '@/services/planner/planner';

const store = createPlannerStore(normalizePlanner, defaultPlanner);
const dateText = (at: number) => new Date(at).toISOString().slice(0, 10);
const parseDate = (text: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const at = Date.parse(`${text}T02:00:00Z`);
  return Number.isFinite(at) && dateText(at) === text ? at : null;
};
function Field({ label, value, change, numeric = false }: { label: string; value: string; change: (text: string) => void; numeric?: boolean }) {
  const c = useColors(), t = useType();
  return <View style={styles.field}><Text style={[t.caption, { color: c.textSecondary }]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={change} keyboardType={numeric ? 'number-pad' : 'default'} inputMode={numeric ? 'numeric' : 'text'} style={[t.bodyStrong, styles.input, { color: c.textPrimary, borderColor: c.hairline, backgroundColor: c.surfaceBg }]} /></View>;
}

export default function PlannerScreen() {
  const c = useColors(), t = useType(), s = useStrings(plannerStrings), { locale } = useLanguage();
  const { value: state, update, ready } = usePersistentState(store);
  const { banners, refresh, status } = useBanners(), { config } = useAppConfig();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const [now] = useState(Date.now), [sheet, setSheet] = useState<'choose' | 'income' | 'target' | null>(null);
  const [balanceDate, setBalanceDate] = useState(dateText(now));
  const [incomeId, setIncomeId] = useState<string | null>(null), [name, setName] = useState(''), [atText, setAtText] = useState(dateText(now)), [amount, setAmount] = useState('120'), [error, setError] = useState(false);
  const [targetId, setTargetId] = useState(''), [pool, setPool] = useState<Pool>('standard');
  useEffect(() => { if (ready) { if (!state.balanceAt) update(prev => ({ ...prev, balanceAt: now })); setBalanceDate(dateText(state.balanceAt || now)); } }, [ready, state.balanceAt, now, update]);
  const projections = useMemo(() => projectTargets(state, now, config), [state, now, config]);
  const options = banners.flatMap(b => b.characters.map(ch => ({ id: `${b.startAt}:${ch.studentId ?? ch.id}`, name: ch.translations[locale] || ch.name, studentId: ch.studentId, at: b.startAt, pool: (ch.isLimited || b.type === 'Fes' ? 'limited' : 'standard') as Pool, period: `${b.startAt}:${b.endAt}` })));
  const chooseOptions = params.studentId ? [...options].sort((a,b) => Number(b.studentId === Number(params.studentId)) - Number(a.studentId === Number(params.studentId))) : options;
  const number = (key: 'pyroxene' | 'tenTickets' | 'singleTickets' | 'dailyIncome', text: string) => update(prev => normalizePlanner({ ...prev, [key]: Number(text) }));
  const close = () => { setSheet(null); setError(false); };
  const addTarget = (target: PlannerTarget) => { update(prev => prev.targets.some(x => x.id === target.id) ? prev : ({ ...prev, targets: [...prev.targets, target] })); close(); };
  const saveIncome = () => {
    const at = parseDate(atText), count = Number(amount);
    if (!at || !name.trim() || !Number.isFinite(count) || count <= 0) { setError(true); return; }
    const id = incomeId || `income:${Date.now()}`;
    update(prev => normalizePlanner({ ...prev, incomes: [...prev.incomes.filter(i => i.id !== id), { id, name: name.trim(), at, pyroxene: count }] })); close();
  };
  return <ScreenLayout>
    <NavBar title={s.title} />
    <View style={styles.stack}>
      <IndexTab title={s.balance} />
      <AppCard style={{ gap: 12 }}>
        <NumberHero value={Math.floor(state.pyroxene / 120) + state.tenTickets * 10 + state.singleTickets} label={s.balance} unit={s.pulls} />
        <Field label={s.pyroxene} value={String(state.pyroxene)} change={v => number('pyroxene', v)} numeric />
        <View style={styles.row}><Field label={s.tenTickets} value={String(state.tenTickets)} change={v => number('tenTickets', v)} numeric /><Field label={s.singleTickets} value={String(state.singleTickets)} change={v => number('singleTickets', v)} numeric /></View>
        <Field label={s.balanceDate} value={balanceDate} change={setBalanceDate} />
        <SignalButton label={s.changeDate} variant="ghost" compact disabled={!ready || !parseDate(balanceDate)} onPress={() => { const at = parseDate(balanceDate); if (at) update(prev => ({ ...prev, balanceAt: at })); }} />
        <Text style={[t.caption, { color: c.textMuted }]}>{ready ? s.saved : s.unavailable}</Text>
      </AppCard>
      <IndexTab title={s.income} />
      <AppCard style={{ gap: 12 }}>
        <Field label={s.daily} value={String(state.dailyIncome)} change={v => number('dailyIncome', v)} numeric />
        <View style={styles.wrap}>{[[0, s.none], [20, s.dailyPreset], [100, s.monthlyPreset]].map(([value, label]) => <FilterPill key={value} label={String(label)} selected={state.dailyIncome === value} onPress={() => number('dailyIncome', String(value))} />)}</View>
        {state.incomes.map(income => <View key={income.id} style={[styles.income, { borderColor: c.hairline }]}><View style={{ flex: 1 }}><Text style={[t.bodyStrong, { color: c.textPrimary }]}>{income.name} · +{income.pyroxene.toLocaleString(locale)}</Text><Text style={[t.caption, { color: c.textMuted }]}>{new Date(income.at).toLocaleDateString(locale)}</Text></View><SignalButton label={s.edit} variant="ghost" compact onPress={() => { setIncomeId(income.id); setName(income.name); setAtText(dateText(income.at)); setAmount(String(income.pyroxene)); setSheet('income'); }} /></View>)}
        <SignalButton label={s.addIncome} variant="ghost" icon="calendar-plus" onPress={() => { setIncomeId(null); setName(''); setAtText(dateText(now + 86400000)); setAmount('120'); setSheet('income'); }} />
      </AppCard>
      <IndexTab title={s.rules} />
      <AppCard style={{ gap: 14 }}>
        <SlantSegmented<SystemOverride> value={state.override} onChange={override => update(prev => ({ ...prev, override }))} options={[{ value: 'auto', label: s.auto }, { value: 'spark', label: s.spark }, { value: 'charge', label: s.charge }]} />
        <Text style={[t.caption, { color: c.textMuted }]}>{s.rulesDate}</Text>
        <Text style={[t.bodyStrong, { color: c.textPrimary }]}>{s.currentCharge}</Text>
        <View style={styles.row}>{(['standard', 'limited'] as const).map(key => <Field key={key} label={s[key]} value={String(state.charges[key])} numeric change={v => update(prev => normalizePlanner({ ...prev, charges: { ...prev.charges, [key]: Number(v) } }))} />)}</View>
        <Text style={[t.body, { color: c.textSecondary }]}>{s.chargeHelp}</Text>
        <Text style={[t.bodyStrong, { color: c.textPrimary }]}>{s.mileage}</Text>
        <SlantSegmented value={state.mileageEstimate ? 'on' : 'off'} onChange={v => update(prev => ({ ...prev, mileageEstimate: v === 'on' }))} options={[{ value: 'off', label: s.off }, { value: 'on', label: s.on }]} />
        {state.mileageEstimate ? <Text style={[t.caption, { color: c.textMuted }]}>{s.mileageHelp}</Text> : null}
      </AppCard>
      <IndexTab title={s.targets} />
      <SignalButton label={s.addTarget} icon="account-plus-outline" disabled={!ready} onPress={() => setSheet('choose')} />
      {!projections.length ? <Text style={[t.body, { color: c.textSecondary }]}>{s.empty}</Text> : null}
      {projections.map((p, index) => <AppCard key={p.target.id} tone={p.shortfall ? c.hazardColor : c.success} style={{ gap: 12 }}>
        <Text style={[t.section, { color: c.textPrimary }]}>{p.target.name}</Text>
        <Text style={[t.caption, { color: c.textSecondary }]}>{new Date(p.target.at).toLocaleDateString(locale)} · {s[p.target.pool]} · {s[p.system]}</Text>
        <CostGauge value={p.progress} max={200} label={p.shortfall ? `${s.shortfall}: ${p.shortfall} ${s.pulls}` : s.covered} tone={p.shortfall ? c.hazardColor : c.success} />
        <StatRow><Stat label={s.forecast} value={p.available} /><Stat label={s.allocated} value={p.allocated} /><Stat label={s.remaining} value={p.remaining} /></StatRow>
        {p.mileagePulls > 0 ? <Text style={[t.caption, { color: c.textMuted }]}>{s.mileageUsed}: {p.mileagePulls}</Text> : null}
        <View style={styles.row}><SignalButton label={s.edit} variant="ghost" compact onPress={() => { setTargetId(p.target.id); setAtText(dateText(p.target.at)); setPool(p.target.pool); setSheet('target'); }} /><SignalButton label={s.remove} variant="ghost" compact onPress={() => update(prev => ({ ...prev, targets: prev.targets.filter(x => x.id !== p.target.id) }))} /></View>
      </AppCard>)}
      <Text style={[t.caption, { color: c.textMuted }]}>{s.predicted}</Text>
      <Text style={[t.caption, { color: c.textMuted }]}>{s.assumptions}</Text>
    </View>
    <BottomSheet visible={sheet === 'choose'} onClose={close} title={s.addTarget}>
      <View style={styles.stack}>{chooseOptions.length ? chooseOptions.map(option => <SignalButton key={option.id} variant="ghost" label={`${option.name} · ${new Date(option.at).toLocaleDateString(locale)}`} disabled={state.targets.some(x => x.id === option.id)} onPress={() => addTarget(option)} />) : <><Text style={[t.body, { color: c.textSecondary }]}>{s.noBanners}</Text><SignalButton label={s.addTarget} variant="ghost" loading={status === 'loading'} onPress={() => void refresh()} /></>}</View>
    </BottomSheet>
    <BottomSheet visible={sheet === 'income'} onClose={close} title={s.dated}>
      <View style={styles.stack}><Field label={s.incomeName} value={name} change={setName} /><Field label={s.date} value={atText} change={setAtText} /><Field label={s.amount} value={amount} change={setAmount} numeric />{error ? <Text style={[t.caption, { color: c.hazardColor }]}>{s.error}</Text> : null}<SignalButton label={s.save} onPress={saveIncome} />{incomeId ? <SignalButton label={s.remove} variant="ghost" onPress={() => { update(prev => ({ ...prev, incomes: prev.incomes.filter(i => i.id !== incomeId) })); close(); }} /> : null}</View>
    </BottomSheet>
    <BottomSheet visible={sheet === 'target'} onClose={close} title={s.edit}>
      <View style={styles.stack}><Field label={s.targetDate} value={atText} change={setAtText} /><SlantSegmented<Pool> value={pool} onChange={setPool} options={[{ value: 'standard', label: s.standard }, { value: 'limited', label: s.limited }]} /><SignalButton label={s.save} disabled={!parseDate(atText)} onPress={() => { const at = parseDate(atText); if (at) update(prev => ({ ...prev, targets: prev.targets.map(x => x.id === targetId ? { ...x, at, pool, period: at === x.at ? x.period : String(at) } : x) })); close(); }} /></View>
    </BottomSheet>
  </ScreenLayout>;
}
const styles = StyleSheet.create({ stack: { gap: 18, marginTop: 18 }, row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, field: { flexGrow: 1, minWidth: 130, gap: 6, marginVertical: 5 }, input: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 12, minHeight: 48 }, income: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 12 } });
