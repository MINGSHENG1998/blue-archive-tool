import { TestIds } from "react-native-google-mobile-ads";

export type AdFormat = "banner" | "interstitial" | "appOpen";

// Production Android ad unit IDs (AdMob console -> Apps -> Ad units).
// An empty string disables that format in production builds, so new formats
// can ship dark and light up once the unit ID is pasted in.
const PROD_UNITS: Record<AdFormat, string> = {
  banner: "ca-app-pub-7252717983754109/7446508117",
  interstitial: "ca-app-pub-7252717983754109/6583906986",
  appOpen: "ca-app-pub-7252717983754109/6962768248",
};

const TEST_UNITS: Record<AdFormat, string> = {
  banner: TestIds.BANNER,
  interstitial: TestIds.INTERSTITIAL,
  appOpen: TestIds.APP_OPEN,
};

/** Returns the ad unit ID for a format, or null when the format is disabled. */
export function adUnitId(format: AdFormat): string | null {
  if (__DEV__) return TEST_UNITS[format];
  return PROD_UNITS[format] || null;
}
