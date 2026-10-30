import React, { createContext, useCallback, useContext, useMemo } from "react";

import {
  adjustInventoryItem,
  apFullAt,
  apStore,
  currentAp,
  exportRoster,
  inventoryStore,
  mergeRoster,
  parseRosterText,
  rosterStore,
  setApReading,
  setInventoryItem,
  setInventoryItems,
  setRosterEntry,
  setWatched,
  spendAp,
  toggleWatched,
  usePersistentState,
  watchlistStore,
  DEFAULT_AP_CAP,
  type ApState,
  type Inventory,
  type Roster,
  type RosterEntry,
  type RosterImportError,
  type RosterInput,
} from "@/services/userdata";

// Personal state, all on-device. One provider owns every slice so that each
// AsyncStorage key has exactly one reader/writer (two owners of one key would
// each hold a copy and the last writer would silently win). Each slice has
// its own context, so starring a student does not re-render the AP timer.
//
// Every hook exposes `ready`: false until the stored value has been read.
// Edits made before that are not lost — they are replayed on top of the
// stored value — but anything that reads to decide (an export, a "you own
// 3/5" badge) should wait for it.

export interface WatchlistValue {
  ids: number[];
  has: (studentId: number) => boolean;
  toggle: (studentId: number) => void;
  /** Explicit form of toggle, for a control that knows the state it wants. */
  setWatched: (studentId: number, watched: boolean) => void;
  ready: boolean;
}

export type RosterImportOutcome =
  | { ok: true; count: number }
  | { ok: false; count: 0; reason: RosterImportError };

export interface RosterValue {
  entries: Roster;
  /** Direct ownership of this id. For multi-form units use ownsUnit() from services/userdata. */
  owns: (studentId: number) => boolean;
  get: (studentId: number) => RosterEntry | undefined;
  /** Set (clamped) or, with null, clear one student. */
  set: (studentId: number, entry: RosterInput | null) => void;
  /** The roster as BAT1 text for Share. Wait for `ready`, or it exports the empty default. */
  exportText: () => string;
  /**
   * Merge an export in (higher grade wins per student). Garbage is rejected
   * with a reason and the roster is not touched.
   */
  importText: (text: string) => RosterImportOutcome;
  ready: boolean;
}

export interface ApValue {
  /** The last reading, or null when the user has never entered one. */
  state: ApState | null;
  /** AP at `now` (default: the current time), null without a reading. */
  current: (now?: number) => number | null;
  /** When AP hits the cap, ms epoch, null without a reading. At or before now when already full. */
  fullAt: () => number | null;
  /** Record a reading; the cap defaults to the previous one. */
  set: (ap: number, cap?: number) => void;
  /** Spend AP now, keeping the regen phase. No-op without a reading. */
  spend: (amount: number) => void;
  ready: boolean;
}

export interface InventoryValue {
  items: Inventory;
  /** Count held, 0 when absent. */
  get: (key: string) => number;
  /** Set a count; null or 0 removes the item. */
  set: (key: string, count: number | null) => void;
  /** Add, or with a negative delta use up, flooring at 0. */
  adjust: (key: string, delta: number) => void;
  /** Several counts in one write. */
  setMany: (patch: Record<string, number | null>) => void;
  ready: boolean;
}

const noop = () => {};

const WatchlistContext = createContext<WatchlistValue>({
  ids: [],
  has: () => false,
  toggle: noop,
  setWatched: noop,
  ready: false,
});

const RosterContext = createContext<RosterValue>({
  entries: {},
  owns: () => false,
  get: () => undefined,
  set: noop,
  exportText: () => exportRoster({}),
  importText: () => ({ ok: false, count: 0, reason: "empty" }),
  ready: false,
});

const ApContext = createContext<ApValue>({
  state: null,
  current: () => null,
  fullAt: () => null,
  set: noop,
  spend: noop,
  ready: false,
});

const InventoryContext = createContext<InventoryValue>({
  items: {},
  get: () => 0,
  set: noop,
  adjust: noop,
  setMany: noop,
  ready: false,
});

function useWatchlistSlice(): WatchlistValue {
  const { value: ids, ready, update } = usePersistentState(watchlistStore);
  const toggle = useCallback(
    (studentId: number) => update((prev) => toggleWatched(prev, studentId)),
    [update],
  );
  const setOne = useCallback(
    (studentId: number, watched: boolean) =>
      update((prev) => setWatched(prev, studentId, watched)),
    [update],
  );
  return useMemo(() => {
    const set = new Set(ids);
    return { ids, has: (id) => set.has(id), toggle, setWatched: setOne, ready };
  }, [ids, ready, toggle, setOne]);
}

function useRosterSlice(): RosterValue {
  const { value: entries, ready, update } = usePersistentState(rosterStore);
  const set = useCallback(
    (studentId: number, entry: RosterInput | null) =>
      update((prev) => setRosterEntry(prev, studentId, entry, Date.now())),
    [update],
  );
  const importText = useCallback(
    (text: string): RosterImportOutcome => {
      const parsed = parseRosterText(text);
      if (!parsed.ok) return { ok: false, count: 0, reason: parsed.reason };
      // One timestamp for the whole import, so a replay before `ready`
      // stamps the same `at` it would have.
      const at = Date.now();
      update((prev) => mergeRoster(prev, parsed.entries, at));
      return { ok: true, count: parsed.count };
    },
    [update],
  );
  return useMemo(
    () => ({
      entries,
      owns: (id) => String(id) in entries,
      get: (id) => entries[String(id)],
      set,
      exportText: () => exportRoster(entries),
      importText,
      ready,
    }),
    [entries, ready, set, importText],
  );
}

function useApSlice(): ApValue {
  const { value: state, ready, update } = usePersistentState(apStore);
  const set = useCallback(
    (ap: number, cap?: number) => {
      const at = Date.now();
      update((prev) => setApReading(ap, cap ?? prev?.cap ?? DEFAULT_AP_CAP, at));
    },
    [update],
  );
  const spend = useCallback(
    (amount: number) => {
      const at = Date.now();
      update((prev) => (prev ? spendAp(prev, amount, at) : prev));
    },
    [update],
  );
  return useMemo(
    () => ({
      state,
      current: (now = Date.now()) => (state ? currentAp(state, now) : null),
      fullAt: () => (state ? apFullAt(state) : null),
      set,
      spend,
      ready,
    }),
    [state, ready, set, spend],
  );
}

function useInventorySlice(): InventoryValue {
  const { value: items, ready, update } = usePersistentState(inventoryStore);
  const set = useCallback(
    (key: string, count: number | null) =>
      update((prev) => setInventoryItem(prev, key, count)),
    [update],
  );
  const adjust = useCallback(
    (key: string, delta: number) =>
      update((prev) => adjustInventoryItem(prev, key, delta)),
    [update],
  );
  const setMany = useCallback(
    (patch: Record<string, number | null>) =>
      update((prev) => setInventoryItems(prev, patch)),
    [update],
  );
  return useMemo(
    () => ({ items, get: (key) => items[key] ?? 0, set, adjust, setMany, ready }),
    [items, ready, set, adjust, setMany],
  );
}

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const watchlist = useWatchlistSlice();
  const roster = useRosterSlice();
  const ap = useApSlice();
  const inventory = useInventorySlice();
  return (
    <WatchlistContext.Provider value={watchlist}>
      <RosterContext.Provider value={roster}>
        <ApContext.Provider value={ap}>
          <InventoryContext.Provider value={inventory}>
            {children}
          </InventoryContext.Provider>
        </ApContext.Provider>
      </RosterContext.Provider>
    </WatchlistContext.Provider>
  );
}

export const useWatchlist = () => useContext(WatchlistContext);
export const useRoster = () => useContext(RosterContext);
export const useAp = () => useContext(ApContext);
export const useInventory = () => useContext(InventoryContext);
