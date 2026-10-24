import {
  birthdaysByMonth,
  filterStudents,
  schoolsOf,
  selectLiveGachas,
  toAtkType,
  toDefType,
  daysUntilBirthday,
  indexById,
  isReleased,
  nameFor,
  parseBirthDay,
  studentOfTheDay,
  upcomingBirthdays,
} from "../students";
import type { GameStudent } from "../types";

const student = (
  Id: number,
  Name: string,
  BirthDay: string,
  IsReleased: boolean[] = [true, true, true],
): GameStudent => ({
  Id,
  Name,
  PathName: Name.toLowerCase(),
  BirthDay,
  StarGrade: 3,
  SquadType: "Main",
  BulletType: "Explosion",
  ArmorType: "LightArmor",
  School: "Gehenna",
  Club: "Kohshinjo68",
  TacticRole: "DamageDealer",
  Position: "Back",
  WeaponType: "SR",
  FavorItemTags: [],
  FavorItemUniqueTags: [],
  SkillMaterial: [],
  SkillMaterialAmount: [],
  PotentialMaterial: 150,
  IsReleased,
  IsLimited: [0, 0, 0],
});

describe("parseBirthDay", () => {
  it("parses M/D", () => {
    expect(parseBirthDay("3/12")).toEqual({ month: 3, day: 12 });
    expect(parseBirthDay("11/27")).toEqual({ month: 11, day: 27 });
  });

  it("rejects the '-' placeholder and malformed input", () => {
    expect(parseBirthDay("-")).toBeNull();
    expect(parseBirthDay("")).toBeNull();
    expect(parseBirthDay("13/1")).toBeNull();
    expect(parseBirthDay("1/32")).toBeNull();
    expect(parseBirthDay("March 12")).toBeNull();
  });
});

describe("daysUntilBirthday", () => {
  const today = new Date(2026, 7, 26); // 26 Aug 2026

  it("is 0 on the day", () => {
    expect(daysUntilBirthday({ month: 8, day: 26 }, today)).toBe(0);
  });

  it("counts forward within the year", () => {
    expect(daysUntilBirthday({ month: 8, day: 27 }, today)).toBe(1);
    expect(daysUntilBirthday({ month: 9, day: 5 }, today)).toBe(10);
  });

  it("wraps to next year for a date already passed", () => {
    // 1 Jan 2027 is 128 days after 26 Aug 2026.
    expect(daysUntilBirthday({ month: 1, day: 1 }, today)).toBe(128);
  });

  it("is unaffected by the time of day", () => {
    const lateEvening = new Date(2026, 7, 26, 23, 59, 59);
    expect(daysUntilBirthday({ month: 8, day: 27 }, lateEvening)).toBe(1);
  });

  it("rolls Feb 29 to Mar 1 in a common year", () => {
    // 2027 is not a leap year, so the next occurrence is 1 Mar 2027.
    const beforeLeap = new Date(2027, 1, 27);
    expect(daysUntilBirthday({ month: 2, day: 29 }, beforeLeap)).toBe(2);
  });
});

describe("upcomingBirthdays", () => {
  const today = new Date(2026, 7, 26);
  const students = [
    student(3, "Charlie", "1/1"),
    student(1, "Alice", "8/27"),
    student(2, "Bob", "-"),
    student(4, "Dana", "8/27"),
  ];

  it("sorts by days until, then name, and drops students with no birthday", () => {
    const result = upcomingBirthdays(students, today);
    expect(result.map((entry) => entry.student.Name)).toEqual([
      "Alice",
      "Dana",
      "Charlie",
    ]);
    expect(result[0].daysUntil).toBe(1);
  });

  it("honours the limit", () => {
    expect(upcomingBirthdays(students, today, 2)).toHaveLength(2);
  });
});

describe("birthdaysByMonth", () => {
  it("keeps all twelve months and sorts each by day", () => {
    const months = birthdaysByMonth([
      student(1, "Late", "3/28"),
      student(2, "Early", "3/2"),
      student(3, "None", "-"),
    ]);
    expect(Object.keys(months)).toHaveLength(12);
    expect(months[3].map((entry) => entry.student.Name)).toEqual(["Early", "Late"]);
    expect(months[7]).toEqual([]);
  });
});

describe("studentOfTheDay", () => {
  const students = [
    student(10, "A", "1/1"),
    student(20, "B", "1/2"),
    student(30, "C", "1/3"),
    student(40, "JP only", "1/4", [true, false, false]),
  ];

  it("is stable across one in-game day", () => {
    // The game day runs from one 04:00 JST reset (19:00 UTC) to the next.
    const justAfterReset = studentOfTheDay(students, new Date("2026-08-26T19:00:01Z"));
    const justBeforeNext = studentOfTheDay(students, new Date("2026-08-27T18:59:59Z"));
    expect(justAfterReset).not.toBeNull();
    expect(justAfterReset).toBe(justBeforeNext);
  });

  it("turns over at the reset, not at local midnight", () => {
    const before = studentOfTheDay(students, new Date("2026-08-26T18:59:59Z"));
    const acrossUtcMidnight = studentOfTheDay(students, new Date("2026-08-27T00:00:00Z"));
    expect(acrossUtcMidnight).not.toBe(before);
  });

  it("never picks a student unreleased in the region", () => {
    for (let day = 1; day <= 60; day++) {
      const pick = studentOfTheDay(
        students,
        new Date(Date.UTC(2026, 0, day, 20)),
        "global",
      );
      expect(pick?.Name).not.toBe("JP only");
    }
  });

  it("does not depend on snapshot ordering", () => {
    const date = new Date("2026-08-26T20:00:00Z");
    const reversed = [...students].reverse();
    expect(studentOfTheDay(students, date)).toEqual(
      studentOfTheDay(reversed, date),
    );
  });

  it("moves over a run of days", () => {
    const picks = new Set<string>();
    for (let day = 1; day <= 30; day++) {
      picks.add(
        studentOfTheDay(students, new Date(Date.UTC(2026, 0, day, 20)))?.Name ?? "",
      );
    }
    expect(picks.size).toBeGreaterThan(1);
  });

  it("returns null when nothing is released", () => {
    expect(studentOfTheDay([student(1, "X", "1/1", [true, false, false])], new Date(), "global")).toBeNull();
  });
});

describe("misc selectors", () => {
  it("indexes by id", () => {
    expect(indexById([student(7, "Seven", "1/1")])[7].Name).toBe("Seven");
  });

  it("falls back to the English name when the overlay lacks an entry", () => {
    const s = student(1, "Aru", "3/12");
    expect(nameFor(s, "ja", { ja: { "1": "アル" } })).toBe("アル");
    expect(nameFor(s, "ja", { ja: {} })).toBe("Aru");
    expect(nameFor(s, "ko", {})).toBe("Aru");
  });

  it("reads the release flag per region", () => {
    const s = student(1, "JP only", "1/1", [true, false, false]);
    expect(isReleased(s, "japan")).toBe(true);
    expect(isReleased(s, "global")).toBe(false);
  });
});

describe("SchaleDB enum mapping", () => {
  it("maps every value present in the dataset", () => {
    expect(toAtkType("Explosion")).toBe("explosive");
    expect(toAtkType("Pierce")).toBe("piercing");
    expect(toAtkType("Mystic")).toBe("mystic");
    expect(toAtkType("Sonic")).toBe("sonic");
    expect(toDefType("LightArmor")).toBe("light");
    expect(toDefType("HeavyArmor")).toBe("heavy");
    expect(toDefType("Unarmed")).toBe("special");
    expect(toDefType("ElasticArmor")).toBe("elastic");
    expect(toDefType("CompositeArmor")).toBe("composite");
  });

  it("returns null for a value we have no icon for", () => {
    // Enemy-only types, and anything SchaleDB adds later.
    expect(toAtkType("Normal")).toBeNull();
    expect(toDefType("Structure")).toBeNull();
  });
});

describe("filterStudents", () => {
  const roster = [
    { ...student(1, "Aru", "3/12"), School: "Gehenna", StarGrade: 3 },
    {
      ...student(2, "Hina", "2/19", [true, false, false]),
      School: "Gehenna",
      StarGrade: 3,
      BulletType: "Mystic",
      ArmorType: "HeavyArmor",
    },
    { ...student(3, "Hoshino", "1/2"), School: "Abydos", StarGrade: 1 },
  ];

  it("returns everything with no constraints", () => {
    expect(filterStudents(roster, {})).toHaveLength(3);
  });

  it("filters by rarity, school, and damage types", () => {
    expect(filterStudents(roster, { rarities: [1] }).map((s) => s.Name)).toEqual([
      "Hoshino",
    ]);
    expect(filterStudents(roster, { schools: ["Abydos"] })).toHaveLength(1);
    expect(filterStudents(roster, { atkTypes: ["mystic"] }).map((s) => s.Name)).toEqual(
      ["Hina"],
    );
    expect(filterStudents(roster, { defTypes: ["heavy"] }).map((s) => s.Name)).toEqual(
      ["Hina"],
    );
  });

  it("combines facets as AND", () => {
    expect(
      filterStudents(roster, { schools: ["Gehenna"], rarities: [1] }),
    ).toHaveLength(0);
  });

  it("drops students unreleased in the chosen region", () => {
    expect(filterStudents(roster, { region: "global" }).map((s) => s.Name)).toEqual([
      "Aru",
      "Hoshino",
    ]);
  });

  it("searches the English name and the localized one", () => {
    expect(filterStudents(roster, { query: "aru" })).toHaveLength(1);
    expect(filterStudents(roster, { query: "  HOSHI " })).toHaveLength(1);
    const localized = (s: (typeof roster)[number]) =>
      s.Id === 2 ? "ヒナ" : s.Name;
    expect(filterStudents(roster, { query: "ヒナ" }, localized)).toHaveLength(1);
    expect(filterStudents(roster, { query: "nobody" })).toHaveLength(0);
  });
});

describe("schoolsOf", () => {
  it("orders by population, then name", () => {
    const roster = [
      { ...student(1, "A", "1/1"), School: "Gehenna" },
      { ...student(2, "B", "1/1"), School: "Gehenna" },
      { ...student(3, "C", "1/1"), School: "Abydos" },
      { ...student(4, "D", "1/1"), School: "Trinity" },
    ];
    expect(schoolsOf(roster)).toEqual(["Gehenna", "Abydos", "Trinity"]);
  });
});

describe("selectLiveGachas", () => {
  const now = new Date("2026-08-26T12:00:00Z");
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const aru = student(1, "Aru", "3/12");
  const byId = { 1: aru };
  const withGacha = (gachas: unknown[]) => ({
    regions: [{}, { CurrentGacha: gachas }, {}],
  }) as Parameters<typeof selectLiveGachas>[0];

  it("resolves a running window to its students", () => {
    const live = selectLiveGachas(
      withGacha([
        { characters: [1], start: nowSeconds - 100, end: nowSeconds + 3600 },
      ]),
      byId,
      now,
    );
    expect(live).toHaveLength(1);
    expect(live[0].students).toEqual([aru]);
    expect(live[0].secondsLeft).toBe(3600);
  });

  it("drops a window upstream left in place after it ended", () => {
    expect(
      selectLiveGachas(
        withGacha([
          { characters: [1], start: nowSeconds - 7200, end: nowSeconds - 1 },
        ]),
        byId,
        now,
      ),
    ).toEqual([]);
  });

  it("drops a window whose students this build does not know", () => {
    expect(
      selectLiveGachas(
        withGacha([
          { characters: [999], start: nowSeconds, end: nowSeconds + 3600 },
        ]),
        byId,
        now,
      ),
    ).toEqual([]);
  });

  it("keeps the students it recognises out of a mixed window", () => {
    const live = selectLiveGachas(
      withGacha([
        { characters: [1, 999], start: nowSeconds, end: nowSeconds + 60 },
      ]),
      byId,
      now,
    );
    expect(live[0].students).toEqual([aru]);
  });

  // Everything below would otherwise be a crash on the app's busiest screen.
  it("returns empty rather than throwing on malformed data", () => {
    expect(selectLiveGachas(null, byId, now)).toEqual([]);
    expect(selectLiveGachas(undefined, byId, now)).toEqual([]);
    expect(selectLiveGachas({}, byId, now)).toEqual([]);
    expect(selectLiveGachas({ regions: [] }, byId, now)).toEqual([]);
    expect(selectLiveGachas({ regions: [{}, {}, {}] }, byId, now)).toEqual([]);
    expect(
      selectLiveGachas(
        { regions: [{}, { CurrentGacha: "nope" }, {}] } as never,
        byId,
        now,
      ),
    ).toEqual([]);
    expect(selectLiveGachas(withGacha([null, undefined, {}]), byId, now)).toEqual(
      [],
    );
    expect(
      selectLiveGachas(withGacha([{ start: nowSeconds }]), byId, now),
    ).toEqual([]);
    expect(
      selectLiveGachas(
        withGacha([{ start: nowSeconds, end: nowSeconds + 60 }]),
        byId,
        now,
      ),
    ).toEqual([]);
  });

  it("reads the region asked for", () => {
    const config = {
      regions: [
        { CurrentGacha: [{ characters: [1], start: 0, end: nowSeconds + 60 }] },
        { CurrentGacha: [] },
        {},
      ],
    };
    expect(selectLiveGachas(config, byId, now, "japan")).toHaveLength(1);
    expect(selectLiveGachas(config, byId, now, "global")).toEqual([]);
  });
});
