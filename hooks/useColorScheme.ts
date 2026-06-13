import { useTheme } from "@/contexts/theme-context";

// Returns the active theme's light/dark family. Intentionally does NOT read the
// device color scheme — the app is driven solely by the selected theme.
export function useColorScheme(): "light" | "dark" {
  return useTheme().theme.tokens.isDark ? "dark" : "light";
}
