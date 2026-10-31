import { useState } from "react";
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { raidBossImageUrl } from "@/services/gamedata";
import { useColors } from "@/hooks/useColors";

// SchaleDB lobby banners are 650 x 200 with a transparent background.
const ART_ASPECT = 650 / 200;

/**
 * A raid boss's lobby banner on a soft sky wash, full width at the art's own
 * aspect ratio. Renders nothing without a DevName or when the image fails, so
 * a blocked host leaves the card as plain text rather than an empty box.
 */
export function RaidBossArt({
  devName,
  label,
  style,
}: {
  devName: string | null;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const [failed, setFailed] = useState(false);
  if (!devName || failed) return null;
  return (
    <View style={[styles.frame, style]} accessible accessibilityRole="image" accessibilityLabel={label}>
      <LinearGradient
        colors={[c.skyTop, c.skyMid]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={{ uri: raidBossImageUrl(devName) }}
        style={styles.art}
        resizeMode="contain"
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: "100%", aspectRatio: ART_ASPECT, overflow: "hidden" },
  art: { width: "100%", height: "100%" },
});
