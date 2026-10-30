import { AP_REGEN_MS, apFullAt, currentAp, normalizeApState, spendAp } from '@/services/userdata/ap';

describe('AP timer shared arithmetic', () => {
  const at = Date.parse('2026-10-28T02:00:00Z');
  const state = { ap: 238, cap: 240, setAt: at };
  it('ticks only on the six-minute boundary and stops at cap', () => {
    expect(currentAp(state, at + AP_REGEN_MS - 1)).toBe(238);
    expect(currentAp(state, at + AP_REGEN_MS)).toBe(239);
    expect(currentAp(state, at + AP_REGEN_MS * 10)).toBe(240);
    expect(apFullAt(state)).toBe(at + AP_REGEN_MS * 2);
  });
  it('preserves over-cap AP and handles clocks moving back', () => {
    expect(currentAp({ ...state, ap: 300 }, at + AP_REGEN_MS * 10)).toBe(300);
    expect(currentAp(state, at - AP_REGEN_MS)).toBe(238);
  });
  it('preserves the fractional tick when spending below cap', () => {
    const after = spendAp(state, 20, at + AP_REGEN_MS / 2);
    expect(after).toEqual({ ...state, ap: 218 });
    expect(currentAp(after, at + AP_REGEN_MS)).toBe(219);
  });
  it('starts a new tick when spending from full and rejects invalid storage', () => {
    const now = at + AP_REGEN_MS * 3;
    expect(spendAp(state, 20, now)).toEqual({ ap: 220, cap: 240, setAt: now });
    expect(normalizeApState({ ap: -1, cap: 240, setAt: at })).toBeNull();
    expect(normalizeApState({ ap: 20, cap: 0, setAt: at })).toBeNull();
    expect(normalizeApState({ ap: 20, cap: 240, setAt: NaN })).toBeNull();
  });
});
