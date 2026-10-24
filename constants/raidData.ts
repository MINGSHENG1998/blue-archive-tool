// Total Assault / Grand Assault score maths.
//
// A raid clear's score is:
//   timeScoreMultiplier x (3600 - clearTimeSeconds) + difficultyScore + hpScore
// where hpScore depends on the boss's time limit (3, 4 or 4.5 minutes). The
// 3600 baseline is the game's own constant and is not the boss timer.
//
// Table transcribed from joexyz's ba-tools (MIT), which the community
// cross-checks against in-game results.

export type RaidDuration = 180 | 240 | 270;

export type RaidDifficulty =
  | "Normal"
  | "Hard"
  | "VeryHard"
  | "Hardcore"
  | "Extreme"
  | "Insane"
  | "Torment"
  | "Lunatic";

export interface RaidDurationOption {
  /** i18n-free label; the minute count is universal. */
  label: string;
  value: RaidDuration;
  /** Bosses on this timer, for the hint line under the picker. */
  raids: string[];
}

export const RAID_DURATIONS: RaidDurationOption[] = [
  { label: "3:00", value: 180, raids: ["Binah", "Kaiten"] },
  {
    label: "4:00",
    value: 240,
    raids: [
      "Chesed",
      "Shirokuro",
      "Hieronymus",
      "Perorodzilla",
      "Hod",
      "Goz",
      "Gregorius",
      "Hovercraft",
      "Kurokage",
      "Geburah",
    ],
  },
  { label: "4:30", value: 270, raids: ["Yesod", "Drumbarka"] },
];

export interface RaidDifficultyData {
  difficulty: RaidDifficulty;
  name: string;
  difficultyScore: number;
  hpScore: Record<RaidDuration, number>;
  timeScoreMultiplier: number;
}

export const RAID_DIFFICULTY_DATA: RaidDifficultyData[] = [
  {
    difficulty: "Normal",
    name: "Normal",
    difficultyScore: 250000,
    hpScore: { 180: 229000, 240: 277000, 270: 304700 },
    timeScoreMultiplier: 120,
  },
  {
    difficulty: "Hard",
    name: "Hard",
    difficultyScore: 500000,
    hpScore: { 180: 458000, 240: 554000, 270: 609400 },
    timeScoreMultiplier: 240,
  },
  {
    difficulty: "VeryHard",
    name: "Very Hard",
    difficultyScore: 1000000,
    hpScore: { 180: 916000, 240: 1108000, 270: 1218800 },
    timeScoreMultiplier: 480,
  },
  {
    difficulty: "Hardcore",
    name: "Hardcore",
    difficultyScore: 2000000,
    hpScore: { 180: 1832000, 240: 2216000, 270: 2437600 },
    timeScoreMultiplier: 960,
  },
  {
    difficulty: "Extreme",
    name: "Extreme",
    difficultyScore: 4000000,
    hpScore: { 180: 5392000, 240: 6160000, 270: 6578880 },
    timeScoreMultiplier: 1440,
  },
  {
    difficulty: "Insane",
    name: "Insane",
    difficultyScore: 6800000,
    hpScore: { 180: 12449600, 240: 14216000, 270: 14941016 },
    timeScoreMultiplier: 1920,
  },
  {
    difficulty: "Torment",
    name: "Torment",
    difficultyScore: 12200000,
    hpScore: { 180: 18876000, 240: 19508000, 270: 20302000 },
    timeScoreMultiplier: 2400,
  },
  {
    difficulty: "Lunatic",
    name: "Lunatic",
    difficultyScore: 17710000,
    hpScore: { 180: 25525000, 240: 26315000, 270: 26954000 },
    timeScoreMultiplier: 2880,
  },
];

const SCORE_BASELINE_SECONDS = 3600;

function baseScore(
  difficulty: RaidDifficultyData,
  duration: RaidDuration,
): number {
  return difficulty.difficultyScore + difficulty.hpScore[duration];
}

/** Score for a clear, or null if the time is outside what the formula covers. */
export function clearTimeToRaidScore(
  clearTimeSeconds: number,
  duration: RaidDuration,
  difficulty: RaidDifficultyData,
): number | null {
  if (!Number.isFinite(clearTimeSeconds) || clearTimeSeconds < 0) return null;
  const delta = SCORE_BASELINE_SECONDS - clearTimeSeconds;
  if (delta < 0) return null;
  return (
    difficulty.timeScoreMultiplier * delta + baseScore(difficulty, duration)
  );
}

/** The clear time a score implies. Clamped to the baseline for tiny scores. */
export function raidScoreToClearTime(
  raidScore: number,
  duration: RaidDuration,
  difficulty: RaidDifficultyData,
): number {
  const timeScore = raidScore - baseScore(difficulty, duration);
  return Math.min(
    SCORE_BASELINE_SECONDS,
    SCORE_BASELINE_SECONDS - timeScore / difficulty.timeScoreMultiplier,
  );
}

/**
 * Accepts what a player would actually type off a results screen: "1:23.456",
 * "83.456", "1:23", or "83". Returns seconds, or null if it is not a time.
 */
export function parseClearTime(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":");
  if (parts.length > 2) return null;

  if (parts.length === 1) {
    const seconds = Number(parts[0]);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
  }

  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
  if (minutes < 0 || seconds < 0 || seconds >= 60) return null;
  return minutes * 60 + seconds;
}

/** "M:SS.mmm", matching how the game shows a clear time. */
export function formatClearTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00.000";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
  // Rounding 59.9996 up to a full second must carry, not print ":59.1000".
  if (millis === 1000) return formatClearTime(Math.floor(totalSeconds) + 1);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}
