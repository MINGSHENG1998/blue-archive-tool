import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { AppOpenAd, AdEventType } from "react-native-google-mobile-ads";

import { adUnitId } from "./adUnits";

// Only treat it as a "return to the app" after a real absence — short blips
// (permission dialogs, IAP sheet, notification shade) must not trigger ads.
const MIN_BACKGROUND_MS = 30 * 1000;
const MIN_INTERVAL_MS = 5 * 60 * 1000;
// Google ad objects expire ~4h after load; refresh stale ones.
const AD_TTL_MS = 3.5 * 60 * 60 * 1000;

/**
 * Shows an app-open ad when the user returns to the app from the background.
 * Mount once, under AdsProvider and AdFreeProvider.
 */
export function useAppOpenAd(enabled: boolean, personalized: boolean) {
  const adRef = useRef<AppOpenAd | null>(null);
  const loadedRef = useRef(false);
  const loadedAtRef = useRef(0);
  const backgroundedAtRef = useRef(0);
  const lastShownAtRef = useRef(0);
  const showingRef = useRef(false);

  useEffect(() => {
    let alive = true;
    const listeners: (() => void)[] = [];
    const clear = () => { listeners.splice(0).forEach(remove => remove?.()); adRef.current = null; loadedRef.current = false; loadedAtRef.current = 0; backgroundedAtRef.current = 0; showingRef.current = false; };
    clear();
    if (!enabled) return;
    const unitId = adUnitId("appOpen");
    if (!unitId) return;

    const load = () => {
      if (!alive) return;
      listeners.splice(0).forEach(remove => remove?.());
      loadedRef.current = false;
      const ad = AppOpenAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: !personalized,
      });
      listeners.push(ad.addAdEventListener(AdEventType.LOADED, () => {
        if (!alive || adRef.current !== ad) return;
        loadedRef.current = true;
        loadedAtRef.current = Date.now();
      }));
      listeners.push(ad.addAdEventListener(AdEventType.ERROR, () => {
        if (!alive || adRef.current !== ad) return;
        loadedRef.current = false;
        adRef.current = null;
      }));
      listeners.push(ad.addAdEventListener(AdEventType.CLOSED, () => {
        if (!alive || adRef.current !== ad) return;
        showingRef.current = false;
        load();
      }));
      adRef.current = ad;
      ad.load();
    };

    load();

    const sub = AppState.addEventListener("change", (state) => {
      const now = Date.now();
      if (state !== "active") {
        // "background"/"inactive" while an ad shows is the ad itself.
        if (!showingRef.current && backgroundedAtRef.current === 0) {
          backgroundedAtRef.current = now;
        }
        return;
      }

      const awayFor = backgroundedAtRef.current
        ? now - backgroundedAtRef.current
        : 0;
      backgroundedAtRef.current = 0;

      if (showingRef.current) return;
      if (awayFor < MIN_BACKGROUND_MS) return;
      if (now - lastShownAtRef.current < MIN_INTERVAL_MS) return;
      if (!adRef.current) {
        load(); // recover from an earlier load error
        return;
      }
      if (!loadedRef.current) return;
      if (now - loadedAtRef.current > AD_TTL_MS) {
        load(); // expired; refresh for next time
        return;
      }

      lastShownAtRef.current = now;
      loadedRef.current = false;
      showingRef.current = true;
      adRef.current.show().catch(() => {
        showingRef.current = false;
        load();
      });
    });

    return () => { alive = false; sub.remove(); clear(); };
  }, [enabled, personalized]);
}
