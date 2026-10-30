// Web build stub for ./useAdFree: expo-iap (Play Billing / StoreKit) has no web
// implementation. Web is a dev preview target only, so purchases are refused.
export const TIP_SKUS = {
  SMALL: 'tip_kopi_ice',
  LARGE: 'tip_chicken_rice',
} as const;

export interface AdFreeHookResult {
  isAdFree: boolean;
  productPrices?: Readonly<Record<string, string>>;
  purchaseTip: (sku: string) => Promise<'success' | 'cancelled'>;
  restorePurchase: () => Promise<'success' | 'not_found'>;
}

export function useAdFree(): AdFreeHookResult {
  return {
    isAdFree: false,
    productPrices: {},
    purchaseTip: () => Promise.reject('Purchases are not available on web'),
    restorePurchase: async () => 'not_found',
  };
}
