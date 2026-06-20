import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import {
  PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
} from "react-native-paper";
import { AdFreeProvider } from "@/contexts/ad-free-context";
import mobileAds from "react-native-google-mobile-ads";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";

import { LanguageProvider } from "@/contexts/language-context";
import { ThemeProvider, useTheme } from "@/contexts/theme-context";
import { FONT_ASSETS } from "@/constants/typography";

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
      surface: theme.tokens.elevatedBg,
      onSurface: theme.tokens.textPrimary,
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
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
      </NavThemeProvider>
    </PaperProvider>
  );
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
    (async () => {
      const { status: trackingStatus } = await requestTrackingPermissionsAsync();
      if (__DEV__ && trackingStatus !== "granted") {
        console.log("tracking permission:", trackingStatus);
      }
      await mobileAds().initialize();
    })();
  }, []);

  if (!loaded) return null;

  return (
    <AdFreeProvider>
      <LanguageProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </LanguageProvider>
    </AdFreeProvider>
  );
}
