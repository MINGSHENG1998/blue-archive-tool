import React, { useState } from 'react';
import { Keyboard } from 'react-native';
import { RangeSelector } from '@/components/RangeSelector';
import { NumberHero, SignalButton, SlantSegmented } from '@/components/schale';
import { CalculatorScreen, CalculatorSection, CalculatorNote, ResourceRow, InventoryPanel, StudentPicker, useCalculatorStudent } from '@/components/calculators/CalculatorUI';
import { i18n } from '@/constants/i18n';
import { useLanguage } from '@/contexts/language-context';
import { useInventory } from '@/contexts/user-data-context';
import { useAdFreeContext } from '@/contexts/ad-free-context';
import { calculatorStrings } from '@/constants/strings/calculators';
import { useStrings } from '@/constants/strings/define';
import { elephPlan } from '@/services/calculators';
import { maybeShowCalcInterstitial } from '@/services/ads/interstitial';

export default function ElephCalculator() {
  const { locale } = useLanguage(), t = i18n[locale], s = useStrings(calculatorStrings), inventory = useInventory(), { isAdFree } = useAdFreeContext();
  const selected = useCalculatorStudent();
  const [from, setFrom] = useState(1), [to, setTo] = useState(5), [rank, setRank] = useState('1'), [submitted, setSubmitted] = useState(false);
  const key = selected.student ? `eleph:${selected.student.Id}` : 'eleph';
  const result = elephPlan(from, to, inventory.get(key), Number(rank));
  const calculate = () => { setSubmitted(true); if (result && inventory.ready) { Keyboard.dismiss(); maybeShowCalcInterstitial(isAdFree); } };
  return <CalculatorScreen title={t.resourceEleph}>
    <StudentPicker {...selected} />
    <CalculatorSection index={1} title={s.promotion}><RangeSelector min={1} max={5} low={from} high={to} lowLabel={t.elephCurrentRarity} highLabel={t.elephTargetRarity} onChange={(low, high) => { setFrom(low); setTo(high); }} />
      {to === 5 ? <><CalculatorNote>{t.elephWeaponUpgradeLabel}</CalculatorNote><SlantSegmented value={rank} onChange={setRank} options={['1', '2', '3', '4'].map(value => ({ value, label: `${value}★` }))} /></> : null}
      {submitted && !result ? <CalculatorNote error>{t.elephValidationError}</CalculatorNote> : null}
    </CalculatorSection>
    {!selected.student ? <CalculatorNote>{s.genericEleph}</CalculatorNote> : null}
    <InventoryPanel fields={[{ key, label: t.elephCurrentEleph, icon: require('../../assets/images/icons/eleph.png') }]} />
    <SignalButton label={t.resourceCalculate} onPress={calculate} disabled={!inventory.ready} />
    {result ? <CalculatorSection index={2} title={s.result} hero><NumberHero value={result.totalFragments} label={t.elephResourceBreakdown} countUp={false} />{inventory.ready ? <><ResourceRow label={s.remaining} value={result.neededFragments} /><ResourceRow label={t.elephWeaponUpgradeLabel} value={result.weaponUpgradeFragments} /><ResourceRow label={t.elephEligmaCost} value={result.totalEligma} /></> : <CalculatorNote>{s.loading}</CalculatorNote>}<CalculatorNote>{s.pricingNote}</CalculatorNote></CalculatorSection> : null}
  </CalculatorScreen>;
}

