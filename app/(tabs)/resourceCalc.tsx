import React, { useState, useRef } from "react";
import { 
  StyleSheet, 
  View, 
  Animated, 
  Pressable,
} from "react-native";
import {
  Card,
  HelperText,
  Surface,
  ActivityIndicator,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import CharaExpCalc from "../resourceCalc/charaExp";
import ElephCalc from "../resourceCalc/elephCalc";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLanguage } from "@/contexts/language-context";
import { i18n } from "@/constants/i18n";


// Reusable animated card component
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

// Calculator type selector component
const CalculatorTypeSelector = ({ selectedType, onTypeChange }: any) => {
  const cardBackground = useThemeColor({}, "background");
  const { locale } = useLanguage();
  const t = i18n[locale];
  const calculatorTypes = [
    { value: "character", label: t.resourceCharacter, description: t.resourceCharDesc },
    { value: "other", label: t.resourceEleph, description: t.resourceElephDesc },
  ];

  return (
    <AnimatedCard style={styles.cardWrapper}>
      <Card style={[styles.card, { backgroundColor: cardBackground }]}>
        <Card.Content style={styles.cardContent}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            {t.resourceChooseCalc}
          </ThemedText>
          <View style={styles.typeContainer}>
            {calculatorTypes.map((type) => (
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

// Error display component
const ErrorDisplay = ({ error }: any) => {
  if (!error) return null;
  
  return (
    <AnimatedCard style={styles.cardWrapper}>
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
  );
};

// Loading display component
const LoadingDisplay = () => {
  const cardBackground = useThemeColor({}, "background");
  const { locale } = useLanguage();
  const t = i18n[locale];

  return (
    <AnimatedCard style={styles.cardWrapper}>
      <Card style={[styles.card, { backgroundColor: cardBackground }]}>
        <Card.Content style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#128AFA" />
          <ThemedText style={styles.loadingText}>{t.resourceCalculating}</ThemedText>
        </Card.Content>
      </Card>
    </AnimatedCard>
  );
};

// Calculator content component
const CalculatorContent = ({ calculatorType }: any) => {
  const cardBackground = useThemeColor({}, "background");
  const { locale } = useLanguage();
  const t = i18n[locale];
  const CalculatorComponent = calculatorType === "character" ? CharaExpCalc : ElephCalc;
  const title = calculatorType === "character" ? t.resourceCharacter : t.resourceEleph;
  
  return (
    <AnimatedCard style={styles.cardWrapper}>
      <Card style={[styles.card, { backgroundColor: cardBackground }]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.calculatorHeader}>
            <ThemedText type="defaultSemiBold" style={styles.calculatorTitle}>
              {title}
            </ThemedText>
            <View style={styles.accent} />
          </View>
          <CalculatorComponent />
        </Card.Content>
      </Card>
    </AnimatedCard>
  );
};

export default function ResourceCalcScreen() {
  const scrollRef = useRef<{ resetScroll: () => void } | null>(null);
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, "background");
  const { locale } = useLanguage();
  const t = i18n[locale];
  
  const [calculatorType, setCalculatorType] = useState("character");
  const [error, setError] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      // Reset state and scroll position when screen comes into focus
      setCalculatorType("character");
      setError("");
      scrollRef.current?.resetScroll();
    }, [])
  );

  const handleCalculatorTypeChange = (type: any) => {
    setCalculatorType(type);
    setError("");
  };

  return (
    <ParallaxScrollView
      noheader={true}
      keyboardShouldPersistTaps="handled"
      ref={scrollRef}
    >
      <Surface
        style={[styles.container, { paddingTop: insets.top, backgroundColor }]}
        elevation={0}
      >
        {/* Header */}
        <ThemedView style={styles.titleContainer}>
          <View>
            <ThemedText type="title" style={styles.mainTitle}>
              {t.resourcePageTitle}
            </ThemedText>
            <View style={styles.titleAccent} />
            <ThemedText type="default" style={styles.subtitle}>
              {t.resourceSubtitle}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Calculator Type Selector */}
        <CalculatorTypeSelector 
          selectedType={calculatorType}
          onTypeChange={handleCalculatorTypeChange}
        />

        {/* Error Display */}
        <ErrorDisplay error={error} />

        {/* Calculator Content */}
        <ThemedView style={styles.calculatorSection}>
          {isCalculating ? (
            <LoadingDisplay />
          ) : (
            <CalculatorContent calculatorType={calculatorType} />
          )}
        </ThemedView>
      </Surface>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1628",
  },
  
  // Header styles
  titleContainer: {
    backgroundColor: "transparent",
    paddingHorizontal: 6,
    marginBottom: 14,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "800", fontStyle: "italic", letterSpacing: 0.2,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    marginTop: 4,
  },
  titleAccent: {
    width: 44,
    height: 3,
    backgroundColor: "#128AFA",
    borderRadius: 2,
    shadowColor: "#128AFA",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },

  // Common card styles
  cardWrapper: {
    marginHorizontal: 4,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#0F2347",
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardContent: {
    padding: 24,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 20,
  },
  accent: {
    width: 60,
    height: 2,
    backgroundColor: "#128AFA",
    borderRadius: 1,
  },
  
  // Type selector styles
  typeContainer: {
    flexDirection: "row",
    gap: 16,
  },
  typeButton: {
    flex: 1,
    backgroundColor: "rgba(10, 22, 40, 0.7)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(18, 138, 250, 0.18)",
    padding: 16,
  },
  selectedTypeButton: {
    backgroundColor: "rgba(0, 245, 255, 0.1)",
    borderColor: "#128AFA",
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
    color: "#128AFA",
  },
  typeDescription: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  selectedTypeDescription: {
    color: "#FFFFFF",
  },

  // Error styles
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
  calculatorHeader: {
    marginBottom: 20,
  },
  calculatorTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 8,
  },

  // Loading styles
  loadingContent: {
    padding: 40,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 16,
  },
});