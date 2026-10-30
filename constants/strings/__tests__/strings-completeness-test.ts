// Every per-area string module in constants/strings/ is picked up automatically:
// a new <area>.ts file is covered the moment it exists. The type system already
// rejects missing/extra keys; this guards what types cannot see — empty values,
// a {placeholder} dropped in translation, and a block left in English.

import fs from "fs";
import path from "path";

const LOCALES = ["en", "zh", "ko", "ja"] as const;
const DIR = path.join(__dirname, "..");
const NOT_TABLES = new Set(["define.ts", "index.ts"]);

type Table = Record<(typeof LOCALES)[number], Record<string, string>>;

function isTable(value: unknown): value is Table {
  return (
    typeof value === "object" &&
    value !== null &&
    "en" in value &&
    typeof (value as { en: unknown }).en === "object"
  );
}

const placeholders = (s: string) =>
  (s.match(/\{\w+\}/g) ?? []).slice().sort().join(",");

const modules = fs
  .readdirSync(DIR)
  .filter((f) => /\.tsx?$/.test(f) && !NOT_TABLES.has(f));

const tables: [string, Table][] = [];
for (const file of modules) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(path.join(DIR, file)) as Record<string, unknown>;
  for (const [name, value] of Object.entries(mod)) {
    if (isTable(value)) tables.push([`${file}:${name}`, value]);
  }
}

describe("strings modules", () => {
  it("found at least the shell's own modules", () => {
    const names = tables.map(([n]) => n);
    expect(names).toEqual(
      expect.arrayContaining([
        "common.ts:commonStrings",
        "nav.ts:navStrings",
        "themes.ts:themeStrings",
      ])
    );
  });

  describe.each(tables)("%s", (_name, table) => {
    const enKeys = Object.keys(table.en).sort();

    it("defines exactly the four locales", () => {
      expect(Object.keys(table).sort()).toEqual([...LOCALES].sort());
    });

    it.each(LOCALES)("%s has the English key set, all non-empty", (locale) => {
      const block = table[locale];
      expect(Object.keys(block).sort()).toEqual(enKeys);
      for (const key of enKeys) {
        expect(typeof block[key]).toBe("string");
        expect(block[key].trim()).not.toBe("");
      }
    });

    it.each(LOCALES)("%s keeps every {placeholder}", (locale) => {
      for (const key of enKeys) {
        expect(`${key}=${placeholders(table[locale][key])}`).toBe(
          `${key}=${placeholders(table.en[key])}`
        );
      }
    });

    it.each(["zh", "ko", "ja"] as const)("%s is actually translated", (locale) => {
      // Brand chrome ("AP", "MomoTalk") may legitimately match English, but a
      // block where nothing differs is an untranslated copy.
      const translated = enKeys.filter((k) => table[locale][k] !== table.en[k]);
      expect(translated.length).toBeGreaterThan(0);
    });
  });
});
