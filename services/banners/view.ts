import type { Locale } from '@/constants/i18n';
import { bannerMatches } from './select';
import type { Banner, BannerType } from './types';
import type { StudentIndex } from '@/services/gamedata/students';
import { watchesUnit } from '@/services/students/view';

export type ScheduleFilter = 'All' | BannerType | 'Watched';
export type ScheduleSort = 'earliest' | 'latest' | 'rarity';

/** Insertion boundary for a chronological list; rarity has no time position. */
export function nowMarkerIndex(banners: readonly Banner[], now: number, sort: ScheduleSort): number | null {
  if (sort === 'rarity') return null;
  const index = banners.findIndex(banner => sort === 'latest' ? banner.startAt <= now : banner.startAt > now);
  return index < 0 ? banners.length : index;
}

export function filterSchedule(banners: readonly Banner[], query: string, locale: Locale, filter: ScheduleFilter, watched: readonly number[], sort: ScheduleSort, students: StudentIndex = {}): Banner[] {
  const result = banners.filter(banner => bannerMatches(banner, query, locale)
    && (filter === 'All' || filter === 'Watched' ? filter !== 'Watched' || banner.characters.some(char => char.studentId && watchesUnit(watched, students[char.studentId] ?? { Id: char.studentId })) : banner.type === filter));
  return result.sort((a, b) => sort === 'latest' ? b.startAt - a.startAt : sort === 'rarity'
    ? Math.max(0, ...b.characters.map(char => char.rarity)) - Math.max(0, ...a.characters.map(char => char.rarity)) || a.startAt - b.startAt
    : a.startAt - b.startAt);
}

/** Google Calendar accepts exact UTC instants, never device-local date strings. */
export function calendarUrl(banner: Pick<Banner, 'startAt' | 'endAt'>, title: string, note: string): string {
  const stamp = (at: number) => new Date(at).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const params = { action: 'TEMPLATE', text: title, dates: `${stamp(banner.startAt)}/${stamp(banner.endAt)}`, details: note, ctz: 'UTC' };
  return `https://calendar.google.com/calendar/render?${Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}`;
}

export const scheduleMonth = (at: number) => new Date(at).toISOString().slice(0, 7);
export function scheduleDate(at: number, locale: Locale): string {
  return `${new Date(at).toLocaleString(locale, { timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} UTC`;
}
