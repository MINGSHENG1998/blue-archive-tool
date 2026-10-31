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
 * upstream JSON without a mental mapping step.
 *
 * The first 20 fields are the core record: present on every student upstream,
 * so `trimStudent` rejects a record missing one rather than letting
 * `undefined` leak into the roster. The optional block below them is profile
 * detail for the student page; a record lacking any of it is still a student,
 * and the field is simply absent.
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
  /** Per region, in REGION order. See LIMITED_CATEGORY for the values. */
  IsLimited: number[];

  /** Terrain mood, 0 (D) to 5 (SS). See ADAPTATION_GRADES. */
  StreetBattleAdaptation?: number;
  OutdoorBattleAdaptation?: number;
  IndoorBattleAdaptation?: number;
  /** The three equipment slots, in tier-unlock order: "Hat", "Gloves", … */
  Equipment?: string[];
  /** Unique weapon name, lifted out of SchaleDB's heavy `Weapon` object. */
  WeaponName?: string;
  /** Profile strings, display-ready ("2nd Year", "Top Secret", "160cm"). */
  SchoolYear?: string;
  CharacterAge?: string;
  CharHeightMetric?: string;
  Hobby?: string;
  Illustrator?: string;
  /** Voice actor. */
  CharacterVoice?: string;
  /** Per region, in REGION order: bond rank that unlocks the memory lobby; 0 = not yet on that server. */
  MemoryLobby?: number[];
  /** The other form of a multi-form unit (Hoshino (Armed) Dealer/Tank). Only on those records. */
  LinkedCharacterId?: number;
}

/** A raid as config.CurrentRaid lists it. `terrain`/`season` ride along on Total and Grand Assault. */
export interface CurrentRaidEntry {
  /** "Raid" (Total Assault) | "EliminateRaid" (Grand Assault) | "MultiFloorRaid", or a type added later. */
  type: string;
  raid: number;
  start: number;
  end: number;
  terrain?: string;
  season?: number;
}

/** Live schedule for one region. Unix seconds, as SchaleDB publishes them. */
export interface RegionSchedule {
  Name: string;
  StudentMaxLevel: number;
  BondMaxLevel: number;
  PotentialMax: number;
  CurrentGacha: { characters: number[]; start: number; end: number }[];
  CurrentEvents: { event: number; start: number; end: number }[];
  CurrentRaid: CurrentRaidEntry[];
}

/**
 * Damage multiplier per attack type against each armor type, x10000:
 * 20000 = 2x (effective), 10000 = neutral, 5000 = halved (resisted).
 * Keyed `[BulletType][ArmorType]`.
 */
export type TypeEffectiveness = Record<string, Record<string, number>>;

export interface GameConfig {
  /** Monotonic upstream build stamp. The cache invalidation key. */
  build: number;
  regions: RegionSchedule[];
  /** Optional so a reshuffle upstream degrades the type chart, not the whole refresh. */
  TypeEffectiveness?: TypeEffectiveness;
}

/** Student id (as a string) -> localized display name. */
export type NameMap = Record<string, string>;

/**
 * Localized labels for the enum values students are described by. Bundling
 * these means school, club, role and damage-type names are translated for every
 * locale without anyone maintaining a word list by hand.
 *
 * The first six sections are required; the rest are optional so an upstream
 * rename costs one feature its labels rather than costing every locale all of
 * them.
 */
export interface GameLocalization {
  SquadType: Record<string, string>;
  BulletType: Record<string, string>;
  ArmorType: Record<string, string>;
  TacticRole: Record<string, string>;
  School: Record<string, string>;
  Club: Record<string, string>;
  /** Event id -> title. Reruns are id + 10000 upstream and share the original's title. */
  EventName?: Record<string, string>;
  /** Availability category, short form, keys "1".."4" (no entry for Regular). */
  IsLimited?: Record<string, string>;
  /** One sentence per category, keys "0".."4". */
  IsLimitedTooltip?: Record<string, string>;
  /** Availability category as the filter UI words it, keys "0".."4". */
  IsLimitedFilter?: Record<string, string>;
  /** Terrain names: Street -> "Urban", Outdoor -> "Field", Indoor -> "Indoor". */
  AdaptationType?: Record<string, string>;
}

export type LocalizationSection = keyof GameLocalization;

/** A Total Assault / Grand Assault boss. */
export interface GameRaid {
  Name: string;
  ArmorType: string;
  /** Attack type on the lower difficulties; usually the neutral "Normal". */
  BulletType: string;
  /** Attack type from Insane up, where it starts to matter. */
  BulletTypeInsane?: string;
  /** Every terrain this boss has been fielded on; the season picks one. */
  Terrain: string[];
}

/** A multi-floor raid (Set, Chokmah, Tiphareth): one armor, attack type per floor tier. */
export interface GameMultiFloorRaid {
  Name: string;
  ArmorType: string;
  BulletTypes: string[];
  Terrain: string[];
}

/** Highest difficulty tier open per armor type in one Grand Assault season. */
export type EliminateArmors = Record<string, number>;

/**
 * The raid reference data, trimmed from SchaleDB's ~1.2 MB raids file down to
 * what is needed to name the boss on now and say how to hit it.
 */
export interface GameRaids {
  /** Keyed by raid id. */
  raid: Record<string, GameRaid>;
  multiFloor: Record<string, GameMultiFloorRaid>;
  /**
   * Per region, in REGION order: Grand Assault season id -> its three armors.
   * Only the most recent seasons are kept; config.CurrentRaid names the one
   * running.
   */
  eliminate: Record<string, EliminateArmors>[];
}

/** Localized raid names, keyed like GameRaids. */
export interface RaidNames {
  raid: Record<string, string>;
  multiFloor: Record<string, string>;
}

/** Every locale carried as an overlay on the English base; keep in step with OVERLAY_LOCALES. */
export type OverlayLocale = "ja" | "ko" | "zh" | "vi" | "th";

export interface GameDataSnapshot {
  config: GameConfig;
  students: GameStudent[];
  /** Localized display names, keyed by student id as a string. */
  names: Partial<Record<OverlayLocale, NameMap>>;
  /** Enum labels per app locale. English is always present as the fallback. */
  labels: Partial<Record<"en" | OverlayLocale, GameLocalization>>;
  /** Raid bosses with English names. */
  raids: GameRaids;
  /** Localized raid names; English lives in `raids` itself. */
  raidNames: Partial<Record<OverlayLocale, RaidNames>>;
  /** Where this snapshot came from, for diagnostics. */
  source: "bundled" | "cached";
}
