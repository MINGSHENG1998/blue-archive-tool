import React, { useState, useRef } from "react";
import { Image, StyleSheet, View, Keyboard } from "react-native";
import {
  Card,
  TextInput,
  Button,
  HelperText,
  Surface,
  Divider,
  SegmentedButtons,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Collapsible } from "@/components/Collapsible";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { charaExpData } from "@/constants/charaLvlData";
import CharaExpCalc from "../resourceCalc/charaExp";
import ElephCalc from "../resourceCalc/elephCalc";

const CALCULATOR_TYPES = [
  { value: "character", label: "Character" },
  //{ value: "skill", label: "Skill" },
  { value: "other", label: "Eleph" },
];

export default function ResourceCalcScreen() {
  const scrollRef = useRef<{ resetScroll: () => void }>(null);
  const insets = useSafeAreaInsets();

  const [calculatorType, setCalculatorType] = useState("character");
  const [error, setError] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      // Reset state and scroll position
      setCalculatorType("character");
    
      setError("");
    
      scrollRef.current?.resetScroll();
      return () => {};
    }, [])
  );

  const renderCalculator = () => {
    switch (calculatorType) {
      case "character":
        return (
          <CharaExpCalc />
        );
      case "skill":
        return <ElephCalc />;
      case "other":
        return <ElephCalc />;
      default:
        return null;
    }
  };

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
          <ThemedText type="title">Resource Calculator</ThemedText>
        </ThemedView>

        <SegmentedButtons
          value={calculatorType}
          onValueChange={setCalculatorType}
          buttons={CALCULATOR_TYPES}
          style={styles.segmentedButtons}
        />

        <ThemedView style={styles.container}>
          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}

          {renderCalculator()}
        </ThemedView>
      </Surface>
    </ParallaxScrollView>
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
