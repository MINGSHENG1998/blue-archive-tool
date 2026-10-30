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
  fetchAppConfig,
  readAppConfigCache,
  writeAppConfigCache,
  type AppConfig,
} from "@/services/appConfig";

interface AppConfigContextValue {
  /** Validated remote config; {} until (and unless) the doc says otherwise. */
  config: AppConfig;
  /** True once the cached copy has been read, whether or not one existed. */
  ready: boolean;
}

/** Refetch on foreground when the last successful read is older than this. */
export const APP_CONFIG_STALE_MS = 30 * 60 * 1000;

const EMPTY_CONFIG: AppConfig = Object.freeze({}) as AppConfig;

const AppConfigContext = createContext<AppConfigContextValue>({
  config: EMPTY_CONFIG,
  ready: false,
});

// Normalized configs are small plain JSON, so this is a cheap, exact test for
// "nothing changed" — which keeps a routine refetch from re-rendering the app.
const sameConfig = (a: AppConfig, b: AppConfig) =>
  JSON.stringify(a) === JSON.stringify(b);

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(EMPTY_CONFIG);
  const [ready, setReady] = useState(false);
  const configRef = useRef(config);
  const lastFetchAt = useRef(0);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  const accept = useCallback((next: AppConfig) => {
    if (sameConfig(configRef.current, next)) return;
    configRef.current = next;
    setConfig(next);
  }, []);

  const fetchNow = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const fresh = await fetchAppConfig();
      const at = Date.now();
      lastFetchAt.current = at;
      void writeAppConfigCache(fresh, at);
      if (mounted.current) accept(fresh);
    } catch {
      // Offline or denied: whatever is in state (cache or {}) stands.
    } finally {
      inFlight.current = false;
    }
  }, [accept]);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    (async () => {
      const cached = await readAppConfigCache().catch(() => null);
      if (cancelled) return;
      if (cached) accept(cached.config);
      setReady(true);
      await fetchNow();
    })();
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, [accept, fetchNow]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      if (Date.now() - lastFetchAt.current >= APP_CONFIG_STALE_MS) {
        void fetchNow();
      }
    });
    return () => sub?.remove?.();
  }, [fetchNow]);

  const value = useMemo(() => ({ config, ready }), [config, ready]);

  return (
    <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>
  );
}

export const useAppConfig = () => useContext(AppConfigContext);
