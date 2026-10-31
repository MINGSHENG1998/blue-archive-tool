import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { LanguageProvider } from "../language-context";
import {
  GameDataProvider,
  effectiveBulletTypes,
  liveEvents,
  liveRaids,
  useGameData,
} from "../gamedata-context";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// The provider wraps the entire app, so its failure modes matter more than its
// happy path: whatever upstream or storage does, every screen must still get a
// usable roster. Network calls are stubbed to reject unless a test says
// otherwise — a test run must never touch schaledb.com.
jest.mock("../../services/gamedata/schaledb", () => ({
  ...jest.requireActual("../../services/gamedata/schaledb"),
  fetchConfig: jest.fn().mockRejectedValue(new Error("offline")),
  fetchStudents: jest.fn().mockRejectedValue(new Error("offline")),
  fetchNameMap: jest.fn().mockRejectedValue(new Error("offline")),
  fetchLocalization: jest.fn().mockRejectedValue(new Error("offline")),
  fetchRaids: jest.fn().mockRejectedValue(new Error("offline")),
  fetchRaidNames: jest.fn().mockRejectedValue(new Error("offline")),
}));

let captured: ReturnType<typeof useGameData>;
function Capture() {
  captured = useGameData();
  return null;
}

async function renderProvider({ withLanguage = false } = {}) {
  const tree = (
    <GameDataProvider>
      <Capture />
    </GameDataProvider>
  );
  await act(async () => {
    TestRenderer.create(withLanguage ? <LanguageProvider>{tree}</LanguageProvider> : tree);
  });
  // flush the cache read and the background refresh
  await act(async () => {});
  await act(async () => {});
}

describe("GameDataProvider", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("serves the bundled roster on a cold, offline first launch", async () => {
    await renderProvider();
    expect(captured.students.length).toBeGreaterThan(200);
    expect(captured.source).toBe("bundled");
    expect(captured.ready).toBe(true);
  });

  it("indexes students by id", async () => {
    await renderProvider();
    const first = captured.students[0];
    expect(captured.byId[first.Id]).toBe(first);
  });

  it("still renders when storage itself throws", async () => {
    // The storage mock is itself a jest.fn, so mockRestore would strip its
    // implementation for every later test; put the original back instead.
    const getItem = jest.spyOn(AsyncStorage, "getItem");
    const original = getItem.getMockImplementation();
    getItem.mockRejectedValue(new Error("storage unavailable"));
    await renderProvider();
    expect(captured.students.length).toBeGreaterThan(200);
    expect(captured.ready).toBe(true);
    getItem.mockImplementation(original);
  });

  it("falls back to the English name, then the raw key, for labels", async () => {
    await renderProvider();
    // Present in the bundled snapshot.
    expect(captured.label("School", "Gehenna")).toBe("Gehenna");
    // A key SchaleDB has not shipped yet must render as itself, not "undefined".
    expect(captured.label("School", "NotAThing")).toBe("NotAThing");
  });

  it("gives every student a display name", async () => {
    await renderProvider();
    for (const student of captured.students) {
      expect(captured.displayName(student).length).toBeGreaterThan(0);
    }
  });

  it("survives a failed manual refresh", async () => {
    await renderProvider();
    const before = captured.students.length;
    await act(async () => {
      await captured.refresh();
    });
    expect(captured.students).toHaveLength(before);
  });

  it("exposes the bundled raid table, with no overlay for English", async () => {
    await renderProvider();
    expect(Object.keys(captured.raids.raid).length).toBeGreaterThan(0);
    expect(captured.raidNames).toBeUndefined();
  });

  it("names events in English, reruns after their original", async () => {
    await renderProvider();
    expect(captured.eventName(859)).toBe("The Calm After the Storm");
    expect(captured.eventName(10859)).toBe("The Calm After the Storm");
    expect(captured.eventName(1)).toBeNull();
  });

  it("words the availability category, Regular included", async () => {
    await renderProvider();
    const base = captured.students[0];
    const as = (category: number) => ({ ...base, IsLimited: [0, category, 0] });
    expect(captured.isLimitedLabel(as(0))).toBe("Regular");
    expect(captured.isLimitedLabel(as(1))).toBe("Unique");
    expect(captured.isLimitedLabel(as(3))).toBe("Fest");
    expect(captured.isLimitedLabel(as(9))).toBeNull();
    expect(captured.isLimitedTooltip(as(1))).toMatch(/Unique Recruitment/);
  });

  it("localizes events, categories and raid names for the active locale", async () => {
    await AsyncStorage.setItem("app_locale", "ja");
    await renderProvider({ withLanguage: true });
    expect(captured.eventName(859)).toBe("嵐過天晴");
    const base = captured.students[0];
    expect(captured.isLimitedLabel({ ...base, IsLimited: [0, 1, 0] })).toBe("限定");
    expect(captured.raidNames?.multiFloor["1000004"]).toBe("ティファレト");
  });

  it("reads Thai names, schools and raid names from the bundled overlay", async () => {
    await AsyncStorage.setItem("app_locale", "th");
    await renderProvider({ withLanguage: true });
    const aru = captured.byId[10000];
    expect(captured.displayName(aru)).toBe("อารุ");
    expect(captured.label("School", "Trinity")).toBe("ทรีนิตี้");
    expect(captured.raidNames?.raid["1"]).toBe("บีนาห์");
  });

  it("falls back to English where the Vietnamese data has no translation", async () => {
    await AsyncStorage.setItem("app_locale", "vi");
    await renderProvider({ withLanguage: true });
    // Upstream's vi roster names this student in Japanese; that stand-in is
    // dropped at build time, so the English name shows.
    const arisMaid = captured.byId[10066];
    expect(captured.displayName(arisMaid)).toBe(arisMaid.Name);
    expect(captured.label("AdaptationType", "Street")).toBe("Đường phố");
    // Every boss but a handful is katakana upstream; those read in English.
    expect(captured.raidNames?.raid["1"]).toBeUndefined();
  });

  it("re-exports the live helpers next to the hook", async () => {
    await renderProvider();
    const now = new Date();
    expect(Array.isArray(liveEvents(captured.config, now))).toBe(true);
    expect(
      Array.isArray(liveRaids(captured.config, captured.raids, now, { names: captured.raidNames })),
    ).toBe(true);
    expect(effectiveBulletTypes("ElasticArmor", captured.config)).toEqual(["Sonic"]);
  });
});
