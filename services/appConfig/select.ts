// Pure readers over AppConfig. `now` / `at` are always arguments.

import { parseInstant, parseScheduleString } from "@/services/banners/time";

import {
  ANNOUNCEMENT_LOCALES,
  type Announcement,
  type AnnouncementLocale,
  type AppConfig,
  type GachaSystem,
} from "./types";

/**
 * Global replaces the 200-pull spark with Recruitment Charges after the
 * Nov 10 2026 maintenance (Nexon forum thread 3560313). Banners rotate at
 * 02:00 UTC that day, so a banner starting on the 10th is the first on the
 * new system. appConfig can move this date without an app release.
 */
export const CHARGE_SYSTEM_FROM = "2026-11-10";

const DEFAULT_SWITCH_AT = parseScheduleString(CHARGE_SYSTEM_FROM) as number;

/**
 * Which recruitment model applies at `at` — pass a banner's startAt for the
 * planner, or now for the tracker.
 *
 * - No config: spark before CHARGE_SYSTEM_FROM, charge from it on.
 * - gachaSystemFrom alone moves the switch date.
 * - gachaSystem alone forces that model everywhere.
 * - Both: gachaSystem from that date on, the other model before it.
 */
export function gachaSystemAt(at: number, config: AppConfig = {}): GachaSystem {
  const { gachaSystem, gachaSystemFrom } = config;
  if (gachaSystem && !gachaSystemFrom) return gachaSystem;
  const switchAt =
    (gachaSystemFrom && parseScheduleString(gachaSystemFrom)) || DEFAULT_SWITCH_AT;
  const after: GachaSystem = gachaSystem ?? "charge";
  const before: GachaSystem = after === "charge" ? "spark" : "charge";
  return at >= switchAt ? after : before;
}

/** Announcement text in `locale`, English when that locale is missing. */
export function announcementText(
  announcement: Announcement,
  locale: string,
): string {
  const translated = (ANNOUNCEMENT_LOCALES as readonly string[]).includes(locale)
    ? announcement[locale as AnnouncementLocale]
    : undefined;
  return translated || announcement.en;
}

/** The announcement to show at `now`, or null when absent or expired. */
export function activeAnnouncement(
  config: AppConfig,
  now: number,
): Announcement | null {
  const announcement = config.announcement;
  if (!announcement) return null;
  if (announcement.until === undefined) return announcement;
  const until = parseInstant(announcement.until);
  return until !== null && now < until ? announcement : null;
}

function versionParts(version: string): number[] | null {
  const parts = version.trim().split(".").map(Number);
  return parts.length > 0 && parts.every((n) => Number.isInteger(n) && n >= 0)
    ? parts
    : null;
}

/** True when `latest` is strictly newer than `current` ("2.0.10" > "2.0.9"). */
export function isNewerVersion(
  latest: string | undefined,
  current: string | undefined,
): boolean {
  if (!latest || !current) return false;
  const a = versionParts(latest);
  const b = versionParts(current);
  if (!a || !b) return false;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

/** A remote flag, or `fallback` when the doc does not mention it. */
export const configFlag = (
  config: AppConfig,
  key: string,
  fallback = false,
): boolean => config.flags?.[key] ?? fallback;
