import {
  calculateSkillCost,
  applyInventory,
  EMPTY_INVENTORY,
  SkillCostResult,
} from "../skillData";

describe("calculateSkillCost", () => {
  it("computes full range: EX 1->5 + three normals 1->10", () => {
    const result = calculateSkillCost({
      ex: { current: 1, target: 5 },
      skills: [
        { current: 1, target: 10 },
        { current: 1, target: 10 },
        { current: 1, target: 10 },
      ],
    });
    expect(result.bd).toEqual([30, 30, 30, 8]);
    expect(result.tn).toEqual([75, 75, 75, 60]);
    expect(result.secretNotes).toBe(3);
    // EX: 80K+500K+3M+10M = 13,580,000
    // each normal 1->10: 8,812,500 ; x3 = 26,437,500
    expect(result.credits).toBe(40_017_500);
    // OOParts (generic estimate): EX low 15+44=59, high 35+29=64;
    // each normal low 5+17+27=49, high 20+13+21=54 (x3) -> low 147, high 162.
    expect(result.artifactLow).toBe(206);
    expect(result.artifactHigh).toBe(226);
  });

  it("counts no OOParts below skill level 3 for normal skills", () => {
    const result = calculateSkillCost({
      ex: { current: 1, target: 1 },
      skills: [
        { current: 1, target: 3 }, // lv1->2, lv2->3 only
        { current: 1, target: 1 },
        { current: 1, target: 1 },
      ],
    });
    expect(result.artifactLow).toBe(0);
    expect(result.artifactHigh).toBe(0);
  });

  it("computes partial EX range 2->4", () => {
    const result = calculateSkillCost({
      ex: { current: 2, target: 4 },
      skills: [
        { current: 1, target: 1 },
        { current: 1, target: 1 },
        { current: 1, target: 1 },
      ],
    });
    expect(result.bd).toEqual([18, 30, 12, 0]);
    expect(result.tn).toEqual([0, 0, 0, 0]);
    expect(result.secretNotes).toBe(0);
    expect(result.credits).toBe(3_500_000);
  });

  it("computes partial normal range 4->7 on one skill", () => {
    const result = calculateSkillCost({
      ex: { current: 1, target: 1 },
      skills: [
        { current: 4, target: 7 },
        { current: 1, target: 1 },
        { current: 1, target: 1 },
      ],
    });
    expect(result.bd).toEqual([0, 0, 0, 0]);
    expect(result.tn).toEqual([0, 20, 13, 0]);
    expect(result.secretNotes).toBe(0);
    expect(result.credits).toBe(840_000);
  });

  it("includes secret note step 9->10", () => {
    const result = calculateSkillCost({
      ex: { current: 1, target: 1 },
      skills: [
        { current: 9, target: 10 },
        { current: 1, target: 1 },
        { current: 1, target: 1 },
      ],
    });
    expect(result.bd).toEqual([0, 0, 0, 0]);
    expect(result.tn).toEqual([0, 0, 0, 0]);
    expect(result.secretNotes).toBe(1);
    expect(result.credits).toBe(4_000_000);
  });

  it("returns all zeros when every target equals current", () => {
    const result = calculateSkillCost({
      ex: { current: 3, target: 3 },
      skills: [
        { current: 5, target: 5 },
        { current: 10, target: 10 },
        { current: 1, target: 1 },
      ],
    });
    expect(result.bd).toEqual([0, 0, 0, 0]);
    expect(result.tn).toEqual([0, 0, 0, 0]);
    expect(result.secretNotes).toBe(0);
    expect(result.credits).toBe(0);
  });
});

describe("applyInventory", () => {
  const totals: SkillCostResult = {
    bd: [30, 30, 30, 8],
    tn: [75, 75, 75, 60],
    secretNotes: 3,
    credits: 40_017_500,
    artifactLow: 206,
    artifactHigh: 226,
  };

  it("subtracts owned items and clamps at zero", () => {
    const remaining = applyInventory(totals, {
      bd: [100, 10, 0, 0],
      tn: [75, 0, 80, 0],
      secretNotes: 5,
      credits: 1_000_000,
      artifactLow: 0,
      artifactHigh: 0,
    });
    expect(remaining.bd).toEqual([0, 20, 30, 8]);
    expect(remaining.tn).toEqual([0, 75, 0, 60]);
    expect(remaining.secretNotes).toBe(0);
    expect(remaining.credits).toBe(39_017_500);
    // OOParts pass through (not inventory-tracked)
    expect(remaining.artifactLow).toBe(206);
    expect(remaining.artifactHigh).toBe(226);
  });

  it("EMPTY_INVENTORY changes nothing", () => {
    expect(applyInventory(totals, EMPTY_INVENTORY)).toEqual(totals);
  });
});
