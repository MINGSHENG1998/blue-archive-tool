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

# Verify no hardcoded colors / OS-scheme reads leaked into screens
# (all colors must come from constants/theme.ts via useColors())
npm run lint:colors

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

Two data planes, with a hard split of authority:

- **Firestore = schedule + editorial.** The curated banner timeline, banner
  `type`, limited/fes/collab flags, and the custom display names. Maintained by
  hand through personal-backoffice-react at `/w/ba/banner`.
- **SchaleDB = facts.** Student roster, birthdays, schools/clubs/roles, damage
  types, materials, and the live gacha/event/raid windows. Never mirrored into
  Firestore, never edited by hand.

Firestore changes must be **additive only** — shipped app versions cannot be
force-updated, so `startDate endDate type characters characterIds name image
class rarity atkType defType translations` can never be renamed or dropped, and
banner docs keep both `characterIds` and the embedded `characters[]` copy.

#### Game data snapshot

`assets/gamedata/` is a trimmed SchaleDB snapshot (~215 KB) bundled into the
app. It is the offline floor: what a cold first launch and an offline launch
render. At runtime `services/gamedata/` prefers the AsyncStorage cache when it
is at least as new, then checks upstream's `build` number at most every 12h and
only downloads the full roster when it actually moved.

**Refresh it before cutting a release**, or fresh installs ship stale data:

```bash
npm run gamedata:refresh
```

Commit the regenerated `assets/gamedata/` files.

#### Student icons

Character `image` URLs point at our own Firebase Hosting mirror
(`https://blue-archive-tool.web.app/icons/{studentId}.webp`), never at a
third party: bluearchive.wiki started answering hotlinks with a Cloudflare
challenge (Oct 2026) and blanked every image. `hosting/` is the mirror and
`hosting/icons.json` lists what is uploaded; the backoffice sync only writes a
mirror URL for ids listed there (SchaleDB URL until then, upgraded by its
"Link" step later).

When new students drop, and before a release alongside `gamedata:refresh`:

```bash
npm run icons:refresh
```

It downloads missing icons from SchaleDB and deploys Hosting. Commit
`hosting/`. Remote images in the app go through `components/FallbackImage.tsx`
(mirror → SchaleDB → themed placeholder), never a bare `<Image source={{ uri }}>`.

- **Firebase/Firestore** (`firebaseConfig.js`, initialized in `app/_layout.tsx`) — used for remote data
- **`constants/`** — Static game data: character level tables (`charaLvlData.ts`), bond exp data (`bondData.ts`), color mappings (`Colors.ts`)
- **`dto/game.dto.ts`** — Core TypeScript types: `AtkType`, `DefType`

### UI

- Uses **React Native Paper** (Material Design) for most UI components
- Tabs use haptic feedback via `expo-haptics`
- Custom `components/NumberInput.tsx` — number input with adjustable speed for game calculators

### Ads

Google AdMob is integrated via `react-native-google-mobile-ads`. Ad unit IDs are configured in `app.json` under the `react-native-google-mobile-ads` plugin config. The `InlineAd` component is used inline on screens like banner.
