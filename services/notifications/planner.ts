/** Local-only reminders. IDs and signatures remain stable across reconciliation. */
export const APP_PREFIX = 'bat:reminder:v1:';
export const HORIZON_MS = 14 * 86400000;
export const MAX_PENDING = 50;
export const DEFAULT_REMINDERS: ReminderPreferences = { bannerStart: false, bannerEnd: false, dailyReset: false, birthdays: false, birthdayScope: 'watched', apFull: false };
export interface ReminderPreferences { bannerStart: boolean; bannerEnd: boolean; dailyReset: boolean; birthdays: boolean; birthdayScope: 'watched' | 'owned' | 'all'; apFull: boolean }
export type ReminderKind = 'bannerStart' | 'bannerEnd' | 'dailyReset' | 'birthdays' | 'apFull';
export interface PlannedReminder { id: string; at: number; kind: ReminderKind; route: string; name: string; signature: string }
export interface PlannerInput {
  now: number; preferences: ReminderPreferences;
  banners: { id: string; startAt: number; endAt: number; studentIds: number[]; name?: string }[];
  students: { id: number; name: string; birthday: string; family?: number }[];
  watched: number[]; owned: number[]; fullAt: number | null;
}
export function normalizePreferences(raw: unknown): ReminderPreferences {
  const p = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return { bannerStart: p.bannerStart === true, bannerEnd: p.bannerEnd === true, dailyReset: p.dailyReset === true, birthdays: p.birthdays === true, apFull: p.apFull === true, birthdayScope: p.birthdayScope === 'all' || p.birthdayScope === 'owned' ? p.birthdayScope : 'watched' };
}
export function planReminders(input: PlannerInput): PlannedReminder[] {
  const { now, preferences: p } = input;
  const result: PlannedReminder[] = [];
  const add = (kind: ReminderKind, key: string, at: number, route: string, name = '') => {
    if (!Number.isFinite(at) || at <= now || at > now + HORIZON_MS) return;
    const id = `${APP_PREFIX}${kind}:${key}`;
    result.push({ id, at, kind, route, name, signature: JSON.stringify([at, kind, route, name]) });
  };
  const watched = new Set(input.watched);
  // A watch on either combat form applies to their shared recruitment.
  for (const student of input.students) {
    if (student.family !== undefined && (watched.has(student.id) || watched.has(student.family))) {
      watched.add(student.id);
      watched.add(student.family);
    }
  }
  for (const banner of input.banners) {
    if (!banner.studentIds.some(id => watched.has(id))) continue;
    if (p.bannerStart) add('bannerStart', banner.id, banner.startAt, '/(tabs)/banner', banner.name);
    if (p.bannerEnd) add('bannerEnd', banner.id, banner.endAt - 86400000, '/(tabs)/banner', banner.name);
  }
  if (p.dailyReset) {
    // Global server resets at 04:00 JST. T-60m is 18:00 UTC the previous day.
    const d = new Date(now);
    const first = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 18);
    for (let i = 0; i <= 14; i++) {
      const at = first + i * 86400000;
      add('dailyReset', String(at), at, '/');
    }
  }
  if (p.birthdays) {
    const selected = new Set(p.birthdayScope === 'owned' ? input.owned : input.watched);
    const families = new Set<number>();
    for (const student of input.students) {
      // LinkedCharacterId points to the other form, in both directions.
      const family = Math.min(student.id, student.family ?? student.id);
      if (p.birthdayScope !== 'all' && !selected.has(student.id) && !selected.has(student.family ?? student.id)) continue;
      if (families.has(family)) continue;
      const match = /^(\d{1,2})\/(\d{1,2})$/.exec(student.birthday);
      if (!match) continue;
      const month = Number(match[1]), day = Number(match[2]);
      if (month < 1 || month > 12 || day < 1 || day > new Date(2000, month, 0).getDate()) continue;
      families.add(family);
      for (let year = new Date(now).getFullYear(); year <= new Date(now).getFullYear() + 1; year++) {
        // Phone-local 09:00; Feb 29 rolls to Mar 1 in common years.
        const at = new Date(year, month - 1, day, 9).getTime();
        add('birthdays', `${family}:${year}`, at, `/student/${student.id}`, student.name);
      }
    }
  }
  if (p.apFull && input.fullAt !== null) add('apFull', 'current', input.fullAt, '/tools/ap');
  return result.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)).slice(0, MAX_PENDING);
}
export function safeReminderRoute(id: string, route: unknown): string | null {
  return id.startsWith(APP_PREFIX) && typeof route === 'string' && (/^\/student\/[1-9]\d*$/.test(route) || ['/', '/birthdays', '/(tabs)/banner', '/tools/ap', '/reminders'].includes(route)) ? route : null;
}
