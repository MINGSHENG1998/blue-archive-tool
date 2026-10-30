import { normalizeBanner } from "../normalize";
import {
  RECENT_WINDOW_MS,
  bannerMatches,
  bannerPhase,
  bannersForStudent,
  characterName,
  daysUntil,
  hasStudent,
  isLive,
  liveBanners,
  msUntil,
  nextChangeAt,
  selectBanners,
} from "../select";
import { DAY_MS } from "../time";
import type { Banner } from "../types";

const at = (iso: string) => Date.parse(iso);

function banner(
  id: string,
  startDate: string,
  endDate: string,
  students: { studentId?: number; name: string; translations?: object }[] = [],
): Banner {
  const b = normalizeBanner(id, {
    startDate,
    endDate,
    type: "New",
    characters: students.map((s, i) => ({ id: `${id}-c${i}`, ...s })),
  });
  if (!b) throw new Error(`fixture ${id} did not normalize`);
  return b;
}

// The real October-November 2026 Global rotation, every edge at 02:00 UTC.
const kisaki = banner("kisaki", "2026-10-13", "2026-10-27", [
  { studentId: 10098, name: "Kisaki (Swimsuit)" },
]);
const hikari = banner("hikari", "2026-10-27", "2026-11-03", [
  { studentId: 10101, name: "Hikari", translations: { ja: "ヒカリ" } },
  { studentId: 10102, name: "Nozomi", translations: { ja: { name: "ノゾミ" } } },
]);
const recollection = banner("recollection", "2026-10-27", "2026-11-03", [
  { studentId: 10101, name: "Hikari" },
]);
const next = banner("next", "2026-11-03", "2026-11-10", [
  { studentId: 20061, name: "Kasumi (Swimsuit)" },
]);
const old = banner("old", "2026-09-01", "2026-09-15");
const all = [next, old, hikari, kisaki, recollection];

describe("isLive / bannerPhase at the 02:00 UTC rotation", () => {
  it("is not live one millisecond before the start", () => {
    const t = at("2026-10-27T01:59:59.999Z");
    expect(isLive(hikari, t)).toBe(false);
    expect(bannerPhase(hikari, t)).toBe("upcoming");
    expect(isLive(kisaki, t)).toBe(true);
  });

  it("is live exactly at the start and over exactly at the end", () => {
    const rotation = at("2026-10-27T02:00:00.000Z");
    expect(isLive(hikari, rotation)).toBe(true);
    expect(isLive(kisaki, rotation)).toBe(false);
    expect(bannerPhase(kisaki, rotation)).toBe("ended");
    expect(bannerPhase(hikari, at("2026-11-03T02:00:00.000Z"))).toBe("ended");
  });

  it("is still live at 01:00 UTC on the end date (a midnight parse would say ended)", () => {
    expect(isLive(hikari, at("2026-11-03T01:00:00Z"))).toBe(true);
  });
});

describe("selectBanners", () => {
  it("picks live and next across the rotation instant", () => {
    const before = selectBanners(all, at("2026-10-27T01:59:59.999Z"));
    expect(before.live?.id).toBe("kisaki");
    expect(before.next?.id).toBe("hikari");

    const after = selectBanners(all, at("2026-10-27T02:00:00.000Z"));
    expect(after.live?.id).toBe("hikari");
    expect(after.next?.id).toBe("next");
    expect(after.recent.map((b) => b.id)).toEqual(["kisaki"]);
  });

  it("lists not-ended banners in timeline order regardless of input order", () => {
    const sel = selectBanners(all, at("2026-10-20T00:00:00Z"));
    expect(sel.banners.map((b) => b.id)).toEqual(["kisaki", "hikari", "recollection", "next"]);
  });

  it("picks the earliest-starting live banner when two overlap", () => {
    const sel = selectBanners(all, at("2026-10-30T00:00:00Z"));
    expect(sel.live?.id).toBe("hikari");
    expect(liveBanners(sel.banners, at("2026-10-30T00:00:00Z")).map((b) => b.id)).toEqual([
      "hikari",
      "recollection",
    ]);
  });

  it("keeps an ended banner in recent for 14 days, most recent first", () => {
    const t = at("2026-11-05T00:00:00Z");
    const sel = selectBanners(all, t);
    expect(sel.recent.map((b) => b.id)).toEqual(["hikari", "recollection", "kisaki"]);
    expect(sel.recent.some((b) => b.id === "old")).toBe(false);

    // Exactly 14 days after kisaki ended it drops out.
    const edge = kisaki.endAt + RECENT_WINDOW_MS;
    expect(selectBanners(all, edge - 1).recent.map((b) => b.id)).toContain("kisaki");
    expect(selectBanners(all, edge).recent.map((b) => b.id)).not.toContain("kisaki");
  });

  it("has no live banner in a gap and no next after the last one", () => {
    const gap = selectBanners([kisaki, next], at("2026-10-30T00:00:00Z"));
    expect(gap.live).toBeNull();
    expect(gap.next?.id).toBe("next");

    const end = selectBanners(all, at("2026-12-01T00:00:00Z"));
    expect(end.banners).toEqual([]);
    expect(end.live).toBeNull();
    expect(end.next).toBeNull();
  });

  it("handles an empty schedule", () => {
    expect(selectBanners([], Date.now())).toEqual({
      banners: [],
      recent: [],
      live: null,
      next: null,
    });
  });

  it("does not mutate its input", () => {
    const input = [...all];
    selectBanners(input, at("2026-10-20T00:00:00Z"));
    expect(input).toEqual(all);
  });
});

describe("nextChangeAt", () => {
  it("is the next start or end strictly after now", () => {
    expect(nextChangeAt(all, at("2026-10-20T00:00:00Z"))).toBe(at("2026-10-27T02:00:00Z"));
    expect(nextChangeAt(all, at("2026-10-27T02:00:00Z"))).toBe(at("2026-11-03T02:00:00Z"));
  });

  it("includes the moment an ended banner leaves recent", () => {
    expect(nextChangeAt([kisaki], at("2026-10-28T00:00:00Z"))).toBe(
      kisaki.endAt + RECENT_WINDOW_MS,
    );
  });

  it("is null when nothing is left to change", () => {
    expect(nextChangeAt([kisaki], kisaki.endAt + RECENT_WINDOW_MS)).toBeNull();
    expect(nextChangeAt([], 0)).toBeNull();
  });
});

describe("students", () => {
  it("finds banners by student id", () => {
    expect(hasStudent(hikari, 10102)).toBe(true);
    expect(hasStudent(hikari, 10098)).toBe(false);
    expect(bannersForStudent(all, 10101).map((b) => b.id)).toEqual(["hikari", "recollection"]);
    expect(bannersForStudent(all, 1)).toEqual([]);
  });
});

describe("countdown helpers", () => {
  it("msUntil never goes negative", () => {
    expect(msUntil(1000, 400)).toBe(600);
    expect(msUntil(1000, 5000)).toBe(0);
  });

  it("daysUntil rounds up, so the last 24 hours read D-1", () => {
    const start = hikari.startAt;
    expect(daysUntil(start, start - DAY_MS)).toBe(1);
    expect(daysUntil(start, start - DAY_MS - 1)).toBe(2);
    expect(daysUntil(start, start - 1)).toBe(1);
    expect(daysUntil(start, start)).toBe(0);
    expect(daysUntil(start, start + DAY_MS)).toBe(0);
  });
});

describe("names and search", () => {
  const [hikariChar, nozomiChar] = hikari.characters;

  it("uses the translation for the locale and falls back to the stored name", () => {
    expect(characterName(hikariChar, "en")).toBe("Hikari");
    expect(characterName(hikariChar, "ja")).toBe("ヒカリ");
    expect(characterName(hikariChar, "ko")).toBe("Hikari");
    expect(characterName(nozomiChar, "ja")).toBe("ノゾミ");
  });

  it("matches the English name and the translated one, case-insensitively", () => {
    expect(bannerMatches(hikari, "noz", "ja")).toBe(true);
    expect(bannerMatches(hikari, "ノゾミ", "ja")).toBe(true);
    expect(bannerMatches(hikari, "HIKARI", "en")).toBe(true);
    expect(bannerMatches(hikari, "kisaki", "en")).toBe(false);
    expect(bannerMatches(hikari, "   ", "en")).toBe(true);
  });
});
