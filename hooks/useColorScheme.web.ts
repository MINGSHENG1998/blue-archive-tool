import { useTheme } from "@/contexts/theme-context";

export function useColorScheme(): "light" | "dark" {
  return useTheme().theme.tokens.isDark ? "dark" : "light";
}
