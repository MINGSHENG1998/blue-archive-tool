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
import { useThemeColor } from "@/hooks/useThemeColor";

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
const ResourceInput = ({ icon, label, value, onChangeText, fieldName }: any) => (
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
          primary: '#00F5FF',
          outline: 'rgba(71, 85, 105, 0.6)',
          onSurface: '#FFFFFF',
          surface: 'rgba(15, 23, 42, 0.8)',
          onSurfaceVariant: '#94A3B8',
        },
      }}
    />
  </ThemedView>
);

// Level input component
const LevelInput = ({ label, placeholder, value, onChangeText, onClear }: any) => (
  <TextInput
    mode="outlined"
    label={label}
    placeholder={placeholder}
    value={value}
    onChangeText={onChangeText}
    keyboardType="numeric"
    maxLength={2}
    style={[styles.input, styles.halfInput]}
    theme={{
      colors: {
        primary: '#00F5FF',
        outline: 'rgba(71, 85, 105, 0.6)',
        onSurface: '#FFFFFF',
        surface: 'rgba(15, 23, 42, 0.8)',
        onSurfaceVariant: '#94A3B8',
        placeholder: '#64748B',
      },
    }}
    right={
      value !== "" && (
        <TextInput.Icon
          icon="close"
          size={16}
          onPress={onClear}
          color="#94A3B8"
        />
      )
    }
  />
);

// Result item component
const ResultItem = ({ icon, label, value }: any) => (
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

// Main result display component
const ResultDisplay = ({ result }: any) => {
  const cardBackground = useThemeColor({}, "background");
  
  if (!result) return null;

  return (
    <ThemedView style={styles.resultSection}>
      <Card style={[styles.card, styles.resultCard, { backgroundColor: cardBackground }]}>
        <Card.Content style={styles.resultCardContent}>
          <View style={styles.resultHeader}>
            <ThemedText type="defaultSemiBold" style={styles.resultTitle}>
              Required Experience
            </ThemedText>
            <View style={styles.resultAccent} />
          </View>
          
          <View style={styles.totalExpContainer}>
            <ThemedText style={styles.totalExpLabel}>Total EXP Needed</ThemedText>
            <ThemedText style={styles.totalExpValue}>
              {result.totalExp.toLocaleString()}
            </ThemedText>
          </View>

          <View style={styles.resourceSection}>
            <ThemedText style={styles.resourceSectionTitle}>
              Required Resources
            </ThemedText>
            <View style={styles.resourceList}>
              <ResultItem
                icon={require("../../assets/images/icons/pink_book.png")}
                label="Superior EXP Reports"
                value={result.pinkBooks}
              />
              <ResultItem
                icon={require("../../assets/images/icons/orange_book.png")}
                label="Advanced EXP Reports"
                value={result.orangeBooks}
              />
              <ResultItem
                icon={require("../../assets/images/icons/blue_book.png")}
                label="Normal EXP Reports"
                value={result.blueBooks}
              />
              <ResultItem
                icon={require("../../assets/images/icons/grey_book.png")}
                label="Novice EXP Reports"
                value={result.greyBooks}
              />
              <ResultItem
                icon={require("../../assets/images/icons/credit.png")}
                label="Credits"
                value={result.creditsNeeded}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    </ThemedView>
  );
};

export default function CharaExpCalc() {
  const scrollRef = useRef<{ resetScroll: () => void } | null>(null);
  const cardBackground = useThemeColor({}, "background");
  
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
        'Please ensure "Current Level" is 1-89 and "Target Level" is 2-90.'
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
          <ThemedText style={styles.sectionLabel}>
            Level Configuration
          </ThemedText>
          <ThemedView style={styles.row}>
            <LevelInput
              label="Current Level"
              placeholder="1 - 89"
              value={currentLevel}
              onChangeText={setCurrentLevel}
              onClear={() => setCurrentLevel("")}
            />
            <LevelInput
              label="Target Level"
              placeholder="2 - 90"
              value={targetLevel}
              onChangeText={setTargetLevel}
              onClear={() => setTargetLevel("")}
            />
          </ThemedView>
        </View>

        {/* Inventory Section */}
        <ThemedView style={styles.inventorySection}>
          <Collapsible
            title="Current Inventory (Optional)"
            iconSize={12}
            fontType="smallSemiBold"
          >
            <Card style={[styles.inventoryCard, { backgroundColor: cardBackground }]}>
              <Card.Content style={styles.inventoryContent}>
                <View style={styles.inventoryHeader}>
                  <ThemedText style={styles.inventoryTitle}>Available Resources</ThemedText>
                  <View style={styles.inventoryAccent} />
                </View>
                
                <View style={styles.resourceInputsContainer}>
                  <ResourceInput
                    icon={require("../../assets/images/icons/pink_book.png")}
                    label="Superior EXP Report"
                    value={expSource.pinkBook}
                    onChangeText={handleExpSourceChange}
                    fieldName="pinkBook"
                  />
                  <ResourceInput
                    icon={require("../../assets/images/icons/orange_book.png")}
                    label="Advanced EXP Report"
                    value={expSource.orangeBook}
                    onChangeText={handleExpSourceChange}
                    fieldName="orangeBook"
                  />
                  <ResourceInput
                    icon={require("../../assets/images/icons/blue_book.png")}
                    label="Normal EXP Report"
                    value={expSource.blueBook}
                    onChangeText={handleExpSourceChange}
                    fieldName="blueBook"
                  />
                  <ResourceInput
                    icon={require("../../assets/images/icons/grey_book.png")}
                    label="Novice EXP Report"
                    value={expSource.greyBook}
                    onChangeText={handleExpSourceChange}
                    fieldName="greyBook"
                  />
                  <ResourceInput
                    icon={require("../../assets/images/icons/credit.png")}
                    label="Credits"
                    value={expSource.credits}
                    onChangeText={handleExpSourceChange}
                    fieldName="credits"
                  />
                </View>
              </Card.Content>
            </Card>
          </Collapsible>
        </ThemedView>

        {/* Calculate Button */}
        <Button
          mode="contained"
          onPress={handleCalculate}
          style={styles.calculateButton}
          buttonColor="#00F5FF"
          textColor="#0F172A"
          labelStyle={styles.calculateButtonText}
        >
          Calculate Resources
        </Button>
      </ThemedView>

      {/* Result Display */}
      <ResultDisplay result={result} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // Error styles - matching parent
  errorContainer: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  errorText: {
    color: "#DC2626",
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
    color: "#FFFFFF",
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
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: "#FFFFFF",
    marginBottom: 8,
  },
  inventoryAccent: {
    width: 40,
    height: 2,
    backgroundColor: "#00F5FF",
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
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.3)",
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
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#00F5FF",
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
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  resultCard: {
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.2)",
  },
  resultCardContent: {
    padding: 24,
  },
  resultHeader: {
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  resultAccent: {
    width: 60,
    height: 2,
    backgroundColor: "#00F5FF",
    borderRadius: 1,
  },
  
  // Total EXP display
  totalExpContainer: {
    backgroundColor: "rgba(0, 245, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.3)",
  },
  totalExpLabel: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 4,
  },
  totalExpValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00F5FF",
  },

  // Resource section
  resourceSection: {
    marginTop: 8,
  },
  resourceSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  resourceList: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
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
    backgroundColor: "rgba(30, 41, 59, 0.8)",
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
    color: "#FFFFFF",
  },
  resourceValue: {
    fontWeight: "600",
    color: "#00F5FF",
  },
});