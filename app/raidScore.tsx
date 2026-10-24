import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Chip,
  HelperText,
  SegmentedButtons,
  TextInput,
} from "react-native-paper";

import { AppCard } from "@/components/AppCard";
import { ScreenLayout } from "@/components/ScreenLayout";
import { StackScreenHeader } from "@/components/StackScreenHeader";
import { ThemedText } from "@/components/ThemedText";
import { i18n } from "@/constants/i18n";
import { RADIUS } from "@/constants/layout";
import {
  RAID_DIFFICULTY_DATA,
  RAID_DURATIONS,
  clearTimeToRaidScore,
  formatClearTime,
  parseClearTime,
  raidScoreToClearTime,
  type RaidDuration,
} from "@/constants/raidData";
import type { ThemeTokens } from "@/constants/theme";
import { font, tabularNums } from "@/constants/typography";
import { useLanguage } from "@/contexts/language-context";
import { useColors } from "@/hooks/useColors";
import InlineAd from "@/services/ads/InlineAd";

// Route-level error boundary: a render throw here degrades to an in-app
// error screen for this route only, instead of taking down the whole app.
export { ErrorBoundary } from "expo-router";


const MAX_TEAMS = 4;
/** Torment is where score actually matters, so start there. */
const DEFAULT_DIFFICULTY_INDEX = 6;

type Mode = "timeToScore" | "scoreToTime";

const groupDigits = (value: number) =>
  Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function RaidScoreScreen() {
  const { locale } = useLanguage();
  const t = i18n[locale];
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [mode, setMode] = useState<Mode>("timeToScore");
  const [duration, setDuration] = useState<RaidDuration>(240);
  const [difficultyIndex, setDifficultyIndex] = useState(
    DEFAULT_DIFFICULTY_INDEX,
  );
  const [times, setTimes] = useState<string[]>([""]);
  const [scoreInput, setScoreInput] = useState("");

  const difficulty = RAID_DIFFICULTY_DATA[difficultyIndex];
  const durationOption = RAID_DURATIONS.find((d) => d.value === duration);

  const teamScores = times.map((raw) => {
    const seconds = parseClearTime(raw);
    if (seconds === null) return null;
    return clearTimeToRaidScore(seconds, duration, difficulty);
  });
  const total = teamScores.reduce<number>(
    (sum, score) => sum + (score ?? 0),
    0,
  );
  const anyTimeEntered = times.some((raw) => raw.trim() !== "");
  const anyTimeInvalid = times.some(
    (raw, i) => raw.trim() !== "" && teamScores[i] === null,
  );

  const parsedScore = Number(scoreInput.replace(/[\s,]/g, ""));
  const scoreValid = scoreInput.trim() !== "" && Number.isFinite(parsedScore);
  const derivedTime = scoreValid
    ? raidScoreToClearTime(parsedScore, duration, difficulty)
    : null;

  const setTimeAt = (index: number, value: string) =>
    setTimes((prev) => prev.map((item, i) => (i === index ? value : item)));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenLayout>
        <StackScreenHeader
          title={t.raidPageTitle}
          subtitle={t.raidSubtitle}
        />

        <AppCard level={2} style={styles.card}>
          <ThemedText style={styles.label}>{t.raidDurationLabel}</ThemedText>
          <SegmentedButtons
            value={String(duration)}
            onValueChange={(value) =>
              setDuration(Number(value) as RaidDuration)
            }
            buttons={RAID_DURATIONS.map((option) => ({
              value: String(option.value),
              label: option.label,
            }))}
          />
          {durationOption ? (
            <ThemedText style={styles.hint}>
              {t.raidBossHint.replace("{list}", durationOption.raids.join(", "))}
            </ThemedText>
          ) : null}

          <ThemedText style={[styles.label, styles.labelSpaced]}>
            {t.raidDifficultyLabel}
          </ThemedText>
          <View style={styles.chips}>
            {RAID_DIFFICULTY_DATA.map((item, index) => (
              <Chip
                key={item.difficulty}
                selected={index === difficultyIndex}
                onPress={() => setDifficultyIndex(index)}
                compact
                style={[
                  styles.chip,
                  index === difficultyIndex && styles.chipSelected,
                ]}
                textStyle={[
                  styles.chipText,
                  index === difficultyIndex && styles.chipTextSelected,
                ]}
              >
                {item.name}
              </Chip>
            ))}
          </View>
        </AppCard>

        <SegmentedButtons
          value={mode}
          onValueChange={(value) => setMode(value as Mode)}
          style={styles.modeSwitch}
          buttons={[
            { value: "timeToScore", label: t.raidModeTimeToScore },
            { value: "scoreToTime", label: t.raidModeScoreToTime },
          ]}
        />

        {mode === "timeToScore" ? (
          <AppCard level={1} style={styles.card}>
            {times.map((value, index) => (
              <View key={index} style={styles.teamRow}>
                <TextInput
                  mode="outlined"
                  label={
                    times.length > 1
                      ? t.raidTeam.replace("{n}", String(index + 1))
                      : t.raidClearTimeLabel
                  }
                  value={value}
                  onChangeText={(next) => setTimeAt(index, next)}
                  placeholder={t.raidClearTimeHint}
                  keyboardType="numbers-and-punctuation"
                  style={styles.input}
                />
                <ThemedText style={styles.teamScore}>
                  {teamScores[index] === null || teamScores[index] === undefined
                    ? "—"
                    : groupDigits(teamScores[index] as number)}
                </ThemedText>
              </View>
            ))}

            {anyTimeInvalid ? (
              <HelperText type="error" visible>
                {t.raidInvalidTime}
              </HelperText>
            ) : null}

            {times.length < MAX_TEAMS ? (
              <Chip
                icon="plus"
                compact
                onPress={() => setTimes((prev) => [...prev, ""])}
                style={styles.addChip}
                textStyle={styles.chipText}
              >
                {t.raidAddTeam}
              </Chip>
            ) : null}

            {anyTimeEntered ? (
              <View style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>
                  {t.raidTotalScore}
                </ThemedText>
                <ThemedText style={styles.totalValue}>
                  {groupDigits(total)}
                </ThemedText>
              </View>
            ) : null}
          </AppCard>
        ) : (
          <AppCard level={1} style={styles.card}>
            <TextInput
              mode="outlined"
              label={t.raidScoreLabel}
              value={scoreInput}
              onChangeText={setScoreInput}
              keyboardType="number-pad"
              style={styles.input}
            />
            {scoreInput.trim() !== "" && !scoreValid ? (
              <HelperText type="error" visible>
                {t.raidInvalidScore}
              </HelperText>
            ) : null}
            {derivedTime !== null ? (
              <View style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>
                  {t.raidClearTimeLabel}
                </ThemedText>
                <ThemedText style={styles.totalValue}>
                  {formatClearTime(derivedTime)}
                </ThemedText>
              </View>
            ) : null}
          </AppCard>
        )}

        <InlineAd />
      </ScreenLayout>
    </>
  );
}

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    card: { marginBottom: 16 },
    label: {
      fontSize: 12,
      color: c.textSecondary,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 8,
      ...font("semibold"),
    },
    labelSpaced: { marginTop: 20 },
    hint: { fontSize: 11, color: c.textMuted, marginTop: 8 },

    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { backgroundColor: c.surfaceBg },
    chipSelected: { backgroundColor: c.accentSoft },
    chipText: { fontSize: 12, color: c.textSecondary },
    chipTextSelected: { color: c.primaryColor },

    modeSwitch: { marginBottom: 16 },

    teamRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    input: { flex: 1, backgroundColor: c.elevatedBg },
    teamScore: {
      minWidth: 108,
      textAlign: "right",
      fontSize: 15,
      color: c.textPrimary,
      ...tabularNums,
      ...font("semibold"),
    },

    addChip: {
      alignSelf: "flex-start",
      marginTop: 4,
      backgroundColor: c.surfaceBg,
    },

    totalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.surfaceBorder,
      borderRadius: RADIUS.sm,
    },
    totalLabel: { fontSize: 13, color: c.textSecondary, ...font("medium") },
    totalValue: {
      fontSize: 22,
      color: c.primaryColor,
      ...tabularNums,
      ...font("extrabold"),
    },
  });
