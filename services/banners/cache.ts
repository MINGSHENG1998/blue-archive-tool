// AsyncStorage copy of the last good Firestore result, so a launch renders the
// schedule instantly and an offline launch renders it at all.
//
// What is stored is already-normalized banners, and they are normalized again
// on the way out: the cache may have been written by an older app version
// with a looser normalizer, and normalizeBanner() is idempotent, so the second
// pass costs nothing when the data is good and drops anything that is not.

import { readJson, writeJson } from "@/services/userdata/storage";
import { asRecord } from "@/services/userdata/sanitize";

import { compareBanners, normalizeBanner } from "./normalize";
import type { Banner } from "./types";

/** Bump the version to abandon every existing cache in one move. */
export const BANNERS_CACHE_KEY = "banners:v1";

export interface BannersCache {
  banners: Banner[];
  /** When the network fetch that produced this finished, ms epoch. */
  fetchedAt: number;
}

/** Validate a stored blob. Null when it is not a cache at all. */
export function reviveBannersCache(raw: unknown): BannersCache | null {
  const record = asRecord(raw);
  if (!record || !Array.isArray(record.banners)) return null;
  const fetchedAt = record.fetchedAt;
  if (typeof fetchedAt !== "number" || !Number.isFinite(fetchedAt) || fetchedAt <= 0) {
    return null;
  }

  const seen = new Set<string>();
  const banners: Banner[] = [];
  for (const item of record.banners) {
    const banner = normalizeBanner(asRecord(item)?.id, item);
    if (!banner || seen.has(banner.id)) continue;
    seen.add(banner.id);
    banners.push(banner);
  }
  return { banners: banners.sort(compareBanners), fetchedAt };
}

/** The cached schedule, or null when absent, corrupt or unreadable. */
export async function readBannersCache(): Promise<BannersCache | null> {
  const result = await readJson(BANNERS_CACHE_KEY);
  if (result.kind !== "value") return null;
  try {
    return reviveBannersCache(result.value);
  } catch {
    return null;
  }
}

/** Resolves false on a failed write; the next launch simply fetches again. */
export function writeBannersCache(
  banners: readonly Banner[],
  fetchedAt: number,
): Promise<boolean> {
  return writeJson(BANNERS_CACHE_KEY, { fetchedAt, banners });
}
