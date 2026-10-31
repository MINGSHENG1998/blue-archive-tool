// SchaleDB HTTP client. Pure fetch + shape checks; no React, no storage, no
// native modules — so the snapshot generator script can reuse it verbatim and
// the runtime and the bundled asset can never drift apart.

import type {
  EliminateArmors,
  GameConfig,
  GameLocalization,
  GameRaids,
  GameStudent,
  LocalizationSection,
  NameMap,
  RaidNames,
  RegionSchedule,
  TypeEffectiveness,
} from "./types";

const BASE = "https://schaledb.com";

/** App locale -> SchaleDB path segment. `zh`, `tw` and `cn` are three different datasets upstream; the backoffice syncs `zh`, so the app must use `zh` too or names diverge between screens. */
export const LOCALE_TO_LANG = {
  en: "en",
  ja: "jp",
  ko: "kr",
  zh: "zh",
  vi: "vi",
  th: "th",
} as const;

export type GameLocale = keyof typeof LOCALE_TO_LANG;

/** Locales carried as name-only overlays on top of the English base. */
export const OVERLAY_LOCALES = ["ja", "ko", "zh", "vi", "th"] as const;

/** Every locale the app can render, English included. */
export const ALL_LOCALES = ["en", "ja", "ko", "zh", "vi", "th"] as const;

// --- Untranslated fallbacks ----------------------------------------------
// SchaleDB's community datasets fill what nobody has translated yet with the
// Japanese original rather than leaving it out: the Oct 2026 vi roster has 80
// names like "アリス（メイド）", its raid file names nearly every boss in
// katakana, and th spells one student "ツムギ". Shown as-is, a Vietnamese
// Sensei reads Japanese. Dropped here, the entry falls back to English like
// any other gap in an overlay.

// Kana letters (the ・ middle dot U+30FB is punctuation Thai titles borrow,
// so it is spared), CJK ideographs and Hangul syllables.
const CJK_LETTERS = /[\u3041-\u30fa\u30fc-\u30ff\u3400-\u9fff\uac00-\ud7af]/;

/**
 * Overlay locales written in a script of their own, where CJK text is a
 * stand-in, not a translation. English is deliberately not one: it is the
 * base and the last fallback, and its Japanese titles for JP-only events are
 * the only title those events have — dropping them would show nothing.
 */
const STAND_IN_LOCALES: ReadonlySet<GameLocale> = new Set(["vi", "th"]);

/** True when `text` is upstream's Japanese stand-in for a missing `locale` translation. */
export function isUntranslated(locale: GameLocale, text: string): boolean {
  return STAND_IN_LOCALES.has(locale) && CJK_LETTERS.test(text);
}

/** The entries of a string map that really are in `locale`. */
export function dropUntranslated(
  locale: GameLocale,
  record: Record<string, string>,
): Record<string, string> {
  if (!STAND_IN_LOCALES.has(locale)) return record;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!isUntranslated(locale, value)) out[key] = value;
  }
  return out;
}

/** Localization sections every locale must carry. The file upstream has ~48 of them. */
export const LOCALIZATION_SECTIONS = [
  "SquadType",
  "BulletType",
  "ArmorType",
  "TacticRole",
  "School",
  "Club",
] as const satisfies readonly LocalizationSection[];

/** Kept when upstream has them; a locale missing one still loads. */
export const OPTIONAL_LOCALIZATION_SECTIONS = [
  "EventName",
  "IsLimited",
  "IsLimitedTooltip",
  "IsLimitedFilter",
  "AdaptationType",
] as const satisfies readonly LocalizationSection[];

export const studentIconUrl = (id: number) =>
  `${BASE}/images/student/icon/${id}.webp`;

/** Full character art, transparent background. ~120 KB, so use it sparingly. */
export const studentPortraitUrl = (id: number) =>
  `${BASE}/images/student/portrait/${id}.webp`;

/** The core student fields: every one is required. Adding one here is the single edit needed to widen the snapshot. */
export const STUDENT_FIELDS = [
  "Id",
  "Name",
  "PathName",
  "BirthDay",
  "StarGrade",
  "SquadType",
  "BulletType",
  "ArmorType",
  "School",
  "Club",
  "TacticRole",
  "Position",
  "WeaponType",
  "FavorItemTags",
  "FavorItemUniqueTags",
  "SkillMaterial",
  "SkillMaterialAmount",
  "PotentialMaterial",
  "IsReleased",
  "IsLimited",
] as const satisfies readonly (keyof GameStudent)[];

export type OptionalStudentField = Exclude<
  keyof GameStudent,
  (typeof STUDENT_FIELDS)[number]
>;

const REGION_FIELDS = [
  "Name",
  "StudentMaxLevel",
  "BondMaxLevel",
  "PotentialMax",
  "CurrentGacha",
  "CurrentEvents",
  "CurrentRaid",
] as const satisfies readonly (keyof RegionSchedule)[];

// --- Shape guards ----------------------------------------------------------
// Each returns the value when it is the shape we want and undefined otherwise,
// so a reader can be a one-liner and "absent" and "malformed" mean the same.

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const arrayOf = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;

const wholeNumber = (value: unknown): number | undefined =>
  Number.isInteger(value) && (value as number) >= 0
    ? (value as number)
    : undefined;

const positiveId = (value: unknown): number | undefined => {
  const id = wholeNumber(value);
  return id !== undefined && id > 0 ? id : undefined;
};

/** A non-empty list whose every item passes; one bad item voids the list. */
function listOf<T>(
  value: unknown,
  item: (entry: unknown) => T | undefined,
): T[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const out: T[] = [];
  for (const entry of value) {
    const parsed = item(entry);
    if (parsed === undefined) return undefined;
    out.push(parsed);
  }
  return out;
}

/** The usable strings out of a string or string list; never throws, may be empty. */
const textList = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value])
    .map(text)
    .filter((entry): entry is string => entry !== undefined);

function stringRecord(value: unknown): Record<string, string> | null {
  if (!isRecord(value)) return null;
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") out[key] = entry;
  }
  return out;
}

// --- Students --------------------------------------------------------------

type Reader<T> = (src: Record<string, unknown>) => T | undefined;

/**
 * How to read each optional student field. Validated rather than copied: a
 * malformed value drops on its own and never costs the student their place in
 * the roster, which is what a missing STUDENT_FIELDS entry does.
 */
const OPTIONAL_STUDENT_READERS: {
  [K in OptionalStudentField]-?: Reader<NonNullable<GameStudent[K]>>;
} = {
  StreetBattleAdaptation: (src) => wholeNumber(src.StreetBattleAdaptation),
  OutdoorBattleAdaptation: (src) => wholeNumber(src.OutdoorBattleAdaptation),
  IndoorBattleAdaptation: (src) => wholeNumber(src.IndoorBattleAdaptation),
  Equipment: (src) => listOf(src.Equipment, text),
  // Upstream nests the name with a long description and stat curves; the
  // name is the only part the app shows, so it is lifted out on its own.
  WeaponName: (src) => (isRecord(src.Weapon) ? text(src.Weapon.Name) : undefined),
  SchoolYear: (src) => text(src.SchoolYear),
  CharacterAge: (src) => text(src.CharacterAge),
  CharHeightMetric: (src) => text(src.CharHeightMetric),
  Hobby: (src) => text(src.Hobby),
  Illustrator: (src) => text(src.Illustrator),
  CharacterVoice: (src) => text(src.CharacterVoice),
  MemoryLobby: (src) => listOf(src.MemoryLobby, wholeNumber),
  LinkedCharacterId: (src) => {
    const id = positiveId(src.LinkedCharacterId);
    return id !== src.Id ? id : undefined;
  },
};

/** Every optional field trimStudent knows how to read. */
export const OPTIONAL_STUDENT_FIELDS = Object.keys(
  OPTIONAL_STUDENT_READERS,
) as OptionalStudentField[];

/**
 * Keep only the fields we use. Returns null for a record missing any core
 * field — a partial student is worse than no student, because callers would
 * have to null-check every field forever. Optional fields are kept when
 * well-formed and simply left off otherwise.
 */
export function trimStudent(raw: unknown): GameStudent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const field of STUDENT_FIELDS) {
    const value = src[field];
    if (value === undefined || value === null) return null;
    out[field] = value;
  }
  for (const field of OPTIONAL_STUDENT_FIELDS) {
    const value = OPTIONAL_STUDENT_READERS[field](src);
    if (value !== undefined) out[field] = value;
  }
  return out as unknown as GameStudent;
}

// --- Config ----------------------------------------------------------------

/** Keeps the numeric cells; drops any row or cell upstream got wrong. */
function trimTypeEffectiveness(raw: unknown): TypeEffectiveness | undefined {
  if (!isRecord(raw)) return undefined;
  const chart: TypeEffectiveness = {};
  for (const [bulletType, row] of Object.entries(raw)) {
    if (!isRecord(row)) continue;
    const cells: Record<string, number> = {};
    for (const [armorType, multiplier] of Object.entries(row)) {
      if (typeof multiplier === "number" && Number.isFinite(multiplier) && multiplier >= 0) {
        cells[armorType] = multiplier;
      }
    }
    if (Object.keys(cells).length > 0) chart[bulletType] = cells;
  }
  return Object.keys(chart).length > 0 ? chart : undefined;
}

export function trimConfig(raw: unknown): GameConfig | null {
  if (typeof raw !== "object" || raw === null) return null;
  const src = raw as Record<string, unknown>;
  if (typeof src.build !== "number" || !Array.isArray(src.Regions)) return null;
  const regions: RegionSchedule[] = [];
  for (const region of src.Regions) {
    if (typeof region !== "object" || region === null) return null;
    const source = region as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const field of REGION_FIELDS) {
      if (source[field] === undefined) return null;
      out[field] = source[field];
    }
    regions.push(out as unknown as RegionSchedule);
  }
  const typeEffectiveness = trimTypeEffectiveness(src.TypeEffectiveness);
  return typeEffectiveness
    ? { build: src.build, regions, TypeEffectiveness: typeEffectiveness }
    : { build: src.build, regions };
}

const DEFAULT_TIMEOUT_MS = 15_000;

async function getJson(path: string, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`SchaleDB ${path}: HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Cheap (~24 KB) — fetched on every refresh check to compare `build`. */
export async function fetchConfig(
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<GameConfig> {
  const config = trimConfig(await getJson("/data/config.min.json", timeoutMs));
  if (!config) throw new Error("SchaleDB config: unexpected shape");
  return config;
}

function studentsPath(locale: GameLocale) {
  return `/data/${LOCALE_TO_LANG[locale]}/students.min.json`;
}

/** Expensive (~1.7 MB raw, ~300 KB gzipped) — only after `build` has actually moved. */
export async function fetchStudents(
  locale: GameLocale = "en",
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<GameStudent[]> {
  const raw = await getJson(studentsPath(locale), timeoutMs);
  if (typeof raw !== "object" || raw === null) {
    throw new Error("SchaleDB students: unexpected shape");
  }
  const students: GameStudent[] = [];
  for (const value of Object.values(raw as Record<string, unknown>)) {
    const student = trimStudent(value);
    if (student) students.push(student);
  }
  if (students.length === 0) throw new Error("SchaleDB students: empty");
  return students;
}

/** Just `{ [studentId]: localizedName }` — the only per-locale difference we need. */
export async function fetchNameMap(
  locale: GameLocale,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<NameMap> {
  const raw = await getJson(studentsPath(locale), timeoutMs);
  if (typeof raw !== "object" || raw === null) {
    throw new Error("SchaleDB names: unexpected shape");
  }
  const names: NameMap = {};
  let named = 0;
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const name = (value as { Name?: unknown } | null)?.Name;
    if (typeof name !== "string") continue;
    named += 1;
    // A Japanese stand-in is left out, so nameFor() falls back to English.
    if (!isUntranslated(locale, name)) names[id] = name;
  }
  if (named === 0) throw new Error("SchaleDB names: empty");
  return names;
}

// --- Localization ----------------------------------------------------------

/**
 * The sections the app reads. With `locale`, entries upstream left in
 * Japanese for that locale are dropped (see isUntranslated), so the English
 * labels show through instead.
 */
export function trimLocalization(
  raw: unknown,
  locale?: GameLocale,
): GameLocalization | null {
  if (typeof raw !== "object" || raw === null) return null;
  const src = raw as Record<string, unknown>;
  const clean = (value: Record<string, string>) =>
    locale ? dropUntranslated(locale, value) : value;
  const out: Record<string, Record<string, string>> = {};
  for (const section of LOCALIZATION_SECTIONS) {
    const value = stringRecord(src[section]);
    if (!value) return null;
    out[section] = clean(value);
  }
  for (const section of OPTIONAL_LOCALIZATION_SECTIONS) {
    const value = stringRecord(src[section]);
    const kept = value ? clean(value) : null;
    if (kept && Object.keys(kept).length > 0) out[section] = kept;
  }
  return out as unknown as GameLocalization;
}

/** Enum labels (school, club, role, damage types, event titles) for one locale. */
export async function fetchLocalization(
  locale: GameLocale,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<GameLocalization> {
  const raw = await getJson(
    `/data/${LOCALE_TO_LANG[locale]}/localization.min.json`,
    timeoutMs,
  );
  const localization = trimLocalization(raw, locale);
  if (!localization) throw new Error("SchaleDB localization: unexpected shape");
  return localization;
}

// --- Raids -----------------------------------------------------------------

/**
 * Grand Assault seasons kept per region. The running season is always among
 * the newest, since upstream never carries more than the next one ahead; the
 * ~40 older ones are history the app never shows.
 */
export const ELIMINATE_SEASONS_KEPT = 4;

function trimEliminateSeasons(raw: unknown): Record<string, EliminateArmors>[] {
  return arrayOf(raw).map((region) => {
    const seasons: { id: number; armors: EliminateArmors }[] = [];
    for (const season of arrayOf(isRecord(region) ? region.EliminateSeasons : null)) {
      if (!isRecord(season)) continue;
      const id = positiveId(season.SeasonId);
      const open = isRecord(season.OpenDifficulty) ? season.OpenDifficulty : null;
      if (id === undefined || !open) continue;
      const armors: EliminateArmors = {};
      for (const [armorType, difficulty] of Object.entries(open)) {
        const tier = wholeNumber(difficulty);
        if (tier !== undefined) armors[armorType] = tier;
      }
      if (Object.keys(armors).length > 0) seasons.push({ id, armors });
    }
    seasons.sort((a, b) => b.id - a.id);
    const kept: Record<string, EliminateArmors> = {};
    for (const { id, armors } of seasons.slice(0, ELIMINATE_SEASONS_KEPT)) {
      kept[id] = armors;
    }
    return kept;
  });
}

/**
 * Raid bosses with their armor, attack and terrain. Skips any entry missing
 * one of those rather than failing the file; null only when nothing at all is
 * usable, which means upstream changed shape.
 */
export function trimRaids(raw: unknown): GameRaids | null {
  if (!isRecord(raw)) return null;

  const raid: GameRaids["raid"] = {};
  for (const entry of arrayOf(raw.Raid)) {
    if (!isRecord(entry)) continue;
    const id = positiveId(entry.Id);
    const Name = text(entry.Name);
    const ArmorType = text(entry.ArmorType);
    const BulletType = text(entry.BulletType);
    if (id === undefined || !Name || !ArmorType || !BulletType) continue;
    const BulletTypeInsane = text(entry.BulletTypeInsane);
    raid[id] = {
      Name,
      ArmorType,
      BulletType,
      ...(BulletTypeInsane ? { BulletTypeInsane } : {}),
      Terrain: textList(entry.Terrain),
    };
  }

  const multiFloor: GameRaids["multiFloor"] = {};
  for (const entry of arrayOf(raw.MultiFloorRaid)) {
    if (!isRecord(entry)) continue;
    const id = positiveId(entry.Id);
    const Name = text(entry.Name);
    const ArmorType = text(entry.ArmorType);
    // Upstream names the per-floor list `BulletType` too; renamed here so the
    // plural shows at every use site.
    const BulletTypes = textList(entry.BulletType);
    if (id === undefined || !Name || !ArmorType || BulletTypes.length === 0) continue;
    multiFloor[id] = { Name, ArmorType, BulletTypes, Terrain: textList(entry.Terrain) };
  }

  if (Object.keys(raid).length === 0 && Object.keys(multiFloor).length === 0) {
    return null;
  }
  return { raid, multiFloor, eliminate: trimEliminateSeasons(raw.RaidSeasons) };
}

/**
 * Just the boss names out of a localized raids file. With `locale`, names
 * upstream left in Japanese for it are dropped, so the English one shows.
 */
export function trimRaidNames(raw: unknown, locale?: GameLocale): RaidNames | null {
  if (!isRecord(raw)) return null;
  // Counted before the untranslated ones go: a file of nothing but Japanese
  // stand-ins is a well-formed file with nothing to add, not a broken one.
  let named = 0;
  const pick = (list: unknown) => {
    const names: Record<string, string> = {};
    for (const entry of arrayOf(list)) {
      if (!isRecord(entry)) continue;
      const id = positiveId(entry.Id);
      const name = text(entry.Name);
      if (id === undefined || !name) continue;
      named += 1;
      if (locale && isUntranslated(locale, name)) continue;
      names[id] = name;
    }
    return names;
  };
  const names = { raid: pick(raw.Raid), multiFloor: pick(raw.MultiFloorRaid) };
  return named > 0 ? names : null;
}

function raidsPath(locale: GameLocale) {
  return `/data/${LOCALE_TO_LANG[locale]}/raids.min.json`;
}

/** ~1.2 MB raw, ~70 KB gzipped — only after `build` has moved. */
export async function fetchRaids(
  locale: GameLocale = "en",
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<GameRaids> {
  const raids = trimRaids(await getJson(raidsPath(locale), timeoutMs));
  if (!raids) throw new Error("SchaleDB raids: unexpected shape");
  return raids;
}

/** The same download as fetchRaids, kept to one locale's boss names. */
export async function fetchRaidNames(
  locale: GameLocale,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<RaidNames> {
  const names = trimRaidNames(await getJson(raidsPath(locale), timeoutMs), locale);
  if (!names) throw new Error("SchaleDB raid names: unexpected shape");
  return names;
}
