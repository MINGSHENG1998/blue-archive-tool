import React, { createContext, useContext } from 'react';
import { useAdFree, type AdFreeHookResult } from '@/hooks/useAdFree';

export const AdFreeContext = createContext<AdFreeHookResult>({
  isAdFree: false,
  purchaseTip: async () => 'cancelled',
  restorePurchase: async () => 'not_found',
});

export function AdFreeProvider({ children }: { children: React.ReactNode }) {
  const adFree = useAdFree();
  return (
    <AdFreeContext.Provider value={adFree}>
      {children}
    </AdFreeContext.Provider>
  );
}

export const useAdFreeContext = () => useContext(AdFreeContext);
