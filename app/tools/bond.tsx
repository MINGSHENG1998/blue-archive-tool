import React, { useMemo, useState } from 'react';
import { Keyboard, View, StyleSheet } from 'react-native';
import { RangeSelector } from '@/components/RangeSelector';
import NumberInput from '@/components/NumberInput';
import { NumberHero, SignalButton } from '@/components/schale';
import { CalculatorScreen, CalculatorSection, CalculatorNote, ResourceRow, StudentPicker, useCalculatorStudent } from '@/components/calculators/CalculatorUI';
import { i18n, bondResourceNames } from '@/constants/i18n';
import { bondResourceTable } from '@/constants/bondData';
import { useLanguage } from '@/contexts/language-context';
import { useAdFreeContext } from '@/contexts/ad-free-context';
import { calculatorStrings } from '@/constants/strings/calculators';
import { useStrings } from '@/constants/strings/define';
import { bondPlan } from '@/services/calculators';
import { maybeShowCalcInterstitial } from '@/services/ads/interstitial';

export default function BondCalculator() {
  const { locale } = useLanguage(), t = i18n[locale], s = useStrings(calculatorStrings), { isAdFree } = useAdFreeContext();
  const selected = useCalculatorStudent();
  const [from, setFrom] = useState(1), [to, setTo] = useState(100), [pat, setPat] = useState(5), [gifts, setGifts] = useState(50), [ascending, setAscending] = useState(false), [submitted, setSubmitted] = useState(false);
  const result = bondPlan(from, to, pat, gifts);
  const rows = useMemo(() => ascending ? [...bondResourceTable].sort((a, b) => b.exp - a.exp) : [...bondResourceTable].sort((a, b) => a.exp - b.exp), [ascending]);
  const calculate = () => { setSubmitted(true); if (result) { Keyboard.dismiss(); maybeShowCalcInterstitial(isAdFree); } };
  return <CalculatorScreen title={t.bondPageTitle}>
    <StudentPicker {...selected} />
    <CalculatorSection index={1} title={t.bondLevelRange}><RangeSelector min={1} max={100} low={from} high={to} lowLabel={t.bondCurrentLevel} highLabel={t.bondTargetLevel} onChange={(low, high) => { setFrom(low); setTo(high); }} />{submitted && !result ? <CalculatorNote error>{t.bondValidationError}</CalculatorNote> : null}</CalculatorSection>
    <CalculatorSection index={2} title={s.estimates}><View style={styles.settings}><NumberInput value={pat} min={0} max={6} label={t.bondCafePat} onChange={setPat} /><NumberInput value={gifts} min={0} max={200} label={t.bondGift} onChange={setGifts} /></View></CalculatorSection>
    <SignalButton label={t.bondCalculate} onPress={calculate} />
    {result ? <><CalculatorSection index={3} title={s.result} hero><NumberHero value={result.totalExp} label={t.bondRequiredExp} countUp={false} /><ResourceRow label={t.bondEstimatedTime} value={result.totalExp > result.monthly ? `${result.months} ${t.bondMonths}` : t.bondLessMonth} /><ResourceRow label={t.bondDays} value={`${result.days} ${t.bondDaysUnit}`} /></CalculatorSection>
      <CalculatorSection index={4} title={s.gifts}><CalculatorNote>{s.giftNote}</CalculatorNote><SignalButton label={`${s.sort} ${ascending ? '↑' : '↓'}`} variant="ghost" compact onPress={() => setAscending(value => !value)} />{rows.map(item => <ResourceRow key={item.key} icon={item.img} label={`${bondResourceNames[item.key]?.[locale] ?? item.name} · ${item.exp} ${t.bondExp}`} value={Math.ceil(result.totalExp / item.exp)} />)}</CalculatorSection></> : null}
  </CalculatorScreen>;
}
const styles = StyleSheet.create({ settings: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 } });

