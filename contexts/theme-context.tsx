import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  THEMES,
  DEFAULT_THEME_ID,
  type Theme,
  type ThemeId,
} from "@/constants/theme";

interface ThemeContextValue {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  theme: Theme;
}

const ThemeCtx = createContext<ThemeContextValue>({
  themeId: DEFAULT_THEME_ID,
  setThemeId: () => {},
  theme: THEMES[DEFAULT_THEME_ID],
});

const STORAGE_KEY = "app_theme_id";

function isValidThemeId(value: string | null): value is ThemeId {
  return value != null && Object.prototype.hasOwnProperty.call(THEMES, value);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (isValidThemeId(stored)) setThemeIdState(stored);
    });
  }, []);

  const setThemeId = (id: ThemeId) => {
    setThemeIdState(id);
    AsyncStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <ThemeCtx.Provider value={{ themeId, setThemeId, theme: THEMES[themeId] }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
