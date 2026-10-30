import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initConnection,
  endConnection,
  fetchProducts,
  getAvailablePurchases,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from 'expo-iap';

// expo-iap reports cancellation as the OpenIAP code; the second value is the
// legacy react-native-iap code, kept so either shape is handled.
const CANCELLED_CODES = ['user-cancelled', 'E_USER_CANCELLED'];

export const TIP_SKUS = {
  SMALL: 'tip_kopi_ice',
  LARGE: 'tip_chicken_rice',
} as const;

type SkuValue = typeof TIP_SKUS[keyof typeof TIP_SKUS];
const ALL_SKUS: SkuValue[] = [TIP_SKUS.SMALL, TIP_SKUS.LARGE];
const STORAGE_KEY = '@isAdFree';

type PendingPurchase = {
  resolve: (result: 'success' | 'cancelled') => void;
  reject: (reason: string) => void;
};

export interface AdFreeHookResult {
  isAdFree: boolean;
  /** Store-localized prices. Missing entries mean the store is unavailable. */
  productPrices?: Readonly<Record<string, string>>;
  purchaseTip: (sku: string) => Promise<'success' | 'cancelled'>;
  restorePurchase: () => Promise<'success' | 'not_found'>;
}

export function useAdFree(): AdFreeHookResult {
  const [isAdFree, setIsAdFree] = useState(false);
  const [productPrices, setProductPrices] = useState<Record<string, string>>({});
  const pendingRef = useRef<PendingPurchase | null>(null);

  const markAdFree = useCallback(async () => {
    setIsAdFree(true);
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (!mounted) return;
      if (cached === 'true') setIsAdFree(true);

      await initConnection();
      if (!mounted) return;

      // Prices are presentation only: a store lookup failure must not stop
      // recovery of existing purchases or change transaction handling.
      try {
        const products = await fetchProducts({ skus: ALL_SKUS, type: 'inapp' });
        if (mounted && Array.isArray(products)) setProductPrices(Object.fromEntries(products.filter(p => p.displayPrice).map(p => [p.id, p.displayPrice])));
      } catch { /* The sheet falls back to its localized store-price label. */ }
      if (!mounted) return;

      const purchases = await getAvailablePurchases();
      if (!mounted) return;
      const tipPurchases = purchases.filter((p) =>
        ALL_SKUS.includes(p.productId as SkuValue)
      );
      if (tipPurchases.length > 0) {
        // Consume any unfinished tip transactions so they can be repurchased
        await Promise.all(
          tipPurchases.map((p) => finishTransaction({ purchase: p, isConsumable: true }))
        );
        await markAdFree();
      }
    };

    init().catch(console.warn);

    const purchaseSub = purchaseUpdatedListener(async (purchase) => {
      // purchaseToken is optional on this version; transactionReceipt is the
      // cross-platform fallback.
      if (purchase.purchaseToken ?? purchase.transactionReceipt) {
        try {
          await finishTransaction({ purchase, isConsumable: true });
          await markAdFree();
          pendingRef.current?.resolve('success');
        } catch (err: any) {
          // Without this the promise never settles and the user is locked out
          // of retrying a purchase they may already have paid for.
          pendingRef.current?.reject(err?.message ?? 'Could not finish purchase');
        }
        pendingRef.current = null;
      }
    });

    const errorSub = purchaseErrorListener((error: any) => {
      if (CANCELLED_CODES.includes(error.code)) {
        pendingRef.current?.resolve('cancelled');
      } else {
        pendingRef.current?.reject(error.message ?? 'Purchase failed');
      }
      pendingRef.current = null;
    });

    return () => {
      mounted = false;
      pendingRef.current?.resolve('cancelled'); // drain in-flight purchase promise
      pendingRef.current = null;
      purchaseSub.remove();
      errorSub.remove();
      endConnection();
    };
  }, [markAdFree]);

  const purchaseTip = useCallback(
    (sku: string): Promise<'success' | 'cancelled'> => {
      if (pendingRef.current) {
        return Promise.reject('Purchase already in progress');
      }
      return new Promise((resolve, reject) => {
        pendingRef.current = { resolve, reject };
        requestPurchase({
          request: { android: { skus: [sku] }, ios: { sku } },
          type: 'inapp',
        }).catch((err: Error) => {
          pendingRef.current = null;
          reject(err.message ?? 'Request failed');
        });
      });
    },
    []
  );

  const restorePurchase = useCallback(async (): Promise<'success' | 'not_found'> => {
    const purchases = await getAvailablePurchases();
    const owned = purchases.some((p) =>
      ALL_SKUS.includes(p.productId as SkuValue)
    );
    if (owned) {
      await markAdFree();
      return 'success';
    }
    return 'not_found';
  }, [markAdFree]);

  return { isAdFree, productPrices, purchaseTip, restorePurchase };
}
