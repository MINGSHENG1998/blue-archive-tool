import {
  MAX_WATCHLIST,
  normalizeWatchlist,
  setWatched,
  toggleWatched,
} from "../watchlist";

describe("normalizeWatchlist", () => {
  it("keeps unique positive ids in their original order", () => {
    expect(normalizeWatchlist([10101, "10102", 10101, -1, 0, 1.5, null, "x", 20061])).toEqual([
      10101, 10102, 20061,
    ]);
  });

  it.each([null, undefined, "10101", { 0: 10101 }, 42])("is [] for %p", (raw) => {
    expect(normalizeWatchlist(raw)).toEqual([]);
  });

  it("bounds a runaway list", () => {
    const many = Array.from({ length: MAX_WATCHLIST + 50 }, (_, i) => i + 1);
    expect(normalizeWatchlist(many)).toHaveLength(MAX_WATCHLIST);
  });
});

describe("setWatched / toggleWatched", () => {
  it("adds to the end and removes in place", () => {
    expect(setWatched([1, 2], 3, true)).toEqual([1, 2, 3]);
    expect(setWatched([1, 2, 3], 2, false)).toEqual([1, 3]);
  });

  it("returns the same array when nothing changes", () => {
    const ids = [1, 2];
    expect(setWatched(ids, 2, true)).toBe(ids);
    expect(setWatched(ids, 9, false)).toBe(ids);
    expect(setWatched(ids, -4, true)).toBe(ids);
  });

  it("toggles", () => {
    expect(toggleWatched([1], 1)).toEqual([]);
    expect(toggleWatched([], 1)).toEqual([1]);
  });

  it("stops adding at the cap", () => {
    const full = Array.from({ length: MAX_WATCHLIST }, (_, i) => i + 1);
    expect(setWatched(full, MAX_WATCHLIST + 1, true)).toBe(full);
  });
});
