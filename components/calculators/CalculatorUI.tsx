import React, { useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View, type ImageSourcePropType } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppCard, BottomSheet, CostGauge, FilterPill, IndexTab, NavBar, ScreenLayout, SearchField, SignalButton } from '@/components/schale';
import { useColors } from '@/hooks/useColors';
import { useType } from '@/constants/typography';
import { calculatorStrings } from '@/constants/strings/calculators';
import { useStrings } from '@/constants/strings/define';
import { useInventory, useWatchlist } from '@/contexts/user-data-context';
import { useGameData } from '@/contexts/gamedata-context';
import InlineAd from '@/services/ads/InlineAd';

export function CalculatorScreen({ title, children }: { title: string; children: ReactNode }) {
  const s = useStrings(calculatorStrings), c = useColors(), type = useType();
  return <ScreenLayout><NavBar title={title} subtitle={s.live} /><View style={styles.stack}>{children}</View><View style={styles.ad}><InlineAd /></View><Text style={[type.kicker, { color: c.textMuted }]}>SCHALE / FIELD CALCULATION</Text></ScreenLayout>;
}
export function CalculatorSection({ index, title, children, hero = false }: { index: number; title: string; children: ReactNode; hero?: boolean }) {
  return <View><IndexTab index={index} title={title} /><AppCard level={hero ? 2 : 1} variant={hero ? 'hero' : 'elevated'} style={styles.stack}>{children}</AppCard></View>;
}
export function CalculatorNote({ children, error = false }: { children: ReactNode; error?: boolean }) {
  const c = useColors(), type = useType();
  return <Text accessibilityLiveRegion={error ? 'polite' : 'none'} style={[type.caption, { color: error ? c.hazardColor : c.textSecondary }]}>{children}</Text>;
}
export function ResourceRow({ label, value, icon }: { label: string; value: number | string; icon?: ImageSourcePropType }) {
  const c = useColors(), type = useType();
  return <View style={[styles.resource, { borderColor: c.hairline }]}>{icon ? <Image source={icon} style={styles.icon} /> : null}<Text style={[type.body, { flex: 1, color: c.textSecondary }]}>{label}</Text><Text style={[type.num, { color: c.textPrimary, flexShrink: 1 }]}>{typeof value === 'number' ? value.toLocaleString() : value}</Text></View>;
}
export type InventoryField = { key: string; label: string; icon?: ImageSourcePropType };
export function InventoryPanel({ fields }: { fields: InventoryField[] }) {
  const s = useStrings(calculatorStrings), c = useColors(), type = useType(), inventory = useInventory();
  const [open, setOpen] = useState(false);
  return <>
    <AppCard variant="surface" style={styles.stack}><CalculatorNote>{inventory.ready ? s.saved : s.loading}</CalculatorNote><SignalButton label={s.editInventory} variant="ghost" onPress={() => setOpen(true)} disabled={!inventory.ready} /></AppCard>
    <BottomSheet visible={open} onClose={() => setOpen(false)} title={s.inventory}><View style={styles.stack}>
      {fields.map(field => <View key={field.key} style={styles.field}>{field.icon ? <Image source={field.icon} style={styles.icon} /> : null}<Text style={[type.body, { flex: 1, color: c.textPrimary }]}>{field.label}</Text><TextInput accessibilityLabel={field.label} keyboardType="number-pad" inputMode="numeric" selectTextOnFocus editable={inventory.ready} value={String(inventory.get(field.key))} onChangeText={text => inventory.set(field.key, Number(text.replace(/[^0-9]/g, '')))} style={[type.num, styles.input, { color: c.textPrimary, backgroundColor: c.surfaceBg, borderColor: c.hairline }]} /></View>)}
      <CalculatorNote>{s.saved}</CalculatorNote><SignalButton label={s.close} onPress={() => setOpen(false)} />
    </View></BottomSheet>
  </>;
}
export function InventoryGauge({ value, max }: { value: number; max: number }) {
  const s = useStrings(calculatorStrings);
  return <CostGauge value={value} max={max} label={s.available} />;
}
export function useCalculatorStudent() {
  const params = useLocalSearchParams<{ studentId?: string }>();
  const [selected, setSelected] = useState<number | null>(null);
  const game = useGameData();
  const id = selected ?? Number(params.studentId);
  const student = game.byId[id];
  return { student, setSelected, game };
}
export function StudentPicker({ student, setSelected, game }: ReturnType<typeof useCalculatorStudent>) {
  const s = useStrings(calculatorStrings), c = useColors(), type = useType(), watchlist = useWatchlist();
  const [open, setOpen] = useState(false), [query, setQuery] = useState(''), [watched, setWatched] = useState(false);
  const students = game.students.filter(item => (!watched || watchlist.has(item.Id)) && game.displayName(item).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <><AppCard variant="surface" style={styles.stack}><Text style={[type.kicker, { color: c.textMuted }]}>{s.student}</Text><Text style={[type.section, { color: c.textPrimary }]}>{student ? game.displayName(student) : s.generic}</Text><SignalButton label={s.chooseStudent} variant="ghost" compact onPress={() => setOpen(true)} />{student ? <Pressable accessibilityRole="link" onPress={() => router.push(`/student/${student.Id}`)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={[type.caption, { color: c.primaryInk }]}>{s.favoriteHint}</Text></Pressable> : null}</AppCard>
    <BottomSheet visible={open} onClose={() => setOpen(false)} title={s.chooseStudent}><View style={styles.stack}><SearchField value={query} onChangeText={setQuery} placeholder={s.search} /><View style={styles.row}><FilterPill label={s.all} selected={!watched} onPress={() => setWatched(false)} /><FilterPill label={s.watched} selected={watched} onPress={() => setWatched(true)} /></View>{students.slice(0, query ? 100 : 40).map(item => <Pressable key={item.Id} accessibilityRole="button" onPress={() => { setSelected(item.Id); setOpen(false); }} style={[styles.student, { borderColor: c.hairline }]}><Text style={[type.bodyStrong, { color: c.textPrimary }]}>{game.displayName(item)}</Text></Pressable>)}</View></BottomSheet>
  </>;
}
const styles = StyleSheet.create({ stack: { gap: 16 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, ad: { marginTop: 48, marginBottom: 24 }, resource: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8 }, icon: { width: 30, height: 30, resizeMode: 'contain' }, field: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 }, input: { minWidth: 100, maxWidth: 150, minHeight: 48, paddingHorizontal: 10, textAlign: 'right', borderWidth: 1, borderRadius: 3 }, student: { minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth, justifyContent: 'center', paddingVertical: 8 } });
