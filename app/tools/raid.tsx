import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { NumberHero, SlantSegmented, FilterPill, SignalButton } from '@/components/schale';
import { CalculatorScreen, CalculatorSection, CalculatorNote, ResourceRow } from '@/components/calculators/CalculatorUI';
import { i18n } from '@/constants/i18n';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/contexts/language-context';
import { useGameData } from '@/contexts/gamedata-context';
import { useStrings } from '@/constants/strings/define';
import { raidDifficultyStrings } from '@/constants/strings/raid-calculator';
import { RAID_DIFFICULTY_DATA, RAID_DURATIONS, clearTimeToRaidScore, formatClearTime, parseClearTime, raidScoreToClearTime, type RaidDuration } from '@/constants/raidData';
export { ErrorBoundary } from 'expo-router';
type Mode = 'timeToScore' | 'scoreToTime';
const BOSS_IDS: Record<string, string> = { Binah: '1', Chesed: '2', Shirokuro: '3', Hieronymus: '4', Kaiten: '5', Perorodzilla: '6', Hod: '7', Goz: '8', Gregorius: '9', Hovercraft: '10', Kurokage: '11', Geburah: '12', Yesod: '13', Drumbarka: '14' };
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  const c = useColors(), type = useType();
  return <View style={styles.field}><Text style={[type.caption, { color: c.textSecondary }]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={c.textMuted} keyboardType="numbers-and-punctuation" style={[type.num, styles.input, { backgroundColor: c.surfaceBg, borderColor: c.hairline, color: c.textPrimary }]} /></View>;
}
export default function RaidCalculator() {
  const { locale } = useLanguage(), t = i18n[locale];
  const difficulties = useStrings(raidDifficultyStrings), game = useGameData();
  const bossName = (name: string) => game.raidNames?.raid[BOSS_IDS[name]] ?? game.raids.raid[BOSS_IDS[name]]?.Name ?? name;
  const [mode, setMode] = useState<Mode>('timeToScore'), [duration, setDuration] = useState<RaidDuration>(240), [difficultyIndex, setDifficultyIndex] = useState(6), [times, setTimes] = useState<string[]>(['']), [scoreInput, setScoreInput] = useState('');
  const difficulty = RAID_DIFFICULTY_DATA[difficultyIndex], option = RAID_DURATIONS.find(item => item.value === duration);
  const teamScores = times.map(raw => { const seconds = parseClearTime(raw); return seconds === null ? null : clearTimeToRaidScore(seconds, duration, difficulty); });
  const total = teamScores.reduce<number>((sum, score) => sum + (score ?? 0), 0);
  const anyTimeEntered = times.some(raw => raw.trim() !== ''), invalid = times.some((raw, i) => raw.trim() !== '' && teamScores[i] === null);
  const parsedScore = Number(scoreInput.replace(/[\s,]/g, '')), valid = scoreInput.trim() !== '' && Number.isFinite(parsedScore);
  const derivedTime = valid ? raidScoreToClearTime(parsedScore, duration, difficulty) : null;
  return <CalculatorScreen title={t.raidPageTitle}>
    <CalculatorSection index={1} title={t.raidDurationLabel}><SlantSegmented value={String(duration)} onChange={value => setDuration(Number(value) as RaidDuration)} options={RAID_DURATIONS.map(item => ({ value: String(item.value), label: item.label }))} />{option ? <CalculatorNote>{t.raidBossHint.replace('{list}', option.raids.map(bossName).join(', '))}</CalculatorNote> : null}</CalculatorSection>
    <CalculatorSection index={2} title={t.raidDifficultyLabel}><View style={styles.wrap}>{RAID_DIFFICULTY_DATA.map((item, index) => <FilterPill key={item.difficulty} label={difficulties[item.difficulty]} selected={index === difficultyIndex} onPress={() => setDifficultyIndex(index)} />)}</View></CalculatorSection>
    <SlantSegmented<Mode> value={mode} onChange={setMode} options={[{ value: 'timeToScore', label: t.raidModeTimeToScore }, { value: 'scoreToTime', label: t.raidModeScoreToTime }]} />
    {mode === 'timeToScore' ? <CalculatorSection index={3} title={t.raidClearTimeLabel}>
      {times.map((value, index) => <View key={index} style={styles.team}><Field label={times.length > 1 ? t.raidTeam.replace('{n}', String(index + 1)) : t.raidClearTimeLabel} value={value} placeholder={t.raidClearTimeHint} onChange={next => setTimes(previous => previous.map((item, i) => i === index ? next : item))} /><ResourceRow label={t.raidScoreLabel} value={teamScores[index] ?? '—'} /></View>)}
      {invalid ? <CalculatorNote error>{t.raidInvalidTime}</CalculatorNote> : null}
      {times.length < 4 ? <SignalButton label={t.raidAddTeam} icon="plus" variant="ghost" onPress={() => setTimes(previous => [...previous, ''])} /> : null}
    </CalculatorSection> : <CalculatorSection index={3} title={t.raidScoreLabel}><Field label={t.raidScoreLabel} value={scoreInput} onChange={setScoreInput} />{scoreInput.trim() !== '' && !valid ? <CalculatorNote error>{t.raidInvalidScore}</CalculatorNote> : null}</CalculatorSection>}
    {mode === 'timeToScore' && anyTimeEntered ? <CalculatorSection index={4} title={t.raidTotalScore} hero><NumberHero value={total} label={t.raidTotalScore} countUp={false} /></CalculatorSection> : mode === 'scoreToTime' && derivedTime !== null ? <CalculatorSection index={4} title={t.raidClearTimeLabel} hero><NumberHero value={formatClearTime(derivedTime)} label={t.raidClearTimeLabel} countUp={false} /></CalculatorSection> : null}
  </CalculatorScreen>;
}
const styles = StyleSheet.create({ wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, field: { flex: 1, gap: 6 }, input: { minHeight: 48, borderRadius: 3, borderWidth: 1, paddingHorizontal: 12 }, team: { gap: 4, marginBottom: 8 } });
