import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import mobileAds from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { gatherAdsConsent, readCurrentAdsConsent, type ConsentResult } from '@/services/ads/consent';
import { initInterstitial, stopInterstitial } from '@/services/ads/interstitial';
import { showPrivacyOptions } from '@/services/notifications/privacy';

export interface AdsState {
  ready: boolean;
  personalized: boolean;
  /** User initiated only. False means UMP has no required privacy form. */
  refreshPrivacy(): Promise<boolean>;
}
export const AdsContext = createContext<AdsState>({ ready: false, personalized: false, refreshPrivacy: async () => false });

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({ ready: false, personalized: false });
  const mounted = useRef(true), revision = useRef(0), privacyBusy = useRef(false);
  const initialize = useRef<Promise<unknown> | null>(null);
  const apply = useCallback(async (consent: ConsentResult, version: number) => {
    if (!mounted.current || version !== revision.current) return;
    if (consent.canRequestAds) {
      initialize.current ??= mobileAds().initialize();
      try { await initialize.current; } catch (error) { initialize.current = null; throw error; }
    }
    if (!mounted.current || version !== revision.current) return;
    if (consent.canRequestAds) initInterstitial(consent.personalized); else stopInterstitial();
    setState({ready: consent.canRequestAds, personalized: consent.canRequestAds && consent.personalized});
  }, []);
  const refreshPrivacy = useCallback(async () => {
    if (privacyBusy.current) return false;
    privacyBusy.current = true;
    const version = ++revision.current;
    // Drop cached ad requests before the form can change the user's choices.
    stopInterstitial();
    setState({ready:false,personalized:false});
    try {
      const shown = await showPrivacyOptions();
      await apply(await readCurrentAdsConsent(), version);
      return shown;
    } catch (error) {
      if (mounted.current && revision.current === version) setState({ready:false,personalized:false});
      throw error;
    } finally { privacyBusy.current = false; }
  }, [apply]);
  useEffect(() => {
    mounted.current = true;
    const version = ++revision.current;
    void (async () => {
      await requestTrackingPermissionsAsync();
      await apply(await gatherAdsConsent(), version);
    })().catch(error => {
      console.warn('ads init failed:', error);
      if (mounted.current && version === revision.current) setState({ready:false,personalized:false});
    });
    return () => { mounted.current = false; stopInterstitial(); };
  }, [apply]);
  return <AdsContext.Provider value={{...state,refreshPrivacy}}>{children}</AdsContext.Provider>;
}
export const useAds = () => useContext(AdsContext);
