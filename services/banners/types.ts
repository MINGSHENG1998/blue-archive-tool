// The banner schedule as screens consume it: Firestore's curated timeline after
// normalize.ts has been over it, so nothing downstream ever meets a missing
// name, a characters field that is not an array, or a date that cannot be
// parsed. Spec §5 is the contract; widen it additively.

import type { Locale } from "@/constants/i18n";
import type { AtkType, DefType } from "@/dto/game.dto";

/**
 * Editorial banner type. Firestore has only ever held these four, but the
 * field is typed by hand in the backoffice, so anything else is kept in
 * `Banner.rawType` and styled as "Rerun".
 */
export type BannerType = "New" | "Rerun" | "Fes" | "Collab";

export type CharacterClass = "striker" | "special";

export interface BannerCharacter {
  /** Firestore character doc id (or a derived stable key). Unique within its banner. */
  id: string;
  /**
   * SchaleDB student id. Set by the backoffice link step, or recovered from
   * the icon URL for docs that predate it. Absent for the odd unlinked doc.
   */
  studentId?: number;
  /** Editorial display name, which may differ from SchaleDB's spelling. Empty only when studentId is set. */
  name: string;
  /** Stored icon URL, "" when absent or not http(s). Render via characterImageUris(). */
  image: string;
  /** Recruitment rarity; pickups are 3. */
  rarity: number;
  atkType: AtkType | null;
  defType: DefType | null;
  cls: CharacterClass | null;
  isNew: boolean;
  isLimited: boolean;
  /** Localized display names. Use characterName() rather than reading this directly. */
  translations: Partial<Record<Locale, string>>;
}

export interface Banner {
  /** Firestore doc id. Docs can be deleted and recreated by a re-sync, so never persist it. */
  id: string;
  type: BannerType;
  /** Firestore's `type` as stored (trimmed), "" when absent. */
  rawType: string;
  /** As stored: "YYYY-MM-DD" in practice, a full ISO string when the backoffice is precise. */
  startDate: string;
  endDate: string;
  /**
   * ms epoch. A date-only value resolves to 02:00 UTC (11:00 JST) on that
   * day — the instant Global's weekly maintenance rotates recruitment.
   */
  startAt: number;
  /** ms epoch, exclusive: the banner is over at exactly this instant. */
  endAt: number;
  characters: BannerCharacter[];
}

export type BannerPhase = "upcoming" | "live" | "ended";

/** One Firestore document as fetch.ts hands it over: an id and untrusted data. */
export interface RawDoc {
  id: string;
  data: unknown;
}
