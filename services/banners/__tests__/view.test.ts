import { normalizeBanner } from '../normalize';
import { calendarUrl, filterSchedule, nowMarkerIndex, scheduleMonth } from '../view';
import type { StudentIndex } from '@/services/gamedata/students';

const one = normalizeBanner('one', { startDate: '2026-10-27', endDate: '2026-11-03', type: 'New', characters: [{ studentId: 1, name: 'Hikari', translations: { ja: 'ヒカリ' }, rarity: 3 }] })!;
const two = normalizeBanner('two', { startDate: '2026-11-03', endDate: '2026-11-10', type: 'Rerun', characters: [{ studentId: 2, name: 'Nozomi', rarity: 2 }] })!;

describe('banner view', () => {
  it('places NOW between past and future, including lists entirely on either side', () => {
    const now = Date.parse('2026-10-29T02:00:00Z');
    expect(nowMarkerIndex([one, two], now, 'earliest')).toBe(1);
    expect(nowMarkerIndex([one], now, 'earliest')).toBe(1);
    expect(nowMarkerIndex([two], now, 'earliest')).toBe(0);
    expect(nowMarkerIndex([two, one], now, 'latest')).toBe(1);
    expect(nowMarkerIndex([two], now, 'latest')).toBe(1);
    expect(nowMarkerIndex([one], now, 'latest')).toBe(0);
    expect(nowMarkerIndex([one, two], now, 'rarity')).toBeNull();
  });
  it('keeps both English and localized searches, with watch and category filtering', () => {
    expect(filterSchedule([one, two], 'hikari', 'ja', 'All', [], 'earliest')).toEqual([one]);
    expect(filterSchedule([one, two], 'ヒカリ', 'ja', 'All', [], 'earliest')).toEqual([one]);
    expect(filterSchedule([one, two], '', 'en', 'Watched', [2], 'earliest')).toEqual([two]);
    expect(filterSchedule([one, two], '', 'en', 'New', [2], 'earliest')).toEqual([one]);
    expect(filterSchedule([one, two], '', 'en', 'Watched', [], 'earliest')).toEqual([]);
  });
  it('does not mutate the provider list while sorting', () => {
    const input = [one, two];
    expect(filterSchedule(input, '', 'en', 'All', [], 'latest')).toEqual([two, one]);
    expect(filterSchedule([two, one], '', 'en', 'All', [], 'rarity')).toEqual([one, two]);
    expect(input).toEqual([one, two]);
  });
  it('matches a watch saved on either linked combat form', () => {
    const students = { 1: { Id: 1, LinkedCharacterId: 3 }, 3: { Id: 3, LinkedCharacterId: 1 } } as unknown as StudentIndex;
    expect(filterSchedule([one, two], '', 'en', 'Watched', [3], 'earliest', students)).toEqual([one]);
  });
  it('constructs an actual Google Calendar template preserving exclusive 02:00 UTC dates', () => {
    const url = new URL(calendarUrl(one, 'ヒカリ & Hikari', 'Predicted dates; verify in-game.'));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('dates')).toBe('20261027T020000Z/20261103T020000Z');
    expect(url.searchParams.get('text')).toBe('ヒカリ & Hikari');
    expect(url.searchParams.get('details')).toContain('verify in-game');
    expect(url.searchParams.get('ctz')).toBe('UTC');
  });
  it('groups by UTC month even near a timezone boundary', () => {
    expect(scheduleMonth(Date.parse('2026-11-01T00:00:00Z'))).toBe('2026-11');
    expect(scheduleMonth(Date.parse('2026-10-31T23:59:59Z'))).toBe('2026-10');
  });
});
