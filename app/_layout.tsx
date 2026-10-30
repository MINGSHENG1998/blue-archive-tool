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
import { useReducedMotion } from "react-native-reanimated";

import {
  PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
  configureFonts,
} from "react-native-paper";
import { AdFreeProvider, useAdFreeContext } from "@/contexts/ad-free-context";
import { AdsProvider, useAds } from "@/contexts/ads-context";
import { useAppOpenAd } from "@/services/ads/appOpen";

import { GameDataProvider } from "@/contexts/gamedata-context";
import { AppDataProviders } from "@/contexts/app-data-providers";
import { NotificationsProvider } from "@/contexts/notifications-context";
import { SparkProvider } from "@/components/schale/SparkProvider";
import { LanguageProvider } from "@/contexts/language-context";
import { ThemeProvider, useTheme } from "@/contexts/theme-context";
import { FONT_ASSETS, font } from "@/constants/typography";

// Route-level error boundary: a render throw degrades to an in-app error
// screen instead of a fatal JavascriptException in release builds.
export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

function ThemedApp() {
  const { theme } = useTheme();
  const isDark = theme.tokens.isDark;
  const c = theme.tokens;
  const reduced = useReducedMotion();

  const paperBase = isDark ? MD3DarkTheme : MD3LightTheme;
  const paperTheme = {
    ...paperBase,
    roundness: 1,
    fonts: configureFonts({
      config: Object.fromEntries(Object.entries(paperBase.fonts).map(([name, spec]) => [name, {
        ...spec, ...font(spec.fontWeight ?? "400"), fontWeight: "normal",
      }])),
    }),
    colors: {
      ...paperBase.colors,
      primary: c.primaryColor,
      onPrimary: c.primaryText,
      primaryContainer: c.accentSoft,
      onPrimaryContainer: c.primaryInk,
      secondary: c.primaryInk,
      onSecondary: c.appBg,
      secondaryContainer: c.accentSoft,
      onSecondaryContainer: c.primaryInk,
      tertiary: c.halo,
      onTertiary: c.appBg,
      tertiaryContainer: c.haloSoft,
      onTertiaryContainer: c.textPrimary,
      background: c.appBg,
      onBackground: c.textPrimary,
      surface: c.elevatedBg,
      onSurface: c.textPrimary,
      surfaceVariant: c.surfaceBg,
      onSurfaceVariant: c.textSecondary,
      surfaceDisabled: c.surfaceBg,
      onSurfaceDisabled: c.textMuted,
      outline: c.surfaceBorder,
      outlineVariant: c.hairline,
      error: c.hazardColor,
      onError: c.appBg,
      errorContainer: c.hazardBg,
      onErrorContainer: c.hazardColor,
      inverseSurface: c.textPrimary,
      inverseOnSurface: c.appBg,
      inversePrimary: c.appBg,
      shadow: c.shadow,
      scrim: c.overlay,
      backdrop: c.overlay,
      // Paper surfaces (Menu, Dialog, Snackbar) pick their bg from these MD3
      // elevation tints; left at defaults they render neutral grey/black
      // panels that ignore the active theme.
      elevation: {
        level0: c.skyFade,
        level1: c.elevatedBg,
        level2: c.elevatedBg,
        level3: c.elevatedBg,
        level4: c.elevatedBg,
        level5: c.elevatedBg,
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
        <SparkProvider>
        <AppOpenAdGate />
        <Stack screenOptions={{ headerShown: false, animation: reduced ? "none" : "slide_from_right", contentStyle: { backgroundColor: c.appBg } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="student/[id]" />
          <Stack.Screen name="birthdays" />
          <Stack.Screen name="tools/bond" />
          <Stack.Screen name="tools/level" />
          <Stack.Screen name="tools/eleph" />
          <Stack.Screen name="tools/skill" />
          <Stack.Screen name="tools/raid" />
          <Stack.Screen name="tools/gacha" />
          <Stack.Screen name="tools/planner" />
          <Stack.Screen name="tools/ap" />
          <Stack.Screen name="reminders" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
        </SparkProvider>
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
          <GameDataProvider>
            <ThemeProvider>
              <AppDataProviders>
              <NotificationsProvider>
              <ThemedApp />
              </NotificationsProvider>
              </AppDataProviders>
            </ThemeProvider>
          </GameDataProvider>
        </LanguageProvider>
      </AdsProvider>
    </AdFreeProvider>
  );
}
