// Load order and refresh policy for the SchaleDB snapshot.
//
//   launch  -> cached (if at least as new as bundled) else bundled   [instant]
//   then    -> config.min.json (~24 KB) to compare `build`           [throttled]
//   then    -> full student fetch, only when `build` actually moved  [~1.6 MB]
//
// Everything is best-effort. A refresh that fails leaves the caller on the
// snapshot it already has.

import { readCache, readCheckedAt, writeCache, writeCheckedAt } from "./cache";
import {
  fetchConfig,
  fetchLocalization,
  fetchNameMap,
  fetchStudents,
  type GameLocale,
} from "./schaledb";
import {
  bundledConfig,
  bundledLabels,
  bundledNames,
  bundledStudents,
} from "./snapshot";
import type { GameDataSnapshot } from "./types";

/** How long to trust the last check before asking upstream again. */
export const REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;

export function bundledSnapshot(): GameDataSnapshot {
  return {
    config: bundledConfig,
    students: bundledStudents,
    names: bundledNames,
    labels: bundledLabels,
    source: "bundled",
  };
}

/**
 * The snapshot to render with right now. Prefers the cache, but only when it
 * is at least as new as what shipped — otherwise a user updating the app would
 * be pinned to an older cached build until upstream moved again.
 */
export async function loadGameData(): Promise<GameDataSnapshot> {
  const cached = await readCache();
  if (cached && cached.config.build >= bundledConfig.build) {
    return { ...cached, source: "cached" };
  }
  return bundledSnapshot();
}

/**
 * Check upstream and return a newer snapshot, or null when there is nothing to
 * do (throttled, already current, or the network failed).
 *
 * `locale` scopes the expensive part. SchaleDB publishes no names-only
 * endpoint, so every localized name overlay costs a full ~1.6 MB roster
 * download; fetching all four would put ~6.7 MB on a phone's data plan every
 * time upstream moves. Only the locale in use is refreshed, and the other
 * overlays are carried forward from the snapshot we already have — worst case
 * a language the user is not reading stays one build behind.
 */
export async function refreshGameData(
  current: GameDataSnapshot,
  now: number = Date.now(),
  force = false,
  locale: GameLocale = "en",
): Promise<GameDataSnapshot | null> {
  try {
    if (!force) {
      const checkedAt = await readCheckedAt();
      if (now - checkedAt < REFRESH_INTERVAL_MS) return null;
    }

    const config = await fetchConfig();
    await writeCheckedAt(now);
    if (config.build <= current.config.build) return null;

    // English is the base record and the search fallback, so it is always
    // refreshed; a non-English locale adds exactly one more roster download.
    const [students, overlay, englishLabels, localeLabels] = await Promise.all([
      fetchStudents("en"),
      locale === "en" ? Promise.resolve(null) : fetchNameMap(locale),
      fetchLocalization("en"),
      locale === "en" ? Promise.resolve(null) : fetchLocalization(locale),
    ]);

    const names: GameDataSnapshot["names"] = { ...current.names };
    if (overlay && locale !== "en") names[locale] = overlay;

    const labels: GameDataSnapshot["labels"] = {
      ...current.labels,
      en: englishLabels,
    };
    if (localeLabels && locale !== "en") labels[locale] = localeLabels;

    const next = { config, students, names, labels };
    await writeCache(next);
    return { ...next, source: "cached" };
  } catch {
    // Offline, timed out, or upstream changed shape. Keep what we have.
    return null;
  }
}

export { clearCache } from "./cache";
export { LOCALE_TO_LANG, studentIconUrl, studentPortraitUrl } from "./schaledb";
export { characterImageUris, hostedIconUrl, studentIconUris } from "./images";
export * from "./resets";
export * from "./students";
export * from "./types";
