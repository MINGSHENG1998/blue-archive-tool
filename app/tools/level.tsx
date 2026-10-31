import React, { useState } from 'react';
import { Keyboard } from 'react-native';
import { RangeSelector } from '@/components/RangeSelector';
import { NumberHero, SignalButton } from '@/components/schale';
import { CalculatorScreen, CalculatorSection, CalculatorNote, HowItWorks, InputCard, InventoryGauge, InventorySection, ItemGrid, ItemTile, type InventoryField } from '@/components/calculators/CalculatorUI';
import { i18n } from '@/constants/i18n';
import { useLanguage } from '@/contexts/language-context';
import { useInventory } from '@/contexts/user-data-context';
import { useAdFreeContext } from '@/contexts/ad-free-context';
import { calculatorStrings } from '@/constants/strings/calculators';
import { useStrings } from '@/constants/strings/define';
import { levelPlan } from '@/services/calculators';
import { maybeShowCalcInterstitial } from '@/services/ads/interstitial';

export default function LevelCalculator() {
  const { locale } = useLanguage(), t = i18n[locale], s = useStrings(calculatorStrings), inventory = useInventory(), { isAdFree } = useAdFreeContext();
  const [from, setFrom] = useState(1), [to, setTo] = useState(90), [submitted, setSubmitted] = useState(false);
  const fields: InventoryField[] = [
    { key: 'report:superior', label: t.charaExpSuperiorReports, icon: 'reportPink' },
    { key: 'report:advanced', label: t.charaExpAdvancedReports, icon: 'reportOrange' },
    { key: 'report:normal', label: t.charaExpNormalReports, icon: 'reportBlue' },
    { key: 'report:novice', label: t.charaExpNoviceReports, icon: 'reportGrey' },
    { key: 'credits', label: t.charaExpCredits, icon: 'credit' },
  ];
  const result = levelPlan(from, to, { pinkBook: inventory.get(fields[0].key), orangeBook: inventory.get(fields[1].key), blueBook: inventory.get(fields[2].key), greyBook: inventory.get(fields[3].key), credits: inventory.get('credits') });
  const calculate = () => { setSubmitted(true); if (result && inventory.ready) { Keyboard.dismiss(); maybeShowCalcInterstitial(isAdFree); } };
  const needed = result ? [result.pinkBooks, result.orangeBooks, result.blueBooks, result.greyBooks, result.creditsNeeded] : [];
  return <CalculatorScreen tool="Level">
    <InputCard>
      <RangeSelector min={1} max={90} low={from} high={to} lowLabel={t.bondCurrentLevel} highLabel={t.bondTargetLevel} onChange={(low, high) => { setFrom(low); setTo(high); }} />
      {submitted && !result ? <CalculatorNote error>{t.charaExpValidationError}</CalculatorNote> : null}
    </InputCard>
    <SignalButton label={t.resourceCalculate} onPress={calculate} disabled={!inventory.ready} />
    {result ? <CalculatorSection title={s.result} right={<HowItWorks points={[s.howLevelReports, s.howLevelOrder, s.howLevelCredits, s.howOwned]} />}>
      <NumberHero value={result.totalExp} label={t.bondRequiredExp} countUp={false} />
      <InventoryGauge value={result.availableExp} max={result.totalExp} />
      {!inventory.ready ? <CalculatorNote>{s.loading}</CalculatorNote> : needed.some(value => value > 0) ? <>
        <ItemGrid>{fields.map((field, index) => needed[index] > 0 ? <ItemTile key={field.key} icon={field.icon} label={field.label} value={needed[index]} /> : null)}</ItemGrid>
        <CalculatorNote>{s.afterItems}</CalculatorNote>
      </> : <CalculatorNote>{s.nothingNeeded}</CalculatorNote>}
    </CalculatorSection> : null}
    <InventorySection fields={fields} />
  </CalculatorScreen>;
}
