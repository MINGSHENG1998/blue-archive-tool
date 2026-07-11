import React from 'react';
import renderer from 'react-test-renderer';
import InlineAd from '../InlineAd';
import { AdFreeContext } from '@/contexts/ad-free-context';
import { AdsContext } from '@/contexts/ads-context';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('react-native', () => ({
  View: 'View',
  AppState: { addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
}));

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: jest.fn(() => ({ initialize: jest.fn() })),
  BannerAd: 'BannerAd',
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
  TestIds: {
    BANNER: 'test-banner-id',
    INTERSTITIAL: 'test-interstitial-id',
    APP_OPEN: 'test-app-open-id',
  },
  AdsConsent: {
    gatherConsent: jest.fn(),
    getUserChoices: jest.fn(),
  },
  AdsConsentStatus: { NOT_REQUIRED: 'NOT_REQUIRED' },
  AdEventType: { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' },
  InterstitialAd: {
    createForAdRequest: jest.fn(() => ({
      addAdEventListener: jest.fn(),
      load: jest.fn(),
      show: jest.fn(),
    })),
  },
  AppOpenAd: {
    createForAdRequest: jest.fn(() => ({
      addAdEventListener: jest.fn(),
      load: jest.fn(),
      show: jest.fn(),
    })),
  },
}));

jest.mock('expo-device', () => ({ osName: 'Android' }));
jest.mock('expo-tracking-transparency', () => ({
  requestTrackingPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
}));

jest.mock('react-native-iap', () => ({
  initConnection: jest.fn(),
  endConnection: jest.fn(),
  getProducts: jest.fn(() => Promise.resolve([])),
  requestPurchase: jest.fn(),
  getAvailablePurchases: jest.fn(() => Promise.resolve([])),
  consumePurchaseAndroid: jest.fn(),
}));

const mockAdFree = (isAdFree: boolean) => ({
  isAdFree,
  purchaseTip: jest.fn(),
  restorePurchase: jest.fn(),
});

const renderWithContext = (isAdFree: boolean, adsReady = true) => {
  let tree;
  renderer.act(() => {
    tree = renderer.create(
      <AdFreeContext.Provider value={mockAdFree(isAdFree)}>
        <AdsContext.Provider value={{ ready: adsReady, personalized: true }}>
          <InlineAd />
        </AdsContext.Provider>
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

  it('renders null before the ads stack is ready', () => {
    const tree = renderWithContext(false, false).toJSON();
    expect(tree).toBeNull();
  });
});
