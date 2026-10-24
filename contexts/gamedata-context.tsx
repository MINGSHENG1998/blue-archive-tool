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
  indexById,
  loadGameData,
  nameFor,
  refreshGameData,
  type GameDataSnapshot,
  type GameStudent,
  type LocalizationSection,
  type StudentIndex,
} from "@/services/gamedata";

interface GameDataContextValue {
  students: GameStudent[];
  byId: StudentIndex;
  config: GameDataSnapshot["config"];
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
  source: initialSnapshot.source,
  ready: false,
  displayName: (student) => student.Name,
  label: (_section, key) => key,
  refresh: async () => {},
});

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

  const label = useCallback(
    (section: LocalizationSection, key: string) =>
      snapshot.labels[locale]?.[section]?.[key] ??
      snapshot.labels.en?.[section]?.[key] ??
      key,
    [locale, snapshot.labels],
  );

  const value = useMemo<GameDataContextValue>(
    () => ({
      students: snapshot.students,
      byId,
      config: snapshot.config,
      source: snapshot.source,
      ready,
      displayName,
      label,
      refresh,
    }),
    [snapshot, byId, ready, displayName, label, refresh],
  );

  return (
    <GameDataContext.Provider value={value}>{children}</GameDataContext.Provider>
  );
}

export const useGameData = () => useContext(GameDataContext);
