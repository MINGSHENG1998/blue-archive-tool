// Per-area string modules for 2.0. Each area (home, banners, tools, ...) owns a
// small table in constants/strings/<area>.ts instead of growing the 1,400-line
// constants/i18n.ts:
//
//   export const homeStrings = defineStrings({
//     en: { greeting: "Good morning, Sensei", resetIn: "Reset in {time}" },
//     zh: { greeting: "...", resetIn: "... {time}" },
//     ko: { ... }, ja: { ... }, vi: { ... }, th: { ... },
//   });
//
//   const s = useStrings(homeStrings);   // in a component
//   s.greeting;  fmt(s.resetIn, { time: "02:13" });
//
// The English block defines the key set; TypeScript rejects a locale that is
// missing a key or invents one. Every table carries all six locales: a missing
// vi or th block is a compile error, not a silent fall back to English.
// strings/__tests__/strings-completeness-test.ts additionally asserts non-empty
// values, that every {placeholder} survives translation, and that no block is
// a copy of English.

import { useLanguage } from "@/contexts/language-context";
import type { Locale } from "@/constants/i18n";

export type { Locale };

/** Every locale the app renders, English first. */
export const LOCALES: readonly Locale[] = ["en", "zh", "ko", "ja", "vi", "th"];

/** One locale's strings, keyed like the English block. */
export type StringSet<K extends string> = { readonly [P in K]: string };

/** A complete table, every locale filled in, as returned by defineStrings(). */
export type StringTable<K extends string> = Readonly<Record<Locale, StringSet<K>>>;

/**
 * Declares a string table. Keys are inferred from `en`; zh/ko/ja/vi/th must
 * define exactly the same keys (excess or missing keys are compile errors).
 */
export function defineStrings<E extends Record<string, string>>(table: {
  en: E;
  zh: StringSet<Extract<keyof E, string>>;
  ko: StringSet<Extract<keyof E, string>>;
  ja: StringSet<Extract<keyof E, string>>;
  vi: StringSet<Extract<keyof E, string>>;
  th: StringSet<Extract<keyof E, string>>;
}): StringTable<Extract<keyof E, string>> {
  return table;
}

/** Non-hook accessor (tests, notification copy, anything outside React). */
export function stringsFor<K extends string>(
  table: StringTable<K>,
  locale: Locale
): StringSet<K> {
  return table[locale] ?? table.en;
}

/** The active locale's strings from a table. Re-renders on language change. */
export function useStrings<K extends string>(table: StringTable<K>): StringSet<K> {
  const { locale } = useLanguage();
  return stringsFor(table, locale);
}

/**
 * Fills `{name}` placeholders. Unknown placeholders are left as-is so a missing
 * value is visible in QA instead of silently disappearing.
 */
export function fmt(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}

