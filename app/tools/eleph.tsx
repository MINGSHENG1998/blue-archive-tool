import React, { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { RangeSelector } from '@/components/RangeSelector';
import { NumberHero, SignalButton, SlantSegmented } from '@/components/schale';
import { CalculatorScreen, CalculatorSection, CalculatorNote, HowItWorks, InputCard, InventorySection, ItemGrid, ItemTile, StudentPicker, useCalculatorStudent } from '@/components/calculators/CalculatorUI';
import { i18n } from '@/constants/i18n';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/contexts/language-context';
import { useInventory } from '@/contexts/user-data-context';
import { useAdFreeContext } from '@/contexts/ad-free-context';
import { calculatorStrings } from '@/constants/strings/calculators';
import { useStrings } from '@/constants/strings/define';
import { elephPlan } from '@/services/calculators';
import { maybeShowCalcInterstitial } from '@/services/ads/interstitial';

const stars = (value: number) => `${value}★`;

export default function ElephCalculator() {
  const { locale } = useLanguage(), t = i18n[locale], s = useStrings(calculatorStrings), c = useColors(), type = useType(), inventory = useInventory(), { isAdFree } = useAdFreeContext();
  const selected = useCalculatorStudent();
  const [from, setFrom] = useState(1), [to, setTo] = useState(5), [rank, setRank] = useState('1'), [submitted, setSubmitted] = useState(false);
  const key = selected.student ? `eleph:${selected.student.Id}` : 'eleph';
  const result = elephPlan(from, to, inventory.get(key), Number(rank));
  const calculate = () => { setSubmitted(true); if (result && inventory.ready) { Keyboard.dismiss(); maybeShowCalcInterstitial(isAdFree); } };
  return <CalculatorScreen tool="Eleph">
    <StudentPicker {...selected} hint={s.genericEleph} />
    <InputCard>
      <RangeSelector min={1} max={5} low={from} high={to} lowLabel={t.elephCurrentRarity} highLabel={t.elephTargetRarity} slider={false} format={stars} onChange={(low, high) => { setFrom(low); setTo(high); }} />
      {to === 5 ? <View style={styles.weapon}>
        <Text style={[type.caption, { color: c.textSecondary }]}>{t.elephWeaponUpgradeLabel}</Text>
        <SlantSegmented value={rank} onChange={setRank} options={['1', '2', '3', '4'].map(value => ({ value, label: `${value}★` }))} />
      </View> : null}
      {submitted && !result ? <CalculatorNote error>{t.elephValidationError}</CalculatorNote> : null}
    </InputCard>
    <SignalButton label={t.resourceCalculate} onPress={calculate} disabled={!inventory.ready} />
    {result ? <CalculatorSection title={s.result} right={<HowItWorks points={[s.howElephOwned, s.howElephWeapon, s.howElephEligma]} />}>
      <NumberHero value={result.totalFragments} label={s.elephTotal} countUp={false} />
      {inventory.ready ? <ItemGrid>
        <ItemTile icon="eleph" label={s.remaining} caption={s.remaining} value={result.neededFragments} />
        {result.weaponUpgradeFragments > 0 ? <ItemTile icon="eleph" label={t.elephWeaponUpgradeLabel} caption={t.elephWeaponUpgradeLabel} value={result.weaponUpgradeFragments} /> : null}
        <ItemTile icon="eligma" label={s.eligma} caption={s.eligma} value={result.totalEligma} />
      </ItemGrid> : <CalculatorNote>{s.loading}</CalculatorNote>}
    </CalculatorSection> : null}
    <InventorySection fields={[{ key, label: t.elephCurrentEleph, icon: 'eleph' }]} />
  </CalculatorScreen>;
}
const styles = StyleSheet.create({ weapon: { gap: 8 } });
