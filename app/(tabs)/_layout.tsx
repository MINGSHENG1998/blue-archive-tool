import { Tabs } from "expo-router";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { CommandDeck } from "@/components/schale/CommandDeck";
import { navStrings } from "@/constants/strings/nav";
import { useStrings } from "@/constants/strings/define";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const c = useColors();
  const s = useStrings(navStrings);
  const reduced = useReducedMotion();
  return <View style={{ flex: 1, backgroundColor: c.appBg }}>
    <Tabs tabBar={props => <CommandDeck {...props} />} screenOptions={{ headerShown: false, animation: reduced ? "none" : "fade", sceneStyle: { backgroundColor: c.appBg } }}>
      <Tabs.Screen name="index" options={{ title: s.tabHome }} />
      <Tabs.Screen name="banner" options={{ title: s.tabBanners }} />
      <Tabs.Screen name="students" options={{ title: s.tabStudents }} />
      <Tabs.Screen name="tools" options={{ title: s.tabTools }} />
      <Tabs.Screen name="other" options={{ title: s.tabSensei }} />
    </Tabs>
  </View>;
}
