// Pure selectors over the live schedule SchaleDB publishes in config: which
// events and raids are running right now, and how to hit the boss. No IO, no
// React — like students.ts, "now" is always passed in, never read from the
// clock.
//
// Every selector here is total. Home renders these on every launch, so any
// shape of missing, unknown or expired upstream data yields an empty list or a
// null field, never a throw. SchaleDB is curated by hand and lags the game, so
// "nothing live" is a normal answer, not an error.

import {
  REGION,
  type GameConfig,
  type GameRaids,
  type RaidNames,
  type RegionKey,
  type TypeEffectiveness,
} from "./types";

/** TypeEffectiveness stores multipliers x10000; this is 1x. */
export const NEUTRAL_MULTIPLIER = 10_000;

/** SchaleDB gives a rerun the original event's id plus this. */
export const RERUN_EVENT_OFFSET = 10_000;

type Schedule = Pick<GameConfig, "regions"> | null | undefined;

const isWindow = (entry: unknown): entry is { start: number; end: number } =>
  typeof entry === "object" &&
  entry !== null &&
  Number.isFinite((entry as { start?: unknown }).start) &&
  Number.isFinite((entry as { end?: unknown }).end);

/** Seconds left in a window that has started and not ended; null otherwise. */
function secondsLeftIn(span: { start: number; end: number }, now: Date): number | null {
  const nowSeconds = now.getTime() / 1000;
  if (span.start > nowSeconds) return null;
  const left = Math.floor(span.end - nowSeconds);
  // Upstream leaves a window in place past its end; "0m left" forever is
  // worse than showing nothing.
  return left > 0 ? left : null;
}

// --- Events ----------------------------------------------------------------

export interface LiveEvent {
  /** The id as config lists it; a rerun's is the original's + 10000. */
  id: number;
  /** The original event's id, which is what EventName is keyed by. */
  baseId: number;
  isRerun: boolean;
  /** Unix seconds. */
  start: number;
  end: number;
  secondsLeft: number;
}

/** The original event behind a rerun id; any other id is returned as-is. */
export function baseEventId(id: number): number {
  return id >= RERUN_EVENT_OFFSET && id < RERUN_EVENT_OFFSET * 2
    ? id - RERUN_EVENT_OFFSET
    : id;
}

/**
 * An event's title from the first label map that has it, trying the exact id
 * before the original a rerun points at. Pass the active locale's EventName
 * first and English's after it. Null when nobody knows the event yet.
 */
export function eventTitle(
  id: number,
  ...sources: (Record<string, string> | undefined)[]
): string | null {
  const base = baseEventId(id);
  for (const source of sources) {
    const title = source?.[String(id)] || source?.[String(base)];
    if (title) return title;
  }
  return null;
}

/** Events running right now on a region, ending soonest first. */
export function liveEvents(
  config: Schedule,
  now: Date,
  region: RegionKey = "global",
): LiveEvent[] {
  const events = config?.regions?.[REGION[region]]?.CurrentEvents;
  if (!Array.isArray(events)) return [];

  const live: LiveEvent[] = [];
  for (const entry of events) {
    if (!isWindow(entry) || !Number.isInteger(entry.event)) continue;
    const secondsLeft = secondsLeftIn(entry, now);
    if (secondsLeft === null) continue;
    const baseId = baseEventId(entry.event);
    live.push({
      id: entry.event,
      baseId,
      isRerun: baseId !== entry.event,
      start: entry.start,
      end: entry.end,
      secondsLeft,
    });
  }
  return live.sort((a, b) => a.end - b.end || a.id - b.id);
}

// --- Raids -----------------------------------------------------------------

/**
 * The raid types config.CurrentRaid uses that the snapshot can describe:
 * Total Assault, Grand Assault, and multi-floor raids (Set, Chokmah,
 * Tiphareth).
 */
export type RaidKind = "Raid" | "EliminateRaid" | "MultiFloorRaid";

export interface LiveRaid {
  kind: RaidKind;
  /** Boss id within its kind's table (raids.raid / raids.multiFloor). */
  id: number;
  /** In the requested locale when a name overlay was passed; English otherwise. */
  name: string;
  /**
   * Armor the boss fields. One entry, except Grand Assault, which runs three
   * at once — listed hardest-open tier first. Empty only for a Grand Assault
   * season this snapshot predates: no armor beats the wrong one.
   */
  armorTypes: string[];
  /**
   * What the boss attacks with where it matters: Insane and up for Total and
   * Grand Assault, the non-"Normal" floors of a multi-floor raid.
   */
  bulletTypes: string[];
  /** This season's terrain; null when upstream does not say and the boss has used several. */
  terrain: string | null;
  /** Season id, when config carries one. */
  season: number | null;
  /** Unix seconds. */
  start: number;
  end: number;
  secondsLeft: number;
}

const unique = (values: string[]) => [...new Set(values)];

/** Grand Assault armors, hardest-open first, from the season's OpenDifficulty. */
function eliminateArmors(
  raids: GameRaids,
  region: RegionKey,
  season: number | null,
): string[] {
  if (season === null) return [];
  const open = raids.eliminate?.[REGION[region]]?.[String(season)];
  if (!open) return [];
  return Object.entries(open)
    .sort((a, b) => b[1] - a[1])
    .map(([armorType]) => armorType);
}

/**
 * Raids running right now on a region, resolved against the raid table and
 * ending soonest first. A raid this snapshot has no boss record for is
 * skipped rather than shown nameless — it can only happen when the raids file
 * failed to refresh, and the next build fixes it.
 */
export function liveRaids(
  config: Schedule,
  raids: GameRaids | null | undefined,
  now: Date,
  options: { region?: RegionKey; names?: RaidNames } = {},
): LiveRaid[] {
  const region = options.region ?? "global";
  const entries = config?.regions?.[REGION[region]]?.CurrentRaid;
  if (!Array.isArray(entries) || !raids) return [];

  const live: LiveRaid[] = [];
  for (const entry of entries) {
    if (!isWindow(entry) || !Number.isInteger(entry.raid)) continue;
    const secondsLeft = secondsLeftIn(entry, now);
    if (secondsLeft === null) continue;

    const id = entry.raid;
    const season = Number.isInteger(entry.season) ? (entry.season as number) : null;
    const timing = { id, season, start: entry.start, end: entry.end, secondsLeft };
    const seasonTerrain =
      typeof entry.terrain === "string" && entry.terrain ? entry.terrain : null;
    const pickTerrain = (terrains: string[] | undefined) =>
      seasonTerrain ?? (terrains?.length === 1 ? terrains[0] : null);

    if (entry.type === "MultiFloorRaid") {
      const boss = raids.multiFloor?.[String(id)];
      if (!boss) continue;
      // The opening floors hit with "Normal"; the floors that decide the
      // team are the ones after.
      const typed = unique(boss.BulletTypes.filter((type) => type !== "Normal"));
      live.push({
        ...timing,
        kind: "MultiFloorRaid",
        name: options.names?.multiFloor?.[String(id)] || boss.Name,
        armorTypes: [boss.ArmorType],
        bulletTypes: typed.length > 0 ? typed : unique(boss.BulletTypes),
        terrain: pickTerrain(boss.Terrain),
      });
    } else if (entry.type === "Raid" || entry.type === "EliminateRaid") {
      const boss = raids.raid?.[String(id)];
      if (!boss) continue;
      const grand = entry.type === "EliminateRaid";
      live.push({
        ...timing,
        kind: entry.type,
        name: options.names?.raid?.[String(id)] || boss.Name,
        // A Grand Assault boss fields other armors than its Total Assault
        // self, so the base ArmorType would be the wrong answer there.
        armorTypes: grand ? eliminateArmors(raids, region, season) : [boss.ArmorType],
        bulletTypes: [boss.BulletTypeInsane ?? boss.BulletType],
        terrain: pickTerrain(boss.Terrain),
      });
    }
    // Any other type (time attack, world raid) has no table in the snapshot.
  }
  return live.sort((a, b) => a.end - b.end || a.id - b.id);
}

// --- Type chart ------------------------------------------------------------

type Chart = { TypeEffectiveness?: TypeEffectiveness } | null | undefined;

/**
 * Attack types that deal more than neutral damage to an armor type, strongest
 * first (ties keep the chart's own order). In SchaleDB's spelling — map with
 * toAtkType for the app's icons. Empty when the chart is missing.
 */
export function effectiveBulletTypes(armorType: string, config: Chart): string[] {
  const chart = config?.TypeEffectiveness;
  if (!chart) return [];
  const hits: { bulletType: string; multiplier: number }[] = [];
  for (const [bulletType, row] of Object.entries(chart)) {
    const multiplier = row?.[armorType];
    if (typeof multiplier === "number" && multiplier > NEUTRAL_MULTIPLIER) {
      hits.push({ bulletType, multiplier });
    }
  }
  return hits.sort((a, b) => b.multiplier - a.multiplier).map((hit) => hit.bulletType);
}

/**
 * The damage factor of an attack type against an armor type: 2 for double,
 * 1.5, 1 for neutral, 0.5 for halved. Null when the chart lacks the pair.
 */
export function typeMultiplier(
  bulletType: string,
  armorType: string,
  config: Chart,
): number | null {
  const value = config?.TypeEffectiveness?.[bulletType]?.[armorType];
  return typeof value === "number" ? value / NEUTRAL_MULTIPLIER : null;
}
