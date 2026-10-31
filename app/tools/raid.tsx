import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppCard, FilterPill, Icon, NumberHero, SignalButton, SlantSegmented } from '@/components/schale';
import { CalculatorScreen, CalculatorSection, CalculatorNote, HowItWorks, InputCard } from '@/components/calculators/CalculatorUI';
import { typeColor } from '@/constants/Colors';
import { i18n } from '@/constants/i18n';
import { RADIUS } from '@/constants/layout';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/contexts/language-context';
import { effectiveBulletTypes, liveRaids, useGameData, type LiveRaid } from '@/contexts/gamedata-context';
import { fmt, useStrings, type StringSet } from '@/constants/strings/define';
import { raidCalculatorStrings, raidDifficultyStrings } from '@/constants/strings/raid-calculator';
import { RAID_DIFFICULTY_DATA, RAID_DURATIONS, clearTimeToRaidScore, formatClearTime, parseClearTime, raidScoreToClearTime, type RaidDuration } from '@/constants/raidData';
import { RAID_BOSS_IDS, raidTimer, raidTopDifficulty } from '@/services/calculators';
import { toAtkType, toDefType } from '@/services/gamedata';
export { ErrorBoundary } from 'expo-router';
type Mode = 'timeToScore' | 'scoreToTime';
type RaidText = StringSet<keyof typeof raidCalculatorStrings.en>;

function timeLeft(seconds: number, r: RaidText) {
  const safe = Math.max(0, Math.floor(seconds));
  const days = Math.floor(safe / 86400), hours = Math.floor(safe % 86400 / 3600), minutes = Math.max(1, Math.floor(safe % 3600 / 60));
  return days ? fmt(r.durDays, { days, hours }) : hours ? fmt(r.durHours, { hours, minutes }) : fmt(r.durMinutes, { minutes });
}

function Field({ label, value, onChange, placeholder, showLabel = true }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; showLabel?: boolean }) {
  const c = useColors(), type = useType();
  return <View style={styles.field}>
    {showLabel ? <Text style={[type.caption, { color: c.textSecondary }]}>{label}</Text> : null}
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={c.textMuted} keyboardType="numbers-and-punctuation"
      style={[type.num, styles.input, { backgroundColor: c.surfaceBg, color: c.textPrimary }]} />
  </View>;
}

/** One live boss: name, mode and time left, then each armor it fields and the attack types that hit it hard. */
function LiveRaidRow({ raid, timer, selected, onUse }: { raid: LiveRaid; timer: RaidDuration | null; selected: boolean; onUse: () => void }) {
  const c = useColors(), type = useType(), r = useStrings(raidCalculatorStrings), game = useGameData();
  const kind = raid.kind === 'Raid' ? r.totalAssault : raid.kind === 'EliminateRaid' ? r.grandAssault : r.multiFloor;
  const timerLabel = RAID_DURATIONS.find(option => option.value === timer)?.label;
  const body = <>
    <View style={styles.liveHead}>
      <View style={styles.flex}>
        <Text numberOfLines={1} style={[type.bodyStrong, { color: c.textPrimary }]}>{raid.name}</Text>
        <Text numberOfLines={1} style={[type.caption, { color: c.textMuted }]}>{kind} · {fmt(r.endsIn, { time: timeLeft(raid.secondsLeft, r) })}</Text>
      </View>
      {timerLabel ? <View style={[styles.timer, { backgroundColor: selected ? c.primaryA16 : c.surfaceBg }]}>
        <Icon name={selected ? 'check' : 'timer-outline'} size={16} color={selected ? c.primaryInk : c.textSecondary} />
        <Text style={[type.num, { color: selected ? c.primaryInk : c.textPrimary }]}>{timerLabel}</Text>
      </View> : null}
    </View>
    {raid.armorTypes.map(armor => {
      const def = toDefType(armor), armorLabel = game.label('ArmorType', armor);
      const attacks = effectiveBulletTypes(armor, game.config).map(bullet => ({ bullet, atk: toAtkType(bullet), label: game.label('BulletType', bullet) }));
      return <View key={armor} style={styles.types} accessible accessibilityLabel={fmt(r.weakTo, { armor: armorLabel, types: attacks.map(attack => attack.label).join(', ') })}>
        <View style={styles.type}>
          {def ? <Image source={typeColor[def].icon} style={styles.typeIcon} resizeMode="contain" /> : null}
          <Text style={[type.caption, { color: c.textSecondary }]}>{armorLabel}</Text>
        </View>
        {attacks.length ? <Icon name="arrow-right" size={16} color={c.textMuted} /> : null}
        {attacks.map(attack => <View key={attack.bullet} style={styles.type}>
          {attack.atk ? <Image source={typeColor[attack.atk].icon} style={styles.typeIcon} resizeMode="contain" /> : null}
          <Text style={[type.caption, { color: c.textPrimary }]}>{attack.label}</Text>
        </View>)}
      </View>;
    })}
  </>;
  return timer !== null
    ? <Pressable accessibilityRole="button" accessibilityHint={r.useTimer} accessibilityState={{ selected }} onPress={onUse} style={({ pressed }) => [styles.live, pressed && { opacity: 0.7 }]}>{body}</Pressable>
    : <View style={styles.live}>{body}</View>;
}

export default function RaidCalculator() {
  const { locale } = useLanguage(), t = i18n[locale], c = useColors(), type = useType();
  const difficulties = useStrings(raidDifficultyStrings), r = useStrings(raidCalculatorStrings), game = useGameData();
  const bossName = (name: string) => game.raidNames?.raid[RAID_BOSS_IDS[name]] ?? game.raids.raid[RAID_BOSS_IDS[name]]?.Name ?? name;
  const [now] = useState(() => new Date());
  const live = useMemo(() => liveRaids(game.config, game.raids, now, { names: game.raidNames }).map(raid => ({ raid, timer: raidTimer(raid), difficulty: raidTopDifficulty(raid, game.raids) })), [game.config, game.raids, game.raidNames, now]);
  // The first scoreable boss on now picks the timer (and, for Grand Assault, the top open tier) until the player chooses by hand.
  const preset = live.find(item => item.timer !== null);
  const presetTimer = preset?.timer ?? null, presetDifficulty = preset?.difficulty ?? null;
  const [mode, setMode] = useState<Mode>('timeToScore'), [duration, setDuration] = useState<RaidDuration>(presetTimer ?? 240), [difficultyIndex, setDifficultyIndex] = useState(presetDifficulty ?? 6), [times, setTimes] = useState<string[]>(['']), [scoreInput, setScoreInput] = useState('');
  const touched = useRef(false);
  useEffect(() => {
    if (touched.current || presetTimer === null) return;
    setDuration(presetTimer);
    if (presetDifficulty !== null) setDifficultyIndex(presetDifficulty);
  }, [presetTimer, presetDifficulty]);
  const pickDuration = (value: RaidDuration) => { touched.current = true; setDuration(value); };
  const pickDifficulty = (index: number) => { touched.current = true; setDifficultyIndex(index); };
  const applyRaid = (timer: RaidDuration, difficulty: number | null) => { touched.current = true; setDuration(timer); if (difficulty !== null) setDifficultyIndex(difficulty); };
  const difficulty = RAID_DIFFICULTY_DATA[difficultyIndex];
  const teamScores = times.map(raw => { const seconds = parseClearTime(raw); return seconds === null ? null : clearTimeToRaidScore(seconds, duration, difficulty); });
  const total = teamScores.reduce<number>((sum, score) => sum + (score ?? 0), 0);
  const anyTimeEntered = times.some(raw => raw.trim() !== ''), invalid = times.some((raw, i) => raw.trim() !== '' && teamScores[i] === null);
  const parsedScore = Number(scoreInput.replace(/[\s,]/g, '')), valid = scoreInput.trim() !== '' && Number.isFinite(parsedScore);
  const derivedTime = valid ? raidScoreToClearTime(parsedScore, duration, difficulty) : null;
  const how = <HowItWorks points={[r.howScore, r.howTime, r.howLive, t.raidClearTimeHint]}>
    <View style={styles.timers}>
      <Text style={[type.bodyStrong, { color: c.textPrimary }]}>{r.timers}</Text>
      {RAID_DURATIONS.map(option => <View key={option.value} style={styles.timerRow}>
        <Text style={[type.num, styles.timerLabel, { color: c.primaryInk }]}>{option.label}</Text>
        <Text style={[type.body, styles.flex, { color: c.textSecondary }]}>{option.raids.map(bossName).join(', ')}</Text>
      </View>)}
    </View>
  </HowItWorks>;
  return <CalculatorScreen tool="Raid">
    {live.length ? <CalculatorSection title={r.onNow}>
      {live.map(({ raid, timer, difficulty: top }) => <LiveRaidRow key={`${raid.kind}-${raid.id}`} raid={raid} timer={timer} selected={timer !== null && timer === duration && (top === null || top === difficultyIndex)}
        onUse={() => { if (timer !== null) applyRaid(timer, top); }} />)}
    </CalculatorSection> : null}
    <InputCard>
      <View style={styles.group}>
        <Text style={[type.caption, { color: c.textSecondary }]}>{t.raidDurationLabel}</Text>
        <SlantSegmented value={String(duration)} onChange={value => pickDuration(Number(value) as RaidDuration)} options={RAID_DURATIONS.map(item => ({ value: String(item.value), label: item.label, icon: 'timer-outline' as const }))} />
      </View>
      <View style={styles.group}>
        <Text style={[type.caption, { color: c.textSecondary }]}>{t.raidDifficultyLabel}</Text>
        <View style={styles.wrap}>{RAID_DIFFICULTY_DATA.map((item, index) => <FilterPill key={item.difficulty} label={difficulties[item.difficulty]} selected={index === difficultyIndex} onPress={() => pickDifficulty(index)} />)}</View>
      </View>
    </InputCard>
    <SlantSegmented<Mode> value={mode} onChange={setMode} options={[{ value: 'timeToScore', label: t.raidModeTimeToScore }, { value: 'scoreToTime', label: t.raidModeScoreToTime }]} />
    {mode === 'timeToScore' ? <CalculatorSection title={t.raidClearTimeLabel} right={how}>
      {times.map((value, index) => <View key={index} style={styles.team}>
        <Field label={fmt(t.raidTeam, { n: index + 1 })} value={value} placeholder="1:23.456" onChange={next => setTimes(previous => previous.map((item, i) => i === index ? next : item))} />
        <View style={styles.teamScore} accessible accessibilityLabel={`${t.raidScoreLabel}: ${teamScores[index] ?? '—'}`}>
          <Text numberOfLines={1} style={[type.caption, { color: c.textMuted }]}>{t.raidScoreLabel}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[type.num, styles.score, { color: teamScores[index] === null ? c.textMuted : c.textPrimary }]}>{teamScores[index]?.toLocaleString() ?? '—'}</Text>
        </View>
      </View>)}
      {invalid ? <CalculatorNote error>{t.raidInvalidTime}</CalculatorNote> : null}
      {times.length < 4 ? <SignalButton label={t.raidAddTeam} icon="plus" variant="ghost" compact onPress={() => setTimes(previous => [...previous, ''])} /> : null}
    </CalculatorSection> : <CalculatorSection title={t.raidScoreLabel} right={how}>
      <Field label={t.raidScoreLabel} showLabel={false} value={scoreInput} placeholder="45,000,000" onChange={setScoreInput} />
      {scoreInput.trim() !== '' && !valid ? <CalculatorNote error>{t.raidInvalidScore}</CalculatorNote> : null}
    </CalculatorSection>}
    <AppCard>
      {mode === 'timeToScore'
        ? <NumberHero value={anyTimeEntered ? total : '—'} label={t.raidTotalScore} countUp={false} />
        : <NumberHero value={derivedTime !== null ? formatClearTime(derivedTime) : '—'} label={t.raidClearTimeLabel} countUp={false} />}
    </AppCard>
  </CalculatorScreen>;
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8 },
  group: { gap: 8 },
  field: { flex: 1, gap: 6 },
  input: { minHeight: 48, borderRadius: RADIUS.control, paddingHorizontal: 14, fontSize: 18 },
  team: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  teamScore: { flex: 1, alignItems: 'flex-end', justifyContent: 'center', minHeight: 48, gap: 2 },
  score: { fontSize: 18, lineHeight: 24 },
  live: { gap: 8 },
  liveHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, minHeight: 32, borderRadius: RADIUS.pill },
  types: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  type: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  typeIcon: { width: 24, height: 24 },
  timers: { gap: 10, marginTop: 6 },
  timerRow: { flexDirection: 'row', gap: 12 },
  timerLabel: { width: 44, lineHeight: 21 },
});
