import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";

import {
  APP_CONFIG_CACHE_KEY,
  readAppConfigCache,
  reviveAppConfigCache,
  writeAppConfigCache,
} from "../cache";
import { fetchAppConfig } from "../fetch";

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db: unknown, ...path: string[]) => ({ path: path.join("/") })),
  getDoc: jest.fn(),
}));
jest.mock("@/firebaseConfig", () => ({ db: {} }));

const mockGetDoc = getDoc as jest.Mock;

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

describe("fetchAppConfig", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reads appConfig/app", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ gachaSystem: "charge" }) });
    await expect(fetchAppConfig()).resolves.toEqual({ gachaSystem: "charge" });
    expect(doc).toHaveBeenCalledWith({}, "appConfig", "app");
  });

  it("treats a doc that does not exist yet as no overrides, not an error", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => undefined });
    await expect(fetchAppConfig()).resolves.toEqual({});
  });

  it("normalizes hostile data", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ gachaSystem: 1, announcement: "hello", flags: null }),
    });
    await expect(fetchAppConfig()).resolves.toEqual({});
  });

  it("survives data() throwing", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => {
        throw new Error("decode");
      },
    });
    await expect(fetchAppConfig()).resolves.toEqual({});
  });

  it("propagates a failed read so the caller keeps its cache", async () => {
    mockGetDoc.mockRejectedValue(new Error("offline"));
    await expect(fetchAppConfig()).rejects.toThrow("offline");
  });
});

describe("app config cache", () => {
  beforeEach(async () => {
    resetStorageMock();
    await AsyncStorage.clear();
  });

  it("round-trips under appConfig:v1", async () => {
    await writeAppConfigCache({ gachaSystem: "spark", latestVersion: "2.0.0" }, 77);
    expect(await AsyncStorage.getItem(APP_CONFIG_CACHE_KEY)).not.toBeNull();
    expect(await readAppConfigCache()).toEqual({
      config: { gachaSystem: "spark", latestVersion: "2.0.0" },
      fetchedAt: 77,
    });
  });

  it("re-validates what it reads", async () => {
    await AsyncStorage.setItem(
      APP_CONFIG_CACHE_KEY,
      JSON.stringify({ fetchedAt: 1, config: { gachaSystem: "gacha", latestVersion: "2.0" } }),
    );
    expect(await readAppConfigCache()).toEqual({ config: { latestVersion: "2.0" }, fetchedAt: 1 });
  });

  it("is null when absent, corrupt or unreadable", async () => {
    expect(await readAppConfigCache()).toBeNull();
    await AsyncStorage.setItem(APP_CONFIG_CACHE_KEY, "{{");
    expect(await readAppConfigCache()).toBeNull();
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValue(new Error("disk"));
    expect(await readAppConfigCache()).toBeNull();
  });

  it("rejects a blob without a fetch time", () => {
    expect(reviveAppConfigCache({ config: {} })).toBeNull();
    expect(reviveAppConfigCache(null)).toBeNull();
  });
});
