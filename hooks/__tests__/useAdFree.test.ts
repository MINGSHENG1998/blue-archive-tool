import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAdFree, TIP_SKUS } from '../useAdFree';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock react-native-iap
jest.mock('react-native-iap', () => ({
  __esModule: true,
  initConnection: jest.fn().mockResolvedValue(true),
  endConnection: jest.fn(),
  getAvailablePurchases: jest.fn(),
  requestPurchase: jest.fn(),
  finishTransaction: jest.fn().mockResolvedValue(undefined),
  purchaseUpdatedListener: jest.fn(),
  purchaseErrorListener: jest.fn(),
}));

import * as RNIap from 'react-native-iap';

const mockGetAvailablePurchases = RNIap.getAvailablePurchases as jest.Mock;
const mockPurchaseUpdatedListener = RNIap.purchaseUpdatedListener as jest.Mock;
const mockPurchaseErrorListener = RNIap.purchaseErrorListener as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAvailablePurchases.mockResolvedValue([]);
  mockPurchaseUpdatedListener.mockReturnValue({ remove: jest.fn() });
  mockPurchaseErrorListener.mockReturnValue({ remove: jest.fn() });
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});

describe('useAdFree', () => {
  it('starts with isAdFree=false when AsyncStorage is empty', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const { result } = renderHook(() => useAdFree());
    expect(result.current.isAdFree).toBe(false);
  });

  it('sets isAdFree=true immediately when AsyncStorage cache is "true"', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    const { result } = renderHook(() => useAdFree());
    await act(async () => {});
    expect(result.current.isAdFree).toBe(true);
  });

  it('sets isAdFree=true when getAvailablePurchases returns a matching SKU', async () => {
    mockGetAvailablePurchases.mockResolvedValue([
      { productId: TIP_SKUS.SMALL, transactionReceipt: 'receipt' },
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
