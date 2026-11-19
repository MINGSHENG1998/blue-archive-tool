import { REWARDED_LOAD_TIMEOUT_MS, rewardedAvailable, watchRewardedAd } from '../rewarded';
import { fullscreenBusy, resetFullscreen } from '../fullscreen';

type Listener = (payload?: unknown) => void;

const mockAds: { listeners: Map<string, Listener>; load: jest.Mock; show: jest.Mock; options?: unknown }[] = [];

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  TestIds: { BANNER: 'b', INTERSTITIAL: 'i', APP_OPEN: 'a', REWARDED: 'test-rewarded-id' },
  AdEventType: { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' },
  RewardedAdEventType: { LOADED: 'rewarded_loaded', EARNED_REWARD: 'rewarded_earned_reward' },
  RewardedAd: {
    createForAdRequest: jest.fn((_unitId: string, options: unknown) => {
      const ad = { listeners: new Map<string, Listener>(), load: jest.fn(), show: jest.fn(() => Promise.resolve()), options };
      mockAds.push(ad);
      return {
        addAdEventListener: (type: string, fn: Listener) => { ad.listeners.set(type, fn); return () => ad.listeners.delete(type); },
        load: ad.load,
        show: ad.show,
      };
    }),
  },
}));

const latest = () => mockAds[mockAds.length - 1];
const emit = (type: string) => latest().listeners.get(type)?.();
const flush = () => new Promise(resolve => setImmediate(resolve));

beforeEach(() => {
  mockAds.length = 0;
  resetFullscreen();
});

describe('watchRewardedAd', () => {
  it('is offered in dev builds through the test unit', () => {
    expect(rewardedAvailable()).toBe(true);
  });

  it('loads on demand, shows once loaded and reports an earned reward', async () => {
    const result = watchRewardedAd(true);
    expect(latest().load).toHaveBeenCalledTimes(1);
    expect(latest().options).toEqual({ requestNonPersonalizedAdsOnly: false });
    emit('rewarded_loaded');
    expect(latest().show).toHaveBeenCalledTimes(1);
    expect(fullscreenBusy()).toBe(true);
    emit('rewarded_earned_reward');
    emit('closed');
    await expect(result).resolves.toBe('earned');
    expect(latest().listeners.size).toBe(0);
  });

  it('reports skipped when the ad closes before the reward', async () => {
    const result = watchRewardedAd(false);
    expect(latest().options).toEqual({ requestNonPersonalizedAdsOnly: true });
    emit('rewarded_loaded');
    emit('closed');
    await expect(result).resolves.toBe('skipped');
  });

  it('reports unavailable when the load fails', async () => {
    const result = watchRewardedAd(true);
    emit('error');
    await expect(result).resolves.toBe('unavailable');
    expect(latest().show).not.toHaveBeenCalled();
    expect(fullscreenBusy()).toBe(false);
  });

  it('reports unavailable when show() rejects', async () => {
    const result = watchRewardedAd(true);
    latest().show.mockReturnValueOnce(Promise.reject(new Error('expired')));
    emit('rewarded_loaded');
    await flush();
    await expect(result).resolves.toBe('unavailable');
  });

  it('gives up on a load that never answers and ignores a late load', async () => {
    jest.useFakeTimers();
    try {
      const result = watchRewardedAd(true);
      const ad = latest();
      jest.advanceTimersByTime(REWARDED_LOAD_TIMEOUT_MS);
      await expect(result).resolves.toBe('unavailable');
      ad.listeners.get('rewarded_loaded')?.();
      expect(ad.show).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('fullscreen guard', () => {
  it('stays busy for a few seconds after a full-screen ad closes', async () => {
    const result = watchRewardedAd(true);
    emit('rewarded_loaded');
    emit('closed');
    await result;
    const closedAt = Date.now();
    expect(fullscreenBusy(closedAt + 1000)).toBe(true);
    expect(fullscreenBusy(closedAt + 10_000)).toBe(false);
  });
});
