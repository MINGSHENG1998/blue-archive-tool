import { DEFAULT_REMINDERS, planReminders, HORIZON_MS, APP_PREFIX, safeReminderRoute } from '../planner';
import { reconcileReminders } from '../reconcile';

const now = Date.parse('2026-10-28T00:00:00Z');
const base = { now, preferences: { ...DEFAULT_REMINDERS }, banners: [], students: [], watched: [], owned: [], fullAt: null };
test('disabled preferences produce no reminders', () => expect(planReminders(base)).toEqual([]));
test('watched banners start and last day use exact timestamps, stable ids and a strict horizon', () => {
  const input = { ...base, preferences: { ...DEFAULT_REMINDERS, bannerStart: true, bannerEnd: true }, watched: [1], banners: [
    { id: 'a', startAt: now + 1000, endAt: now + 86400000 + 2000, studentIds: [1] },
    { id: 'b', startAt: now + HORIZON_MS + 1, endAt: now + HORIZON_MS + 86400001, studentIds: [1] },
    { id: 'c', startAt: now + 1000, endAt: now + 86401000, studentIds: [2] },
  ] };
  const result = planReminders(input);
  expect(result.map(x => x.at)).toEqual([now + 1000, now + 2000]);
  expect(planReminders(input)).toEqual(result);
  expect(result.every(x => x.id.startsWith(APP_PREFIX))).toBe(true);
});
test('daily reset is 03:00 JST, one hour before 04:00 JST, for the next 14 days', () => {
  const result = planReminders({ ...base, preferences: { ...DEFAULT_REMINDERS, dailyReset: true } });
  expect(result).toHaveLength(14);
  expect(new Date(result[0].at).toISOString()).toBe('2026-10-28T18:00:00.000Z');
  expect(result.every(x => x.at > now && x.at <= now + HORIZON_MS)).toBe(true);
});

test.each([1, 2])('watching linked form %i includes both banner reminders for the other form', watchedId => {
  const students = [{ id: 1, name: 'A', birthday: '1/1', family: 2 }, { id: 2, name: 'A alt', birthday: '1/1', family: 1 }];
  const result = planReminders({ ...base, students, watched: [watchedId],
    preferences: { ...DEFAULT_REMINDERS, bannerStart: true, bannerEnd: true },
    banners: [{ id: 'linked', startAt: now + 1000, endAt: now + 86402000, studentIds: [watchedId === 1 ? 2 : 1] }],
  });
  expect(result.map(r => r.kind)).toEqual(['bannerStart', 'bannerEnd']);
});
test('birthdays use local 09:00, deduplicate forms, and respect watched/owned/all scope', () => {
  const localNow = new Date(2026, 11, 31, 23).getTime();
  const students = [{ id: 1, name: 'A', birthday: '1/1', family: 1 }, { id: 2, name: 'A alt', birthday: '1/1', family: 1 }, { id: 3, name: 'B', birthday: '1/2' }];
  const input = { ...base, now: localNow, students, owned: [2], preferences: { ...DEFAULT_REMINDERS, birthdays: true, birthdayScope: 'owned' as const } };
  expect(planReminders(input)).toHaveLength(1);
  expect(new Date(planReminders(input)[0].at).getHours()).toBe(9);
  expect(planReminders({ ...input, preferences: { ...input.preferences, birthdayScope: 'all' } })).toHaveLength(2);
});
test('AP full excludes now/past and enforces fifty pending limit sorted by time', () => {
  expect(planReminders({ ...base, fullAt: now, preferences: { ...DEFAULT_REMINDERS, apFull: true } })).toEqual([]);
  const students = Array.from({ length: 70 }, (_, i) => ({ id: i + 1, name: String(i), birthday: '10/29' }));
  const result = planReminders({ ...base, students, fullAt: now + 1, preferences: { ...DEFAULT_REMINDERS, apFull: true, birthdays: true, birthdayScope: 'all' } });
  expect(result).toHaveLength(50);
  expect(result[0].kind).toBe('apFull');
});
test('reciprocal linked forms share one birthday reminder when either form is owned', () => {
  const students = [{ id: 1, name: 'A', birthday: '10/29', family: 2 }, { id: 2, name: 'A alt', birthday: '10/29', family: 1 }];
  const input = { ...base, students, preferences: { ...DEFAULT_REMINDERS, birthdays: true, birthdayScope: 'owned' as const } };
  expect(planReminders({ ...input, owned: [1] })).toHaveLength(1);
  expect(planReminders({ ...input, owned: [2] })).toHaveLength(1);
  expect(planReminders({ ...input, preferences: { ...input.preferences, birthdayScope: 'all' } })).toHaveLength(1);
});
test('reconciliation is idempotent, cancels disabled app requests, and retains unrelated notifications', async () => {
  const wanted = planReminders({ ...base, fullAt: now + 1000, preferences: { ...DEFAULT_REMINDERS, apFull: true } });
  let pending: any[] = [{ id: 'another-app', signature: '' }];
  const driver = { list: async () => pending, cancel: jest.fn(async (id: string) => { pending = pending.filter(x => x.id !== id); }), schedule: jest.fn(async (x: any) => { pending.push(x); }) };
  await reconcileReminders(wanted, driver);
  await reconcileReminders(wanted, driver);
  expect(driver.schedule).toHaveBeenCalledTimes(1);
  await reconcileReminders([], driver);
  expect(pending.map(x => x.id)).toEqual(['another-app']);
});
test('scheduling failure is reported and retried on the next reconciliation', async () => {
  const wanted = planReminders({ ...base, fullAt: now + 1000, preferences: { ...DEFAULT_REMINDERS, apFull: true } });
  const driver = { list: async () => [], cancel: jest.fn(), schedule: jest.fn().mockRejectedValueOnce(new Error('system refused')).mockResolvedValue(undefined) };
  expect((await reconcileReminders(wanted, driver)).errors).toBe(1);
  expect((await reconcileReminders(wanted, driver)).errors).toBe(0);
});
test('only app-owned safe routes can be opened', () => {
  expect(safeReminderRoute(`${APP_PREFIX}a`, '/student/10001')).toBe('/student/10001');
  expect(safeReminderRoute(`${APP_PREFIX}a`, 'https://evil.test')).toBeNull();
  expect(safeReminderRoute('other', '/birthdays')).toBeNull();
});

test('unavailable banner data preserves enabled requests and reserves their pending capacity', async () => {
  const bannerId = `${APP_PREFIX}bannerStart:cached`;
  let pending = [{id:bannerId,signature:'cached'}];
  const wanted = Array.from({length:50},(_,i)=>({id:`${APP_PREFIX}birthdays:${i}`,signature:String(i),kind:'birthdays' as const,route:'/birthdays',name:'',at:now+i+1}));
  const driver = {list:async()=>pending,cancel:jest.fn(async(id:string)=>{pending=pending.filter(r=>r.id!==id);}),schedule:jest.fn(async(r:any)=>{pending.push(r);})};
  const result=await reconcileReminders(wanted,driver,['bannerStart']);
  expect(driver.cancel).not.toHaveBeenCalled();
  expect(result.scheduled).toBe(50);
  expect(driver.schedule).toHaveBeenCalledTimes(49);
  await reconcileReminders([],driver);
  expect(pending).toEqual([]);
});
