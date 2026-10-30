// Pure selectors over a normalized banner list. No IO, no React, no clock:
// `now` is always an argument, so countdowns, stamps and the live/next pick
// can be unit tested at exact instants (the 02:00 UTC rotation especially).

import type { Locale } from "@/constants/i18n";

import { DAY_MS } from "./time";
import { compareBanners } from "./normalize";
import type { Banner, BannerCharacter, BannerPhase } from "./types";

/** How long an ended banner stays in `recent`. */
export const RECENT_WINDOW_MS = 14 * DAY_MS;

/** Live means started and not yet ended: startAt <= now < endAt. */
export const isLive = (banner: Banner, now: number) =>
  banner.startAt <= now && now < banner.endAt;

export const hasEnded = (banner: Banner, now: number) => banner.endAt <= now;

export function bannerPhase(banner: Banner, now: number): BannerPhase {
  if (now < banner.startAt) return "upcoming";
  return now < banner.endAt ? "live" : "ended";
}

export interface BannerSelection {
  /** Not ended (live and upcoming), in timeline order. */
  banners: Banner[];
  /** Ended less than RECENT_WINDOW_MS ago, most recently ended first. */
  recent: Banner[];
  /** The live banner; when several overlap, the one that started first. */
  live: Banner | null;
  /** The first banner that has not started yet. */
  next: Banner | null;
}

export function selectBanners(
  all: readonly Banner[],
  now: number,
): BannerSelection {
  const banners: Banner[] = [];
  const recent: Banner[] = [];
  for (const banner of all) {
    if (!hasEnded(banner, now)) banners.push(banner);
    else if (now - banner.endAt < RECENT_WINDOW_MS) recent.push(banner);
  }
  banners.sort(compareBanners);
  recent.sort((a, b) => b.endAt - a.endAt || compareBanners(a, b));
  return {
    banners,
    recent,
    live: banners.find((b) => isLive(b, now)) ?? null,
    next: banners.find((b) => now < b.startAt) ?? null,
  };
}

/** Every live banner (a select-pickup can run alongside the main one). */
export const liveBanners = (list: readonly Banner[], now: number) =>
  list.filter((b) => isLive(b, now));

export const hasStudent = (banner: Banner, studentId: number) =>
  banner.characters.some((c) => c.studentId === studentId);

/** Banners featuring a student, in the order of `list`. */
export const bannersForStudent = (list: readonly Banner[], studentId: number) =>
  list.filter((b) => hasStudent(b, studentId));

/**
 * The next instant at which selectBanners() would answer differently: a
 * start, an end, or an ended banner leaving `recent`. Null when nothing is
 * left to change. Providers sleep until then instead of polling.
 */
export function nextChangeAt(
  all: readonly Banner[],
  now: number,
): number | null {
  let soonest: number | null = null;
  const consider = (at: number) => {
    if (at > now && (soonest === null || at < soonest)) soonest = at;
  };
  for (const banner of all) {
    consider(banner.startAt);
    consider(banner.endAt);
    consider(banner.endAt + RECENT_WINDOW_MS);
  }
  return soonest;
}

/** ms until `target`, never negative. */
export const msUntil = (target: number, now: number) =>
  Math.max(0, target - now);

/**
 * Whole days until `target`, rounded up: the n of a "D-n" stamp. 1 means
 * "within the next 24 hours"; 0 once the moment has passed.
 */
export const daysUntil = (target: number, now: number) =>
  Math.max(0, Math.ceil((target - now) / DAY_MS));

/** The editorial name in `locale`, falling back to the stored name. */
export function characterName(
  character: BannerCharacter,
  locale: Locale,
): string {
  if (locale === "en") return character.name || character.translations.en || "";
  return character.translations[locale] || character.name;
}

/**
 * Search: case-insensitive substring over the stored name and the name in
 * `locale`, so an English search still works with the app in Japanese.
 */
export function bannerMatches(
  banner: Banner,
  query: string,
  locale: Locale,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return banner.characters.some(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      characterName(c, locale).toLowerCase().includes(q),
  );
}
