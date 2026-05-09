# Buy Me a Coffee — Design Spec

**Date:** 2026-04-06  
**Status:** Approved

---

## Overview

Add a "Buy Me a Coffee" tip feature to the Misc tab. Users can pay $2.99 or $5.99 via Google Play in-app purchase. Either purchase permanently removes all ads and can be restored if the app is reinstalled.

---

## Decisions

| # | Question | Decision |
|---|---|---|
| 1 | IAP library | `react-native-iap` |
| 2 | Ad-free persistence | Google Play non-consumable + AsyncStorage cache |
| 3 | Post-purchase email | Skipped |
| 4 | Post-purchase message | Skipped |
| 5 | Tier names | Locale-specific food names (see i18n section) |

---

## Architecture

### New files

**`hooks/useAdFree.ts`**  
Initialises the IAP connection, checks existing purchases on mount, exposes `isAdFree: boolean`, `purchaseTip(sku)`, and `restorePurchase()`. Persists the flag to AsyncStorage key `@isAdFree` so the state is available instantly on next launch without waiting for a Play Store round-trip.

**`contexts/ad-free-context.tsx`**  
Wraps `useAdFree` in a React context (`AdFreeContext`) with an `AdFreeProvider` component. Allows `InlineAd` and any future screen to read `isAdFree` without prop-drilling.

### Modified files

| File | Change |
|---|---|
| `constants/i18n.ts` | Add 15 new string keys to `UIStrings` interface and all 4 locales |
| `app/(tabs)/other.tsx` | Add `CoffeeDrawer` component + new list item in Support section |
| `app/ads/InlineAd.tsx` | Read `isAdFree` from context, return `null` immediately if true |
| `app/_layout.tsx` | Wrap app tree in `AdFreeProvider` |

---

## Google Play Product IDs

Create these as **managed products (non-consumable)** in the Play Console:

| Product ID | Price |
|---|---|
| `tip_kopi_ice` | $2.99 |
| `tip_chicken_rice` | $5.99 |

---

## IAP & Ad-Free Data Flow

### On app start (inside `AdFreeProvider`)
1. Read `AsyncStorage` key `@isAdFree` — if `'true'`, set `isAdFree = true` immediately (prevents ad flash)
2. Call `initConnection()` to open billing connection
3. Call `getAvailablePurchases()` — if either product ID is found, set `isAdFree = true` and persist to AsyncStorage

### On purchase
1. `requestPurchase({ sku })` triggers the Play billing sheet
2. `purchaseUpdatedListener` fires on success → call `finishTransaction({ purchase, isConsumable: false })` to acknowledge the purchase (required on Android — Google Play auto-refunds unacknowledged purchases after 3 days) → set `isAdFree = true`, persist to AsyncStorage, transition drawer to `success` state
3. `purchaseErrorListener` fires on failure/cancel:
   - User cancelled → silently return to `idle` (expected behaviour, no error shown)
   - Genuine error → show inline `HelperText` error below the tier cards

### On "Restore Purchase"
1. Call `getAvailablePurchases()`
2. If a matching product ID is found → set `isAdFree = true`, persist, show `miscCoffeeRestoreSuccess` inline
3. If nothing found → show `miscCoffeeRestoreFail` inline below the restore link

### Ad removal
`InlineAd` reads `isAdFree` from context and returns `null` immediately if true — no ad SDK calls are made at all.

---

## CoffeeDrawer Component

Located in `app/(tabs)/other.tsx`, follows the existing `BottomDrawer` pattern.

### States

| State | Content |
|---|---|
| `idle` | Two tier cards, ad-free note, restore link |
| `purchasing` | Loading spinner overlay while Play billing sheet is processing |
| `success` | Thank you screen — dismiss with "Done" button which closes the drawer |

### Already-owned state
If `isAdFree` is already `true` when the drawer opens, replace the tier cards with a `✨ You already support this app!` banner. Restore link is hidden.

### Error display
Errors render as inline `HelperText` below the cards, not as modal alerts, to stay consistent with the existing feedback drawer pattern.

---

## BottomDrawer Safe Area Fix

All drawers (`LanguageDrawer`, `FeedbackDrawer`, `DisclaimerDrawer`, `CoffeeDrawer`) share the `BottomDrawer` component.

**Fix:** Add `useSafeAreaInsets()` inside `BottomDrawer` and change the fixed `paddingBottom: 36` on `drawerContainer` to `paddingBottom: 36 + insets.bottom`. This correctly handles devices with gesture navigation bars vs physical buttons, and applies to all existing + new drawers automatically.

---

## UI Design

### Entry point — Misc tab Support section
New list item added below "Send Feedback":
- Icon: ☕
- Title: `t.miscCoffeeItem`
- Description: `t.miscCoffeeItemDesc`
- Right chevron → opens `CoffeeDrawer`

### Drawer — idle state
```
[drawer handle]

☕  Buy Me a Coffee
    Enjoying the app? A small tip removes ads forever.

┌─────────────────┐  ┌──────────────────┐
│      ☕         │  │  [BEST VALUE!]   │
│     $2.99       │  │       🍗         │
│    Kopi Ice     │  │     $5.99        │
│                 │  │   Chicken Rice   │
│   [Support]     │  │   [Support]      │
└─────────────────┘  └──────────────────┘

✨  Both tiers remove all ads permanently

         Restore Purchase
```

### Drawer — success state
```
[drawer handle]

        🙏
    Thank You!
  Ads removed. You're the best!

         [Done]
```

---

## i18n Keys

Add to `UIStrings` interface and all 4 locales:

| Key | EN | ZH | KO | JA |
|---|---|---|---|---|
| `miscCoffeeItem` | Buy Me a Coffee | 请我喝杯茶 | 커피 한 잔 사줘요 | コーヒーをおごって |
| `miscCoffeeItemDesc` | Support the developer · Remove ads | 支持开发者 · 永久移除广告 | 개발자 응원 · 광고 제거 | 開発者を応援 · 広告を削除 |
| `miscCoffeeDrawerTitle` | Buy Me a Coffee | 请我喝杯茶 | 커피 한 잔 사줘요 | コーヒーをおごって |
| `miscCoffeeDrawerDesc` | Enjoying the app? A small tip removes ads forever. | 觉得好用？请我喝杯茶，永久移除广告。 | 앱이 마음에 드셨나요? 작은 응원이 광고를 영원히 없애줍니다. | アプリを気に入っていただけましたか？広告を永久に削除します。 |
| `miscCoffeeSmallLabel` | Kopi Ice | 奶茶 | 아메리카노 | コーヒー |
| `miscCoffeeLargeLabel` | Chicken Rice | 鸡饭 | 치킨 | ラーメン |
| `miscCoffeeBadge` | BEST VALUE! | 好吃！ | 맛있어! | うまい！ |
| `miscCoffeeAdFreeNote` | Both tiers remove all ads permanently | 两档均可永久移除广告 | 두 가격 모두 광고를 영구 제거합니다 | どちらも広告を永久に削除します |
| `miscCoffeeButton` | Support | 请我 | 결제 | 支払う |
| `miscCoffeeRestore` | Restore Purchase | 恢复购买 | 구매 복원 | 購入を復元 |
| `miscCoffeeThankYouTitle` | Thank You! | 谢谢！ | 감사합니다！ | ありがとう！ |
| `miscCoffeeThankYouDesc` | Ads removed. You're the best! | 广告已移除，感谢您的支持！ | 광고가 제거되었습니다. 최고예요! | 広告を削除しました。ありがとうございます！ |
| `miscCoffeeDone` | Done | 完成 | 완료 | 完了 |
| `miscCoffeeRestoreSuccess` | Purchase restored! Ads removed. | 购买已恢复！广告已移除。 | 구매가 복원되었습니다! 광고 제거 완료. | 購入が復元されました！広告を削除しました。 |
| `miscCoffeeRestoreFail` | No previous purchase found. | 未找到购买记录。 | 이전 구매 내역을 찾을 수 없습니다. | 以前の購入が見つかりませんでした。 |

---

## Out of Scope

- Thank you email
- Post-purchase message to developer
- iOS App Store IAP (Android only for now)
- Server-side purchase verification
