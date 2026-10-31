import {
  atkTypeLabels,
  bondResourceNames,
  defTypeLabels,
  i18n,
  type Locale,
  type UIStrings,
} from "../i18n";
import { LOCALES as STRING_LOCALES } from "../strings/define";

const LOCALES: Locale[] = ["en", "zh", "ko", "ja", "vi", "th"];

// The English block is the source of truth for which keys must exist. Adding a
// key to UIStrings and only filling it in for `en` is the easy mistake here —
// TypeScript catches a missing key, but not one silently left in English.
const KEYS = Object.keys(i18n.en) as (keyof UIStrings)[];

// Script checks: a Thai block must actually be written in Thai, and a
// Vietnamese one must use the letters only Vietnamese has. Either one pasted
// from English would pass every other test in this file.
const THAI = /[\u0e01-\u0e5b]/;
const VIETNAMESE = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

const values = (strings: UIStrings): string[] =>
  KEYS.flatMap((key) => {
    const value = strings[key];
    return Array.isArray(value) ? value : [value];
  });

describe("i18n", () => {
  it("defines every locale", () => {
    expect(Object.keys(i18n).sort()).toEqual([...LOCALES].sort());
  });

  it("agrees with the string modules on the locale list", () => {
    expect([...STRING_LOCALES].sort()).toEqual([...LOCALES].sort());
  });

  it.each(LOCALES)("%s has every key, non-empty", (locale) => {
    const strings = i18n[locale];
    expect(Object.keys(strings).sort()).toEqual([...KEYS].sort());
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

  it.each(LOCALES)("%s keeps every {placeholder}", (locale) => {
    const placeholders = (s: string) =>
      (s.match(/\{\w+\}/g) ?? []).slice().sort().join(",");
    for (const key of KEYS) {
      const en = i18n.en[key];
      const value = i18n[locale][key];
      if (typeof en !== "string" || typeof value !== "string") continue;
      expect(`${key}=${placeholders(value)}`).toBe(`${key}=${placeholders(en)}`);
    }
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

  it.each(LOCALES.filter((l) => l !== "en"))(
    "%s differs from English in most of its strings",
    (locale) => {
      // Brand words (Blue Archive, EX, 3★) legitimately match; a block where
      // most strings match is a copy that someone forgot to translate.
      const en = values(i18n.en);
      const ours = values(i18n[locale]);
      const same = ours.filter((value, i) => value === en[i]).length;
      expect(same / ours.length).toBeLessThan(0.15);
    },
  );

  it("writes the Thai block in Thai script", () => {
    const thai = values(i18n.th).filter((value) => THAI.test(value));
    expect(thai.length / values(i18n.th).length).toBeGreaterThan(0.8);
    expect(i18n.th.greeting).toContain("เซนเซ");
  });

  it("writes the Vietnamese block with Vietnamese letters", () => {
    const vietnamese = values(i18n.vi).filter((value) => VIETNAMESE.test(value));
    expect(vietnamese.length / values(i18n.vi).length).toBeGreaterThan(0.5);
    expect(i18n.vi.greeting).toContain("Sensei");
  });

  describe.each([
    ["atkTypeLabels", atkTypeLabels],
    ["defTypeLabels", defTypeLabels],
    ["bondResourceNames", bondResourceNames],
  ] as const)("%s", (_name, table) => {
    it.each(Object.keys(table))("%s is labelled in every locale", (key) => {
      expect(Object.keys(table[key]).sort()).toEqual([...LOCALES].sort());
      for (const locale of LOCALES) {
        expect(table[key][locale].trim()).not.toBe("");
      }
      expect(THAI.test(table[key].th)).toBe(true);
      expect(table[key].vi).not.toBe(table[key].en);
    });
  });
});
