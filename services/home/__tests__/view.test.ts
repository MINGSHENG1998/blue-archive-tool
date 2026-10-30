import { homeStrings } from '@/constants/strings/home';
import { normalizeBanner } from '@/services/banners/normalize';
import type { GameConfig, GameStudent } from '@/services/gamedata/types';
import { bannerStudentName, greetingKey, localDuration, recruitmentView, watchedRecruitments } from '../view';

const now = Date.parse('2026-10-28T00:00:00Z');
const makeConfig = (windows: { start: number; end: number; characters: number[] }[]) => ({ regions: [{}, { CurrentGacha: windows }] }) as GameConfig;
const student = { Id: 1, Name: 'Hikari', StarGrade: 3 } as GameStudent;
const byId = { 1: student };
const banner = normalizeBanner('curated', { startDate: '2026-10-27', endDate: '2026-11-03', type: 'New', characters: [{ id: 'hikari', studentId: 1, name: 'Editorial Hikari', image: 'https://example.com/1.webp' }] })!;

describe('Lobby live view', () => {
  it('uses SchaleDB windows and enriches the same student with editorial fields', () => {
    const config = makeConfig([{ start: now / 1000 - 50, end: now / 1000 + 3600, characters: [1] }]);
    const result = recruitmentView(config, byId, [banner], now);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ source: 'schaledb', endAt: now + 3600000 });
    expect(result[0].characters[0].name).toBe('Editorial Hikari');
    expect(result[0].endAt).not.toBe(banner.endAt);
  });
  it('renders SchaleDB even without any Firestore schedule', () => {
    const result = recruitmentView(makeConfig([{ start: now / 1000 - 1, end: now / 1000 + 10, characters: [1] }]), byId, [], now);
    expect(result[0].characters[0]).toMatchObject({ name: 'Hikari', studentId: 1 });
  });
  it('ignores not-yet-started SchaleDB windows and falls back to a live curated banner', () => {
    const result = recruitmentView(makeConfig([{ start: now / 1000 + 1, end: now / 1000 + 100, characters: [1] }]), byId, [banner], now);
    expect(result[0]).toMatchObject({ source: 'firestore', startAt: banner.startAt });
  });
  it('never keeps an ended window alive and does not use an upcoming curated banner as live', () => {
    const future = { ...banner, startAt: now + 1000, endAt: now + 10000 };
    expect(recruitmentView(makeConfig([{ start: now / 1000 - 100, end: now / 1000, characters: [1] }]), byId, [future], now)).toEqual([]);
  });
  it('takes localized editorial names before facts, then falls back to student facts', () => {
    const char = banner.characters[0];
    expect(bannerStudentName({ ...char, translations: { ja: 'ヒカリ' } }, 'ja', byId, () => 'Localized')).toBe('ヒカリ');
    expect(bannerStudentName(char, 'ja', byId, () => 'Localized')).toBe('Localized');
    expect(bannerStudentName(char, 'ja', {}, () => 'Unused')).toBe('Editorial Hikari');
  });
});

describe('Lobby time copy', () => {
  it.each([
    ['2026-10-27T20:00:00Z', 'morning'],
    ['2026-10-28T03:00:00Z', 'afternoon'],
    ['2026-10-28T09:00:00Z', 'evening'],
    ['2026-10-28T14:00:00Z', 'night'],
  ])('greets by JST at %s', (instant, expected) => expect(greetingKey(Date.parse(instant))).toBe(expected));
  it('localizes duration units and uses bounded non-negative time', () => {
    expect(localDuration(90000, homeStrings.en)).toBe('1d 1h');
    expect(localDuration(3660, homeStrings.ja)).toBe('1時間1分');
    expect(localDuration(60, homeStrings.ko)).toBe('1분');
    expect(localDuration(-1, homeStrings.zh)).toBe('不足1分钟');
  });
});

it('finds the earliest upcoming recruitment for a watched linked unit once', () => {
  const linked = { 1: { ...student, LinkedCharacterId: 2 }, 2: { ...student, Id: 2, LinkedCharacterId: 1 } };
  const later = { ...banner, id: 'later', startAt: now + 2000 };
  const sooner = { ...banner, id: 'sooner', startAt: now + 1000 };
  const result = watchedRecruitments([later, banner, sooner], [1, 2], linked, now);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ id: 1, banner: { id: 'sooner' } });
  expect(watchedRecruitments([sooner], [2], linked, now)).toHaveLength(1);
});
