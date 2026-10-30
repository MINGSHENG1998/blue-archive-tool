import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { navStrings } from "@/constants/strings/nav";
import { useStrings } from "@/constants/strings/define";
import { useType } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { Icon, type IconName } from "./Icon";
import { hapticSelect } from "./feedback";

const CHROME: Record<string, { label: "tabHome" | "tabBanners" | "tabStudents" | "tabTools" | "tabSensei"; icon: IconName; active: IconName }> = {
  index: { label: "tabHome", icon: "home-outline", active: "home" },
  banner: { label: "tabBanners", icon: "calendar-month-outline", active: "calendar-month" },
  students: { label: "tabStudents", icon: "account-group-outline", active: "account-group" },
  tools: { label: "tabTools", icon: "view-grid-outline", active: "view-grid" },
  other: { label: "tabSensei", icon: "cog-outline", active: "cog" },
};

/** Bottom tab bar. Occupies layout space so content never hides under it. */
export function CommandDeck({ state, descriptors, navigation, insets, onTabChange }: BottomTabBarProps & { onTabChange?: () => void }) {
  const c = useColors();
  const type = useType();
  const s = useStrings(navStrings);
  const active = state.routes[state.index]?.key;
  const routes = state.routes.filter(route => CHROME[route.name]);
  return <View style={[styles.shell, {
    backgroundColor: c.elevatedBg, borderTopColor: c.isDark ? c.hairline : c.surfaceBorder,
    paddingBottom: Math.max(insets.bottom, 8), paddingLeft: Math.max(insets.left, 8), paddingRight: Math.max(insets.right, 8),
  }]}>
    {routes.map(route => {
      const selected = route.key === active;
      const options = descriptors[route.key].options;
      const chrome = CHROME[route.name];
      const color = selected ? c.primaryInk : c.textMuted;
      return <Pressable key={route.key} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected }}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? s[chrome.label]} testID={options.tabBarButtonTestID}
        onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
        onPress={() => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!selected && !event.defaultPrevented) {
            hapticSelect();
            onTabChange?.();
            navigation.navigate(route.name, route.params);
          }
        }}>
        <View style={[styles.iconWell, selected && { backgroundColor: c.primaryA08 }]}>
          <Icon name={selected ? chrome.active : chrome.icon} color={color} size={22} />
        </View>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.8}
          style={[type.caption, styles.label, { color }, selected && styles.labelActive]}>{s[chrome.label]}</Text>
      </Pressable>;
    })}
  </View>;
}
const styles = StyleSheet.create({
  shell: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  tab: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 2 },
  iconWell: { width: 52, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, lineHeight: 14 },
  labelActive: { fontWeight: "600" },
});
