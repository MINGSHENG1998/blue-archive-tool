import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { i18n } from "@/constants/i18n";
import type { ThemeTokens } from "@/constants/theme";
import { displayTitle } from "@/constants/typography";
import { useLanguage } from "@/contexts/language-context";
import { useColors } from "@/hooks/useColors";

/**
 * Title block for screens pushed onto the stack (the tabs have no back
 * affordance of their own). Matches the tab-screen header from ScreenLayout,
 * plus a back control, so a pushed screen does not look like a different app.
 */
export function StackScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const { locale } = useLanguage();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel={i18n[locale].navBack}
      >
        <IconSymbol
          name="chevron.right"
          size={20}
          color={c.textSecondary}
          style={styles.backIcon}
        />
      </Pressable>
      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        <View style={styles.accent} />
        {subtitle ? (
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
    backBtn: { paddingTop: 6, paddingRight: 12 },
    // The icon set only ships a right chevron; rotate it into a back arrow.
    backIcon: { transform: [{ rotate: "180deg" }] },
    headerText: { flex: 1 },
    title: { ...displayTitle },
    accent: {
      width: 44,
      height: 3,
      borderRadius: 2,
      marginTop: 6,
      backgroundColor: c.primaryColor,
    },
    subtitle: { fontSize: 14, marginTop: 8, color: c.textSecondary },
  });
