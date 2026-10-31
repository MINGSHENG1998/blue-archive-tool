import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, PressScale, type IconName } from '@/components/schale';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';

/** One line in a grouped list: optional leading art/icon, small label, title, caption. */
export function HomeRow({ first, icon, lead, meta, title, caption, extra, onPress }: {
  first?: boolean; icon?: IconName; lead?: ReactNode; meta?: string; title: string; caption?: string; extra?: ReactNode; onPress?: () => void;
}) {
  const c = useColors();
  const type = useType();
  const body = <View style={[styles.row, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.isDark ? c.hairline : c.surfaceBorder }]}>
    {lead ?? (icon ? <View style={styles.iconSlot}><Icon name={icon} size={22} color={c.primaryInk} /></View> : null)}
    <View style={styles.flex}>
      {meta ? <Text style={[type.caption, { color: c.textMuted }]}>{meta}</Text> : null}
      <Text style={[type.bodyStrong, { color: c.textPrimary }]} numberOfLines={2}>{title}</Text>
      {caption ? <Text style={[type.caption, { color: c.textSecondary }]}>{caption}</Text> : null}
      {extra}
    </View>
    {onPress ? <Icon name="chevron-right" size={20} color={c.textMuted} /> : null}
  </View>;
  return onPress ? <PressScale spark={false} onPress={onPress} accessibilityLabel={title}>{body}</PressScale> : body;
}

/** Shared spacing so widgets line up in any order. */
export const homeStyles = StyleSheet.create({
  heading: { marginBottom: 10 },
  block: { marginBottom: 28 },
});

const styles = StyleSheet.create({
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  iconSlot: { width: 34, alignItems: 'center' },
  flex: { flex: 1, gap: 1 },
});
