import { bondPlan, levelPlan, elephPlan, giftEquivalents, raidTimer, raidTopDifficulty } from '../calculators';
import type { GameRaids } from '../gamedata/types';
import { clampInteger, rangeValueFromDrag, holdStep } from '../calculator-controls';

describe('calculator formula regressions', () => {
  it('uses rank-minus-one bond indexing and the existing estimate formulas', () => {
    expect(bondPlan(1, 2, 5, 50)).toEqual({ totalExp: 15, monthly: 5485, days: 1, months: 1 });
    expect(bondPlan(2, 2, 5, 50)).toBeNull();
  });
  it('subtracts report inventory but charges credits for the full EXP', () => {
    expect(levelPlan(1, 2, { pinkBook: 1, credits: 7 })).toMatchObject({ totalExp: 10, pinkBooks: 0, greyBooks: 0, creditsNeeded: 63 });
    expect(levelPlan(1, 2, {})).toMatchObject({ greyBooks: 1, creditsNeeded: 70 });
    expect(levelPlan(90, 90, {})).toBeNull();
  });
  it('preserves the promotion batch boundaries and weapon-inventory quirk', () => {
    expect(elephPlan(1, 2, 0, 1)).toMatchObject({ totalFragments: 30, neededFragments: 30, totalEligma: 30 });
    expect(elephPlan(1, 5, 330, 4)).toMatchObject({ totalFragments: 830, neededFragments: 500, weaponUpgradeFragments: 500, totalEligma: 0 });
    expect(elephPlan(5, 5, 0, 1)).toBeNull();
  });
});

describe('bond gift equivalents', () => {
  it('rounds each source up to cover the whole EXP, in table order', () => {
    const rows = giftEquivalents(100);
    expect(rows[0]).toEqual({ key: 'checkIn', exp: 15, count: 7 });
    expect(rows.find(row => row.key === 'loved3Star')).toEqual({ key: 'loved3Star', exp: 240, count: 1 });
    expect(rows).toHaveLength(9);
    expect(giftEquivalents(0).every(row => row.count === 0)).toBe(true);
  });
});

describe('live raid presets', () => {
  const raids: GameRaids = { raid: {}, multiFloor: {}, eliminate: [{}, { '41': { HeavyArmor: 6, ElasticArmor: 6, LightArmor: 5 }, '42': { LightArmor: 9 } }, {}] };
  it('maps a Total or Grand Assault boss to its timer', () => {
    expect(raidTimer({ kind: 'Raid', id: 1 })).toBe(180);
    expect(raidTimer({ kind: 'EliminateRaid', id: 12 })).toBe(240);
    expect(raidTimer({ kind: 'Raid', id: 13 })).toBe(270);
  });
  it('has no timer for multi-floor raids or unlisted bosses', () => {
    expect(raidTimer({ kind: 'MultiFloorRaid', id: 1 })).toBeNull();
    expect(raidTimer({ kind: 'Raid', id: 999 })).toBeNull();
  });
  it('picks the top open Grand Assault tier and ignores tiers the table lacks', () => {
    expect(raidTopDifficulty({ kind: 'EliminateRaid', season: 41 }, raids)).toBe(6);
    expect(raidTopDifficulty({ kind: 'EliminateRaid', season: 42 }, raids)).toBeNull();
    expect(raidTopDifficulty({ kind: 'EliminateRaid', season: 7 }, raids)).toBeNull();
    expect(raidTopDifficulty({ kind: 'Raid', season: 41 }, raids)).toBeNull();
    expect(raidTopDifficulty({ kind: 'EliminateRaid', season: null }, raids)).toBeNull();
  });
});

describe('calculator control boundaries', () => {
  it('moves from the thumb start using gesture delta regardless of screen offset', () => {
    expect(rangeValueFromDrag(20, 100, 226, 1, 101, 1)).toBe(70);
    expect(rangeValueFromDrag(20, -1000, 226, 1, 101, 1)).toBe(1);
    expect(rangeValueFromDrag(20, 1000, 226, 1, 101, 1)).toBe(101);
    expect(rangeValueFromDrag(3, 10, 126, 3, 23, 2)).toBe(5);
  });
  it('clamps manual entries and accelerates to whole steps', () => {
    expect(clampInteger(104.6, 0, 100)).toBe(100);
    expect(clampInteger(-1, 0, 100)).toBe(0);
    expect(clampInteger(NaN, 2, 10)).toBe(2);
    expect([0, 500, 1500, 10000].map(holdStep)).toEqual([1, 2, 3, 10]);
  });
});
