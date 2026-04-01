import {
  Image,
  StyleSheet,
  View,
  Text,
  Animated,
  Pressable,
  StatusBar,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { IconButton } from "react-native-paper";
import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/language-context";
import { i18n } from "@/constants/i18n";

const PRIMARY = "#128AFA";
const PRIMARY_LIGHT = "#4AAEFF";
const NAVY = "#0A1628";
const NAVY_CARD = "#0F2347";

// ── Spring-bounce press wrapper ──────────────────────────────────────────────
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

// ── Blue Archive cross / plus decorative mark ────────────────────────────────
function CrossMark({ size = 8, color = "rgba(18,138,250,0.25)" }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size * 3, height: size * 3, justifyContent: "center", alignItems: "center" }}>
      <View style={{ position: "absolute", width: size * 3, height: size * 0.6, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: "absolute", width: size * 0.6, height: size * 3, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

// ── Halo ring decoration (Blue Archive's signature motif) ────────────────────
function HaloRing({ size = 60, color = "rgba(18,138,250,0.15)" }: { size?: number; color?: string }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 2, borderColor: color,
      position: "absolute",
    }} />
  );
}

const tools = [
  {
    id: "banner",
    titleKey: "toolBannerTitle" as const,
    subtitleKey: "toolBannerSubtitle" as const,
    icon: "calendar-clock",
    accentColor: PRIMARY,
    label: "GACHA",
    route: "/(tabs)/banner",
  },
  {
    id: "bond",
    titleKey: "toolBondTitle" as const,
    subtitleKey: "toolBondSubtitle" as const,
    icon: "heart-multiple",
    accentColor: "#E879A0",
    label: "BOND",
    route: "/(tabs)/bondExp",
  },
  {
    id: "builder",
    titleKey: "toolCharaTitle" as const,
    subtitleKey: "toolCharaSubtitle" as const,
    icon: "account-cog",
    accentColor: "#3DD68C",
    label: "BUILD",
    route: "/(tabs)/resourceCalc",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = i18n[locale];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 750, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 580, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* ── Decorative background layer ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Hex-grid dot pattern hint — rows of faint dots */}
        <View style={styles.bgPattern} />
        {/* Halo rings scattered in bg */}
        <View style={[{ position: "absolute", top: 60, right: -30 }]}>
          <HaloRing size={160} color="rgba(18,138,250,0.07)" />
        </View>
        <View style={[{ position: "absolute", top: 90, right: -30 }]}>
          <HaloRing size={110} color="rgba(18,138,250,0.05)" />
        </View>
        <View style={{ position: "absolute", bottom: 200, left: -40 }}>
          <HaloRing size={140} color="rgba(18,138,250,0.06)" />
        </View>
        {/* Cross marks */}
        <View style={{ position: "absolute", top: 130, left: 30 }}>
          <CrossMark size={6} color="rgba(18,138,250,0.2)" />
        </View>
        <View style={{ position: "absolute", top: 220, right: 50 }}>
          <CrossMark size={5} />
        </View>
        <View style={{ position: "absolute", bottom: 280, right: 30 }}>
          <CrossMark size={7} color="rgba(18,138,250,0.18)" />
        </View>
        <View style={{ position: "absolute", bottom: 340, left: 60 }}>
          <CrossMark size={4} color="rgba(74,174,255,0.15)" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <Animated.View
          style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* Avatar — Blue Archive halo ring frame */}
          <View style={styles.avatarFrame}>
            {/* Outer glow halo */}
            <View style={styles.avatarHaloOuter} />
            {/* Inner ring */}
            <View style={styles.avatarHaloInner} />
            <Image source={require("@/assets/images/arona.jpg")} style={styles.avatar} />
                  </View>

          <View style={styles.headerText}>
            <Text style={styles.greeting}>{t.greeting}</Text>
            <Text style={styles.appName}>{t.appTitle}</Text>
            <Text style={styles.appSub}>{t.homeSubtitle}</Text>
            {/* Blue Archive style double-line underline */}
            <View style={styles.underlineGroup}>
              <View style={styles.underlinePrimary} />
              <View style={styles.underlineSecondary} />
            </View>
          </View>
        </Animated.View>

        {/* ── Section label — Blue Archive panel header style ── */}
        <Animated.View
          style={[styles.sectionWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* Angled left accent block */}
          <View style={styles.sectionTagWrap}>
            <View style={styles.sectionTagBg} />
            <Text style={styles.sectionTagText}>{t.quickTools}</Text>
          </View>
          {/* Horizontal rule with glow */}
          <View style={styles.sectionRule} />
        </Animated.View>

        {/* ── Tool Cards — Blue Archive diagonal-cut style ── */}
        <Animated.View
          style={[styles.cardsWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {tools.map((tool) => {
            const title = t[tool.titleKey];
            const subtitle = t[tool.subtitleKey];
            return (
              <SpringCard
                key={tool.id}
                onPress={() => router.replace(tool.route as any)}
              >
                {/* Card body */}
                <View style={[styles.card, { borderLeftColor: tool.accentColor }]}>

                  {/* Accent glow strip on left */}
                  <View style={[styles.cardLeftStrip, { backgroundColor: tool.accentColor }]} />

                  {/* Icon */}
                  <View style={[styles.iconWrap, { backgroundColor: tool.accentColor + "1A", borderColor: tool.accentColor + "40" }]}>
                    <IconButton icon={tool.icon} iconColor={tool.accentColor} size={26} style={{ margin: 0 }} />
                  </View>

                  {/* Pill — absolute top-right */}
                  <View style={[styles.typePill, { borderColor: tool.accentColor + "55", backgroundColor: tool.accentColor + "18" }]}>
                    <Text style={[styles.typePillText, { color: tool.accentColor }]}>{tool.label}</Text>
                  </View>

                  {/* Text */}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={styles.cardSubtitle}>{subtitle}</Text>
                  </View>

                  {/* Chevron — centered */}
                  <View style={[styles.chevronWrap, { backgroundColor: tool.accentColor + "18" }]}>
                    <Text style={[styles.chevronText, { color: tool.accentColor }]}>›</Text>
                  </View>
                </View>
              </SpringCard>
            );
          })}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY,
  },
  bgPattern: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    // Subtle navy-to-midnight-blue gradient feel via layered bg
    backgroundColor: NAVY,
    opacity: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarFrame: {
    position: "relative",
    width: 68,
    height: 68,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
  },
  avatarHaloOuter: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    opacity: 0.35,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  avatarHaloInner: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: PRIMARY,
    opacity: 0.7,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    color: PRIMARY_LIGHT,
    fontWeight: "500",
    marginBottom: 2,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  appName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    fontStyle: "italic",   // Blue Archive uses italic bold headers
  },
  appSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  underlineGroup: {
    flexDirection: "column",
    gap: 3,
  },
  underlinePrimary: {
    width: 44,
    height: 2.5,
    backgroundColor: PRIMARY,
    borderRadius: 2,
  },
  underlineSecondary: {
    width: 24,
    height: 1.5,
    backgroundColor: PRIMARY_LIGHT,
    opacity: 0.5,
    borderRadius: 2,
  },

  // ── Section header ───────────────────────────────────────────────
  sectionWrap: {
    paddingHorizontal: 24,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTagWrap: {
    position: "relative",
    paddingHorizontal: 14,
    paddingVertical: 5,
    overflow: "hidden",
  },
  // Angled parallelogram bg for the tag
  sectionTagBg: {
    position: "absolute",
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: PRIMARY,
    borderRadius: 3,
    transform: [{ skewX: "-12deg" }],
  },
  sectionTagText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(18,138,250,0.25)",
    borderRadius: 1,
  },

  // ── Cards ────────────────────────────────────────────────────────
  cardsWrap: {
    paddingHorizontal: 20,
    gap: 14,
  },
  card: {
    backgroundColor: NAVY_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(18,138,250,0.12)",
    borderLeftWidth: 3,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 7,
    position: "relative",
  },
  cardLeftStrip: {
    width: 3,
    alignSelf: "stretch",
    marginRight: 14,
    borderRadius: 2,
  },
  typePill: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 6,
    borderWidth: 0,
  },
  typePillText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "400",
    lineHeight: 17,
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  chevronText: {
    fontSize: 22,
    fontWeight: "300",
    lineHeight: 24,
  },
});
