// Load order and refresh policy for the SchaleDB snapshot.
//
//   launch  -> cached (if at least as new as bundled) else bundled   [instant]
//   then    -> config.min.json (~24 KB) to compare `build`           [throttled]
//   then    -> roster + labels + raids, only when `build` moved      [~400 KB on the wire]
//
// Everything is best-effort. A refresh that fails leaves the caller on the
// snapshot it already has.

import { readCache, readCheckedAt, writeCache, writeCheckedAt } from "./cache";
import {
  fetchConfig,
  fetchLocalization,
  fetchNameMap,
  fetchRaidNames,
  fetchRaids,
  fetchStudents,
  type GameLocale,
} from "./schaledb";
import {
  bundledConfig,
  bundledLabels,
  bundledNames,
  bundledRaidNames,
  bundledRaids,
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
    raids: bundledRaids,
    raidNames: bundledRaidNames,
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
    // A cache that lost its raid entry is still the newer roster; the shipped
    // raids are the floor for that one piece.
    return { ...cached, raids: cached.raids ?? bundledRaids, source: "cached" };
  }
  return bundledSnapshot();
}

/**
 * Check upstream and return a newer snapshot, or null when there is nothing to
 * do (throttled, already current, or the network failed).
 *
 * `locale` scopes the expensive part. SchaleDB publishes no names-only
 * endpoint, so every localized name overlay costs a full roster download
 * (~1.7 MB raw, ~300 KB gzipped); fetching all four would put over a megabyte
 * on a phone's data plan every time upstream moves. Only the locale in use is
 * refreshed, and the other overlays are carried forward from the snapshot we
 * already have — worst case a language the user is not reading stays one build
 * behind. Raid names follow the same rule.
 *
 * Raids are supplementary: if that file fails or changes shape, the roster
 * still refreshes and the raids already on hand are carried forward.
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

    const fetched = await fetchConfig();
    await writeCheckedAt(now);
    if (fetched.build <= current.config.build) return null;

    // English is the base record and the search fallback, so it is always
    // refreshed; a non-English locale adds exactly one more roster download
    // and one more raids file.
    const overlayLocale = locale === "en" ? null : locale;
    const [students, overlay, englishLabels, localeLabels, raids, localeRaidNames] =
      await Promise.all([
        fetchStudents("en"),
        overlayLocale ? fetchNameMap(overlayLocale) : Promise.resolve(null),
        fetchLocalization("en"),
        overlayLocale ? fetchLocalization(overlayLocale) : Promise.resolve(null),
        fetchRaids("en").catch(() => null),
        overlayLocale ? fetchRaidNames(overlayLocale).catch(() => null) : Promise.resolve(null),
      ]);

    // A config that arrives without the type chart keeps the one we had,
    // rather than blanking every "effective against" hint until next build.
    const typeChart = fetched.TypeEffectiveness ?? current.config.TypeEffectiveness;
    const config = typeChart ? { ...fetched, TypeEffectiveness: typeChart } : fetched;

    const names: GameDataSnapshot["names"] = { ...current.names };
    if (overlay && overlayLocale) names[overlayLocale] = overlay;

    const labels: GameDataSnapshot["labels"] = {
      ...current.labels,
      en: englishLabels,
    };
    if (localeLabels && overlayLocale) labels[overlayLocale] = localeLabels;

    const raidNames: GameDataSnapshot["raidNames"] = { ...current.raidNames };
    if (localeRaidNames && overlayLocale) raidNames[overlayLocale] = localeRaidNames;

    const next = {
      config,
      students,
      names,
      labels,
      raids: raids ?? current.raids,
      raidNames,
    };
    await writeCache(next);
    return { ...next, source: "cached" };
  } catch {
    // Offline, timed out, or upstream changed shape. Keep what we have.
    return null;
  }
}

export { clearCache } from "./cache";
export {
  LOCALE_TO_LANG,
  OPTIONAL_STUDENT_FIELDS,
  STUDENT_FIELDS,
  studentIconUrl,
  studentPortraitUrl,
} from "./schaledb";
export { characterImageUris, hostedIconUrl, studentIconUris, studentPortraitUris } from "./images";
export * from "./live";
export * from "./resets";
export * from "./students";
export * from "./types";
