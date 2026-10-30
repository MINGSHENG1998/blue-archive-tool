// AP (action points) timer. The user enters their AP and cap; regen from then
// on is pure arithmetic, so there is no ticking state to persist — just the
// last reading and when it was taken.

import { asRecord, clampInt, intInRange } from "./sanitize";
import { createJsonStore } from "./storage";

/**
 * Game constant: Blue Archive regenerates 1 AP every 6 minutes, on every
 * server, and only while AP is below the cap.
 */
export const AP_REGEN_MS = 6 * 60 * 1000;

/**
 * Starting cap before the user enters theirs. The real cap grows with account
 * level, so it is always user-editable and never derived from a level table.
 */
export const DEFAULT_AP_CAP = 240;
/** AP can sit far above the cap (mail, items, purchases); this is just a sanity bound. */
export const MAX_AP = 9999;
export const MAX_AP_CAP = 999;

export const AP_KEY = "ap:v1";

export interface ApState {
  /** AP at the moment of the reading. */
  ap: number;
  cap: number;
  /** When the reading was taken, ms epoch. Regen counts from here. */
  setAt: number;
}

/** A stored reading, or null when there is none worth trusting. */
export function normalizeApState(raw: unknown): ApState | null {
  const record = asRecord(raw);
  if (!record) return null;
  const ap = intInRange(record.ap, 0, MAX_AP);
  const cap = intInRange(record.cap, 1, MAX_AP_CAP);
  const setAt = record.setAt;
  if (ap === undefined || cap === undefined) return null;
  if (typeof setAt !== "number" || !Number.isFinite(setAt) || setAt <= 0) {
    return null;
  }
  return { ap, cap, setAt };
}

/**
 * Whole regen ticks since the reading. A clock that moved backwards (setAt
 * in the future) counts as no time passed rather than negative AP.
 */
const ticksSince = (state: ApState, now: number) =>
  Math.max(0, Math.floor((now - state.setAt) / AP_REGEN_MS));

/**
 * AP at `now`. Regen stops at the cap, but AP already above the cap (from
 * items or mail) stays where it is — it is not pulled down to the cap.
 */
export function currentAp(state: ApState, now: number): number {
  if (state.ap >= state.cap) return state.ap;
  return Math.min(state.cap, state.ap + ticksSince(state, now));
}

/** When AP reaches the cap, ms epoch; at or before setAt when it already has. */
export function apFullAt(state: ApState): number {
  if (state.ap >= state.cap) return state.setAt;
  return state.setAt + (state.cap - state.ap) * AP_REGEN_MS;
}

/** ms until full, 0 once full. */
export const msUntilApFull = (state: ApState, now: number) =>
  Math.max(0, apFullAt(state) - now);

/**
 * The same AP as `state`, re-expressed as a reading at `now` — keeping the
 * regen phase. Three minutes into a six-minute tick stays three minutes in;
 * a naive `setAt = now` would silently restart the tick on every spend.
 */
export function rebaseAp(state: ApState, now: number): ApState {
  if (state.ap >= state.cap) return { ...state, setAt: now };
  const ticks = ticksSince(state, now);
  if (state.ap + ticks >= state.cap) {
    // Full: there is no regen phase left to keep.
    return { ap: state.cap, cap: state.cap, setAt: now };
  }
  return {
    ap: state.ap + ticks,
    cap: state.cap,
    setAt: state.setAt + ticks * AP_REGEN_MS,
  };
}

/** A fresh reading. Typed values are clamped into range. */
export function setApReading(
  ap: number,
  cap: number,
  now: number,
): ApState {
  return {
    ap: clampInt(ap, 0, MAX_AP, 0),
    cap: clampInt(cap, 1, MAX_AP_CAP, DEFAULT_AP_CAP),
    setAt: now,
  };
}

/**
 * Spend `amount` AP at `now`, flooring at 0. Spending from a full bar starts
 * the regen clock at `now`, as the game does.
 */
export function spendAp(state: ApState, amount: number, now: number): ApState {
  const cost = clampInt(amount, 0, MAX_AP, 0);
  if (cost === 0) return state;
  const base = rebaseAp(state, now);
  return { ...base, ap: Math.max(0, base.ap - cost) };
}

export const apStore = createJsonStore<ApState | null>(
  AP_KEY,
  normalizeApState,
  () => null,
);
