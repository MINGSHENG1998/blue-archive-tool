// Pure selectors over the student list. No IO, no React — every function here
// is deterministic given its arguments, including the ones that depend on
// "today" (the date is always passed in, never read from the clock).

import type { AtkType, DefType } from "@/dto/game.dto";

import { gameDayStamp } from "./resets";
import { REGION, type GameStudent, type NameMap, type RegionKey } from "./types";

// SchaleDB's enum spellings differ from the ones this app has always used for
// banner characters. Map at the edge so screens keep a single vocabulary — and
// so the existing type icons and colours in constants/Colors.ts keep working.
const BULLET_TO_ATK: Record<string, AtkType> = {
  Explosion: "explosive",
  Pierce: "piercing",
  Mystic: "mystic",
  Sonic: "sonic",
  Chemical: "chemical",
};

const ARMOR_TO_DEF: Record<string, DefType> = {
  LightArmor: "light",
  HeavyArmor: "heavy",
  Unarmed: "special",
  ElasticArmor: "elastic",
  CompositeArmor: "composite",
};

/** Null for a value SchaleDB added that this app has no icon for yet. */
export const toAtkType = (bulletType: string): AtkType | null =>
  BULLET_TO_ATK[bulletType] ?? null;

export const toDefType = (armorType: string): DefType | null =>
  ARMOR_TO_DEF[armorType] ?? null;

export const isStriker = (student: GameStudent) => student.SquadType === "Main";

export type StudentIndex = Record<number, GameStudent>;

export function indexById(students: GameStudent[]): StudentIndex {
  const index: StudentIndex = {};
  for (const student of students) index[student.Id] = student;
  return index;
}

/**
 * Display name for a locale. Falls back to the English name whenever the
 * overlay is missing an entry — a new student appears in `en` first.
 */
export function nameFor(
  student: GameStudent,
  locale: string,
  names: Partial<Record<string, NameMap>>,
): string {
  return names[locale]?.[String(student.Id)] || student.Name;
}

export function isReleased(student: GameStudent, region: RegionKey): boolean {
  return student.IsReleased[REGION[region]] === true;
}

/**
 * SchaleDB's availability categories (`IsLimited`), as its own localization
 * defines them. The labels for each live in the IsLimited / IsLimitedFilter /
 * IsLimitedTooltip localization sections.
 */
export const LIMITED_CATEGORY = {
  /** Regular Recruitment; Eleph obtainable. */
  regular: 0,
  /** Limited-time "Unique Recruitment" only; no Eleph. */
  unique: 1,
  /** An event reward, never recruited. */
  event: 2,
  /** Limited-time "Fest Recruitment" only; no Eleph. */
  fest: 3,
  /** Archive Recruitment only; removed from the regular pool. */
  archived: 4,
} as const;

export type LimitedCategory = (typeof LIMITED_CATEGORY)[keyof typeof LIMITED_CATEGORY];

const LIMITED_VALUES = new Set<number>(Object.values(LIMITED_CATEGORY));

/**
 * The student's availability category on a server. Null for a value SchaleDB
 * added after this build, so callers never mislabel it as Regular.
 */
export function limitedCategory(
  student: GameStudent,
  region: RegionKey = "global",
): LimitedCategory | null {
  const value = student.IsLimited?.[REGION[region]];
  return typeof value === "number" && LIMITED_VALUES.has(value)
    ? (value as LimitedCategory)
    : null;
}

/**
 * Recruited only on limited-time banners (Unique or Fest). These share the
 * limited pickup pool under Recruitment Charges, apart from regular pickups.
 */
export function isLimitedPickup(
  student: GameStudent,
  region: RegionKey = "global",
): boolean {
  const category = limitedCategory(student, region);
  return category === LIMITED_CATEGORY.unique || category === LIMITED_CATEGORY.fest;
}

/** The three battlefield terrains, in the order the game lists them. */
export const TERRAINS = ["Street", "Outdoor", "Indoor"] as const;
export type Terrain = (typeof TERRAINS)[number];

/** Terrain adaptation grade by SchaleDB value: 0 = D … 5 = SS. */
export const ADAPTATION_GRADES = ["D", "C", "B", "A", "S", "SS"] as const;
export type AdaptationGrade = (typeof ADAPTATION_GRADES)[number];

const ADAPTATION_FIELD = {
  Street: "StreetBattleAdaptation",
  Outdoor: "OutdoorBattleAdaptation",
  Indoor: "IndoorBattleAdaptation",
} as const satisfies Record<Terrain, keyof GameStudent>;

/**
 * Raw adaptation value (0–5) on a terrain, or null when the snapshot does not
 * carry it — an older cache, or a terrain name upstream added later.
 */
export function terrainAdaptation(
  student: GameStudent,
  terrain: string,
): number | null {
  const field = ADAPTATION_FIELD[terrain as Terrain];
  const value = field ? student[field] : undefined;
  return typeof value === "number" ? value : null;
}

/** "SS".."D" for a raw adaptation value; null when out of range. */
export function adaptationGrade(value: number | null | undefined): AdaptationGrade | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  return ADAPTATION_GRADES[value] ?? null;
}

export interface Birthday {
  month: number;
  day: number;
}

/** SchaleDB writes birthdays as "M/D", or "-" for students who have none. */
export function parseBirthDay(raw: string): Birthday | null {
  const match = /^(\d{1,2})\/(\d{1,2})$/.exec(raw.trim());
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

/**
 * Whole days from `today` until the next occurrence of a birthday; 0 when it
 * is today. Leap-day birthdays fall back to Mar 1 in non-leap years, matching
 * how the game surfaces them.
 */
export function daysUntilBirthday(birthday: Birthday, today: Date): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
    const year = start.getFullYear() + yearOffset;
    const target = occurrenceIn(birthday, year);
    const diff = Math.round((target.getTime() - start.getTime()) / 86_400_000);
    if (diff >= 0) return diff;
  }
  return 0;
}

function occurrenceIn(birthday: Birthday, year: number): Date {
  const date = new Date(year, birthday.month - 1, birthday.day);
  // Feb 29 in a common year rolls over to Mar 1, which is what we want.
  return date;
}

export interface StudentBirthday {
  student: GameStudent;
  birthday: Birthday;
  daysUntil: number;
}

/** Students with a birthday, sorted by how soon it is. */
export function upcomingBirthdays(
  students: GameStudent[],
  today: Date,
  limit?: number,
): StudentBirthday[] {
  const entries: StudentBirthday[] = [];
  for (const student of students) {
    const birthday = parseBirthDay(student.BirthDay);
    if (!birthday) continue;
    entries.push({ student, birthday, daysUntil: daysUntilBirthday(birthday, today) });
  }
  entries.sort(
    (a, b) => a.daysUntil - b.daysUntil || a.student.Name.localeCompare(b.student.Name),
  );
  return limit === undefined ? entries : entries.slice(0, limit);
}

/** Students grouped by birthday month, 1-indexed; every month key is present. */
export function birthdaysByMonth(
  students: GameStudent[],
): Record<number, StudentBirthday[]> {
  const months: Record<number, StudentBirthday[]> = {};
  for (let month = 1; month <= 12; month++) months[month] = [];
  for (const student of students) {
    const birthday = parseBirthDay(student.BirthDay);
    if (!birthday) continue;
    months[birthday.month].push({ student, birthday, daysUntil: 0 });
  }
  for (const month of Object.values(months)) {
    month.sort((a, b) => a.birthday.day - b.birthday.day || a.student.Name.localeCompare(b.student.Name));
  }
  return months;
}

/**
 * A stable pick for the current in-game day: every player sees the same student
 * at the same moment, and it rolls over with the 04:00 JST daily reset rather
 * than at each device's local midnight. Sorted by Id first so the result does
 * not depend on the order the snapshot happened to be written in.
 */
export function studentOfTheDay(
  students: GameStudent[],
  now: Date,
  region: RegionKey = "global",
): GameStudent | null {
  const pool = students
    .filter((student) => isReleased(student, region))
    .sort((a, b) => a.Id - b.Id);
  if (pool.length === 0) return null;

  // xorshift-ish mix so consecutive days land far apart in the pool.
  let hash = gameDayStamp(now) | 0;
  hash ^= hash << 13;
  hash ^= hash >>> 17;
  hash ^= hash << 5;
  return pool[Math.abs(hash) % pool.length];
}

export interface StudentFilters {
  /** Matched against the English name and the localized one. */
  query?: string;
  rarities?: number[];
  atkTypes?: AtkType[];
  defTypes?: DefType[];
  schools?: string[];
  /** Drop students not yet on this server. Defaults to no filtering. */
  region?: RegionKey;
}

/**
 * Filter the roster. An empty or omitted facet means "no constraint", so the
 * default filters object returns everything.
 */
export function filterStudents(
  students: GameStudent[],
  filters: StudentFilters,
  localizedName: (student: GameStudent) => string = (s) => s.Name,
): GameStudent[] {
  const query = filters.query?.trim().toLowerCase() ?? "";
  return students.filter((student) => {
    if (filters.region && !isReleased(student, filters.region)) return false;
    if (filters.rarities?.length && !filters.rarities.includes(student.StarGrade)) {
      return false;
    }
    if (filters.atkTypes?.length) {
      const atk = toAtkType(student.BulletType);
      if (!atk || !filters.atkTypes.includes(atk)) return false;
    }
    if (filters.defTypes?.length) {
      const def = toDefType(student.ArmorType);
      if (!def || !filters.defTypes.includes(def)) return false;
    }
    if (filters.schools?.length && !filters.schools.includes(student.School)) {
      return false;
    }
    if (query) {
      const matches =
        student.Name.toLowerCase().includes(query) ||
        localizedName(student).toLowerCase().includes(query);
      if (!matches) return false;
    }
    return true;
  });
}

/** Schools present in the roster, most populated first. */
export function schoolsOf(students: GameStudent[]): string[] {
  const counts = new Map<string, number>();
  for (const student of students) {
    counts.set(student.School, (counts.get(student.School) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([school]) => school);
}

export interface LiveGacha {
  /** Unix seconds; unique per window, so it doubles as a render key. */
  start: number;
  end: number;
  secondsLeft: number;
  students: GameStudent[];
}

/**
 * The gacha windows running right now on a region, resolved to students.
 *
 * Total function: any shape of missing, unknown or expired data yields an empty
 * list rather than a throw. This renders on the Banner tab — the app's busiest
 * screen — so it must never be the reason that screen fails.
 */
export function selectLiveGachas(
  config: { regions?: { CurrentGacha?: { characters?: number[]; start?: number; end?: number }[] }[] } | null | undefined,
  byId: StudentIndex,
  now: Date,
  region: RegionKey = "global",
): LiveGacha[] {
  const gachas = config?.regions?.[REGION[region]]?.CurrentGacha;
  if (!Array.isArray(gachas)) return [];

  const nowSeconds = now.getTime() / 1000;
  const live: LiveGacha[] = [];
  for (const gacha of gachas) {
    if (typeof gacha?.end !== "number" || typeof gacha?.start !== "number") {
      continue;
    }
    // Upstream can leave a window in place past its end; showing "0m left"
    // forever is worse than showing nothing.
    const secondsLeft = Math.floor(gacha.end - nowSeconds);
    if (secondsLeft <= 0) continue;

    const students = (gacha.characters ?? [])
      .map((id) => byId[id])
      .filter((student): student is GameStudent => student !== undefined);
    // Every id unknown means this build predates the students on banner; a
    // nameless, iconless row helps nobody.
    if (students.length === 0) continue;

    live.push({ start: gacha.start, end: gacha.end, secondsLeft, students });
  }
  return live;
}
