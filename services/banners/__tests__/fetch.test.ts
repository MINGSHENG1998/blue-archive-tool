import { collection, getDocs } from "firebase/firestore";

import { BannerFetchError, FETCH_TIMEOUT_MS, fetchBanners } from "../fetch";

// A test run must never touch Firestore.
jest.mock("firebase/firestore", () => ({
  collection: jest.fn((_db: unknown, name: string) => ({ name })),
  getDocs: jest.fn(),
}));
jest.mock("@/firebaseConfig", () => ({ db: {} }));

const mockGetDocs = getDocs as jest.Mock;

const snap = (docs: { id: string; data: unknown }[]) => ({
  docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
});

function serve(
  banners: { id: string; data: unknown }[],
  characters: { id: string; data: unknown }[] = [],
) {
  mockGetDocs.mockImplementation((ref: { name: string }) =>
    Promise.resolve(snap(ref.name === "banners" ? banners : characters)),
  );
}

describe("fetchBanners", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("reads both collections and joins characters on characterIds", async () => {
    serve(
      [
        {
          id: "b1",
          data: {
            startDate: "2026-10-27",
            endDate: "2026-11-03",
            type: "New",
            characterIds: ["c1"],
            characters: [],
          },
        },
      ],
      [{ id: "c1", data: { name: "Hikari", studentId: 10101, class: "Striker" } }],
    );
    const banners = await fetchBanners();
    expect(collection).toHaveBeenCalledWith({}, "banners");
    expect(collection).toHaveBeenCalledWith({}, "characters");
    expect(banners).toHaveLength(1);
    expect(banners[0].characters[0]).toMatchObject({
      id: "c1",
      name: "Hikari",
      studentId: 10101,
      cls: "striker",
    });
  });

  it("returns an empty schedule when the collection is empty", async () => {
    serve([]);
    await expect(fetchBanners()).resolves.toEqual([]);
  });

  it("skips a doc whose data() throws", async () => {
    mockGetDocs.mockImplementation((ref: { name: string }) =>
      Promise.resolve(
        ref.name === "banners"
          ? {
              docs: [
                {
                  id: "bad",
                  data: () => {
                    throw new Error("decode");
                  },
                },
                { id: "ok", data: () => ({ startDate: "2026-10-27", endDate: "2026-11-03" }) },
              ],
            }
          : { docs: "not an array" },
      ),
    );
    const banners = await fetchBanners();
    expect(banners.map((b) => b.id)).toEqual(["ok"]);
  });

  it("refuses a result where every doc is unreadable (schema drift), so the cache survives", async () => {
    serve([
      { id: "a", data: { start: "2026-10-27" } },
      { id: "b", data: null },
    ]);
    await expect(fetchBanners()).rejects.toMatchObject({ code: "schema" });
  });

  it("wraps a Firestore error with its code", async () => {
    mockGetDocs.mockRejectedValue(Object.assign(new Error("offline"), { code: "unavailable" }));
    const error = await fetchBanners().catch((e) => e);
    expect(error).toBeInstanceOf(BannerFetchError);
    expect(error).toMatchObject({ code: "network", message: "unavailable" });
  });

  it("gives up after FETCH_TIMEOUT_MS", async () => {
    jest.useFakeTimers();
    mockGetDocs.mockReturnValue(new Promise(() => {}));
    const pending = fetchBanners().catch((e) => e);
    jest.advanceTimersByTime(FETCH_TIMEOUT_MS + 1);
    const error = await pending;
    expect(error).toBeInstanceOf(BannerFetchError);
    expect(error.code).toBe("timeout");
  });
});
