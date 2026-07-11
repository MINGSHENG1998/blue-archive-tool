import {
  AdsConsent,
  AdsConsentStatus,
} from "react-native-google-mobile-ads";

export interface ConsentResult {
  /** UMP allows ad requests (always true outside GDPR regions). */
  canRequestAds: boolean;
  /** Personalized ads may be served (consented, or consent not required). */
  personalized: boolean;
}

/**
 * Runs the Google UMP consent flow: fetches consent info and shows the
 * consent form when required (GDPR regions with a published AdMob privacy
 * message). Must complete before the first ad request so the
 * personalized/non-personalized decision is correct.
 *
 * To test the EEA form locally, pass debug options to gatherConsent:
 *   { debugGeography: AdsConsentDebugGeography.EEA, testDeviceIdentifiers: [...] }
 */
export async function gatherAdsConsent(): Promise<ConsentResult> {
  try {
    const info = await AdsConsent.gatherConsent();
    if (!info.canRequestAds) {
      return { canRequestAds: false, personalized: false };
    }
    if (info.status === AdsConsentStatus.NOT_REQUIRED) {
      // Outside GDPR regions no TCF choices exist; personalized is allowed.
      return { canRequestAds: true, personalized: true };
    }
    const choices = await AdsConsent.getUserChoices();
    return { canRequestAds: true, personalized: choices.selectPersonalisedAds };
  } catch (e) {
    // UMP unreachable (offline, or no privacy message published in AdMob).
    // Serve non-personalized ads rather than nothing.
    if (__DEV__) console.warn("UMP consent failed:", e);
    return { canRequestAds: true, personalized: false };
  }
}
