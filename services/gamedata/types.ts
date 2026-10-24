// Canonical game data, sourced from SchaleDB (https://schaledb.com).
//
// Firestore stays authoritative for the banner SCHEDULE and for editorial
// choices (custom display names, limited/fes flags). SchaleDB is authoritative
// for student FACTS. Nothing here is mirrored into Firestore.

/** Index into SchaleDB's `config.Regions` array. */
export const REGION = { japan: 0, global: 1, china: 2 } as const;
export type RegionKey = keyof typeof REGION;

/**
 * A SchaleDB student, trimmed to the fields this app uses.
 *
 * Field names keep SchaleDB's PascalCase so a record can be diffed against the
 * upstream JSON without a mental mapping step. All 20 fields are present on
 * every student in the current dataset, so none are optional — `trimStudent`
 * rejects a record that is missing one rather than letting `undefined` leak.
 */
export interface GameStudent {
  Id: number;
  Name: string;
  PathName: string;
  /** "M/D", or "-" for the handful of students with no birthday. */
  BirthDay: string;
  StarGrade: number;
  /** "Main" (striker) | "Support" (special). */
  SquadType: string;
  BulletType: string;
  ArmorType: string;
  School: string;
  Club: string;
  TacticRole: string;
  Position: string;
  WeaponType: string;
  /** Gift category tags; cross-referenced against items to rank gifts. */
  FavorItemTags: string[];
  FavorItemUniqueTags: string[];
  /** Per skill level: the item ids and amounts an upgrade costs. */
  SkillMaterial: number[][];
  SkillMaterialAmount: number[][];
  PotentialMaterial: number;
  /** Per region, in REGION order. */
  IsReleased: boolean[];
  IsLimited: number[];
}

/** Live schedule for one region. Unix seconds, as SchaleDB publishes them. */
export interface RegionSchedule {
  Name: string;
  StudentMaxLevel: number;
  BondMaxLevel: number;
  PotentialMax: number;
  CurrentGacha: { characters: number[]; start: number; end: number }[];
  CurrentEvents: { event: number; start: number; end: number }[];
  CurrentRaid: { type: string; raid: number; start: number; end: number }[];
}

export interface GameConfig {
  /** Monotonic upstream build stamp. The cache invalidation key. */
  build: number;
  regions: RegionSchedule[];
}

/** Locale code -> the SchaleDB path segment for it. */
export type NameMap = Record<string, string>;

/**
 * Localized labels for the enum values students are described by. Bundling
 * these means school, club, role and damage-type names are translated for every
 * locale without anyone maintaining a word list by hand.
 */
export interface GameLocalization {
  SquadType: Record<string, string>;
  BulletType: Record<string, string>;
  ArmorType: Record<string, string>;
  TacticRole: Record<string, string>;
  School: Record<string, string>;
  Club: Record<string, string>;
}

export type LocalizationSection = keyof GameLocalization;

export interface GameDataSnapshot {
  config: GameConfig;
  students: GameStudent[];
  /** Localized display names, keyed by student id as a string. */
  names: Partial<Record<"ja" | "ko" | "zh", NameMap>>;
  /** Enum labels per app locale. English is always present as the fallback. */
  labels: Partial<Record<"en" | "ja" | "ko" | "zh", GameLocalization>>;
  /** Where this snapshot came from, for diagnostics. */
  source: "bundled" | "cached";
}
