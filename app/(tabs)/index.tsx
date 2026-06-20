import {
  Image,
  StyleSheet,
  View,
  Text,
  Animated,
  Pressable,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { IconButton } from "react-native-paper";
import { useEffect, useRef, useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { i18n } from "@/constants/i18n";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppCard } from "@/components/AppCard";
import { useColors } from "@/hooks/useColors";
import { RADIUS, LAYOUT } from "@/constants/layout";
import type { ThemeTokens } from "@/constants/theme";
import { font } from "@/constants/typography";

// Spring-bounce press wrapper.
function SpringCard({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: any;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () =>
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  const release = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 10,
    }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable onPressIn={press} onPressOut={release} onPress={onPress}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = i18n[locale];
  const insets = useSafeAreaInsets();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const tools = [
    {
      id: "banner",
      titleKey: "toolBannerTitle" as const,
      subtitleKey: "toolBannerSubtitle" as const,
      icon: "calendar-clock",
      route: "/(tabs)/banner",
    },
    {
      id: "bond",
      titleKey: "toolBondTitle" as const,
      subtitleKey: "toolBondSubtitle" as const,
      icon: "heart-multiple",
      route: "/(tabs)/bondExp",
    },
    {
      id: "builder",
      titleKey: "toolCharaTitle" as const,
      subtitleKey: "toolCharaSubtitle" as const,
      icon: "account-cog",
      route: "/(tabs)/resourceCalc",
    },
  ];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();
  }, []);

  const animStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  return (
    <View style={styles.container}>
      <StatusBar style={c.isDark ? "light" : "dark"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View
          style={[styles.header, { paddingTop: insets.top + 16 }, animStyle]}
        >
          <View style={styles.avatarFrame}>
            <View style={styles.avatarRing} />
            <Image
              source={require("@/assets/images/arona.jpg")}
              style={styles.avatar}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{t.greeting}</Text>
            <Text style={styles.appName}>{t.appTitle}</Text>
            <Text style={styles.appSub}>{t.homeSubtitle}</Text>
          </View>
        </Animated.View>

        {/* Section label */}
        <Animated.View style={[styles.sectionWrap, animStyle]}>
          <Text style={styles.sectionTitle}>{t.quickTools}</Text>
          <View style={styles.sectionAccent} />
        </Animated.View>

        {/* Tool cards */}
        <Animated.View style={[styles.cardsWrap, animStyle]}>
          {tools.map((tool) => (
            <SpringCard
              key={tool.id}
              onPress={() => router.replace(tool.route as any)}
            >
              <AppCard level={2} padding={16} style={styles.card}>
                <View style={styles.iconWrap}>
                  <IconButton
                    icon={tool.icon}
                    iconColor={c.primaryColor}
                    size={26}
                    style={styles.iconBtn}
                  />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{t[tool.titleKey]}</Text>
                  <Text style={styles.cardSubtitle}>{t[tool.subtitleKey]}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </AppCard>
            </SpringCard>
          ))}
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBg,
    },
    scrollContent: {
      paddingBottom: LAYOUT.screenPaddingBottom,
    },

    // Header
    header: {
      paddingHorizontal: LAYOUT.screenPaddingH,
      paddingBottom: 28,
      flexDirection: "row",
      alignItems: "center",
    },
    avatarFrame: {
      width: 64,
      height: 64,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    avatarRing: {
      position: "absolute",
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 2,
      borderColor: c.accentSoft,
    },
    avatar: {
      width: 54,
      height: 54,
      borderRadius: 27,
    },
    headerText: {
      flex: 1,
    },
    greeting: {
      fontSize: 12,
      color: c.primaryColor,
      fontWeight: "600",
      marginBottom: 2,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      ...font("semibold"),
    },
    appName: {
      fontSize: 22,
      fontWeight: "800",
      color: c.textPrimary,
      letterSpacing: -0.3,
      ...font("extrabold"),
    },
    appSub: {
      fontSize: 13,
      color: c.textMuted,
      fontWeight: "500",
      letterSpacing: 0.3,
      ...font("medium"),
    },

    // Section label
    sectionWrap: {
      paddingHorizontal: LAYOUT.screenPaddingH,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: c.textPrimary,
      ...font("bold"),
    },
    sectionAccent: {
      width: 44,
      height: 3,
      borderRadius: 2,
      marginTop: 6,
      backgroundColor: c.primaryColor,
    },

    // Tool cards
    cardsWrap: {
      paddingHorizontal: LAYOUT.screenPaddingH,
      gap: 12,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.sm,
      backgroundColor: c.accentSoft,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    iconBtn: {
      margin: 0,
    },
    cardBody: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: c.textPrimary,
      marginBottom: 3,
      ...font("bold"),
    },
    cardSubtitle: {
      fontSize: 12,
      color: c.textMuted,
      lineHeight: 17,
      ...font("regular"),
    },
    chevron: {
      fontSize: 24,
      fontWeight: "300",
      color: c.textSecondary,
      marginLeft: 8,
    },
  });
