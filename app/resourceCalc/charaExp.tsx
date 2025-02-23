import React, { useState, useRef } from "react";
import { Image, StyleSheet, View, Keyboard } from "react-native";
import {
  Card,
  TextInput,
  Button,
  HelperText,
  Divider,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";

import { Collapsible } from "@/components/Collapsible";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { charaExpData } from "@/constants/charaLvlData";

export default function CharaExpCalc() {
  const scrollRef = useRef<{ resetScroll: () => void }>(null);
  const [currentLevel, setCurrentLevel] = useState("1");
  const [targetLevel, setTargetLevel] = useState("90");
  const [error, setError] = useState("");
  const [result, setResult]: any = useState(null);

  // Resource configuration
  const [expSource, setExpSource] = useState({
    pinkBook: "0",
    orangeBook: "0",
    blueBook: "0",
    greyBook: "0",
    credits: "0",
  });

  const EXP_VALUES = {
    pinkBook: 10000,
    orangeBook: 2000,
    blueBook: 500,
    greyBook: 50,
  };

  const handleCalculate = () => {
    const fromValue = parseInt(currentLevel, 10);
    const toValue = parseInt(targetLevel, 10);

    if (
      fromValue >= 1 &&
      fromValue <= 89 &&
      toValue >= 2 &&
      toValue <= 90 &&
      fromValue < toValue
    ) {
      setError("");

      const expNeeded = calculateTotalExpNeeded(fromValue, toValue);
      const resources = calculateRequiredResources(expNeeded);

      setResult({
        totalExp: expNeeded,
        ...resources,
      });

      Keyboard.dismiss();
    } else {
      setError(
        'Please ensure "Current Level" is 1-89 and "Target Level" is 2-90.'
      );
      setResult(null);
    }
  };

  const calculateTotalExpNeeded = (from: number, to: number) => {
    if (!charaExpData[from] || !charaExpData[to]) {
      return 0;
    }
    return charaExpData[to].totalExp - charaExpData[from].totalExp;
  };

  const calculateRequiredResources = (expNeeded: number) => {
    // Calculate available EXP from inventory
    const availableExp =
      (parseInt(expSource.pinkBook) || 0) * EXP_VALUES.pinkBook +
      (parseInt(expSource.orangeBook) || 0) * EXP_VALUES.orangeBook +
      (parseInt(expSource.blueBook) || 0) * EXP_VALUES.blueBook +
      (parseInt(expSource.greyBook) || 0) * EXP_VALUES.greyBook;

    // Subtract available EXP from needed EXP
    let remainingExp = Math.max(0, expNeeded - availableExp);

    const pinkBooks = Math.floor(remainingExp / EXP_VALUES.pinkBook);
    remainingExp -= pinkBooks * EXP_VALUES.pinkBook;

    const orangeBooks = Math.floor(remainingExp / EXP_VALUES.orangeBook);
    remainingExp -= orangeBooks * EXP_VALUES.orangeBook;

    const blueBooks = Math.floor(remainingExp / EXP_VALUES.blueBook);
    remainingExp -= blueBooks * EXP_VALUES.blueBook;

    const greyBooks = Math.ceil(remainingExp / EXP_VALUES.greyBook);

    // Calculate credits needed
    const availableCredits = parseInt(expSource.credits) || 0;
    const totalCreditsNeeded = expNeeded * 7;
    const creditsNeeded = Math.max(0, totalCreditsNeeded - availableCredits);

    return {
      pinkBooks,
      orangeBooks,
      blueBooks,
      greyBooks,
      creditsNeeded,
      expNeededAfterInventory: remainingExp,
      availableExp,
    };
  };

  const handleExpSourceChange = (field: string, value: string) => {
    // Remove leading zeros and non-numeric characters
    const cleanValue = value.replace(/^0+/, "").replace(/[^0-9]/g, "");
    setExpSource((prev) => ({
      ...prev,
      [field]: cleanValue,
    }));
  };

  useFocusEffect(
    React.useCallback(() => {
      setCurrentLevel("1");
      setTargetLevel("90");
      setError("");
      setResult(null);
      setExpSource({
        pinkBook: "0",
        orangeBook: "0",
        blueBook: "0",
        greyBook: "0",
        credits: "0",
      });
      scrollRef.current?.resetScroll();
      return () => {};
    }, [])
  );

  return (
    <>
      <ThemedView style={styles.container}>
        {error && (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        )}

        <>
          <ThemedText>Enter current level and target level</ThemedText>

          <ThemedView style={styles.row}>
            <TextInput
              mode="outlined"
              label="Current Level"
              placeholder="1 - 89"
              value={currentLevel}
              onChangeText={setCurrentLevel}
              keyboardType="numeric"
              maxLength={2}
              style={[styles.input, styles.halfInput]}
              right={
                currentLevel !== "" && (
                  <TextInput.Icon
                    icon="close"
                    size={16}
                    onPress={() => setCurrentLevel("")}
                  />
                )
              }
            />
            <TextInput
              mode="outlined"
              label="Target Level"
              placeholder="2 - 90"
              value={targetLevel}
              onChangeText={setTargetLevel}
              keyboardType="numeric"
              maxLength={2}
              style={[styles.input, styles.halfInput]}
              right={
                targetLevel !== "" && (
                  <TextInput.Icon
                    icon="close"
                    size={16}
                    onPress={() => setTargetLevel("")}
                  />
                )
              }
            />
          </ThemedView>

          <ThemedView style={styles.advancedSettings}>
            <Collapsible
              title="Current Inventory"
              iconSize={12}
              fontType="smallSemiBold"
            >
              <Card style={styles.advancedSettingsCard}>
                <View style={styles.advancedSettingsSubtitle}>
                  <ThemedText type="cardtitle">Available Resources</ThemedText>
                  <Divider style={styles.advancedSettingsSubtitleDivider} />
                </View>
                <ThemedView style={styles.resourceInputContainer}>
                  <Image
                    source={require("../../assets/images/icons/pink_book.png")}
                    style={styles.resourceInputIcon}
                  />
                  <TextInput
                    mode="outlined"
                    label="Superior EXP Report"
                    value={expSource.pinkBook}
                    onChangeText={(value) =>
                      handleExpSourceChange("pinkBook", value)
                    }
                    keyboardType="numeric"
                    style={styles.resourceInput}
                  />
                </ThemedView>
                <ThemedView style={styles.resourceInputContainer}>
                  <Image
                    source={require("../../assets/images/icons/orange_book.png")}
                    style={styles.resourceInputIcon}
                  />
                  <TextInput
                    mode="outlined"
                    label="Advanced EXP Report"
                    value={expSource.orangeBook}
                    onChangeText={(value) =>
                      handleExpSourceChange("orangeBook", value)
                    }
                    keyboardType="numeric"
                    style={styles.resourceInput}
                  />
                </ThemedView>

                <ThemedView style={styles.resourceInputContainer}>
                  <Image
                    source={require("../../assets/images/icons/blue_book.png")}
                    style={styles.resourceInputIcon}
                  />
                  <TextInput
                    mode="outlined"
                    label="Normal EXP Report"
                    value={expSource.blueBook}
                    onChangeText={(value) =>
                      handleExpSourceChange("blueBook", value)
                    }
                    keyboardType="numeric"
                    style={styles.resourceInput}
                  />
                </ThemedView>
                <ThemedView style={styles.resourceInputContainer}>
                  <Image
                    source={require("../../assets/images/icons/grey_book.png")}
                    style={styles.resourceInputIcon}
                  />
                  <TextInput
                    mode="outlined"
                    label="Novice EXP Report"
                    value={expSource.greyBook}
                    onChangeText={(value) =>
                      handleExpSourceChange("greyBook", value)
                    }
                    keyboardType="numeric"
                    style={styles.resourceInput}
                  />
                </ThemedView>
                <ThemedView style={styles.resourceInputContainer}>
                  <Image
                    source={require("../../assets/images/icons/credit.png")}
                    style={styles.resourceInputIcon}
                  />
                  <TextInput
                    mode="outlined"
                    label="Credits"
                    value={expSource.credits}
                    onChangeText={(value) =>
                      handleExpSourceChange("credits", value)
                    }
                    keyboardType="numeric"
                    style={styles.resourceInput}
                  />
                </ThemedView>
              </Card>
            </Collapsible>
          </ThemedView>
        </>

        <Button
          mode="contained"
          onPress={handleCalculate}
          style={styles.button}
        >
          Calculate
        </Button>
      </ThemedView>

      {result && (
        <ThemedView style={styles.resultSection}>
          <Card style={[styles.card, styles.resultCard]}>
            <Card.Content>
              <ThemedText style={styles.resultTitle}>
                Required Experience
              </ThemedText>
              <ThemedText type="title">
                {result.totalExp.toLocaleString()}
              </ThemedText>
              <ThemedText style={styles.resourceTitle}>
                Required Resources:
              </ThemedText>
              <ThemedView style={styles.resourceList}>
                <ThemedView style={styles.resourceItemContainer}>
                  <Image
                    source={require("../../assets/images/icons/pink_book.png")}
                    style={styles.resourceItemIcon}
                  />
                  <ThemedText style={styles.resourceItem}>
                    Superior EXP Reports: {result.pinkBooks}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.resourceItemContainer}>
                  <Image
                    source={require("../../assets/images/icons/orange_book.png")}
                    style={styles.resourceItemIcon}
                  />
                  <ThemedText style={styles.resourceItem}>
                    Advanced EXP Reports: {result.orangeBooks}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.resourceItemContainer}>
                  <Image
                    source={require("../../assets/images/icons/blue_book.png")}
                    style={styles.resourceItemIcon}
                  />
                  <ThemedText style={styles.resourceItem}>
                    Normal EXP Reports: {result.blueBooks}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.resourceItemContainer}>
                  <Image
                    source={require("../../assets/images/icons/grey_book.png")}
                    style={styles.resourceItemIcon}
                  />
                  <ThemedText style={styles.resourceItem}>
                    Novice EXP Reports: {result.greyBooks}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.resourceItemContainer}>
                  <Image
                    source={require("../../assets/images/icons/credit.png")}
                    style={styles.resourceItemIcon}
                  />
                  <ThemedText style={styles.resourceItem}>
                    Credits: {result.creditsNeeded.toLocaleString()}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </Card.Content>
          </Card>
        </ThemedView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
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
  advancedSettingsCard: {
    padding: 4,
    paddingBottom: 8,
  },
  advancedSettingsSubtitle: {
    marginTop: 4,
  },
  advancedSettingsSubtitleDivider: {
    margin: 4,
    marginBottom: 4,
  },
  resourceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    marginHorizontal: 4,
    backgroundColor: "transparent",
  },
  resourceInputIcon: {
    marginHorizontal: 8,
    width: 36,
    height: 36,
  },
  resourceInput: {
    flex: 1,
  },
  button: {
    marginTop: 10,
  },
  resultSection: {
    marginTop: 12,
  },
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
  resourceTitle: {
    fontSize: 14,
    color: "#FFF",
    marginTop: 12,
    marginBottom: 4,
  },
  resourceList: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  resourceItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  resourceItemIcon: {
    width: 24,
    height: 24,
    marginRight: 4,
  },
  resourceItem: {
    flex: 1,
  },
});
