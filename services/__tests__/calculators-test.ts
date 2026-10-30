import { bondPlan, levelPlan, elephPlan } from '../calculators';
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
