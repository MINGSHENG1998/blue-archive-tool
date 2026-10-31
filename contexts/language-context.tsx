import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Locale } from "@/constants/i18n";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
});

const STORAGE_KEY = "app_locale";

/** Every locale a stored value may name; anything else is ignored. */
export const VALID_LOCALES: readonly Locale[] = ["en", "zh", "ko", "ja", "vi", "th"];

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (VALID_LOCALES as readonly string[]).includes(value);

/**
 * A BCP 47 tag ("vi-VN", "th-TH", "zh-Hant-TW", "pt_BR") mapped onto a locale
 * the app ships, by language subtag. Null for a language the app does not
 * speak. Every Chinese variant maps to `zh`, the only Chinese block there is.
 */
export function localeFromTag(tag: string | null | undefined): Locale | null {
  if (typeof tag !== "string") return null;
  const language = tag.trim().toLowerCase().split(/[-_]/)[0];
  return isLocale(language) ? language : null;
}

/**
 * The device's language as a supported locale, or null. expo-localization is
 * not installed, so this asks Intl (Hermes ships it on both platforms); an
 * engine without Intl, or one that throws, simply yields null.
 */
export function deviceLocale(): Locale | null {
  try {
    if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat !== "function") {
      return null;
    }
    return localeFromTag(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return null;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  // A pick made while the stored value is still loading must win over it.
  const chosen = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let stored: string | null = null;
      try {
        stored = await AsyncStorage.getItem(STORAGE_KEY);
      } catch {
        // Unreadable storage: stay on English rather than guess, and do not
        // overwrite a choice we could not read.
        return;
      }
      if (cancelled || chosen.current) return;
      if (isLocale(stored)) {
        setLocaleState(stored);
        return;
      }
      // Nothing usable stored. setLocale is the only writer of this key, so
      // that is either a first launch or a Sensei who has read the app in
      // English for months without opening the picker. Anything else already
      // in storage (caches, settings, a roster) means the latter, and an update
      // must not switch their language under them.
      let existingInstall = true;
      try {
        const keys = await AsyncStorage.getAllKeys();
        existingInstall = keys.some((key) => key !== STORAGE_KEY);
      } catch {
        // Cannot tell: keep English, as every earlier build did.
      }
      if (cancelled || chosen.current) return;
      // A first launch follows the device once; either way the result is
      // pinned, so a later change of the phone's language never flips the app.
      const initial = existingInstall ? "en" : deviceLocale() ?? "en";
      setLocaleState(initial);
      AsyncStorage.setItem(STORAGE_KEY, initial).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = (newLocale: Locale) => {
    chosen.current = true;
    setLocaleState(newLocale);
    AsyncStorage.setItem(STORAGE_KEY, newLocale).catch(() => {});
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
