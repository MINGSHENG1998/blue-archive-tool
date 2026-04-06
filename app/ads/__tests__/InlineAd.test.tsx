import React from 'react';
import renderer from 'react-test-renderer';
import InlineAd from '../InlineAd';
import { AdFreeContext } from '@/contexts/ad-free-context';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('react-native', () => ({
  View: 'View',
}));

jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: 'BannerAd',
  BannerAdSize: { BANNER: 'BANNER' },
  TestIds: { BANNER: 'test-banner-id' },
}));

jest.mock('expo-device', () => ({ osName: 'Android' }));

jest.mock('react-native-iap', () => ({
  initConnection: jest.fn(),
  endConnection: jest.fn(),
  getProducts: jest.fn(() => Promise.resolve([])),
  requestPurchase: jest.fn(),
  getAvailablePurchases: jest.fn(() => Promise.resolve([])),
  consumePurchaseAndroid: jest.fn(),
}));

const mockContextValue = (isAdFree: boolean) => ({
  isAdFree,
  purchaseTip: jest.fn(),
  restorePurchase: jest.fn(),
});

const renderWithContext = (isAdFree: boolean) => {
  let tree;
  renderer.act(() => {
    tree = renderer.create(
      <AdFreeContext.Provider value={mockContextValue(isAdFree)}>
        <InlineAd />
      </AdFreeContext.Provider>
    );
  });
  return tree!;
};

describe('InlineAd', () => {
  it('renders the ad container when isAdFree is false', () => {
    const tree = renderWithContext(false).toJSON();
    expect(tree).not.toBeNull();
  });

  it('renders null when isAdFree is true', () => {
    const tree = renderWithContext(true).toJSON();
    expect(tree).toBeNull();
  });
});
