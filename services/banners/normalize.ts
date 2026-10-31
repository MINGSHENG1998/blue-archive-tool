// Firestore → Banner, at the boundary.
//
// Banner docs are edited by hand in the backoffice and written by a sync job,
// and shipped app versions can never be force-updated, so every field here is
// treated as hostile: it may be missing, null, the wrong type, or a shape an
// older backoffice wrote. A release build turns one uncaught render throw into
// a dead app for every user at once (this has happened), so the rule is
// simple — nothing in this file throws, and anything unusable is dropped or
// defaulted here rather than discovered in a component.
//
// The normalizer is idempotent: feeding a normalized Banner back through
// normalizeBanner() returns an equal Banner. The cache relies on that to
// re-validate what it stored under an older app version.

import type { Locale } from "@/constants/i18n";
import type { AtkType, DefType } from "@/dto/game.dto";
import {
  asFlag,
  asHttpUrl,
  asRecord,
  asStudentId,
  asText,
  intInRange,
} from "@/services/userdata/sanitize";

import { toScheduleField } from "./time";
import type {
  Banner,
  BannerCharacter,
  BannerType,
  CharacterClass,
  RawDoc,
} from "./types";

const NAME_MAX = 120;
const ID_MAX = 200;
/** No real banner has more than a handful; this bounds a runaway array. */
const MAX_CHARACTERS_PER_BANNER = 40;

const BANNER_TYPES: Record<string, BannerType> = {
  new: "New",
  rerun: "Rerun",
  "re-run": "Rerun",
  fes: "Fes",
  fest: "Fes",
  festival: "Fes",
  collab: "Collab",
  collaboration: "Collab",
};

/**
 * Unknown types render as a rerun — the neutral styling — while rawType keeps
 * the original for anyone who needs it.
 */
export function toBannerType(raw: string): BannerType {
  return BANNER_TYPES[raw.trim().toLowerCase()] ?? "Rerun";
}

// The app's own spellings first, then SchaleDB's (BulletType / ArmorType /
// SquadType), so a doc written straight from SchaleDB data still resolves.
const ATK_TYPES: Record<string, AtkType> = {
  explosive: "explosive",
  explosion: "explosive",
  piercing: "piercing",
  pierce: "piercing",
  mystic: "mystic",
  sonic: "sonic",
  chemical: "chemical",
};

const DEF_TYPES: Record<string, DefType> = {
  light: "light",
  heavy: "heavy",
  special: "special",
  unarmed: "special",
  elastic: "elastic",
  composite: "composite",
};

const CLASSES: Record<string, CharacterClass> = {
  striker: "striker",
  main: "striker",
  special: "special",
  support: "special",
};

const enumKey = (value: unknown) =>
  typeof value === "string"
    ? value.toLowerCase().replace(/[\s_-]+/g, "")
    : "";

export const toAtkType = (value: unknown): AtkType | null =>
  ATK_TYPES[enumKey(value)] ?? null;

export const toDefType = (value: unknown): DefType | null =>
  DEF_TYPES[enumKey(value).replace(/armor$/, "")] ?? null;

export const toCharacterClass = (value: unknown): CharacterClass | null =>
  CLASSES[enumKey(value)] ?? null;

const LOCALES: readonly Locale[] = ["en", "zh", "ko", "ja", "vi", "th"];
// Keys an older or hand-written doc might use instead of ours.
const LOCALE_ALIASES: Record<Locale, readonly string[]> = {
  en: [],
  zh: ["cn", "tw", "zh-cn", "zh-tw"],
  ko: ["kr"],
  ja: ["jp"],
  vi: [],
  th: [],
};

/**
 * Firestore stores `translations.<locale>.name`; a normalized character holds
 * the plain string. Both shapes are read, so this is idempotent.
 */
export function normalizeTranslations(
  raw: unknown,
): Partial<Record<Locale, string>> {
  const record = asRecord(raw);
  const out: Partial<Record<Locale, string>> = {};
  if (!record) return out;
  const read = (value: unknown) =>
    asText(value, NAME_MAX) ?? asText(asRecord(value)?.name, NAME_MAX);
  for (const locale of LOCALES) {
    let name = read(record[locale]);
    for (const alias of LOCALE_ALIASES[locale]) {
      if (name) break;
      name = read(record[alias]);
    }
    if (name) out[locale] = name;
  }
  return out;
}

// Our Hosting mirror and SchaleDB both name icons by student id. Docs linked
// before `studentId` existed still carry such a URL, and recovering the id
// from it is what lets the watchlist and the roster find those students.
const ICON_ID_PATTERNS = [
  /^https:\/\/blue-archive-tool\.web\.app\/icons\/(\d+)\.webp(?:[?#].*)?$/i,
  /^https:\/\/schaledb\.com\/images\/student\/(?:icon|portrait|collection)\/(\d+)\.webp(?:[?#].*)?$/i,
];

export function studentIdFromImage(url: string): number | undefined {
  for (const pattern of ICON_ID_PATTERNS) {
    const match = pattern.exec(url);
    if (match) return asStudentId(match[1]);
  }
  return undefined;
}

const asDocId = (value: unknown): string | undefined =>
  typeof value === "number" && Number.isSafeInteger(value)
    ? String(value)
    : asText(value, ID_MAX);

/**
 * One character, from a `characters` doc, an embedded banner copy, or an
 * already-normalized BannerCharacter. Null when there is nothing to show: no
 * name and no student id to look one up by.
 */
export function normalizeCharacter(
  raw: unknown,
  fallbackId?: string,
): BannerCharacter | null {
  const record = asRecord(raw);
  if (!record) return null;

  const translations = normalizeTranslations(record.translations);
  const image = asHttpUrl(record.image) ?? "";
  const studentId =
    asStudentId(record.studentId) ??
    (image ? studentIdFromImage(image) : undefined);
  const name =
    asText(record.name, NAME_MAX) ??
    translations.en ??
    LOCALES.map((l) => translations[l]).find(Boolean) ??
    "";
  if (!name && studentId === undefined) return null;

  const id =
    asDocId(record.id) ??
    fallbackId ??
    (studentId !== undefined ? `student-${studentId}` : `name-${name}`);

  const character: BannerCharacter = {
    id,
    name,
    image,
    // Recruitment pickups are always 3★; a missing rarity should not demote one.
    rarity: intInRange(record.rarity, 1, 5) ?? 3,
    atkType: toAtkType(record.atkType),
    defType: toDefType(record.defType),
    // `class` in Firestore, `cls` once normalized.
    cls: toCharacterClass(record.cls ?? record.class),
    isNew: asFlag(record.isNew),
    isLimited: asFlag(record.isLimited),
    translations,
  };
  if (studentId !== undefined) character.studentId = studentId;
  return character;
}

/**
 * Shallow merge of a banner's embedded copy with the `characters` doc it
 * points at. The doc wins wherever it has a value; the embedded copy fills
 * the gaps (an older doc without studentId, say).
 */
function mergeCharacterSources(embedded: unknown, joined: unknown): unknown {
  const base = asRecord(embedded);
  const top = asRecord(joined);
  if (!base) return joined;
  if (!top) return embedded;
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(top)) {
    if (value !== undefined && value !== null) merged[key] = value;
  }
  return merged;
}

function resolveCharacters(
  bannerId: string,
  record: Record<string, unknown>,
  characterDocs: ReadonlyMap<string, unknown>,
): BannerCharacter[] {
  const embedded = Array.isArray(record.characters) ? record.characters : [];
  const embeddedById = new Map<string, unknown>();
  for (const item of embedded) {
    const id = asDocId(asRecord(item)?.id);
    if (id && !embeddedById.has(id)) embeddedById.set(id, item);
  }

  // Today's behaviour, kept: the characterIds join is authoritative, and the
  // embedded characters[] copy is the fallback when the join yields nothing.
  // Per id, the embedded copy also covers a characters doc that is missing.
  const sources: { raw: unknown; id?: string }[] = [];
  const ids = Array.isArray(record.characterIds) ? record.characterIds : [];
  for (const rawId of ids) {
    const id = asDocId(rawId);
    if (!id) continue;
    const joined = characterDocs.get(id);
    const copy = embeddedById.get(id);
    if (joined === undefined && copy === undefined) continue;
    sources.push({ raw: mergeCharacterSources(copy, joined), id });
  }
  if (sources.length === 0) {
    for (const item of embedded) sources.push({ raw: item });
  }

  const seen = new Set<string>();
  const out: BannerCharacter[] = [];
  sources.forEach(({ raw, id }, index) => {
    if (out.length >= MAX_CHARACTERS_PER_BANNER) return;
    // The join id is the doc id; a stray `id` field inside the doc must not
    // override it.
    const merged = id ? { ...(asRecord(raw) ?? {}), id } : raw;
    const character = normalizeCharacter(merged, `${bannerId}-${index}`);
    if (!character || seen.has(character.id)) return;
    seen.add(character.id);
    out.push(character);
  });
  return out;
}

const EMPTY_DOCS: ReadonlyMap<string, unknown> = new Map();

/**
 * One banner doc → Banner, or null when it cannot be placed on the timeline
 * (no id, an unparseable date, or an end that is not after its start).
 */
export function normalizeBanner(
  id: unknown,
  raw: unknown,
  characterDocs: ReadonlyMap<string, unknown> = EMPTY_DOCS,
): Banner | null {
  const bannerId = asDocId(id);
  const record = asRecord(raw);
  if (!bannerId || !record) return null;

  const start = toScheduleField(record.startDate);
  const end = toScheduleField(record.endDate);
  if (!start || !end || end.at <= start.at) return null;

  // A cached Banner carries rawType; a Firestore doc only has `type`.
  const rawType =
    typeof record.rawType === "string"
      ? record.rawType.trim().slice(0, NAME_MAX)
      : (asText(record.type, NAME_MAX) ?? "");

  return {
    id: bannerId,
    type: toBannerType(rawType),
    rawType,
    startDate: start.text,
    endDate: end.text,
    startAt: start.at,
    endAt: end.at,
    characters: resolveCharacters(bannerId, record, characterDocs),
  };
}

/** Timeline order: start, then end, then id so the order is total and stable. */
export function compareBanners(a: Banner, b: Banner): number {
  return (
    a.startAt - b.startAt || a.endAt - b.endAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

/**
 * Every usable banner, sorted, ended ones included (selection is select.ts's
 * job). Duplicate doc ids keep the first occurrence.
 */
export function normalizeBanners(
  bannerDocs: readonly RawDoc[],
  characterDocs: readonly RawDoc[] = [],
): Banner[] {
  const characters = new Map<string, unknown>();
  for (const doc of characterDocs) {
    const id = asDocId(doc?.id);
    if (id && !characters.has(id)) characters.set(id, doc.data);
  }

  const seen = new Set<string>();
  const out: Banner[] = [];
  for (const doc of bannerDocs) {
    const banner = normalizeBanner(doc?.id, doc?.data, characters);
    if (!banner || seen.has(banner.id)) continue;
    seen.add(banner.id);
    out.push(banner);
  }
  return out.sort(compareBanners);
}
