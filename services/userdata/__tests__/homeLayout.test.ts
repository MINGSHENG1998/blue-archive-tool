import AsyncStorage from "@react-native-async-storage/async-storage";

import { defaultHomeLayout, moveWidgetUp, toggleTool, toggleWidget } from "@/services/home/layout";
import { HOME_LAYOUT_KEY, homeLayoutStore } from "../homeLayout";

// See storage.test.ts: reinstall the mock's own implementations each test so
// a mockRejectedValue cannot leak between cases.
const storageMock = AsyncStorage as unknown as Record<"getItem" | "setItem", jest.Mock>;
const storageImpl = {
  getItem: storageMock.getItem.getMockImplementation(),
  setItem: storageMock.setItem.getMockImplementation(),
};

beforeEach(async () => {
  for (const name of ["getItem", "setItem"] as const) {
    storageMock[name].mockReset().mockImplementation(storageImpl[name]);
  }
  await AsyncStorage.clear();
});

describe("homeLayoutStore", () => {
  it("uses the 'home:v1' key", () => {
    expect(HOME_LAYOUT_KEY).toBe("home:v1");
    expect(homeLayoutStore.key).toBe("home:v1");
  });

  it("starts from the default layout when nothing is stored", async () => {
    expect(await homeLayoutStore.load()).toEqual({ value: defaultHomeLayout(), writable: true });
  });

  it("round-trips a customized layout", async () => {
    const custom = toggleTool(toggleWidget(moveWidgetUp(defaultHomeLayout(), "tools"), "happening"), "Raid");
    expect(await homeLayoutStore.save(custom)).toBe(true);
    const stored = JSON.parse((await AsyncStorage.getItem(HOME_LAYOUT_KEY))!);
    expect(stored).toEqual({ ...custom, v: 1 });
    expect((await homeLayoutStore.load()).value).toEqual(custom);
  });

  it("replaces corrupt JSON with the default and allows writing", async () => {
    await AsyncStorage.setItem(HOME_LAYOUT_KEY, "{not json");
    expect(await homeLayoutStore.load()).toEqual({ value: defaultHomeLayout(), writable: true });
  });

  it("normalizes what an older or newer build left behind", async () => {
    await AsyncStorage.setItem(HOME_LAYOUT_KEY, JSON.stringify({ v: 3, order: ["tools", "mystery", "resources"], hidden: ["mystery"], pinnedTools: [] }));
    const { value } = await homeLayoutStore.load();
    expect(value.order[0]).toBe("tools");
    expect(value.order).toHaveLength(defaultHomeLayout().order.length);
    expect(value.hidden).toEqual([]);
    expect(value.pinnedTools).toEqual([]);
  });

  it("refuses to clobber a layout it could not read", async () => {
    storageMock.getItem.mockRejectedValue(new Error("disk busy"));
    expect(await homeLayoutStore.load()).toEqual({ value: defaultHomeLayout(), writable: false });
  });
});
