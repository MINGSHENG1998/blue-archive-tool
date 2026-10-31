import React, { useRef, useState, useCallback, useEffect } from 'react';
import { AppState, Image, View, Text, Pressable, TextInput, StyleSheet, type ImageSourcePropType } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useType } from '@/constants/typography';
import { RADIUS } from '@/constants/layout';
import { Icon } from '@/components/schale/Icon';
import { clampInteger, holdStep } from '@/services/calculator-controls';

interface NumberInputProps {
  value: number;
  onChange: (newValue: number) => void;
  label?: string;
  min?: number;
  max?: number;
  /** An item icon drawn before the label (a headpat, a gift box). */
  icon?: ImageSourcePropType;
}

/** A single press changes one; holding repeats and accelerates in whole steps. */
export default function NumberInput({ value, onChange, label, min = 0, max = 100, icon }: NumberInputProps) {
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
  const button = (direction: 1 | -1, disabled: boolean) => <Pressable accessibilityRole="button" accessibilityLabel={`${label ?? ''} ${direction > 0 ? '+' : '−'}`} disabled={disabled}
    onPress={() => step(direction)} onLongPress={() => start(direction)} delayLongPress={350} onPressOut={stop} onTouchCancel={stop} hitSlop={4}
    style={({ pressed }) => [styles.button, pressed && { backgroundColor: c.primaryA08 }, { opacity: disabled ? 0.3 : 1 }]}>
    <Icon name={direction > 0 ? 'plus' : 'minus'} size={20} color={c.primaryInk} />
  </Pressable>;
  return <View style={styles.wrapper}>
    {label ? <View style={styles.head}>
      {icon ? <Image source={icon} style={styles.icon} resizeMode="contain" /> : null}
      <Text numberOfLines={1} style={[type.caption, { color: c.textSecondary, flexShrink: 1 }]}>{label}</Text>
    </View> : null}
    <View style={[styles.container, { backgroundColor: c.surfaceBg }]}>
      {button(-1, value <= min)}
      <TextInput accessibilityLabel={label} accessibilityValue={{ min, max, now: value }} keyboardType="number-pad" inputMode="numeric"
        value={draft ?? String(value)} onFocus={() => { stop(); setDraft(String(value)); }} onChangeText={text => setDraft(text.replace(/[^0-9]/g, ''))}
        onBlur={commit} onSubmitEditing={commit} selectTextOnFocus style={[type.num, styles.value, { color: c.textPrimary }]} />
      {button(1, value >= max)}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  wrapper: { gap: 6, flexShrink: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 24 },
  icon: { width: 24, height: 24 },
  container: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.control, padding: 4, gap: 4 },
  button: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  value: { flex: 1, minWidth: 48, minHeight: 40, fontSize: 20, lineHeight: 26, textAlign: 'center', paddingVertical: 0 },
});
