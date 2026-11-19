import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EMPTY_PROMPT, PROMPT_AFTER_DAYS, PROMPT_SHOW_DAYS,
  loadPrompt, normalizePrompt, retirePrompt, savePrompt, visitPrompt, type PromptState,
} from '../supportPrompt';

const DAY = 86_400_000;
const START = new Date(2026, 10, 20, 12).getTime(); // local noon, away from midnight

/** Opens the app once on each of `n` consecutive days. */
function openOn(n: number, eligible = true, from: PromptState = EMPTY_PROMPT, startDay = 0) {
  let state = from;
  const shows: boolean[] = [];
  for (let i = 0; i < n; i++) {
    const r = visitPrompt(state, START + (startDay + i) * DAY, eligible);
    state = r.state;
    shows.push(r.show);
  }
  return { state, shows };
}

describe('visitPrompt', () => {
  it(`stays hidden until the app was opened on ${PROMPT_AFTER_DAYS} different days`, () => {
    const { shows } = openOn(PROMPT_AFTER_DAYS);
    expect(shows).toEqual([...Array(PROMPT_AFTER_DAYS - 1).fill(false), true]);
  });

  it('counts each day once however often the app opens', () => {
    let state = EMPTY_PROMPT;
    for (let i = 0; i < 10; i++) state = visitPrompt(state, START + i * 60_000, true).state;
    expect(state.days).toBe(1);
  });

  it(`retires itself after ${PROMPT_SHOW_DAYS} days on screen`, () => {
    const { state, shows } = openOn(PROMPT_AFTER_DAYS + PROMPT_SHOW_DAYS + 2);
    expect(shows.filter(Boolean)).toHaveLength(PROMPT_SHOW_DAYS);
    expect(state.done).toBe(true);
  });

  it('keeps showing on a day it already showed (reopen, refocus)', () => {
    const { state } = openOn(PROMPT_AFTER_DAYS);
    const again = visitPrompt(state, START + (PROMPT_AFTER_DAYS - 1) * DAY + 3_600_000, true);
    expect(again.show).toBe(true);
    expect(again.state.shown).toBe(1);
  });

  it('never shows to tippers or during a pass, but still counts the day', () => {
    const { state, shows } = openOn(PROMPT_AFTER_DAYS + 2, false);
    expect(shows.some(Boolean)).toBe(false);
    expect(state.days).toBe(PROMPT_AFTER_DAYS + 2);
    expect(state.shown).toBe(0);
  });

  it('stays gone once retired', () => {
    const { state } = openOn(PROMPT_AFTER_DAYS);
    const r = visitPrompt({ ...state, done: true }, START + 30 * DAY, true);
    expect(r.show).toBe(false);
  });
});

describe('storage', () => {
  beforeEach(async () => { await AsyncStorage.clear(); });

  it('normalizes junk', () => {
    expect(normalizePrompt(null)).toEqual(EMPTY_PROMPT);
    expect(normalizePrompt({ days: -3, shown: 'x', done: 'yes', lastDay: 5 })).toEqual(EMPTY_PROMPT);
  });

  it('round-trips and retires', async () => {
    const { state } = openOn(3);
    await savePrompt(state);
    await expect(loadPrompt()).resolves.toEqual(state);
    await retirePrompt();
    await expect(loadPrompt()).resolves.toEqual({ ...state, done: true });
  });

  it('falls back to empty on corrupt JSON', async () => {
    await AsyncStorage.setItem('@supportPrompt', '{not json');
    await expect(loadPrompt()).resolves.toEqual(EMPTY_PROMPT);
  });
});
