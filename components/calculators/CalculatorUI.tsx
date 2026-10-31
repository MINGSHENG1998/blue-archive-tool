import React, { useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View, type ImageSourcePropType } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppCard, BottomSheet, CostGauge, FilterPill, Icon, IndexTab, ItemAmount, ItemInput, NavBar, ScreenLayout, SearchField, SignalButton, type IconName } from '@/components/schale';
import { FallbackImage } from '@/components/FallbackImage';
import { gameIcons, type GameIconName } from '@/constants/gameIcons';
import { RADIUS } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { useType } from '@/constants/typography';
import { calculatorStrings } from '@/constants/strings/calculators';
import { navStrings } from '@/constants/strings/nav';
import { useStrings } from '@/constants/strings/define';
import { useInventory, useWatchlist } from '@/contexts/user-data-context';
import { useGameData } from '@/contexts/gamedata-context';
import { studentIconUris } from '@/services/gamedata';
import InlineAd from '@/services/ads/InlineAd';

/** A bundled game icon by name, or any image source (skill books, OOParts, type badges). */
export type IconSource = GameIconName | ImageSourcePropType;
const isGameIcon = (icon: IconSource): icon is GameIconName => typeof icon === 'string' && icon in gameIcons;
const sourceOf = (icon: IconSource): ImageSourcePropType => isGameIcon(icon) ? gameIcons[icon] : icon;
const grouped = (value: number | string) => typeof value === 'number' ? (Number.isFinite(value) ? Math.round(value).toLocaleString() : '0') : value;

/** Calculator page shell. `tool` titles the page with the same localized name as its Tools tile. */
export function CalculatorScreen({ tool, children }: { tool: 'Bond' | 'Level' | 'Eleph' | 'Skill' | 'Raid'; children: ReactNode }) {
  const title = useStrings(navStrings)[`tool${tool}`];
  return <ScreenLayout><NavBar title={title} /><View style={styles.screen}>{children}</View><View style={styles.ad}><InlineAd /></View></ScreenLayout>;
}

/** A plain section heading and its card. `right` takes a small control (a "How it works" link, "Edit"). */
export function CalculatorSection({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return <View><IndexTab title={title} right={right} style={styles.heading} /><AppCard style={styles.stack}>{children}</AppCard></View>;
}

/** The card holding the inputs that drive a screen's answer. No heading: the controls label themselves. */
export function InputCard({ children }: { children: ReactNode }) {
  return <AppCard style={styles.inputs}>{children}</AppCard>;
}

export function CalculatorNote({ children, error = false }: { children: ReactNode; error?: boolean }) {
  const c = useColors(), type = useType();
  return <Text accessibilityLiveRegion={error ? 'polite' : 'none'} style={[type.caption, { color: error ? c.hazardColor : c.textMuted }]}>{children}</Text>;
}

/** A small inline action: primary ink text with an optional glyph, 44pt target via hitSlop. */
export function TextLink({ label, icon, onPress, disabled = false, accessibilityLabel }: { label: string; icon?: IconName; onPress: () => void; disabled?: boolean; accessibilityLabel?: string }) {
  const c = useColors(), type = useType();
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} hitSlop={10}
    style={({ pressed }) => [styles.link, { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }]}>
    {icon ? <Icon name={icon} size={16} color={c.primaryInk} /> : null}
    <Text numberOfLines={1} style={[type.labelCaps, { color: c.primaryInk }]}>{label}</Text>
  </Pressable>;
}

/** "How it works": a text link that opens the screen's rules, one short sentence per point. */
export function HowItWorks({ points, children }: { points: string[]; children?: ReactNode }) {
  const s = useStrings(calculatorStrings), c = useColors(), type = useType();
  const [open, setOpen] = useState(false);
  return <>
    <TextLink label={s.howItWorks} icon="help-circle-outline" onPress={() => setOpen(true)} />
    <BottomSheet visible={open} onClose={() => setOpen(false)} title={s.howItWorks}>
      <View style={styles.points}>
        {points.map(point => <View key={point} style={styles.point}>
          <View style={[styles.dot, { backgroundColor: c.primaryColor }]} />
          <Text style={[type.body, { color: c.textSecondary, flex: 1 }]}>{point}</Text>
        </View>)}
        {children}
      </View>
    </BottomSheet>
  </>;
}

/** Answer tiles, 3 per row on a phone. */
export function ItemGrid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

/** One answer: the item's icon over a big count, with an optional one-line caption. */
export function ItemTile({ icon, value, label, caption, tone }: { icon: IconSource; value: number | string; label: string; caption?: string; tone?: string }) {
  const c = useColors(), type = useType();
  const shown = grouped(value);
  return <View style={[styles.tile, { backgroundColor: c.surfaceBg }]} accessible accessibilityLabel={`${label} ${shown}`}>
    <Image source={sourceOf(icon)} style={styles.tileIcon} resizeMode="contain" />
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={[type.num, styles.tileValue, { color: tone ?? c.textPrimary }]}>{shown}</Text>
    {caption ? <Text numberOfLines={1} style={[type.caption, { color: c.textMuted }]}>{caption}</Text> : null}
  </View>;
}

/** Icon + number inline. Game icons go through the shared ItemAmount; other sources render the same shape. */
function Amount({ icon, value, label, size = 24 }: { icon: IconSource; value: number; label: string; size?: number }) {
  const c = useColors(), type = useType();
  if (isGameIcon(icon)) return <ItemAmount icon={icon} value={value} label={label} size={size} />;
  const shown = grouped(value);
  return <View style={styles.amount} accessible accessibilityLabel={`${label} ${shown}`}>
    <Image source={icon} style={{ width: size, height: size }} resizeMode="contain" />
    <Text style={[type.num, { color: c.textPrimary, fontSize: Math.max(15, size * 0.6) }]}>{shown}</Text>
  </View>;
}

/** An owned-item field. Game icons go through the shared ItemInput; other sources render the same tile. */
function Owned({ icon, label, value, onChange, editable }: { icon: IconSource; label: string; value: number; onChange: (next: number) => void; editable: boolean }) {
  const c = useColors(), type = useType();
  if (isGameIcon(icon)) return <ItemInput icon={icon} label={label} value={value} onChange={onChange} editable={editable} />;
  return <View style={[styles.owned, { backgroundColor: c.surfaceBg }]}>
    <View style={styles.ownedHead}>
      <Image source={icon} style={styles.ownedIcon} resizeMode="contain" />
      <Text style={[type.caption, { color: c.textSecondary, flex: 1 }]} numberOfLines={2}>{label}</Text>
    </View>
    <TextInput accessibilityLabel={label} keyboardType="number-pad" inputMode="numeric" selectTextOnFocus editable={editable}
      value={value ? String(value) : ''} placeholder="0" placeholderTextColor={c.textMuted}
      onChangeText={text => onChange(Number(text.replace(/[^0-9]/g, '')) || 0)}
      style={[type.num, styles.ownedInput, { color: c.textPrimary }]} />
  </View>;
}

export type InventoryField = { key: string; label: string; icon: IconSource };

/**
 * The shared inventory, saved on the device and read by every calculator.
 * Collapsed it is a bag view (icons and counts, read item by item); "Edit"
 * opens the fields, and so does a tap on the bag.
 */
export function InventorySection({ fields }: { fields: InventoryField[] }) {
  const s = useStrings(calculatorStrings), inventory = useInventory();
  const [open, setOpen] = useState(false);
  return <View>
    <IndexTab title={s.inventory} style={styles.heading}
      right={<TextLink label={open ? s.close : s.edit} icon={open ? 'check' : 'pencil-outline'} disabled={!inventory.ready} onPress={() => setOpen(value => !value)}
        accessibilityLabel={open ? s.close : s.editInventory} />} />
    <AppCard style={styles.stack}>
      {open ? <View style={styles.fields}>
        {fields.map(field => <Owned key={field.key} icon={field.icon} label={field.label} value={inventory.get(field.key)} editable={inventory.ready} onChange={next => inventory.set(field.key, next)} />)}
      </View> : <Pressable accessible={false} disabled={!inventory.ready} onPress={() => setOpen(true)} style={styles.bag}>
        {fields.map(field => <Amount key={field.key} icon={field.icon} label={field.label} value={inventory.get(field.key)} />)}
      </Pressable>}
    </AppCard>
    <View style={styles.footnote}><CalculatorNote>{inventory.ready ? s.saved : s.loading}</CalculatorNote></View>
  </View>;
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

/**
 * The student a calculator is for: avatar, name, and a compact "Change".
 * `hint` shows under "General estimate" while no student is picked;
 * `profileLink` adds a link to the student's profile once one is.
 */
export function StudentPicker({ student, setSelected, game, hint, profileLink }: ReturnType<typeof useCalculatorStudent> & { hint?: string; profileLink?: string }) {
  const s = useStrings(calculatorStrings), c = useColors(), type = useType(), watchlist = useWatchlist();
  const [open, setOpen] = useState(false), [query, setQuery] = useState(''), [watched, setWatched] = useState(false);
  const students = game.students.filter(item => (!watched || watchlist.has(item.Id)) && game.displayName(item).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const name = student ? game.displayName(student) : s.generic;
  return <>
    <AppCard padding={14} style={styles.picker}>
      {student ? <FallbackImage uris={studentIconUris(student.Id)} label={name} style={[styles.avatar, { backgroundColor: c.surfaceBg }]} />
        : <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: c.surfaceBg }]}><Icon name="account-outline" size={26} color={c.textMuted} /></View>}
      <View style={styles.pickerText}>
        <Text numberOfLines={1} style={[type.bodyStrong, { color: c.textPrimary }]}>{name}</Text>
        {!student && hint ? <Text numberOfLines={1} style={[type.caption, { color: c.textMuted }]}>{hint}</Text> : null}
        {student && profileLink ? <TextLink label={profileLink} icon="gift-outline" onPress={() => router.push(`/student/${student.Id}`)} /> : null}
      </View>
      <SignalButton label={student ? s.change : s.chooseStudent} variant="ghost" compact onPress={() => setOpen(true)} />
    </AppCard>
    <BottomSheet visible={open} onClose={() => setOpen(false)} title={s.chooseStudent}><View style={styles.stack}>
      <SearchField value={query} onChangeText={setQuery} placeholder={s.search} />
      <View style={styles.row}><FilterPill label={s.all} selected={!watched} onPress={() => setWatched(false)} /><FilterPill label={s.watched} selected={watched} onPress={() => setWatched(true)} /></View>
      <View>{students.slice(0, query ? 100 : 40).map(item => {
        const itemName = game.displayName(item);
        return <Pressable key={item.Id} accessibilityRole="button" accessibilityLabel={itemName} onPress={() => { setSelected(item.Id); setOpen(false); }} style={[styles.student, { borderColor: c.hairline }]}>
          <FallbackImage uris={studentIconUris(item.Id)} label={itemName} style={[styles.studentAvatar, { backgroundColor: c.surfaceBg }]} />
          <Text numberOfLines={1} style={[type.bodyStrong, { color: c.textPrimary, flex: 1 }]}>{itemName}</Text>
        </Pressable>;
      })}</View>
    </View></BottomSheet>
  </>;
}

const styles = StyleSheet.create({
  screen: { gap: 28 },
  stack: { gap: 16 },
  inputs: { gap: 14 },
  heading: { marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ad: { marginTop: 48, marginBottom: 24 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 28 },
  points: { gap: 14, paddingBottom: 8 },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexBasis: '30%', flexGrow: 1, minWidth: 84, alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 8, borderRadius: RADIUS.control },
  tileIcon: { width: 40, height: 40 },
  tileValue: { fontSize: 20, lineHeight: 26, maxWidth: '100%' },
  amount: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  owned: { flex: 1, minWidth: 96, padding: 12, gap: 8, borderRadius: RADIUS.control },
  ownedHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ownedIcon: { width: 28, height: 28 },
  ownedInput: { fontSize: 22, lineHeight: 28, minHeight: 36, paddingVertical: 0 },
  bag: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 10 },
  footnote: { marginTop: 8 },
  picker: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  pickerText: { flex: 1, gap: 2, alignItems: 'flex-start' },
  student: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
  studentAvatar: { width: 40, height: 40, borderRadius: 20 },
});
