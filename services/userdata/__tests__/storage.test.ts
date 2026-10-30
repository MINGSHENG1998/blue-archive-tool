import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createJsonStore,
  createSerialWriter,
  readJson,
  removeKey,
  writeJson,
} from "../storage";

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

describe("readJson / writeJson", () => {
  beforeEach(async () => {
    resetStorageMock();
    await AsyncStorage.clear();
  });

  it("tells missing, corrupt and unavailable apart", async () => {
    expect(await readJson("k")).toEqual({ kind: "missing" });

    await AsyncStorage.setItem("k", "{oops");
    expect(await readJson("k")).toEqual({ kind: "corrupt" });

    await writeJson("k", { a: 1 });
    expect(await readJson("k")).toEqual({ kind: "value", value: { a: 1 } });

    jest.spyOn(AsyncStorage, "getItem").mockRejectedValue(new Error("disk"));
    expect(await readJson("k")).toEqual({ kind: "unavailable" });
  });

  it("retries a failed read once (cold-start native hiccup)", async () => {
    await writeJson("k", [1, 2]);
    const spy = jest
      .spyOn(AsyncStorage, "getItem")
      .mockRejectedValueOnce(new Error("not ready"));
    expect(await readJson("k")).toEqual({ kind: "value", value: [1, 2] });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("resolves false instead of throwing on write and remove failures", async () => {
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValue(new Error("full"));
    jest.spyOn(AsyncStorage, "removeItem").mockRejectedValue(new Error("full"));
    await expect(writeJson("k", 1)).resolves.toBe(false);
    await expect(removeKey("k")).resolves.toBe(false);
  });

  it("does not throw on values JSON cannot represent", async () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    await expect(writeJson("k", cyclic)).resolves.toBe(false);
  });
});

describe("createJsonStore", () => {
  const normalize = (raw: unknown) =>
    Array.isArray(raw) ? raw.filter((x): x is number => typeof x === "number") : [];
  const store = createJsonStore<number[]>("store:test", normalize, () => []);

  beforeEach(async () => {
    resetStorageMock();
    await AsyncStorage.clear();
  });

  it("normalizes what it loads", async () => {
    await AsyncStorage.setItem("store:test", JSON.stringify([1, "two", 3]));
    expect(await store.load()).toEqual({ value: [1, 3], writable: true });
  });

  it("is writable over a missing or corrupt key", async () => {
    expect(await store.load()).toEqual({ value: [], writable: true });
    await AsyncStorage.setItem("store:test", "nope{");
    expect(await store.load()).toEqual({ value: [], writable: true });
  });

  it("is NOT writable when the read failed, so a hidden good value is never clobbered", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValue(new Error("disk"));
    expect(await store.load()).toEqual({ value: [], writable: false });
  });

  it("falls back when the normalizer itself throws", async () => {
    const throwing = createJsonStore<number[]>(
      "store:test",
      () => {
        throw new Error("bug");
      },
      () => [9],
    );
    await AsyncStorage.setItem("store:test", "[1]");
    expect(await throwing.load()).toEqual({ value: [9], writable: true });
  });

  it("hands out a fresh fallback every time", () => {
    expect(store.fallback()).not.toBe(store.fallback());
  });
});

describe("createSerialWriter", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("coalesces a burst into one write of the latest value", async () => {
    const save = jest.fn().mockResolvedValue(true);
    const writer = createSerialWriter<number>(save, 300);
    writer.schedule(1);
    writer.schedule(2);
    writer.schedule(3);
    expect(save).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);
    await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(3);
  });

  it("never runs two saves at once, and the last value wins", async () => {
    const order: string[] = [];
    let release: (() => void) | null = null;
    const save = jest.fn(
      (value: number) =>
        new Promise<void>((resolve) => {
          order.push(`start ${value}`);
          release = () => {
            order.push(`end ${value}`);
            resolve();
          };
        }),
    );
    const writer = createSerialWriter<number>(save, 10);

    writer.schedule(1);
    jest.advanceTimersByTime(10);
    await Promise.resolve();
    expect(order).toEqual(["start 1"]);

    // Queued while the first write is still in flight.
    writer.schedule(2);
    jest.advanceTimersByTime(10);
    await Promise.resolve();
    expect(order).toEqual(["start 1"]);

    release!();
    await Promise.resolve();
    await Promise.resolve();
    expect(order).toEqual(["start 1", "end 1", "start 2"]);
    release!();
    await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(2);
  });

  it("flush writes immediately; cancel drops the queue", async () => {
    const save = jest.fn().mockResolvedValue(true);
    const writer = createSerialWriter<string>(save, 1000);
    writer.schedule("a");
    await writer.flush();
    expect(save).toHaveBeenCalledWith("a");

    writer.schedule("b");
    writer.cancel();
    jest.advanceTimersByTime(1000);
    await writer.flush();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("keeps going after a save that throws", async () => {
    const save = jest
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValue(true);
    const writer = createSerialWriter<number>(save, 1);
    writer.schedule(1);
    await writer.flush();
    writer.schedule(2);
    await writer.flush();
    expect(save).toHaveBeenLastCalledWith(2);
  });
});
