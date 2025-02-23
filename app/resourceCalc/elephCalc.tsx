import React, { useState, useRef } from "react";
import { Image, StyleSheet, View, Keyboard } from "react-native";
import {
  Card,
  TextInput,
  Button,
  HelperText,
  Divider,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import { useFocusEffect } from "@react-navigation/native";

import { Collapsible } from "@/components/Collapsible";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function ElephCalc() {
  const scrollRef = useRef<{ resetScroll: () => void }>(null);
  const [currentRarity, setCurrentRarity]: any = useState("1");
  const [targetRarity, setTargetRarity]: any = useState("5");
  const [currentEleph, setCurrentEleph] = useState("0");
  const [weaponRank, setWeaponRank]: any = useState("0"); // New state for weapon rank
  const [error, setError] = useState("");
  const [result, setResult]: any = useState(null);

  const rarityOptions = [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "4", value: "4" },
    { label: "5", value: "5" },
  ];

  const weaponRankOptions = [
    { label: "0", value: "0" },
    { label: "1", value: "1" },
    { label: "2", value: "2" },
  ];

  const PROMOTION_COSTS: any = {
    "1-2": { fragments: 30, cost: 40 },
    "1-3": { fragments: 110, cost: 350 },
    "1-4": { fragments: 210, cost: 850 },
    "1-5": { fragments: 330, cost: 1450 },
    "2-3": { fragments: 80, cost: 200 },
    "2-4": { fragments: 180, cost: 700 },
    "2-5": { fragments: 300, cost: 1300 },
    "3-4": { fragments: 100, cost: 300 },
    "3-5": { fragments: 220, cost: 900 },
    "4-5": { fragments: 120, cost: 600 },
  };

  const WEAPON_UPGRADE_COSTS = [120, 180]; // Fragment costs for weapon upgrades (rank 1 and rank 2)

  const calculateEligmaCost = (elephCount: number) => {
    if (elephCount <= 20) return 1;
    if (elephCount <= 40) return 2;
    if (elephCount <= 60) return 3;
    if (elephCount <= 80) return 4;
    return 5;
  };

  const handleCalculate = () => {
    const fromValue = parseInt(currentRarity, 10);
    const toValue = parseInt(targetRarity, 10);
    const currentValue = parseInt(currentEleph, 10) || 0;
    const weaponRankValue = parseInt(weaponRank, 10); // Get weapon rank value

    if (
      fromValue >= 1 &&
      fromValue <= 4 &&
      toValue >= 2 &&
      toValue <= 5 &&
      fromValue < toValue
    ) {
      setError("");

      const key = `${fromValue}-${toValue}`;
      const requirement = PROMOTION_COSTS[key];

      if (!requirement) {
        setError("Invalid rarity combination");
        setResult(null);
        return;
      }

      let neededFragments = Math.max(0, requirement.fragments - currentValue);
      let totalEligma = 0;

      // Calculate total eligma cost based on cumulative costs
      let remainingFragments = neededFragments;
      let currentBatch = 0;

      while (remainingFragments > 0) {
        const batchSize = Math.min(remainingFragments, 20);
        const costPerFragment = calculateEligmaCost(currentBatch);
        totalEligma += batchSize * costPerFragment;
        remainingFragments -= batchSize;
        currentBatch += batchSize;
      }

      // Add weapon upgrade costs if target rarity is 5 and weapon rank is specified
      let weaponUpgradeFragments = 0;
      if (toValue === 5 && weaponRankValue > 0) {
        weaponUpgradeFragments = WEAPON_UPGRADE_COSTS.slice(0, weaponRankValue).reduce(
          (sum, cost) => sum + cost,
          0
        );
        neededFragments += weaponUpgradeFragments;
      }

      setResult({
        totalFragments: requirement.fragments + (toValue === 5 ? weaponUpgradeFragments : 0),
        neededFragments,
        totalEligma,
        totalCost: requirement.cost,
        weaponUpgradeFragments,
      });

      Keyboard.dismiss();
    } else {
      setError(
        'Please ensure "Current Rarity" is 1-4 and "Target Rarity" is 2-5.'
      );
      setResult(null);
    }
  };

  const handleElephChange = (text: string) => {
    // Remove leading zeros and non-numeric characters
    const cleanedText = text.replace(/^0+|[^0-9]/g, '');
    setCurrentEleph(cleanedText);
  };

  useFocusEffect(
    React.useCallback(() => {
      setCurrentRarity("1");
      setTargetRarity("5");
      setCurrentEleph("0");
      setWeaponRank("0"); // Reset weapon rank
      setError("");
      setResult(null);
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
          <ThemedText>Enter current rarity and target rarity</ThemedText>

          <ThemedView style={styles.rarityContainer}>
            <ThemedView style={styles.rarityField}>
              <Dropdown
                mode="outlined"
                label="Current Rarity"
                placeholder="1 - 4"
                options={rarityOptions}
                value={currentRarity}
                onSelect={setCurrentRarity}
                hideMenuHeader={true}
              />
            </ThemedView>
            <ThemedView style={styles.rarityField}>
              <Dropdown
                mode="outlined"
                label="Target Rarity"
                placeholder="2 - 5"
                options={rarityOptions}
                value={targetRarity}
                onSelect={setTargetRarity}
                hideMenuHeader={true}
              />
            </ThemedView>
          </ThemedView>

          {/* Weapon Rank Input - Full Width */}
          {parseInt(targetRarity, 10) === 5 && (
            <ThemedView style={styles.weaponRankContainer}>
              <Dropdown
                mode="outlined"
                label="Weapon Rank"
                placeholder="0 - 2"
                options={weaponRankOptions}
                value={weaponRank}
                onSelect={setWeaponRank}
                hideMenuHeader={true}
              />
            </ThemedView>
          )}

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
                    source={require("../../assets/images/icons/eleph.png")}
                    style={styles.resourceInputIcon}
                  />
                  <TextInput
                    mode="outlined"
                    label="Current Student Eleph"
                    value={currentEleph}
                    onChangeText={handleElephChange}
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
                Required Resources
              </ThemedText>
              <ThemedText type="title">
                {result.totalFragments.toLocaleString()} Student Eleph
              </ThemedText>
              <ThemedText style={styles.resourceTitle}>
                Resource Breakdown:
              </ThemedText>
              <ThemedView style={styles.resourceList}>
                <ThemedView style={styles.resourceItemContainer}>
                  <Image
                    source={require("../../assets/images/icons/eleph.png")}
                    style={styles.resourceItemIcon}
                  />
                  <ThemedText style={styles.resourceItem}>
                    Additional Eleph Needed: {result.neededFragments}
                  </ThemedText>
                </ThemedView>
                {result.weaponUpgradeFragments > 0 && (
                  <ThemedView style={styles.resourceItemContainer}>
                    <Image
                      source={require("../../assets/images/icons/eleph.png")}
                      style={styles.resourceItemIcon}
                    />
                    <ThemedText style={styles.resourceItem}>
                      Weapon Upgrade Eleph: {result.weaponUpgradeFragments}
                    </ThemedText>
                  </ThemedView>
                )}
                <ThemedView style={styles.resourceItemContainer}>
                  <Image
                    source={require("../../assets/images/icons/eligma.png")}
                    style={styles.resourceItemIcon}
                  />
                  <ThemedText style={styles.resourceItem}>
                    Estimated Eligma Cost: {result.totalEligma}
                  </ThemedText>
                </ThemedView>
                {/* <ThemedView style={styles.resourceItemContainer}>
                  <Image
                    source={require("../../assets/images/icons/credit.png")}
                    style={styles.resourceItemIcon}
                  />
                  <ThemedText style={styles.resourceItem}>
                    Enhancement Cost: {result.totalCost.toLocaleString()}
                  </ThemedText>
                </ThemedView> */}
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
    gap: 4,
  },
  input: {
    marginTop: 5,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  rarityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginVertical: 8,
  },
  rarityField: {
    flex: 0.48,
  },
  weaponRankContainer: {
    marginVertical: 8,
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