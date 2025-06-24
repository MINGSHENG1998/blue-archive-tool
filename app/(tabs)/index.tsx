import {
  Image,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card, IconButton } from "react-native-paper";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();

  const tools = [
    {
      id: "banner",
      title: "Future Banner",
      subtitle: "Check upcoming banners",
      icon: "calendar",
      color: "#FF6B9D",
      bgColor: "#FFE1E9",
      route: "/(tabs)/banner",
    },
    {
      id: "bond",
      title: "Bond Exp",
      subtitle: "Calculate bond experience",
      icon: "heart",
      color: "#FF4757",
      bgColor: "#FFE8EA",
      route: "/(tabs)/bondExp",
    },
    {
      id: "builder",
      title: "Chara Builder",
      subtitle: "Build your characters",
      icon: "chart-box",
      color: "#5352ED",
      bgColor: "#E8E8FF",
      route: "/(tabs)/resourceCalc",
    },
  ];

  const navigateTo = (route: any) => {
    router.replace(route);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#667EEA", dark: "#1a1a2e" }}
      headerImage={
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={["rgba(102, 126, 234, 0.8)", "rgba(118, 75, 162, 0.8)"]}
            style={styles.gradientOverlay}
          />
          <Image
            source={require("@/assets/images/arona.jpg")}
            style={styles.mainImg}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.appTitle}>Blue Archive Helper</Text>
            <Text style={styles.subtitle}>
              Your ultimate companion for Blue Archive
            </Text>
          </View>
        </View>
      }
    >
      <ThemedView style={styles.container}>
        {/* Quick Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Tools Available</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>∞</Text>
            <Text style={styles.statLabel}>Possibilities</Text>
          </View>
        </View>

        {/* Tools Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Essential Tools
            </ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Everything you need to master Blue Archive
            </ThemedText>
          </View>

          <View style={styles.toolsGrid}>
            {tools.map((tool, index) => (
              <TouchableOpacity
                key={tool.id}
                style={[styles.toolCard, { backgroundColor: tool.bgColor }]}
                onPress={() => navigateTo(tool.route)}
                activeOpacity={0.8}
              >
                <View style={styles.toolCardContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: tool.color },
                    ]}
                  >
                    <IconButton
                      icon={tool.icon}
                      iconColor="white"
                      size={28}
                      style={styles.toolIcon}
                    />
                  </View>
                  <View style={styles.toolTextContainer}>
                    <Text style={[styles.toolTitle, { color: tool.color }]}>
                      {tool.title}
                    </Text>
                    <Text style={styles.toolSubtitle}>{tool.subtitle}</Text>
                  </View>
                  <View
                    style={[
                      styles.arrowContainer,
                      { backgroundColor: tool.color },
                    ]}
                  >
                    <Text style={styles.arrowText}>→</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <Card style={styles.tipCard}>
            <LinearGradient
              colors={["#667EEA", "#764BA2"]}
              style={styles.tipGradient}
            >
              <View style={styles.tipContent}>
                <Text style={styles.tipIcon}>💡</Text>
                <View style={styles.tipTextContainer}>
                  <Text style={styles.tipTitle}>Pro Tip</Text>
                  <Text style={styles.tipText}>
                    Use these tools regularly to optimize your gameplay and stay
                    ahead of upcoming events!
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Card>
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: "100%",
    width: "100%",
    position: "relative",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  mainImg: {
    height: "100%",
    width: "100%",
    resizeMode: "cover",
  },
  headerTextContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    zIndex: 2,
  },
  welcomeText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    fontWeight: "400",
  },
  appTitle: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    marginTop: 8,
    fontWeight: "300",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    flex: 0.48,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#667EEA",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#636e72",
    marginTop: 4,
  },
  toolsGrid: {
    gap: 16,
  },
  toolCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  toolCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toolIcon: {
    margin: 0,
  },
  toolTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  toolSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  tipsContainer: {
    marginBottom: 30,
  },
  tipCard: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
  },
  tipGradient: {
    padding: 20,
  },
  tipContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  tipIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  tipText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
});
