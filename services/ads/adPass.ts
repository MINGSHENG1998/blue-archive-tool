import AsyncStorage from "@react-native-async-storage/async-storage";

/** How long ads stay off after the user watches one rewarded ad. */
export const AD_PASS_MS = 24 * 60 * 60 * 1000;

const STORAGE_KEY = "@adPassUntil";

/**
 * A stored pass expiry, or 0 when there is none. A value further out than one
 * pass from now (the device clock was moved back) is clamped to one pass.
 */
export function normalizeAdPass(raw: unknown, now: number): number {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= now) return 0;
  return Math.min(raw, now + AD_PASS_MS);
}

export async function readAdPass(now = Date.now()): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw === null ? 0 : normalizeAdPass(Number(raw), now);
  } catch {
    return 0;
  }
}

/** Starts a fresh pass from `now` and returns its expiry. */
export async function writeAdPass(now = Date.now()): Promise<number> {
  const until = now + AD_PASS_MS;
  await AsyncStorage.setItem(STORAGE_KEY, String(until));
  return until;
}
