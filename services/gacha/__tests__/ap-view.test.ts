import { AP_REGEN_MS } from '@/services/userdata/ap';
import { QUICK_SPEND, countdown, sameLocalDay, splitRemaining } from '../apView';

describe('AP timer readouts', () => {
  it('splits time left into hours and minutes, rounding minutes up', () => {
    expect(splitRemaining(0)).toEqual({ h: 0, m: 0 });
    expect(splitRemaining(1_000)).toEqual({ h: 0, m: 1 });
    expect(splitRemaining(59 * 60_000)).toEqual({ h: 0, m: 59 });
    expect(splitRemaining(60 * 60_000)).toEqual({ h: 1, m: 0 });
    expect(splitRemaining((3 * 60 + 12) * 60_000 - 500)).toEqual({ h: 3, m: 12 });
    expect(splitRemaining(240 * AP_REGEN_MS)).toEqual({ h: 24, m: 0 });
  });
  it('never reads negative or garbage time', () => {
    expect(splitRemaining(-5_000)).toEqual({ h: 0, m: 0 });
    expect(splitRemaining(NaN)).toEqual({ h: 0, m: 0 });
    expect(countdown(-1)).toBe('00:00');
    expect(countdown(Infinity)).toBe('00:00');
  });
  it('counts the next tick down in minutes and seconds', () => {
    expect(countdown(AP_REGEN_MS)).toBe('06:00');
    expect(countdown(AP_REGEN_MS - 1)).toBe('06:00');
    expect(countdown(59_001)).toBe('01:00');
    expect(countdown(5_000)).toBe('00:05');
  });
  it('compares local calendar days', () => {
    const noon = new Date(2026, 9, 31, 12, 0).getTime();
    expect(sameLocalDay(noon, new Date(2026, 9, 31, 23, 59).getTime())).toBe(true);
    expect(sameLocalDay(noon, new Date(2026, 10, 1, 0, 0).getTime())).toBe(false);
  });
  it('offers only positive quick-spend costs in ascending order', () => {
    expect([...QUICK_SPEND]).toEqual([10, 20, 40, 60]);
  });
});
