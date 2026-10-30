import {
  normalizeBanner,
  normalizeBanners,
  normalizeCharacter,
  normalizeTranslations,
  studentIdFromImage,
  toAtkType,
  toBannerType,
  toCharacterClass,
  toDefType,
} from "../normalize";
import type { RawDoc } from "../types";

const MIRROR = (id: number) => `https://blue-archive-tool.web.app/icons/${id}.webp`;

// Shaped like a real Firestore character doc / embedded copy.
const hikari = {
  id: "char-hikari",
  studentId: 10101,
  name: "Hikari",
  image: MIRROR(10101),
  rarity: 3,
  atkType: "explosive",
  defType: "light",
  class: "Striker",
  isNew: true,
  isLimited: true,
  translations: { ja: { name: "ヒカリ" }, ko: { name: "히카리" }, zh: { name: "光" } },
};

const nozomi = {
  id: "char-nozomi",
  studentId: 10102,
  name: "Nozomi",
  image: MIRROR(10102),
  rarity: 3,
  atkType: "piercing",
  defType: "heavy",
  class: "special",
  isNew: true,
  isLimited: true,
  translations: {},
};

const bannerDoc = (overrides: Record<string, unknown> = {}) => ({
  startDate: "2026-10-27",
  endDate: "2026-11-03",
  type: "New",
  characterIds: ["char-hikari", "char-nozomi"],
  characters: [hikari, nozomi],
  ...overrides,
});

describe("enum mapping", () => {
  it("maps banner types case-insensitively and styles unknown ones as Rerun", () => {
    expect(toBannerType("New")).toBe("New");
    expect(toBannerType("fes")).toBe("Fes");
    expect(toBannerType(" FEST ")).toBe("Fes");
    expect(toBannerType("Collab")).toBe("Collab");
    expect(toBannerType("re-run")).toBe("Rerun");
    expect(toBannerType("Recollection")).toBe("Rerun");
    expect(toBannerType("")).toBe("Rerun");
  });

  it("accepts the app's and SchaleDB's spellings for attack and armor", () => {
    expect(toAtkType("explosive")).toBe("explosive");
    expect(toAtkType("Explosion")).toBe("explosive");
    expect(toAtkType("PIERCE")).toBe("piercing");
    expect(toAtkType("Mystic")).toBe("mystic");
    expect(toAtkType("laser")).toBeNull();
    expect(toAtkType(5)).toBeNull();
    expect(toAtkType(null)).toBeNull();

    expect(toDefType("LightArmor")).toBe("light");
    expect(toDefType("Unarmed")).toBe("special");
    expect(toDefType("composite armor")).toBe("composite");
    expect(toDefType("ElasticArmor")).toBe("elastic");
    expect(toDefType("paper")).toBeNull();
    expect(toDefType({})).toBeNull();
  });

  it("lower-cases class and understands SchaleDB squad types", () => {
    expect(toCharacterClass("Striker")).toBe("striker");
    expect(toCharacterClass("SPECIAL")).toBe("special");
    expect(toCharacterClass("Main")).toBe("striker");
    expect(toCharacterClass("Support")).toBe("special");
    expect(toCharacterClass("tank")).toBeNull();
    expect(toCharacterClass(undefined)).toBeNull();
  });
});

describe("normalizeTranslations", () => {
  it("reads Firestore's {name} objects and plain strings", () => {
    expect(
      normalizeTranslations({ ja: { name: " ヒカリ " }, ko: "히카리", zh: { name: 5 } }),
    ).toEqual({ ja: "ヒカリ", ko: "히카리" });
  });

  it("falls back to legacy locale keys only when the canonical one is absent", () => {
    expect(normalizeTranslations({ jp: "A", kr: { name: "B" }, cn: "C" })).toEqual({
      ja: "A",
      ko: "B",
      zh: "C",
    });
    expect(normalizeTranslations({ ja: "canonical", jp: "legacy" })).toEqual({
      ja: "canonical",
    });
  });

  it.each([null, undefined, "ja", 7, [], [{ name: "x" }]])("is {} for %p", (raw) => {
    expect(normalizeTranslations(raw)).toEqual({});
  });
});

describe("studentIdFromImage", () => {
  it("recovers the id from our mirror and from SchaleDB", () => {
    expect(studentIdFromImage(MIRROR(10101))).toBe(10101);
    expect(
      studentIdFromImage("https://schaledb.com/images/student/icon/20061.webp"),
    ).toBe(20061);
    expect(
      studentIdFromImage("https://schaledb.com/images/student/portrait/10000.webp?v=2"),
    ).toBe(10000);
  });

  it("ignores lookalike hosts and other paths", () => {
    expect(studentIdFromImage("https://evil.example/icons/10101.webp")).toBeUndefined();
    expect(
      studentIdFromImage("https://blue-archive-tool.web.app.evil/icons/1.webp"),
    ).toBeUndefined();
    expect(studentIdFromImage("https://static.wikitide.net/x/10101.png")).toBeUndefined();
  });
});

describe("normalizeCharacter", () => {
  it("normalizes a well-formed doc", () => {
    expect(normalizeCharacter(hikari)).toEqual({
      id: "char-hikari",
      studentId: 10101,
      name: "Hikari",
      image: MIRROR(10101),
      rarity: 3,
      atkType: "explosive",
      defType: "light",
      cls: "striker",
      isNew: true,
      isLimited: true,
      translations: { ja: "ヒカリ", ko: "히카리", zh: "光" },
    });
  });

  it.each([null, undefined, 42, "Hikari", [], [hikari], true])(
    "drops a non-object %p",
    (raw) => {
      expect(normalizeCharacter(raw)).toBeNull();
    },
  );

  it("drops a character with neither a name nor a student id", () => {
    expect(normalizeCharacter({ id: "x", image: "" })).toBeNull();
    expect(normalizeCharacter({ id: "x", name: 42 })).toBeNull();
    expect(normalizeCharacter({ id: "x", name: "   " })).toBeNull();
  });

  it("keeps a nameless character that can be looked up by student id", () => {
    const c = normalizeCharacter({ id: "x", studentId: 10101 });
    expect(c).toMatchObject({ id: "x", studentId: 10101, name: "" });
  });

  it("borrows a name from translations when the name field is missing", () => {
    expect(normalizeCharacter({ id: "x", translations: { en: "Aris" } })?.name).toBe("Aris");
    expect(
      normalizeCharacter({ id: "x", translations: { ja: { name: "アリス" } } })?.name,
    ).toBe("アリス");
  });

  it("defaults every optional field to a safe value", () => {
    expect(normalizeCharacter({ name: "Mystery" }, "fallback-id")).toEqual({
      id: "fallback-id",
      name: "Mystery",
      image: "",
      rarity: 3,
      atkType: null,
      defType: null,
      cls: null,
      isNew: false,
      isLimited: false,
      translations: {},
    });
  });

  it("coerces numeric strings and rejects nonsense numbers", () => {
    expect(normalizeCharacter({ name: "A", studentId: "10101", rarity: "2" })).toMatchObject({
      studentId: 10101,
      rarity: 2,
    });
    const bad = normalizeCharacter({ name: "A", studentId: -1, rarity: 9 });
    expect(bad?.studentId).toBeUndefined();
    expect(bad?.rarity).toBe(3);
    expect(normalizeCharacter({ name: "A", studentId: 1.5 })?.studentId).toBeUndefined();
    expect(normalizeCharacter({ name: "A", studentId: "abc" })?.studentId).toBeUndefined();
    expect(normalizeCharacter({ name: "A", rarity: 2.5 })?.rarity).toBe(3);
  });

  it("recovers studentId from the icon URL for docs linked before the field existed", () => {
    expect(normalizeCharacter({ name: "Hikari", image: MIRROR(10101) })?.studentId).toBe(10101);
  });

  it("refuses non-http image URLs", () => {
    expect(normalizeCharacter({ name: "A", image: "javascript:alert(1)" })?.image).toBe("");
    expect(normalizeCharacter({ name: "A", image: "data:image/png;base64,xx" })?.image).toBe("");
    expect(normalizeCharacter({ name: "A", image: 12 })?.image).toBe("");
  });

  it("only treats true / 1 / 'true' as true for flags", () => {
    expect(normalizeCharacter({ name: "A", isNew: "true", isLimited: 1 })).toMatchObject({
      isNew: true,
      isLimited: true,
    });
    expect(normalizeCharacter({ name: "A", isNew: "yes", isLimited: "false" })).toMatchObject({
      isNew: false,
      isLimited: false,
    });
  });

  it("uses a numeric id as a string and caps absurd name lengths", () => {
    const c = normalizeCharacter({ id: 17, name: "x".repeat(5000) });
    expect(c?.id).toBe("17");
    expect(c?.name.length).toBe(120);
  });
});

describe("normalizeBanner", () => {
  const characters = new Map<string, unknown>([
    ["char-hikari", hikari],
    ["char-nozomi", nozomi],
  ]);

  it("normalizes a doc into the §5 shape with 02:00 UTC instants", () => {
    const banner = normalizeBanner("b1", bannerDoc(), characters);
    expect(banner).toMatchObject({
      id: "b1",
      type: "New",
      rawType: "New",
      startDate: "2026-10-27",
      endDate: "2026-11-03",
      startAt: Date.UTC(2026, 9, 27, 2),
      endAt: Date.UTC(2026, 10, 3, 2),
    });
    expect(banner?.characters.map((c) => c.id)).toEqual(["char-hikari", "char-nozomi"]);
  });

  it.each([
    ["no id", undefined, bannerDoc()],
    ["empty id", "  ", bannerDoc()],
    ["null data", "b", null],
    ["array data", "b", [bannerDoc()]],
    ["missing start", "b", bannerDoc({ startDate: undefined })],
    ["unparseable end", "b", bannerDoc({ endDate: "soon" })],
    ["end before start", "b", bannerDoc({ endDate: "2026-10-20" })],
    ["zero-length", "b", bannerDoc({ endDate: "2026-10-27" })],
    ["numeric dates", "b", bannerDoc({ startDate: 1, endDate: 2 })],
  ])("drops a banner with %s", (_label, id, data) => {
    expect(normalizeBanner(id, data, characters)).toBeNull();
  });

  it("keeps the raw type and styles an unknown or missing one as Rerun", () => {
    expect(normalizeBanner("b", bannerDoc({ type: "Recollection" }))).toMatchObject({
      type: "Rerun",
      rawType: "Recollection",
    });
    expect(normalizeBanner("b", bannerDoc({ type: undefined }))).toMatchObject({
      type: "Rerun",
      rawType: "",
    });
    expect(normalizeBanner("b", bannerDoc({ type: 7 }))).toMatchObject({
      type: "Rerun",
      rawType: "",
    });
    expect(normalizeBanner("b", bannerDoc({ type: "fes" }))?.type).toBe("Fes");
  });

  it("prefers the characters collection, filling gaps from the embedded copy", () => {
    const joined = new Map<string, unknown>([
      // A newer name in the collection, but no studentId yet.
      ["char-hikari", { name: "Hikari (New)", studentId: null, class: "striker" }],
    ]);
    const banner = normalizeBanner("b", bannerDoc(), joined);
    expect(banner?.characters[0]).toMatchObject({
      id: "char-hikari",
      name: "Hikari (New)",
      studentId: 10101,
    });
    // Not in the collection at all: the embedded copy stands in for it.
    expect(banner?.characters[1]).toMatchObject({ id: "char-nozomi", name: "Nozomi" });
  });

  it("does not let a stray id field inside a joined doc override the doc id", () => {
    const joined = new Map<string, unknown>([["char-hikari", { ...hikari, id: "other" }]]);
    const banner = normalizeBanner("b", bannerDoc({ characterIds: ["char-hikari"] }), joined);
    expect(banner?.characters.map((c) => c.id)).toEqual(["char-hikari"]);
  });

  it("falls back to the embedded list when no characterId resolves", () => {
    const banner = normalizeBanner(
      "b",
      bannerDoc({ characterIds: ["ghost-1", "ghost-2"] }),
      new Map(),
    );
    expect(banner?.characters.map((c) => c.name)).toEqual(["Hikari", "Nozomi"]);
  });

  it.each([
    ["absent", undefined],
    ["a string", "char-hikari"],
    ["an object", { 0: "char-hikari" }],
    ["full of junk", [null, 3.5, {}, "", true]],
  ])("survives characterIds being %s", (_label, characterIds) => {
    const banner = normalizeBanner("b", bannerDoc({ characterIds }), characters);
    expect(banner?.characters.map((c) => c.id)).toEqual(["char-hikari", "char-nozomi"]);
  });

  it.each([
    ["absent", undefined, []],
    ["null", null, []],
    ["a string", "Hikari", []],
    ["full of junk", [null, 1, "x", [], { nope: true }, hikari], ["char-hikari"]],
  ])("survives characters being %s", (_label, embedded, ids) => {
    const banner = normalizeBanner(
      "b",
      bannerDoc({ characterIds: undefined, characters: embedded }),
    );
    expect(banner).not.toBeNull();
    expect(banner?.characters.map((c) => c.id)).toEqual(ids);
  });

  it("de-duplicates characters listed twice", () => {
    const banner = normalizeBanner(
      "b",
      bannerDoc({ characterIds: ["char-hikari", "char-hikari", "char-nozomi"] }),
      characters,
    );
    expect(banner?.characters.map((c) => c.id)).toEqual(["char-hikari", "char-nozomi"]);
  });

  it("gives id-less embedded characters stable, distinct ids", () => {
    const banner = normalizeBanner(
      "b9",
      bannerDoc({ characterIds: [], characters: [{ name: "A" }, { name: "B" }] }),
    );
    expect(banner?.characters.map((c) => c.id)).toEqual(["b9-0", "b9-1"]);
  });

  it("bounds a runaway characters array", () => {
    const many = Array.from({ length: 500 }, (_, i) => ({ id: `c${i}`, name: `S${i}` }));
    const banner = normalizeBanner("b", bannerDoc({ characterIds: [], characters: many }));
    expect(banner?.characters).toHaveLength(40);
  });

  it("is idempotent, which is what lets the cache re-validate itself", () => {
    const once = normalizeBanner("b1", bannerDoc(), characters)!;
    const twice = normalizeBanner(once.id, JSON.parse(JSON.stringify(once)));
    expect(twice).toEqual(once);

    const odd = normalizeBanner("b2", bannerDoc({ type: "", characters: [{ studentId: 5 }] }))!;
    expect(normalizeBanner(odd.id, JSON.parse(JSON.stringify(odd)))).toEqual(odd);
  });

  it("keeps a banner whose characters all failed, as an empty slot", () => {
    const banner = normalizeBanner("b", bannerDoc({ characterIds: [], characters: [null] }));
    expect(banner?.characters).toEqual([]);
  });

  it("accepts Firestore Timestamps for the dates", () => {
    const start = Date.UTC(2026, 9, 27, 2);
    const banner = normalizeBanner(
      "b",
      bannerDoc({
        startDate: { seconds: start / 1000, nanoseconds: 0 },
        endDate: { toMillis: () => start + 7 * 86_400_000 },
      }),
    );
    expect(banner?.startAt).toBe(start);
    expect(banner?.startDate).toBe("2026-10-27T02:00:00.000Z");
    expect(banner?.endDate).toBe("2026-11-03T02:00:00.000Z");
  });
});

describe("normalizeBanners", () => {
  const charDocs: RawDoc[] = [
    { id: "char-hikari", data: hikari },
    { id: "char-nozomi", data: nozomi },
  ];

  it("sorts by start, drops bad docs and keeps the first of a duplicate id", () => {
    const docs = [
      { id: "late", data: bannerDoc({ startDate: "2026-11-03", endDate: "2026-11-10" }) },
      { id: "bad", data: bannerDoc({ startDate: "tbd" }) },
      null,
      { id: 7, data: null },
      { id: "early", data: bannerDoc() },
      { id: "early", data: bannerDoc({ type: "Fes" }) },
    ] as unknown as RawDoc[];
    const banners = normalizeBanners(docs, charDocs);
    expect(banners.map((b) => b.id)).toEqual(["early", "late"]);
    expect(banners[0].type).toBe("New");
  });

  it("joins against the characters collection", () => {
    const [banner] = normalizeBanners([{ id: "b", data: bannerDoc({ characters: [] }) }], charDocs);
    expect(banner.characters.map((c) => c.name)).toEqual(["Hikari", "Nozomi"]);
  });

  it("returns [] for nothing", () => {
    expect(normalizeBanners([], [])).toEqual([]);
  });
});
