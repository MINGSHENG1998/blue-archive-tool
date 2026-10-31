// Readouts for the AP timer screen. Formatting only: the AP arithmetic
// (regeneration, cap, spending) lives in services/userdata/ap.ts.

/** The quick-spend chips, matching the common sortie costs. */
export const QUICK_SPEND = [10, 20, 40, 60] as const;

/**
 * Time left as whole hours and minutes. Minutes round up, so a timer with a
 * few seconds left reads "1m" rather than "0m" before the moment arrives.
 */
export function splitRemaining(ms: number): { h: number; m: number } {
  const minutes = Number.isFinite(ms) ? Math.max(0, Math.ceil(ms / 60_000)) : 0;
  return { h: Math.floor(minutes / 60), m: minutes % 60 };
}

/** "05:59": minutes and seconds, for the next-AP countdown (always under an hour). */
export function countdown(ms: number): string {
  const seconds = Number.isFinite(ms) ? Math.max(0, Math.ceil(ms / 1000)) : 0;
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Whether two timestamps fall on the same local calendar day. */
export function sameLocalDay(a: number, b: number): boolean {
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}
