import React, { useState, useMemo } from "react";
import { Image, StyleSheet, View, Keyboard } from "react-native";
import {
  Card,
  TextInput,
  Button,
  HelperText,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";

import { Collapsible } from "@/components/Collapsible";
import { RangeSelector } from "@/components/RangeSelector";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLanguage } from "@/contexts/language-context";
import { i18n } from "@/constants/i18n";
import {
  calculateSkillCost,
  applyInventory,
  SkillCostInput,
  SkillCostResult,
} from "@/constants/skillData";
import { useColors } from "@/hooks/useColors";
import type { ThemeTokens } from "@/constants/theme";
import { elevation } from "@/constants/elevation";
import { RADIUS } from "@/constants/layout";

const BD_ICONS = [
  require("../../assets/images/icons/bd_t1.webp"),
  require("../../assets/images/icons/bd_t2.webp"),
  require("../../assets/images/icons/bd_t3.webp"),
  require("../../assets/images/icons/bd_t4.webp"),
];
const TN_ICONS = [
  require("../../assets/images/icons/tn_t1.webp"),
  require("../../assets/images/icons/tn_t2.webp"),
  require("../../assets/images/icons/tn_t3.webp"),
  require("../../assets/images/icons/tn_t4.webp"),
];
const SECRET_ICON = require("../../assets/images/icons/secret_note.webp");
const CREDIT_ICON = require("../../assets/images/icons/credit.png");

const levelOptions = (max: number) =>
  Array.from({ length: max }, (_, i) => ({
    label: String(i + 1),
    value: String(i + 1),
  }));

const EX_OPTIONS = levelOptions(5);
const NORMAL_OPTIONS = levelOptions(10);

const INITIAL_LEVELS = {
  ex: { current: "1", target: "5" },
  skill1: { current: "1", target: "10" },
  skill2: { current: "1", target: "10" },
  skill3: { current: "1", target: "10" },
};

const INITIAL_INVENTORY = {
  bd1: "0", bd2: "0", bd3: "0", bd4: "0",
  tn1: "0", tn2: "0", tn3: "0", tn4: "0",
  secretNotes: "0",
  credits: "0",
};

type LevelKey = keyof typeof INITIAL_LEVELS;
type InventoryKey = keyof typeof INITIAL_INVENTORY;

// Level pair row: current + target dropdowns for one skill
// Inventory input with icon (pattern: charaExp ResourceInput)
const InventoryInput = ({ icon, label, value, onChangeText, fieldName }: any) => {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <ThemedView style={styles.inventoryInputContainer}>
      <View style={styles.inventoryIconContainer}>
        <Image source={icon} style={styles.inventoryInputIcon} />
      </View>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={(val: string) => onChangeText(fieldName, val)}
        keyboardType="numeric"
        style={styles.inventoryInput}
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

// Result row, hidden when amount is zero
const ResultRow = ({ icon, label, value }: any) => {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  if (value <= 0) return null;
  return (
    <View style={styles.resultRow}>
      <View style={styles.resultIconContainer}>
        <Image source={icon} style={styles.resultRowIcon} />
      </View>
      <View style={styles.resultRowDetails}>
        <ThemedText style={styles.resultRowName}>{label}</ThemedText>
        <ThemedText style={styles.resultRowValue}>
          {value.toLocaleString()}
        </ThemedText>
      </View>
    </View>
  );
};

export default function SkillCalc() {
  const cardBackground = useThemeColor({}, "background");
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { locale } = useLanguage();
  const t = i18n[locale];

  const [levels, setLevels] = useState(INITIAL_LEVELS);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    totals: SkillCostResult;
    needed: SkillCostResult;
  } | null>(null);

  const handleLevelChange = (key: LevelKey, value: { current: string; target: string }) => {
    setLevels((prev) => ({ ...prev, [key]: value }));
  };

  const handleInventoryChange = (field: InventoryKey, value: string) => {
    const cleanValue = value.replace(/^0+/, "").replace(/[^0-9]/g, "");
    setInventory((prev) => ({ ...prev, [field]: cleanValue }));
  };

  const handleCalculate = () => {
    const parse = (range: { current: string; target: string }) => ({
      current: parseInt(range.current, 10),
      target: parseInt(range.target, 10),
    });
    const ex = parse(levels.ex);
    const skills: SkillCostInput["skills"] = [
      parse(levels.skill1),
      parse(levels.skill2),
      parse(levels.skill3),
    ];

    const invalid = [ex, ...skills].some((r) => r.target < r.current);
    if (invalid) {
      setError(t.skillValidationError);
      setResult(null);
      return;
    }

    setError("");
    const totals = calculateSkillCost({ ex, skills });
    const num = (v: string) => parseInt(v, 10) || 0;
    const owned: SkillCostResult = {
      bd: [num(inventory.bd1), num(inventory.bd2), num(inventory.bd3), num(inventory.bd4)],
      tn: [num(inventory.tn1), num(inventory.tn2), num(inventory.tn3), num(inventory.tn4)],
      secretNotes: num(inventory.secretNotes),
      credits: num(inventory.credits),
    };
    setResult({ totals, needed: applyInventory(totals, owned) });
    Keyboard.dismiss();
  };

  useFocusEffect(
    React.useCallback(() => {
      setLevels(INITIAL_LEVELS);
      setInventory(INITIAL_INVENTORY);
      setError("");
      setResult(null);
      return () => {};
    }, [])
  );

  const skillRows: { key: LevelKey; label: string; options: any[] }[] = [
    { key: "ex", label: t.skillExLabel, options: EX_OPTIONS },
    { key: "skill1", label: t.skillSkill1, options: NORMAL_OPTIONS },
    { key: "skill2", label: t.skillSkill2, options: NORMAL_OPTIONS },
    { key: "skill3", label: t.skillSkill3, options: NORMAL_OPTIONS },
  ];

  const inventoryFields: { field: InventoryKey; icon: any; label: string }[] = [
    { field: "bd1", icon: BD_ICONS[0], label: t.skillBd1 },
    { field: "bd2", icon: BD_ICONS[1], label: t.skillBd2 },
    { field: "bd3", icon: BD_ICONS[2], label: t.skillBd3 },
    { field: "bd4", icon: BD_ICONS[3], label: t.skillBd4 },
    { field: "tn1", icon: TN_ICONS[0], label: t.skillTn1 },
    { field: "tn2", icon: TN_ICONS[1], label: t.skillTn2 },
    { field: "tn3", icon: TN_ICONS[2], label: t.skillTn3 },
    { field: "tn4", icon: TN_ICONS[3], label: t.skillTn4 },
    { field: "secretNotes", icon: SECRET_ICON, label: t.skillSecretNotes },
    { field: "credits", icon: CREDIT_ICON, label: t.charaExpCredits },
  ];

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

      {/* Level Inputs */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionLabel}>{t.skillLevelConfig}</ThemedText>
        {skillRows.map((row) => {
          const v = levels[row.key];
          const max = row.options.length;
          return (
            <View key={row.key} style={styles.skillRangeRow}>
              <RangeSelector
                label={row.label}
                min={1}
                max={max}
                low={parseInt(v.current, 10) || 1}
                high={parseInt(v.target, 10) || max}
                lowLabel={t.bondCurrentLevel}
                highLabel={t.bondTargetLevel}
                onChange={(lo, hi) =>
                  handleLevelChange(row.key, {
                    current: String(lo),
                    target: String(hi),
                  })
                }
              />
            </View>
          );
        })}
      </View>

      {/* Inventory Section */}
      <ThemedView style={styles.inventorySection}>
        <Collapsible
          title={t.calcCurrentInventory}
          iconSize={12}
          fontType="smallSemiBold"
        >
          <Card style={[styles.inventoryCard, { backgroundColor: cardBackground }]}>
            <Card.Content style={styles.inventoryContent}>
              <View style={styles.inventoryHeader}>
                <ThemedText style={styles.inventoryTitle}>
                  {t.calcAvailableResources}
                </ThemedText>
                <View style={styles.inventoryAccent} />
              </View>
              <View style={styles.inventoryInputsContainer}>
                {inventoryFields.map((f) => (
                  <InventoryInput
                    key={f.field}
                    icon={f.icon}
                    label={f.label}
                    value={inventory[f.field]}
                    onChangeText={handleInventoryChange}
                    fieldName={f.field}
                  />
                ))}
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
        buttonColor={c.primaryColor}
        textColor={c.primaryText}
        labelStyle={styles.calculateButtonText}
      >
        {t.resourceCalculate}
      </Button>

      {/* Results */}
      {result && (
        <View style={styles.resultSection}>
          <Card style={[styles.resultCard, { backgroundColor: cardBackground }]}>
            <Card.Content style={styles.resultContent}>
              <View style={styles.resultHeader}>
                <ThemedText type="defaultSemiBold" style={styles.resultTitle}>
                  {t.bondRequiredResources}
                </ThemedText>
                <View style={styles.resultAccent} />
              </View>

              {/* Hero shows the full credit cost before inventory; the
                  breakdown rows below show what is still needed after it. */}
              <View style={styles.totalCredits}>
                <ThemedText style={styles.totalCreditsLabel}>
                  {t.skillTotalCredits}
                </ThemedText>
                <ThemedText style={styles.totalCreditsValue}>
                  {result.totals.credits.toLocaleString()}
                </ThemedText>
              </View>

              <ThemedText type="defaultSemiBold" style={styles.breakdownTitle}>
                {t.elephResourceBreakdown}
              </ThemedText>
              <View style={styles.resultList}>
                <ResultRow icon={BD_ICONS[0]} label={t.skillBd1} value={result.needed.bd[0]} />
                <ResultRow icon={BD_ICONS[1]} label={t.skillBd2} value={result.needed.bd[1]} />
                <ResultRow icon={BD_ICONS[2]} label={t.skillBd3} value={result.needed.bd[2]} />
                <ResultRow icon={BD_ICONS[3]} label={t.skillBd4} value={result.needed.bd[3]} />
                <ResultRow icon={TN_ICONS[0]} label={t.skillTn1} value={result.needed.tn[0]} />
                <ResultRow icon={TN_ICONS[1]} label={t.skillTn2} value={result.needed.tn[1]} />
                <ResultRow icon={TN_ICONS[2]} label={t.skillTn3} value={result.needed.tn[2]} />
                <ResultRow icon={TN_ICONS[3]} label={t.skillTn4} value={result.needed.tn[3]} />
                <ResultRow icon={SECRET_ICON} label={t.skillSecretNotes} value={result.needed.secretNotes} />
                <ResultRow icon={CREDIT_ICON} label={t.charaExpCredits} value={result.needed.credits} />
              </View>

              <ThemedText style={styles.artifactNote}>
                {t.skillArtifactNote}
              </ThemedText>
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

  // Error styles - matching sibling calcs
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

  // Level input section
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: c.textPrimary,
  },
  skillRangeRow: {
    marginBottom: 20,
  },
  skillRow: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  skillRowLabel: {
    color: c.textPrimary,
    fontSize: 14,
    marginBottom: 8,
  },
  dropdownPair: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "transparent",
  },
  dropdownField: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // Inventory styles - matching charaExp
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
  inventoryInputsContainer: {
    gap: 12,
  },
  inventoryInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  inventoryIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: c.surfaceBg,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  inventoryInputIcon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  inventoryInput: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // Calculate button - matching charaExp
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

  // Result styles - matching sibling calcs
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
  totalCredits: {
    backgroundColor: c.accentSoft,
    borderRadius: RADIUS.control,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  totalCreditsLabel: {
    fontSize: 14,
    color: c.textSecondary,
    marginBottom: 4,
  },
  totalCreditsValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: c.primaryColor,
  },
  breakdownTitle: {
    color: c.textPrimary,
    fontSize: 16,
    marginBottom: 12,
  },
  resultList: {
    backgroundColor: c.surfaceBg,
    borderRadius: RADIUS.control,
    padding: 16,
    gap: 16,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: c.elevatedBg,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  resultRowIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  resultRowDetails: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultRowName: {
    color: c.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  resultRowValue: {
    color: c.primaryColor,
    fontSize: 14,
    fontWeight: "600",
  },
  artifactNote: {
    color: c.textSecondary,
    fontSize: 12,
    marginTop: 16,
    fontStyle: "italic",
  },
});
