import { AccessibilityInfo, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { AppCard, BottomSheet, FilterPill, Icon, SignalButton } from '@/components/schale';
import { TOOL_ROUTES } from '@/components/schale/ToolGrid';
import { commonStrings } from '@/constants/strings/common';
import { homeStrings } from '@/constants/strings/home';
import { fmt, useStrings, type StringSet } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import {
  MAX_PINNED_TOOLS,
  PINNABLE_TOOLS,
  canMoveWidget,
  canPinMoreTools,
  isDefaultHomeLayout,
  isWidgetVisible,
  type HomeWidgetId,
} from '@/services/home/layout';
import type { HomeLayoutApi } from './useHomeLayout';
import { useToolName } from './ToolsWidget';

type HomeStrings = StringSet<keyof typeof homeStrings.en>;

/** Name and one-line purpose of each widget, as the sheet lists them. */
export function widgetCopy(id: HomeWidgetId, s: HomeStrings): { name: string; sub: string } {
  switch (id) {
    case 'resources': return { name: s.widgetResources, sub: s.widgetResourcesSub };
    case 'recruitment': return { name: s.widgetRecruitment, sub: s.widgetRecruitmentSub };
    case 'happening': return { name: s.happening, sub: s.widgetHappeningSub };
    case 'comingUp': return { name: s.comingUp, sub: s.widgetComingUpSub };
    case 'dailyStudent': return { name: s.dailyStudent, sub: s.widgetDailyStudentSub };
    case 'birthdays': return { name: s.widgetBirthdays, sub: s.widgetBirthdaysSub };
    case 'tools': return { name: s.widgetTools, sub: s.widgetToolsSub };
  }
}

/** "Customize Home": show/hide and reorder sections, pick the pinned tools. Every change applies live. */
export function CustomizeHomeSheet({ visible, onClose, home }: { visible: boolean; onClose: () => void; home: HomeLayoutApi }) {
  const c = useColors();
  const type = useType();
  const s = useStrings(homeStrings);
  const common = useStrings(commonStrings);
  const toolName = useToolName();
  const { layout } = home;
  const total = layout.order.length;
  const pinMore = canPinMoreTools(layout);

  const move = (id: HomeWidgetId, delta: -1 | 1) => {
    if (!canMoveWidget(layout, id, delta)) return;
    home.move(id, delta);
    const position = layout.order.indexOf(id) + delta + 1;
    AccessibilityInfo.announceForAccessibility(fmt(s.moved, { name: widgetCopy(id, s).name, position, total }));
  };

  return <BottomSheet visible={visible} onClose={onClose} title={s.customize}>
    <Text style={[type.body, { color: c.textSecondary }]}>{s.customizeBody}</Text>

    <Text accessibilityRole="header" style={[type.section, styles.heading, { color: c.textPrimary }]}>{s.sections}</Text>
    <AppCard padding={0} variant="surface">
      {layout.order.map((id, index) => {
        const { name, sub } = widgetCopy(id, s);
        const shown = isWidgetVisible(layout, id);
        const up = canMoveWidget(layout, id, -1);
        const down = canMoveWidget(layout, id, 1);
        return <View key={id} style={[styles.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.isDark ? c.hairline : c.surfaceBorder }]}>
          <View style={styles.text}>
            <Text style={[type.bodyStrong, { color: shown ? c.textPrimary : c.textMuted }]}>{name}</Text>
            <Text style={[type.caption, { color: c.textMuted }]}>{sub}</Text>
          </View>
          <StepButton icon="chevron-up" label={fmt(s.moveUp, { name })} disabled={!up} onPress={() => move(id, -1)} />
          <StepButton icon="chevron-down" label={fmt(s.moveDown, { name })} disabled={!down} onPress={() => move(id, 1)} />
          <View style={styles.switch}>
            <Switch accessibilityLabel={fmt(s.show, { name })} value={shown} onValueChange={value => home.setVisible(id, value)}
              trackColor={{ false: c.surfaceBorder, true: c.primaryColor }} thumbColor={c.elevatedBg} />
          </View>
        </View>;
      })}
    </AppCard>

    <Text accessibilityRole="header" style={[type.section, styles.heading, { color: c.textPrimary }]}>{s.widgetTools}</Text>
    <Text style={[type.caption, { color: c.textMuted }]}>{fmt(s.pinnedHint, { max: MAX_PINNED_TOOLS })}</Text>
    <View style={styles.chips}>
      {PINNABLE_TOOLS.map(tool => {
        const pinned = layout.pinnedTools.includes(tool);
        return <FilterPill key={tool} label={toolName(tool)} icon={TOOL_ROUTES[tool].icon} selected={pinned} disabled={!pinned && !pinMore}
          onPress={() => home.setPinned(tool, !pinned)} />;
      })}
    </View>

    <View style={styles.actions}>
      <SignalButton variant="ghost" label={s.reset} disabled={isDefaultHomeLayout(layout)} onPress={home.reset} style={styles.action} />
      <SignalButton variant="ink" label={common.done} onPress={onClose} style={styles.action} />
    </View>
  </BottomSheet>;
}

/** A 44px reorder control. Disabled at the ends of the list. */
function StepButton({ icon, label, disabled, onPress }: { icon: 'chevron-up' | 'chevron-down'; label: string; disabled: boolean; onPress: () => void }) {
  const c = useColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.step, { opacity: disabled ? 0.3 : pressed ? 0.6 : 1 }]}>
    <Icon name={icon} size={24} color={c.primaryInk} />
  </Pressable>;
}

const styles = StyleSheet.create({
  heading: { marginTop: 24, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingLeft: 16, paddingRight: 8, paddingVertical: 8 },
  text: { flex: 1, gap: 2, paddingRight: 4 },
  step: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  switch: { minWidth: 52, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  action: { flex: 1 },
});
