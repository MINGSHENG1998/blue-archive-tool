import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import mobileAds from "react-native-google-mobile-ads";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";

import { gatherAdsConsent } from "@/services/ads/consent";
import { initInterstitial } from "@/services/ads/interstitial";

export interface AdsState {
  /** SDK initialized and consent resolved; ads may be requested. */
  ready: boolean;
  /** Personalized ads allowed (UMP consent given or not required). */
  personalized: boolean;
}

export const AdsContext = createContext<AdsState>({
  ready: false,
  personalized: false,
});

/**
 * Boots the ads stack in the required order: ATT prompt (iOS no-op on
 * Android) -> UMP consent -> SDK init. Ad components should wait for
 * `ready` and derive NPA from `personalized`.
 */
export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdsState>({
    ready: false,
    personalized: false,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status: trackingStatus } = await requestTrackingPermissionsAsync();
      if (__DEV__ && trackingStatus !== "granted") {
        console.log("tracking permission:", trackingStatus);
      }
      const consent = await gatherAdsConsent();
      if (consent.canRequestAds) {
        await mobileAds().initialize();
        initInterstitial(consent.personalized);
      }
      if (mounted) {
        setState({
          ready: consent.canRequestAds,
          personalized: consent.personalized,
        });
      }
    })().catch((e) => {
      console.warn("ads init failed:", e);
      if (mounted) setState({ ready: false, personalized: false });
    });
    return () => {
      mounted = false;
    };
  }, []);

  return <AdsContext.Provider value={state}>{children}</AdsContext.Provider>;
}

export const useAds = () => useContext(AdsContext);
