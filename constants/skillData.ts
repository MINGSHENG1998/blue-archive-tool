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

// Generic OOParts (artifact) estimate. Exact items + amounts are
// student-specific (each student uses a different artifact family, e.g. Rohonc
// vs Nebra/Nimrud), so these are the MEDIAN amount per upgrade step across all
// standard students, split into two generic grades (0 = lower-grade tier,
// 1 = higher-grade tier). Approximate — always varies by student.
export type ArtifactStep = { amount: number; grade: 0 | 1 };

export const EX_ARTIFACT: ArtifactStep[] = [
  { amount: 15, grade: 0 }, // lv1->2
  { amount: 44, grade: 0 }, // lv2->3
  { amount: 35, grade: 1 }, // lv3->4
  { amount: 29, grade: 1 }, // lv4->5
];

export const NORMAL_ARTIFACT: ArtifactStep[] = [
  { amount: 0, grade: 0 }, // lv1->2
  { amount: 0, grade: 0 }, // lv2->3
  { amount: 5, grade: 0 }, // lv3->4
  { amount: 17, grade: 0 }, // lv4->5
  { amount: 27, grade: 0 }, // lv5->6
  { amount: 20, grade: 1 }, // lv6->7
  { amount: 13, grade: 1 }, // lv7->8
  { amount: 21, grade: 1 }, // lv8->9
  { amount: 0, grade: 0 }, // lv9->10 (secret note step, no artifact)
];

export type LevelRange = { current: number; target: number };

export type SkillCostInput = {
  ex: LevelRange; // levels 1-5
  skills: [LevelRange, LevelRange, LevelRange]; // the three normal skills, levels 1-10
};

// bd = Tactical Training Blu-rays (EX skill); tn = Tech Notes (normal skills)
// artifactLow/High = approximate generic OOParts estimate (see EX_ARTIFACT).
export type SkillCostResult = {
  bd: [number, number, number, number];
  tn: [number, number, number, number];
  secretNotes: number;
  credits: number;
  artifactLow: number;
  artifactHigh: number;
};

export const EMPTY_INVENTORY: SkillCostResult = {
  bd: [0, 0, 0, 0],
  tn: [0, 0, 0, 0],
  secretNotes: 0,
  credits: 0,
  artifactLow: 0,
  artifactHigh: 0,
};

// Accumulates costs for one skill's level range. Mutates `books` and `acc` in
// place; callers must pass freshly created accumulators.
const sumSteps = (
  costs: SkillCostStep[],
  artifacts: ArtifactStep[],
  range: LevelRange,
  books: [number, number, number, number],
  acc: { secretNotes: number; credits: number; artifactLow: number; artifactHigh: number }
) => {
  // Upgrade step i covers level (i+1) -> (i+2)
  for (let level = range.current; level < range.target; level++) {
    const step = costs[level - 1];
    for (let t = 0; t < 4; t++) books[t] += step.books[t];
    acc.secretNotes += step.secretNotes;
    acc.credits += step.credits;
    const art = artifacts[level - 1];
    if (art.grade === 0) acc.artifactLow += art.amount;
    else acc.artifactHigh += art.amount;
  }
};

export function calculateSkillCost(input: SkillCostInput): SkillCostResult {
  const bd: [number, number, number, number] = [0, 0, 0, 0];
  const tn: [number, number, number, number] = [0, 0, 0, 0];
  const acc = { secretNotes: 0, credits: 0, artifactLow: 0, artifactHigh: 0 };

  sumSteps(EX_SKILL_COSTS, EX_ARTIFACT, input.ex, bd, acc);
  for (const skill of input.skills) {
    sumSteps(NORMAL_SKILL_COSTS, NORMAL_ARTIFACT, skill, tn, acc);
  }

  return {
    bd,
    tn,
    secretNotes: acc.secretNotes,
    credits: acc.credits,
    artifactLow: acc.artifactLow,
    artifactHigh: acc.artifactHigh,
  };
}

// Subtracts owned inventory. OOParts are not inventory-tracked, so the
// artifact estimate passes through unchanged.
export function applyInventory(
  totals: SkillCostResult,
  owned: SkillCostResult
): SkillCostResult {
  return {
    bd: totals.bd.map((v, i) => Math.max(0, v - owned.bd[i])) as SkillCostResult["bd"],
    tn: totals.tn.map((v, i) => Math.max(0, v - owned.tn[i])) as SkillCostResult["tn"],
    secretNotes: Math.max(0, totals.secretNotes - owned.secretNotes),
    credits: Math.max(0, totals.credits - owned.credits),
    artifactLow: totals.artifactLow,
    artifactHigh: totals.artifactHigh,
  };
}
