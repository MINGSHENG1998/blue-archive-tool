import { normalizeAnnouncement, normalizeAppConfig } from "../normalize";
import {
  CHARGE_SYSTEM_FROM,
  activeAnnouncement,
  announcementText,
  configFlag,
  gachaSystemAt,
  isNewerVersion,
} from "../select";

const day = (iso: string) => Date.parse(`${iso}T02:00:00Z`);

describe("normalizeAppConfig", () => {
  it.each([null, undefined, "config", 42, [], [{ gachaSystem: "charge" }]])(
    "is {} for %p — an absent or broken doc means no overrides",
    (raw) => {
      expect(normalizeAppConfig(raw)).toEqual({});
    },
  );

  it("keeps every valid field", () => {
    expect(
      normalizeAppConfig({
        gachaSystem: "charge",
        gachaSystemFrom: "2026-11-10",
        announcement: {
          id: "maint-1103",
          en: "Maintenance on Nov 3",
          ja: "11月3日メンテナンス",
          ko: "11월 3일 점검",
          zh: "11月3日维护",
          url: "https://forum.nexon.com/bluearchive-en",
          until: "2026-11-03",
        },
        latestVersion: "2.0.1",
        flags: { plannerMileage: true, legacyHome: false },
        updatedAt: "2026-10-24T10:00:00Z",
      }),
    ).toEqual({
      gachaSystem: "charge",
      gachaSystemFrom: "2026-11-10",
      announcement: {
        id: "maint-1103",
        en: "Maintenance on Nov 3",
        ja: "11月3日メンテナンス",
        ko: "11월 3일 점검",
        zh: "11月3日维护",
        url: "https://forum.nexon.com/bluearchive-en",
        until: "2026-11-03",
      },
      latestVersion: "2.0.1",
      flags: { plannerMileage: true, legacyHome: false },
      updatedAt: "2026-10-24T10:00:00Z",
    });
  });

  it("drops each invalid field on its own and keeps the rest", () => {
    expect(
      normalizeAppConfig({
        gachaSystem: "Charge",
        gachaSystemFrom: "2026-02-30",
        latestVersion: "two point oh",
        flags: { ok: true, notBool: "true", "bad key!": true, num: 1 },
        updatedAt: 12345,
        unknownField: { anything: true },
      }),
    ).toEqual({ flags: { ok: true } });
  });

  it("rejects a gachaSystemFrom that is not a plain day", () => {
    expect(normalizeAppConfig({ gachaSystemFrom: "2026-11-10T02:00:00Z" })).toEqual({});
    expect(normalizeAppConfig({ gachaSystemFrom: 20261110 })).toEqual({});
  });

  it("drops a flags object with nothing usable in it", () => {
    expect(normalizeAppConfig({ flags: { a: "yes" } })).toEqual({});
    expect(normalizeAppConfig({ flags: [true] })).toEqual({});
  });

  it("renders a serverTimestamp() updatedAt as ISO", () => {
    const at = Date.UTC(2026, 9, 24, 10);
    expect(normalizeAppConfig({ updatedAt: { seconds: at / 1000, nanoseconds: 0 } })).toEqual({
      updatedAt: "2026-10-24T10:00:00.000Z",
    });
  });
});

describe("normalizeAnnouncement", () => {
  it("needs an id and English text", () => {
    expect(normalizeAnnouncement({ en: "Hello" })).toBeUndefined();
    expect(normalizeAnnouncement({ id: "a" })).toBeUndefined();
    expect(normalizeAnnouncement({ id: "a", en: "   " })).toBeUndefined();
    expect(normalizeAnnouncement("Hello")).toBeUndefined();
  });

  it("drops a non-http link but keeps the announcement", () => {
    expect(
      normalizeAnnouncement({ id: "a", en: "Hi", url: "javascript:alert(1)" }),
    ).toEqual({ id: "a", en: "Hi" });
  });

  it("drops the whole announcement when `until` is unparseable, so it cannot show forever", () => {
    expect(normalizeAnnouncement({ id: "a", en: "Hi", until: "next week" })).toBeUndefined();
    expect(normalizeAnnouncement({ id: "a", en: "Hi", until: "" })).toEqual({ id: "a", en: "Hi" });
  });

  it("ignores non-string translations", () => {
    expect(normalizeAnnouncement({ id: "a", en: "Hi", ja: 5, ko: null })).toEqual({
      id: "a",
      en: "Hi",
    });
  });

  it("keeps Vietnamese and Thai translations, additively", () => {
    expect(
      normalizeAnnouncement({
        id: "a",
        en: "Maintenance on Nov 3",
        vi: "Bảo trì ngày 3/11",
        th: "ปิดปรับปรุงวันที่ 3 พ.ย.",
        tw: "11月3日維護",
      }),
    ).toEqual({
      id: "a",
      en: "Maintenance on Nov 3",
      vi: "Bảo trì ngày 3/11",
      th: "ปิดปรับปรุงวันที่ 3 พ.ย.",
    });
    expect(normalizeAnnouncement({ id: "a", en: "Hi", vi: "", th: 3 })).toEqual({
      id: "a",
      en: "Hi",
    });
  });
});

describe("gachaSystemAt", () => {
  const switchAt = day(CHARGE_SYSTEM_FROM);

  it("defaults to spark before the Nov 10 2026 maintenance and charge from it on", () => {
    expect(CHARGE_SYSTEM_FROM).toBe("2026-11-10");
    expect(gachaSystemAt(day("2026-11-03"))).toBe("spark");
    expect(gachaSystemAt(switchAt - 1)).toBe("spark");
    expect(gachaSystemAt(switchAt)).toBe("charge");
    expect(gachaSystemAt(day("2027-01-12"))).toBe("charge");
  });

  it("moves the switch with gachaSystemFrom alone", () => {
    const config = { gachaSystemFrom: "2026-11-17" };
    expect(gachaSystemAt(switchAt, config)).toBe("spark");
    expect(gachaSystemAt(day("2026-11-17"), config)).toBe("charge");
  });

  it("forces one model everywhere with gachaSystem alone", () => {
    expect(gachaSystemAt(day("2027-01-12"), { gachaSystem: "spark" })).toBe("spark");
    expect(gachaSystemAt(day("2026-10-01"), { gachaSystem: "charge" })).toBe("charge");
  });

  it("uses gachaSystem from gachaSystemFrom on, the other model before", () => {
    const config = { gachaSystem: "charge" as const, gachaSystemFrom: "2026-12-01" };
    expect(gachaSystemAt(day("2026-11-24"), config)).toBe("spark");
    expect(gachaSystemAt(day("2026-12-01"), config)).toBe("charge");
  });
});

describe("activeAnnouncement", () => {
  const base = { id: "a", en: "Hi" };

  it("shows an announcement without an end date", () => {
    expect(activeAnnouncement({ announcement: base }, 0)).toBe(base);
  });

  it("hides it from `until` on", () => {
    const config = { announcement: { ...base, until: "2026-11-03" } };
    expect(activeAnnouncement(config, day("2026-11-03") - 1)).toBe(config.announcement);
    expect(activeAnnouncement(config, day("2026-11-03"))).toBeNull();
  });

  it("is null without one", () => {
    expect(activeAnnouncement({}, 0)).toBeNull();
  });
});

describe("announcementText", () => {
  it("uses the locale and falls back to English", () => {
    const a = { id: "a", en: "Hello", ja: "こんにちは" };
    expect(announcementText(a, "ja")).toBe("こんにちは");
    expect(announcementText(a, "ko")).toBe("Hello");
    expect(announcementText(a, "en")).toBe("Hello");
    expect(announcementText(a, "fr")).toBe("Hello");
  });

  it("reads vi and th, English when a doc predates them", () => {
    const a = { id: "a", en: "Hello", vi: "Xin chào", th: "สวัสดี" };
    expect(announcementText(a, "vi")).toBe("Xin chào");
    expect(announcementText(a, "th")).toBe("สวัสดี");
    expect(announcementText({ id: "b", en: "Hello" }, "th")).toBe("Hello");
    expect(announcementText({ id: "b", en: "Hello", vi: "" }, "vi")).toBe("Hello");
  });
});

describe("isNewerVersion", () => {
  it("compares numerically, segment by segment", () => {
    expect(isNewerVersion("2.0.10", "2.0.9")).toBe(true);
    expect(isNewerVersion("2.0.1", "2.0.1")).toBe(false);
    expect(isNewerVersion("2.0", "2.0.0")).toBe(false);
    expect(isNewerVersion("2.1", "2.0.9")).toBe(true);
    expect(isNewerVersion("1.9.9", "2.0.0")).toBe(false);
  });

  it("is false for anything it cannot read", () => {
    expect(isNewerVersion(undefined, "1.0.0")).toBe(false);
    expect(isNewerVersion("2.0.0", undefined)).toBe(false);
    expect(isNewerVersion("v2", "1.0.0")).toBe(false);
  });
});

describe("configFlag", () => {
  it("reads a flag or falls back", () => {
    expect(configFlag({ flags: { a: true } }, "a")).toBe(true);
    expect(configFlag({ flags: { a: false } }, "a", true)).toBe(false);
    expect(configFlag({}, "a", true)).toBe(true);
    expect(configFlag({}, "a")).toBe(false);
  });
});
