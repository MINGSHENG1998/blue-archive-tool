import { StyleSheet, Image, Platform } from "react-native";

import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";

//components
import { Card, TextInput, Button, HelperText } from "react-native-paper";
import { useState } from "react";

export default function BondExpScreen() {
  const [from, setFrom]: any = useState("1");
  const [to, setTo]: any = useState("2");
  const [error, setError] = useState("");
  const [totalExp, setTotalExp]: any = useState(null);

  //constant
  const bondExpData = [
    { rank: 1, nextLevelExp: 15, totalExp: 0 },
    { rank: 2, nextLevelExp: 30, totalExp: 15 },
    { rank: 3, nextLevelExp: 30, totalExp: 45 },
    { rank: 4, nextLevelExp: 35, totalExp: 75 },
    { rank: 5, nextLevelExp: 35, totalExp: 110 },
    { rank: 6, nextLevelExp: 35, totalExp: 145 },
    { rank: 7, nextLevelExp: 40, totalExp: 180 },
    { rank: 8, nextLevelExp: 40, totalExp: 220 },
    { rank: 9, nextLevelExp: 40, totalExp: 260 },
    { rank: 10, nextLevelExp: 60, totalExp: 300 },
    { rank: 11, nextLevelExp: 90, totalExp: 360 },
    { rank: 12, nextLevelExp: 105, totalExp: 450 },
    { rank: 13, nextLevelExp: 120, totalExp: 555 },
    { rank: 14, nextLevelExp: 140, totalExp: 675 },
    { rank: 15, nextLevelExp: 160, totalExp: 815 },
    { rank: 16, nextLevelExp: 180, totalExp: 975 },
    { rank: 17, nextLevelExp: 205, totalExp: 1155 },
    { rank: 18, nextLevelExp: 230, totalExp: 1360 },
    { rank: 19, nextLevelExp: 255, totalExp: 1590 },
    { rank: 20, nextLevelExp: 285, totalExp: 1845 },
    { rank: 21, nextLevelExp: 315, totalExp: 2130 },
    { rank: 22, nextLevelExp: 345, totalExp: 2445 },
    { rank: 23, nextLevelExp: 375, totalExp: 2790 },
    { rank: 24, nextLevelExp: 410, totalExp: 3165 },
    { rank: 25, nextLevelExp: 445, totalExp: 3575 },
    { rank: 26, nextLevelExp: 480, totalExp: 4020 },
    { rank: 27, nextLevelExp: 520, totalExp: 4500 },
    { rank: 28, nextLevelExp: 560, totalExp: 5020 },
    { rank: 29, nextLevelExp: 600, totalExp: 5580 },
    { rank: 30, nextLevelExp: 645, totalExp: 6180 },
    { rank: 31, nextLevelExp: 690, totalExp: 6825 },
    { rank: 32, nextLevelExp: 735, totalExp: 7515 },
    { rank: 33, nextLevelExp: 780, totalExp: 8250 },
    { rank: 34, nextLevelExp: 830, totalExp: 9030 },
    { rank: 35, nextLevelExp: 880, totalExp: 9860 },
    { rank: 36, nextLevelExp: 930, totalExp: 10740 },
    { rank: 37, nextLevelExp: 985, totalExp: 11670 },
    { rank: 38, nextLevelExp: 1040, totalExp: 12655 },
    { rank: 39, nextLevelExp: 1095, totalExp: 13695 },
    { rank: 40, nextLevelExp: 1155, totalExp: 14790 },
    { rank: 41, nextLevelExp: 1215, totalExp: 15945 },
    { rank: 42, nextLevelExp: 1275, totalExp: 17160 },
    { rank: 43, nextLevelExp: 1335, totalExp: 18435 },
    { rank: 44, nextLevelExp: 1400, totalExp: 19770 },
    { rank: 45, nextLevelExp: 1465, totalExp: 21170 },
    { rank: 46, nextLevelExp: 1530, totalExp: 22635 },
    { rank: 47, nextLevelExp: 1600, totalExp: 24165 },
    { rank: 48, nextLevelExp: 1670, totalExp: 25765 },
    { rank: 49, nextLevelExp: 1740, totalExp: 27435 },
    { rank: 50, nextLevelExp: 1815, totalExp: 29175 },
    { rank: 51, nextLevelExp: 1890, totalExp: 30990 },
    { rank: 52, nextLevelExp: 1965, totalExp: 32880 },
    { rank: 53, nextLevelExp: 2040, totalExp: 34845 },
    { rank: 54, nextLevelExp: 2120, totalExp: 36885 },
    { rank: 55, nextLevelExp: 2200, totalExp: 39005 },
    { rank: 56, nextLevelExp: 2280, totalExp: 41205 },
    { rank: 57, nextLevelExp: 2365, totalExp: 43485 },
    { rank: 58, nextLevelExp: 2450, totalExp: 45850 },
    { rank: 59, nextLevelExp: 2535, totalExp: 48300 },
    { rank: 60, nextLevelExp: 2625, totalExp: 50835 },
    { rank: 61, nextLevelExp: 2715, totalExp: 53460 },
    { rank: 62, nextLevelExp: 2805, totalExp: 56175 },
    { rank: 63, nextLevelExp: 2895, totalExp: 58980 },
    { rank: 64, nextLevelExp: 2990, totalExp: 61875 },
    { rank: 65, nextLevelExp: 3085, totalExp: 64865 },
    { rank: 66, nextLevelExp: 3180, totalExp: 67950 },
    { rank: 67, nextLevelExp: 3280, totalExp: 71130 },
    { rank: 68, nextLevelExp: 3380, totalExp: 74410 },
    { rank: 69, nextLevelExp: 3480, totalExp: 77790 },
    { rank: 70, nextLevelExp: 3585, totalExp: 81270 },
    { rank: 71, nextLevelExp: 3690, totalExp: 84855 },
    { rank: 72, nextLevelExp: 3795, totalExp: 88545 },
    { rank: 73, nextLevelExp: 3900, totalExp: 92340 },
    { rank: 74, nextLevelExp: 4010, totalExp: 96240 },
    { rank: 75, nextLevelExp: 4120, totalExp: 100250 },
    { rank: 76, nextLevelExp: 4230, totalExp: 104370 },
    { rank: 77, nextLevelExp: 4345, totalExp: 108600 },
    { rank: 78, nextLevelExp: 4460, totalExp: 112945 },
    { rank: 79, nextLevelExp: 4575, totalExp: 117405 },
    { rank: 80, nextLevelExp: 4695, totalExp: 121980 },
    { rank: 81, nextLevelExp: 4815, totalExp: 126675 },
    { rank: 82, nextLevelExp: 4935, totalExp: 131490 },
    { rank: 83, nextLevelExp: 5055, totalExp: 136425 },
    { rank: 84, nextLevelExp: 5180, totalExp: 141480 },
    { rank: 85, nextLevelExp: 5305, totalExp: 146660 },
    { rank: 86, nextLevelExp: 5430, totalExp: 151965 },
    { rank: 87, nextLevelExp: 5560, totalExp: 157395 },
    { rank: 88, nextLevelExp: 5690, totalExp: 162955 },
    { rank: 89, nextLevelExp: 5820, totalExp: 168645 },
    { rank: 90, nextLevelExp: 5955, totalExp: 174465 },
    { rank: 91, nextLevelExp: 6090, totalExp: 180420 },
    { rank: 92, nextLevelExp: 6225, totalExp: 186510 },
    { rank: 93, nextLevelExp: 6360, totalExp: 192735 },
    { rank: 94, nextLevelExp: 6500, totalExp: 199095 },
    { rank: 95, nextLevelExp: 6640, totalExp: 205595 },
    { rank: 96, nextLevelExp: 6780, totalExp: 212235 },
    { rank: 97, nextLevelExp: 6925, totalExp: 219015 },
    { rank: 98, nextLevelExp: 7070, totalExp: 225940 },
    { rank: 99, nextLevelExp: 7215, totalExp: 233010 },
    { rank: 100, nextLevelExp: 7365, totalExp: 240225 },
  ];

  // Bond EXP gifts
  const gifts = {
    checkIn: 15,
    mehGift2Star: 20,
    likeGift2Star: 40,
    favorite2Star: 60,
    loved2Star: 80,
    mehGift3Star: 60,
    likeGift3Star: 120,
    favorite3Star: 180,
    loved3Star: 240,
  };

  // Look-up dictionary for variable names to HTML
  const giftNameToHtml = {
    checkIn:
      '<div class="gift-item"><img src="img/Headpat_Icon.webp" alt="Check-In"/><p>Cafe Check-In</p></div>',
    mehGift2Star:
      '<div class="gift-item"><img src="img/Small_Effect.webp" alt="2 Star Gift"/><p>Meh/Small 2 Star Gift</p></div>',
    likeGift2Star:
      '<div class="gift-item"><img src="img/Normal_Effect.webp" alt="2 Star Gift"/><p>Like/Normal 2 Star Gift</p></div>',
    favorite2Star:
      '<div class="gift-item"><img src="img/Great_Effect.webp" alt="2 Star Gift"/><p>Favorite/Great 2 Star Gift</p></div>',
    loved2Star:
      '<div class="gift-item"><img src="img/Amazing_Effect.webp" alt="2 Star Gift"/><p>Loved/Amazing 2 Star Gift</p></div>',
    mehGift3Star:
      '<div class="gift-item"><img src="img/Small_Effect.webp" alt="3 Star Gift"/><p>Meh/Small 3 Star Gift</p></div>',
    likeGift3Star:
      '<div class="gift-item"><img src="img/Normal_Effect.webp" alt="3 Star Gift"/><p>Like/Normal 3 Star Gift</p></div>',
    favorite3Star:
      '<div class="gift-item"><img src="img/Great_Effect.webp" alt="3 Star Gift"/><p>Favorite/Great 3 Star Gift</p></div>',
    loved3Star:
      '<div class="gift-item"><img src="img/Amazing_Effect.webp" alt="3 Star Gift"/><p>Loved/Amazing 3 Star Gift</p></div>',
  };

  const handleCalculate = () => {
    const fromValue = parseInt(from, 10);
    const toValue = parseInt(to, 10);

    if (
      fromValue >= 1 &&
      fromValue <= 99 &&
      toValue >= 2 &&
      toValue <= 100 &&
      fromValue < toValue
    ) {
      setError("");
      // Add your calculation logic here
      console.log(`Valid range: From ${fromValue} to ${toValue}`);
      const totalExp =
        bondExpData[toValue - 1].totalExp - bondExpData[fromValue - 1].totalExp;
      setTotalExp(totalExp);
    } else {
      setError(
        'Please ensure "from" is 1-99, "to" is 2-100, and "from" < "to".'
      );
      setTotalExp(null);
    }
  };

  return (
    <ParallaxScrollView noheader={true} keyboardShouldPersistTaps="handled">
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Bond Exp Calculator</ThemedText>
      </ThemedView>
      <ThemedText>
        Insert your current bond level and target bond level
      </ThemedText>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.row}>
          <TextInput
            mode="outlined"
            label="Current Level"
            placeholder="1 - 99"
            value={from}
            onChangeText={(text) => {
              const numericValue = parseInt(text, 10);
              if (
                !isNaN(numericValue) &&
                numericValue >= 1 &&
                numericValue <= 99
              ) {
                setFrom(text); // Update state only if within range
              } else if (text === "") {
                setFrom(""); // Allow clearing the input
              }
            }}
            keyboardType="numeric"
            maxLength={2}
            style={[styles.input, styles.halfInput]}
            right={
              from !== "" && (
                <TextInput.Icon
                  icon="close"
                  onPress={() => setFrom("")}
                  // Only show when there's text
                  style={{ display: from ? "flex" : "none" }}
                />
              )
            }
          />
          <TextInput
            mode="outlined"
            label="Target Level"
            placeholder="2 - 100"
            value={to}
            onChangeText={(text) => {
              const numericValue = parseInt(text, 10);
              if (
                !isNaN(numericValue) &&
                numericValue >= 1 &&
                numericValue <= 100
              ) {
                setTo(text); // Update state only if within range
              } else if (text === "") {
                setTo(""); // Allow clearing the input
              }
            }}
            keyboardType="numeric"
            maxLength={3}
            style={[styles.input, styles.halfInput]}
            right={
              to !== "" && (
                <TextInput.Icon
                  icon="close"
                  onPress={() => setTo("")}
                  // Only show when there's text
                  style={{ display: from ? "flex" : "none" }}
                />
              )
            }
          />
        </ThemedView>
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
        <Button
          mode="contained"
          onPress={handleCalculate}
          style={styles.button}
        >
          Calculate
        </Button>
      </ThemedView>
      {totalExp && (
        <Card.Title
          title={`Required Exp: ${totalExp}`}
          titleStyle={styles.totalExp}
        />
      )}
      <Collapsible title="Required Resources">
        <ThemedText>Table WIP...</ThemedText>
      </Collapsible>
      {/* <Collapsible title="File-based routing">
        <ThemedText>
          This app has two screens:{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> and{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
        </ThemedText>
        <ThemedText>
          The layout file in <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{' '}
          sets up the tab navigator.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Android, iOS, and web support">
        <ThemedText>
          You can open this project on Android, iOS, and the web. To open the web version, press{' '}
          <ThemedText type="defaultSemiBold">w</ThemedText> in the terminal running this project.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Images">
        <ThemedText>
          For static images, you can use the <ThemedText type="defaultSemiBold">@2x</ThemedText> and{' '}
          <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes to provide files for
          different screen densities
        </ThemedText>
        <Image source={require('@/assets/images/react-logo.png')} style={{ alignSelf: 'center' }} />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Custom fonts">
        <ThemedText>
          Open <ThemedText type="defaultSemiBold">app/_layout.tsx</ThemedText> to see how to load{' '}
          <ThemedText style={{ fontFamily: 'SpaceMono' }}>
            custom fonts such as this one.
          </ThemedText>
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/font">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Light and dark mode components">
        <ThemedText>
          This template has light and dark mode support. The{' '}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook lets you inspect
          what the user's current color scheme is, and so you can adjust UI colors accordingly.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animations">
        <ThemedText>
          This template includes an example of an animated component. The{' '}
          <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> component uses
          the powerful <ThemedText type="defaultSemiBold">react-native-reanimated</ThemedText>{' '}
          library to create a waving hand animation.
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              The <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
              component provides a parallax effect for the header image.
            </ThemedText>
          ),
        })}
      </Collapsible> */}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    marginTop: 20,
    flexDirection: "row",
    gap: 8,
  },
  container: {
    flex: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  input: {
    marginTop: 5,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  button: {
    marginTop: 10,
  },
  totalExp: {
    textAlign: "center",
  },
});
