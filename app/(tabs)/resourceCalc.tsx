import React, { useState, useRef } from "react";
import { 
  Image, 
  StyleSheet, 
  View, 
  Keyboard, 
  Animated, 
  Pressable,
  Dimensions 
} from "react-native";
import {
  Card,
  TextInput,
  Button,
  HelperText,
  Surface,
  Divider,
  SegmentedButtons,
  ActivityIndicator,
  Chip,
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
import { useThemeColor } from "@/hooks/useThemeColor";

const { width } = Dimensions.get("window");

// Enhanced calculator types with descriptions and icons
const CALCULATOR_TYPES = [
  { 
    value: "character", 
    label: "Character", 
    description: "Calculate EXP needed for leveling",
  },
  { 
    value: "other", 
    label: "Eleph", 
    description: "Calculate eleph resources",
  },
];

// Animated card component matching bond exp design
const AnimatedCard = ({ children, style, ...props }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

// Calculator type selector component with bond exp styling
const CalculatorTypeSelector = ({ selectedType, onTypeChange }: any) => {
  const cardBackground = useThemeColor({}, "background");
  
  return (
    <AnimatedCard style={styles.inputCardWrapper}>
      <Card style={[styles.inputCard, { backgroundColor: cardBackground }]}>
        <Card.Content style={styles.inputCardContent}>
          <ThemedText type="defaultSemiBold" style={styles.inputSectionTitle}>
            Choose Calculator Type
          </ThemedText>
          <View style={styles.typeCardsContainer}>
            {CALCULATOR_TYPES.map((type) => (
              <Pressable
                key={type.value}
                style={[
                  styles.typeButton,
                  selectedType === type.value && styles.selectedTypeButton
                ]}
                onPress={() => onTypeChange(type.value)}
              >
                <View style={styles.typeButtonContent}>
                  <ThemedText
                    style={[
                      styles.typeTitle,
                      selectedType === type.value && styles.selectedTypeTitle
                    ]}
                  >
                    {type.label}
                  </ThemedText>
                  <ThemedText 
                    style={[
                      styles.typeDescription,
                      selectedType === type.value && styles.selectedTypeDescription
                    ]}
                  >
                    {type.description}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        </Card.Content>
      </Card>
    </AnimatedCard>
  );
};

export default function ResourceCalcScreen() {
  const scrollRef = useRef<{ resetScroll: () => void }>(null);
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, "background");
  const cardBackground = useThemeColor({}, "background");
  const [calculatorType, setCalculatorType] = useState("character");
  const [error, setError] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      // Reset state and scroll position
      setCalculatorType("character");
      setError("");
      scrollRef.current?.resetScroll();
      return () => {};
    }, [])
  );

  const handleCalculatorTypeChange = (type: string) => {
    setCalculatorType(type);
    setError("");
  };

  const renderCalculator = () => {
    const CalculatorComponent = calculatorType === "character" ? CharaExpCalc : ElephCalc;
    
    return (
      <AnimatedCard style={styles.calculatorWrapper}>
        <Card style={[styles.calculatorCard, { backgroundColor: cardBackground }]}>
          <Card.Content style={styles.calculatorContent}>
            <View style={styles.calculatorHeader}>
              <ThemedText type="defaultSemiBold" style={styles.calculatorTitle}>
                {calculatorType === "character" ? "Character EXP Calculator" : "Eleph Resource Calculator"}
              </ThemedText>
              <View style={styles.calculatorAccent} />
            </View>
            <CalculatorComponent />
          </Card.Content>
        </Card>
      </AnimatedCard>
    );
  };

  return (
    <ParallaxScrollView
      noheader={true}
      keyboardShouldPersistTaps="handled"
      ref={scrollRef}
    >
      <View style={styles.backgroundPattern} />
      <Surface
        style={[styles.container, { paddingTop: insets.top, backgroundColor }]}
        elevation={0}
      >
        {/* Header matching bond exp design */}
        <ThemedView style={styles.titleContainer}>
          <View>
            <ThemedText type="title" style={styles.mainTitle}>
              Resource Calculator
            </ThemedText>
            <View style={styles.sectionAccent} />
            <ThemedText type="default" style={styles.subtitle}>
              Calculate resources for character progression
            </ThemedText>
          </View>
        </ThemedView>

        {/* Calculator Type Selector with bond exp styling */}
        <CalculatorTypeSelector 
          selectedType={calculatorType}
          onTypeChange={handleCalculatorTypeChange}
        />

        {/* Error Display matching bond exp style */}
        {error && (
          <AnimatedCard style={styles.errorWrapper}>
            <View style={styles.errorContainer}>
              <HelperText
                type="error"
                visible={!!error}
                style={styles.errorText}
              >
                {error}
              </HelperText>
            </View>
          </AnimatedCard>
        )}

        {/* Calculator Content */}
        <ThemedView style={styles.calculatorSection}>
          {isCalculating ? (
            <AnimatedCard style={styles.loadingWrapper}>
              <Card style={[styles.loadingCard, { backgroundColor: cardBackground }]}>
                <Card.Content style={styles.loadingContent}>
                  <ActivityIndicator size="large" color="#00F5FF" />
                  <ThemedText style={styles.loadingText}>Calculating...</ThemedText>
                </Card.Content>
              </Card>
            </AnimatedCard>
          ) : (
            renderCalculator()
          )}
        </ThemedView>
      </Surface>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  backgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0F172A",
    opacity: 0.8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    paddingHorizontal: 6,
    marginBottom: 14,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
  },
  sectionAccent: {
    width: 80,
    height: 3,
    backgroundColor: "#00F5FF",
    borderRadius: 2,
    shadowColor: "#00F5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },

  // Input Card Styles matching bond exp
  inputCardWrapper: {
    marginHorizontal: 4,
    marginBottom: 20,
  },
  inputCard: {
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  inputCardContent: {
    padding: 24,
  },
  inputSectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 20,
  },
  
  // Type selector styles
  typeCardsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  typeButton: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.4)",
    padding: 16,
  },
  selectedTypeButton: {
    backgroundColor: "rgba(0, 245, 255, 0.1)",
    borderColor: "#00F5FF",
    borderWidth: 2,
  },
  typeButtonContent: {
    alignItems: "center",
  },
  typeTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  selectedTypeTitle: {
    color: "#00F5FF",
  },
  typeDescription: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  selectedTypeDescription: {
    color: "#FFFFFF",
  },

  // Error styles matching bond exp
  errorWrapper: {
    marginHorizontal: 4,
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    margin: 0,
  },

  // Calculator section styles
  calculatorSection: {
    flex: 1,
    backgroundColor: "transparent",
  },
  calculatorWrapper: {
    marginHorizontal: 4,
    marginBottom: 20,
  },
  calculatorCard: {
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  calculatorContent: {
    padding: 24,
  },
  calculatorHeader: {
    marginBottom: 20,
  },
  calculatorTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 8,
  },
  calculatorAccent: {
    width: 60,
    height: 2,
    backgroundColor: "#00F5FF",
    borderRadius: 1,
  },

  // Loading styles matching bond exp
  loadingWrapper: {
    marginHorizontal: 4,
  },
  loadingCard: {
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 16,
    elevation: 3,
  },
  loadingContent: {
    padding: 40,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#94A3B8",
    fontSize: 16,
  },

  // Legacy styles for backward compatibility (keeping existing component styles)
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