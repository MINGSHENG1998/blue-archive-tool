import React, { useState } from 'react';
import { Keyboard, StyleSheet, Switch, Text, View } from 'react-native';
import { RangeSelector } from '@/components/RangeSelector';
import { NumberHero, SignalButton } from '@/components/schale';
import { CalculatorScreen, CalculatorSection, CalculatorNote, ResourceRow, InventoryPanel, InventoryGauge } from '@/components/calculators/CalculatorUI';
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
const CREDIT = require('../../assets/images/icons/credit.png'), SECRET = require('../../assets/images/icons/secret_note.webp');
export default function SkillCalculator() {
  const { locale } = useLanguage(), t = i18n[locale], s = useStrings(calculatorStrings), type = useType(), c = useColors(), inventory = useInventory(), { isAdFree } = useAdFreeContext();
  const [ranges, setRanges] = useState<LevelRange[]>([{ current: 1, target: 5 }, ...Array.from({ length: 3 }, () => ({ current: 1, target: 10 }))]);
  const [enabled, setEnabled] = useState([true, true, true, true]);
  const labels = [t.skillExLabel, t.skillSkill1, t.skillSkill2, t.skillSkill3];
  const range = (index: number) => enabled[index] ? ranges[index] : { current: 1, target: 1 };
  const totals = calculateSkillCost({ ex: range(0), skills: [range(1), range(2), range(3)] });
  const fields = [...[t.skillBd1, t.skillBd2, t.skillBd3, t.skillBd4].map((label, index) => ({ key: `bd:${index + 1}`, label, icon: BD[index] })), ...[t.skillTn1, t.skillTn2, t.skillTn3, t.skillTn4].map((label, index) => ({ key: `tn:${index + 1}`, label, icon: TN[index] })), { key: 'secretNotes', label: t.skillSecretNotes, icon: SECRET }, { key: 'credits', label: t.charaExpCredits, icon: CREDIT }];
  const owned: SkillCostResult = { bd: [1, 2, 3, 4].map(tier => inventory.get(`bd:${tier}`)) as SkillCostResult['bd'], tn: [1, 2, 3, 4].map(tier => inventory.get(`tn:${tier}`)) as SkillCostResult['tn'], secretNotes: inventory.get('secretNotes'), credits: inventory.get('credits'), artifactLow: 0, artifactHigh: 0 };
  const needed = applyInventory(totals, owned);
  const values = [...needed.bd, ...needed.tn, needed.secretNotes, needed.credits];
  return <CalculatorScreen title={t.resourceSkill}>
    <CalculatorSection index={1} title={t.skillLevelConfig}>{ranges.map((item, index) => <View key={index} style={styles.skill}>
      <View style={styles.header}><Text style={[type.bodyStrong, { color: c.textPrimary, flex: 1 }]}>{labels[index]}</Text><Switch accessibilityLabel={`${s.enabled}: ${labels[index]}`} value={enabled[index]} onValueChange={value => setEnabled(previous => previous.map((v, i) => i === index ? value : v))} trackColor={{ false: c.surfaceBorder, true: c.primaryA28 }} thumbColor={enabled[index] ? c.primaryColor : c.textMuted} style={{ minHeight: 44 }} /></View>
      {enabled[index] ? <RangeSelector min={1} max={index === 0 ? 5 : 10} low={item.current} high={item.target} lowLabel={t.bondCurrentLevel} highLabel={t.bondTargetLevel} onChange={(current, target) => setRanges(previous => previous.map((v, i) => i === index ? { current, target } : v))} /> : null}
    </View>)}</CalculatorSection>
    <InventoryPanel fields={fields} />
    <SignalButton label={t.resourceCalculate} disabled={!inventory.ready} onPress={() => { Keyboard.dismiss(); maybeShowCalcInterstitial(isAdFree); }} />
    <CalculatorSection index={2} title={s.result} hero><NumberHero value={totals.credits} label={t.skillTotalCredits} countUp={false} /><InventoryGauge value={owned.credits} max={totals.credits} />{inventory.ready ? <>{fields.map((field, index) => values[index] > 0 ? <ResourceRow key={field.key} label={field.label} icon={field.icon} value={values[index]} /> : null)}<CalculatorNote>{s.remaining}</CalculatorNote></> : <CalculatorNote>{s.loading}</CalculatorNote>}<ResourceRow label={t.skillOoLow} value={`~${needed.artifactLow.toLocaleString()}`} icon={require('../../assets/images/icons/oopart_low.webp')} /><ResourceRow label={t.skillOoHigh} value={`~${needed.artifactHigh.toLocaleString()}`} icon={require('../../assets/images/icons/oopart_high.webp')} /><CalculatorNote>{t.skillArtifactNote}</CalculatorNote></CalculatorSection>
  </CalculatorScreen>;
}
const styles = StyleSheet.create({ skill: { gap: 8, marginBottom: 16 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12 } });
