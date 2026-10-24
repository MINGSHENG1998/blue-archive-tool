import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("../schaledb", () => ({
  ...jest.requireActual("../schaledb"),
  fetchConfig: jest.fn(),
  fetchStudents: jest.fn(),
  fetchNameMap: jest.fn(),
  fetchLocalization: jest.fn(),
}));

import { readCache, writeCache, writeCheckedAt } from "../cache";
import {
  REFRESH_INTERVAL_MS,
  bundledSnapshot,
  loadGameData,
  refreshGameData,
} from "../index";
import {
  STUDENT_FIELDS,
  fetchConfig,
  fetchLocalization,
  fetchNameMap,
  fetchStudents,
  trimConfig,
  trimStudent,
} from "../schaledb";
import type { GameConfig, GameStudent } from "../types";

const mockFetchConfig = fetchConfig as jest.MockedFunction<typeof fetchConfig>;
const mockFetchStudents = fetchStudents as jest.MockedFunction<typeof fetchStudents>;
const mockFetchNameMap = fetchNameMap as jest.MockedFunction<typeof fetchNameMap>;
const mockFetchLocalization = fetchLocalization as jest.MockedFunction<
  typeof fetchLocalization
>;

const localization = (locale: string) => ({
  SquadType: {},
  BulletType: {},
  ArmorType: {},
  TacticRole: {},
  School: { Gehenna: `Gehenna-${locale}` },
  Club: {},
});

const rawStudent = () => ({
  Id: 1,
  Name: "Aru",
  PathName: "aru",
  BirthDay: "3/12",
  StarGrade: 3,
  SquadType: "Main",
  BulletType: "Explosion",
  ArmorType: "LightArmor",
  School: "Gehenna",
  Club: "Kohshinjo68",
  TacticRole: "DamageDealer",
  Position: "Back",
  WeaponType: "SR",
  FavorItemTags: ["ak"],
  FavorItemUniqueTags: ["BD"],
  SkillMaterial: [[4030]],
  SkillMaterialAmount: [[5]],
  PotentialMaterial: 150,
  IsReleased: [true, true, true],
  IsLimited: [4, 4, 0],
});

const config = (build: number): GameConfig => ({
  build,
  regions: [
    {
      Name: "Global",
      StudentMaxLevel: 90,
      BondMaxLevel: 50,
      PotentialMax: 25,
      CurrentGacha: [],
      CurrentEvents: [],
      CurrentRaid: [],
    },
  ],
});

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe("trimStudent", () => {
  it("keeps exactly the declared fields and drops the rest", () => {
    const trimmed = trimStudent({
      ...rawStudent(),
      MaxHP1: 9999,
      ProfileIntroduction: "a very long string we do not ship",
    });
    expect(trimmed).not.toBeNull();
    expect(Object.keys(trimmed as object).sort()).toEqual([...STUDENT_FIELDS].sort());
  });

  it("rejects a record missing any declared field", () => {
    const partial: Record<string, unknown> = rawStudent();
    delete partial.FavorItemTags;
    expect(trimStudent(partial)).toBeNull();
    expect(trimStudent(null)).toBeNull();
    expect(trimStudent("nope")).toBeNull();
  });
});

describe("trimConfig", () => {
  it("rejects a payload without a numeric build or regions", () => {
    expect(trimConfig({ Regions: [] })).toBeNull();
    expect(trimConfig({ build: "1", Regions: [] })).toBeNull();
    expect(trimConfig({ build: 1 })).toBeNull();
  });

  it("rejects a region missing a field we read", () => {
    expect(trimConfig({ build: 1, Regions: [{ Name: "Global" }] })).toBeNull();
  });
});

describe("loadGameData", () => {
  it("falls back to the bundled snapshot with an empty cache", async () => {
    const snapshot = await loadGameData();
    expect(snapshot.source).toBe("bundled");
    expect(snapshot.students.length).toBeGreaterThan(0);
  });

  it("prefers a cache at or above the bundled build", async () => {
    const bundled = bundledSnapshot();
    await writeCache({
      config: config(bundled.config.build + 1),
      students: [trimStudent(rawStudent()) as GameStudent],
      names: { ja: { "1": "アル" } },
      labels: {},
    });
    const snapshot = await loadGameData();
    expect(snapshot.source).toBe("cached");
    expect(snapshot.students).toHaveLength(1);
    expect(snapshot.names.ja?.["1"]).toBe("アル");
  });

  it("ignores a cache older than the shipped snapshot", async () => {
    const bundled = bundledSnapshot();
    await writeCache({
      config: config(bundled.config.build - 1),
      students: [trimStudent(rawStudent()) as GameStudent],
      names: {},
      labels: {},
    });
    expect((await loadGameData()).source).toBe("bundled");
  });

  it("ignores a cache with an empty student list", async () => {
    await writeCache({
      config: config(9_999_999_999),
      students: [],
      names: {},
      labels: {},
    });
    expect((await loadGameData()).source).toBe("bundled");
  });

  it("ignores a corrupt cache instead of throwing", async () => {
    await AsyncStorage.setItem("gamedata:v1:config", "{not json");
    expect((await loadGameData()).source).toBe("bundled");
    expect(await readCache()).toBeNull();
  });
});

describe("refreshGameData", () => {
  const now = 1_800_000_000_000;

  it("does nothing inside the throttle window", async () => {
    await writeCheckedAt(now - 1000);
    expect(await refreshGameData(bundledSnapshot(), now)).toBeNull();
    expect(mockFetchConfig).not.toHaveBeenCalled();
  });

  it("checks upstream once the window has elapsed", async () => {
    await writeCheckedAt(now - REFRESH_INTERVAL_MS - 1);
    mockFetchConfig.mockResolvedValue(config(1));
    expect(await refreshGameData(bundledSnapshot(), now)).toBeNull();
    expect(mockFetchConfig).toHaveBeenCalledTimes(1);
  });

  it("skips the expensive fetch when the build has not moved", async () => {
    const bundled = bundledSnapshot();
    mockFetchConfig.mockResolvedValue(config(bundled.config.build));
    expect(await refreshGameData(bundled, now, true)).toBeNull();
    expect(mockFetchStudents).not.toHaveBeenCalled();
  });

  const mockAllFetches = (build: number) => {
    mockFetchConfig.mockResolvedValue(config(build));
    mockFetchStudents.mockResolvedValue([trimStudent(rawStudent()) as GameStudent]);
    mockFetchNameMap.mockImplementation(async (locale) => ({
      "1": `name-${locale}`,
    }));
    mockFetchLocalization.mockImplementation(async (locale) =>
      localization(locale),
    );
  };

  it("fetches, caches and returns a newer build", async () => {
    const bundled = bundledSnapshot();
    mockAllFetches(bundled.config.build + 1);

    const fresh = await refreshGameData(bundled, now, true, "ja");
    expect(fresh?.source).toBe("cached");
    expect(fresh?.config.build).toBe(bundled.config.build + 1);
    expect(fresh?.names.ja?.["1"]).toBe("name-ja");
    expect(fresh?.labels.en?.School.Gehenna).toBe("Gehenna-en");
    expect(fresh?.labels.ja?.School.Gehenna).toBe("Gehenna-ja");

    const persisted = await readCache();
    expect(persisted?.config.build).toBe(bundled.config.build + 1);
    expect(persisted?.students).toHaveLength(1);
  });

  // Each name overlay costs a full ~1.6 MB roster download upstream, so the
  // count of these calls is a data-plan cost, not just an implementation detail.
  it("downloads one roster for an English user", async () => {
    const bundled = bundledSnapshot();
    mockAllFetches(bundled.config.build + 1);
    await refreshGameData(bundled, now, true, "en");
    expect(mockFetchStudents).toHaveBeenCalledTimes(1);
    expect(mockFetchNameMap).not.toHaveBeenCalled();
  });

  it("downloads exactly one extra roster for a non-English user", async () => {
    const bundled = bundledSnapshot();
    mockAllFetches(bundled.config.build + 1);
    await refreshGameData(bundled, now, true, "ko");
    expect(mockFetchStudents).toHaveBeenCalledTimes(1);
    expect(mockFetchNameMap).toHaveBeenCalledTimes(1);
    expect(mockFetchNameMap).toHaveBeenCalledWith("ko");
  });

  it("carries forward the overlays it did not refresh", async () => {
    const bundled = bundledSnapshot();
    mockAllFetches(bundled.config.build + 1);
    const fresh = await refreshGameData(bundled, now, true, "ko");
    // ja and zh were never fetched, so they must survive from the snapshot
    // rather than disappearing and falling back to English names.
    expect(fresh?.names.ja).toBe(bundled.names.ja);
    expect(fresh?.names.zh).toBe(bundled.names.zh);
    expect(fresh?.names.ko?.["1"]).toBe("name-ko");
  });

  it("stamps the check even when there is nothing new, so it stays throttled", async () => {
    const bundled = bundledSnapshot();
    mockFetchConfig.mockResolvedValue(config(bundled.config.build));
    await refreshGameData(bundled, now, true);
    expect(await refreshGameData(bundled, now + 1000)).toBeNull();
    expect(mockFetchConfig).toHaveBeenCalledTimes(1);
  });

  it("returns null and leaves the cache alone when the network fails", async () => {
    mockFetchConfig.mockRejectedValue(new Error("offline"));
    expect(await refreshGameData(bundledSnapshot(), now, true)).toBeNull();
    expect(await readCache()).toBeNull();
  });

  it("returns null when the student fetch fails midway", async () => {
    const bundled = bundledSnapshot();
    mockFetchConfig.mockResolvedValue(config(bundled.config.build + 1));
    mockFetchStudents.mockRejectedValue(new Error("timeout"));
    mockFetchNameMap.mockResolvedValue({});
    mockFetchLocalization.mockResolvedValue(localization("en"));
    expect(await refreshGameData(bundled, now, true)).toBeNull();
    expect(await readCache()).toBeNull();
  });
});
