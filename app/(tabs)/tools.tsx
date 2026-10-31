import { StyleSheet, View } from 'react-native';
import { ScreenLayout, IndexTab } from '@/components/schale';
import { ToolGrid } from '@/components/schale/ToolGrid';
import { toolsStrings } from '@/constants/strings/tools';
import { useStrings } from '@/constants/strings/define';

export default function ToolsScreen() {
  const s = useStrings(toolsStrings);
  return <ScreenLayout title={s.title}>
    <IndexTab title={s.growth} style={styles.heading} />
    <ToolGrid names={['Bond', 'Level', 'Eleph', 'Skill', 'Raid']} />
    <View style={styles.gap} />
    <IndexTab title={s.recruit} style={styles.heading} />
    <ToolGrid names={['Banners', 'Planner', 'Gacha']} featureBanner />
    <View style={styles.gap} />
    <IndexTab title={s.daily} style={styles.heading} />
    <ToolGrid names={['Birthdays', 'Reminders']} />
  </ScreenLayout>;
}

const styles = StyleSheet.create({
  heading: { marginBottom: 10 },
  gap: { height: 28 },
});
