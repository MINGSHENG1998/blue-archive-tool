import { Image, StyleSheet, Platform, View, Text } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import InlineAd from "../ads/InlineAd";
import { Button, Card, FAB, IconButton, MD3Colors } from "react-native-paper";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/arona.jpg")}
          style={styles.mainImg}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Blue Archive Helper</ThemedText>
        {/* <HelloWave /> */}
      </ThemedView>
      <ThemedView style={styles.featureContainer}>
        <Card>
          <Text style={styles.cardTitle}>Tools</Text>
          <View style={styles.toolsBtnContainer}>
          <View style={styles.toolsBtnWrapper}>
              <IconButton
                icon="calendar"
                iconColor="skyblue"
                size={30}
                mode="contained"
                style={styles.toolsBtn}
                onPress={() => router.replace("/(tabs)/banner")}
              />
              <ThemedText style={styles.toolsBtnLabel}>Future Banner</ThemedText>
            </View>
            <View style={styles.toolsBtnWrapper}>
              <IconButton
                icon="heart"
                iconColor="pink"
                size={30}
                mode="contained"
                style={styles.toolsBtn}
                onPress={() => router.replace("/(tabs)/bondExp")}
              />
              <ThemedText style={styles.toolsBtnLabel}>Bond Exp</ThemedText>
            </View>
            <View style={styles.toolsBtnWrapper}>
              <IconButton
                icon="wrench"                
                size={30}
                mode="contained"
                style={styles.toolsBtn}
              />
              <ThemedText style={styles.toolsBtnLabel}>Wip</ThemedText>
            </View>
          </View>
        </Card>
      </ThemedView>
      {/* <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">1: Future Banner List</ThemedText>
        <ThemedText>
          Edit{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
          to see changes. Press{" "}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: "cmd + d",
              android: "cmd + m",
              web: "F12",
            })}
          </ThemedText>{" "}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">2: Bond Exp Calculator</ThemedText>
        <ThemedText>
          Tap the Explore tab to learn more about what's included in this
          starter app.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">3: Pyrox Income Calculator</ThemedText>
        <ThemedText>
          When you're ready, run{" "}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText>{" "}
          to get a fresh <ThemedText type="defaultSemiBold">app</ThemedText>{" "}
          directory. This will move the current{" "}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{" "}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView> */}
      <InlineAd />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureContainer: {
    marginBottom: 8,
  },
  cardTitle: {
    color: "#ffffff",
    margin: 12,
    fontSize: 20,
    fontWeight: 800,
  },
  toolsBtnContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  toolsBtnWrapper: {
    alignItems: "center",
    marginHorizontal: 10,
    marginLeft: 16,
  },
  toolsBtn: {
    borderRadius: 16,
    height: 50,
    width: 50,
  },
  toolsBtnLabel: {
    fontSize: 12,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  mainImg: {
    height: "100%",
    width: "auto",
  },
});
