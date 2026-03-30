# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Start dev server (Expo)
npx expo start

# Run on specific platforms
npm run android
npm run ios
npm run web

# Lint
npm run lint

# Run tests (watch mode)
npm test

# Run tests once
npx jest --watchAll=false
```

Builds use EAS (Expo Application Services): `eas build --profile production --platform android`

## Architecture

This is a React Native / Expo app for the mobile game "Blue Archive", using **Expo Router** (file-based routing). The app version is sourced from `app.json`.

### Routing

`app/` is the routing root. Navigation is structured as:
- `app/_layout.tsx` — Root layout: initializes fonts, Google Mobile Ads SDK, tracking transparency, and wraps the app in `PaperProvider` + `ThemeProvider`
- `app/(tabs)/` — Main 5-tab navigation: Home, Banner, Bond Exp, Chara Builder, Misc
- `app/resourceCalc/` — Nested routes for the character builder sub-screens (charaExp, elephCalc, skillCalc)
- `app/ads/InlineAd.tsx` — Shared AdMob component used by multiple screens

Path alias `@/*` maps to the project root (defined in `tsconfig.json`).

### Data & Backend

- **Firebase/Firestore** (`firebaseConfig.js`, initialized in `app/_layout.tsx`) — used for remote data
- **`constants/`** — Static game data: character level tables (`charaLvlData.ts`), bond exp data (`bondData.ts`), color mappings (`Colors.ts`)
- **`dto/game.dto.ts`** — Core TypeScript types: `WeaponType`, `AtkType`, `DefType`

### UI

- Uses **React Native Paper** (Material Design) for most UI components
- Tabs use haptic feedback via `expo-haptics`
- Custom `components/NumberInput.tsx` — number input with adjustable speed for game calculators

### Ads

Google AdMob is integrated via `react-native-google-mobile-ads`. Ad unit IDs are configured in `app.json` under the `react-native-google-mobile-ads` plugin config. The `InlineAd` component is used inline on screens like banner.
