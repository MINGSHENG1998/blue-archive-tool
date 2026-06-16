import React, { useState, useRef, useMemo } from "react";
import { Image, StyleSheet, View, Keyboard } from "react-native";
import {
  TextInput,
  Button,
  HelperText,
  Divider,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";

import { AppCard } from "@/components/AppCard";
import { Collapsible } from "@/components/Collapsible";
import { RangeSelector } from "@/components/RangeSelector";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { charaExpData } from "@/constants/charaLvlData";
import { useLanguage } from "@/contexts/language-context";
import { i18n } from "@/constants/i18n";
import { useColors } from "@/hooks/useColors";
import type { ThemeTokens } from "@/constants/theme";
import { elevation } from "@/constants/elevation";
import { RADIUS } from "@/constants/layout";

const EXP_VALUES = {
  pinkBook: 10000,
  orangeBook: 2000,
  blueBook: 500,
  greyBook: 50,
};

const INITIAL_EXP_SOURCE = {
  pinkBook: "0",
  orangeBook: "0",
  blueBook: "0",
  greyBook: "0",
  credits: "0",
};

// Resource input component
const ResourceInput = ({ icon, label, value, onChangeText, fieldName }: any) => {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <ThemedView style={styles.resourceInputContainer}>
      <View style={styles.resourceIconContainer}>
        <Image source={icon} style={styles.resourceInputIcon} />
      </View>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={(val) => onChangeText(fieldName, val)}
        keyboardType="numeric"
        style={styles.resourceInput}
        theme={{
          colors: {
            primary: c.primaryColor,
            outline: c.surfaceBorder,
            onSurface: c.textPrimary,
            surface: c.surfaceBg,
            onSurfaceVariant: c.textSecondary,
          },
        }}
      />
    </ThemedView>
  );
};

// Result item component
const ResultItem = ({ icon, label, value }: any) => {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <ThemedView style={styles.resourceItemContainer}>
      <View style={styles.resultIconContainer}>
        <Image source={icon} style={styles.resourceItemIcon} />
      </View>
      <ThemedText style={styles.resourceItem}>
        {label}:{" "}
        <ThemedText style={styles.resourceValue}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </ThemedText>
      </ThemedText>
    </ThemedView>
  );
};

// Main result display component
const ResultDisplay = ({ result }: any) => {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { locale } = useLanguage();
  const t = i18n[locale];

  if (!result) return null;

  return (
    <ThemedView style={styles.resultSection}>
      <AppCard level={2} padding={24}>
        <View style={styles.resultHeader}>
          <ThemedText type="defaultSemiBold" style={styles.resultTitle}>
            {t.charaExpInstruction}
          </ThemedText>
          <View style={styles.resultAccent} />
        </View>

        <View style={styles.totalExpContainer}>
          <ThemedText style={styles.totalExpLabel}>{t.bondRequiredExp}</ThemedText>
          <ThemedText style={styles.totalExpValue}>
            {result.totalExp.toLocaleString()}
          </ThemedText>
        </View>

        <View style={styles.resourceSection}>
          <ThemedText style={styles.resourceSectionTitle}>
            {t.bondRequiredResources}
          </ThemedText>
          <View style={styles.resourceList}>
            <ResultItem
              icon={require("../../assets/images/icons/pink_book.png")}
              label={t.charaExpSuperiorReports}
              value={result.pinkBooks}
            />
            <ResultItem
              icon={require("../../assets/images/icons/orange_book.png")}
              label={t.charaExpAdvancedReports}
              value={result.orangeBooks}
            />
            <ResultItem
              icon={require("../../assets/images/icons/blue_book.png")}
              label={t.charaExpNormalReports}
              value={result.blueBooks}
            />
            <ResultItem
              icon={require("../../assets/images/icons/grey_book.png")}
              label={t.charaExpNoviceReports}
              value={result.greyBooks}
            />
            <ResultItem
              icon={require("../../assets/images/icons/credit.png")}
              label={t.charaExpCredits}
              value={result.creditsNeeded}
            />
          </View>
        </View>
      </AppCard>
    </ThemedView>
  );
};

export default function CharaExpCalc() {
  const scrollRef = useRef<{ resetScroll: () => void } | null>(null);
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { locale } = useLanguage();
  const t = i18n[locale];

  const [currentLevel, setCurrentLevel] = useState("1");
  const [targetLevel, setTargetLevel] = useState("90");
  const [error, setError] = useState("");

  type ResultType = {
    totalExp: number;
    pinkBooks: number;
    orangeBooks: number;
    blueBooks: number;
    greyBooks: number;
    creditsNeeded: number;
    expNeededAfterInventory: number;
    availableExp: number;
  } | null;

  const [result, setResult] = useState<ResultType>(null);
  const [expSource, setExpSource] = useState(INITIAL_EXP_SOURCE);

  // Calculate total EXP needed between two levels
  const calculateTotalExpNeeded = (from: any, to: any) => {
    if (!charaExpData[from] || !charaExpData[to]) {
      return 0;
    }
    return charaExpData[to].totalExp - charaExpData[from].totalExp;
  };

  // Calculate required resources based on current inventory
  const calculateRequiredResources = (expNeeded: any) => {
    // Calculate available EXP from inventory
    const availableExp =
      (parseInt(expSource.pinkBook) || 0) * EXP_VALUES.pinkBook +
      (parseInt(expSource.orangeBook) || 0) * EXP_VALUES.orangeBook +
      (parseInt(expSource.blueBook) || 0) * EXP_VALUES.blueBook +
      (parseInt(expSource.greyBook) || 0) * EXP_VALUES.greyBook;

    // Calculate remaining EXP needed after using inventory
    let remainingExp = Math.max(0, expNeeded - availableExp);

    // Calculate optimal book distribution
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

  // Handle calculation
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
        t.charaExpValidationError
      );
      setResult(null);
    }
  };

  // Handle resource input changes
  const handleExpSourceChange = (field: any, value: any) => {
    // Remove leading zeros and non-numeric characters
    const cleanValue = value.replace(/^0+/, "").replace(/[^0-9]/g, "");
    setExpSource((prev) => ({
      ...prev,
      [field]: cleanValue,
    }));
  };

  // Reset state on focus
  useFocusEffect(
    React.useCallback(() => {
      setCurrentLevel("1");
      setTargetLevel("90");
      setError("");
      setResult(null);
      setExpSource(INITIAL_EXP_SOURCE);
      scrollRef.current?.resetScroll();
    }, [])
  );

  return (
    <>
      <ThemedView style={styles.container}>
        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <HelperText type="error" visible={!!error} style={styles.errorText}>
              {error}
            </HelperText>
          </View>
        )}

        {/* Level Input Section */}
        <View style={styles.section}>
          <RangeSelector
            label={t.charaExpLevelConfig}
            min={1}
            max={90}
            low={parseInt(currentLevel, 10) || 1}
            high={parseInt(targetLevel, 10) || 90}
            lowLabel={t.bondCurrentLevel}
            highLabel={t.bondTargetLevel}
            onChange={(lo, hi) => {
              setCurrentLevel(String(lo));
              setTargetLevel(String(hi));
            }}
          />
        </View>

        {/* Inventory Section */}
        <ThemedView style={styles.inventorySection}>
          <Collapsible
            title={t.calcCurrentInventory}
            iconSize={12}
            fontType="smallSemiBold"
          >
            <AppCard level={1} padding={20}>
              <View style={styles.inventoryHeader}>
                <ThemedText style={styles.inventoryTitle}>{t.calcAvailableResources}</ThemedText>
                <View style={styles.inventoryAccent} />
              </View>

              <View style={styles.resourceInputsContainer}>
                <ResourceInput
                  icon={require("../../assets/images/icons/pink_book.png")}
                  label={t.charaExpSuperiorReport}
                  value={expSource.pinkBook}
                  onChangeText={handleExpSourceChange}
                  fieldName="pinkBook"
                />
                <ResourceInput
                  icon={require("../../assets/images/icons/orange_book.png")}
                  label={t.charaExpAdvancedReport}
                  value={expSource.orangeBook}
                  onChangeText={handleExpSourceChange}
                  fieldName="orangeBook"
                />
                <ResourceInput
                  icon={require("../../assets/images/icons/blue_book.png")}
                  label={t.charaExpNormalReport}
                  value={expSource.blueBook}
                  onChangeText={handleExpSourceChange}
                  fieldName="blueBook"
                />
                <ResourceInput
                  icon={require("../../assets/images/icons/grey_book.png")}
                  label={t.charaExpNoviceReport}
                  value={expSource.greyBook}
                  onChangeText={handleExpSourceChange}
                  fieldName="greyBook"
                />
                <ResourceInput
                  icon={require("../../assets/images/icons/credit.png")}
                  label={t.charaExpCredits}
                  value={expSource.credits}
                  onChangeText={handleExpSourceChange}
                  fieldName="credits"
                />
              </View>
            </AppCard>
          </Collapsible>
        </ThemedView>

        {/* Calculate Button */}
        <Button
          mode="contained"
          onPress={handleCalculate}
          style={styles.calculateButton}
          buttonColor={c.primaryColor}
          textColor={c.primaryText}
          labelStyle={styles.calculateButtonText}
        >
          {t.resourceCalculate}
        </Button>
      </ThemedView>

      {/* Result Display */}
      <ResultDisplay result={result} />
    </>
  );
}

const makeStyles = (c: ThemeTokens) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // Error styles - matching parent
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

  // Section styles
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: c.textPrimary,
  },

  // Input styles
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    backgroundColor: "transparent",
  },
  input: {
    marginTop: 0,
  },
  halfInput: {
    flex: 1,
  },

  // Inventory styles
  inventorySection: {
    marginBottom: 24,
    backgroundColor: "transparent",
  },
  inventoryCard: {
    backgroundColor: c.elevatedBg,
    borderRadius: RADIUS.control,
    ...elevation(c, 2),
  },
  inventoryContent: {
    padding: 20,
  },
  inventoryHeader: {
    marginBottom: 16,
  },
  inventoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: c.textPrimary,
    marginBottom: 8,
  },
  inventoryAccent: {
    width: 40,
    height: 2,
    backgroundColor: c.primaryColor,
    borderRadius: 1,
  },

  // Resource input styles
  resourceInputsContainer: {
    gap: 12,
  },
  resourceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  resourceIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: c.surfaceBg,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resourceInputIcon: {
    width: 24,
    height: 24,
  },
  resourceInput: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // Button styles
  calculateButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: RADIUS.control,
    elevation: 3,
    shadowColor: c.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 4,
  },

  // Result styles
  resultSection: {
    marginTop: 24,
    backgroundColor: "transparent",
  },
  card: {
    marginBottom: 16,
    borderRadius: RADIUS.card,
    ...elevation(c, 2),
  },
  resultCard: {
    backgroundColor: c.elevatedBg,
  },
  resultCardContent: {
    padding: 24,
  },
  resultHeader: {
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    color: c.textPrimary,
    marginBottom: 8,
  },
  resultAccent: {
    width: 60,
    height: 2,
    backgroundColor: c.primaryColor,
    borderRadius: 1,
  },

  // Total EXP display
  totalExpContainer: {
    backgroundColor: c.accentSoft,
    borderRadius: RADIUS.control,
    padding: 16,
    marginBottom: 24,
  },
  totalExpLabel: {
    fontSize: 14,
    color: c.textSecondary,
    marginBottom: 4,
  },
  totalExpValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: c.primaryColor,
  },

  // Resource section
  resourceSection: {
    marginTop: 8,
  },
  resourceSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: c.textPrimary,
    marginBottom: 12,
  },
  resourceList: {
    backgroundColor: "transparent",
    gap: 12,
  },
  resourceItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  resultIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: c.elevatedBg,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resourceItemIcon: {
    width: 20,
    height: 20,
  },
  resourceItem: {
    flex: 1,
    fontSize: 14,
    color: c.textPrimary,
  },
  resourceValue: {
    fontWeight: "600",
    color: c.primaryColor,
  },
});
