import {
  MAX_IMPORT_LENGTH,
  MAX_ROSTER_ENTRIES,
  countOwnedUnits,
  exportRoster,
  mergeRoster,
  normalizeRoster,
  normalizeRosterEntry,
  ownsUnit,
  parseRosterText,
  setRosterEntry,
  unitEntry,
  unitIdOf,
  type Roster,
} from "../roster";

const NOW = 1_793_000_000_000;

describe("normalizeRosterEntry", () => {
  it("keeps a valid entry", () => {
    expect(normalizeRosterEntry({ stars: 5, ue: 3, at: 42 })).toEqual({ stars: 5, ue: 3, at: 42 });
    expect(normalizeRosterEntry({ stars: 2, at: 1 })).toEqual({ stars: 2, at: 1 });
  });

  it.each([null, "5", [], {}, { stars: 0 }, { stars: 6 }, { stars: 3.5 }, { stars: "x" }])(
    "drops %p",
    (raw) => {
      expect(normalizeRosterEntry(raw)).toBeNull();
    },
  );

  it("drops a weapon grade below 5★ and a zero grade, but keeps the student", () => {
    expect(normalizeRosterEntry({ stars: 4, ue: 2, at: 1 })).toEqual({ stars: 4, at: 1 });
    expect(normalizeRosterEntry({ stars: 5, ue: 0, at: 1 })).toEqual({ stars: 5, at: 1 });
  });

  it("drops an out-of-range weapon grade without losing the student", () => {
    expect(normalizeRosterEntry({ stars: 5, ue: 9, at: 1 })).toEqual({ stars: 5, at: 1 });
    expect(normalizeRosterEntry({ stars: 5, ue: "max", at: 1 })).toEqual({ stars: 5, at: 1 });
  });

  it("defaults a missing or nonsense timestamp to 0", () => {
    expect(normalizeRosterEntry({ stars: 3 })).toEqual({ stars: 3, at: 0 });
    expect(normalizeRosterEntry({ stars: 3, at: "today" })).toEqual({ stars: 3, at: 0 });
    expect(normalizeRosterEntry({ stars: 3, at: -5 })).toEqual({ stars: 3, at: 0 });
  });

  it("accepts numeric strings written by hand", () => {
    expect(normalizeRosterEntry({ stars: "5", ue: "1", at: 7 })).toEqual({ stars: 5, ue: 1, at: 7 });
  });
});

describe("normalizeRoster", () => {
  it("keeps canonical student-id keys only", () => {
    const roster = normalizeRoster({
      "10000": { stars: 3, at: 1 },
      "010001": { stars: 3, at: 1 },
      abc: { stars: 3, at: 1 },
      "-5": { stars: 3, at: 1 },
      "10002": { stars: 9 },
      "10003": null,
    });
    expect(roster).toEqual({ "10000": { stars: 3, at: 1 } });
  });

  it.each([null, undefined, "roster", [1, 2], 5])("is empty for %p", (raw) => {
    expect(normalizeRoster(raw)).toEqual({});
  });

  it("bounds a runaway blob", () => {
    const raw: Record<string, unknown> = {};
    for (let i = 1; i <= MAX_ROSTER_ENTRIES + 50; i++) raw[String(i)] = { stars: 1 };
    expect(Object.keys(normalizeRoster(raw))).toHaveLength(MAX_ROSTER_ENTRIES);
  });
});

describe("setRosterEntry", () => {
  it("adds, updates and clears", () => {
    let roster: Roster = {};
    roster = setRosterEntry(roster, 10000, { stars: 3 }, NOW);
    expect(roster).toEqual({ "10000": { stars: 3, at: NOW } });
    roster = setRosterEntry(roster, 10000, { stars: 5, ue: 2 }, NOW + 1);
    expect(roster["10000"]).toEqual({ stars: 5, ue: 2, at: NOW + 1 });
    roster = setRosterEntry(roster, 10000, null, NOW + 2);
    expect(roster).toEqual({});
  });

  it("clamps what a stepper hands it", () => {
    expect(setRosterEntry({}, 1, { stars: 9, ue: 7 }, NOW)["1"]).toEqual({ stars: 5, ue: 4, at: NOW });
    expect(setRosterEntry({}, 1, { stars: -3 }, NOW)["1"]).toEqual({ stars: 1, at: NOW });
    expect(setRosterEntry({}, 1, { stars: Number.NaN }, NOW)["1"]).toEqual({ stars: 1, at: NOW });
  });

  it("ignores a weapon grade below 5★", () => {
    expect(setRosterEntry({}, 1, { stars: 3, ue: 2 }, NOW)["1"]).toEqual({ stars: 3, at: NOW });
  });

  it("returns the same object for a no-op, so nothing is written", () => {
    const roster: Roster = { "1": { stars: 3, at: 5 } };
    expect(setRosterEntry(roster, 1, { stars: 3 }, NOW)).toBe(roster);
    expect(setRosterEntry(roster, 2, null, NOW)).toBe(roster);
    expect(setRosterEntry(roster, -1, { stars: 5 }, NOW)).toBe(roster);
    expect(setRosterEntry(roster, 1.5, { stars: 5 }, NOW)).toBe(roster);
  });

  it("does not mutate its input", () => {
    const roster: Roster = { "1": { stars: 3, at: 5 } };
    setRosterEntry(roster, 1, { stars: 4 }, NOW);
    setRosterEntry(roster, 1, null, NOW);
    expect(roster).toEqual({ "1": { stars: 3, at: 5 } });
  });
});

describe("exportRoster / parseRosterText", () => {
  const roster: Roster = {
    "10010": { stars: 5, ue: 3, at: 1 },
    "10001": { stars: 3, at: 1 },
    "20000": { stars: 5, at: 1 },
  };

  it("exports a compact, sorted, versioned line", () => {
    expect(exportRoster(roster)).toBe("BAT1 10001:3 10010:5:3 20000:5");
    expect(exportRoster({})).toBe("BAT1");
  });

  it("round-trips", () => {
    const parsed = parseRosterText(exportRoster(roster));
    expect(parsed).toEqual({
      ok: true,
      count: 3,
      entries: { "10001": { stars: 3 }, "10010": { stars: 5, ue: 3 }, "20000": { stars: 5 } },
    });
  });

  it("accepts an empty export as a valid zero-student roster", () => {
    expect(parseRosterText("BAT1")).toEqual({ ok: true, count: 0, entries: {} });
  });

  it("finds the header inside surrounding chat text, with any separators", () => {
    const parsed = parseRosterText("my roster: bat1\n10001:3, 10002:4;10003:5:1\n");
    expect(parsed).toMatchObject({ ok: true, count: 3 });
  });

  it("keeps the higher grade when a student is listed twice", () => {
    const parsed = parseRosterText("BAT1 10001:5:1 10001:3 10001:5:2");
    expect(parsed).toMatchObject({ ok: true, count: 1, entries: { "10001": { stars: 5, ue: 2 } } });
  });

  it.each<[unknown, string]>([
    ["", "empty"],
    ["   \n", "empty"],
    [null, "empty"],
    [42, "empty"],
    ["10001:3 10002:4", "header"],
    ["BAT 10001:3", "header"],
    ["XBAT1 10001:3", "header"],
    ["BAT10001:3", "header"],
    ["BAT2 10001:3", "version"],
    ["BAT1 10001:6", "entry"],
    ["BAT1 10001:3 hello", "entry"],
    ["BAT1 0:3", "entry"],
    ["BAT1 10001:5:5", "entry"],
    ["BAT1 10001", "entry"],
    ["BAT1 " + "1:1 ".repeat(MAX_ROSTER_ENTRIES + 1), "tooLarge"],
    ["BAT1 " + "x".repeat(MAX_IMPORT_LENGTH), "tooLarge"],
  ])("rejects %p as %s", (text, reason) => {
    expect(parseRosterText(text)).toEqual({ ok: false, reason });
  });
});

describe("mergeRoster", () => {
  it("adds new students and keeps the higher grade on either side", () => {
    const roster: Roster = {
      "1": { stars: 5, ue: 2, at: 1 },
      "2": { stars: 2, at: 1 },
    };
    const merged = mergeRoster(
      roster,
      { "1": { stars: 3 }, "2": { stars: 4 }, "3": { stars: 1 } },
      NOW,
    );
    expect(merged).toEqual({
      "1": { stars: 5, ue: 2, at: 1 },
      "2": { stars: 4, at: NOW },
      "3": { stars: 1, at: NOW },
    });
  });

  it("raises only the weapon when that is what is newer", () => {
    const merged = mergeRoster({ "1": { stars: 5, ue: 1, at: 1 } }, { "1": { stars: 5, ue: 3 } }, NOW);
    expect(merged["1"]).toEqual({ stars: 5, ue: 3, at: NOW });
  });

  it("returns the same object when the import teaches it nothing", () => {
    const roster: Roster = { "1": { stars: 5, at: 1 } };
    expect(mergeRoster(roster, { "1": { stars: 2 } }, NOW)).toBe(roster);
    expect(mergeRoster(roster, {}, NOW)).toBe(roster);
    expect(mergeRoster(roster, { nope: { stars: 5 } }, NOW)).toBe(roster);
  });

  it("does not mutate its input", () => {
    const roster: Roster = { "1": { stars: 1, at: 1 } };
    mergeRoster(roster, { "1": { stars: 5 } }, NOW);
    expect(roster).toEqual({ "1": { stars: 1, at: 1 } });
  });
});

describe("multi-form units", () => {
  // Hoshino (Armed): one recruit, two SchaleDB records.
  const dealer = { Id: 10098, LinkedCharacterId: 10099 };
  const tank = { Id: 10099, LinkedCharacterId: 10098 };
  const plain = { Id: 10000 };

  it("names a unit by its lower id", () => {
    expect(unitIdOf(dealer)).toBe(10098);
    expect(unitIdOf(tank)).toBe(10098);
    expect(unitIdOf(plain)).toBe(10000);
  });

  it("treats either form as owning the unit", () => {
    const roster: Roster = { "10099": { stars: 4, at: 1 } };
    expect(ownsUnit(roster, dealer)).toBe(true);
    expect(ownsUnit(roster, tank)).toBe(true);
    expect(ownsUnit(roster, plain)).toBe(false);
  });

  it("reports the higher grade when both forms are marked", () => {
    const roster: Roster = { "10098": { stars: 3, at: 1 }, "10099": { stars: 5, at: 1 } };
    expect(unitEntry(roster, dealer)?.stars).toBe(5);
    expect(unitEntry(roster, tank)?.stars).toBe(5);
  });

  it("keeps the higher weapon grade across linked forms with equal stars", () => {
    const roster: Roster = { "10098": { stars: 5, ue: 1, at: 1 }, "10099": { stars: 5, ue: 4, at: 2 } };
    expect(unitEntry(roster, dealer)?.ue).toBe(4);
    expect(unitEntry(roster, tank)?.ue).toBe(4);
  });

  it("counts the pair once in collection stats", () => {
    const students = [dealer, tank, plain];
    expect(countOwnedUnits({}, students)).toEqual({ owned: 0, total: 2 });
    expect(countOwnedUnits({ "10098": { stars: 3, at: 1 } }, students)).toEqual({ owned: 1, total: 2 });
    expect(
      countOwnedUnits({ "10098": { stars: 3, at: 1 }, "10099": { stars: 3, at: 1 }, "10000": { stars: 1, at: 1 } }, students),
    ).toEqual({ owned: 2, total: 2 });
  });
});
