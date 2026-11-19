// Web build stub for ./rewarded (AdMob has no web implementation).
export type RewardedOutcome = "earned" | "skipped" | "unavailable";

export const REWARDED_LOAD_TIMEOUT_MS = 20_000;

export function rewardedAvailable() {
  return false;
}

export async function watchRewardedAd(_personalized: boolean): Promise<RewardedOutcome> {
  return "unavailable";
}
