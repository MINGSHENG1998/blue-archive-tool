import { useTheme } from "@/contexts/theme-context";
import type { ThemeTokens } from "@/constants/theme";

export const useColors = (): ThemeTokens => useTheme().theme.tokens;
