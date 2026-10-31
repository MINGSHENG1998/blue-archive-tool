import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { LOCALES } from "@/constants/strings/define";

import {
  LanguageProvider,
  VALID_LOCALES,
  deviceLocale,
  localeFromTag,
  useLanguage,
} from "../language-context";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

let captured: ReturnType<typeof useLanguage>;
function Capture() {
  captured = useLanguage();
  return null;
}

async function renderProvider() {
  await act(async () => {
    TestRenderer.create(
      <LanguageProvider>
        <Capture />
      </LanguageProvider>,
    );
  });
  // flush the storage read and the first-launch write
  await act(async () => {});
}

/** Pretends the device runs `tag`, for the Intl lookup deviceLocale() makes. */
function mockDeviceTag(tag: string | (() => never)) {
  return jest.spyOn(Intl, "DateTimeFormat").mockImplementation((() => ({
    resolvedOptions: () => {
      if (typeof tag === "function") tag();
      return { locale: tag };
    },
  })) as unknown as typeof Intl.DateTimeFormat);
}

describe("localeFromTag", () => {
  it.each([
    ["vi-VN", "vi"],
    ["th-TH", "th"],
    ["th", "th"],
    ["ja-JP", "ja"],
    ["ko-KR", "ko"],
    ["zh-Hans-CN", "zh"],
    ["zh-Hant-TW", "zh"],
    ["en-GB", "en"],
    ["VI_vn", "vi"],
  ])("maps %s to %s", (tag, locale) => {
    expect(localeFromTag(tag)).toBe(locale);
  });

  it.each(["fr-FR", "pt-BR", "", "  ", null, undefined])(
    "has nothing for %p",
    (tag) => {
      expect(localeFromTag(tag)).toBeNull();
    },
  );
});

describe("deviceLocale", () => {
  afterEach(() => jest.restoreAllMocks());

  it("reads the device language from Intl", () => {
    mockDeviceTag("th-TH");
    expect(deviceLocale()).toBe("th");
  });

  it("is null for an unsupported language", () => {
    mockDeviceTag("de-DE");
    expect(deviceLocale()).toBeNull();
  });

  it("is null when Intl throws", () => {
    mockDeviceTag(() => {
      throw new Error("no Intl");
    });
    expect(deviceLocale()).toBeNull();
  });
});

describe("LanguageProvider", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it("validates against exactly the locales the string tables carry", () => {
    expect([...VALID_LOCALES].sort()).toEqual([...LOCALES].sort());
  });

  it.each(["vi", "th", "ja"] as const)("restores a stored %s", async (locale) => {
    await AsyncStorage.setItem("app_locale", locale);
    mockDeviceTag("ko-KR");
    await renderProvider();
    expect(captured.locale).toBe(locale);
  });

  it("follows the device on a first launch and pins it", async () => {
    mockDeviceTag("vi-VN");
    await renderProvider();
    expect(captured.locale).toBe("vi");
    expect(await AsyncStorage.getItem("app_locale")).toBe("vi");
  });

  it("stays in English on a first launch from an unsupported language", async () => {
    mockDeviceTag("fr-FR");
    await renderProvider();
    expect(captured.locale).toBe("en");
    expect(await AsyncStorage.getItem("app_locale")).toBe("en");
  });

  it("keeps an existing install in English, whatever the phone's language", async () => {
    // An earlier build never stored a locale unless the user picked one, so
    // these users have no app_locale, but they do have everything else.
    await AsyncStorage.setItem("gamedata:v2:checkedAt", "1800000000000");
    mockDeviceTag("th-TH");
    await renderProvider();
    expect(captured.locale).toBe("en");
    expect(await AsyncStorage.getItem("app_locale")).toBe("en");
  });

  it("stays in English when it cannot tell a first launch apart", async () => {
    jest.spyOn(AsyncStorage, "getAllKeys").mockRejectedValueOnce(new Error("locked"));
    mockDeviceTag("vi-VN");
    await renderProvider();
    expect(captured.locale).toBe("en");
  });

  it("never lets the device override a stored choice", async () => {
    await AsyncStorage.setItem("app_locale", "en");
    mockDeviceTag("th-TH");
    await renderProvider();
    expect(captured.locale).toBe("en");
  });

  it("treats an unknown stored value as a first launch", async () => {
    await AsyncStorage.setItem("app_locale", "klingon");
    mockDeviceTag("th-TH");
    await renderProvider();
    expect(captured.locale).toBe("th");
  });

  it("stays in English when storage cannot be read", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("locked"));
    mockDeviceTag("vi-VN");
    await renderProvider();
    expect(captured.locale).toBe("en");
  });

  it("persists a choice", async () => {
    mockDeviceTag("en-US");
    await renderProvider();
    await act(async () => captured.setLocale("th"));
    expect(captured.locale).toBe("th");
    expect(await AsyncStorage.getItem("app_locale")).toBe("th");
  });
});
