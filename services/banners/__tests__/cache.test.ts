import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  BANNERS_CACHE_KEY,
  readBannersCache,
  reviveBannersCache,
  writeBannersCache,
} from "../cache";
import { normalizeBanner } from "../normalize";
import type { Banner } from "../types";

// The AsyncStorage mock's methods are jest.fn()s already, so jest.spyOn hands
// back the same mock and restoreAllMocks cannot undo a mockRejectedValue.
// Reinstall the mock's own implementations before every test instead.
const storageMock = AsyncStorage as unknown as Record<
  "getItem" | "setItem" | "removeItem",
  jest.Mock
>;
const storageImpl = {
  getItem: storageMock.getItem.getMockImplementation(),
  setItem: storageMock.setItem.getMockImplementation(),
  removeItem: storageMock.removeItem.getMockImplementation(),
};
function resetStorageMock() {
  for (const name of ["getItem", "setItem", "removeItem"] as const) {
    storageMock[name].mockReset().mockImplementation(storageImpl[name]);
  }
}

const make = (id: string, start: string, end: string): Banner =>
  normalizeBanner(id, {
    startDate: start,
    endDate: end,
    type: "Fes",
    characters: [
      {
        id: `${id}-c`,
        studentId: 10101,
        name: "Hikari",
        class: "Striker",
        translations: { ja: { name: "ヒカリ" } },
      },
    ],
  })!;

const banners = [
  make("b1", "2026-10-27", "2026-11-03"),
  make("b2", "2026-11-03", "2026-11-10"),
];

describe("banners cache", () => {
  beforeEach(async () => {
    resetStorageMock();
    await AsyncStorage.clear();
  });

  it("round-trips the last good result with its fetch time", async () => {
    await writeBannersCache(banners, 1_793_000_000_000);
    expect(await readBannersCache()).toEqual({
      banners,
      fetchedAt: 1_793_000_000_000,
    });
  });

  it("writes under banners:v1", async () => {
    await writeBannersCache(banners, 5);
    expect(await AsyncStorage.getItem(BANNERS_CACHE_KEY)).toContain('"b1"');
  });

  it("is null when nothing was cached", async () => {
    expect(await readBannersCache()).toBeNull();
  });

  it("is null for a corrupt value", async () => {
    await AsyncStorage.setItem(BANNERS_CACHE_KEY, "{not json");
    expect(await readBannersCache()).toBeNull();
  });

  it("is null when storage itself fails", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValue(new Error("disk"));
    expect(await readBannersCache()).toBeNull();
  });

  it("resolves false instead of throwing when a write fails", async () => {
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValue(new Error("full"));
    await expect(writeBannersCache(banners, 1)).resolves.toBe(false);
  });
});

describe("reviveBannersCache", () => {
  it.each([
    null,
    "banners",
    [],
    {},
    { banners: "nope", fetchedAt: 1 },
    { banners: [], fetchedAt: "yesterday" },
    { banners: [], fetchedAt: -1 },
    { banners: [], fetchedAt: Infinity },
  ])("rejects %p", (raw) => {
    expect(reviveBannersCache(raw)).toBeNull();
  });

  it("re-validates entries written by an older version, dropping the bad ones", () => {
    const stored = JSON.parse(JSON.stringify({ fetchedAt: 9, banners }));
    stored.banners.push(null, { id: "x" }, { ...stored.banners[0] });
    stored.banners.unshift({ ...stored.banners[1], startDate: "never" });
    const revived = reviveBannersCache(stored);
    expect(revived?.banners.map((b) => b.id)).toEqual(["b1", "b2"]);
  });

  it("accepts an empty schedule", () => {
    expect(reviveBannersCache({ banners: [], fetchedAt: 3 })).toEqual({
      banners: [],
      fetchedAt: 3,
    });
  });
});
