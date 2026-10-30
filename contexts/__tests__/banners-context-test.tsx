import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { BannersProvider, useBanners } from '../banners-context';
import { fetchBanners, readBannersCache } from '@/services/banners';

jest.mock('@/services/banners', () => ({
  ...jest.requireActual('@/services/banners/select'),
  BannerFetchError: class extends Error {},
  fetchBanners: jest.fn(),
  readBannersCache: jest.fn(),
  writeBannersCache: jest.fn().mockResolvedValue(true),
}));

let captured: ReturnType<typeof useBanners>;
function Capture() { captured = useBanners(); return null; }

describe('banner refresh resilience', () => {
  let renderer: TestRenderer.ReactTestRenderer;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(readBannersCache).mockResolvedValue(null);
    jest.mocked(fetchBanners).mockResolvedValue([]);
  });
  afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); });

  it('marks the retained network copy offline after refresh fails, then recovers', async () => {
    await act(async () => { renderer = TestRenderer.create(<BannersProvider><Capture /></BannersProvider>); });
    expect(captured.source).toBe('network');
    const fetchedAt = captured.fetchedAt;
    jest.mocked(fetchBanners).mockRejectedValueOnce(new Error('offline'));
    await act(async () => captured.refresh());
    expect(captured.status).toBe('ready');
    expect(captured.source).toBe('cache');
    expect(captured.fetchedAt).toBe(fetchedAt);
    expect(captured.error).toBeNull();
    await act(async () => captured.refresh());
    expect(captured.source).toBe('network');
  });

  it('reports failure only when no usable data exists', async () => {
    jest.mocked(fetchBanners).mockRejectedValue(new Error('offline'));
    await act(async () => { renderer = TestRenderer.create(<BannersProvider><Capture /></BannersProvider>); });
    expect(captured.status).toBe('error');
    expect(captured.source).toBeNull();
    expect(captured.error).toBe('offline');
  });
});
