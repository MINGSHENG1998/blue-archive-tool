import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initConnection,
  endConnection,
  getAvailablePurchases,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from 'react-native-iap';

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
  purchaseTip: (sku: string) => Promise<'success' | 'cancelled'>;
  restorePurchase: () => Promise<'success' | 'not_found'>;
}

export function useAdFree(): AdFreeHookResult {
  const [isAdFree, setIsAdFree] = useState(false);
  const pendingRef = useRef<PendingPurchase | null>(null);

  const markAdFree = useCallback(async () => {
    setIsAdFree(true);
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (mounted && cached === 'true') setIsAdFree(true);

      await initConnection();

      const purchases = await getAvailablePurchases();
      const owned = purchases.some((p) =>
        ALL_SKUS.includes(p.productId as SkuValue)
      );
      if (mounted && owned) await markAdFree();
    };

    init().catch(console.warn);

    const purchaseSub = purchaseUpdatedListener(async (purchase) => {
      if (purchase.transactionReceipt) {
        await finishTransaction({ purchase, isConsumable: false });
        await markAdFree();
        pendingRef.current?.resolve('success');
        pendingRef.current = null;
      }
    });

    const errorSub = purchaseErrorListener((error: any) => {
      if (error.code === 'E_USER_CANCELLED') {
        pendingRef.current?.resolve('cancelled');
      } else {
        pendingRef.current?.reject(error.message ?? 'Purchase failed');
      }
      pendingRef.current = null;
    });

    return () => {
      mounted = false;
      purchaseSub.remove();
      errorSub.remove();
      endConnection();
    };
  }, [markAdFree]);

  const purchaseTip = useCallback(
    (sku: string): Promise<'success' | 'cancelled'> => {
      return new Promise((resolve, reject) => {
        pendingRef.current = { resolve, reject };
        requestPurchase({ sku }).catch((err: Error) => {
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

  return { isAdFree, purchaseTip, restorePurchase };
}
