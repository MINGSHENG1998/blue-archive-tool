import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAdFree, TIP_SKUS } from '../useAdFree';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock expo-iap
jest.mock('expo-iap', () => ({
  __esModule: true,
  initConnection: jest.fn().mockResolvedValue(true),
  endConnection: jest.fn(),
  fetchProducts: jest.fn().mockResolvedValue([]),
  getAvailablePurchases: jest.fn(),
  requestPurchase: jest.fn(),
  finishTransaction: jest.fn().mockResolvedValue(undefined),
  purchaseUpdatedListener: jest.fn(),
  purchaseErrorListener: jest.fn(),
}));

import * as RNIap from 'expo-iap';

const mockGetAvailablePurchases = RNIap.getAvailablePurchases as jest.Mock;
const mockPurchaseUpdatedListener = RNIap.purchaseUpdatedListener as jest.Mock;
const mockPurchaseErrorListener = RNIap.purchaseErrorListener as jest.Mock;

const mockRequestPurchase = RNIap.requestPurchase as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAvailablePurchases.mockResolvedValue([]);
  (RNIap.fetchProducts as jest.Mock).mockResolvedValue([]);
  mockPurchaseUpdatedListener.mockReturnValue({ remove: jest.fn() });
  mockPurchaseErrorListener.mockReturnValue({ remove: jest.fn() });
  // Return a never-settling promise so listener callbacks control resolution
  mockRequestPurchase.mockReturnValue(new Promise(() => {}));
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});

describe('useAdFree', () => {
  it('starts with isAdFree=false when AsyncStorage is empty', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const { result } = renderHook(() => useAdFree());
    expect(result.current.isAdFree).toBe(false);
    await act(async () => {});
  });

  it('exposes store-localized price labels', async () => {
    (RNIap.fetchProducts as jest.Mock).mockResolvedValue([{id:TIP_SKUS.SMALL,displayPrice:'RM 4.90'}]);
    const {result} = renderHook(() => useAdFree());
    await act(async () => {});
    expect(result.current.productPrices?.[TIP_SKUS.SMALL]).toBe('RM 4.90');
  });

  it('continues purchase recovery when price fetching fails', async () => {
    (RNIap.fetchProducts as jest.Mock).mockRejectedValue(new Error('store unavailable'));
    mockGetAvailablePurchases.mockResolvedValue([{productId:TIP_SKUS.SMALL,purchaseToken:'receipt'}]);
    const {result} = renderHook(() => useAdFree());
    await act(async () => {});
    expect(result.current.productPrices).toEqual({});
    expect(result.current.isAdFree).toBe(true);
  });

  it('sets isAdFree=true immediately when AsyncStorage cache is "true"', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    const { result } = renderHook(() => useAdFree());
    await act(async () => {});
    expect(result.current.isAdFree).toBe(true);
  });

  it('sets isAdFree=true when getAvailablePurchases returns a matching SKU', async () => {
    mockGetAvailablePurchases.mockResolvedValue([
      { productId: TIP_SKUS.SMALL, purchaseToken: 'receipt' },
    ]);
    const { result } = renderHook(() => useAdFree());
    await act(async () => {});
    expect(result.current.isAdFree).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@isAdFree', 'true');
  });

  it('restorePurchase returns "not_found" when no matching purchase exists', async () => {
    mockGetAvailablePurchases.mockResolvedValue([]);
    const { result } = renderHook(() => useAdFree());
    await act(async () => {});
    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.restorePurchase();
    });
    expect(outcome).toBe('not_found');
    expect(result.current.isAdFree).toBe(false);
  });

  it('restorePurchase returns "success" and sets isAdFree when a matching purchase is found', async () => {
    mockGetAvailablePurchases
      .mockResolvedValueOnce([]) // called on init
      .mockResolvedValueOnce([{ productId: TIP_SKUS.LARGE }]); // called on restore
    const { result } = renderHook(() => useAdFree());
    await act(async () => {});
    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.restorePurchase();
    });
    expect(outcome).toBe('success');
    expect(result.current.isAdFree).toBe(true);
  });
});

describe('purchaseTip', () => {
  it('resolves "success" when purchaseUpdatedListener fires with a receipt', async () => {
    let capturedPurchaseCallback: ((purchase: any) => void) | null = null;
    const mockRNIap = require('expo-iap');
    mockRNIap.purchaseUpdatedListener.mockImplementation((cb: any) => {
      capturedPurchaseCallback = cb;
      return { remove: jest.fn() };
    });

    const { result } = renderHook(() => useAdFree());
    await act(async () => {});

    let outcome: string | undefined;
    await act(async () => {
      const promise = result.current.purchaseTip('tip_kopi_ice');
      // simulate the purchase completing
      capturedPurchaseCallback?.({ purchaseToken: 'receipt123', productId: 'tip_kopi_ice' });
      outcome = await promise;
    });

    expect(outcome).toBe('success');
    expect(result.current.isAdFree).toBe(true);
  });

  it('resolves "cancelled" when purchaseErrorListener fires with E_USER_CANCELLED', async () => {
    let capturedErrorCallback: ((error: any) => void) | null = null;
    const mockRNIap = require('expo-iap');
    mockRNIap.purchaseErrorListener.mockImplementation((cb: any) => {
      capturedErrorCallback = cb;
      return { remove: jest.fn() };
    });

    const { result } = renderHook(() => useAdFree());
    await act(async () => {});

    let outcome: string | undefined;
    await act(async () => {
      const promise = result.current.purchaseTip('tip_kopi_ice');
      capturedErrorCallback?.({ code: 'E_USER_CANCELLED', message: 'cancelled' });
      outcome = await promise;
    });

    expect(outcome).toBe('cancelled');
  });

  it('rejects when purchaseErrorListener fires with a non-cancellation error', async () => {
    let capturedErrorCallback: ((error: any) => void) | null = null;
    const mockRNIap = require('expo-iap');
    mockRNIap.purchaseErrorListener.mockImplementation((cb: any) => {
      capturedErrorCallback = cb;
      return { remove: jest.fn() };
    });

    const { result } = renderHook(() => useAdFree());
    await act(async () => {});

    let error: string | undefined;
    await act(async () => {
      const promise = result.current.purchaseTip('tip_kopi_ice').catch((e) => {
        error = e;
      });
      capturedErrorCallback?.({ code: 'E_UNKNOWN', message: 'something went wrong' });
      await promise;
    });

    expect(error).toBe('something went wrong');
  });

  it('rejects immediately if called while another purchase is in progress', async () => {
    const { result } = renderHook(() => useAdFree());
    await act(async () => {});

    let error: string | undefined;
    await act(async () => {
      // Start first purchase (never resolves in this test)
      result.current.purchaseTip('tip_kopi_ice');
      // Second call should reject immediately
      await result.current.purchaseTip('tip_chicken_rice').catch((e) => {
        error = e;
      });
    });

    expect(error).toBe('Purchase already in progress');
  });
});
