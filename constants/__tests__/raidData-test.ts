import {
  RAID_DIFFICULTY_DATA,
  RAID_DURATIONS,
  clearTimeToRaidScore,
  formatClearTime,
  parseClearTime,
  raidScoreToClearTime,
  type RaidDuration,
} from "../raidData";

const byName = (name: string) => {
  const found = RAID_DIFFICULTY_DATA.find((d) => d.difficulty === name);
  if (!found) throw new Error(`no difficulty ${name}`);
  return found;
};

describe("raid table", () => {
  it("covers all eight difficulties, ascending in value", () => {
    expect(RAID_DIFFICULTY_DATA).toHaveLength(8);
    for (let i = 1; i < RAID_DIFFICULTY_DATA.length; i++) {
      expect(RAID_DIFFICULTY_DATA[i].difficultyScore).toBeGreaterThan(
        RAID_DIFFICULTY_DATA[i - 1].difficultyScore,
      );
      expect(RAID_DIFFICULTY_DATA[i].timeScoreMultiplier).toBeGreaterThan(
        RAID_DIFFICULTY_DATA[i - 1].timeScoreMultiplier,
      );
    }
  });

  it("has an hpScore for every duration the picker offers", () => {
    const durations = RAID_DURATIONS.map((d) => d.value);
    expect(durations).toEqual([180, 240, 270]);
    for (const difficulty of RAID_DIFFICULTY_DATA) {
      for (const duration of durations) {
        expect(typeof difficulty.hpScore[duration]).toBe("number");
      }
    }
  });

  it("lists a boss on exactly one duration", () => {
    const seen = new Set<string>();
    for (const option of RAID_DURATIONS) {
      for (const raid of option.raids) {
        expect(seen.has(raid)).toBe(false);
        seen.add(raid);
      }
    }
  });
});

describe("clearTimeToRaidScore", () => {
  it("matches a hand-computed Torment 4-minute clear", () => {
    // 2400 x (3600 - 90) + 12,200,000 + 19,508,000 = 40,132,000
    expect(clearTimeToRaidScore(90, 240, byName("Torment"))).toBe(40_132_000);
  });

  it("is worth more the faster the clear", () => {
    const torment = byName("Torment");
    expect(clearTimeToRaidScore(60, 240, torment)!).toBeGreaterThan(
      clearTimeToRaidScore(120, 240, torment)!,
    );
  });

  it("rejects a clear beyond the formula's baseline, and bad input", () => {
    const torment = byName("Torment");
    expect(clearTimeToRaidScore(3601, 240, torment)).toBeNull();
    expect(clearTimeToRaidScore(-1, 240, torment)).toBeNull();
    expect(clearTimeToRaidScore(Number.NaN, 240, torment)).toBeNull();
  });
});

describe("raidScoreToClearTime", () => {
  it("round-trips against clearTimeToRaidScore", () => {
    const durations: RaidDuration[] = [180, 240, 270];
    for (const difficulty of RAID_DIFFICULTY_DATA) {
      for (const duration of durations) {
        for (const seconds of [12.345, 60, 137.5, 269]) {
          const score = clearTimeToRaidScore(seconds, duration, difficulty)!;
          expect(raidScoreToClearTime(score, duration, difficulty)).toBeCloseTo(
            seconds,
            6,
          );
        }
      }
    }
  });

  it("clamps a score below the floor instead of returning an absurd time", () => {
    expect(raidScoreToClearTime(0, 240, byName("Torment"))).toBe(3600);
  });
});

describe("parseClearTime", () => {
  it("accepts the shapes a player would type", () => {
    expect(parseClearTime("1:23.456")).toBeCloseTo(83.456, 6);
    expect(parseClearTime("1:23")).toBe(83);
    expect(parseClearTime("83.456")).toBeCloseTo(83.456, 6);
    expect(parseClearTime("83")).toBe(83);
    expect(parseClearTime("  1:05  ")).toBe(65);
  });

  it("rejects nonsense", () => {
    expect(parseClearTime("")).toBeNull();
    expect(parseClearTime("abc")).toBeNull();
    expect(parseClearTime("1:2:3")).toBeNull();
    expect(parseClearTime("1:75")).toBeNull();
    expect(parseClearTime("-5")).toBeNull();
  });
});

describe("formatClearTime", () => {
  it("pads to M:SS.mmm", () => {
    expect(formatClearTime(83.456)).toBe("1:23.456");
    expect(formatClearTime(65)).toBe("1:05.000");
    expect(formatClearTime(5.5)).toBe("0:05.500");
  });

  it("carries instead of printing a 1000ms fraction", () => {
    expect(formatClearTime(59.9999)).toBe("1:00.000");
  });

  it("never renders a negative time", () => {
    expect(formatClearTime(-1)).toBe("0:00.000");
  });
});
