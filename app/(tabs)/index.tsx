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
import { BlurView } from "expo-blur";
import { IconButton } from "react-native-paper";
import { useEffect, useRef } from "react";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
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
      title: "Future Banner",
      subtitle: "Check upcoming banners",
      icon: "calendar-clock",
      gradient: ["#667EEA", "#764BA2"],
      route: "/(tabs)/banner",
    },
    {
      id: "bond",
      title: "Bond Experience",
      subtitle: "Calculate bond experience",
      icon: "heart-multiple",
      gradient: ["#FF6B9D", "#C44569"],
      route: "/(tabs)/bondExp",
    },
    {
      id: "builder",
      title: "Character Builder",
      subtitle: "Build your characters",
      icon: "account-cog",
      gradient: ["#00D4AA", "#00A693"],
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

              <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>→</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F8FAFC" />
      
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
          </View>
          
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hello Sensei!</Text>
            <Text style={styles.appName}>Blue Archive Helper</Text>
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
          <Text style={styles.sectionTitle}>Quick Tools</Text>
          
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
    backgroundColor: "#F8FAFC",
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
    borderColor: "#667EEA",
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 4,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: -0.5,
  },
  toolsSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 24,
  },
  toolsContainer: {
    gap: 16,
  },
  toolCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardGradient: {
    padding: 24,
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
    color: "white",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
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
  bottomSpacing: {
    height: 40,
  },
});