import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppCard, Icon, IndexTab, PressScale } from '@/components/schale';
import { TOOL_ROUTES } from '@/components/schale/ToolGrid';
import { homeStrings } from '@/constants/strings/home';
import { navStrings } from '@/constants/strings/nav';
import { toolsStrings } from '@/constants/strings/tools';
import { fmt, useStrings } from '@/constants/strings/define';
import { readableOn } from '@/constants/theme';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import type { PinnableTool } from '@/services/home/layout';
import { HomeRow, homeStyles } from './HomeRow';

// Compile-time guard: every pinnable tool must be a TOOL_ROUTES entry.
const ROUTES: Record<PinnableTool, (typeof TOOL_ROUTES)[keyof typeof TOOL_ROUTES]> = TOOL_ROUTES;

const PER_ROW = 4;

/** The tool's name as the Tools hub shows it. */
export function useToolName() {
  const nav = useStrings(navStrings);
  return (tool: PinnableTool) => nav[`tool${tool}`];
}

/** A compact grid of the tools Sensei pinned, four to a row. */
export function ToolsWidget({ tools, onCustomize }: { tools: readonly PinnableTool[]; onCustomize: () => void }) {
  const router = useRouter();
  const c = useColors();
  const type = useType();
  const s = useStrings(homeStrings);
  const copy = useStrings(toolsStrings);
  const toolName = useToolName();
  const rows: (PinnableTool | null)[][] = [];
  for (let i = 0; i < tools.length; i += PER_ROW) {
    const row: (PinnableTool | null)[] = tools.slice(i, i + PER_ROW);
    while (row.length < PER_ROW) row.push(null);
    rows.push(row);
  }
  return <>
    <IndexTab title={s.widgetTools} style={homeStyles.heading}
      right={<PressScale spark={false} onPress={() => router.replace('/(tabs)/tools')} accessibilityLabel={s.allTools}><Text style={[type.labelCaps, { color: c.primaryInk }]}>{s.allTools}</Text></PressScale>} />
    {rows.length ? <View style={[styles.grid, homeStyles.block]}>
      {rows.map((row, r) => <View key={r} style={styles.row}>
        {row.map((tool, i) => {
          if (!tool) return <View key={`gap-${i}`} style={styles.cell} />;
          const route = ROUTES[tool];
          const name = toolName(tool);
          return <PressScale key={tool} style={styles.cell} accessibilityLabel={fmt(copy.open, { tool: name })}
            onPress={() => String(route.route).startsWith('/(tabs)') ? router.replace(route.route) : router.push(route.route)}>
            <AppCard padding={10} style={styles.tile}>
              <Icon name={route.icon} size={24} color={readableOn(route.accent, c.elevatedBg, 3)} />
              <Text style={[type.caption, styles.label, { color: c.textPrimary }]} numberOfLines={2}>{name}</Text>
            </AppCard>
          </PressScale>;
        })}
      </View>)}
    </View> : <AppCard padding={0} style={homeStyles.block}>
      <HomeRow first icon="pin-outline" title={s.noTools} caption={s.noToolsBody} onPress={onCustomize} />
    </AppCard>}
  </>;
}

const styles = StyleSheet.create({
  grid: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  cell: { flex: 1 },
  tile: { minHeight: 84, height: '100%', alignItems: 'center', justifyContent: 'center', gap: 8 },
  label: { textAlign: 'center' },
});
