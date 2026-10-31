import React, { useState } from 'react';
import { Image, Keyboard, StyleSheet, Text, View } from 'react-native';
import { RangeSelector } from '@/components/RangeSelector';
import NumberInput from '@/components/NumberInput';
import { Icon, NumberHero, SignalButton, type IconName } from '@/components/schale';
import { CalculatorScreen, CalculatorSection, CalculatorNote, HowItWorks, InputCard, StudentPicker, useCalculatorStudent } from '@/components/calculators/CalculatorUI';
import { i18n, bondResourceNames } from '@/constants/i18n';
import { bondResourceTable } from '@/constants/bondData';
import { gameIcons } from '@/constants/gameIcons';
import { RADIUS } from '@/constants/layout';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/contexts/language-context';
import { useAdFreeContext } from '@/contexts/ad-free-context';
import { calculatorStrings } from '@/constants/strings/calculators';
import { useStrings } from '@/constants/strings/define';
import { bondPlan, giftEquivalents } from '@/services/calculators';
import { maybeShowCalcInterstitial } from '@/services/ads/interstitial';

// The gift matrix: rows are the gift grade (gold 2★ box, purple 3★ box),
// columns the student's reaction, left to right from "small" to "amazing".
const GIFT_ROWS = [
  { box: gameIcons.giftBox, keys: ['mehGift2Star', 'likeGift2Star', 'favorite2Star', 'loved2Star'] },
  { box: gameIcons.giftBoxLuxury, keys: ['mehGift3Star', 'likeGift3Star', 'favorite3Star', 'loved3Star'] },
];
const FACES = GIFT_ROWS[0].keys.map(key => bondResourceTable.find(item => item.key === key)?.img);

function TimeTile({ icon, value, caption }: { icon: IconName; value: string; caption: string }) {
  const c = useColors(), type = useType();
  return <View style={[styles.time, { backgroundColor: c.surfaceBg }]} accessible accessibilityLabel={`${value} ${caption}`}>
    <Icon name={icon} size={22} color={c.primaryInk} />
    <View style={styles.flex}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[type.num, styles.timeValue, { color: c.textPrimary }]}>{value}</Text>
      <Text numberOfLines={1} style={[type.caption, { color: c.textMuted }]}>{caption}</Text>
    </View>
  </View>;
}

export default function BondCalculator() {
  const { locale } = useLanguage(), t = i18n[locale], s = useStrings(calculatorStrings), c = useColors(), type = useType(), { isAdFree } = useAdFreeContext();
  const selected = useCalculatorStudent();
  const [from, setFrom] = useState(1), [to, setTo] = useState(100), [pat, setPat] = useState(5), [gifts, setGifts] = useState(50), [submitted, setSubmitted] = useState(false);
  const result = bondPlan(from, to, pat, gifts);
  const counts: Record<string, ReturnType<typeof giftEquivalents>[number]> = result ? Object.fromEntries(giftEquivalents(result.totalExp).map(item => [item.key, item])) : {};
  const name = (key: string) => bondResourceNames[key]?.[locale] ?? bondResourceTable.find(item => item.key === key)?.name ?? key;
  const calculate = () => { setSubmitted(true); if (result) { Keyboard.dismiss(); maybeShowCalcInterstitial(isAdFree); } };
  return <CalculatorScreen tool="Bond">
    <StudentPicker {...selected} profileLink={s.giftPrefs} />
    <InputCard>
      <RangeSelector min={1} max={100} low={from} high={to} lowLabel={t.bondCurrentLevel} highLabel={t.bondTargetLevel} onChange={(low, high) => { setFrom(low); setTo(high); }} />
      {submitted && !result ? <CalculatorNote error>{t.bondValidationError}</CalculatorNote> : null}
    </InputCard>
    <SignalButton label={t.bondCalculate} onPress={calculate} />
    {result ? <CalculatorSection title={s.result} right={<HowItWorks points={[s.howBondGifts, s.howBondFaces, s.howBondDays]} />}>
      <NumberHero value={result.totalExp} label={t.bondRequiredExp} countUp={false} />
      <View style={styles.times}>
        <TimeTile icon="calendar-today" value={`~${result.days.toLocaleString()}`} caption={t.bondDaysUnit} />
        <TimeTile icon="calendar-month" value={result.totalExp > result.monthly ? result.months.toLocaleString() : '< 1'} caption={t.bondMonths} />
      </View>
    </CalculatorSection> : null}
    <CalculatorSection title={s.pace}>
      <View style={styles.pace}>
        <View style={styles.paceItem}><NumberInput value={pat} min={0} max={6} label={s.patsPerDay} icon={gameIcons.headpat} onChange={setPat} /></View>
        <View style={styles.paceItem}><NumberInput value={gifts} min={0} max={200} label={s.giftsPerMonth} icon={gameIcons.giftBox} onChange={setGifts} /></View>
      </View>
      <CalculatorNote>{s.paceNote}</CalculatorNote>
    </CalculatorSection>
    {result ? <CalculatorSection title={s.gifts}>
      <View style={styles.headpat} accessible accessibilityLabel={`${name('checkIn')} · ${counts.checkIn.exp} ${t.bondExp}: ${counts.checkIn.count.toLocaleString()}`}>
        <Image source={gameIcons.headpat} style={styles.rowIcon} resizeMode="contain" />
        <Text style={[type.num, styles.count, { color: c.textPrimary }]}>{counts.checkIn.count.toLocaleString()}</Text>
        <Text numberOfLines={1} style={[type.caption, styles.flex, { color: c.textMuted }]}>+{counts.checkIn.exp}</Text>
      </View>
      <View style={[styles.matrix, { borderColor: c.hairline }]}>
        <View style={styles.matrixRow}>
          <View style={styles.rowHead} />
          {FACES.map((face, index) => <View key={index} style={styles.cell}>{face ? <Image source={face} style={styles.face} resizeMode="contain" /> : null}</View>)}
        </View>
        {GIFT_ROWS.map(row => <View key={row.keys[0]} style={[styles.matrixRow, styles.matrixBody, { borderTopColor: c.hairline }]}>
          <View style={styles.rowHead}><Image source={row.box} style={styles.rowIcon} resizeMode="contain" /></View>
          {row.keys.map(key => <View key={key} style={styles.cell} accessible accessibilityLabel={`${name(key)} · ${counts[key].exp} ${t.bondExp}: ${counts[key].count.toLocaleString()}`}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[type.num, styles.count, { color: c.textPrimary }]}>{counts[key].count.toLocaleString()}</Text>
            <Text numberOfLines={1} style={[type.caption, { color: c.textMuted }]}>+{counts[key].exp}</Text>
          </View>)}
        </View>)}
      </View>
      <CalculatorNote>{s.anyOne}</CalculatorNote>
    </CalculatorSection> : null}
  </CalculatorScreen>;
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  times: { flexDirection: 'row', gap: 10 },
  time: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: RADIUS.control },
  timeValue: { fontSize: 20, lineHeight: 26 },
  pace: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paceItem: { flex: 1, minWidth: 140 },
  headpat: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  matrix: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  matrixRow: { flexDirection: 'row', alignItems: 'center' },
  matrixBody: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
  rowHead: { width: 44, alignItems: 'flex-start' },
  rowIcon: { width: 36, height: 36 },
  cell: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 2 },
  face: { width: 26, height: 26 },
  count: { fontSize: 18, lineHeight: 24 },
});
