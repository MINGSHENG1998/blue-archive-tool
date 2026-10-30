// Roster: which students Sensei owns, at what star grade. Local only, no
// account, so export/import as text is the backup and the way to move phones.
//
// Ownership in the game only ever grows — a student cannot be un-recruited and
// stars cannot go down — so importing MERGES, keeping the higher grade on
// either side. Importing an old backup can therefore never lose progress.

import { asRecord, asStudentId, clampInt, intInRange } from "./sanitize";
import { createJsonStore } from "./storage";

export const ROSTER_KEY = "roster:v1";

export type StarGrade = 1 | 2 | 3 | 4 | 5;
/** Unique weapon star; the weapon only exists from 5★ on. No weapon = absent. */
export type UeGrade = 1 | 2 | 3 | 4;

export interface RosterEntry {
  stars: StarGrade;
  ue?: UeGrade;
  /** When this entry last changed, ms epoch (0 when unknown). */
  at: number;
}

/** student id (as a string, JSON-key style) → entry. */
export type Roster = Record<string, RosterEntry>;

/** What callers pass to set(): plain numbers, clamped into range. */
export interface RosterInput {
  stars: number;
  /** 0 or absent = no unique weapon. Ignored below 5★. */
  ue?: number;
}

/** Bounds a corrupt or hostile blob; the full Global roster is under 300. */
export const MAX_ROSTER_ENTRIES = 3000;

function makeEntry(stars: number, ue: number | undefined, at: number): RosterEntry {
  const entry: RosterEntry = { stars: stars as StarGrade, at };
  // The unique weapon unlocks at 5★, so a lower grade with a weapon star is
  // contradictory; the star grade is the part we trust.
  if (stars === 5 && ue !== undefined && ue >= 1) entry.ue = ue as UeGrade;
  return entry;
}

/**
 * A stored entry, strictly: a star grade out of range drops the entry. A bad
 * weapon grade only drops the weapon — owning the student is the part that
 * matters, and the grade can be re-entered.
 */
export function normalizeRosterEntry(raw: unknown): RosterEntry | null {
  const record = asRecord(raw);
  if (!record) return null;
  const stars = intInRange(record.stars, 1, 5);
  if (stars === undefined) return null;
  const ue = record.ue === undefined ? undefined : intInRange(record.ue, 0, 4);
  const at =
    typeof record.at === "number" && Number.isFinite(record.at) && record.at > 0
      ? record.at
      : 0;
  return makeEntry(stars, ue, at);
}

export function normalizeRoster(raw: unknown): Roster {
  const record = asRecord(raw);
  const roster: Roster = {};
  if (!record) return roster;
  let count = 0;
  for (const [key, value] of Object.entries(record)) {
    if (count >= MAX_ROSTER_ENTRIES) break;
    const id = asStudentId(key);
    // Canonical keys only ("10000", not "010000"), so one student is one key.
    if (id === undefined || String(id) !== key) continue;
    const entry = normalizeRosterEntry(value);
    if (!entry) continue;
    roster[key] = entry;
    count += 1;
  }
  return roster;
}

const sameEntry = (a: RosterEntry | undefined, b: RosterEntry) =>
  !!a && a.stars === b.stars && a.ue === b.ue;

/**
 * Set or clear one student. Input is clamped (a stepper overshooting to 6★
 * stores 5★). Returns `roster` itself when nothing changes, so a no-op tap
 * costs no write.
 */
export function setRosterEntry(
  roster: Roster,
  studentId: number,
  input: RosterInput | null,
  now: number,
): Roster {
  const id = asStudentId(studentId);
  if (id === undefined) return roster;
  const key = String(id);
  if (input === null) {
    if (!(key in roster)) return roster;
    const next = { ...roster };
    delete next[key];
    return next;
  }
  const stars = clampInt(input.stars, 1, 5, 1);
  const ue = input.ue === undefined ? undefined : clampInt(input.ue, 0, 4, 0);
  const entry = makeEntry(stars, ue, now);
  if (sameEntry(roster[key], entry)) return roster;
  if (!(key in roster) && Object.keys(roster).length >= MAX_ROSTER_ENTRIES) {
    return roster;
  }
  return { ...roster, [key]: entry };
}

// ---------------------------------------------------------------------------
// Text export / import
//
//   BAT1 10000:5:2 10001:3 10004:4
//
// "BAT1" = Blue Archive Tool roster, format 1. Then one token per student:
// id:stars, plus :ue when the unique weapon has stars. Plain ASCII, so it
// survives chat apps, notes and email; any whitespace, comma or semicolon
// separates tokens, and the header may sit anywhere in the pasted text
// ("my roster: BAT1 …" works). A future format bumps the number.
// ---------------------------------------------------------------------------

export const ROSTER_FORMAT_VERSION = 1;
const HEADER = `BAT${ROSTER_FORMAT_VERSION}`;
/** About 80× a full roster export; anything longer is not one. */
export const MAX_IMPORT_LENGTH = 200_000;

const HEADER_PATTERN = /(?:^|[^A-Za-z0-9])BAT(\d{1,3})(?=$|[\s,;])/i;
const TOKEN = /^(\d{1,7}):([1-5])(?::([0-4]))?$/;

const gradeRank = (input: RosterInput) => input.stars * 10 + (input.ue ?? 0);

export function exportRoster(roster: Roster): string {
  const tokens = Object.keys(roster)
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0)
    .sort((a, b) => a - b)
    .map((id) => {
      const entry = roster[String(id)];
      return entry.ue ? `${id}:${entry.stars}:${entry.ue}` : `${id}:${entry.stars}`;
    });
  return [HEADER, ...tokens].join(" ");
}

export type RosterImportError =
  /** Nothing pasted. */
  | "empty"
  /** Not an export from this app. */
  | "header"
  /** An export from a newer app version. */
  | "version"
  /** Right header, but a token is damaged. */
  | "entry"
  | "tooLarge";

export type RosterImportResult =
  | { ok: true; entries: Record<string, RosterInput>; count: number }
  | { ok: false; reason: RosterImportError };

/**
 * Parse export text. All or nothing: a single damaged token rejects the
 * whole paste, because a half-applied import is impossible to reason about.
 */
export function parseRosterText(text: unknown): RosterImportResult {
  if (typeof text !== "string" || !text.trim()) return { ok: false, reason: "empty" };
  if (text.length > MAX_IMPORT_LENGTH) return { ok: false, reason: "tooLarge" };

  const header = HEADER_PATTERN.exec(text);
  if (!header) return { ok: false, reason: "header" };
  if (Number(header[1]) !== ROSTER_FORMAT_VERSION) {
    return { ok: false, reason: "version" };
  }

  const body = text.slice(header.index + header[0].length);
  const tokens = body.split(/[\s,;]+/).filter(Boolean);
  if (tokens.length > MAX_ROSTER_ENTRIES) return { ok: false, reason: "tooLarge" };

  const entries: Record<string, RosterInput> = {};
  for (const token of tokens) {
    const match = TOKEN.exec(token);
    const id = match ? asStudentId(match[1]) : undefined;
    if (!match || id === undefined) return { ok: false, reason: "entry" };
    const stars = Number(match[2]);
    const ue = Number(match[3] ?? 0);
    const candidate: RosterInput = stars === 5 && ue > 0 ? { stars, ue } : { stars };
    // Duplicates: the higher grade wins, same rule as merging.
    const prev = entries[String(id)];
    entries[String(id)] =
      prev && gradeRank(prev) >= gradeRank(candidate) ? prev : candidate;
  }
  return { ok: true, entries, count: Object.keys(entries).length };
}

/** Merge imported entries in, keeping the higher star / weapon grade per student. */
export function mergeRoster(
  roster: Roster,
  incoming: Record<string, RosterInput>,
  now: number,
): Roster {
  let next: Roster | null = null;
  for (const [key, input] of Object.entries(incoming)) {
    const id = asStudentId(key);
    if (id === undefined) continue;
    const current = (next ?? roster)[String(id)];
    const stars = Math.max(current?.stars ?? 0, clampInt(input.stars, 1, 5, 1));
    const ue = Math.max(current?.ue ?? 0, clampInt(input.ue ?? 0, 0, 4, 0));
    const entry = makeEntry(stars, ue, now);
    if (sameEntry(current, entry)) continue;
    if (!current && Object.keys(next ?? roster).length >= MAX_ROSTER_ENTRIES) break;
    next = { ...(next ?? roster), [String(id)]: entry };
  }
  return next ?? roster;
}

// ---------------------------------------------------------------------------
// Multi-form units
//
// A few students exist as two SchaleDB records joined by LinkedCharacterId
// (Hoshino (Armed) as Dealer and as Tank). Recruiting one gives both, so
// collection stats count the pair once and either id marks the unit owned.
// ---------------------------------------------------------------------------

export interface UnitLike {
  Id: number;
  LinkedCharacterId?: number;
}

/** One id per unit: the lower of the two linked ids. */
export const unitIdOf = (student: UnitLike): number =>
  typeof student.LinkedCharacterId === "number"
    ? Math.min(student.Id, student.LinkedCharacterId)
    : student.Id;

/** The entry for this student or its linked form (the higher grade if both). */
export function unitEntry(roster: Roster, student: UnitLike): RosterEntry | undefined {
  const own = roster[String(student.Id)];
  const linked =
    typeof student.LinkedCharacterId === "number"
      ? roster[String(student.LinkedCharacterId)]
      : undefined;
  if (!own || !linked) return own ?? linked;
  return gradeRank(linked) > gradeRank(own) ? linked : own;
}

export const ownsUnit = (roster: Roster, student: UnitLike) =>
  unitEntry(roster, student) !== undefined;

/** Owned vs total units across `students`, linked forms counted once. */
export function countOwnedUnits(
  roster: Roster,
  students: readonly UnitLike[],
): { owned: number; total: number } {
  const units = new Map<number, boolean>();
  for (const student of students) {
    const unit = unitIdOf(student);
    units.set(unit, (units.get(unit) ?? false) || ownsUnit(roster, student));
  }
  let owned = 0;
  units.forEach((isOwned) => {
    if (isOwned) owned += 1;
  });
  return { owned, total: units.size };
}

export const rosterStore = createJsonStore<Roster>(
  ROSTER_KEY,
  normalizeRoster,
  () => ({}),
);
