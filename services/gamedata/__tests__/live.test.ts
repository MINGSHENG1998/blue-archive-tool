import {
  NEUTRAL_MULTIPLIER,
  baseEventId,
  effectiveBulletTypes,
  eventTitle,
  liveEvents,
  liveRaids,
  typeMultiplier,
} from "../live";
import { bundledSnapshot } from "../index";
import type { CurrentRaidEntry, GameConfig, GameRaids, RegionSchedule } from "../types";

const at = (iso: string) => Date.parse(iso) / 1000;

// Shaped after SchaleDB's config of 2026-10-14: Global runs event 859 and
// Tiphareth, Japan a rerun plus a Grand Assault on Geburah.
const region = (
  Name: string,
  overrides: Partial<RegionSchedule> = {},
): RegionSchedule => ({
  Name,
  StudentMaxLevel: 90,
  BondMaxLevel: 100,
  PotentialMax: 25,
  CurrentGacha: [],
  CurrentEvents: [],
  CurrentRaid: [],
  ...overrides,
});

const config = (
  japan: Partial<RegionSchedule> = {},
  global: Partial<RegionSchedule> = {},
): GameConfig => ({
  build: 1,
  regions: [region("Jp", japan), region("Global", global), region("Cn")],
  TypeEffectiveness: bundledSnapshot().config.TypeEffectiveness,
});

const raids: GameRaids = {
  raid: {
    "9": {
      Name: "Gregorius",
      ArmorType: "LightArmor",
      BulletType: "Normal",
      BulletTypeInsane: "Mystic",
      Terrain: ["Indoor"],
    },
    "10": {
      Name: "Hovercraft",
      ArmorType: "HeavyArmor",
      BulletType: "Normal",
      BulletTypeInsane: "Pierce",
      Terrain: ["Outdoor"],
    },
    "12": {
      Name: "Geburah",
      ArmorType: "LightArmor",
      BulletType: "Normal",
      BulletTypeInsane: "Mystic",
      Terrain: ["Outdoor", "Street"],
    },
  },
  multiFloor: {
    "1000004": {
      Name: "Tiphareth",
      ArmorType: "ElasticArmor",
      BulletTypes: ["Normal", "Normal", "Pierce", "Pierce", "Pierce"],
      Terrain: ["Indoor"],
    },
  },
  eliminate: [
    { "41": { Unarmed: 6, LightArmor: 6, HeavyArmor: 5 } },
    { "37": { LightArmor: 5, Unarmed: 6, ElasticArmor: 6 } },
    {},
  ],
};

const tiphareth: CurrentRaidEntry = {
  type: "MultiFloorRaid",
  raid: 1000004,
  start: at("2026-10-15T02:00:00Z"),
  end: at("2026-11-09T19:00:00Z"),
};

const now = new Date("2026-10-24T12:00:00Z");

describe("liveEvents", () => {
  const event859 = {
    event: 859,
    start: at("2026-10-13T02:00:00Z"),
    end: at("2026-10-27T02:00:00Z"),
  };

  it("lists a running event with its time left", () => {
    const [live] = liveEvents(config({}, { CurrentEvents: [event859] }), now);
    expect(live).toEqual({
      id: 859,
      baseId: 859,
      isRerun: false,
      start: event859.start,
      end: event859.end,
      secondsLeft: event859.end - now.getTime() / 1000,
    });
  });

  it("recognises a rerun by its +10000 id", () => {
    const rerun = { ...event859, event: 10849 };
    const [live] = liveEvents(config({ CurrentEvents: [rerun] }), now, "japan");
    expect(live.baseId).toBe(849);
    expect(live.isRerun).toBe(true);
  });

  it("drops an event that has ended or not yet started", () => {
    const ended = { event: 858, start: at("2026-09-29T02:00:00Z"), end: at("2026-10-13T02:00:00Z") };
    const upcoming = { event: 860, start: at("2026-10-27T02:00:00Z"), end: at("2026-11-10T02:00:00Z") };
    const events = liveEvents(
      config({}, { CurrentEvents: [ended, event859, upcoming] }),
      now,
    );
    expect(events.map((event) => event.id)).toEqual([859]);
  });

  it("orders by whichever ends first", () => {
    const later = { ...event859, event: 70001, end: event859.end + 86_400 };
    const events = liveEvents(config({}, { CurrentEvents: [later, event859] }), now);
    expect(events.map((event) => event.id)).toEqual([859, 70001]);
  });

  it("reads the region asked for", () => {
    const schedule = config({}, { CurrentEvents: [event859] });
    expect(liveEvents(schedule, now, "japan")).toEqual([]);
    expect(liveEvents(schedule, now, "global")).toHaveLength(1);
  });

  it("returns empty rather than throwing on malformed data", () => {
    expect(liveEvents(null, now)).toEqual([]);
    expect(liveEvents(undefined, now)).toEqual([]);
    expect(liveEvents({ regions: [] }, now)).toEqual([]);
    const junk = [null, "859", { event: "859", start: 1, end: 2 }, { event: 859 }];
    expect(
      liveEvents(config({}, { CurrentEvents: junk as never }), now),
    ).toEqual([]);
  });
});

describe("eventTitle", () => {
  const english = { "849": "Occult Investigation", "859": "The Calm After the Storm" };
  const japanese = { "859": "嵐過天晴" };

  it("prefers the first source that names the event", () => {
    expect(eventTitle(859, japanese, english)).toBe("嵐過天晴");
  });

  it("falls back to the next source for an event the first lacks", () => {
    expect(eventTitle(849, japanese, english)).toBe("Occult Investigation");
  });

  it("titles a rerun after its original", () => {
    expect(eventTitle(10849, english)).toBe("Occult Investigation");
    expect(baseEventId(10849)).toBe(849);
    // Ids outside the rerun band are their own events.
    expect(baseEventId(70001)).toBe(70001);
  });

  it("is null for an event nobody names yet", () => {
    expect(eventTitle(999, japanese, english)).toBeNull();
    expect(eventTitle(859)).toBeNull();
    expect(eventTitle(859, undefined)).toBeNull();
  });
});

describe("liveRaids", () => {
  it("describes a multi-floor raid by the floors that matter", () => {
    const [live] = liveRaids(config({}, { CurrentRaid: [tiphareth] }), raids, now);
    expect(live).toEqual({
      kind: "MultiFloorRaid",
      id: 1000004,
      name: "Tiphareth",
      armorTypes: ["ElasticArmor"],
      bulletTypes: ["Pierce"],
      terrain: "Indoor",
      season: null,
      devName: null,
      start: tiphareth.start,
      end: tiphareth.end,
      secondsLeft: tiphareth.end - now.getTime() / 1000,
    });
  });

  it("carries the boss DevName for its art when the snapshot has it", () => {
    const withArt = {
      ...raids,
      multiFloor: {
        ...raids.multiFloor,
        "1000004": { ...raids.multiFloor["1000004"], DevName: "EN0011" },
      },
    };
    const [live] = liveRaids(config({}, { CurrentRaid: [tiphareth] }), withArt, now);
    expect(live.devName).toBe("EN0011");
  });

  it("uses the Insane attack type for Total Assault", () => {
    const entry: CurrentRaidEntry = {
      type: "Raid",
      raid: 9,
      season: 89,
      terrain: "Indoor",
      start: at("2026-10-20T02:00:00Z"),
      end: at("2026-10-26T19:00:00Z"),
    };
    const [live] = liveRaids(config({}, { CurrentRaid: [entry] }), raids, now);
    expect(live.kind).toBe("Raid");
    expect(live.bulletTypes).toEqual(["Mystic"]);
    expect(live.armorTypes).toEqual(["LightArmor"]);
    expect(live.season).toBe(89);
  });

  it("gives Grand Assault its three armors, hardest tier first", () => {
    const entry: CurrentRaidEntry = {
      type: "EliminateRaid",
      raid: 12,
      terrain: "Outdoor",
      season: 41,
      start: at("2026-10-20T02:00:00Z"),
      end: at("2026-10-26T19:00:00Z"),
    };
    const [live] = liveRaids(config({ CurrentRaid: [entry] }), raids, now, {
      region: "japan",
    });
    expect(live.kind).toBe("EliminateRaid");
    expect(live.armorTypes).toEqual(["Unarmed", "LightArmor", "HeavyArmor"]);
    expect(live.terrain).toBe("Outdoor");
  });

  it("shows no armor rather than the wrong one for an unknown season", () => {
    const entry: CurrentRaidEntry = {
      type: "EliminateRaid",
      raid: 10,
      season: 99,
      start: at("2026-10-20T02:00:00Z"),
      end: at("2026-10-26T19:00:00Z"),
    };
    const [live] = liveRaids(config({}, { CurrentRaid: [entry] }), raids, now);
    // Hovercraft is HeavyArmor in Total Assault; Grand Assault fields others.
    expect(live.armorTypes).toEqual([]);
  });

  it("leaves terrain null when the boss has used several and config is silent", () => {
    const entry: CurrentRaidEntry = {
      type: "Raid",
      raid: 12,
      start: at("2026-10-20T02:00:00Z"),
      end: at("2026-10-26T19:00:00Z"),
    };
    const [live] = liveRaids(config({}, { CurrentRaid: [entry] }), raids, now);
    expect(live.terrain).toBeNull();
  });

  it("names the boss in the overlay locale, English as the fallback", () => {
    const names = { raid: {}, multiFloor: { "1000004": "ティファレト" } };
    const [live] = liveRaids(config({}, { CurrentRaid: [tiphareth] }), raids, now, { names });
    expect(live.name).toBe("ティファレト");
    const [bare] = liveRaids(config({}, { CurrentRaid: [tiphareth] }), raids, now, {
      names: { raid: {}, multiFloor: {} },
    });
    expect(bare.name).toBe("Tiphareth");
  });

  it("skips ended, upcoming, unknown and untabled raids", () => {
    const entries: CurrentRaidEntry[] = [
      { ...tiphareth, end: at("2026-10-20T00:00:00Z") },
      { ...tiphareth, start: at("2026-11-01T00:00:00Z") },
      { ...tiphareth, raid: 1000099 },
      { type: "TimeAttack", raid: 1, start: tiphareth.start, end: tiphareth.end },
      tiphareth,
    ];
    const live = liveRaids(config({}, { CurrentRaid: entries }), raids, now);
    expect(live).toHaveLength(1);
    expect(live[0].id).toBe(1000004);
  });

  it("returns empty rather than throwing on malformed data", () => {
    const schedule = config({}, { CurrentRaid: [tiphareth] });
    expect(liveRaids(null, raids, now)).toEqual([]);
    expect(liveRaids(schedule, null, now)).toEqual([]);
    expect(liveRaids(schedule, { raid: {}, multiFloor: {}, eliminate: [] }, now)).toEqual([]);
    const junk = [null, { type: "Raid" }, { type: "Raid", raid: 9, start: "x", end: 2 }];
    expect(liveRaids(config({}, { CurrentRaid: junk as never }), raids, now)).toEqual([]);
  });

  it("resolves the live Global raid against the bundled snapshot", () => {
    const bundled = bundledSnapshot();
    const live = liveRaids(bundled.config, bundled.raids, now);
    for (const raid of live) {
      expect(raid.name.length).toBeGreaterThan(0);
      expect(raid.bulletTypes.length).toBeGreaterThan(0);
    }
  });
});

describe("type chart", () => {
  const schedule = config();

  it("lists the attack types that beat an armor, strongest first", () => {
    expect(effectiveBulletTypes("ElasticArmor", schedule)).toEqual(["Sonic"]);
    expect(effectiveBulletTypes("LightArmor", schedule)).toEqual(["Explosion"]);
    // Mystic doubles, Sonic adds half.
    expect(effectiveBulletTypes("Unarmed", schedule)).toEqual(["Mystic", "Sonic"]);
    expect(effectiveBulletTypes("HeavyArmor", schedule)).toEqual(["Pierce", "Chemical"]);
  });

  it("never lists a neutral or resisted type", () => {
    const chart = schedule.TypeEffectiveness ?? {};
    for (const armorType of Object.keys(chart.Normal ?? {})) {
      for (const bulletType of effectiveBulletTypes(armorType, schedule)) {
        expect(chart[bulletType][armorType]).toBeGreaterThan(NEUTRAL_MULTIPLIER);
      }
    }
    expect(effectiveBulletTypes("Structure", schedule)).toEqual([]);
  });

  it("is empty for an unknown armor or a missing chart", () => {
    expect(effectiveBulletTypes("PlotArmor", schedule)).toEqual([]);
    const chartless: GameConfig = { build: 1, regions: [] };
    expect(effectiveBulletTypes("LightArmor", chartless)).toEqual([]);
    expect(effectiveBulletTypes("LightArmor", null)).toEqual([]);
  });

  it("reads multipliers as plain factors", () => {
    expect(typeMultiplier("Sonic", "ElasticArmor", schedule)).toBe(2);
    expect(typeMultiplier("Sonic", "Unarmed", schedule)).toBe(1.5);
    expect(typeMultiplier("Normal", "LightArmor", schedule)).toBe(1);
    expect(typeMultiplier("Explosion", "ElasticArmor", schedule)).toBe(0.5);
    expect(typeMultiplier("Sonic", "PlotArmor", schedule)).toBeNull();
    expect(typeMultiplier("Sonic", "ElasticArmor", undefined)).toBeNull();
  });
});
