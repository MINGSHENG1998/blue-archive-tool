import React, { useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenLayout } from '@/components/ScreenLayout';
import { AppCard } from '@/components/AppCard';
import { NavBar } from '@/components/schale/NavBar';
import { IndexTab } from '@/components/schale/IndexTab';
import { CostGauge } from '@/components/schale/CostGauge';
import { SignalButton } from '@/components/schale/SignalButton';
import { SlantSegmented } from '@/components/schale/SlantSegmented';
import { PressScale } from '@/components/schale/PressScale';
import { BottomSheet } from '@/components/schale/BottomSheet';
import { Icon, type IconName } from '@/components/schale/Icon';
import { ItemAmount, ItemInput } from '@/components/schale/Item';
import InlineAd from '@/services/ads/InlineAd';
import { useAppConfig } from '@/contexts/app-config-context';
import { usePersistentState } from '@/services/userdata/usePersistentState';
import { GAUGE_MAX, addTrackedPulls, atGuarantee, emptyTracker, trackerCharges, trackerProgress, trackerStore, undoTrackedPull } from '@/services/gacha/tracker';
import { LUCK_MIN_PULLS, THREE_STAR_RATE, formatRate, stats, type PullKind } from '@/services/gacha/session';
import { safeCount, systemAt, type Pool, type SystemOverride } from '@/services/planner/planner';
import { gameIcons, type GameIconName } from '@/constants/gameIcons';
import { categoryColors } from '@/constants/categoryColors';
import { readableOn } from '@/constants/theme';
import { RADIUS } from '@/constants/layout';
import { gachaStrings } from '@/constants/strings/gacha';
import { fmt, useStrings } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';

type Sheet = 'rules' | 'how' | null;
type PadKey = { label: string; kind: PullKind; count: number; art?: GameIconName; glyph?: IconName };

/** The rarity star on a given surface, nudged until it reads (3:1, non-text). */
const starOn = (bg: string) => readableOn(categoryColors.star, bg, 3);

/** Icon + number + one-line caption, sized like ItemAmount for glyphs that are not item art. */
function Tally({ glyph, tone, value, label }: { glyph: IconName; tone: string; value: number; label: string }) {
  const c = useColors(), type = useType();
  const shown = value.toLocaleString();
  return <View style={styles.tally} accessible accessibilityLabel={`${label} ${shown}`}>
    <Icon name={glyph} size={28} color={tone} />
    <View style={styles.tallyText}>
      <Text style={[type.num, { color: c.textPrimary, fontSize: 17 }]}>{shown}</Text>
      <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>{label}</Text>
    </View>
  </View>;
}

function LinkRow({ icon, label, value, onPress }: { icon: IconName; label: string; value?: string; onPress: () => void }) {
  const c = useColors(), type = useType();
  return <PressScale onPress={onPress} spark={false} accessibilityLabel={value ? `${label}: ${value}` : label} style={styles.linkRow}>
    <Icon name={icon} size={20} color={c.primaryInk} />
    <Text style={[type.bodyStrong, { color: c.textPrimary, flexShrink: 1 }]} numberOfLines={1}>{label}</Text>
    <Text style={[type.caption, { color: c.textSecondary, flex: 1, textAlign: 'right' }]} numberOfLines={1}>{value ?? ''}</Text>
    <Icon name="chevron-right" size={20} color={c.textMuted} />
  </PressScale>;
}

function Rule({ lead, title, text }: { lead: ReactNode; title?: string; text: string }) {
  const c = useColors(), type = useType();
  return <View style={styles.rule}>
    <View style={styles.ruleLead}>{lead}</View>
    <View style={styles.ruleText}>
      {title ? <Text style={[type.bodyStrong, { color: c.textPrimary }]}>{title}</Text> : null}
      <Text style={[type.body, { color: c.textSecondary }]}>{text}</Text>
    </View>
  </View>;
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  const c = useColors(), type = useType();
  return <View style={styles.labelled}><Text style={[type.caption, { color: c.textSecondary }]}>{label}</Text>{children}</View>;
}

export default function GachaScreen() {
  const c = useColors(), type = useType(), s = useStrings(gachaStrings), { config } = useAppConfig();
  const { value: state, ready, update } = usePersistentState(trackerStore);
  const [confirm, setConfirm] = useState(false), [keep, setKeep] = useState(true), [sheet, setSheet] = useState<Sheet>(null);
  const system = systemAt(Date.now(), config, state.override), charges = trackerCharges(state);
  const result = stats({ history: state.history.map(p => p.kind) });
  const progress = trackerProgress(state, system);
  const log = (kind: PullKind, count = 1) => update(prev => addTrackedPulls(prev, kind, prev.pool, count, system));
  const pad: PadKey[] = [
    { label: s.miss, kind: 'miss', count: 1, art: 'ticket1' },
    { label: s.tenMisses, kind: 'miss', count: 10, art: 'ticket10' },
    { label: s.star, kind: 'threeStar', count: 1, glyph: 'star' },
    { label: s.hit, kind: 'pickup', count: 1, glyph: 'star-circle' },
  ];
  const luckTone = result.luck === 'lucky' ? c.success : result.luck === 'unlucky' ? c.hazardColor : c.textMuted;
  const gold = starOn(c.elevatedBg), pipGold = starOn(c.surfaceBg);
  const close = () => setSheet(null);
  return <ScreenLayout>
    <NavBar title={s.title} />
    <View style={styles.stack}>
      <AppCard style={{ gap: 12 }}>
        <View style={styles.pad}>{pad.map(p => {
          const hero = p.kind === 'pickup', face = hero ? c.textPrimary : c.surfaceBg;
          return <PressScale key={p.label} haptic spark disabled={!ready} accessibilityLabel={p.label} onPress={() => { if (ready) log(p.kind, p.count); }} style={[styles.key, { backgroundColor: face, borderColor: hero ? c.primaryInk : c.hairline, opacity: ready ? 1 : .45 }]}>
            {p.art ? <Image source={gameIcons[p.art]} style={styles.keyArt} resizeMode="contain" /> : <Icon name={p.glyph ?? 'star'} size={40} color={starOn(face)} />}
            <Text style={[type.bodyStrong, { color: hero ? c.appBg : c.textPrimary, textAlign: 'center' }]} numberOfLines={1}>{p.label}</Text>
          </PressScale>;
        })}</View>
        <SignalButton label={s.undo} icon="undo" variant="ghost" compact disabled={!ready || !state.history.length} onPress={() => update(undoTrackedPull)} />
        {ready ? null : <Text style={[type.caption, { color: c.textMuted, textAlign: 'center' }]}>{s.loading}</Text>}
      </AppCard>

      <AppCard style={{ gap: 16 }}>
        <View style={styles.tallies}>
          <ItemAmount icon="ticket1" value={result.pulls} label={s.pulls} caption style={styles.tally} />
          <Tally glyph="star" tone={gold} value={result.threeStars} label={s.stars} />
          <Tally glyph="star-circle" tone={gold} value={result.pickups} label={s.pickup} />
        </View>
        <View style={[styles.rateRow, { borderColor: c.hairline }]}>
          <View style={styles.shrink}>
            <Text style={[type.numXL, { color: c.primaryInk, fontSize: 32, lineHeight: 38 }]}>{formatRate(result.threeStarRate)}</Text>
            <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>{fmt(s.rateLine, { base: formatRate(THREE_STAR_RATE) })}</Text>
          </View>
          <View style={[styles.shrink, styles.end]}>
            <Text style={[type.bodyStrong, { color: luckTone, textAlign: 'right' }]} numberOfLines={1}>{s[result.luck]}</Text>
            {result.pulls ? <Text style={[type.caption, { color: c.textMuted, textAlign: 'right' }]} numberOfLines={1}>{fmt(s.sinceLast, { n: result.sinceLastThreeStar })}</Text> : null}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <CostGauge value={progress} max={GAUGE_MAX} label={system === 'charge' ? `${s.gauge} · ${s[state.pool]}` : s.sparkCount} />
          {atGuarantee(progress, system) ? <Text style={[type.caption, { color: c.primaryInk }]} numberOfLines={1}>{s.threshold}</Text> : null}
        </View>
        <View style={[styles.links, { borderColor: c.hairline }]}>
          <LinkRow icon="tune-variant" label={s.rules} value={`${s[system]} · ${s[state.pool]}`} onPress={() => setSheet('rules')} />
          <LinkRow icon="calendar-month-outline" label={s.planner} onPress={() => router.push('/tools/planner')} />
        </View>
        <Pressable onPress={() => setSheet('how')} hitSlop={8} accessibilityRole="button" style={styles.textLink}>
          <Icon name="information-outline" size={16} color={c.primaryInk} />
          <Text style={[type.caption, { color: c.primaryInk }]}>{s.how}</Text>
        </Pressable>
      </AppCard>

      <View style={styles.section}>
        <IndexTab title={s.history} right={<SignalButton label={s.reset} variant="ghost" compact icon="delete-outline" disabled={!ready || (!state.history.length && !charges.standard && !charges.limited)} onPress={() => setConfirm(true)} />} />
        <AppCard>
          {state.history.length ? <View accessibilityLabel={s.history} style={styles.pips}>{state.history.slice(-60).map((p, index) => {
            const miss = p.kind === 'miss';
            return <View key={index} style={[styles.pip, { backgroundColor: c.surfaceBg, borderColor: miss ? c.hairline : pipGold, borderRadius: p.kind === 'pickup' ? 12 : 3 }]}>
              <Text style={[type.caption, { color: miss ? c.textMuted : pipGold }]}>{miss ? '/' : p.kind === 'pickup' ? '◎' : '★'}</Text>
            </View>;
          })}</View> : <Text style={[type.body, { color: c.textSecondary }]}>{s.empty}</Text>}
        </AppCard>
      </View>
      <InlineAd />
    </View>

    <BottomSheet visible={sheet === 'rules'} onClose={close} title={s.rules}>
      <View style={styles.sheetStack}>
        <Labelled label={s.system}>
          <SlantSegmented<SystemOverride> value={state.override} onChange={override => update(prev => ({ ...prev, override }))} options={[{ value: 'auto', label: s.auto }, { value: 'spark', label: s.spark }, { value: 'charge', label: s.charge }]} />
        </Labelled>
        <Labelled label={s.pool}>
          <SlantSegmented<Pool> value={state.pool} onChange={pool => update(prev => ({ ...prev, pool }))} options={[{ value: 'standard', label: s.standard }, { value: 'limited', label: s.limited }]} />
        </Labelled>
        <Labelled label={s.carry}>
          <View style={styles.inputs}>{(['standard', 'limited'] as const).map(pool => <ItemInput key={pool} icon="ticket1" label={s[pool]} value={state.initialCharges[pool]} onChange={next => update(prev => ({ ...prev, initialCharges: { ...prev.initialCharges, [pool]: safeCount(next, GAUGE_MAX) } }))} />)}</View>
          <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>{s.savedCharges}</Text>
        </Labelled>
      </View>
    </BottomSheet>

    <BottomSheet visible={sheet === 'how'} onClose={close} title={s.how}>
      <View style={styles.sheetStack}>
        <Rule lead={<Image source={gameIcons.ticket10} style={styles.ruleArt} resizeMode="contain" />} text={s.padNote} />
        <Rule lead={<Icon name="star-circle" size={24} color={gold} />} text={s.pickupNote} />
        <Rule lead={<Icon name="percent-outline" size={22} color={c.primaryInk} />} text={s.base} />
        <Rule lead={<Icon name="scale-balance" size={22} color={c.primaryInk} />} text={fmt(s.luckNote, { n: LUCK_MIN_PULLS })} />
        <Rule lead={<Icon name="star-shooting-outline" size={22} color={c.primaryInk} />} title={s.spark} text={s.sparkHelp} />
        <Rule lead={<Icon name="battery-charging-outline" size={22} color={c.primaryInk} />} title={s.charge} text={s.chargeHelp} />
        <Rule lead={<Icon name="history" size={22} color={c.primaryInk} />} text={s.legend} />
        <Rule lead={<Icon name="cellphone-check" size={22} color={c.primaryInk} />} text={s.restored} />
      </View>
    </BottomSheet>

    <BottomSheet visible={confirm} onClose={() => setConfirm(false)} title={s.confirm}>
      <View style={styles.sheetStack}><Text style={[type.body, { color: c.textSecondary }]}>{s.confirmBody}</Text><SlantSegmented value={keep ? 'keep' : 'clear'} onChange={v => setKeep(v === 'keep')} options={[{ value: 'keep', label: s.keepCharges }, { value: 'clear', label: s.clearCharges }]} /><SignalButton label={s.clear} icon="delete-outline" onPress={() => { update(prev => ({ ...emptyTracker(), override: prev.override, pool: prev.pool, initialCharges: keep ? trackerCharges(prev) : { standard: 0, limited: 0 } })); setConfirm(false); }} /><SignalButton label={s.cancel} variant="ghost" onPress={() => setConfirm(false)} /></View>
    </BottomSheet>
  </ScreenLayout>;
}

const styles = StyleSheet.create({
  stack: { gap: 28, marginTop: 18 },
  section: { gap: 10 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  key: { flexGrow: 1, flexBasis: '44%', minHeight: 104, borderWidth: 1, borderRadius: RADIUS.control, padding: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  keyArt: { width: 44, height: 44 },
  tallies: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tally: { flex: 1, minWidth: 84, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tallyText: { flexShrink: 1 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  shrink: { flexShrink: 1 },
  end: { alignItems: 'flex-end' },
  links: { borderTopWidth: StyleSheet.hairlineWidth },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  textLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, minHeight: 32 },
  pips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pip: { width: 24, height: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  sheetStack: { gap: 18 },
  labelled: { gap: 8 },
  inputs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rule: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ruleLead: { width: 28, alignItems: 'center', paddingTop: 1 },
  ruleArt: { width: 28, height: 28 },
  ruleText: { flex: 1, gap: 2 },
});
