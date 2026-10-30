import React, { useRef, useState, useCallback, useEffect } from 'react';
import { AppState, View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useType } from '@/constants/typography';
import { clampInteger, holdStep } from '@/services/calculator-controls';

interface NumberInputProps {
  value: number;
  onChange: (newValue: number) => void;
  label?: string;
  min?: number;
  max?: number;
}

/** A single press changes one; holding repeats and accelerates in whole steps. */
export default function NumberInput({ value, onChange, label, min = 0, max = 100 }: NumberInputProps) {
  const c = useColors(), type = useType();
  const [draft, setDraft] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ value, onChange, min, max });
  latest.current = { value, onChange, min, max };
  const stop = useCallback(() => { if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; } }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') stop(); });
    return () => { stop(); subscription.remove(); };
  }, [stop]);
  const update = (next: number) => {
    const p = latest.current;
    const clamped = clampInteger(next, p.min, p.max);
    if (clamped !== p.value) { latest.current = { ...p, value: clamped }; p.onChange(clamped); }
    return clamped;
  };
  const start = (direction: number) => {
    stop(); setDraft(null);
    const startedAt = Date.now();
    update(latest.current.value + direction);
    const repeat = () => {
      const p = latest.current;
      const next = update(p.value + direction * holdStep(Date.now() - startedAt));
      if (next > p.min && next < p.max) timer.current = setTimeout(repeat, 100);
    };
    timer.current = setTimeout(repeat, 350);
  };
  const commit = () => { if (draft !== null) update(Number(draft)); setDraft(null); };
  const step = (direction: number) => { setDraft(null); update(latest.current.value + direction); };
  return <View style={styles.wrapper}>
    {label ? <Text style={[type.caption, { color: c.textSecondary }]}>{label}</Text> : null}
    <View style={[styles.container, { borderColor: c.hairline, backgroundColor: c.surfaceBg }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label ?? ''} −`} disabled={value <= min} onPress={() => step(-1)} onLongPress={() => start(-1)} delayLongPress={350} onPressOut={stop} onTouchCancel={stop}
        style={[styles.button, { backgroundColor: c.accentSoft, opacity: value <= min ? 0.4 : 1 }]}><Text style={[type.section, { color: c.primaryInk }]}>−</Text></Pressable>
      <TextInput accessibilityLabel={label} accessibilityValue={{ min, max, now: value }} keyboardType="number-pad" inputMode="numeric"
        value={draft ?? String(value)} onFocus={() => { stop(); setDraft(String(value)); }} onChangeText={text => setDraft(text.replace(/[^0-9]/g, ''))}
        onBlur={commit} onSubmitEditing={commit} selectTextOnFocus style={[type.num, styles.value, { color: c.textPrimary }]} />
      <Pressable accessibilityRole="button" accessibilityLabel={`${label ?? ''} +`} disabled={value >= max} onPress={() => step(1)} onLongPress={() => start(1)} delayLongPress={350} onPressOut={stop} onTouchCancel={stop}
        style={[styles.button, { backgroundColor: c.accentSoft, opacity: value >= max ? 0.4 : 1 }]}><Text style={[type.section, { color: c.primaryInk }]}>+</Text></Pressable>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  wrapper: { gap: 6, flexShrink: 1 },
  container: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 4, padding: 4, gap: 8 },
  button: { width: 44, height: 44, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  value: { minWidth: 48, minHeight: 44, textAlign: 'center', flexShrink: 1 },
});

