import { InterstitialAd, AdEventType } from "react-native-google-mobile-ads";

import { adUnitId } from "./adUnits";

// Show on every Nth calculate press, but never more often than the minimum
// interval. Tune with real revenue/retention data before tightening.
const SHOW_EVERY_N = 4;
const MIN_INTERVAL_MS = 3 * 60 * 1000;

let ad: InterstitialAd | null = null;
let adLoaded = false;
let npa = true;
let calcCount = 0;
let lastShownAt = 0;
let allowed = false;
let dispose: (() => void) | null = null;

/** Invalidates both a loaded request and callbacks from its old consent state. */
export function stopInterstitial() {
  allowed = false;
  dispose?.();
  dispose = null;
  ad = null;
  adLoaded = false;
}

function load() {
  if (!allowed) return;
  const unitId = adUnitId("interstitial");
  if (!unitId) return;
  dispose?.();
  adLoaded = false;
  const request = InterstitialAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: npa,
  });
  ad = request;
  const listeners = [request.addAdEventListener(AdEventType.LOADED, () => {
    if (allowed && ad === request) adLoaded = true;
  }), request.addAdEventListener(AdEventType.ERROR, () => {
    if (ad !== request) return;
    // Leave unloaded; the next eligible show attempt retries the load.
    adLoaded = false;
    ad = null;
  }), request.addAdEventListener(AdEventType.CLOSED, () => {
    if (allowed && ad === request) load(); // preload the next one
  })];
  dispose = () => listeners.forEach(remove => remove?.());
  request.load();
}

/** Called once by AdsProvider after SDK init, with the consent decision. */
export function initInterstitial(personalized: boolean) {
  const changed = npa !== !personalized;
  if (changed) stopInterstitial();
  npa = !personalized;
  allowed = true;
  if (!ad) load();
}

/**
 * Call at the end of a successful Calculate action. Shows an interstitial on
 * every Nth call, respecting the minimum interval and ad-free purchases.
 */
export function maybeShowCalcInterstitial(isAdFree: boolean) {
  if (isAdFree || !allowed) return;
  calcCount += 1;
  if (calcCount % SHOW_EVERY_N !== 0) return;
  if (Date.now() - lastShownAt < MIN_INTERVAL_MS) return;
  if (!ad) {
    load(); // recover from an earlier load error
    return;
  }
  if (!adLoaded) return;
  lastShownAt = Date.now();
  adLoaded = false;
  ad.show().catch(() => {
    load();
  });
}
