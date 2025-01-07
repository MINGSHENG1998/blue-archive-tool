import {
  StyleSheet,
  Image,
  Platform,
  Keyboard,
  View,
  Text,
} from "react-native";

import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useFocusEffect } from "@react-navigation/native";
import NumberInput from "@/components/NumberInput";

//components
import {
  Card,
  DataTable,
  TextInput,
  Button,
  HelperText,
  Surface,
} from "react-native-paper";
import { useRef, useState } from "react";

//constant
import { bondExpData, bondResourceTable } from "../../constants/bondData";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BondExpScreen() {
  const scrollRef = useRef<{ resetScroll: () => void }>(null);
  const [from, setFrom]: any = useState("");
  const [to, setTo]: any = useState("");
  const [error, setError] = useState("");
  const [totalExp, setTotalExp]: any = useState(null);

  //table
  const [sortDirection, setSortDirection] = useState("desc");
  const [sortedData, setSortedData] = useState(bondResourceTable);

  //days to reach
  //cafe amt
  //monthly craftable gift (50 confirm 2star favorite + random)
  //avg monthly class schedule
  //fury of set/chokma gift
  //avg total&grand assault gift
  const [expSource, setExpSource] = useState({ pat: 5, monthlyGift: 50 });
  const [monthlyExpGain, setMonthlyExpGain] = useState(
    expSource.pat * 15 + 5410
  );
  const insets = useSafeAreaInsets();

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
      setMonthlyExpGain(expSource.pat * 15 + 5410);
      Keyboard.dismiss();
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

  useFocusEffect(
    React.useCallback(() => {
      // Reset state and scroll position
      setFrom("");
      setTo("");
      setError("");
      setTotalExp(null);
      setSortDirection("desc");
      scrollRef.current?.resetScroll();
      return () => {};
    }, [])
  );

  return (
    <ParallaxScrollView
      noheader={true}
      keyboardShouldPersistTaps="handled"
      ref={scrollRef}
    >
      <Surface
        style={[styles.container, { paddingTop: insets.top }]}
        elevation={0}
      >
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
              <Card>
                <View style={styles.numberInputContainer}>
                  <NumberInput
                    value={expSource.pat}
                    onChange={(value) =>
                      setExpSource({ ...expSource, pat: value })
                    }
                    min={0}
                    max={6}
                    label="Cafe Pat /day"
                  />
                </View>
              </Card>
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
          <ThemedView style={styles.resultSection}>
            {/* <Card.Title
            title={`Required Exp: ${totalExp}`}
            titleStyle={styles.totalExp}
          /> */}
            <Card style={[styles.card, styles.resultCard]}>
              <Card.Content>
                <ThemedText style={styles.resultTitle}>
                  Required Experience
                </ThemedText>
                <ThemedText type="title">
                  {totalExp.toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.estimatedTime}>
                  Estimated Time:{" "}
                  {totalExp > monthlyExpGain
                    ? Math.ceil(totalExp / monthlyExpGain) + "month(s)"
                    : "less than a month"}
                </ThemedText>
              </Card.Content>
            </Card>
            <ThemedView style={styles.collapsible}>
              <Collapsible title="Required Resources" isDefaultOpen={true}>
                <DataTable style={styles.table}>
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
                          <Image source={item.img} style={styles.sourceImage} />
                          <ThemedText style={styles.sourceName}>
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
            </ThemedView>
            {/* <ThemedView style={styles.collapsible}>
            <Collapsible title="Estimated Time To Achieve">
              <ThemedText>
                {Math.ceil(totalExp / monthlyExpGain)} month(s)
              </ThemedText>
            </Collapsible>
          </ThemedView> */}
          </ThemedView>
        )}
      </Surface>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
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
  //advanced settings
  advancedSettings: {
    marginTop: 10,
    marginBottom: 5,
  },
  numberInputContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  numberInputLabel: {
    fontSize: 18,
    marginVertical: 10,
  },
  button: {
    marginTop: 10,
  },
  //result
  resultSection: {
    marginTop: 12,
  },
  //card
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  resultCard: {
    marginTop: 12,
    backgroundColor: "#4A90E2",
  },
  resultTitle: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 8,
    color: "#FFF",
  },
  resultExp: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
  },
  estimatedTime: {
    fontSize: 14,
    color: "#FFF",
    opacity: 0.9,
  },
  totalExp: {
    textAlign: "center",
  },
  collapsible: { marginBottom: 10 },
  table: { width: "100%" },
  header: { textAlign: "center", width: "100%" },
  sourceImg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sourceImage: {
    width: 24,
    height: 24,
  },
  sourceName: {
    fontSize: 12,
  },
});
