import {
  GLOBAL_ROTATION_UTC_HOUR,
  parseInstant,
  parseScheduleString,
  toScheduleField,
  utcDayKey,
} from "../time";

const rotation = (y: number, m: number, d: number) =>
  Date.UTC(y, m - 1, d, GLOBAL_ROTATION_UTC_HOUR);

describe("parseScheduleString", () => {
  it("reads a date-only value as 02:00 UTC (11:00 JST) that day", () => {
    expect(parseScheduleString("2026-10-27")).toBe(rotation(2026, 10, 27));
    expect(new Date(parseScheduleString("2026-10-27")!).toISOString()).toBe(
      "2026-10-27T02:00:00.000Z",
    );
  });

  it("tolerates surrounding whitespace", () => {
    expect(parseScheduleString("  2026-11-03\n")).toBe(rotation(2026, 11, 3));
  });

  it("respects a full ISO instant as-is, whatever its offset", () => {
    const expected = rotation(2026, 10, 27);
    expect(parseScheduleString("2026-10-27T02:00:00Z")).toBe(expected);
    expect(parseScheduleString("2026-10-27T02:00:00.000Z")).toBe(expected);
    expect(parseScheduleString("2026-10-27T11:00:00+09:00")).toBe(expected);
    expect(parseScheduleString("2026-10-27T11:00+0900")).toBe(expected);
    expect(parseScheduleString("2026-10-26T21:00:00-05:00")).toBe(expected);
    expect(parseScheduleString("2026-10-27 02:00")).toBe(expected);
  });

  it("reads a zoneless date-time as UTC, never device-local", () => {
    expect(parseScheduleString("2026-10-27T02:00:00")).toBe(rotation(2026, 10, 27));
  });

  it("keeps milliseconds and ignores extra fractional precision", () => {
    expect(parseScheduleString("2026-10-27T02:00:00.123Z")).toBe(
      rotation(2026, 10, 27) + 123,
    );
    expect(parseScheduleString("2026-10-27T02:00:00.5Z")).toBe(
      rotation(2026, 10, 27) + 500,
    );
    expect(parseScheduleString("2026-10-27T02:00:00.123456789Z")).toBe(
      rotation(2026, 10, 27) + 123,
    );
  });

  it.each([
    "",
    "   ",
    "garbage",
    "2026-02-30",
    "2026-13-01",
    "2026-00-10",
    "2026-10-32",
    "2026-1-5",
    "27/10/2026",
    "Oct 27, 2026",
    "2026-10-27T25:00:00Z",
    "2026-10-27T02:60Z",
    "2026-10-27T02:00:00+25:00",
    "2026-10-27T02:00:00 PST",
    "0001-01-01",
    "9999-12-31",
    "1776-07-04",
  ])("rejects %j", (value) => {
    expect(parseScheduleString(value)).toBeNull();
  });

  it("accepts a real leap day and rejects a fake one", () => {
    expect(parseScheduleString("2028-02-29")).toBe(rotation(2028, 2, 29));
    expect(parseScheduleString("2027-02-29")).toBeNull();
  });
});

describe("parseInstant", () => {
  const at = rotation(2026, 10, 27);

  it("accepts a Firestore Timestamp and its JSON form", () => {
    expect(parseInstant({ toMillis: () => at, seconds: 0 })).toBe(at);
    expect(parseInstant({ seconds: at / 1000, nanoseconds: 0 })).toBe(at);
  });

  it("survives a Timestamp whose toMillis throws", () => {
    expect(
      parseInstant({
        toMillis: () => {
          throw new Error("boom");
        },
      }),
    ).toBeNull();
  });

  it("accepts a valid Date and rejects an invalid one", () => {
    expect(parseInstant(new Date(at))).toBe(at);
    expect(parseInstant(new Date("nope"))).toBeNull();
  });

  it.each([null, undefined, 0, at, NaN, true, [], {}, ["2026-10-27"], { seconds: "1" }])(
    "rejects %p",
    (value) => {
      expect(parseInstant(value)).toBeNull();
    },
  );

  it("rejects out-of-range timestamps (seconds read as ms and the like)", () => {
    expect(parseInstant({ seconds: at })).toBeNull();
    expect(parseInstant({ toMillis: () => at / 1000 })).toBeNull();
  });
});

describe("toScheduleField", () => {
  it("keeps the stored string, trimmed", () => {
    expect(toScheduleField(" 2026-10-27 ")).toEqual({
      text: "2026-10-27",
      at: rotation(2026, 10, 27),
    });
  });

  it("renders a Timestamp as ISO so the field stays a string", () => {
    const at = rotation(2026, 10, 27);
    expect(toScheduleField({ seconds: at / 1000 })).toEqual({
      text: "2026-10-27T02:00:00.000Z",
      at,
    });
  });

  it("is null for unusable values", () => {
    expect(toScheduleField("someday")).toBeNull();
    expect(toScheduleField(undefined)).toBeNull();
  });
});

describe("utcDayKey", () => {
  it("is the UTC calendar day", () => {
    expect(utcDayKey(rotation(2026, 10, 27))).toBe("2026-10-27");
    expect(utcDayKey(Date.UTC(2026, 9, 27, 23, 59))).toBe("2026-10-27");
  });
});
