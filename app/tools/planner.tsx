import React, { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppCard } from '@/components/AppCard';
import { ScreenLayout } from '@/components/ScreenLayout';
import { NavBar } from '@/components/schale/NavBar';
import { IndexTab } from '@/components/schale/IndexTab';
import { SignalButton } from '@/components/schale/SignalButton';
import { SlantSegmented } from '@/components/schale/SlantSegmented';
import { SlantPortrait } from '@/components/schale/SlantPortrait';
import { CostGauge } from '@/components/schale/CostGauge';
import { BottomSheet } from '@/components/schale/BottomSheet';
import { NumberHero } from '@/components/schale/NumberHero';
import { PressScale } from '@/components/schale/PressScale';
import { Icon, type IconName } from '@/components/schale/Icon';
import { ItemAmount, ItemInput } from '@/components/schale/Item';
import { gameIcons, type GameIconName } from '@/constants/gameIcons';
import { RADIUS } from '@/constants/layout';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { plannerStrings } from '@/constants/strings/planner';
import { fmt, useStrings } from '@/constants/strings/define';
import { useLanguage } from '@/contexts/language-context';
import { useBanners } from '@/contexts/banners-context';
import { useAppConfig } from '@/contexts/app-config-context';
import { characterName } from '@/services/banners';
import { characterImageUris } from '@/services/gamedata';
import { createPlannerStore } from '@/services/userdata/planner';
import { usePersistentState } from '@/services/userdata/usePersistentState';
import InlineAd from '@/services/ads/InlineAd';
import { defaultPlanner, normalizePlanner, projectTargets, pullsNow, setHolding, type Holding, type PlannerIncome, type PlannerTarget, type Pool, type Projection, type SystemOverride } from '@/services/planner/planner';

const store = createPlannerStore(normalizePlanner, defaultPlanner);
const DAY = 86400000;
/** The pickup guarantee every target budgets towards. */
const CEILING = 200;
const INCOME_PRESETS = [0, 20, 100] as const;
const dateText = (at: number) => new Date(at).toISOString().slice(0, 10);
const parseDate = (text: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const at = Date.parse(`${text}T02:00:00Z`);
  return Number.isFinite(at) && dateText(at) === text ? at : null;
};
const digits = (text: string) => Number(text.replace(/[^0-9]/g, '')) || 0;

type Strings = (typeof plannerStrings)['en'];
type Sheet = 'choose' | 'income' | 'target' | 'help' | null;
type Option = { target: PlannerTarget; uris: string[] };

function Field({ label, value, change }: { label: string; value: string; change: (text: string) => void }) {
  const c = useColors(), t = useType();
  return <View style={styles.field}>
    <Text style={[t.caption, { color: c.textSecondary }]}>{label}</Text>
    <TextInput accessibilityLabel={label} value={value} onChangeText={change} style={[t.bodyStrong, styles.input, { color: c.textPrimary, borderColor: c.hairline, backgroundColor: c.surfaceBg }]} />
  </View>;
}

function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return <View style={styles.section}><IndexTab title={title} right={right} style={styles.heading} />{children}</View>;
}

function IconAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const c = useColors();
  return <Pressable onPress={onPress} hitSlop={4} accessibilityRole="button" accessibilityLabel={label}
    style={({ pressed }) => [styles.iconAction, { backgroundColor: c.primaryA08, opacity: pressed ? 0.7 : 1 }]}>
    <Icon name={icon} size={18} color={c.primaryInk} />
  </Pressable>;
}

function Rule({ icon, glyph, title, text }: { icon?: GameIconName; glyph?: IconName; title: string; text: string }) {
  const c = useColors(), t = useType();
  return <View style={styles.rule}>
    <View style={styles.ruleLead}>{icon ? <Image source={gameIcons[icon]} style={styles.ruleArt} resizeMode="contain" /> : glyph ? <Icon name={glyph} size={22} color={c.primaryInk} /> : null}</View>
    <View style={styles.grow}>
      <Text style={[t.bodyStrong, { color: c.textPrimary }]}>{title}</Text>
      <Text style={[t.body, { color: c.textSecondary }]}>{text}</Text>
    </View>
  </View>;
}

/** A daily-income preset: the pyroxene and the amount, or "None". */
function IncomeChip({ value, selected, onPress, s }: { value: number; selected: boolean; onPress: () => void; s: Strings }) {
  const c = useColors(), t = useType();
  const fill = selected ? c.textPrimary : c.elevatedBg, ink = selected ? c.appBg : c.textSecondary;
  return <PressScale onPress={onPress} spark={false} accessibilityLabel={value ? fmt(s.perDay, { n: value }) : s.none} accessibilityState={{ selected }} style={styles.chipTarget}>
    <View style={[styles.chip, { backgroundColor: fill, borderColor: selected ? fill : c.isDark ? c.hairline : c.surfaceBorder }]}>
      {value ? <Image source={gameIcons.pyroxene} style={styles.chipIcon} resizeMode="contain" /> : null}
      <Text style={[value ? t.num : t.labelCaps, { color: ink }]}>{value || s.none}</Text>
    </View>
  </PressScale>;
}

/** Projected pulls against what the target still needs, the gauge to the guarantee, and the gap or spare it leaves. */
function TargetResult({ p, s }: { p: Projection; s: Strings }) {
  const c = useColors(), t = useType();
  const short = p.shortfall > 0, tone = short ? c.hazardColor : c.success;
  // Shortfall: everything available went in. Covered: the reserve plus what is left for later targets.
  const projected = p.allocated + p.remaining;
  const signed = short ? `-${p.shortfall.toLocaleString()}` : `+${p.remaining.toLocaleString()}`;
  return <View style={styles.result}>
    <View style={styles.resultRow}>
      <ItemAmount icon="ticket1" value={`${projected.toLocaleString()} / ${p.needed.toLocaleString()}`} label={s.projected} caption size={32} />
      <View style={styles.signed} accessible accessibilityLabel={`${short ? s.shortfall : s.spare} ${short ? p.shortfall : p.remaining} ${s.pulls}`}>
        <Text style={[t.num, styles.signedNum, { color: tone }]}>{signed}</Text>
        <Text style={[t.caption, { color: c.textSecondary }]} numberOfLines={1}>{short ? s.shortfall : s.spare}</Text>
      </View>
    </View>
    <CostGauge value={p.progress} max={CEILING} tone={tone} showValue={false} />
    {p.mileagePulls > 0 ? <ItemAmount icon="ticket10" value={`+${p.mileagePulls}`} label={s.mileageUsed} caption size={24} /> : null}
  </View>;
}

export default function PlannerScreen() {
  const c = useColors(), t = useType(), s = useStrings(plannerStrings), { locale } = useLanguage();
  const { value: state, update, ready } = usePersistentState(store);
  const { banners, refresh, status } = useBanners(), { config } = useAppConfig();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const [now] = useState(Date.now), [sheet, setSheet] = useState<Sheet>(null);
  const [incomeId, setIncomeId] = useState<string | null>(null), [name, setName] = useState(''), [atText, setAtText] = useState(dateText(now)), [amount, setAmount] = useState(120), [error, setError] = useState(false);
  const [targetId, setTargetId] = useState(''), [pool, setPool] = useState<Pool>('standard'), [chargePool, setChargePool] = useState<Pool>('standard');
  useEffect(() => { if (ready && !state.balanceAt) update(prev => prev.balanceAt ? prev : { ...prev, balanceAt: now }); }, [ready, state.balanceAt, now, update]);
  const projections = useMemo(() => projectTargets(state, now, config), [state, now, config]);
  const options = useMemo(() => banners.flatMap(b => b.characters.flatMap((ch): Option[] => {
    const label = characterName(ch, locale);
    if (!label) return [];
    const target: PlannerTarget = { id: `${b.startAt}:${ch.studentId ?? ch.id}`, name: label, ...(ch.studentId ? { studentId: ch.studentId } : {}), at: b.startAt, pool: ch.isLimited || b.type === 'Fes' ? 'limited' : 'standard', period: `${b.startAt}:${b.endAt}` };
    return [{ target, uris: characterImageUris(ch) }];
  })), [banners, locale]);
  const chooseOptions = useMemo(() => {
    if (!params.studentId) return options;
    const wanted = Number(params.studentId);
    return [...options].sort((a, b) => Number(b.target.studentId === wanted) - Number(a.target.studentId === wanted));
  }, [options, params.studentId]);
  const urisById = useMemo(() => new Map(options.map(o => [o.target.id, o.uris])), [options]);
  const urisFor = (target: PlannerTarget) => urisById.get(target.id) ?? characterImageUris({ studentId: target.studentId });
  const day = (at: number) => new Date(at).toLocaleDateString(locale);

  // Holdings are "as of now": every edit moves the balance date to the moment it was made.
  const holding = (key: Holding, value: number) => { const at = Date.now(); update(prev => setHolding(prev, key, value, at)); };
  const setDaily = (value: number) => update(prev => normalizePlanner({ ...prev, dailyIncome: value }));
  const setCharge = (value: number) => update(prev => normalizePlanner({ ...prev, charges: { ...prev.charges, [chargePool]: value } }));
  const close = () => { setSheet(null); setError(false); };
  const addTarget = (target: PlannerTarget) => { update(prev => prev.targets.some(x => x.id === target.id) ? prev : ({ ...prev, targets: [...prev.targets, target] })); close(); };
  const editTarget = (target: PlannerTarget) => { setTargetId(target.id); setAtText(dateText(target.at)); setPool(target.pool); setSheet('target'); };
  const saveTarget = () => {
    const at = parseDate(atText);
    if (at) update(prev => ({ ...prev, targets: prev.targets.map(x => x.id === targetId ? { ...x, at, pool, period: at === x.at ? x.period : String(at) } : x) }));
    close();
  };
  const removeTarget = (id: string) => update(prev => ({ ...prev, targets: prev.targets.filter(x => x.id !== id) }));
  const newIncome = () => { setIncomeId(null); setName(''); setAtText(dateText(now + DAY)); setAmount(120); setSheet('income'); };
  const editIncome = (income: PlannerIncome) => { setIncomeId(income.id); setName(income.name); setAtText(dateText(income.at)); setAmount(income.pyroxene); setSheet('income'); };
  const saveIncome = () => {
    const at = parseDate(atText), count = amount;
    if (!at || !name.trim() || !Number.isFinite(count) || count <= 0) { setError(true); return; }
    const id = incomeId || `income:${Date.now()}`;
    update(prev => normalizePlanner({ ...prev, incomes: [...prev.incomes.filter(i => i.id !== id), { id, name: name.trim(), at, pyroxene: count }] })); close();
  };
  const removeIncome = () => { update(prev => ({ ...prev, incomes: prev.incomes.filter(i => i.id !== incomeId) })); close(); };

  const pulls = pullsNow(state), next = projections[0];
  const sources = [['pyroxene', pulls.pyroxene, s.pyroxene], ['ticket10', pulls.tenTickets, s.tenTickets], ['ticket1', pulls.singleTickets, s.singleTickets]] as const;
  const help: { icon?: GameIconName; glyph?: IconName; title: string; text: string }[] = [
    { icon: 'ticket1', title: s.budgetTitle, text: s.helpBudget },
    { icon: 'pyroxene', title: s.income, text: s.helpIncome },
    { glyph: 'gauge', title: s.charge, text: s.chargeHelp },
    { icon: 'ticket10', title: s.mileage, text: s.mileageHelp },
    { glyph: 'calendar-clock', title: s.auto, text: s.rulesDate },
    { glyph: 'calendar-month-outline', title: s.targets, text: s.helpTargets },
  ];

  return <ScreenLayout>
    <NavBar title={s.title} />

    <AppCard style={styles.summary}>
      <NumberHero value={pulls.total} label={s.availableNow} unit={s.pulls} />
      <View style={styles.sum}>
        {sources.map(([icon, value, label], index) => <Fragment key={icon}>
          {index ? <Text accessibilityElementsHidden importantForAccessibility="no" style={[t.num, { color: c.textMuted }]}>+</Text> : null}
          <View accessible accessibilityLabel={`${label}: ${value} ${s.pulls}`}><ItemAmount icon={icon} value={value} label={label} /></View>
        </Fragment>)}
      </View>
      {next ? <View style={[styles.next, { borderTopColor: c.hairline }]}>
        <View style={styles.who}>
          <SlantPortrait uris={urisFor(next.target)} label={next.target.name} size={44} />
          <View style={styles.grow}>
            <Text style={[t.caption, { color: c.textMuted }]} numberOfLines={1}>{s.nextTarget} · {day(next.target.at)}</Text>
            <Text style={[t.bodyStrong, { color: c.textPrimary }]} numberOfLines={1}>{next.target.name}</Text>
          </View>
        </View>
        <TargetResult p={next} s={s} />
      </View> : <Text style={[t.caption, { color: c.textSecondary }]}>{s.empty}</Text>}
      <View>
        <SignalButton label={s.addTarget} icon="account-plus-outline" disabled={!ready} onPress={() => setSheet('choose')} />
        <Pressable onPress={() => setSheet('help')} hitSlop={8} accessibilityRole="button" style={styles.textLink}>
          <Icon name="information-outline" size={16} color={c.primaryInk} />
          <Text style={[t.caption, { color: c.primaryInk }]}>{s.howItWorks}</Text>
        </Pressable>
      </View>
    </AppCard>

    <Section title={s.holdings} right={<Text style={[t.caption, { color: c.textMuted }]} numberOfLines={1}>{ready ? fmt(s.updated, { date: day(state.balanceAt || now) }) : s.unavailable}</Text>}>
      <AppCard padding={12}>
        <View style={styles.tiles}>
          <ItemInput icon="pyroxene" label={s.pyroxene} value={state.pyroxene} onChange={v => holding('pyroxene', v)} />
          <ItemInput icon="ticket10" label={s.tenTickets} value={state.tenTickets} onChange={v => holding('tenTickets', v)} />
          <ItemInput icon="ticket1" label={s.singleTickets} value={state.singleTickets} onChange={v => holding('singleTickets', v)} />
        </View>
      </AppCard>
    </Section>

    {projections.length ? <Section title={s.targets}>
      <View style={styles.cards}>
        {projections.map(p => <AppCard key={p.target.id} style={styles.card}>
          <View style={styles.who}>
            <SlantPortrait uris={urisFor(p.target)} label={p.target.name} size={52} />
            <View style={styles.grow}>
              <Text style={[t.bodyStrong, { color: c.textPrimary }]} numberOfLines={1}>{p.target.name}</Text>
              <Text style={[t.caption, { color: c.textMuted }]} numberOfLines={1}>{day(p.target.at)} · {s[p.target.pool]} · {s[p.system]}</Text>
            </View>
            <IconAction icon="pencil-outline" label={`${s.edit}: ${p.target.name}`} onPress={() => editTarget(p.target)} />
            <IconAction icon="trash-can-outline" label={`${s.remove}: ${p.target.name}`} onPress={() => removeTarget(p.target.id)} />
          </View>
          <TargetResult p={p} s={s} />
        </AppCard>)}
      </View>
    </Section> : null}

    <Section title={s.income}>
      <AppCard style={styles.card}>
        <View style={styles.tiles}>
          <ItemInput icon="pyroxene" label={s.daily} value={state.dailyIncome} onChange={setDaily} />
          <View style={styles.chips}>{INCOME_PRESETS.map(value => <IncomeChip key={value} value={value} selected={state.dailyIncome === value} onPress={() => setDaily(value)} s={s} />)}</View>
        </View>
        {state.incomes.map(income => <View key={income.id} style={[styles.incomeRow, { borderTopColor: c.hairline }]}>
          <ItemAmount icon="pyroxene" value={`+${income.pyroxene.toLocaleString()}`} label={income.name} size={24} />
          <View style={styles.grow}>
            <Text style={[t.bodyStrong, { color: c.textPrimary }]} numberOfLines={1}>{income.name}</Text>
            <Text style={[t.caption, { color: c.textMuted }]} numberOfLines={1}>{day(income.at)}</Text>
          </View>
          <IconAction icon="pencil-outline" label={`${s.edit}: ${income.name}`} onPress={() => editIncome(income)} />
        </View>)}
        <SignalButton label={s.addIncome} variant="ghost" compact icon="calendar-plus" onPress={newIncome} style={styles.start} />
      </AppCard>
    </Section>

    <Section title={s.rules}>
      <AppCard style={styles.card}>
        <SlantSegmented<SystemOverride> value={state.override} onChange={override => update(prev => ({ ...prev, override }))} options={[{ value: 'auto', label: s.auto }, { value: 'spark', label: s.spark }, { value: 'charge', label: s.charge }]} />
        {/* Carried charge and mileage only exist under Charge; a forced Spark plan never reads them. */}
        {state.override !== 'spark' ? <>
          <View style={[styles.divided, { borderTopColor: c.hairline }]}>
            <Text style={[t.caption, { color: c.textSecondary }]}>{s.currentCharge}</Text>
            <SlantSegmented<Pool> value={chargePool} onChange={setChargePool} options={[{ value: 'standard', label: s.standard }, { value: 'limited', label: s.limited }]} />
            <View style={styles.chargeRow}>
              <View style={[styles.chargeBox, { backgroundColor: c.surfaceBg }]}>
                <TextInput accessibilityLabel={`${s.currentCharge}: ${s[chargePool]}`} keyboardType="number-pad" inputMode="numeric" selectTextOnFocus
                  value={state.charges[chargePool] ? String(state.charges[chargePool]) : ''} placeholder="0" placeholderTextColor={c.textMuted}
                  onChangeText={text => setCharge(digits(text))} style={[t.num, styles.chargeInput, { color: c.textPrimary }]} />
                <Text style={[t.num, { color: c.textMuted }]}>/ {CEILING}</Text>
              </View>
              <CostGauge value={state.charges[chargePool]} max={CEILING} showValue={false} style={styles.grow} />
            </View>
          </View>
          <View style={[styles.divided, styles.switchRow, { borderTopColor: c.hairline }]}>
            <Image source={gameIcons.ticket10} style={styles.ruleArt} resizeMode="contain" />
            <Text style={[t.bodyStrong, styles.grow, { color: c.textPrimary }]}>{s.mileage}</Text>
            <Switch accessibilityLabel={s.mileage} value={state.mileageEstimate} onValueChange={value => update(prev => ({ ...prev, mileageEstimate: value }))} trackColor={{ false: c.surfaceBorder, true: c.primaryColor }} thumbColor={c.elevatedBg} />
          </View>
        </> : null}
      </AppCard>
    </Section>

    <Text style={[t.caption, styles.footnote, { color: c.textMuted }]}>{s.predicted}</Text>
    {/* Below the results, away from the steppers and buttons above. */}
    <View style={{ marginTop: 28 }}><InlineAd /></View>

    <BottomSheet visible={sheet === 'choose'} onClose={close} title={s.addTarget}>
      {chooseOptions.length ? <View>{chooseOptions.map(({ target, uris }) => {
        const added = state.targets.some(x => x.id === target.id);
        return <PressScale key={target.id} onPress={() => addTarget(target)} disabled={added} spark={false} accessibilityLabel={`${target.name}, ${day(target.at)}`} accessibilityState={{ selected: added }} style={[styles.option, { borderBottomColor: c.hairline }]}>
          <SlantPortrait uris={uris} label={target.name} size={44} dimmed={added} />
          <View style={styles.grow}>
            <Text style={[t.bodyStrong, { color: added ? c.textMuted : c.textPrimary }]} numberOfLines={1}>{target.name}</Text>
            <Text style={[t.caption, { color: c.textMuted }]} numberOfLines={1}>{day(target.at)} · {s[target.pool]}</Text>
          </View>
          <Icon name={added ? 'check-circle' : 'plus-circle-outline'} size={22} color={added ? c.success : c.primaryInk} />
        </PressScale>;
      })}</View> : <View style={styles.sheetStack}>
        <Text style={[t.body, { color: c.textSecondary }]}>{s.noBanners}</Text>
        <SignalButton label={s.refresh} variant="ghost" icon="refresh" loading={status === 'loading'} onPress={() => void refresh()} />
      </View>}
    </BottomSheet>
    <BottomSheet visible={sheet === 'income'} onClose={close} title={s.dated}>
      <View style={styles.sheetStack}>
        <Field label={s.incomeName} value={name} change={setName} />
        <Field label={s.date} value={atText} change={setAtText} />
        <ItemInput icon="pyroxene" label={s.pyroxene} value={amount} onChange={setAmount} style={styles.sheetTile} />
        {error ? <Text style={[t.caption, { color: c.hazardColor }]}>{s.error}</Text> : null}
        <SignalButton label={s.save} onPress={saveIncome} />
        {incomeId ? <SignalButton label={s.remove} variant="ghost" onPress={removeIncome} /> : null}
      </View>
    </BottomSheet>
    <BottomSheet visible={sheet === 'target'} onClose={close} title={s.edit}>
      <View style={styles.sheetStack}>
        <Field label={s.targetDate} value={atText} change={setAtText} />
        <SlantSegmented<Pool> value={pool} onChange={setPool} options={[{ value: 'standard', label: s.standard }, { value: 'limited', label: s.limited }]} />
        <SignalButton label={s.save} disabled={!parseDate(atText)} onPress={saveTarget} />
      </View>
    </BottomSheet>
    <BottomSheet visible={sheet === 'help'} onClose={close} title={s.howItWorks}>
      <View style={styles.sheetStack}>
        {help.map((rule, index) => <Rule key={index} {...rule} />)}
        <Text style={[t.caption, { color: c.textMuted }]}>{s.saved}</Text>
      </View>
    </BottomSheet>
  </ScreenLayout>;
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  section: { marginTop: 28 },
  heading: { marginBottom: 10 },
  summary: { gap: 16 },
  sum: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  next: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, gap: 12 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  result: { gap: 10 },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  signed: { alignItems: 'flex-end', flexShrink: 0 },
  signedNum: { fontSize: 24, lineHeight: 28 },
  textLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, minHeight: 32, marginTop: 10 },
  cards: { gap: 12 },
  card: { gap: 14 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  chipTarget: { minHeight: 44, justifyContent: 'center' },
  chip: { minHeight: 34, paddingHorizontal: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.pill, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipIcon: { width: 18, height: 18 },
  incomeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12 },
  start: { alignSelf: 'flex-start' },
  divided: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, gap: 10 },
  chargeRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  chargeBox: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: RADIUS.control, paddingHorizontal: 12, minHeight: 48 },
  chargeInput: { fontSize: 22, lineHeight: 28, minWidth: 44, paddingVertical: 0, textAlign: 'right' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconAction: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  footnote: { marginTop: 20 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetStack: { gap: 14 },
  sheetTile: { flex: 0 },
  rule: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ruleLead: { width: 28, alignItems: 'center', paddingTop: 1 },
  ruleArt: { width: 28, height: 28 },
  field: { gap: 6 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.control, paddingHorizontal: 12, minHeight: 48 },
});
