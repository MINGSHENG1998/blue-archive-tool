import React, { useState } from 'react';
import { Keyboard, StyleSheet, Switch, Text, View } from 'react-native';
import { RangeSelector } from '@/components/RangeSelector';
import { NumberHero, SignalButton } from '@/components/schale';
import { CalculatorScreen, CalculatorSection, CalculatorNote, HowItWorks, InventoryGauge, InventorySection, ItemGrid, ItemTile, type InventoryField } from '@/components/calculators/CalculatorUI';
import { calculateSkillCost, applyInventory, type LevelRange, type SkillCostResult } from '@/constants/skillData';
import { i18n } from '@/constants/i18n';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/contexts/language-context';
import { useInventory } from '@/contexts/user-data-context';
import { useAdFreeContext } from '@/contexts/ad-free-context';
import { calculatorStrings } from '@/constants/strings/calculators';
import { useStrings } from '@/constants/strings/define';
import { maybeShowCalcInterstitial } from '@/services/ads/interstitial';

const BD = [require('../../assets/images/icons/bd_t1.webp'), require('../../assets/images/icons/bd_t2.webp'), require('../../assets/images/icons/bd_t3.webp'), require('../../assets/images/icons/bd_t4.webp')];
const TN = [require('../../assets/images/icons/tn_t1.webp'), require('../../assets/images/icons/tn_t2.webp'), require('../../assets/images/icons/tn_t3.webp'), require('../../assets/images/icons/tn_t4.webp')];
const OOPART_LOW = require('../../assets/images/icons/oopart_low.webp'), OOPART_HIGH = require('../../assets/images/icons/oopart_high.webp');
export default function SkillCalculator() {
  const { locale } = useLanguage(), t = i18n[locale], s = useStrings(calculatorStrings), type = useType(), c = useColors(), inventory = useInventory(), { isAdFree } = useAdFreeContext();
  const [ranges, setRanges] = useState<LevelRange[]>([{ current: 1, target: 5 }, ...Array.from({ length: 3 }, () => ({ current: 1, target: 10 }))]);
  const [enabled, setEnabled] = useState([true, true, true, true]);
  const labels = [t.skillExLabel, t.skillSkill1, t.skillSkill2, t.skillSkill3];
  const range = (index: number) => enabled[index] ? ranges[index] : { current: 1, target: 1 };
  const totals = calculateSkillCost({ ex: range(0), skills: [range(1), range(2), range(3)] });
  const fields: InventoryField[] = [...[t.skillBd1, t.skillBd2, t.skillBd3, t.skillBd4].map((label, index) => ({ key: `bd:${index + 1}`, label, icon: BD[index] })), ...[t.skillTn1, t.skillTn2, t.skillTn3, t.skillTn4].map((label, index) => ({ key: `tn:${index + 1}`, label, icon: TN[index] })), { key: 'secretNotes', label: t.skillSecretNotes, icon: 'secretNote' }, { key: 'credits', label: t.charaExpCredits, icon: 'credit' }];
  const owned: SkillCostResult = { bd: [1, 2, 3, 4].map(tier => inventory.get(`bd:${tier}`)) as SkillCostResult['bd'], tn: [1, 2, 3, 4].map(tier => inventory.get(`tn:${tier}`)) as SkillCostResult['tn'], secretNotes: inventory.get('secretNotes'), credits: inventory.get('credits'), artifactLow: 0, artifactHigh: 0 };
  const needed = applyInventory(totals, owned);
  const values = [...needed.bd, ...needed.tn, needed.secretNotes, needed.credits];
  return <CalculatorScreen tool="Skill">
    <CalculatorSection title={t.skillLevelConfig}>{ranges.map((item, index) => <View key={index} style={[styles.skill, index > 0 && { borderTopColor: c.hairline, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14 }]}>
      <View style={styles.header}><Text style={[type.bodyStrong, { color: enabled[index] ? c.textPrimary : c.textMuted, flex: 1 }]}>{labels[index]}</Text><Switch accessibilityLabel={`${s.enabled}: ${labels[index]}`} value={enabled[index]} onValueChange={value => setEnabled(previous => previous.map((v, i) => i === index ? value : v))} trackColor={{ false: c.surfaceBorder, true: c.primaryA28 }} thumbColor={enabled[index] ? c.primaryColor : c.textMuted} /></View>
      {enabled[index] ? <RangeSelector min={1} max={index === 0 ? 5 : 10} low={item.current} high={item.target} lowLabel={`${labels[index]} · ${t.bondCurrentLevel}`} highLabel={`${labels[index]} · ${t.bondTargetLevel}`} slider={false} captions={false} onChange={(current, target) => setRanges(previous => previous.map((v, i) => i === index ? { current, target } : v))} /> : null}
    </View>)}</CalculatorSection>
    <SignalButton label={t.resourceCalculate} disabled={!inventory.ready} onPress={() => { Keyboard.dismiss(); maybeShowCalcInterstitial(isAdFree); }} />
    <CalculatorSection title={s.result} right={<HowItWorks points={[s.howSkillSum, s.howOwned, t.skillArtifactNote]} />}>
      <NumberHero value={totals.credits} label={t.skillTotalCredits} countUp={false} />
      <InventoryGauge value={owned.credits} max={totals.credits} />
      {!inventory.ready ? <CalculatorNote>{s.loading}</CalculatorNote> : values.some(value => value > 0) ? <>
        <ItemGrid>{fields.map((field, index) => values[index] > 0 ? <ItemTile key={field.key} icon={field.icon} label={field.label} value={values[index]} /> : null)}</ItemGrid>
        <CalculatorNote>{s.afterItems}</CalculatorNote>
      </> : <CalculatorNote>{s.nothingNeeded}</CalculatorNote>}
      {needed.artifactLow > 0 || needed.artifactHigh > 0 ? <ItemGrid>
        <ItemTile icon={OOPART_LOW} label={t.skillOoLow} caption={t.skillOoLow} value={`~${needed.artifactLow.toLocaleString()}`} />
        <ItemTile icon={OOPART_HIGH} label={t.skillOoHigh} caption={t.skillOoHigh} value={`~${needed.artifactHigh.toLocaleString()}`} />
      </ItemGrid> : null}
    </CalculatorSection>
    <InventorySection fields={fields} />
  </CalculatorScreen>;
}
const styles = StyleSheet.create({ skill: { gap: 10 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 } });
