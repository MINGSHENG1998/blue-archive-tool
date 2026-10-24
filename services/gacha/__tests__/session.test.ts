import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  LUCK_MIN_PULLS,
  PICKUP_RATE,
  THREE_STAR_RATE,
  addMisses,
  addPull,
  emptySession,
  formatRate,
  stats,
  undo,
  type GachaSession,
  type PullKind,
} from "../session";
import { loadSession, saveSession } from "../storage";

const build = (...kinds: PullKind[]): GachaSession => ({ history: kinds });

describe("session mutations", () => {
  it("starts empty", () => {
    expect(stats(emptySession()).pulls).toBe(0);
  });

  it("appends pulls without mutating the previous session", () => {
    const before = emptySession();
    const after = addPull(before, "threeStar");
    expect(before.history).toHaveLength(0);
    expect(after.history).toEqual(["threeStar"]);
  });

  it("adds misses in bulk and ignores non-positive counts", () => {
    expect(addMisses(emptySession(), 10).history).toHaveLength(10);
    expect(addMisses(emptySession(), 0).history).toHaveLength(0);
    expect(addMisses(emptySession(), -3).history).toHaveLength(0);
  });

  it("undoes the last pull and is a no-op when empty", () => {
    expect(undo(build("miss", "pickup")).history).toEqual(["miss"]);
    expect(undo(emptySession()).history).toEqual([]);
  });
});

describe("stats", () => {
  it("counts a pickup as a 3-star, not as a separate category", () => {
    const result = stats(build("pickup", "threeStar", "miss"));
    expect(result.pulls).toBe(3);
    expect(result.threeStars).toBe(2);
    expect(result.pickups).toBe(1);
  });

  it("reports observed rates against the published ones", () => {
    const result = stats(build("threeStar", "miss", "miss", "miss"));
    expect(result.threeStarRate).toBeCloseTo(0.25, 6);
    expect(result.expectedThreeStars).toBeCloseTo(4 * THREE_STAR_RATE, 6);
    expect(result.expectedPickups).toBeCloseTo(4 * PICKUP_RATE, 6);
  });

  it("does not divide by zero on an empty session", () => {
    const result = stats(emptySession());
    expect(result.threeStarRate).toBe(0);
    expect(result.pickupRate).toBe(0);
    expect(result.luck).toBe("even");
  });

  it("counts misses since the last 3-star", () => {
    expect(stats(build("threeStar", "miss", "miss")).sinceLastThreeStar).toBe(2);
    expect(stats(build("miss", "threeStar")).sinceLastThreeStar).toBe(0);
    expect(stats(build("miss", "miss")).sinceLastThreeStar).toBe(2);
    expect(stats(build("miss", "pickup")).sinceLastThreeStar).toBe(0);
  });

  it("withholds a luck verdict until the sample is big enough", () => {
    const tiny = stats(build("threeStar"));
    expect(tiny.threeStarRate).toBe(1);
    expect(tiny.luck).toBe("even");

    const lucky = stats({
      history: [
        "threeStar",
        ...Array<PullKind>(LUCK_MIN_PULLS - 1).fill("miss"),
      ],
    });
    expect(lucky.luck).toBe("lucky");

    const unlucky = stats({
      history: Array<PullKind>(LUCK_MIN_PULLS).fill("miss"),
    });
    expect(unlucky.luck).toBe("unlucky");
  });
});

describe("formatRate", () => {
  it("renders a percentage with two decimals", () => {
    expect(formatRate(0.03)).toBe("3.00%");
    expect(formatRate(0.0342)).toBe("3.42%");
    expect(formatRate(0)).toBe("0.00%");
  });
});

describe("storage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("round-trips a session", async () => {
    const session = build("miss", "pickup", "threeStar");
    await saveSession(session);
    expect(await loadSession()).toEqual(session);
  });

  it("returns an empty session when nothing is stored", async () => {
    expect(await loadSession()).toEqual(emptySession());
  });

  it("survives corrupt storage", async () => {
    await AsyncStorage.setItem("gacha:v1:session", "{not json");
    expect(await loadSession()).toEqual(emptySession());
  });

  it("drops unrecognised entries instead of feeding them to the reducer", async () => {
    await AsyncStorage.setItem(
      "gacha:v1:session",
      JSON.stringify({ history: ["miss", "banana", 7, "pickup"] }),
    );
    expect((await loadSession()).history).toEqual(["miss", "pickup"]);
  });

  it("treats a non-array history as empty", async () => {
    await AsyncStorage.setItem(
      "gacha:v1:session",
      JSON.stringify({ history: "nope" }),
    );
    expect(await loadSession()).toEqual(emptySession());
  });
});
