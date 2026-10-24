// SchaleDB HTTP client. Pure fetch + shape checks; no React, no storage, no
// native modules — so the snapshot generator script can reuse it verbatim and
// the runtime and the bundled asset can never drift apart.

import type {
  GameConfig,
  GameLocalization,
  GameStudent,
  LocalizationSection,
  NameMap,
  RegionSchedule,
} from "./types";

const BASE = "https://schaledb.com";

/** App locale -> SchaleDB path segment. `zh`, `tw` and `cn` are three different datasets upstream; the backoffice syncs `zh`, so the app must use `zh` too or names diverge between screens. */
export const LOCALE_TO_LANG = {
  en: "en",
  ja: "jp",
  ko: "kr",
  zh: "zh",
} as const;

export type GameLocale = keyof typeof LOCALE_TO_LANG;

/** Locales carried as name-only overlays on top of the English base. */
export const OVERLAY_LOCALES = ["ja", "ko", "zh"] as const;

/** Every locale the app can render, English included. */
export const ALL_LOCALES = ["en", "ja", "ko", "zh"] as const;

/** Localization sections we keep. The file upstream has ~48 of them. */
export const LOCALIZATION_SECTIONS = [
  "SquadType",
  "BulletType",
  "ArmorType",
  "TacticRole",
  "School",
  "Club",
] as const satisfies readonly LocalizationSection[];

export const studentIconUrl = (id: number) =>
  `${BASE}/images/student/icon/${id}.webp`;

/** Full character art, transparent background. ~120 KB, so use it sparingly. */
export const studentPortraitUrl = (id: number) =>
  `${BASE}/images/student/portrait/${id}.webp`;

/** The only student fields this app keeps. Adding one here is the single edit needed to widen the snapshot. */
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

const REGION_FIELDS = [
  "Name",
  "StudentMaxLevel",
  "BondMaxLevel",
  "PotentialMax",
  "CurrentGacha",
  "CurrentEvents",
  "CurrentRaid",
] as const satisfies readonly (keyof RegionSchedule)[];

/**
 * Keep only the fields we use. Returns null for a record missing any of them —
 * a partial student is worse than no student, because callers would have to
 * null-check every field forever.
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
  return out as unknown as GameStudent;
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
  return { build: src.build, regions };
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

/** Expensive (~1.6 MB) — only after `build` has actually moved. */
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
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const name = (value as { Name?: unknown } | null)?.Name;
    if (typeof name === "string") names[id] = name;
  }
  if (Object.keys(names).length === 0) throw new Error("SchaleDB names: empty");
  return names;
}

export function trimLocalization(raw: unknown): GameLocalization | null {
  if (typeof raw !== "object" || raw === null) return null;
  const src = raw as Record<string, unknown>;
  const out: Record<string, Record<string, string>> = {};
  for (const section of LOCALIZATION_SECTIONS) {
    const value = src[section];
    if (typeof value !== "object" || value === null) return null;
    out[section] = value as Record<string, string>;
  }
  return out as unknown as GameLocalization;
}

/** Enum labels (school, club, role, damage types) for one locale. */
export async function fetchLocalization(
  locale: GameLocale,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<GameLocalization> {
  const raw = await getJson(
    `/data/${LOCALE_TO_LANG[locale]}/localization.min.json`,
    timeoutMs,
  );
  const localization = trimLocalization(raw);
  if (!localization) throw new Error("SchaleDB localization: unexpected shape");
  return localization;
}
