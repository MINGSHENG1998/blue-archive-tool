import { StyleSheet, Image, Platform } from "react-native";

import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";

//components
import { TextInput, Button, HelperText } from "react-native-paper";
import { useState } from "react";

export default function BondExpScreen() {
  const [from, setFrom]: any = useState("1");
  const [to, setTo]: any = useState("2");
  const [error, setError] = useState("");

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
    } else {
      setError(
        'Please ensure "from" is 1-99, "to" is 2-100, and "from" < "to".'
      );
    }
  };

  return (
    <ParallaxScrollView noheader={true}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Bond Exp Calculator</ThemedText>
      </ThemedView>
      <ThemedText>
        Insert your current bond level and desire bond level
      </ThemedText>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.row}>
          <TextInput
            label="From (1-99)"
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
          />
          <TextInput
            label="To (2-100)"
            value={to}
            onChangeText={(text) => {
              const numericValue = parseInt(text, 10);
              if (
                !isNaN(numericValue) &&
                numericValue >= 2 &&
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
});
