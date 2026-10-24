// Live gacha session tracking: count what you pulled, compare it to the
// published rates. Pure state machine — no storage, no React, no clock.

/** Published Blue Archive rates. */
export const THREE_STAR_RATE = 0.03;
export const PICKUP_RATE = 0.007;

export type PullKind = "miss" | "threeStar" | "pickup";

export interface GachaSession {
  /** Newest last. Doubles as the undo stack, so counts are always derivable. */
  history: PullKind[];
}

export const emptySession = (): GachaSession => ({ history: [] });

export function addPull(session: GachaSession, kind: PullKind): GachaSession {
  return { history: [...session.history, kind] };
}

/** Adds `count` misses at once — the common case when logging a ten-pull. */
export function addMisses(session: GachaSession, count: number): GachaSession {
  if (count <= 0) return session;
  return {
    history: [...session.history, ...Array<PullKind>(count).fill("miss")],
  };
}

export function undo(session: GachaSession): GachaSession {
  if (session.history.length === 0) return session;
  return { history: session.history.slice(0, -1) };
}

export interface GachaStats {
  pulls: number;
  threeStars: number;
  pickups: number;
  /** Observed rates as fractions; 0 when nothing has been pulled yet. */
  threeStarRate: number;
  pickupRate: number;
  /** How many you would expect at the published rate, given this many pulls. */
  expectedThreeStars: number;
  expectedPickups: number;
  /** Pulls since the last 3★ — the number people actually watch. */
  sinceLastThreeStar: number;
  /**
   * Whether the session is running above or below the published 3★ rate.
   * `even` until there are enough pulls for the comparison to mean anything.
   */
  luck: "lucky" | "unlucky" | "even";
}

/**
 * Below this, one lucky pull swings the rate wildly and calling it "lucky"
 * would be noise rather than information.
 */
export const LUCK_MIN_PULLS = 20;

export function stats(session: GachaSession): GachaStats {
  const pulls = session.history.length;
  const pickups = session.history.filter((kind) => kind === "pickup").length;
  // A pickup is a 3★ too — never double-count it as a separate category.
  const threeStars =
    session.history.filter((kind) => kind === "threeStar").length + pickups;

  let sinceLastThreeStar = 0;
  for (let i = session.history.length - 1; i >= 0; i--) {
    if (session.history[i] === "miss") sinceLastThreeStar++;
    else break;
  }

  const threeStarRate = pulls === 0 ? 0 : threeStars / pulls;
  const pickupRate = pulls === 0 ? 0 : pickups / pulls;
  const expectedThreeStars = pulls * THREE_STAR_RATE;

  let luck: GachaStats["luck"] = "even";
  if (pulls >= LUCK_MIN_PULLS) {
    if (threeStars > expectedThreeStars) luck = "lucky";
    else if (threeStars < expectedThreeStars) luck = "unlucky";
  }

  return {
    pulls,
    threeStars,
    pickups,
    threeStarRate,
    pickupRate,
    expectedThreeStars,
    expectedPickups: pulls * PICKUP_RATE,
    sinceLastThreeStar,
    luck,
  };
}

/** "3.42%" — two decimals, matching how the published rates are written. */
export function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}
