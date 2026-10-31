import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("../schaledb", () => ({
  ...jest.requireActual("../schaledb"),
  fetchConfig: jest.fn(),
  fetchStudents: jest.fn(),
  fetchNameMap: jest.fn(),
  fetchLocalization: jest.fn(),
  fetchRaids: jest.fn(),
  fetchRaidNames: jest.fn(),
}));

import { readCache, writeCache, writeCheckedAt } from "../cache";
import {
  REFRESH_INTERVAL_MS,
  bundledSnapshot,
  loadGameData,
  refreshGameData,
} from "../index";
import {
  ALL_LOCALES,
  ELIMINATE_SEASONS_KEPT,
  OPTIONAL_LOCALIZATION_SECTIONS,
  OVERLAY_LOCALES,
  OPTIONAL_STUDENT_FIELDS,
  STUDENT_FIELDS,
  fetchConfig,
  fetchLocalization,
  fetchNameMap,
  fetchRaidNames,
  fetchRaids,
  fetchStudents,
  isUntranslated,
  trimConfig,
  trimLocalization,
  trimRaidNames,
  trimRaids,
  trimStudent,
} from "../schaledb";
import type { GameConfig, GameDataSnapshot, GameRaids, GameStudent } from "../types";

const THAI = /[\u0e01-\u0e5b]/;

const mockFetchConfig = fetchConfig as jest.MockedFunction<typeof fetchConfig>;
const mockFetchStudents = fetchStudents as jest.MockedFunction<typeof fetchStudents>;
const mockFetchNameMap = fetchNameMap as jest.MockedFunction<typeof fetchNameMap>;
const mockFetchLocalization = fetchLocalization as jest.MockedFunction<
  typeof fetchLocalization
>;
const mockFetchRaids = fetchRaids as jest.MockedFunction<typeof fetchRaids>;
const mockFetchRaidNames = fetchRaidNames as jest.MockedFunction<typeof fetchRaidNames>;

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

/** The profile block upstream carries alongside the core record. */
const rawProfile = () => ({
  StreetBattleAdaptation: 4,
  OutdoorBattleAdaptation: 2,
  IndoorBattleAdaptation: 0,
  Equipment: ["Hat", "Hairpin", "Watch"],
  Weapon: { Name: "Wine Red/Admire", Desc: "a long paragraph", StatLevelUpType: "Standard" },
  SchoolYear: "2nd Year",
  CharacterAge: "16 years old",
  CharHeightMetric: "160cm",
  Hobby: "Studying management",
  Illustrator: "DoReMi",
  CharacterVoice: "Reina Kondō",
  MemoryLobby: [6, 6, 6],
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

const raids = (name = "Binah"): GameRaids => ({
  raid: {
    "1": { Name: name, ArmorType: "HeavyArmor", BulletType: "Normal", Terrain: ["Outdoor"] },
  },
  multiFloor: {},
  eliminate: [{}, {}, {}],
});

/** A cacheable snapshot; the fields a test does not care about stay empty. */
const cacheable = (
  build: number,
  overrides: Partial<Omit<GameDataSnapshot, "source">> = {},
): Omit<GameDataSnapshot, "source"> => ({
  config: config(build),
  students: [trimStudent(rawStudent()) as GameStudent],
  names: {},
  labels: {},
  raids: raids(),
  raidNames: {},
  ...overrides,
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

  it("rejects a record missing any core field", () => {
    const partial: Record<string, unknown> = rawStudent();
    delete partial.FavorItemTags;
    expect(trimStudent(partial)).toBeNull();
    expect(trimStudent(null)).toBeNull();
    expect(trimStudent("nope")).toBeNull();
  });

  it("keeps the profile fields when upstream has them", () => {
    const trimmed = trimStudent({ ...rawStudent(), ...rawProfile() });
    expect(trimmed).toMatchObject({
      StreetBattleAdaptation: 4,
      OutdoorBattleAdaptation: 2,
      // 0 is the D grade, not "missing".
      IndoorBattleAdaptation: 0,
      Equipment: ["Hat", "Hairpin", "Watch"],
      SchoolYear: "2nd Year",
      CharacterVoice: "Reina Kondō",
      MemoryLobby: [6, 6, 6],
    });
  });

  it("lifts the weapon name out of the heavy Weapon object", () => {
    const trimmed = trimStudent({ ...rawStudent(), ...rawProfile() });
    expect(trimmed?.WeaponName).toBe("Wine Red/Admire");
    expect(trimmed).not.toHaveProperty("Weapon");
  });

  it("never drops a student for lacking the optional fields", () => {
    const trimmed = trimStudent(rawStudent());
    expect(trimmed).not.toBeNull();
    for (const field of OPTIONAL_STUDENT_FIELDS) {
      expect(trimmed).not.toHaveProperty(field);
    }
  });

  it("omits a malformed optional field and keeps the student", () => {
    const trimmed = trimStudent({
      ...rawStudent(),
      ...rawProfile(),
      StreetBattleAdaptation: "S",
      OutdoorBattleAdaptation: -1,
      Equipment: ["Hat", 7, "Watch"],
      Weapon: "not an object",
      Hobby: "   ",
      MemoryLobby: [],
      Illustrator: null,
    });
    expect(trimmed).not.toBeNull();
    for (const field of [
      "StreetBattleAdaptation",
      "OutdoorBattleAdaptation",
      "Equipment",
      "WeaponName",
      "Hobby",
      "MemoryLobby",
      "Illustrator",
    ]) {
      expect(trimmed).not.toHaveProperty(field);
    }
    // The well-formed neighbours survive.
    expect(trimmed?.IndoorBattleAdaptation).toBe(0);
    expect(trimmed?.CharacterAge).toBe("16 years old");
  });

  it("keeps a linked form only when it points at another student", () => {
    expect(trimStudent({ ...rawStudent(), LinkedCharacterId: 2 })?.LinkedCharacterId).toBe(2);
    expect(trimStudent({ ...rawStudent(), LinkedCharacterId: 1 })).not.toHaveProperty(
      "LinkedCharacterId",
    );
    expect(trimStudent({ ...rawStudent(), LinkedCharacterId: 0 })).not.toHaveProperty(
      "LinkedCharacterId",
    );
  });
});

describe("trimConfig", () => {
  const rawRegion = () => ({
    ...config(1).regions[0],
    Events: [801, 802],
    CampaignMax: 29,
  });

  it("rejects a payload without a numeric build or regions", () => {
    expect(trimConfig({ Regions: [] })).toBeNull();
    expect(trimConfig({ build: "1", Regions: [] })).toBeNull();
    expect(trimConfig({ build: 1 })).toBeNull();
  });

  it("rejects a region missing a field we read", () => {
    expect(trimConfig({ build: 1, Regions: [{ Name: "Global" }] })).toBeNull();
  });

  it("keeps the type chart and drops cells upstream got wrong", () => {
    const trimmed = trimConfig({
      build: 1,
      Regions: [rawRegion()],
      StatLimit: { huge: true },
      TypeEffectiveness: {
        Sonic: { ElasticArmor: 20000, LightArmor: "x", HeavyArmor: 5000 },
        Broken: "row",
        Empty: {},
      },
    });
    expect(trimmed?.TypeEffectiveness).toEqual({
      Sonic: { ElasticArmor: 20000, HeavyArmor: 5000 },
    });
    expect(trimmed).not.toHaveProperty("StatLimit");
    expect(trimmed?.regions[0]).not.toHaveProperty("Events");
  });

  it("still loads when the type chart is missing", () => {
    const trimmed = trimConfig({ build: 1, Regions: [rawRegion()] });
    expect(trimmed?.build).toBe(1);
    expect(trimmed).not.toHaveProperty("TypeEffectiveness");
  });

  it("passes the raid season and terrain through", () => {
    const region = {
      ...rawRegion(),
      CurrentRaid: [
        { type: "EliminateRaid", raid: 12, terrain: "Outdoor", season: 41, start: 1, end: 2 },
      ],
    };
    const trimmed = trimConfig({ build: 1, Regions: [region] });
    expect(trimmed?.regions[0].CurrentRaid[0]).toEqual(region.CurrentRaid[0]);
  });
});

describe("trimLocalization", () => {
  it("keeps the optional sections when present", () => {
    const trimmed = trimLocalization({
      ...localization("en"),
      EventName: { "859": "The Calm After the Storm" },
      IsLimited: { "1": "Unique" },
      IsLimitedTooltip: { "0": "Regular." },
      Stat: { MaxHP: "Max HP" },
    });
    expect(trimmed?.EventName?.["859"]).toBe("The Calm After the Storm");
    expect(trimmed?.IsLimited?.["1"]).toBe("Unique");
    expect(trimmed?.IsLimitedTooltip?.["0"]).toBe("Regular.");
    expect(trimmed).not.toHaveProperty("Stat");
  });

  it("loads a locale that lacks an optional section", () => {
    const trimmed = trimLocalization(localization("ko"));
    expect(trimmed?.School.Gehenna).toBe("Gehenna-ko");
    expect(trimmed).not.toHaveProperty("EventName");
  });

  it("rejects a locale missing a required section", () => {
    const partial: Record<string, unknown> = localization("en");
    delete partial.School;
    expect(trimLocalization(partial)).toBeNull();
  });

  it("drops the Japanese stand-ins of a vi/th file so English shows through", () => {
    const raw = {
      ...localization("vi"),
      Club: { Kohshinjo68: "Đội giải quyết vấn đề 68", Justice: "正義実現委員会" },
      EventName: { "850": "誰が為の芸術", "801": "Mùa hè náo nhiệt" },
    };
    const trimmed = trimLocalization(raw, "vi");
    expect(trimmed?.Club).toEqual({ Kohshinjo68: "Đội giải quyết vấn đề 68" });
    expect(trimmed?.EventName).toEqual({ "801": "Mùa hè náo nhiệt" });
    // Japanese is the translation in ja, not a stand-in.
    expect(trimLocalization(raw, "ja")?.Club.Justice).toBe("正義実現委員会");
  });

  it("keeps the ・ that Thai event titles borrow", () => {
    const trimmed = trimLocalization(
      { ...localization("th"), EventName: { "856": "คิโวทอส・ปมปริศนาเร้นลับ" } },
      "th",
    );
    expect(trimmed?.EventName?.["856"]).toBe("คิโวทอส・ปมปริศนาเร้นลับ");
  });

  it("omits an optional section left with nothing but stand-ins", () => {
    const trimmed = trimLocalization(
      { ...localization("vi"), EventName: { "850": "誰が為の芸術" } },
      "vi",
    );
    expect(OPTIONAL_LOCALIZATION_SECTIONS).toContain("EventName");
    expect(trimmed).not.toHaveProperty("EventName");
  });
});

describe("isUntranslated", () => {
  it.each([
    ["vi", "アリス（メイド）", true],
    ["vi", "御坂美琴", true],
    ["th", "ツムギ", true],
    // English keeps upstream's Japanese titles for JP-only events: they are
    // the last fallback, and the only title those events have.
    ["en", "出航！万魔船", false],
    ["vi", "Azusa (Đồ bơi)", false],
    ["th", "อารุ", false],
    ["th", "คิโวทอส・ปมปริศนาเร้นลับ", false],
    ["ja", "アリス（メイド）", false],
    ["ko", "아리스", false],
    ["zh", "爱丽丝", false],
  ] as const)("%s %s -> %s", (locale, text, expected) => {
    expect(isUntranslated(locale, text)).toBe(expected);
  });
});

describe("trimRaids", () => {
  const rawRaids = () => ({
    Raid: [
      {
        Id: 9,
        Name: "Gregorius",
        ArmorType: "LightArmor",
        BulletType: "Normal",
        BulletTypeInsane: "Mystic",
        Terrain: ["Indoor"],
        EnemyList: [[1, 2, 3]],
        RaidSkillList: [{ huge: true }],
      },
      { Id: 10, Name: "No armor", BulletType: "Normal", Terrain: ["Outdoor"] },
      "garbage",
    ],
    MultiFloorRaid: [
      {
        Id: 1000004,
        Name: "Tiphareth",
        ArmorType: "ElasticArmor",
        BulletType: ["Normal", "Normal", "Pierce", "Pierce", "Pierce"],
        Terrain: ["Indoor"],
        RaidFloors: [{ heavy: true }],
      },
    ],
    RaidSeasons: [
      {
        EliminateSeasons: Array.from({ length: 6 }, (_, i) => ({
          SeasonId: 36 + i,
          OpenDifficulty: { LightArmor: 6, HeavyArmor: 5 },
        })),
      },
      {
        EliminateSeasons: [
          { SeasonId: 37, OpenDifficulty: { Unarmed: 6, ElasticArmor: 6, LightArmor: 5 } },
          { SeasonId: "bad", OpenDifficulty: { Unarmed: 6 } },
        ],
      },
      { EliminateSeasons: [] },
    ],
    TimeAttack: [{ Id: 1 }],
  });

  it("keeps name, armor, attack and terrain per boss", () => {
    const trimmed = trimRaids(rawRaids());
    expect(trimmed?.raid["9"]).toEqual({
      Name: "Gregorius",
      ArmorType: "LightArmor",
      BulletType: "Normal",
      BulletTypeInsane: "Mystic",
      Terrain: ["Indoor"],
    });
    expect(trimmed?.multiFloor["1000004"]).toEqual({
      Name: "Tiphareth",
      ArmorType: "ElasticArmor",
      BulletTypes: ["Normal", "Normal", "Pierce", "Pierce", "Pierce"],
      Terrain: ["Indoor"],
    });
    expect(trimmed).not.toHaveProperty("TimeAttack");
  });

  it("skips a boss missing a field instead of failing the file", () => {
    const trimmed = trimRaids(rawRaids());
    expect(Object.keys(trimmed?.raid ?? {})).toEqual(["9"]);
  });

  it("keeps only the newest Grand Assault seasons per region", () => {
    const trimmed = trimRaids(rawRaids());
    const japan = Object.keys(trimmed?.eliminate[0] ?? {}).map(Number);
    expect(japan).toHaveLength(ELIMINATE_SEASONS_KEPT);
    expect(Math.min(...japan)).toBe(36 + 6 - ELIMINATE_SEASONS_KEPT);
    expect(trimmed?.eliminate[1]).toEqual({
      "37": { Unarmed: 6, ElasticArmor: 6, LightArmor: 5 },
    });
    expect(trimmed?.eliminate[2]).toEqual({});
  });

  it("returns null when nothing usable is left", () => {
    expect(trimRaids(null)).toBeNull();
    expect(trimRaids({ Raid: "nope" })).toBeNull();
    expect(trimRaids({ Raid: [{ Id: 1 }], MultiFloorRaid: [] })).toBeNull();
  });

  it("keeps just the boss names out of a localized file", () => {
    const names = trimRaidNames({
      Raid: [{ Id: 9, Name: "グレゴリオ", ArmorType: "LightArmor" }, { Id: 10 }],
      MultiFloorRaid: [{ Id: 1000004, Name: "ティファレト" }],
    });
    expect(names).toEqual({ raid: { "9": "グレゴリオ" }, multiFloor: { "1000004": "ティファレト" } });
    expect(trimRaidNames({ Raid: [] })).toBeNull();
  });

  it("drops katakana boss names from a vi file, keeping a valid empty result", () => {
    const vi = trimRaidNames(
      {
        Raid: [{ Id: 1, Name: "ビナー" }, { Id: 5, Name: "KAITEN FX Mk.0" }],
        MultiFloorRaid: [{ Id: 1000004, Name: "ティファレト" }],
      },
      "vi",
    );
    expect(vi).toEqual({ raid: { "5": "KAITEN FX Mk.0" }, multiFloor: {} });
    // All stand-ins: well-formed, nothing to add, not "upstream changed shape".
    expect(trimRaidNames({ Raid: [{ Id: 1, Name: "ビナー" }] }, "vi")).toEqual({
      raid: {},
      multiFloor: {},
    });
  });
});

describe("bundled snapshot", () => {
  const bundled = bundledSnapshot();

  it("carries the type chart, the raid table and every locale's labels", () => {
    expect(bundled.config.TypeEffectiveness?.Sonic?.ElasticArmor).toBeGreaterThan(10000);
    expect(Object.keys(bundled.raids.raid).length).toBeGreaterThan(0);
    expect(Object.keys(bundled.raids.multiFloor).length).toBeGreaterThan(0);
    for (const locale of ALL_LOCALES) {
      expect(Object.keys(bundled.labels[locale]?.EventName ?? {}).length).toBeGreaterThan(0);
      expect(bundled.labels[locale]?.IsLimited).toBeDefined();
      expect(bundled.labels[locale]?.IsLimitedTooltip).toBeDefined();
    }
  });

  it("ships a name and raid overlay for every non-English locale", () => {
    for (const locale of OVERLAY_LOCALES) {
      expect(Object.keys(bundled.names[locale] ?? {}).length).toBeGreaterThan(100);
      expect(bundled.raidNames[locale]).toEqual(
        expect.objectContaining({ raid: expect.any(Object), multiFloor: expect.any(Object) }),
      );
    }
    // Thai is the official Global translation: every student and school has one.
    expect(bundled.names.th?.["10000"]).toMatch(THAI);
    expect(bundled.labels.th?.School.Trinity).toMatch(THAI);
  });

  it("never ships upstream's Japanese stand-ins as vi or th text", () => {
    const strings = (value: unknown): string[] =>
      typeof value === "string"
        ? [value]
        : value && typeof value === "object"
          ? Object.values(value).flatMap(strings)
          : [];
    for (const locale of ["vi", "th"] as const) {
      const shipped = [
        ...strings(bundled.names[locale]),
        ...strings(bundled.labels[locale]),
        ...strings(bundled.raidNames[locale]),
      ];
      expect(shipped.length).toBeGreaterThan(0);
      expect(shipped.filter((text) => isUntranslated(locale, text))).toEqual([]);
    }
  });

  it("holds exactly the fields trimStudent writes, profile included", () => {
    const known = new Set<string>([...STUDENT_FIELDS, ...OPTIONAL_STUDENT_FIELDS]);
    const stray = new Set<string>();
    for (const student of bundled.students) {
      for (const field of STUDENT_FIELDS) expect(student[field]).toBeDefined();
      for (const key of Object.keys(student)) if (!known.has(key)) stray.add(key);
    }
    expect([...stray]).toEqual([]);
    expect(bundled.students.some((s) => s.WeaponName)).toBe(true);
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
    await writeCache(
      cacheable(bundled.config.build + 1, {
        names: { ja: { "1": "アル" } },
        raids: raids("Cached Binah"),
        raidNames: { ja: { raid: { "1": "ビナー" }, multiFloor: {} } },
      }),
    );
    const snapshot = await loadGameData();
    expect(snapshot.source).toBe("cached");
    expect(snapshot.students).toHaveLength(1);
    expect(snapshot.names.ja?.["1"]).toBe("アル");
    expect(snapshot.raids.raid["1"].Name).toBe("Cached Binah");
    expect(snapshot.raidNames.ja?.raid["1"]).toBe("ビナー");
  });

  it("fills the overlays a pre-vi/th cache never had from the bundle", async () => {
    const bundled = bundledSnapshot();
    // Written by a build that only knew ja/ko/zh.
    await writeCache(
      cacheable(bundled.config.build + 1, {
        names: { ja: { "1": "アル" } },
        labels: { en: bundled.labels.en },
        raidNames: { ja: { raid: { "1": "ビナー" }, multiFloor: {} } },
      }),
    );
    const snapshot = await loadGameData();
    expect(snapshot.source).toBe("cached");
    expect(snapshot.names.ja?.["1"]).toBe("アル");
    expect(snapshot.names.th).toBe(bundled.names.th);
    expect(snapshot.names.vi).toBe(bundled.names.vi);
    expect(snapshot.labels.th).toBe(bundled.labels.th);
    expect(snapshot.raidNames.th).toBe(bundled.raidNames.th);
    expect(snapshot.raidNames.ja?.raid["1"]).toBe("ビナー");
  });

  it("fills in the bundled raids when the cached ones are unreadable", async () => {
    const bundled = bundledSnapshot();
    await writeCache(cacheable(bundled.config.build + 1));
    await AsyncStorage.setItem("gamedata:v2:raids", "{not json");
    const snapshot = await loadGameData();
    expect(snapshot.source).toBe("cached");
    expect(snapshot.raids).toBe(bundled.raids);
  });

  it("ignores a cache older than the shipped snapshot", async () => {
    const bundled = bundledSnapshot();
    await writeCache(cacheable(bundled.config.build - 1));
    expect((await loadGameData()).source).toBe("bundled");
  });

  it("ignores a cache with an empty student list", async () => {
    await writeCache(cacheable(9_999_999_999, { students: [] }));
    expect((await loadGameData()).source).toBe("bundled");
  });

  it("ignores a corrupt cache instead of throwing", async () => {
    await AsyncStorage.setItem("gamedata:v2:config", "{not json");
    expect((await loadGameData()).source).toBe("bundled");
    expect(await readCache()).toBeNull();
  });

  // The v1 roster lacks every profile field; reading it would show blank
  // student pages until upstream next moved.
  it("never reads a v1 cache, however new", async () => {
    await AsyncStorage.multiSet([
      ["gamedata:v1:config", JSON.stringify(config(9_999_999_999))],
      ["gamedata:v1:students", JSON.stringify([trimStudent(rawStudent())])],
    ]);
    expect((await loadGameData()).source).toBe("bundled");
  });

  it("sweeps the v1 keys away once a v2 cache is written", async () => {
    await AsyncStorage.multiSet([
      ["gamedata:v1:config", JSON.stringify(config(1))],
      ["gamedata:v1:students", "[]"],
      ["gamedata:v1:names:ja", "{}"],
    ]);
    await writeCache(cacheable(2));
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.filter((key) => key.startsWith("gamedata:v1:"))).toEqual([]);
    expect(keys).toContain("gamedata:v2:students");
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
    expect(mockFetchRaids).not.toHaveBeenCalled();
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
    mockFetchRaids.mockResolvedValue(raids("Fresh Binah"));
    mockFetchRaidNames.mockImplementation(async (locale) => ({
      raid: { "1": `binah-${locale}` },
      multiFloor: {},
    }));
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
    expect(fresh?.raids.raid["1"].Name).toBe("Fresh Binah");
    expect(fresh?.raidNames.ja?.raid["1"]).toBe("binah-ja");

    const persisted = await readCache();
    expect(persisted?.config.build).toBe(bundled.config.build + 1);
    expect(persisted?.students).toHaveLength(1);
    expect(persisted?.raids?.raid["1"].Name).toBe("Fresh Binah");
  });

  // Each name overlay costs a full roster download upstream, so the count of
  // these calls is a data-plan cost, not just an implementation detail.
  it("downloads one roster and one raids file for an English user", async () => {
    const bundled = bundledSnapshot();
    mockAllFetches(bundled.config.build + 1);
    await refreshGameData(bundled, now, true, "en");
    expect(mockFetchStudents).toHaveBeenCalledTimes(1);
    expect(mockFetchNameMap).not.toHaveBeenCalled();
    expect(mockFetchRaids).toHaveBeenCalledTimes(1);
    expect(mockFetchRaidNames).not.toHaveBeenCalled();
  });

  it("downloads exactly one extra roster and raids file for a non-English user", async () => {
    const bundled = bundledSnapshot();
    mockAllFetches(bundled.config.build + 1);
    await refreshGameData(bundled, now, true, "ko");
    expect(mockFetchStudents).toHaveBeenCalledTimes(1);
    expect(mockFetchNameMap).toHaveBeenCalledTimes(1);
    expect(mockFetchNameMap).toHaveBeenCalledWith("ko");
    expect(mockFetchRaidNames).toHaveBeenCalledTimes(1);
    expect(mockFetchRaidNames).toHaveBeenCalledWith("ko");
  });

  it.each(["vi", "th"] as const)("refreshes the %s overlay for that user", async (locale) => {
    const bundled = bundledSnapshot();
    mockAllFetches(bundled.config.build + 1);
    const fresh = await refreshGameData(bundled, now, true, locale);
    expect(mockFetchNameMap).toHaveBeenCalledTimes(1);
    expect(mockFetchNameMap).toHaveBeenCalledWith(locale);
    expect(mockFetchLocalization).toHaveBeenCalledWith(locale);
    expect(mockFetchRaidNames).toHaveBeenCalledWith(locale);
    expect(fresh?.names[locale]?.["1"]).toBe(`name-${locale}`);
    expect(fresh?.labels[locale]?.School.Gehenna).toBe(`Gehenna-${locale}`);
    expect(fresh?.raidNames[locale]?.raid["1"]).toBe(`binah-${locale}`);

    const persisted = await readCache();
    expect(persisted?.names[locale]?.["1"]).toBe(`name-${locale}`);
    expect(persisted?.labels[locale]?.School.Gehenna).toBe(`Gehenna-${locale}`);
    expect(persisted?.raidNames[locale]?.raid["1"]).toBe(`binah-${locale}`);
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
    expect(fresh?.raidNames.ja).toBe(bundled.raidNames.ja);
    expect(fresh?.raidNames.ko?.raid["1"]).toBe("binah-ko");
  });

  it("still refreshes the roster when the raids file fails", async () => {
    const bundled = bundledSnapshot();
    mockAllFetches(bundled.config.build + 1);
    mockFetchRaids.mockRejectedValue(new Error("SchaleDB raids: unexpected shape"));
    mockFetchRaidNames.mockRejectedValue(new Error("timeout"));
    const fresh = await refreshGameData(bundled, now, true, "zh");
    expect(fresh?.students).toHaveLength(1);
    expect(fresh?.raids).toBe(bundled.raids);
    expect(fresh?.raidNames.zh).toBe(bundled.raidNames.zh);
  });

  it("keeps the type chart when a new config arrives without one", async () => {
    const bundled = bundledSnapshot();
    mockAllFetches(bundled.config.build + 1);
    const fresh = await refreshGameData(bundled, now, true);
    expect(fresh?.config.TypeEffectiveness).toEqual(bundled.config.TypeEffectiveness);
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
    mockFetchRaids.mockResolvedValue(raids());
    expect(await refreshGameData(bundled, now, true)).toBeNull();
    expect(await readCache()).toBeNull();
  });
});
