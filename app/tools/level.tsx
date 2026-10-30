import React, { useState } from 'react';
import { Keyboard } from 'react-native';
import { RangeSelector } from '@/components/RangeSelector';
import { NumberHero, SignalButton } from '@/components/schale';
import { CalculatorScreen, CalculatorSection, CalculatorNote, ResourceRow, InventoryPanel, InventoryGauge } from '@/components/calculators/CalculatorUI';
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
  const fields = [
    { key: 'report:superior', label: t.charaExpSuperiorReports, icon: require('../../assets/images/icons/pink_book.png') },
    { key: 'report:advanced', label: t.charaExpAdvancedReports, icon: require('../../assets/images/icons/orange_book.png') },
    { key: 'report:normal', label: t.charaExpNormalReports, icon: require('../../assets/images/icons/blue_book.png') },
    { key: 'report:novice', label: t.charaExpNoviceReports, icon: require('../../assets/images/icons/grey_book.png') },
    { key: 'credits', label: t.charaExpCredits, icon: require('../../assets/images/icons/credit.png') },
  ];
  const result = levelPlan(from, to, { pinkBook: inventory.get(fields[0].key), orangeBook: inventory.get(fields[1].key), blueBook: inventory.get(fields[2].key), greyBook: inventory.get(fields[3].key), credits: inventory.get('credits') });
  const calculate = () => { setSubmitted(true); if (result && inventory.ready) { Keyboard.dismiss(); maybeShowCalcInterstitial(isAdFree); } };
  return <CalculatorScreen title={t.resourceCharacter}>
    <CalculatorSection index={1} title={s.inputs}><RangeSelector min={1} max={90} low={from} high={to} lowLabel={t.bondCurrentLevel} highLabel={t.bondTargetLevel} onChange={(low, high) => { setFrom(low); setTo(high); }} />{submitted && !result ? <CalculatorNote error>{t.charaExpValidationError}</CalculatorNote> : null}</CalculatorSection>
    <InventoryPanel fields={fields} />
    <SignalButton label={t.resourceCalculate} onPress={calculate} disabled={!inventory.ready} />
    {result ? <CalculatorSection index={2} title={s.result} hero><NumberHero value={result.totalExp} label={t.bondRequiredExp} countUp={false} /><InventoryGauge value={result.availableExp} max={result.totalExp} />{inventory.ready ? <>{[result.pinkBooks, result.orangeBooks, result.blueBooks, result.greyBooks, result.creditsNeeded].map((value, index) => <ResourceRow key={fields[index].key} label={fields[index].label} icon={fields[index].icon} value={value} />)}<CalculatorNote>{s.remaining}</CalculatorNote></> : <CalculatorNote>{s.loading}</CalculatorNote>}</CalculatorSection> : null}
  </CalculatorScreen>;
}

