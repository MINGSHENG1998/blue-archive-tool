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
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useFocusEffect } from "@react-navigation/native";
import NumberInput from "@/components/NumberInput";

//components
import {
  Card,
  DataTable,
  TextInput,
  Button,
  HelperText,
  Surface,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { useRef, useState } from "react";

//constant
import { bondExpData, bondResourceTable } from "../../constants/bondData";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLanguage } from "@/contexts/language-context";
import { i18n } from "@/constants/i18n";

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
  const scrollRef = useRef<{ resetScroll: () => void }>(null);
  const { locale } = useLanguage();
  const t = i18n[locale];
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
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, "background");
  const cardBackground = useThemeColor({}, "background");

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
        <ThemedView style={styles.titleContainer}>
          <View>
            <ThemedText type="title" style={styles.mainTitle}>
              {t.bondPageTitle}
            </ThemedText>
             <View style={styles.sectionAccent} />
          </View>
        </ThemedView>       

        {/* Input Section */}
        <AnimatedCard style={styles.inputCardWrapper}>
          <Card style={[styles.inputCard, { backgroundColor: cardBackground }]}>
            <Card.Content style={styles.inputCardContent}>
              <ThemedText
                type="defaultSemiBold"
                style={styles.inputSectionTitle}
              >
                Bond Level Range
              </ThemedText>
              <ThemedView style={styles.inputRow}>
                <View style={styles.inputWrapper}>
                  <ThemedText style={styles.inputLabel}>
                    {t.bondCurrentLevel}
                  </ThemedText>
                  <TextInput
                    mode="outlined"
                    placeholder="1 - 99"
                    value={from}
                    onChangeText={(text) => {
                      const numericValue = parseInt(text, 10);
                      if (
                        !isNaN(numericValue) &&
                        numericValue >= 1 &&
                        numericValue <= 99
                      ) {
                        setFrom(text);
                      } else if (text === "") {
                        setFrom("");
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    style={styles.textInput}
                    contentStyle={styles.textInputContent}
                    outlineStyle={styles.textInputOutline}
                    right={
                      from !== "" && (
                        <TextInput.Icon
                          icon="close"
                          size={16}
                          onPress={() => setFrom("")}
                          color="#94A3B8"
                        />
                      )
                    }
                  />
                </View>
                <View style={styles.inputArrow}>
                  <ThemedText style={styles.arrowText}>→</ThemedText>
                </View>
                <View style={styles.inputWrapper}>
                  <ThemedText style={styles.inputLabel}>
                    {t.bondTargetLevel}
                  </ThemedText>
                  <TextInput
                    mode="outlined"
                    placeholder="2 - 100"
                    value={to}
                    onChangeText={(text) => {
                      const numericValue = parseInt(text, 10);
                      if (
                        !isNaN(numericValue) &&
                        numericValue >= 1 &&
                        numericValue <= 100
                      ) {
                        setTo(text);
                      } else if (text === "") {
                        setTo("");
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                    style={styles.textInput}
                    contentStyle={styles.textInputContent}
                    outlineStyle={styles.textInputOutline}
                    right={
                      to !== "" && (
                        <TextInput.Icon
                          icon="close"
                          size={16}
                          onPress={() => setTo("")}
                          color="#94A3B8"
                        />
                      )
                    }
                  />
                </View>
              </ThemedView>

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
                buttonColor="#00F5FF"
                textColor="#0F172A"
              >
                {t.bondCalculate}
              </Button>
            </Card.Content>
          </Card>
        </AnimatedCard>

        {/* Advanced Settings */}
        <View style={styles.settingsSection}>
          <Card
            style={[styles.settingsCard, { backgroundColor: cardBackground }]}
          >
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
          </Card>
        </View>

        {/* Results Section */}
        {totalExp && (
          <View style={styles.resultsSection}>
            {/* Main Result Card */}
            <AnimatedCard style={styles.resultCardWrapper}>
              <Card
                style={[styles.resultCard, { backgroundColor: cardBackground }]}
              >
                <Card.Content style={styles.resultCardContent}>
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
                        Days (~)
                      </ThemedText>
                      <ThemedText style={styles.estimationValue}>
                        {getEstimatedDays()} days
                      </ThemedText>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </AnimatedCard>

            {/* Resources Table */}
            <View style={styles.resourceSection}>
              <Card
                style={[
                  styles.resourceCard,
                  { backgroundColor: cardBackground },
                ]}
              >
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
                          Exp
                        </DataTable.Title>
                        <DataTable.Title
                          numeric
                          onPress={handleSortAmount}
                          textStyle={styles.tableHeaderText}
                          style={styles.amountColumn}
                        >
                          Qty {sortDirection === "asc" ? "↑" : "↓"}
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
                                {item.name}
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
              </Card>
            </View>
          </View>
        )}
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

  // Input Card Styles
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
    color: "#94A3B8",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  inputArrow: {
    paddingBottom: 8,
  },
  arrowText: {
    color: "#00F5FF",
    fontSize: 20,
    fontWeight: "bold",
  },
  textInput: {
    backgroundColor: "rgba(15, 23, 42, 0.9)",
  },
  textInputContent: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  textInputOutline: {
    borderColor: "rgba(71, 85, 105, 0.4)",
    borderWidth: 1,
  },
  errorContainer: {
    marginBottom: 20,
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
  calculateButton: {
    borderRadius: 12,
    elevation: 2,
  },
  calculateButtonContent: {
    paddingVertical: 10,
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
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 12,
    elevation: 1,
  },
  settingsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 4,
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
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#00F5FF",
    elevation: 4,
    shadowColor: "#00F5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
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
    backgroundColor: "#00F5FF",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  resultBadgeText: {
    color: "#0F172A",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  resultTitle: {
    color: "#94A3B8",
    fontSize: 16,
    marginBottom: 8,
  },
  resultValue: {
    color: "#00F5FF",
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
    backgroundColor: "rgba(71, 85, 105, 0.4)",
  },
  estimationLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 6,
  },
  estimationValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Resource Section Styles
  resourceSection: {
    marginHorizontal: 4,
  },
  resourceCard: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 12,
    elevation: 1,
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
    backgroundColor: "rgba(0, 245, 255, 0.1)",
    borderRadius: 8,
    marginBottom: 8,
    paddingLeft: 12,
    paddingRight: 4,
  },
  tableHeaderText: {
    color: "#00F5FF",
    fontWeight: "600",
    fontSize: 13,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(71, 85, 105, 0.15)",
    minHeight: 64,
    paddingHorizontal: 4,
  },
  tableRowEven: {
    backgroundColor: "rgba(71, 85, 105, 0.05)",
  },
  tableCell: {
    paddingVertical: 12,
    justifyContent: "center",
  },
  tableCellText: {
    color: "#94A3B8",
    fontSize: 13,
  },
  tableCellTextAmount: {
    color: "#00F5FF",
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
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 8,
    padding: 2,
  },
  sourceImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  sourceName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    lineHeight: 16,
  },
});
