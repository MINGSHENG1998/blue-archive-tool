import type { Locale } from '@/constants/i18n';
import { fmt, type StringSet } from '@/constants/strings/define';
import { homeStrings } from '@/constants/strings/home';
import { type Banner, type BannerCharacter } from '@/services/banners/types';
import { isLive } from '@/services/banners/select';
import { selectLiveGachas, type StudentIndex } from '@/services/gamedata/students';
import { studentIconUrl } from '@/services/gamedata/schaledb';
import type { GameConfig } from '@/services/gamedata/types';
import { watchesUnit } from '@/services/students/view';
import { unitIdOf } from '@/services/userdata/roster';

export function greetingKey(now: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date(now + 9 * 3600000).getUTCHours();
  return hour >= 5 && hour < 12 ? 'morning' : hour < 18 && hour >= 12 ? 'afternoon' : hour >= 18 && hour < 23 ? 'evening' : 'night';
}

export function localDuration(seconds: number, s: StringSet<keyof typeof homeStrings.en>): string {
  const safe = Math.max(0, Math.floor(seconds));
  const days = Math.floor(safe / 86400), hours = Math.floor(safe % 86400 / 3600), minutes = Math.floor(safe % 3600 / 60);
  return days ? fmt(s.days, { days, hours }) : hours ? fmt(s.hours, { hours, minutes }) : minutes ? fmt(s.minutes, { minutes }) : s.underMinute;
}

export interface RecruitmentView { startAt: number; endAt: number; characters: BannerCharacter[]; source: 'schaledb' | 'firestore' }
/** SchaleDB owns live windows; editorial fields enrich the same student only. */
export function recruitmentView(config: GameConfig, byId: StudentIndex, banners: readonly Banner[], now: number): RecruitmentView[] {
  const editorial = new Map<number, BannerCharacter>();
  for (const banner of banners) for (const char of banner.characters) if (char.studentId) editorial.set(char.studentId, char);
  const live = selectLiveGachas(config, byId, new Date(now)).filter(window => window.start * 1000 <= now);
  if (live.length) return live.map(window => ({ startAt: window.start * 1000, endAt: window.end * 1000, source: 'schaledb', characters: window.students.map(student => editorial.get(student.Id) ?? {
    id: `schale-${student.Id}`, studentId: student.Id, name: student.Name, image: studentIconUrl(student.Id), rarity: student.StarGrade,
    atkType: null, defType: null, cls: null, isNew: false, isLimited: false, translations: {},
  }) }));
  return banners.filter(banner => isLive(banner, now)).map(banner => ({ ...banner, source: 'firestore' }));
}

export function bannerStudentName(char: BannerCharacter, locale: Locale, byId: StudentIndex, displayName: (student: StudentIndex[number]) => string): string {
  return char.translations[locale] || (char.studentId && byId[char.studentId] ? displayName(byId[char.studentId]) : char.name);
}

/** Linked combat forms share one watch; show their first future recruitment once. */
export function watchedRecruitments(banners: readonly Banner[], ids: readonly number[], students: StudentIndex, now: number) {
  const upcoming = new Map<number, { id: number; banner: Banner; char: BannerCharacter }>();
  for (const banner of [...banners].sort((a, b) => a.startAt - b.startAt)) {
    if (banner.startAt <= now) continue;
    for (const char of banner.characters) {
      if (!char.studentId) continue;
      const student = students[char.studentId] ?? { Id: char.studentId };
      const unit = unitIdOf(student);
      if (!upcoming.has(unit) && watchesUnit(ids, student)) upcoming.set(unit, { id: char.studentId, banner, char });
    }
  }
  return [...upcoming.values()];
}
