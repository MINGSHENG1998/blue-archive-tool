// The Firestore read: the `banners` and `characters` collections, joined on
// characterIds (see normalize.ts). Read-only — the app never writes Firestore.
//
// This is the one place in services/banners that does IO and the one place
// that throws. Callers (the provider) turn a throw into "keep the cache".

import { collection, getDocs } from "firebase/firestore";

import { db } from "@/firebaseConfig";

import { normalizeBanners } from "./normalize";
import type { Banner, RawDoc } from "./types";

/**
 * Upper bound on one fetch. The Firestore SDK can sit on a request for a long
 * time before deciding it is offline; past this the UI should stop showing a
 * spinner and offer a retry.
 */
export const FETCH_TIMEOUT_MS = 20_000;

export type BannerFetchErrorCode = "timeout" | "network" | "schema";

export class BannerFetchError extends Error {
  readonly code: BannerFetchErrorCode;
  constructor(code: BannerFetchErrorCode, message?: string) {
    super(message ?? code);
    this.name = "BannerFetchError";
    this.code = code;
  }
}

/** Reject with a "timeout" BannerFetchError if `promise` takes longer than `ms`. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new BannerFetchError("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Snapshot docs → RawDoc[], tolerating a snapshot or doc that misbehaves. */
function toRawDocs(snapshot: unknown): RawDoc[] {
  const docs = (snapshot as { docs?: unknown } | null)?.docs;
  if (!Array.isArray(docs)) return [];
  const out: RawDoc[] = [];
  for (const doc of docs) {
    const id = (doc as { id?: unknown } | null)?.id;
    if (typeof id !== "string") continue;
    let data: unknown;
    try {
      data = (doc as { data(): unknown }).data();
    } catch {
      data = undefined;
    }
    out.push({ id, data });
  }
  return out;
}

export async function fetchBannerDocs(): Promise<{
  banners: RawDoc[];
  characters: RawDoc[];
}> {
  let snapshots: [unknown, unknown];
  try {
    snapshots = await withTimeout(
      Promise.all([
        getDocs(collection(db, "banners")),
        getDocs(collection(db, "characters")),
      ]),
      FETCH_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof BannerFetchError) throw error;
    const code = (error as { code?: unknown } | null)?.code;
    throw new BannerFetchError(
      "network",
      typeof code === "string" ? code : String(error),
    );
  }
  return {
    banners: toRawDocs(snapshots[0]),
    characters: toRawDocs(snapshots[1]),
  };
}

/**
 * Fetch and normalize the whole schedule (ended banners included).
 *
 * A collection that has docs but yields not one usable banner is treated as
 * a failure, not as "the schedule is empty": that is what a backoffice schema
 * mistake looks like, and accepting it would overwrite every user's good
 * offline copy with nothing.
 */
export async function fetchBanners(): Promise<Banner[]> {
  const docs = await fetchBannerDocs();
  const banners = normalizeBanners(docs.banners, docs.characters);
  if (docs.banners.length > 0 && banners.length === 0) {
    throw new BannerFetchError(
      "schema",
      `none of ${docs.banners.length} banner docs could be read`,
    );
  }
  return banners;
}
