// Watchlist: the students Sensei has starred. Keyed by SchaleDB student id,
// never by banner doc id — a backoffice re-sync can delete and recreate
// banner docs, but a student id is forever, and the next banner featuring a
// starred student is re-resolved from the schedule every time.

import { asStudentId } from "./sanitize";
import { createJsonStore } from "./storage";

export const WATCHLIST_KEY = "watchlist:v1";

/** Far above the roster size; bounds a corrupt or runaway list. */
export const MAX_WATCHLIST = 1000;

/** Unique positive ids, original order kept, anything else dropped. */
export function normalizeWatchlist(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const value of raw) {
    const id = asStudentId(value);
    if (id === undefined || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_WATCHLIST) break;
  }
  return ids;
}

/** Star or unstar. Returns `ids` itself when nothing changes. */
export function setWatched(
  ids: readonly number[],
  id: number,
  watched: boolean,
): number[] {
  const studentId = asStudentId(id);
  if (studentId === undefined) return ids as number[];
  const present = ids.includes(studentId);
  if (watched === present) return ids as number[];
  if (!watched) return ids.filter((x) => x !== studentId);
  return ids.length >= MAX_WATCHLIST ? (ids as number[]) : [...ids, studentId];
}

export const toggleWatched = (ids: readonly number[], id: number) =>
  setWatched(ids, id, !ids.includes(id));

export const watchlistStore = createJsonStore<number[]>(
  WATCHLIST_KEY,
  normalizeWatchlist,
  () => [],
);
