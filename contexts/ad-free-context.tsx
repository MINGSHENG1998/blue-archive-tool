import React, { createContext, useContext } from 'react';
import { useAdFree, type AdFreeHookResult } from '@/hooks/useAdFree';
import { useAdPass } from '@/hooks/useAdPass';

export interface AdFreeState extends AdFreeHookResult {
  /** Ads are off: a tip was bought, or a 24-hour pass is running. */
  isAdFree: boolean;
  /** A tip was bought. Drives the Supporter badge, never expires. */
  hasTipped: boolean;
  /** Expiry of the running 24-hour pass, or 0. */
  passUntil: number;
  /** Starts a 24-hour pass. Call after a rewarded ad was earned. */
  grantPass: () => Promise<void>;
  /** False until both the purchase flag and the pass have been read. */
  settled: boolean;
}

export const AdFreeContext = createContext<AdFreeState>({
  isAdFree: false,
  hasTipped: false,
  passUntil: 0,
  settled: false,
  grantPass: async () => {},
  purchaseTip: async () => 'cancelled',
  restorePurchase: async () => 'not_found',
});

export function AdFreeProvider({ children }: { children: React.ReactNode }) {
  const purchase = useAdFree();
  const pass = useAdPass();
  const value: AdFreeState = {
    ...purchase,
    isAdFree: purchase.isAdFree || pass.until > 0,
    hasTipped: purchase.isAdFree,
    passUntil: pass.until,
    grantPass: pass.grant,
    settled: purchase.settled && pass.settled,
  };
  return (
    <AdFreeContext.Provider value={value}>
      {children}
    </AdFreeContext.Provider>
  );
}

export const useAdFreeContext = () => useContext(AdFreeContext);
