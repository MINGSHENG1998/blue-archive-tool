import { StyleSheet, Image, Platform } from "react-native";

import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";

//components
import {
  Card,
  DataTable,
  TextInput,
  Button,
  HelperText,
} from "react-native-paper";
import { useState } from "react";

//constant
import { bondExpData, bondResourceTable } from "../../constants/bondData";

export default function BondExpScreen() {
  const [from, setFrom]: any = useState("");
  const [to, setTo]: any = useState("");
  const [error, setError] = useState("");
  const [totalExp, setTotalExp]: any = useState(null);

  //table
  const [sortDirection, setSortDirection] = useState("desc");
  const [sortedData, setSortedData] = useState(bondResourceTable);

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

  const handleSortAmount = () => {
    const newSortDirection = sortDirection === "asc" ? "desc" : "asc";
    setSortDirection(newSortDirection);

    const sorted = [...bondResourceTable].sort((a, b) => {
      if (newSortDirection === "asc") {
        return b.exp - a.exp;
      } else {
        return a.exp - b.exp;
      }
    });
    setSortedData(sorted);
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
                setFrom(text);
              } else if (text === "") {
                setFrom("");
              }
            }}
            keyboardType="numeric"
            maxLength={2}
            style={[styles.input, styles.halfInput]}
            right={
              from !== "" && (
                <TextInput.Icon
                  icon="close"
                  size={16}
                  onPress={() => setFrom("")}
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
                  size={16}
                  onPress={() => setTo("")}
                  style={{ display: from ? "flex" : "none" }}
                />
              )
            }
          />
        </ThemedView>
        {error && (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        )}
        <ThemedView style={styles.advancedSettings}>
          <Collapsible
            title="Advanced Settings"
            iconSize={12}
            fontType={"smallSemiBold"}
          >
            <ThemedText>WIP...</ThemedText>
          </Collapsible>
        </ThemedView>
        <Button
          mode="contained"
          onPress={handleCalculate}
          style={styles.button}
        >
          Calculate
        </Button>
      </ThemedView>
      {totalExp && (
        <ThemedView>
          <Card.Title
            title={`Required Exp: ${totalExp}`}
            titleStyle={styles.totalExp}
          />
          <Collapsible title="Required Resources">
            <DataTable>
              <DataTable.Header>
                <DataTable.Title textStyle={styles.header}>
                  Source
                </DataTable.Title>
                <DataTable.Title numeric>Exp</DataTable.Title>
                <DataTable.Title numeric onPress={handleSortAmount}>
                  Amount {sortDirection === "asc" ? "↑" : "↓"}
                </DataTable.Title>
              </DataTable.Header>

              {sortedData.map((item) => (
                <DataTable.Row key={item.key}>
                  <DataTable.Cell>
                    <ThemedView style={styles.sourceImg}>
                      <Image source={item.img} style={styles.image} />
                      <ThemedText style={styles.sourceName}>
                        {" "}
                        {item.name}
                      </ThemedText>
                    </ThemedView>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>{item.exp}</DataTable.Cell>
                  <DataTable.Cell numeric>
                    {Math.ceil(totalExp / item.exp)}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Collapsible>
          <Collapsible title="Required Days To Reach">
            <ThemedText>WIP...</ThemedText>
            {/* section let them change their pat amt/ monthly gift */}
          </Collapsible>
        </ThemedView>
      )}

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
  advancedSettings: {
    marginTop: 10,
    marginBottom: 5,
  },
  button: {
    marginTop: 10,
  },
  totalExp: {
    textAlign: "center",
  },
  header: { textAlign: "center", width: "100%" },
  sourceImg: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    width: "100%",
  },
  image: {
    width: 30,
    height: 30,
    marginTop: 10,
  },
  sourceName: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 15,
    width: "100%",
  },
});
