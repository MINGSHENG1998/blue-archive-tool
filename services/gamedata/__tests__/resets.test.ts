import {
  CAFE_RESET,
  DAILY_RESET,
  HEADPAT_RESET,
  countdownTo,
  currentBoundary,
  formatCountdown,
  formatDuration,
  gameDayStamp,
  nextCafeReset,
  nextDailyReset,
  nextHeadpatReset,
  secondsUntil,
} from "../resets";

/** JST is UTC+9, so 04:00 JST is 19:00 UTC the previous day. */
const utc = (iso: string) => new Date(iso);

describe("daily reset", () => {
  it("lands on 19:00 UTC — 04:00 JST", () => {
    expect(nextDailyReset(utc("2026-08-26T12:00:00Z")).toISOString()).toBe(
      "2026-08-26T19:00:00.000Z",
    );
  });

  it("rolls to the next day once the reset has passed", () => {
    expect(nextDailyReset(utc("2026-08-26T19:00:01Z")).toISOString()).toBe(
      "2026-08-27T19:00:00.000Z",
    );
  });

  it("never returns the boundary it is standing on", () => {
    const onTheDot = utc("2026-08-26T19:00:00Z");
    expect(nextDailyReset(onTheDot).getTime()).toBeGreaterThan(
      onTheDot.getTime(),
    );
  });

  it("crosses a month end", () => {
    expect(nextDailyReset(utc("2026-08-31T20:00:00Z")).toISOString()).toBe(
      "2026-09-01T19:00:00.000Z",
    );
  });

  it("crosses a year end", () => {
    expect(nextDailyReset(utc("2026-12-31T20:00:00Z")).toISOString()).toBe(
      "2027-01-01T19:00:00.000Z",
    );
  });

  it("crosses a leap day", () => {
    expect(nextDailyReset(utc("2028-02-28T20:00:00Z")).toISOString()).toBe(
      "2028-02-29T19:00:00.000Z",
    );
  });
});

describe("cafe reset", () => {
  it("fires at 04:00 and 16:00 JST — 19:00 and 07:00 UTC", () => {
    expect(nextCafeReset(utc("2026-08-26T00:00:00Z")).toISOString()).toBe(
      "2026-08-26T07:00:00.000Z",
    );
    expect(nextCafeReset(utc("2026-08-26T08:00:00Z")).toISOString()).toBe(
      "2026-08-26T19:00:00.000Z",
    );
  });

  it("shares its anchor with the daily reset", () => {
    const now = utc("2026-08-26T12:00:00Z");
    expect(nextCafeReset(now).getTime()).toBe(nextDailyReset(now).getTime());
  });
});

describe("headpat reset", () => {
  it("fires every three hours from 01:00 JST — 16:00 UTC", () => {
    // 01:00 JST = 16:00 UTC, so boundaries are 16:00, 19:00, 22:00, 01:00…
    expect(nextHeadpatReset(utc("2026-08-26T16:30:00Z")).toISOString()).toBe(
      "2026-08-26T19:00:00.000Z",
    );
    expect(nextHeadpatReset(utc("2026-08-26T23:30:00Z")).toISOString()).toBe(
      "2026-08-27T01:00:00.000Z",
    );
  });

  it("is always within three hours", () => {
    for (let minute = 0; minute < 24 * 60; minute += 7) {
      const now = new Date(Date.UTC(2026, 7, 26) + minute * 60_000);
      const delta = nextHeadpatReset(now).getTime() - now.getTime();
      expect(delta).toBeGreaterThan(0);
      expect(delta).toBeLessThanOrEqual(3 * 60 * 60 * 1000);
    }
  });
});

describe("currentBoundary", () => {
  it("is the interval start, and next is exactly one period later", () => {
    for (const schedule of [DAILY_RESET, CAFE_RESET, HEADPAT_RESET]) {
      const now = utc("2026-08-26T12:34:56Z");
      const start = currentBoundary(schedule, now);
      expect(start.getTime()).toBeLessThanOrEqual(now.getTime());
      const period = schedule.intervalHours * 3_600_000;
      expect(now.getTime() - start.getTime()).toBeLessThan(period);
    }
  });
});

describe("gameDayStamp", () => {
  it("is constant across one in-game day", () => {
    const justAfter = gameDayStamp(utc("2026-08-26T19:00:01Z"));
    const justBefore = gameDayStamp(utc("2026-08-27T18:59:59Z"));
    expect(justAfter).toBe(justBefore);
  });

  it("changes at the reset, not at local midnight", () => {
    const beforeReset = gameDayStamp(utc("2026-08-26T18:59:59Z"));
    const afterReset = gameDayStamp(utc("2026-08-26T19:00:00Z"));
    expect(afterReset).not.toBe(beforeReset);

    const acrossUtcMidnight = gameDayStamp(utc("2026-08-27T00:00:00Z"));
    expect(acrossUtcMidnight).toBe(afterReset);
  });
});

describe("countdownTo", () => {
  it("splits the remaining time", () => {
    const now = utc("2026-08-26T12:00:00Z");
    const target = utc("2026-08-26T14:30:45Z");
    expect(countdownTo(target, now)).toEqual({
      hours: 2,
      minutes: 30,
      seconds: 45,
      totalSeconds: 9045,
    });
  });

  it("clamps a past target to zero instead of going negative", () => {
    const now = utc("2026-08-26T12:00:00Z");
    expect(countdownTo(utc("2026-08-26T11:00:00Z"), now).totalSeconds).toBe(0);
  });

  it("formats with two-digit padding", () => {
    expect(
      formatCountdown({ hours: 1, minutes: 2, seconds: 3, totalSeconds: 3723 }),
    ).toBe("01:02:03");
    expect(
      formatCountdown({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 }),
    ).toBe("00:00:00");
  });
});

describe("formatDuration", () => {
  it("shows at most two units, coarsest first", () => {
    expect(formatDuration(3 * 86_400 + 4 * 3600 + 30 * 60)).toBe("3d 4h");
    expect(formatDuration(3 * 86_400)).toBe("3d");
    expect(formatDuration(4 * 3600 + 12 * 60)).toBe("4h 12m");
    expect(formatDuration(4 * 3600)).toBe("4h");
    expect(formatDuration(12 * 60)).toBe("12m");
  });

  it("never renders an empty or negative span", () => {
    expect(formatDuration(30)).toBe("<1m");
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(-100)).toBe("0m");
  });
});

describe("secondsUntil", () => {
  it("counts down to a unix-seconds timestamp", () => {
    const now = new Date("2026-08-26T12:00:00Z");
    expect(secondsUntil(Math.floor(now.getTime() / 1000) + 90, now)).toBe(90);
  });

  it("clamps a past timestamp to zero", () => {
    const now = new Date("2026-08-26T12:00:00Z");
    expect(secondsUntil(Math.floor(now.getTime() / 1000) - 90, now)).toBe(0);
  });
});
