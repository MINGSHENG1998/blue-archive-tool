import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { readAdPass, writeAdPass } from "@/services/ads/adPass";

export interface AdPass {
  /** Expiry of the running pass, or 0. */
  until: number;
  /** False until the stored pass has been read. */
  settled: boolean;
  /** Starts a 24-hour pass now. Call after a rewarded ad was earned. */
  grant: () => Promise<void>;
}

/** The "24 hours without ads" pass bought by watching one rewarded ad. */
export function useAdPass(): AdPass {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let alive = true;
    void readAdPass().then((stored) => {
      if (!alive) return;
      setNow(Date.now());
      setUntil(stored);
      setSettled(true);
    });
    return () => { alive = false; };
  }, []);

  // Turn ads back on when the pass runs out: a timer while the app is open,
  // and a re-check on resume because timers do not run in the background.
  useEffect(() => {
    if (!until) return;
    const tick = () => setNow(Date.now());
    const timer = setTimeout(tick, Math.max(0, until - Date.now()) + 500);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") tick();
    });
    return () => { clearTimeout(timer); sub.remove(); };
  }, [until]);

  const grant = useCallback(async () => {
    const next = await writeAdPass();
    setNow(Date.now());
    setUntil(next);
  }, []);

  return { until: until > now ? until : 0, settled, grant };
}
