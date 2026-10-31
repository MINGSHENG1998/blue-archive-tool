// AsyncStorage mirror of the last successful SchaleDB refresh.
//
// Every function here swallows its errors: a corrupt or unavailable cache must
// degrade to the bundled snapshot, never to a crash or an error screen. Game
// reference data is not worth failing a launch over.

import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  GameConfig,
  GameDataSnapshot,
  GameLocalization,
  GameRaids,
  GameStudent,
  NameMap,
  RaidNames,
} from "./types";
import { ALL_LOCALES, OVERLAY_LOCALES } from "./schaledb";

/**
 * Bump the version segment to abandon every existing cache in one move.
 *
 * Adding a locale does NOT need a bump: its keys are simply absent from an
 * older cache, and loadGameData() fills that gap from the bundled overlay.
 *
 * v2 widened the student record, the config and the labels, and added raids.
 * A v1 cache is simply never read — it would load, but every student would be
 * missing their profile until upstream next moved — and writeCache sweeps its
 * keys away so the old roster does not sit in storage forever.
 */
const PREFIX = "gamedata:v2:";
const KEY_CONFIG = `${PREFIX}config`;
const KEY_STUDENTS = `${PREFIX}students`;
const KEY_RAIDS = `${PREFIX}raids`;
const KEY_CHECKED_AT = `${PREFIX}checkedAt`;
const keyNames = (locale: string) => `${PREFIX}names:${locale}`;
const keyLabels = (locale: string) => `${PREFIX}labels:${locale}`;
const keyRaidNames = (locale: string) => `${PREFIX}raidNames:${locale}`;

/** Every key the v1 layout wrote. v1 predates vi/th, so its locale list is fixed. */
const LEGACY_PREFIX = "gamedata:v1:";
const LEGACY_OVERLAYS = ["ja", "ko", "zh"] as const;
const LEGACY_KEYS = [
  `${LEGACY_PREFIX}config`,
  `${LEGACY_PREFIX}students`,
  `${LEGACY_PREFIX}checkedAt`,
  ...LEGACY_OVERLAYS.map((locale) => `${LEGACY_PREFIX}names:${locale}`),
  ...["en", ...LEGACY_OVERLAYS].map((locale) => `${LEGACY_PREFIX}labels:${locale}`),
];

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * What the cache can hand back. `raids` may be null: a cache whose raid entry
 * went missing is still a perfectly good roster, so the loader fills the gap
 * from the bundled snapshot instead of discarding the whole thing.
 */
export type CachedSnapshot = Omit<GameDataSnapshot, "source" | "raids"> & {
  raids: GameRaids | null;
};

const isRaids = (value: unknown): value is GameRaids =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as GameRaids).raid === "object" &&
  typeof (value as GameRaids).multiFloor === "object" &&
  Array.isArray((value as GameRaids).eliminate);

/** The cached snapshot, or null if absent, partial or unreadable. */
export async function readCache(): Promise<CachedSnapshot | null> {
  const [config, students, raids] = await Promise.all([
    readJson<GameConfig>(KEY_CONFIG),
    readJson<GameStudent[]>(KEY_STUDENTS),
    readJson<unknown>(KEY_RAIDS),
  ]);
  if (!config || typeof config.build !== "number") return null;
  if (!Array.isArray(config.regions)) return null;
  if (!Array.isArray(students) || students.length === 0) return null;

  const names: GameDataSnapshot["names"] = {};
  const raidNames: GameDataSnapshot["raidNames"] = {};
  for (const locale of OVERLAY_LOCALES) {
    const map = await readJson<NameMap>(keyNames(locale));
    if (map) names[locale] = map;
    const bosses = await readJson<RaidNames>(keyRaidNames(locale));
    if (bosses && typeof bosses.raid === "object" && typeof bosses.multiFloor === "object") {
      raidNames[locale] = bosses;
    }
  }

  const labels: GameDataSnapshot["labels"] = {};
  for (const locale of ALL_LOCALES) {
    const map = await readJson<GameLocalization>(keyLabels(locale));
    if (map) labels[locale] = map;
  }
  return {
    config,
    students,
    names,
    labels,
    raids: isRaids(raids) ? raids : null,
    raidNames,
  };
}

export async function writeCache(
  snapshot: Omit<GameDataSnapshot, "source">,
): Promise<void> {
  try {
    const entries: [string, string][] = [
      [KEY_CONFIG, JSON.stringify(snapshot.config)],
      [KEY_STUDENTS, JSON.stringify(snapshot.students)],
      [KEY_RAIDS, JSON.stringify(snapshot.raids)],
    ];
    for (const locale of OVERLAY_LOCALES) {
      const map = snapshot.names[locale];
      if (map) entries.push([keyNames(locale), JSON.stringify(map)]);
      const bosses = snapshot.raidNames[locale];
      if (bosses) entries.push([keyRaidNames(locale), JSON.stringify(bosses)]);
    }
    for (const locale of ALL_LOCALES) {
      const map = snapshot.labels[locale];
      if (map) entries.push([keyLabels(locale), JSON.stringify(map)]);
    }
    await AsyncStorage.multiSet(entries);
  } catch {
    // A failed write just means the next launch re-fetches.
    return;
  }
  try {
    // Only once a v2 cache exists, so a failed write never leaves the user
    // with neither.
    await AsyncStorage.multiRemove(LEGACY_KEYS);
  } catch {
    // The old keys are dead weight, not a hazard.
  }
}

export async function readCheckedAt(): Promise<number> {
  const value = await readJson<number>(KEY_CHECKED_AT);
  return typeof value === "number" ? value : 0;
}

export async function writeCheckedAt(at: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_CHECKED_AT, JSON.stringify(at));
  } catch {
    // Losing the throttle stamp only costs one extra config fetch.
  }
}

export async function clearCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      KEY_CONFIG,
      KEY_STUDENTS,
      KEY_RAIDS,
      KEY_CHECKED_AT,
      ...OVERLAY_LOCALES.map(keyNames),
      ...OVERLAY_LOCALES.map(keyRaidNames),
      ...ALL_LOCALES.map(keyLabels),
      ...LEGACY_KEYS,
    ]);
  } catch {
    // Nothing to do; the stale cache is still valid data.
  }
}
