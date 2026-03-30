import {
  Image,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { IconButton } from "react-native-paper";
import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/language-context";
import { i18n } from "@/constants/i18n";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = i18n[locale];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const tools = [
    {
      id: "banner",
      title: t.toolBannerTitle,
      subtitle: t.toolBannerSubtitle,
      icon: "calendar-clock",
      gradient: ["#1E3A8A", "#3B82F6", "#06B6D4"],
      route: "/(tabs)/banner",
    },
    {
      id: "bond",
      title: t.toolBondTitle,
      subtitle: t.toolBondSubtitle,
      icon: "heart-multiple",
      gradient: ["#BE185D", "#EC4899", "#F472B6"],
      route: "/(tabs)/bondExp",
    },
    {
      id: "builder",
      title: t.toolCharaTitle,
      subtitle: t.toolCharaSubtitle,
      icon: "account-cog",
      gradient: ["#059669", "#10B981", "#34D399"],
      route: "/(tabs)/resourceCalc",
    },
  ];

  const navigateTo = (route: string) => {
    router.replace(route as any);
  };

  const renderToolCard = (tool: any, index: number) => {
    const delay = index * 150;
    
    return (
      <Animated.View
        key={tool.id}
        style={[
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 30],
                  outputRange: [0, 30],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.toolCard}
          onPress={() => navigateTo(tool.route)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={tool.gradient}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <IconButton
                  icon={tool.icon}
                  iconColor="white"
                  size={28}
                  style={{ margin: 0 }}
                />
              </View>
              
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{tool.title}</Text>
                <Text style={styles.cardSubtitle}>{tool.subtitle}</Text>
              </View>
            </View>
          </LinearGradient>
          
          {/* Blue Archive style accent border */}
          <View style={styles.cardAccent} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* Background pattern overlay */}
      <View style={styles.backgroundPattern} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={require("@/assets/images/arona.jpg")}
              style={styles.avatar}
            />
            <View style={styles.avatarBorder} />
            <View style={styles.avatarGlow} />
          </View>
          
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hello Sensei!</Text>
            <Text style={styles.appName}>{t.appTitle} {t.homeSubtitle}</Text>
            <View style={styles.titleUnderline} />
          </View>
        </Animated.View>

        {/* Main Tools Section */}
        <Animated.View 
          style={[
            styles.toolsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Tools</Text>
            <View style={styles.sectionAccent} />
          </View>
          
          <View style={styles.toolsContainer}>
            {tools.map((tool, index) => renderToolCard(tool, index))}
          </View>
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A", // Dark navy background
  },
  backgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0F172A",
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarBorder: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: "#00F5FF", // Cyan accent
  },
  avatarGlow: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#00F5FF",
    opacity: 0.3,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: "#94A3B8", // Light gray
    fontWeight: "500",
    marginBottom: 4,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F1F5F9", // Near white
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: "#00F5FF",
    borderRadius: 2,
  },
  toolsSection: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F1F5F9",
    marginBottom: 8,
  },
  sectionAccent: {
    width: 60,
    height: 2,
    backgroundColor: "#00F5FF",
    borderRadius: 1,
  },
  toolsContainer: {
    gap: 16,
  },
  toolCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#00F5FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
  },
  cardGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.2)", // Subtle cyan border
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F1F5F9", // Near white
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "rgba(241, 245, 249, 0.7)", // Translucent white
    fontWeight: "400",
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  arrow: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#00F5FF",
    opacity: 0.8,
  },
  bottomSpacing: {
    height: 40,
  },
});