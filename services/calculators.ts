import { bondExpData } from '@/constants/bondData';
import { charaExpData } from '@/constants/charaLvlData';

export function bondPlan(from: number, to: number, pat: number, monthlyGift: number) {
  if (!(from >= 1 && from <= 99 && to >= 2 && to <= 100 && from < to)) return null;
  const totalExp = bondExpData[to - 1].totalExp - bondExpData[from - 1].totalExp;
  const monthly = pat * 15 + monthlyGift * 60 + 2410;
  return { totalExp, monthly, days: Math.ceil(totalExp / (pat * 15 + monthlyGift * 2 + 80)), months: Math.ceil(totalExp / monthly) };
}

export function levelPlan(from: number, to: number, owned: Partial<Record<'pinkBook' | 'orangeBook' | 'blueBook' | 'greyBook' | 'credits', number>>) {
  if (!(from >= 1 && from <= 89 && to >= 2 && to <= 90 && from < to)) return null;
  const totalExp = charaExpData[to].totalExp - charaExpData[from].totalExp;
  const availableExp = (owned.pinkBook || 0) * 10000 + (owned.orangeBook || 0) * 2000 + (owned.blueBook || 0) * 500 + (owned.greyBook || 0) * 50;
  let remaining = Math.max(0, totalExp - availableExp);
  const pinkBooks = Math.floor(remaining / 10000); remaining -= pinkBooks * 10000;
  const orangeBooks = Math.floor(remaining / 2000); remaining -= orangeBooks * 2000;
  const blueBooks = Math.floor(remaining / 500); remaining -= blueBooks * 500;
  return { totalExp, availableExp, pinkBooks, orangeBooks, blueBooks, greyBooks: Math.ceil(remaining / 50), creditsNeeded: Math.max(0, totalExp * 7 - (owned.credits || 0)) };
}

const PROMOTIONS: Record<string, { fragments: number; cost: number }> = {
  '1-2': { fragments: 30, cost: 40 }, '1-3': { fragments: 110, cost: 350 },
  '1-4': { fragments: 210, cost: 850 }, '1-5': { fragments: 330, cost: 1450 },
  '2-3': { fragments: 80, cost: 200 }, '2-4': { fragments: 180, cost: 700 },
  '2-5': { fragments: 300, cost: 1300 }, '3-4': { fragments: 100, cost: 300 },
  '3-5': { fragments: 220, cost: 900 }, '4-5': { fragments: 120, cost: 600 },
};
export function elephPlan(from: number, to: number, owned: number, weaponRank: number) {
  if (!(from >= 1 && from <= 4 && to >= 2 && to <= 5 && from < to)) return null;
  const requirement = PROMOTIONS[`${from}-${to}`];
  if (!requirement) return null;
  let neededFragments = Math.max(0, requirement.fragments - owned);
  let remaining = neededFragments, batch = 0, totalEligma = 0;
  // Preserve the original inclusive tier boundaries and promotion-only pricing.
  while (remaining > 0) {
    const size = Math.min(remaining, 20);
    totalEligma += size * (batch <= 20 ? 1 : batch <= 40 ? 2 : batch <= 60 ? 3 : batch <= 80 ? 4 : 5);
    remaining -= size; batch += size;
  }
  const weaponUpgradeFragments = to === 5 && weaponRank > 1 ? [120, 180, 200].slice(0, weaponRank - 1).reduce((a, b) => a + b, 0) : 0;
  neededFragments += weaponUpgradeFragments;
  return { totalFragments: requirement.fragments + weaponUpgradeFragments, neededFragments, totalEligma, totalCost: requirement.cost, weaponUpgradeFragments };
}
