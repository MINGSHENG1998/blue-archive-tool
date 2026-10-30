import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import {
  BannerFetchError,
  fetchBanners,
  nextChangeAt,
  readBannersCache,
  selectBanners,
  writeBannersCache,
  type Banner,
  type BannerSelection,
} from "@/services/banners";

export type BannersStatus = "loading" | "ready" | "error";
export type BannersSource = "network" | "cache";

export interface BannersContextValue extends BannerSelection {
  /**
   * "loading" until there is something to show; "error" only when the fetch
   * failed AND there is no cached copy. With a cache on screen a failed
   * refresh stays "ready" — `source: "cache"` is the offline signal.
   */
  status: BannersStatus;
  source: BannersSource | null;
  /** When the data on screen was fetched from Firestore, ms epoch (also for a cached copy). */
  fetchedAt: number | null;
  /** Diagnostic code for the failure behind status "error" ("timeout", "network: unavailable", …). Not user-facing copy. */
  error: string | null;
  /** Fetch now. Never rejects; concurrent calls share one request. */
  refresh: () => Promise<void>;
  /** Live and upcoming banners featuring a student, in timeline order. */
  bannersFor: (studentId: number) => Banner[];
}

/** On returning to the foreground, refetch when the last network copy is older than this. */
export const BANNERS_STALE_MS = 30 * 60 * 1000;

// The provider sleeps until the next start/end instead of polling. Very long
// timers are unreliable on mobile (and warn on Android), so it wakes at most
// hourly to re-check, which changes nothing unless a boundary passed.
const MAX_SLEEP_MS = 60 * 60 * 1000;

const EMPTY: Banner[] = Object.freeze([]) as unknown as Banner[];

const BannersContext = createContext<BannersContextValue>({
  banners: EMPTY,
  recent: EMPTY,
  live: null,
  next: null,
  status: "loading",
  source: null,
  fetchedAt: null,
  error: null,
  refresh: async () => {},
  bannersFor: () => EMPTY,
});

interface Loaded {
  banners: Banner[];
  source: BannersSource;
  fetchedAt: number;
}

function describeError(error: unknown): string {
  if (error instanceof BannerFetchError) {
    return error.message && error.message !== error.code
      ? `${error.code}: ${error.message}`
      : error.code;
  }
  return error instanceof Error ? error.message : String(error);
}

export function BannersProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [status, setStatus] = useState<BannersStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  // The instant the selection was computed for. Advanced only when a banner
  // boundary passes, so consumers do not re-render on every wake-up.
  const [now, setNow] = useState(() => Date.now());
  // Re-arms the sleep timer without moving `now`.
  const [wake, setWake] = useState(0);

  const mounted = useRef(true);
  const loadedRef = useRef<Loaded | null>(null);
  const nowRef = useRef(now);
  nowRef.current = now;
  const inFlight = useRef<Promise<void> | null>(null);
  const lastNetworkAt = useRef(0);

  const apply = useCallback((next: Loaded) => {
    loadedRef.current = next;
    setLoaded(next);
    setStatus("ready");
    setError(null);
    setNow(Date.now());
  }, []);

  const fetchNow = useCallback((): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    const run = (async () => {
      try {
        const banners = await fetchBanners();
        const fetchedAt = Date.now();
        lastNetworkAt.current = fetchedAt;
        // Written even if we unmounted meanwhile: the next launch benefits.
        void writeBannersCache(banners, fetchedAt);
        if (mounted.current) apply({ banners, source: "network", fetchedAt });
      } catch (e) {
        if (!mounted.current) return;
        if (loadedRef.current) {
          apply({ ...loadedRef.current, source: "cache" });
          return;
        }
        setStatus("error");
        setError(describeError(e));
      }
    })().finally(() => {
      inFlight.current = null;
    });
    inFlight.current = run;
    return run;
  }, [apply]);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    (async () => {
      // Cache first, then network: the cache read takes milliseconds, and
      // waiting for it means a fast network failure can never flash the
      // error state at someone who has a perfectly good offline copy.
      const cached = await readBannersCache().catch(() => null);
      if (cancelled) return;
      if (cached && !loadedRef.current) apply({ ...cached, source: "cache" });
      await fetchNow();
    })();
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, [apply, fetchNow]);

  // Sleep until the selection would change (a banner starts or ends), then
  // recompute. A countdown screen keeps its own one-second clock; this only
  // keeps live/next/banners/recent honest.
  useEffect(() => {
    if (!loaded) return;
    const at = nextChangeAt(loaded.banners, now);
    if (at === null) return;
    const delay = Math.min(Math.max(at - Date.now(), 0) + 50, MAX_SLEEP_MS);
    const timer = setTimeout(() => {
      const t = Date.now();
      if (t >= at) setNow(t);
      else setWake((w) => w + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [loaded, now, wake]);

  // Timers do not run reliably in the background, so catch up on resume, and
  // refetch when the copy on screen is stale.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      const t = Date.now();
      const current = loadedRef.current;
      if (current) {
        const at = nextChangeAt(current.banners, nowRef.current);
        if (at !== null && t >= at) setNow(t);
      }
      if (t - lastNetworkAt.current >= BANNERS_STALE_MS) void fetchNow();
    });
    return () => sub?.remove?.();
  }, [fetchNow]);

  const refresh = useCallback(async () => {
    if (!loadedRef.current) {
      setStatus("loading");
      setError(null);
    }
    await fetchNow();
  }, [fetchNow]);

  const selection = useMemo(
    () => selectBanners(loaded?.banners ?? EMPTY, now),
    [loaded, now],
  );

  const byStudent = useMemo(() => {
    const index = new Map<number, Banner[]>();
    for (const banner of selection.banners) {
      for (const character of banner.characters) {
        if (character.studentId === undefined) continue;
        const list = index.get(character.studentId);
        if (!list) index.set(character.studentId, [banner]);
        // A doc listing the same student twice must not list the banner twice.
        else if (list[list.length - 1] !== banner) list.push(banner);
      }
    }
    return index;
  }, [selection.banners]);

  const bannersFor = useCallback(
    (studentId: number) => byStudent.get(studentId) ?? EMPTY,
    [byStudent],
  );

  const value = useMemo<BannersContextValue>(
    () => ({
      ...selection,
      status,
      source: loaded?.source ?? null,
      fetchedAt: loaded?.fetchedAt ?? null,
      error,
      refresh,
      bannersFor,
    }),
    [selection, status, loaded, error, refresh, bannersFor],
  );

  return (
    <BannersContext.Provider value={value}>{children}</BannersContext.Provider>
  );
}

export const useBanners = () => useContext(BannersContext);
