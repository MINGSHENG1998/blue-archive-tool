import AsyncStorage from '@react-native-async-storage/async-storage';

// The one-time "support the app" card on Home. It appears only for people who
// keep coming back (opened on PROMPT_AFTER_DAYS different days), and only
// once: any button retires it, and if it is ignored it retires on its own
// after PROMPT_SHOW_DAYS days on screen. Never shown to tippers or during a
// 24-hour ad pass.

export const PROMPT_AFTER_DAYS = 5;
export const PROMPT_SHOW_DAYS = 3;

const STORAGE_KEY = '@supportPrompt';

export interface PromptState {
  /** Distinct local days the app was opened. */
  days: number;
  lastDay: string;
  /** Distinct days the card was on screen. */
  shown: number;
  lastShown: string;
  done: boolean;
}

export const EMPTY_PROMPT: PromptState = { days: 0, lastDay: '', shown: 0, lastShown: '', done: false };

const count = (raw: unknown) => typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
const text = (raw: unknown) => typeof raw === 'string' ? raw.slice(0, 10) : '';

export function normalizePrompt(raw: unknown): PromptState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return EMPTY_PROMPT;
  const r = raw as Record<string, unknown>;
  return { days: count(r.days), lastDay: text(r.lastDay), shown: count(r.shown), lastShown: text(r.lastShown), done: r.done === true };
}

/** Local calendar day, YYYY-MM-DD. */
export function dayKey(now: number): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Records that the app was opened on `now`'s day and decides whether the card
 * shows. Calling it again on the same day changes nothing.
 */
export function visitPrompt(state: PromptState, now: number, eligible: boolean): { state: PromptState; show: boolean } {
  const today = dayKey(now);
  let next = state.lastDay === today ? state : { ...state, days: state.days + 1, lastDay: today };
  if (next.done || !eligible || next.days < PROMPT_AFTER_DAYS) return { state: next, show: false };
  if (next.lastShown !== today) {
    if (next.shown >= PROMPT_SHOW_DAYS) return { state: { ...next, done: true }, show: false };
    next = { ...next, shown: next.shown + 1, lastShown: today };
  }
  return { state: next, show: true };
}

export async function loadPrompt(): Promise<PromptState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? normalizePrompt(JSON.parse(raw)) : EMPTY_PROMPT;
  } catch {
    return EMPTY_PROMPT;
  }
}

export async function savePrompt(state: PromptState): Promise<void> {
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* best effort */ }
}

/** Never show the card again. */
export async function retirePrompt(): Promise<void> {
  await savePrompt({ ...(await loadPrompt()), done: true });
}
