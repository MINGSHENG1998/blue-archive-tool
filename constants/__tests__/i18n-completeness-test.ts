import { i18n, type Locale, type UIStrings } from "../i18n";

const LOCALES: Locale[] = ["en", "zh", "ko", "ja"];

// The English block is the source of truth for which keys must exist. Adding a
// key to UIStrings and only filling it in for `en` is the easy mistake here —
// TypeScript catches a missing key, but not one silently left in English.
const KEYS = Object.keys(i18n.en) as (keyof UIStrings)[];

describe("i18n", () => {
  it("defines every locale", () => {
    expect(Object.keys(i18n).sort()).toEqual([...LOCALES].sort());
  });

  it.each(LOCALES)("%s has every key, non-empty", (locale) => {
    const strings = i18n[locale];
    for (const key of KEYS) {
      const value = strings[key];
      expect(value).toBeDefined();
      if (typeof value === "string") {
        expect(value.trim()).not.toBe("");
      }
    }
  });

  it.each(LOCALES)("%s has twelve month names", (locale) => {
    expect(i18n[locale].monthNames).toHaveLength(12);
    for (const month of i18n[locale].monthNames) {
      expect(month.trim()).not.toBe("");
    }
  });

  it.each(LOCALES)("%s keeps the {days} placeholder", (locale) => {
    expect(i18n[locale].birthdayInDays).toContain("{days}");
  });

  it.each(LOCALES.filter((l) => l !== "en"))(
    "%s actually translates the birthday screen",
    (locale) => {
      // Guards against a locale block that was extended by copy-pasting English.
      expect(i18n[locale].birthdayPageTitle).not.toBe(i18n.en.birthdayPageTitle);
      expect(i18n[locale].birthdayTodayHeading).not.toBe(
        i18n.en.birthdayTodayHeading,
      );
    },
  );
});
