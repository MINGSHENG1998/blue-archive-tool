import { useRouter, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { categoryColors } from '@/constants/categoryColors';
import { navStrings } from '@/constants/strings/nav';
import { toolsStrings } from '@/constants/strings/tools';
import { fmt, useStrings } from '@/constants/strings/define';
import { readableOn } from '@/constants/theme';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { AppCard } from '../AppCard';
import { Icon, type IconName } from './Icon';
import { PressScale } from './PressScale';

type Name = 'Banners' | 'Bond' | 'Level' | 'Eleph' | 'Skill' | 'Raid' | 'Gacha' | 'Planner' | 'Ap' | 'Birthdays' | 'Reminders';
export const TOOL_ROUTES: Record<Name, { route: Href; icon: IconName; accent: string }> = {
  Banners: { route: '/(tabs)/banner', icon: 'calendar-month', accent: categoryColors.toolBanner },
  Bond: { route: '/tools/bond', icon: 'heart-multiple', accent: categoryColors.toolBond },
  Level: { route: '/tools/level', icon: 'arrow-up-bold-circle', accent: categoryColors.toolChara },
  Eleph: { route: '/tools/eleph', icon: 'star-four-points', accent: categoryColors.toolEleph },
  Skill: { route: '/tools/skill', icon: 'book-open-variant', accent: categoryColors.toolSkill },
  Raid: { route: '/tools/raid', icon: 'sword-cross', accent: categoryColors.toolRaid },
  Gacha: { route: '/tools/gacha', icon: 'dice-multiple', accent: categoryColors.toolGacha },
  Planner: { route: '/tools/planner', icon: 'chart-timeline-variant', accent: categoryColors.toolBanner },
  Ap: { route: '/tools/ap', icon: 'lightning-bolt', accent: categoryColors.toolAp },
  Birthdays: { route: '/birthdays', icon: 'cake-variant', accent: categoryColors.toolBirthday },
  Reminders: { route: '/reminders', icon: 'bell', accent: categoryColors.toolReminder },
};

/** Two-column grid of tool tiles: colored glyph, name, one-line purpose. */
export function ToolGrid({ names, featureBanner = false }: { names: readonly Name[]; start?: number; featureBanner?: boolean }) {
  const c = useColors();
  const type = useType();
  const s = useStrings(navStrings);
  const copy = useStrings(toolsStrings);
  const router = useRouter();
  return <View style={styles.grid}>{names.map(name => {
    const tool = TOOL_ROUTES[name];
    const wide = featureBanner && name === 'Banners';
    const title = s[`tool${name}`];
    return <PressScale key={name} style={wide ? styles.wide : styles.tile} accessibilityLabel={fmt(copy.open, { tool: title })}
      onPress={() => String(tool.route).startsWith('/(tabs)') ? router.replace(tool.route) : router.push(tool.route)}>
      <AppCard padding={16} style={styles.panel}>
        <Icon name={tool.icon} size={26} color={readableOn(tool.accent, c.elevatedBg, 3)} />
        <View style={styles.text}>
          <Text style={[type.bodyStrong, { color: c.textPrimary }]} numberOfLines={1}>{title}</Text>
          <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={2}>{s[`tool${name}Sub`]}</Text>
        </View>
      </AppCard>
    </PressScale>;
  })}</View>;
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexGrow: 1, flexBasis: '45%' },
  wide: { width: '100%' },
  panel: { minHeight: 118, height: '100%', justifyContent: 'space-between', gap: 14 },
  text: { gap: 2 },
});
