// Skill upgrade costs for Blue Archive students.
// Universal across all standard students (verified against SchaleDB data,
// 190/190 students identical; only the 4 collab students differ slightly).
// books = [tier1, tier2, tier3, tier4] quantities.

export type SkillCostStep = {
  books: [number, number, number, number];
  secretNotes: number;
  credits: number;
};

// EX skill upgrades, level 1->2 through 4->5. Uses Tactical Training Blu-rays.
export const EX_SKILL_COSTS: SkillCostStep[] = [
  { books: [12, 0, 0, 0], secretNotes: 0, credits: 80_000 },
  { books: [18, 12, 0, 0], secretNotes: 0, credits: 500_000 },
  { books: [0, 18, 12, 0], secretNotes: 0, credits: 3_000_000 },
  { books: [0, 0, 18, 8], secretNotes: 0, credits: 10_000_000 },
];

// Normal skill upgrades, level 1->2 through 9->10. Uses Tech Notes;
// the final step uses one Secret Tech Notes instead of books.
export const NORMAL_SKILL_COSTS: SkillCostStep[] = [
  { books: [5, 0, 0, 0], secretNotes: 0, credits: 5_000 },
  { books: [8, 0, 0, 0], secretNotes: 0, credits: 7_500 },
  { books: [12, 5, 0, 0], secretNotes: 0, credits: 60_000 },
  { books: [0, 8, 0, 0], secretNotes: 0, credits: 90_000 },
  { books: [0, 12, 5, 0], secretNotes: 0, credits: 300_000 },
  { books: [0, 0, 8, 0], secretNotes: 0, credits: 450_000 },
  { books: [0, 0, 12, 8], secretNotes: 0, credits: 1_500_000 },
  { books: [0, 0, 0, 12], secretNotes: 0, credits: 2_400_000 },
  { books: [0, 0, 0, 0], secretNotes: 1, credits: 4_000_000 },
];

export type LevelRange = { current: number; target: number };

export type SkillCostInput = {
  ex: LevelRange; // levels 1-5
  skills: LevelRange[]; // three normal skills, levels 1-10
};

export type SkillCostResult = {
  bd: [number, number, number, number];
  tn: [number, number, number, number];
  secretNotes: number;
  credits: number;
};

export const EMPTY_INVENTORY: SkillCostResult = {
  bd: [0, 0, 0, 0],
  tn: [0, 0, 0, 0],
  secretNotes: 0,
  credits: 0,
};

const sumSteps = (
  costs: SkillCostStep[],
  range: LevelRange,
  books: [number, number, number, number],
  acc: { secretNotes: number; credits: number }
) => {
  // Upgrade step i covers level (i+1) -> (i+2)
  for (let level = range.current; level < range.target; level++) {
    const step = costs[level - 1];
    for (let t = 0; t < 4; t++) books[t] += step.books[t];
    acc.secretNotes += step.secretNotes;
    acc.credits += step.credits;
  }
};

export function calculateSkillCost(input: SkillCostInput): SkillCostResult {
  const bd: [number, number, number, number] = [0, 0, 0, 0];
  const tn: [number, number, number, number] = [0, 0, 0, 0];
  const acc = { secretNotes: 0, credits: 0 };

  sumSteps(EX_SKILL_COSTS, input.ex, bd, acc);
  for (const skill of input.skills) {
    sumSteps(NORMAL_SKILL_COSTS, skill, tn, acc);
  }

  return { bd, tn, secretNotes: acc.secretNotes, credits: acc.credits };
}

export function applyInventory(
  totals: SkillCostResult,
  owned: SkillCostResult
): SkillCostResult {
  return {
    bd: totals.bd.map((v, i) => Math.max(0, v - owned.bd[i])) as SkillCostResult["bd"],
    tn: totals.tn.map((v, i) => Math.max(0, v - owned.tn[i])) as SkillCostResult["tn"],
    secretNotes: Math.max(0, totals.secretNotes - owned.secretNotes),
    credits: Math.max(0, totals.credits - owned.credits),
  };
}
