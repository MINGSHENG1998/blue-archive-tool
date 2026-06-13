import React, { useState, useRef, useMemo } from "react";
import {
  StyleSheet,
  View,
  Animated,
  Pressable,
} from "react-native";
import {
  Card,
  HelperText,
  ActivityIndicator,
  SegmentedButtons,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";

import { ScreenLayout, type ScreenLayoutRef } from "@/components/ScreenLayout";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import CharaExpCalc from "../resourceCalc/charaExp";
import ElephCalc from "../resourceCalc/elephCalc";
import SkillCalc from "../resourceCalc/skillCalc";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLanguage } from "@/contexts/language-context";
import { i18n } from "@/constants/i18n";
import { useColors } from "@/hooks/useColors";
import type { ThemeTokens } from "@/constants/theme";
import { elevation } from "@/constants/elevation";
import { RADIUS } from "@/constants/layout";


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
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { locale } = useLanguage();
  const t = i18n[locale];
  const calculatorTypes = [
    { value: "character", label: t.resourceCharacter, description: t.resourceCharDesc },
    { value: "other", label: t.resourceEleph, description: t.resourceElephDesc },
    { value: "skill", label: t.resourceSkill, description: t.resourceSkillDesc },
  ];
  const selected = calculatorTypes.find((x) => x.value === selectedType);

  return (
    <AnimatedCard style={styles.cardWrapper}>
      <Card style={[styles.card, { backgroundColor: cardBackground }]}>
        <Card.Content style={styles.cardContent}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            {t.resourceChooseCalc}
          </ThemedText>
          <SegmentedButtons
            value={selectedType}
            onValueChange={onTypeChange}
            density="medium"
            buttons={calculatorTypes.map((type) => ({
              value: type.value,
              label: type.label,
              labelStyle: styles.segmentLabel,
            }))}
            theme={{
              colors: {
                secondaryContainer: c.accentSoft,
                onSecondaryContainer: c.primaryColor,
                onSurface: c.textSecondary,
                outline: c.surfaceBorder,
                primary: c.primaryColor,
              },
            }}
          />
          {selected && (
            <ThemedText style={styles.selectorDesc}>
              {selected.description}
            </ThemedText>
          )}
        </Card.Content>
      </Card>
    </AnimatedCard>
  );
};

// Error display component
const ErrorDisplay = ({ error }: any) => {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
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
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { locale } = useLanguage();
  const t = i18n[locale];

  return (
    <AnimatedCard style={styles.cardWrapper}>
      <Card style={[styles.card, { backgroundColor: cardBackground }]}>
        <Card.Content style={styles.loadingContent}>
          <ActivityIndicator size="large" color={c.primaryColor} />
          <ThemedText style={styles.loadingText}>{t.resourceCalculating}</ThemedText>
        </Card.Content>
      </Card>
    </AnimatedCard>
  );
};

// Calculator content component
const CalculatorContent = ({ calculatorType }: any) => {
  const cardBackground = useThemeColor({}, "background");
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { locale } = useLanguage();
  const t = i18n[locale];
  const calculators: Record<string, { component: React.ComponentType; title: string }> = {
    character: { component: CharaExpCalc, title: t.resourceCharacter },
    other: { component: ElephCalc, title: t.resourceEleph },
    skill: { component: SkillCalc, title: t.resourceSkill },
  };
  const { component: CalculatorComponent, title } = calculators[calculatorType] ?? calculators.character;

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
  const scrollRef = useRef<ScreenLayoutRef>(null);
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
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
    <ScreenLayout
      ref={scrollRef}
      title={t.resourcePageTitle}
      subtitle={t.resourceSubtitle}
    >
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
    </ScreenLayout>
  );
}

const makeStyles = (c: ThemeTokens) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.appBg,
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
    color: c.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: c.textMuted,
    marginTop: 4,
  },
  titleAccent: {
    width: 44,
    height: 3,
    backgroundColor: c.primaryColor,
    borderRadius: 2,
    shadowColor: c.primaryColor,
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
    backgroundColor: c.elevatedBg,
    borderRadius: RADIUS.card,
    ...elevation(c, 2),
  },
  cardContent: {
    padding: 24,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: 18,
    marginBottom: 20,
  },
  accent: {
    width: 60,
    height: 2,
    backgroundColor: c.primaryColor,
    borderRadius: 1,
  },

  // Type selector
  segmentLabel: {
    fontSize: 12,
  },
  selectorDesc: {
    color: c.textMuted,
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },

  // Error styles
  errorContainer: {
    backgroundColor: c.hazardBg,
    borderRadius: RADIUS.control,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: c.hazardColor,
  },
  errorText: {
    color: c.hazardColor,
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
    color: c.textPrimary,
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
    color: c.textMuted,
    fontSize: 16,
  },
});
