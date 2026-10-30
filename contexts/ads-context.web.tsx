import React, { createContext, useContext } from "react";

// Web build stub for ./ads-context: AdMob has no web implementation, so the
// ads stack never becomes ready and every ad component renders nothing.
export interface AdsState {
  ready: boolean;
  personalized: boolean;
  refreshPrivacy(): Promise<boolean>;
}

export const AdsContext = createContext<AdsState>({
  ready: false,
  personalized: false,
  refreshPrivacy: async () => false,
});

export function AdsProvider({ children }: { children: React.ReactNode }) {
  return (
    <AdsContext.Provider value={{ ready: false, personalized: false, refreshPrivacy: async () => false }}>
      {children}
    </AdsContext.Provider>
  );
}

export const useAds = () => useContext(AdsContext);
