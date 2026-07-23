import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Dimensions } from "react-native";
import "react-native-reanimated";

import {
  PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
} from "react-native-paper";
import { AdFreeProvider, useAdFreeContext } from "@/contexts/ad-free-context";
import { AdsProvider, useAds } from "@/contexts/ads-context";
import { useAppOpenAd } from "@/services/ads/appOpen";

import { LanguageProvider } from "@/contexts/language-context";
import { ThemeProvider, useTheme } from "@/contexts/theme-context";
import { FONT_ASSETS } from "@/constants/typography";

// Route-level error boundary: a render throw degrades to an in-app error
// screen instead of a fatal JavascriptException in release builds.
export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

function ThemedApp() {
  const { theme } = useTheme();
  const isDark = theme.tokens.isDark;

  const paperBase = isDark ? MD3DarkTheme : MD3LightTheme;
  const paperTheme = {
    ...paperBase,
    colors: {
      ...paperBase.colors,
      primary: theme.tokens.primaryColor,
      background: theme.tokens.appBg,
      onBackground: theme.tokens.textPrimary,
      surface: theme.tokens.elevatedBg,
      onSurface: theme.tokens.textPrimary,
      surfaceVariant: theme.tokens.surfaceBg,
      onSurfaceVariant: theme.tokens.textSecondary,
      outline: theme.tokens.surfaceBorder,
      // Paper surfaces (Menu, Dialog, Snackbar) pick their bg from these MD3
      // elevation tints; left at defaults they render neutral grey/black
      // panels that ignore the active theme.
      elevation: {
        level0: "transparent",
        level1: theme.tokens.elevatedBg,
        level2: theme.tokens.elevatedBg,
        level3: theme.tokens.elevatedBg,
        level4: theme.tokens.elevatedBg,
        level5: theme.tokens.elevatedBg,
      },
    },
  };

  const navBase = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...navBase,
    colors: {
      ...navBase.colors,
      primary: theme.tokens.primaryColor,
      background: theme.tokens.appBg,
      card: theme.tokens.elevatedBg,
      text: theme.tokens.textPrimary,
      border: theme.tokens.surfaceBorder,
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <NavThemeProvider value={navTheme}>
        <AppOpenAdGate />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
      </NavThemeProvider>
    </PaperProvider>
  );
}

// Renders nothing; owns the foreground-return app-open ad.
function AppOpenAdGate() {
  const { isAdFree } = useAdFreeContext();
  const { ready, personalized } = useAds();
  useAppOpenAd(ready && !isAdFree, personalized);
  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FONT_ASSETS,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    // Manifest no longer locks orientation (Android 16 ignores it on large
    // screens and Play flags it). Lock portrait at runtime on phones only;
    // tablets/foldables (smallest width >= 600dp) rotate freely.
    const { width, height } = Dimensions.get("screen");
    if (Math.min(width, height) < 600) {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      ).catch(() => {});
    }
  }, []);

  if (!loaded) return null;

  return (
    <AdFreeProvider>
      <AdsProvider>
        <LanguageProvider>
          <ThemeProvider>
            <ThemedApp />
          </ThemeProvider>
        </LanguageProvider>
      </AdsProvider>
    </AdFreeProvider>
  );
}
