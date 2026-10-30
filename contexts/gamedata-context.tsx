import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLanguage } from "@/contexts/language-context";
import {
  bundledSnapshot,
  eventTitle,
  indexById,
  limitedCategory,
  loadGameData,
  nameFor,
  refreshGameData,
  type GameDataSnapshot,
  type GameLocalization,
  type GameRaids,
  type GameStudent,
  type LocalizationSection,
  type RaidNames,
  type RegionKey,
  type StudentIndex,
} from "@/services/gamedata";

// The pure live-schedule helpers, re-exported so a screen reading the context
// can take them from the same import:
//   const { config, raids, raidNames } = useGameData();
//   liveRaids(config, raids, now, { names: raidNames });
export {
  effectiveBulletTypes,
  liveEvents,
  liveRaids,
  typeMultiplier,
  type LiveEvent,
  type LiveRaid,
} from "@/services/gamedata";

interface GameDataContextValue {
  students: GameStudent[];
  byId: StudentIndex;
  config: GameDataSnapshot["config"];
  /** Raid bosses (English names), for liveRaids. */
  raids: GameRaids;
  /** Boss names in the active locale; undefined for English. Pass to liveRaids. */
  raidNames: RaidNames | undefined;
  /** Where the data came from — surfaced in the Misc screen for support. */
  source: GameDataSnapshot["source"];
  /** False only for the first tick, before the cache read resolves. */
  ready: boolean;
  /** Display name in the active locale, English fallback. */
  displayName: (student: GameStudent) => string;
  /**
   * Localized label for an enum value, e.g. label("School", "Gehenna").
   * Falls back to English, then to the raw key, so an enum value SchaleDB adds
   * before we ship a new snapshot still renders as something readable.
   */
  label: (section: LocalizationSection, key: string) => string;
  /**
   * Event title in the active locale, English fallback; reruns resolve to the
   * original's title. Null for an event no snapshot names yet — a bare id is
   * not worth showing.
   */
  eventName: (id: number) => string | null;
  /**
   * The student's availability category, worded short ("Regular", "Unique",
   * "Fest", …). Null for a category value this build does not know.
   */
  isLimitedLabel: (student: GameStudent, region?: RegionKey) => string | null;
  /** One sentence explaining the category, for a tooltip or detail line. */
  isLimitedTooltip: (student: GameStudent, region?: RegionKey) => string | null;
  /** Force an upstream check, bypassing the 12h throttle. */
  refresh: () => Promise<void>;
}

// Seeded with the bundled snapshot rather than null: game data is always
// available, so no consumer needs a loading branch or a null check.
const initialSnapshot = bundledSnapshot();

const GameDataContext = createContext<GameDataContextValue>({
  students: initialSnapshot.students,
  byId: {},
  config: initialSnapshot.config,
  raids: initialSnapshot.raids,
  raidNames: undefined,
  source: initialSnapshot.source,
  ready: false,
  displayName: (student) => student.Name,
  label: (_section, key) => key,
  eventName: () => null,
  isLimitedLabel: () => null,
  isLimitedTooltip: () => null,
  refresh: async () => {},
});

/** The first non-empty entry for `key` across label sections, in order. */
function firstLabel(
  key: string,
  ...sections: (Record<string, string> | undefined)[]
): string | null {
  for (const section of sections) {
    const value = section?.[key];
    if (value) return value;
  }
  return null;
}

export function GameDataProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguage();
  const [snapshot, setSnapshot] = useState<GameDataSnapshot>(initialSnapshot);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);
  // Read inside the load effect without making it depend on `snapshot`.
  const snapshotRef = useRef(initialSnapshot);
  snapshotRef.current = snapshot;
  // Same trick for the locale: a language switch should not re-trigger a
  // refresh, it just decides which overlay the next one downloads.
  const localeRef = useRef(locale);
  localeRef.current = locale;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // This provider wraps the whole app. An unhandled rejection here would
      // take down every screen over data that is only ever supplementary, so
      // the bundled snapshot already in state is the floor for any failure.
      let initial = snapshotRef.current;
      try {
        initial = await loadGameData();
        if (cancelled) return;
        setSnapshot(initial);
      } catch {
        // Keep the bundled snapshot.
      } finally {
        if (!cancelled) setReady(true);
      }

      try {
        // Background: never blocks first paint, never surfaces an error.
        const fresh = await refreshGameData(
          initial,
          Date.now(),
          false,
          localeRef.current,
        );
        if (!cancelled && fresh) setSnapshot(fresh);
      } catch {
        // Offline or upstream trouble; the snapshot in state is still valid.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const fresh = await refreshGameData(snapshot, Date.now(), true, locale);
      if (fresh && mounted.current) setSnapshot(fresh);
    } catch {
      // Manual refresh is best-effort too.
    }
  }, [snapshot, locale]);

  const byId = useMemo(() => indexById(snapshot.students), [snapshot.students]);

  const displayName = useCallback(
    (student: GameStudent) => nameFor(student, locale, snapshot.names),
    [locale, snapshot.names],
  );

  // Active locale first, English second; the same pair every lookup walks.
  const labelSets = useMemo<(GameLocalization | undefined)[]>(
    () => [snapshot.labels[locale], snapshot.labels.en],
    [locale, snapshot.labels],
  );

  const label = useCallback(
    (section: LocalizationSection, key: string) =>
      firstLabel(key, ...labelSets.map((set) => set?.[section])) ?? key,
    [labelSets],
  );

  const eventName = useCallback(
    (id: number) => eventTitle(id, ...labelSets.map((set) => set?.EventName)),
    [labelSets],
  );

  const isLimitedLabel = useCallback(
    (student: GameStudent, region: RegionKey = "global") => {
      const category = limitedCategory(student, region);
      if (category === null) return null;
      // IsLimited has the badge wording but no entry for Regular, which only
      // the filter section names.
      return firstLabel(
        String(category),
        ...labelSets.flatMap((set) => [set?.IsLimited, set?.IsLimitedFilter]),
      );
    },
    [labelSets],
  );

  const isLimitedTooltip = useCallback(
    (student: GameStudent, region: RegionKey = "global") => {
      const category = limitedCategory(student, region);
      if (category === null) return null;
      return firstLabel(
        String(category),
        ...labelSets.map((set) => set?.IsLimitedTooltip),
      );
    },
    [labelSets],
  );

  const raidNames = locale === "en" ? undefined : snapshot.raidNames[locale];

  const value = useMemo<GameDataContextValue>(
    () => ({
      students: snapshot.students,
      byId,
      config: snapshot.config,
      raids: snapshot.raids,
      raidNames,
      source: snapshot.source,
      ready,
      displayName,
      label,
      eventName,
      isLimitedLabel,
      isLimitedTooltip,
      refresh,
    }),
    [
      snapshot,
      byId,
      raidNames,
      ready,
      displayName,
      label,
      eventName,
      isLimitedLabel,
      isLimitedTooltip,
      refresh,
    ],
  );

  return (
    <GameDataContext.Provider value={value}>{children}</GameDataContext.Provider>
  );
}

export const useGameData = () => useContext(GameDataContext);
