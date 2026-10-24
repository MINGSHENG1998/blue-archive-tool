// In-game reset timers.
//
// Blue Archive anchors every recurring reset to JST wall-clock time on all
// servers, so these are the same numbers for every player. JST has never
// observed daylight saving, which is why plain offset arithmetic is safe here
// and no timezone library is needed.
//
// Verified against joexyz's ba-tools (MIT), which the community already
// cross-checks against the game.

export const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** Daily reset: once a day at 04:00 JST. */
export const DAILY_RESET = { intervalHours: 24, anchorHourJst: 4 } as const;
/** Cafe visitors reroll twice a day, at 04:00 and 16:00 JST. */
export const CAFE_RESET = { intervalHours: 12, anchorHourJst: 4 } as const;
/** Cafe headpat charge returns every 3 hours from 01:00 JST. */
export const HEADPAT_RESET = { intervalHours: 3, anchorHourJst: 1 } as const;

export interface ResetSchedule {
  intervalHours: number;
  anchorHourJst: number;
}

/**
 * Start of the interval that `now` falls inside.
 *
 * Works entirely in milliseconds against the JST wall clock rather than with
 * calendar arithmetic, so month ends, year ends and leap days need no special
 * handling.
 */
export function currentBoundary(schedule: ResetSchedule, now: Date): Date {
  const period = schedule.intervalHours * HOUR_MS;
  const jstNow = now.getTime() + JST_OFFSET_MS;
  const anchor = schedule.anchorHourJst * HOUR_MS;
  const elapsed = (((jstNow - anchor) % period) + period) % period;
  return new Date(jstNow - elapsed - JST_OFFSET_MS);
}

/**
 * The next time this reset fires. Exactly on a boundary this returns the
 * following one, never zero — a countdown reading 00:00:00 for a whole second
 * looks broken.
 */
export function nextBoundary(schedule: ResetSchedule, now: Date): Date {
  const period = schedule.intervalHours * HOUR_MS;
  return new Date(currentBoundary(schedule, now).getTime() + period);
}

export const nextDailyReset = (now: Date) => nextBoundary(DAILY_RESET, now);
export const nextCafeReset = (now: Date) => nextBoundary(CAFE_RESET, now);
export const nextHeadpatReset = (now: Date) => nextBoundary(HEADPAT_RESET, now);

/**
 * Identifier for the current in-game day: the epoch seconds of the daily reset
 * that started it. Anything "of the day" seeds off this rather than the local
 * calendar date, so it turns over with the game (04:00 JST) and every player
 * sees the same thing at the same moment regardless of device timezone.
 */
export function gameDayStamp(now: Date): number {
  return Math.floor(currentBoundary(DAILY_RESET, now).getTime() / 1000);
}

export interface Countdown {
  hours: number;
  minutes: number;
  seconds: number;
  /** Total whole seconds remaining; 0 once the target has passed. */
  totalSeconds: number;
}

export function countdownTo(target: Date, now: Date): Countdown {
  const totalSeconds = Math.max(
    0,
    Math.floor((target.getTime() - now.getTime()) / 1000),
  );
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** "HH:MM:SS", with hours allowed to exceed two digits. */
export function formatCountdown(countdown: Countdown): string {
  return `${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`;
}

/**
 * Coarse "time left" for spans measured in days rather than seconds, e.g.
 * "3d 4h", "4h 12m", "12m", "<1m". Two units is the most that stays readable
 * on a banner card, and seconds are noise at this scale.
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0m";
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return minutes > 0 ? `${minutes}m` : "<1m";
}

/** Seconds left until a unix-seconds timestamp, clamped at zero. */
export function secondsUntil(unixSeconds: number, now: Date): number {
  return Math.max(0, Math.floor(unixSeconds - now.getTime() / 1000));
}
