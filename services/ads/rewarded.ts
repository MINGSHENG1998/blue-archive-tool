import { AdEventType, RewardedAd, RewardedAdEventType } from "react-native-google-mobile-ads";

import { adUnitId } from "./adUnits";
import { fullscreenBegin, fullscreenEnd } from "./fullscreen";

export type RewardedOutcome = "earned" | "skipped" | "unavailable";

/** Give up on a load that never answers, so the button does not spin forever. */
export const REWARDED_LOAD_TIMEOUT_MS = 20_000;

/** True when this build can offer the opt-in ad (a rewarded unit ID is set). */
export function rewardedAvailable() {
  return adUnitId("rewarded") !== null;
}

/**
 * Loads and shows one rewarded ad, only because the user asked for it.
 * Nothing is preloaded, so people who never tap the button cost no ad
 * request. Resolves once the ad has closed (or could not be shown).
 */
export function watchRewardedAd(personalized: boolean): Promise<RewardedOutcome> {
  const unitId = adUnitId("rewarded");
  if (!unitId) return Promise.resolve("unavailable");

  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: !personalized,
    });
    let earned = false;
    let showing = false;
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let offs: (() => void)[] = [];

    const finish = (outcome: RewardedOutcome) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      offs.forEach((off) => off());
      if (showing) fullscreenEnd();
      resolve(outcome);
    };

    offs = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        if (done) return; // loaded after the timeout gave up
        showing = true;
        fullscreenBegin();
        ad.show().catch(() => finish("unavailable"));
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        finish(earned ? "earned" : "skipped");
      }),
      ad.addAdEventListener(AdEventType.ERROR, () => {
        finish(earned ? "earned" : "unavailable");
      }),
    ];
    timer = setTimeout(() => {
      if (!showing) finish("unavailable");
    }, REWARDED_LOAD_TIMEOUT_MS);
    ad.load();
  });
}
