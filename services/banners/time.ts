// Banner instants.
//
// The backoffice stores plain calendar dates ("2026-10-27"). On Global,
// recruitment rotates during the weekly maintenance and the new pickups open
// at 02:00 UTC (11:00 JST) — Nexon's notices list "Ending Major Content at
// <date> 2:00 AM (UTC)". So a date-only value means that instant, for every
// player, whatever the device timezone. Reading it with `new Date("2026-10-27")`
// would give midnight UTC, two hours early; reading it as local time would
// make the countdown depend on where the phone is.
//
// Parsing is deliberately strict. The JS engine's Date.parse accepts a
// different, implementation-defined set of formats on Hermes, JSC and V8, and
// a banner whose date parses on web but not on Android is worse than one that
// is dropped everywhere.

/** Hour (UTC) at which Global rotates recruitment. */
export const GLOBAL_ROTATION_UTC_HOUR = 2;

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

// A window that rejects obvious garbage ("0001-01-01", a seconds value read as
// milliseconds) without ever rejecting a real schedule entry.
const MIN_YEAR = 2015;
const MAX_YEAR = 2100;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?\s*(Z|[+-]\d{2}(?::?\d{2})?)?$/i;

function utcInstant(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): number | null {
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour > 23 || minute > 59 || second > 59) return null;
  const at = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  // Date.UTC rolls "02-30" over into March; a date that does not exist is
  // a typo, not a request for the nearest real day.
  const check = new Date(at);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return null;
  }
  return at;
}

function offsetMs(zone: string | undefined): number | null {
  if (!zone || zone.toUpperCase() === "Z") return 0;
  const match = /^([+-])(\d{2})(?::?(\d{2}))?$/.exec(zone);
  if (!match) return null;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);
  if (hours > 14 || minutes > 59) return null;
  return (match[1] === "-" ? -1 : 1) * (hours * 60 + minutes) * 60 * 1000;
}

/**
 * Parse a schedule string to ms epoch, or null.
 *
 * - "YYYY-MM-DD" → 02:00 UTC that day.
 * - "YYYY-MM-DDTHH:mm[:ss[.fff]][Z|±hh:mm]" → that instant. A value with no
 *   offset is read as UTC, never as device-local time.
 */
export function parseScheduleString(value: string): number | null {
  const text = value.trim();

  const dateOnly = DATE_ONLY.exec(text);
  if (dateOnly) {
    return utcInstant(
      Number(dateOnly[1]),
      Number(dateOnly[2]),
      Number(dateOnly[3]),
      GLOBAL_ROTATION_UTC_HOUR,
    );
  }

  const full = DATE_TIME.exec(text);
  if (!full) return null;
  const offset = offsetMs(full[8]);
  if (offset === null) return null;
  // Only milliseconds survive; "…:00.123456789" keeps ".123".
  const ms = full[7] ? Number(full[7].slice(0, 3).padEnd(3, "0")) : 0;
  const local = utcInstant(
    Number(full[1]),
    Number(full[2]),
    Number(full[3]),
    Number(full[4]),
    Number(full[5]),
    Number(full[6] ?? 0),
    ms,
  );
  return local === null ? null : local - offset;
}

const inRange = (at: number) =>
  Number.isFinite(at) &&
  at >= Date.UTC(MIN_YEAR, 0, 1) &&
  at < Date.UTC(MAX_YEAR + 1, 0, 1);

/**
 * ms epoch for any value a schedule field might hold, or null.
 *
 * Strings follow parseScheduleString. A Firestore Timestamp (someone editing
 * in the console picks the timestamp type) and its JSON form
 * `{ seconds, nanoseconds }` are accepted too. Bare numbers are not: a
 * number could be seconds or milliseconds, and guessing wrong is a banner in
 * 1970.
 */
export function parseInstant(value: unknown): number | null {
  if (typeof value === "string") return parseScheduleString(value);
  if (value instanceof Date) {
    const at = value.getTime();
    return inRange(at) ? at : null;
  }
  if (value !== null && typeof value === "object") {
    const ts = value as { toMillis?: unknown; seconds?: unknown };
    if (typeof ts.toMillis === "function") {
      try {
        const at = Number((ts.toMillis as () => unknown).call(value));
        return inRange(at) ? at : null;
      } catch {
        return null;
      }
    }
    if (typeof ts.seconds === "number") {
      const at = ts.seconds * 1000;
      return inRange(at) ? at : null;
    }
  }
  return null;
}

export interface ScheduleField {
  /** The stored text when it was a string, else an ISO rendering of the instant. */
  text: string;
  at: number;
}

/** A schedule field as Banner carries it, or null when it is unusable. */
export function toScheduleField(value: unknown): ScheduleField | null {
  const at = parseInstant(value);
  if (at === null) return null;
  const text =
    typeof value === "string" ? value.trim() : new Date(at).toISOString();
  return { text, at };
}

/** "YYYY-MM-DD" of an instant's UTC calendar day. */
export function utcDayKey(at: number): string {
  return new Date(at).toISOString().slice(0, 10);
}
