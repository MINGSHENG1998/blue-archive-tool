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
  GameStudent,
  NameMap,
} from "./types";
import { ALL_LOCALES, OVERLAY_LOCALES } from "./schaledb";

/** Bump the version segment to abandon every existing cache in one move. */
const PREFIX = "gamedata:v1:";
const KEY_CONFIG = `${PREFIX}config`;
const KEY_STUDENTS = `${PREFIX}students`;
const KEY_CHECKED_AT = `${PREFIX}checkedAt`;
const keyNames = (locale: string) => `${PREFIX}names:${locale}`;
const keyLabels = (locale: string) => `${PREFIX}labels:${locale}`;

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** The cached snapshot, or null if absent, partial or unreadable. */
export async function readCache(): Promise<Omit<GameDataSnapshot, "source"> | null> {
  const [config, students] = await Promise.all([
    readJson<GameConfig>(KEY_CONFIG),
    readJson<GameStudent[]>(KEY_STUDENTS),
  ]);
  if (!config || typeof config.build !== "number") return null;
  if (!Array.isArray(students) || students.length === 0) return null;

  const names: GameDataSnapshot["names"] = {};
  for (const locale of OVERLAY_LOCALES) {
    const map = await readJson<NameMap>(keyNames(locale));
    if (map) names[locale] = map;
  }

  const labels: GameDataSnapshot["labels"] = {};
  for (const locale of ALL_LOCALES) {
    const map = await readJson<GameLocalization>(keyLabels(locale));
    if (map) labels[locale] = map;
  }
  return { config, students, names, labels };
}

export async function writeCache(
  snapshot: Omit<GameDataSnapshot, "source">,
): Promise<void> {
  try {
    const entries: [string, string][] = [
      [KEY_CONFIG, JSON.stringify(snapshot.config)],
      [KEY_STUDENTS, JSON.stringify(snapshot.students)],
    ];
    for (const locale of OVERLAY_LOCALES) {
      const map = snapshot.names[locale];
      if (map) entries.push([keyNames(locale), JSON.stringify(map)]);
    }
    for (const locale of ALL_LOCALES) {
      const map = snapshot.labels[locale];
      if (map) entries.push([keyLabels(locale), JSON.stringify(map)]);
    }
    await AsyncStorage.multiSet(entries);
  } catch {
    // A failed write just means the next launch re-fetches.
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
      KEY_CHECKED_AT,
      ...OVERLAY_LOCALES.map(keyNames),
      ...ALL_LOCALES.map(keyLabels),
    ]);
  } catch {
    // Nothing to do; the stale cache is still valid data.
  }
}
