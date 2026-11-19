import AsyncStorage from '@react-native-async-storage/async-storage';
import { AD_PASS_MS, normalizeAdPass, readAdPass, writeAdPass } from '../adPass';

const NOW = Date.parse('2026-11-20T10:00:00Z');

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('ad pass', () => {
  it('treats missing, expired and junk values as no pass', () => {
    expect(normalizeAdPass(undefined, NOW)).toBe(0);
    expect(normalizeAdPass(Number.NaN, NOW)).toBe(0);
    expect(normalizeAdPass(NOW - 1, NOW)).toBe(0);
    expect(normalizeAdPass(NOW, NOW)).toBe(0);
  });

  it('clamps a pass that runs further out than one day (clock moved back)', () => {
    expect(normalizeAdPass(NOW + 3 * AD_PASS_MS, NOW)).toBe(NOW + AD_PASS_MS);
    expect(normalizeAdPass(NOW + 1000, NOW)).toBe(NOW + 1000);
  });

  it('round-trips a granted pass through storage', async () => {
    const until = await writeAdPass(NOW);
    expect(until).toBe(NOW + AD_PASS_MS);
    await expect(readAdPass(NOW + 60_000)).resolves.toBe(until);
    await expect(readAdPass(until + 1)).resolves.toBe(0);
  });

  it('reads 0 when nothing was stored', async () => {
    await expect(readAdPass(NOW)).resolves.toBe(0);
  });
});
