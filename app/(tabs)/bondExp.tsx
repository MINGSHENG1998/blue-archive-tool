import {
  StyleSheet,
  Image,
  Platform,
  Keyboard,
  View,
  Text,
  Dimensions,
  Animated,
  Pressable,
} from "react-native";

import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import { ScreenLayout, type ScreenLayoutRef } from "@/components/ScreenLayout";
import { RangeSelector } from "@/components/RangeSelector";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useFocusEffect } from "@react-navigation/native";
import NumberInput from "@/components/NumberInput";

//components
import {
  DataTable,
  TextInput,
  Button,
  HelperText,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { useRef, useState, useMemo } from "react";

//constant
import { bondExpData, bondResourceTable } from "../../constants/bondData";
import React from "react";
import { AppCard } from "@/components/AppCard";
import { useLanguage } from "@/contexts/language-context";
import { i18n, bondResourceNames } from "@/constants/i18n";
import { useColors } from "@/hooks/useColors";
import type { ThemeTokens } from "@/constants/theme";
import { elevation } from "@/constants/elevation";
import { RADIUS } from "@/constants/layout";

const { width } = Dimensions.get("window");

// Animated Card Component (matching banner page)
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

export default function BondExpScreen() {
  const scrollRef = useRef<ScreenLayoutRef>(null);
  const { locale } = useLanguage();
  const t = i18n[locale];
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [from, setFrom]: any = useState("1");
  const [to, setTo]: any = useState("100");
  const [error, setError] = useState("");
  const [totalExp, setTotalExp]: any = useState(null);
  const [calculating, setCalculating] = useState(false);

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
    expSource.pat * 15 + expSource.monthlyGift * 60 + 2410
  );
  const handleCalculate = async () => {
    const fromValue = parseInt(from, 10);
    const toValue = parseInt(to, 10);

    if (
      fromValue >= 1 &&
      fromValue <= 99 &&
      toValue >= 2 &&
      toValue <= 100 &&
      fromValue < toValue
    ) {
      setCalculating(true);
      setError("");

      // Add slight delay for better UX
      setTimeout(() => {
        const totalExp =
          bondExpData[toValue - 1].totalExp -
          bondExpData[fromValue - 1].totalExp;
        setTotalExp(totalExp);
        setMonthlyExpGain(
          expSource.pat * 15 + expSource.monthlyGift * 60 + 2410
        );
        setCalculating(false);
        Keyboard.dismiss();
      }, 300);
    } else {
      setError(
        t.bondValidationError
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

  const getEstimatedDays = () => {
    if (!totalExp) return null;
    const dailyExp = expSource.pat * 15 + expSource.monthlyGift * 2 + 80; // Rough daily calculation
    return Math.ceil(totalExp / dailyExp);
  };

  useFocusEffect(
    React.useCallback(() => {
      // Reset state and scroll position
      setFrom("1");
      setTo("100");
      setError("");
      setTotalExp(null);
      setSortDirection("desc");
      scrollRef.current?.resetScroll();
      return () => {};
    }, [])
  );

  return (
    <ScreenLayout ref={scrollRef} title={t.bondPageTitle}>
        {/* Input Section */}
        <AnimatedCard style={styles.inputCardWrapper}>
          <AppCard level={2} padding={24}>
            <ThemedText
              type="defaultSemiBold"
              style={styles.inputSectionTitle}
            >
              {t.bondLevelRange}
            </ThemedText>
            <RangeSelector
              min={1}
              max={100}
              low={parseInt(from, 10) || 1}
              high={parseInt(to, 10) || 100}
              lowLabel={t.bondCurrentLevel}
              highLabel={t.bondTargetLevel}
              onChange={(lo, hi) => {
                setFrom(String(lo));
                setTo(String(hi));
              }}
            />

            {error && (
              <View style={styles.errorContainer}>
                <HelperText
                  type="error"
                  visible={!!error}
                  style={styles.errorText}
                >
                  {error}
                </HelperText>
              </View>
            )}

            <Button
              mode="contained"
              onPress={handleCalculate}
              style={styles.calculateButton}
              contentStyle={styles.calculateButtonContent}
              labelStyle={styles.calculateButtonLabel}
              loading={calculating}
              disabled={calculating || !from || !to}
              buttonColor={c.primaryColor}
              textColor={c.primaryText}
            >
              {t.bondCalculate}
            </Button>
          </AppCard>
        </AnimatedCard>

        {/* Advanced Settings */}
        <View style={styles.settingsSection}>
          <AppCard level={1} variant="surface" padding={16}>
            <Collapsible
              title={t.bondAdvancedSettings}
              iconSize={14}
              fontType={"defaultSemiBold"}
            >
              <View style={styles.settingsContent}>
                <View style={styles.settingsGrid}>
                  <View style={styles.settingItem}>
                    <NumberInput
                      value={expSource.pat}
                      onChange={(value) =>
                        setExpSource({ ...expSource, pat: value })
                      }
                      min={0}
                      max={6}
                      label={t.bondCafePat}
                    />
                  </View>
                  <View style={styles.settingItem}>
                    <NumberInput
                      value={expSource.monthlyGift}
                      onChange={(value) =>
                        setExpSource({ ...expSource, monthlyGift: value })
                      }
                      min={0}
                      max={200}
                      label={t.bondGift}
                    />
                  </View>
                </View>
              </View>
            </Collapsible>
          </AppCard>
        </View>

        {/* Results Section */}
        {totalExp && (
          <View style={styles.resultsSection}>
            {/* Main Result Card */}
            <AnimatedCard style={styles.resultCardWrapper}>
              <AppCard level={2} padding={24}>
                <ThemedText style={styles.resultTitle}>
                  {t.bondRequiredExp}
                </ThemedText>
                <ThemedText type="title" style={styles.resultValue}>
                  {totalExp.toLocaleString()}
                </ThemedText>

                <View style={styles.estimationRow}>
                  <View style={styles.estimationItem}>
                    <ThemedText style={styles.estimationLabel}>
                      {t.bondEstimatedTime}
                    </ThemedText>
                    <ThemedText style={styles.estimationValue}>
                      {totalExp > monthlyExpGain
                        ? Math.ceil(totalExp / monthlyExpGain) + " " + t.bondMonths
                        : t.bondLessMonth}
                    </ThemedText>
                  </View>
                  <View style={styles.estimationDivider} />
                  <View style={styles.estimationItem}>
                    <ThemedText style={styles.estimationLabel}>
                      {t.bondDays}
                    </ThemedText>
                    <ThemedText style={styles.estimationValue}>
                      {getEstimatedDays()} {t.bondDaysUnit}
                    </ThemedText>
                  </View>
                </View>
              </AppCard>
            </AnimatedCard>

            {/* Resources Table */}
            <View style={styles.resourceSection}>
              <AppCard level={1} variant="surface" padding={0}>
                <Collapsible
                  title={t.bondRequiredResources}
                  isDefaultOpen={true}
                  iconSize={14}
                  fontType={"defaultSemiBold"}
                >
                  <View style={styles.tableContainer}>
                    <DataTable style={styles.dataTable}>
                      <DataTable.Header style={styles.tableHeader}>
                        <DataTable.Title
                          textStyle={styles.tableHeaderText}
                          style={styles.sourceColumn}
                        >
                          {t.bondSource}
                        </DataTable.Title>
                        <DataTable.Title
                          numeric
                          textStyle={styles.tableHeaderText}
                          style={styles.expColumn}
                        >
                          {t.bondExp}
                        </DataTable.Title>
                        <DataTable.Title
                          numeric
                          onPress={handleSortAmount}
                          textStyle={styles.tableHeaderText}
                          style={styles.amountColumn}
                        >
                          {t.bondQty} {sortDirection === "asc" ? "↑" : "↓"}
                        </DataTable.Title>
                      </DataTable.Header>

                      {sortedData.map((item, index) => (
                        <DataTable.Row
                          key={item.key}
                          style={[
                            styles.tableRow,
                            index % 2 === 0 && styles.tableRowEven,
                          ]}
                        >
                          <DataTable.Cell
                            style={[styles.tableCell, styles.sourceColumn]}
                          >
                            <View style={styles.sourceContainer}>
                              <View style={styles.sourceImageContainer}>
                                <Image
                                  source={item.img}
                                  style={styles.sourceImage}
                                />
                              </View>
                              <ThemedText
                                style={styles.sourceName}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                              >
                                {bondResourceNames[item.key]?.[locale] ?? item.name}
                              </ThemedText>
                            </View>
                          </DataTable.Cell>
                          <DataTable.Cell
                            numeric
                            textStyle={styles.tableCellText}
                            style={styles.expColumn}
                          >
                            {item.exp.toLocaleString()}
                          </DataTable.Cell>
                          <DataTable.Cell
                            numeric
                            textStyle={styles.tableCellTextAmount}
                            style={styles.amountColumn}
                          >
                            {Math.ceil(totalExp / item.exp).toLocaleString()}
                          </DataTable.Cell>
                        </DataTable.Row>
                      ))}
                    </DataTable>
                  </View>
                </Collapsible>
              </AppCard>
            </View>
          </View>
        )}
    </ScreenLayout>
  );
}

const makeStyles = (c: ThemeTokens) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.appBg,
  },
  backgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.appBg,
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
    fontSize: 24,
    fontWeight: "800", fontStyle: "italic", letterSpacing: 0.2,
    color: c.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: c.textMuted,
    marginTop: 4,
  },
  sectionAccent: {
    width: 44,
    height: 2.5,
    backgroundColor: c.primaryColor,
    borderRadius: 2,
    shadowColor: c.primaryColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },

  // Input Card Styles
  inputCardWrapper: {
    marginHorizontal: 4,
    marginBottom: 20,
  },
  inputCard: {
    backgroundColor: c.elevatedBg,
    borderRadius: RADIUS.card,
    ...elevation(c, 2),
  },
  inputCardContent: {
    padding: 24,
  },
  inputSectionTitle: {
    color: c.textPrimary,
    fontSize: 18,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    color: c.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  inputArrow: {
    paddingBottom: 8,
  },
  arrowText: {
    color: c.primaryColor,
    fontSize: 20,
    fontWeight: "bold",
  },
  textInput: {
    backgroundColor: c.surfaceBg,
  },
  textInputContent: {
    color: c.textPrimary,
    fontSize: 16,
  },
  textInputOutline: {
    borderColor: c.accentSoft,
    borderWidth: 1,
  },
  errorContainer: {
    marginBottom: 20,
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
  calculateButton: {
    borderRadius: RADIUS.control,
    elevation: 2,
    marginTop: 20,
  },
  calculateButtonContent: {
    paddingVertical: 4,
  },
  calculateButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Settings Section Styles
  settingsSection: {
    marginHorizontal: 4,
    marginBottom: 20,
  },
  settingsCard: {
    backgroundColor: c.surfaceBg,
    borderRadius: RADIUS.control,
    ...elevation(c, 1),
  },
  settingsContent: {
    paddingHorizontal: 0,
    paddingBottom: 4,
    paddingTop: 12,
  },
  settingsGrid: {
    gap: 16,
  },
  settingItem: {
    flex: 1,
  },

  // Results Section Styles
  resultsSection: {
    gap: 20,
    paddingBottom: 32,
  },
  resultCardWrapper: {
    marginHorizontal: 4,
  },
  resultCard: {
    backgroundColor: c.elevatedBg,
    borderRadius: RADIUS.card,
    ...elevation(c, 2),
  },
  resultCardContent: {
    padding: 24,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  resultBadge: {
    backgroundColor: c.primaryColor,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  resultBadgeText: {
    color: c.primaryText,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  resultTitle: {
    color: c.textSecondary,
    fontSize: 16,
    marginBottom: 8,
  },
  resultValue: {
    color: c.primaryColor,
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 24,
  },
  estimationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  estimationItem: {
    flex: 1,
    alignItems: "center",
  },
  estimationDivider: {
    width: 1,
    height: 40,
    backgroundColor: c.surfaceBorder,
  },
  estimationLabel: {
    color: c.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  estimationValue: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },

  // Resource Section Styles
  resourceSection: {
    marginHorizontal: 4,
  },
  resourceCard: {
    backgroundColor: c.surfaceBg,
    borderRadius: RADIUS.control,
    ...elevation(c, 1),
  },
  tableContainer: {
    paddingHorizontal: 4,
    paddingBottom: 16,
    paddingTop: 4,
  },
  dataTable: {
    backgroundColor: "transparent",
  },
  tableHeader: {
    backgroundColor: c.accentSoft,
    borderRadius: 8,
    marginBottom: 8,
    paddingLeft: 12,
    paddingRight: 4,
  },
  tableHeaderText: {
    color: c.primaryColor,
    fontWeight: "600",
    fontSize: 13,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: c.surfaceBorder,
    minHeight: 64,
    paddingHorizontal: 4,
  },
  tableRowEven: {
    backgroundColor: c.accentSoft,
  },
  tableCell: {
    paddingVertical: 12,
    justifyContent: "center",
  },
  tableCellText: {
    color: c.textSecondary,
    fontSize: 13,
  },
  tableCellTextAmount: {
    color: c.primaryColor,
    fontSize: 14,
    fontWeight: "600",
  },

  // Column widths for better text display
  sourceColumn: {
    flex: 2.2,
    paddingRight: 8,
  },
  expColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  amountColumn: {
    flex: 1.2,
    paddingLeft: 4,
  },

  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  sourceImageContainer: {
    backgroundColor: c.surfaceBg,
    borderRadius: 8,
    padding: 2,
  },
  sourceImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  sourceName: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    lineHeight: 16,
  },
});
