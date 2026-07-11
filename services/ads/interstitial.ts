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

function load() {
  const unitId = adUnitId("interstitial");
  if (!unitId) return;
  adLoaded = false;
  ad = InterstitialAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: npa,
  });
  ad.addAdEventListener(AdEventType.LOADED, () => {
    adLoaded = true;
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    // Leave unloaded; the next eligible show attempt retries the load.
    adLoaded = false;
    ad = null;
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    load(); // preload the next one
  });
  ad.load();
}

/** Called once by AdsProvider after SDK init, with the consent decision. */
export function initInterstitial(personalized: boolean) {
  npa = !personalized;
  if (!ad) load();
}

/**
 * Call at the end of a successful Calculate action. Shows an interstitial on
 * every Nth call, respecting the minimum interval and ad-free purchases.
 */
export function maybeShowCalcInterstitial(isAdFree: boolean) {
  if (isAdFree) return;
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
