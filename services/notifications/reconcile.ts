import { APP_PREFIX, MAX_PENDING, type PlannedReminder, type ReminderKind } from './planner';
export interface ReminderDriver {
  list(): Promise<{ id: string; signature: string }[]>;
  cancel(id: string): Promise<void>;
  schedule(reminder: PlannedReminder): Promise<void>;
}
/** Serialize callers outside this function. Failed work is retried next pass. */
export async function reconcileReminders(wanted: PlannedReminder[], driver: ReminderDriver, preserveKinds: readonly ReminderKind[] = []): Promise<{ scheduled: number; errors: number }> {
  const pending = await driver.list();
  // Missing schedule data is not an empty schedule. Keep its existing reminders
  // until usable data arrives; an explicit disable passes no preserved kind.
  const preserved = new Set(pending.filter(r => preserveKinds.some(kind => r.id.startsWith(`${APP_PREFIX}${kind}:`))).map(r => r.id));
  wanted = wanted.filter(r => !preserved.has(r.id)).slice(0, Math.max(0, MAX_PENDING - preserved.size));
  const desired = new Map(wanted.map(x => [x.id, x]));
  const keep = new Set<string>();
  let errors = 0;
  for (const request of pending) {
    if (!request.id.startsWith(APP_PREFIX)) continue;
    if (preserved.has(request.id)) { keep.add(request.id); continue; }
    if (desired.get(request.id)?.signature === request.signature) { keep.add(request.id); continue; }
    try { await driver.cancel(request.id); } catch { errors++; keep.add(request.id); }
  }
  let scheduled = keep.size;
  for (const reminder of wanted) {
    if (keep.has(reminder.id)) continue;
    // Failed cancellations still occupy OS slots. Never add beyond the cap.
    if (scheduled >= MAX_PENDING) break;
    try { await driver.schedule(reminder); scheduled++; } catch { errors++; }
  }
  return { scheduled, errors };
}
