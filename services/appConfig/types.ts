// Remote app configuration: the single Firestore doc `appConfig/app`, edited
// in the backoffice (BO-C). Spec §5 is the contract. Every field is optional
// and absence always means "use the built-in behaviour", so an app that never
// manages to read the doc behaves exactly like one reading an empty doc.
//
// Additive only: shipped versions read these names forever.

export type GachaSystem = "spark" | "charge";

export interface Announcement {
  /** Stable id, so a screen can remember "dismissed" per announcement. */
  id: string;
  en: string;
  ja?: string;
  ko?: string;
  zh?: string;
  /** http(s) link for "Read more". */
  url?: string;
  /** Stop showing it from this instant ("YYYY-MM-DD" = 02:00 UTC that day). */
  until?: string;
}

export interface AppConfig {
  /** Recruitment model override; see gachaSystemAt() for how it combines with gachaSystemFrom. */
  gachaSystem?: GachaSystem;
  /** "YYYY-MM-DD": the day the recruitment model switches. */
  gachaSystemFrom?: string;
  announcement?: Announcement;
  /** Newest version on the store, e.g. "2.0.1", for an update nudge. */
  latestVersion?: string;
  /** Remote kill switches / staged features. Absent key = feature default. */
  flags?: Record<string, boolean>;
  /** When the backoffice last saved the doc, ISO string. */
  updatedAt?: string;
}
