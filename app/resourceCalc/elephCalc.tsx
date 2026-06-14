import React, { useState, useRef, useMemo } from "react";
import { Image, StyleSheet, View, Keyboard, Pressable } from "react-native";
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
import { RangeSelector } from "@/components/RangeSelector";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLanguage } from "@/contexts/language-context";
import { i18n } from "@/constants/i18n";
import { useColors } from "@/hooks/useColors";
import type { ThemeTokens } from "@/constants/theme";
import { elevation } from "@/constants/elevation";
import { RADIUS } from "@/constants/layout";

export default function ElephCalc() {
  const scrollRef = useRef<{ resetScroll: () => void }>(null);
  const { locale } = useLanguage();
  const t = i18n[locale];
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [currentRarity, setCurrentRarity]: any = useState("1");
  const [targetRarity, setTargetRarity]: any = useState("5");
  const [currentEleph, setCurrentEleph] = useState("0");
  const [weaponRank, setWeaponRank]: any = useState("0");
  const [error, setError] = useState("");
  const [result, setResult]: any = useState(null);

  const cardBackground = useThemeColor({}, "background");

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

  const WEAPON_UPGRADE_COSTS = [120, 180];

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
    const weaponRankValue = parseInt(weaponRank, 10);

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
        setError(t.elephInvalidCombination);
        setResult(null);
        return;
      }

      let neededFragments = Math.max(0, requirement.fragments - currentValue);
      let totalEligma = 0;

      let remainingFragments = neededFragments;
      let currentBatch = 0;

      while (remainingFragments > 0) {
        const batchSize = Math.min(remainingFragments, 20);
        const costPerFragment = calculateEligmaCost(currentBatch);
        totalEligma += batchSize * costPerFragment;
        remainingFragments -= batchSize;
        currentBatch += batchSize;
      }

      let weaponUpgradeFragments = 0;
      if (toValue === 5 && weaponRankValue > 0) {
        weaponUpgradeFragments = WEAPON_UPGRADE_COSTS.slice(
          0,
          weaponRankValue
        ).reduce((sum, cost) => sum + cost, 0);
        neededFragments += weaponUpgradeFragments;
      }

      setResult({
        totalFragments:
          requirement.fragments + (toValue === 5 ? weaponUpgradeFragments : 0),
        neededFragments,
        totalEligma,
        totalCost: requirement.cost,
        weaponUpgradeFragments,
      });

      Keyboard.dismiss();
    } else {
      setError(
        t.elephValidationError
      );
      setResult(null);
    }
  };

  const handleElephChange = (text: string) => {
    const cleanedText = text.replace(/^0+|[^0-9]/g, "");
    setCurrentEleph(cleanedText);
  };

  useFocusEffect(
    React.useCallback(() => {
      setCurrentRarity("1");
      setTargetRarity("5");
      setCurrentEleph("0");
      setWeaponRank("0");
      setError("");
      setResult(null);
      scrollRef.current?.resetScroll();
      return () => {};
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <HelperText type="error" visible={!!error} style={styles.errorText}>
            {error}
          </HelperText>
        </View>
      )}

      {/* Input Section */}
      <View style={styles.inputSection}>
        <RangeSelector
          min={1}
          max={5}
          low={parseInt(currentRarity, 10) || 1}
          high={parseInt(targetRarity, 10) || 5}
          lowLabel={t.elephCurrentRarity}
          highLabel={t.elephTargetRarity}
          onChange={(lo, hi) => {
            setCurrentRarity(String(lo));
            setTargetRarity(String(hi));
          }}
        />

        {/* Weapon Rank Input */}
        {parseInt(targetRarity, 10) === 5 && (
          <ThemedView style={styles.weaponRankContainer}>
            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
              {t.elephWeaponUpgradeLabel}
            </ThemedText>
            <Dropdown
              mode="outlined"
              label={t.elephWeaponRank}
              placeholder="0 - 2"
              options={weaponRankOptions}
              value={weaponRank}
              onSelect={setWeaponRank}
              hideMenuHeader={true}
            />
          </ThemedView>
        )}

        {/* Advanced Settings */}
        <ThemedView style={styles.advancedSettings}>
          <Collapsible
            title={t.calcCurrentInventory}
            iconSize={16}
            fontType="defaultSemiBold"
          >
            <Card
              style={[
                styles.inventoryCard,
                { backgroundColor: cardBackground },
              ]}
            >
              <Card.Content style={styles.inventoryContent}>
                <ThemedText
                  type="defaultSemiBold"
                  style={styles.inventoryTitle}
                >
                  {t.calcAvailableResources}
                </ThemedText>
                <Divider style={styles.inventoryDivider} />
                <ThemedView style={styles.resourceInputContainer}>
                  <Image
                    source={require("../../assets/images/icons/eleph.png")}
                    style={styles.resourceInputIcon}
                  />
                  <TextInput
                    mode="outlined"
                    label={t.elephCurrentEleph}
                    value={currentEleph}
                    onChangeText={handleElephChange}
                    keyboardType="numeric"
                    style={styles.resourceInput}
                    contentStyle={styles.inputContent}
                    outlineStyle={styles.inputOutline}
                    theme={{
                      colors: {
                        onSurfaceVariant: c.textSecondary,
                        primary: c.primaryColor,
                        outline: c.surfaceBorder,
                      },
                    }}
                  />
                </ThemedView>
              </Card.Content>
            </Card>
          </Collapsible>
        </ThemedView>

        {/* Calculate Button */}
        <Pressable
          style={({ pressed }) => [
            styles.calculateButton,
            pressed && styles.calculateButtonPressed,
          ]}
          onPress={handleCalculate}
        >
          <ThemedText type="defaultSemiBold" style={styles.calculateButtonText}>
            {t.resourceCalculate}
          </ThemedText>
        </Pressable>
      </View>

      {/* Results Section */}
      {result && (
        <View style={styles.resultSection}>
          <Card
            style={[styles.resultCard, { backgroundColor: cardBackground }]}
          >
            <Card.Content style={styles.resultContent}>
              <View style={styles.resultHeader}>
                <ThemedText type="defaultSemiBold" style={styles.resultTitle}>
                  {t.bondRequiredResources}
                </ThemedText>
                <View style={styles.resultAccent} />
              </View>

              <View style={styles.totalRequirement}>
                <ThemedText type="title" style={styles.totalText}>
                  {result.totalFragments.toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.totalLabel}>
                  {t.elephStudentEleph}
                </ThemedText>
              </View>

              <View style={styles.breakdown}>
                <ThemedText
                  type="defaultSemiBold"
                  style={styles.breakdownTitle}
                >
                  {t.elephResourceBreakdown}
                </ThemedText>

                <View style={styles.resourceList}>
                  <View style={styles.resourceItem}>
                    <Image
                      source={require("../../assets/images/icons/eleph.png")}
                      style={styles.resourceIcon}
                    />
                    <View style={styles.resourceDetails}>
                      <ThemedText style={styles.resourceName}>
                        {t.elephAdditionalEleph}
                      </ThemedText>
                      <ThemedText style={styles.resourceValue}>
                        {result.neededFragments.toLocaleString()}
                      </ThemedText>
                    </View>
                  </View>

                  {result.weaponUpgradeFragments > 0 && (
                    <View style={styles.resourceItem}>
                      <Image
                        source={require("../../assets/images/icons/eleph.png")}
                        style={styles.resourceIcon}
                      />
                      <View style={styles.resourceDetails}>
                        <ThemedText style={styles.resourceName}>
                          {t.elephWeaponUpgradeEleph}
                        </ThemedText>
                        <ThemedText style={styles.resourceValue}>
                          {result.weaponUpgradeFragments.toLocaleString()}
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  <View style={styles.resourceItem}>
                    <Image
                      source={require("../../assets/images/icons/eligma.png")}
                      style={styles.resourceIcon}
                    />
                    <View style={styles.resourceDetails}>
                      <ThemedText style={styles.resourceName}>
                        {t.elephEligmaCost}
                      </ThemedText>
                      <ThemedText style={styles.resourceValue}>
                        {result.totalEligma.toLocaleString()}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}
    </ThemedView>
  );
}

const makeStyles = (c: ThemeTokens) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // Error styles
  errorContainer: {
    backgroundColor: c.hazardBg,
    borderRadius: RADIUS.control,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: c.hazardColor,
  },
  errorText: {
    color: c.hazardColor,
    fontSize: 14,
    margin: 0,
  },

  // Input section
  inputSection: {
    marginBottom: 24,
  },
  accent: {
    width: 60,
    height: 2,
    backgroundColor: c.primaryColor,
    borderRadius: 1,
    marginBottom: 16,
  },

  // Rarity container
  rarityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  rarityField: {
    flex: 1,
  },

  // Weapon rank
  weaponRankContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: c.textPrimary,
    fontSize: 14,
    marginBottom: 8,
  },

  // Advanced settings
  advancedSettings: {
    marginBottom: 24,
  },
  inventoryCard: {
    backgroundColor: c.elevatedBg,
    borderRadius: RADIUS.control,
    marginTop: 12,
    ...elevation(c, 2),
  },
  inventoryContent: {
    padding: 16,
  },
  inventoryTitle: {
    color: c.textPrimary,
    fontSize: 14,
    marginBottom: 8,
  },
  inventoryDivider: {
    backgroundColor: c.surfaceBorder,
    marginBottom: 16,
  },
  resourceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "transparent",
  },
  resourceInputIcon: {
    width: 32,
    height: 32,
  },
  resourceInput: {
    flex: 1,
  },
  inputContent: {
    color: c.textPrimary,
  },
  inputOutline: {
    borderColor: c.surfaceBorder,
  },

  // Calculate button
  calculateButton: {
    backgroundColor: c.primaryColor,
    borderRadius: RADIUS.control,
    padding: 16,
    alignItems: "center",
    shadowColor: c.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  calculateButtonPressed: {
    backgroundColor: c.accentSoft,
    transform: [{ scale: 0.98 }],
  },
  calculateButtonText: {
    color: c.primaryText,
    fontSize: 16,
  },

  // Results section
  resultSection: {
    marginTop: 24,
  },
  resultCard: {
    backgroundColor: c.elevatedBg,
    borderRadius: RADIUS.card,
    ...elevation(c, 2),
  },
  resultContent: {
    padding: 24,
  },
  resultHeader: {
    marginBottom: 20,
  },
  resultTitle: {
    color: c.textPrimary,
    fontSize: 18,
    marginBottom: 8,
  },
  resultAccent: {
    width: 80,
    height: 2,
    backgroundColor: c.primaryColor,
    borderRadius: 1,
  },

  // Total requirement
  totalRequirement: {
    backgroundColor: c.accentSoft,
    borderRadius: RADIUS.control,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  totalText: {
    color: c.primaryColor,
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  totalLabel: {
    color: c.textPrimary,
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },

  // Breakdown
  breakdown: {
    gap: 16,
  },
  breakdownTitle: {
    color: c.textPrimary,
    fontSize: 16,
    marginBottom: 12,
  },
  resourceList: {
    backgroundColor: c.surfaceBg,
    borderRadius: RADIUS.control,
    padding: 16,
    gap: 16,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resourceIcon: {
    width: 28,
    height: 28,
  },
  resourceDetails: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resourceName: {
    color: c.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  resourceValue: {
    color: c.primaryColor,
    fontSize: 14,
    fontWeight: "600",
  },
});
