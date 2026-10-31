// appConfig/app → AppConfig. Field by field: an invalid field is dropped and
// the rest of the doc still applies, so one typo in the backoffice cannot
// switch off an unrelated setting. Nothing here throws.

import { parseInstant, parseScheduleString } from "@/services/banners/time";
import { asHttpUrl, asRecord, asText } from "@/services/userdata/sanitize";

import {
  ANNOUNCEMENT_LOCALES,
  type Announcement,
  type AppConfig,
  type GachaSystem,
} from "./types";

const ANNOUNCEMENT_MAX = 500;
const MAX_FLAGS = 100;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
// "2", "2.0", "2.0.1", "2.0.1.4" — what app.json's version looks like.
const VERSION = /^\d{1,4}(?:\.\d{1,4}){0,3}$/;
const FLAG_KEY = /^[A-Za-z0-9_.:-]{1,64}$/;

const asGachaSystem = (value: unknown): GachaSystem | undefined =>
  value === "spark" || value === "charge" ? value : undefined;

/** A real calendar day in "YYYY-MM-DD" form. */
function asDayKey(value: unknown): string | undefined {
  // No truncation here: cutting "2026-11-10T02:00Z" to ten characters would
  // turn an invalid value into a valid-looking one.
  const text = typeof value === "string" ? value.trim() : undefined;
  return text && DAY_KEY.test(text) && parseScheduleString(text) !== null
    ? text
    : undefined;
}

/**
 * The announcement is all-or-nothing on its essentials: it needs an id and
 * English text. An `until` that cannot be parsed drops the whole thing —
 * an announcement that was meant to expire must not show forever instead.
 */
export function normalizeAnnouncement(raw: unknown): Announcement | undefined {
  const record = asRecord(raw);
  if (!record) return undefined;
  const id = asText(record.id, 100);
  const en = asText(record.en, ANNOUNCEMENT_MAX);
  if (!id || !en) return undefined;

  const announcement: Announcement = { id, en };
  for (const locale of ANNOUNCEMENT_LOCALES) {
    const text = asText(record[locale], ANNOUNCEMENT_MAX);
    if (text) announcement[locale] = text;
  }
  const url = asHttpUrl(record.url);
  if (url) announcement.url = url;

  if (record.until !== undefined && record.until !== null && record.until !== "") {
    const until = parseInstant(record.until);
    if (until === null) return undefined;
    announcement.until =
      typeof record.until === "string"
        ? record.until.trim()
        : new Date(until).toISOString();
  }
  return announcement;
}

function normalizeFlags(raw: unknown): Record<string, boolean> | undefined {
  const record = asRecord(raw);
  if (!record) return undefined;
  const flags: Record<string, boolean> = {};
  let count = 0;
  for (const [key, value] of Object.entries(record)) {
    if (count >= MAX_FLAGS) break;
    if (typeof value !== "boolean" || !FLAG_KEY.test(key)) continue;
    flags[key] = value;
    count += 1;
  }
  return count > 0 ? flags : undefined;
}

export function normalizeAppConfig(raw: unknown): AppConfig {
  const record = asRecord(raw);
  if (!record) return {};
  const config: AppConfig = {};

  const gachaSystem = asGachaSystem(record.gachaSystem);
  if (gachaSystem) config.gachaSystem = gachaSystem;

  const gachaSystemFrom = asDayKey(record.gachaSystemFrom);
  if (gachaSystemFrom) config.gachaSystemFrom = gachaSystemFrom;

  const announcement = normalizeAnnouncement(record.announcement);
  if (announcement) config.announcement = announcement;

  const latestVersion =
    typeof record.latestVersion === "string" ? record.latestVersion.trim() : "";
  if (VERSION.test(latestVersion)) {
    config.latestVersion = latestVersion;
  }

  const flags = normalizeFlags(record.flags);
  if (flags) config.flags = flags;

  // The backoffice may write a string or a serverTimestamp().
  const updatedAt = parseInstant(record.updatedAt);
  if (updatedAt !== null) {
    config.updatedAt =
      typeof record.updatedAt === "string"
        ? record.updatedAt.trim()
        : new Date(updatedAt).toISOString();
  }

  return config;
}
