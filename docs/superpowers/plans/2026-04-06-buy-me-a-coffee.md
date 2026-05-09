# Buy Me a Coffee Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Google Play IAP tip feature to the Misc tab that permanently removes ads when either $2.99 or $5.99 tier is purchased.

**Architecture:** A `useAdFree` hook manages IAP connection, listeners, and AsyncStorage caching; `AdFreeContext` exposes `isAdFree`, `purchaseTip`, and `restorePurchase` app-wide; `InlineAd` returns `null` when `isAdFree` is true; a `CoffeeDrawer` bottom sheet in `other.tsx` handles purchase UX.

**Tech Stack:** `react-native-iap` v12, `@react-native-async-storage/async-storage` (already installed), React context, React Native Paper components.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `hooks/useAdFree.ts` | IAP init, listeners, AsyncStorage cache, purchase/restore logic |
| Create | `contexts/ad-free-context.tsx` | Wraps hook in React context, exports `AdFreeProvider` + `useAdFreeContext` |
| Create | `hooks/__tests__/useAdFree.test.ts` | Unit tests for hook: cache read, restore logic |
| Create | `app/ads/__tests__/InlineAd.test.tsx` | Render test: null when ad-free, visible otherwise |
| Modify | `constants/i18n.ts` | Add 16 new i18n keys to interface + all 4 locales |
| Modify | `app/(tabs)/other.tsx` | Add `CoffeeDrawer` component, Support list item, fix `BottomDrawer` safe area |
| Modify | `app/ads/InlineAd.tsx` | Guard: return `null` when `isAdFree` is true |
| Modify | `app/_layout.tsx` | Wrap tree in `AdFreeProvider` |

---

## Task 1: Install react-native-iap

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install the library**

```bash
npm install react-native-iap@12
```

Expected output: `added 1 package` (or similar — no peer dep warnings for RN 0.79).

- [ ] **Step 2: Verify billing permission auto-merged**

`react-native-iap` ships its own `AndroidManifest.xml` that adds `com.android.vending.BILLING` automatically via Gradle manifest merger. Confirm by opening `node_modules/react-native-iap/android/src/main/AndroidManifest.xml` and checking for the BILLING uses-permission line. No manual manifest change needed.

- [ ] **Step 3: Rebuild the dev client**

```bash
eas build --profile development --platform android
```

Or if running locally:

```bash
npm run android
```

Expected: build succeeds, no missing billing dependency errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install react-native-iap for Google Play IAP"
```

---

## Task 2: Add i18n keys

**Files:**
- Modify: `constants/i18n.ts`

> Note: `miscCoffeeAlreadyOwned` is added here (spec gap — needed for the "already purchased" banner in the drawer).

- [ ] **Step 1: Add keys to the `UIStrings` interface**

In `constants/i18n.ts`, find the `// Misc / Other screen` comment block (around line 104) and add after `miscFeedbackFailed`:

```typescript
  // Buy Me a Coffee
  miscCoffeeItem: string;
  miscCoffeeItemDesc: string;
  miscCoffeeDrawerTitle: string;
  miscCoffeeDrawerDesc: string;
  miscCoffeeSmallLabel: string;
  miscCoffeeLargeLabel: string;
  miscCoffeeBadge: string;
  miscCoffeeAdFreeNote: string;
  miscCoffeeButton: string;
  miscCoffeeRestore: string;
  miscCoffeeThankYouTitle: string;
  miscCoffeeThankYouDesc: string;
  miscCoffeeDone: string;
  miscCoffeeRestoreSuccess: string;
  miscCoffeeRestoreFail: string;
  miscCoffeeAlreadyOwned: string;
```

- [ ] **Step 2: Add EN values**

In the `en:` locale object, after `miscFeedbackFailed`:

```typescript
    miscCoffeeItem: 'Buy Me a Coffee',
    miscCoffeeItemDesc: 'Support the developer · Remove ads',
    miscCoffeeDrawerTitle: 'Buy Me a Coffee',
    miscCoffeeDrawerDesc: 'Enjoying the app? A small tip removes ads forever.',
    miscCoffeeSmallLabel: 'Kopi Ice',
    miscCoffeeLargeLabel: 'Chicken Rice',
    miscCoffeeBadge: 'BEST VALUE!',
    miscCoffeeAdFreeNote: 'Both tiers remove all ads permanently',
    miscCoffeeButton: 'Support',
    miscCoffeeRestore: 'Restore Purchase',
    miscCoffeeThankYouTitle: 'Thank You!',
    miscCoffeeThankYouDesc: 'Ads removed. You\'re the best!',
    miscCoffeeDone: 'Done',
    miscCoffeeRestoreSuccess: 'Purchase restored! Ads removed.',
    miscCoffeeRestoreFail: 'No previous purchase found.',
    miscCoffeeAlreadyOwned: 'You already support this app!',
```

- [ ] **Step 3: Add ZH values**

In the `zh:` locale object, after `miscFeedbackFailed`:

```typescript
    miscCoffeeItem: '请我喝杯茶',
    miscCoffeeItemDesc: '支持开发者 · 永久移除广告',
    miscCoffeeDrawerTitle: '请我喝杯茶',
    miscCoffeeDrawerDesc: '觉得好用？请我喝杯茶，永久移除广告。',
    miscCoffeeSmallLabel: '奶茶',
    miscCoffeeLargeLabel: '鸡饭',
    miscCoffeeBadge: '好吃！',
    miscCoffeeAdFreeNote: '两档均可永久移除广告',
    miscCoffeeButton: '请我',
    miscCoffeeRestore: '恢复购买',
    miscCoffeeThankYouTitle: '谢谢！',
    miscCoffeeThankYouDesc: '广告已移除，感谢您的支持！',
    miscCoffeeDone: '完成',
    miscCoffeeRestoreSuccess: '购买已恢复！广告已移除。',
    miscCoffeeRestoreFail: '未找到购买记录。',
    miscCoffeeAlreadyOwned: '您已经支持此应用！',
```

- [ ] **Step 4: Add KO values**

In the `ko:` locale object, after `miscFeedbackFailed`:

```typescript
    miscCoffeeItem: '커피 한 잔 사줘요',
    miscCoffeeItemDesc: '개발자 응원 · 광고 제거',
    miscCoffeeDrawerTitle: '커피 한 잔 사줘요',
    miscCoffeeDrawerDesc: '앱이 마음에 드셨나요? 작은 응원이 광고를 영원히 없애줍니다.',
    miscCoffeeSmallLabel: '아메리카노',
    miscCoffeeLargeLabel: '치킨',
    miscCoffeeBadge: '맛있어!',
    miscCoffeeAdFreeNote: '두 가격 모두 광고를 영구 제거합니다',
    miscCoffeeButton: '결제',
    miscCoffeeRestore: '구매 복원',
    miscCoffeeThankYouTitle: '감사합니다！',
    miscCoffeeThankYouDesc: '광고가 제거되었습니다. 최고예요!',
    miscCoffeeDone: '완료',
    miscCoffeeRestoreSuccess: '구매가 복원되었습니다! 광고 제거 완료.',
    miscCoffeeRestoreFail: '이전 구매 내역을 찾을 수 없습니다.',
    miscCoffeeAlreadyOwned: '이미 앱을 응원해 주셨습니다!',
```

- [ ] **Step 5: Add JA values**

In the `ja:` locale object, after `miscFeedbackFailed`:

```typescript
    miscCoffeeItem: 'コーヒーをおごって',
    miscCoffeeItemDesc: '開発者を応援 · 広告を削除',
    miscCoffeeDrawerTitle: 'コーヒーをおごって',
    miscCoffeeDrawerDesc: 'アプリを気に入っていただけましたか？広告を永久に削除します。',
    miscCoffeeSmallLabel: 'コーヒー',
    miscCoffeeLargeLabel: 'ラーメン',
    miscCoffeeBadge: 'うまい！',
    miscCoffeeAdFreeNote: 'どちらも広告を永久に削除します',
    miscCoffeeButton: '支払う',
    miscCoffeeRestore: '購入を復元',
    miscCoffeeThankYouTitle: 'ありがとう！',
    miscCoffeeThankYouDesc: '広告を削除しました。ありがとうございます！',
    miscCoffeeDone: '完了',
    miscCoffeeRestoreSuccess: '購入が復元されました！広告を削除しました。',
    miscCoffeeRestoreFail: '以前の購入が見つかりませんでした。',
    miscCoffeeAlreadyOwned: 'すでにこのアプリを応援しています！',
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If TypeScript complains about missing keys in a locale, find and add the missing entry.

- [ ] **Step 7: Commit**

```bash
git add constants/i18n.ts
git commit -m "feat: add i18n keys for Buy Me a Coffee feature"
```

---

## Task 3: Create useAdFree hook + tests

**Files:**
- Create: `hooks/useAdFree.ts`
- Create: `hooks/__tests__/useAdFree.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `hooks/__tests__/useAdFree.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAdFree, TIP_SKUS } from '../useAdFree';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock react-native-iap
const mockGetAvailablePurchases = jest.fn();
const mockPurchaseUpdatedListener = jest.fn();
const mockPurchaseErrorListener = jest.fn();

jest.mock('react-native-iap', () => ({
  initConnection: jest.fn().mockResolvedValue(true),
  endConnection: jest.fn(),
  getAvailablePurchases: mockGetAvailablePurchases,
  requestPurchase: jest.fn(),
  finishTransaction: jest.fn().mockResolvedValue(undefined),
  purchaseUpdatedListener: mockPurchaseUpdatedListener,
  purchaseErrorListener: mockPurchaseErrorListener,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAvailablePurchases.mockResolvedValue([]);
  mockPurchaseUpdatedListener.mockReturnValue({ remove: jest.fn() });
  mockPurchaseErrorListener.mockReturnValue({ remove: jest.fn() });
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});

describe('useAdFree', () => {
  it('starts with isAdFree=false when AsyncStorage is empty', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const { result } = renderHook(() => useAdFree());
    expect(result.current.isAdFree).toBe(false);
  });

  it('sets isAdFree=true immediately when AsyncStorage cache is "true"', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    const { result } = renderHook(() => useAdFree());
    await act(async () => {});
    expect(result.current.isAdFree).toBe(true);
  });

  it('sets isAdFree=true when getAvailablePurchases returns a matching SKU', async () => {
    mockGetAvailablePurchases.mockResolvedValue([
      { productId: TIP_SKUS.SMALL, transactionReceipt: 'receipt' },
    ]);
    const { result } = renderHook(() => useAdFree());
    await act(async () => {});
    expect(result.current.isAdFree).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@isAdFree', 'true');
  });

  it('restorePurchase returns "not_found" when no matching purchase exists', async () => {
    mockGetAvailablePurchases.mockResolvedValue([]);
    const { result } = renderHook(() => useAdFree());
    await act(async () => {});
    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.restorePurchase();
    });
    expect(outcome).toBe('not_found');
    expect(result.current.isAdFree).toBe(false);
  });

  it('restorePurchase returns "success" and sets isAdFree when a matching purchase is found', async () => {
    mockGetAvailablePurchases
      .mockResolvedValueOnce([]) // called on init
      .mockResolvedValueOnce([{ productId: TIP_SKUS.LARGE }]); // called on restore
    const { result } = renderHook(() => useAdFree());
    await act(async () => {});
    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.restorePurchase();
    });
    expect(outcome).toBe('success');
    expect(result.current.isAdFree).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest hooks/__tests__/useAdFree.test.ts --watchAll=false
```

Expected: FAIL — `Cannot find module '../useAdFree'`

- [ ] **Step 3: Create the hook**

Create `hooks/useAdFree.ts`:

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNIap from 'react-native-iap';

export const TIP_SKUS = {
  SMALL: 'tip_kopi_ice',
  LARGE: 'tip_chicken_rice',
} as const;

type SkuValue = typeof TIP_SKUS[keyof typeof TIP_SKUS];
const ALL_SKUS: SkuValue[] = [TIP_SKUS.SMALL, TIP_SKUS.LARGE];
const STORAGE_KEY = '@isAdFree';

type PendingPurchase = {
  resolve: (result: 'success' | 'cancelled') => void;
  reject: (reason: string) => void;
};

export interface AdFreeHookResult {
  isAdFree: boolean;
  purchaseTip: (sku: string) => Promise<'success' | 'cancelled'>;
  restorePurchase: () => Promise<'success' | 'not_found'>;
}

export function useAdFree(): AdFreeHookResult {
  const [isAdFree, setIsAdFree] = useState(false);
  const pendingRef = useRef<PendingPurchase | null>(null);

  const markAdFree = useCallback(async () => {
    setIsAdFree(true);
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (mounted && cached === 'true') setIsAdFree(true);

      await RNIap.initConnection();

      const purchases = await RNIap.getAvailablePurchases();
      const owned = purchases.some((p) =>
        ALL_SKUS.includes(p.productId as SkuValue)
      );
      if (mounted && owned) await markAdFree();
    };

    init().catch(console.warn);

    const purchaseSub = RNIap.purchaseUpdatedListener(async (purchase) => {
      if (purchase.transactionReceipt) {
        await RNIap.finishTransaction({ purchase, isConsumable: false });
        await markAdFree();
        pendingRef.current?.resolve('success');
        pendingRef.current = null;
      }
    });

    const errorSub = RNIap.purchaseErrorListener((error: RNIap.PurchaseError) => {
      if (error.code === 'E_USER_CANCELLED') {
        pendingRef.current?.resolve('cancelled');
      } else {
        pendingRef.current?.reject(error.message ?? 'Purchase failed');
      }
      pendingRef.current = null;
    });

    return () => {
      mounted = false;
      purchaseSub.remove();
      errorSub.remove();
      RNIap.endConnection();
    };
  }, [markAdFree]);

  const purchaseTip = useCallback(
    (sku: string): Promise<'success' | 'cancelled'> => {
      return new Promise((resolve, reject) => {
        pendingRef.current = { resolve, reject };
        RNIap.requestPurchase({ sku }).catch((err: Error) => {
          pendingRef.current = null;
          reject(err.message ?? 'Request failed');
        });
      });
    },
    []
  );

  const restorePurchase = useCallback(async (): Promise<'success' | 'not_found'> => {
    const purchases = await RNIap.getAvailablePurchases();
    const owned = purchases.some((p) =>
      ALL_SKUS.includes(p.productId as SkuValue)
    );
    if (owned) {
      await markAdFree();
      return 'success';
    }
    return 'not_found';
  }, [markAdFree]);

  return { isAdFree, purchaseTip, restorePurchase };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest hooks/__tests__/useAdFree.test.ts --watchAll=false
```

Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add hooks/useAdFree.ts hooks/__tests__/useAdFree.test.ts
git commit -m "feat: add useAdFree hook with IAP connection and AsyncStorage caching"
```

---

## Task 4: Create AdFreeContext and AdFreeProvider

**Files:**
- Create: `contexts/ad-free-context.tsx`

- [ ] **Step 1: Create the context file**

Create `contexts/ad-free-context.tsx`:

```typescript
import React, { createContext, useContext } from 'react';
import { useAdFree, type AdFreeHookResult } from '@/hooks/useAdFree';

export const AdFreeContext = createContext<AdFreeHookResult>({
  isAdFree: false,
  purchaseTip: async () => 'cancelled',
  restorePurchase: async () => 'not_found',
});

export function AdFreeProvider({ children }: { children: React.ReactNode }) {
  const adFree = useAdFree();
  return (
    <AdFreeContext.Provider value={adFree}>
      {children}
    </AdFreeContext.Provider>
  );
}

export const useAdFreeContext = () => useContext(AdFreeContext);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add contexts/ad-free-context.tsx
git commit -m "feat: add AdFreeContext and AdFreeProvider"
```

---

## Task 5: Wire AdFreeProvider into the app root

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add AdFreeProvider to the root layout**

In `app/_layout.tsx`, add the import after the existing context import:

```typescript
import { AdFreeProvider } from '@/contexts/ad-free-context';
```

Then wrap the existing `<LanguageProvider>` tree so `AdFreeProvider` is the outermost wrapper:

```tsx
  return (
    <AdFreeProvider>
      <LanguageProvider>
        <PaperProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </PaperProvider>
      </LanguageProvider>
    </AdFreeProvider>
  );
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: wrap app in AdFreeProvider"
```

---

## Task 6: Update InlineAd to respect ad-free status

**Files:**
- Modify: `app/ads/InlineAd.tsx`
- Create: `app/ads/__tests__/InlineAd.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `app/ads/__tests__/InlineAd.test.tsx`:

```typescript
import React from 'react';
import renderer from 'react-test-renderer';
import InlineAd from '../InlineAd';
import { AdFreeContext } from '@/contexts/ad-free-context';

jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: 'BannerAd',
  BannerAdSize: { BANNER: 'BANNER' },
  TestIds: { BANNER: 'test-banner-id' },
}));

jest.mock('expo-device', () => ({ osName: 'Android' }));

const mockContext = (isAdFree: boolean) => ({
  isAdFree,
  purchaseTip: jest.fn(),
  restorePurchase: jest.fn(),
});

// Helper to render InlineAd with a given context value
const renderWithContext = (isAdFree: boolean) =>
  renderer.create(
    <AdFreeContext.Provider value={mockContext(isAdFree)}>
      <InlineAd />
    </AdFreeContext.Provider>
  );

describe('InlineAd', () => {
  it('renders the ad container when isAdFree is false', () => {
    const tree = renderWithContext(false).toJSON();
    expect(tree).not.toBeNull();
  });

  it('renders null when isAdFree is true', () => {
    const tree = renderWithContext(true).toJSON();
    expect(tree).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest app/ads/__tests__/InlineAd.test.tsx --watchAll=false
```

Expected: FAIL — test for `renders null when isAdFree is true` fails because `InlineAd` doesn't check context yet.

- [ ] **Step 3: Update InlineAd**

Replace the entire content of `app/ads/InlineAd.tsx`:

```typescript
import { View } from 'react-native';
import * as Device from 'expo-device';
import React, { useState } from 'react';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useAdFreeContext } from '@/contexts/ad-free-context';

const iosAdmobBanner = 'ca-app-pub-7252717983754109/7446508117';
const androidAdmobBanner = 'ca-app-pub-7252717983754109/7446508117';
const productionID =
  Device.osName === 'Android' ? androidAdmobBanner : iosAdmobBanner;

const InlineAd = () => {
  const { isAdFree } = useAdFreeContext();
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  if (isAdFree) return null;

  return (
    <View style={{ height: isAdLoaded ? 'auto' : 0 }}>
      <BannerAd
        unitId={__DEV__ ? TestIds.BANNER : productionID}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => setIsAdLoaded(true)}
      />
    </View>
  );
};

export default InlineAd;
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest app/ads/__tests__/InlineAd.test.tsx --watchAll=false
```

Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/ads/InlineAd.tsx app/ads/__tests__/InlineAd.test.tsx contexts/ad-free-context.tsx
git commit -m "feat: InlineAd returns null when user is ad-free"
```

---

## Task 7: Fix BottomDrawer safe area padding

**Files:**
- Modify: `app/(tabs)/other.tsx`

This is a standalone fix that benefits all existing drawers (language, feedback, disclaimer) and the upcoming coffee drawer.

- [ ] **Step 1: Add safe area insets to BottomDrawer**

In `app/(tabs)/other.tsx`, find the `BottomDrawer` function (line ~43). Add `useSafeAreaInsets` inside it:

```tsx
function BottomDrawer({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const insets = useSafeAreaInsets();   // ← add this line
```

Then in the `drawerContainer` style applied to `<Animated.View>`, replace the static style with an inline override:

```tsx
      <Animated.View
        style={[
          styles.drawerContainer,
          { paddingBottom: 36 + insets.bottom },   // ← override the static paddingBottom
          { transform: [{ translateY }] },
        ]}
      >
```

- [ ] **Step 2: Remove the now-redundant `paddingBottom` from the static style**

In the `StyleSheet.create` block at the bottom of the file, find `drawerContainer` and remove `paddingBottom: 36`:

```typescript
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0D1F3C',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    // paddingBottom removed — set dynamically with insets in BottomDrawer
    paddingTop: 12,
  },
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/other.tsx
git commit -m "fix: add safe area bottom inset to BottomDrawer so content clears nav bar"
```

---

## Task 8: Add CoffeeDrawer and Support list item

**Files:**
- Modify: `app/(tabs)/other.tsx`

- [ ] **Step 1: Add imports**

At the top of `app/(tabs)/other.tsx`, add to the react-native imports:

```typescript
import {
  StyleSheet,
  View,
  Linking,
  Animated,
  TouchableWithoutFeedback,
  Modal as RNModal,
  Dimensions,
  ScrollView,
  TouchableOpacity,   // ← add this
} from 'react-native';
```

Add to the react-native-paper imports:

```typescript
import {
  List,
  Divider,
  Surface,
  Button,
  Text,
  TextInput,
  HelperText,
  RadioButton,
  ActivityIndicator,   // ← add this
} from 'react-native-paper';
```

Add the context import after the existing context imports:

```typescript
import { useAdFreeContext } from '@/contexts/ad-free-context';
import { TIP_SKUS } from '@/hooks/useAdFree';
```

- [ ] **Step 2: Extend the openDrawer union type**

Find the `useState` for `openDrawer` in `OtherScreen` (around line 296) and update the type:

```typescript
  const [openDrawer, setOpenDrawer] = useState<
    'language' | 'feedback' | 'disclaimer' | 'coffee' | null
  >(null);
```

- [ ] **Step 3: Add the CoffeeDrawer component**

Add this component above `OtherScreen` (after `DisclaimerDrawer`):

```tsx
// ── Coffee drawer ────────────────────────────────────────────────────────────
type CoffeeState = 'idle' | 'purchasing' | 'success';

const CoffeeDrawer = memo(function CoffeeDrawer({
  visible,
  onClose,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  t: UIStrings;
}) {
  const { isAdFree, purchaseTip, restorePurchase } = useAdFreeContext();
  const [drawerState, setDrawerState] = useState<CoffeeState>('idle');
  const [error, setError] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');

  useEffect(() => {
    if (!visible) {
      setDrawerState('idle');
      setError('');
      setRestoreMsg('');
    }
  }, [visible]);

  const handlePurchase = async (sku: string) => {
    setDrawerState('purchasing');
    setError('');
    try {
      const result = await purchaseTip(sku);
      if (result === 'success') setDrawerState('success');
      else setDrawerState('idle');
    } catch (err) {
      setError(err as string);
      setDrawerState('idle');
    }
  };

  const handleRestore = async () => {
    setRestoreMsg('');
    try {
      const result = await restorePurchase();
      setRestoreMsg(
        result === 'success' ? t.miscCoffeeRestoreSuccess : t.miscCoffeeRestoreFail
      );
    } catch {
      setRestoreMsg(t.miscCoffeeRestoreFail);
    }
  };

  return (
    <BottomDrawer visible={visible} onClose={onClose}>
      {drawerState === 'success' ? (
        <View style={styles.coffeeSuccess}>
          <Text style={styles.coffeeSuccessEmoji}>🙏</Text>
          <Text style={styles.drawerTitle}>{t.miscCoffeeThankYouTitle}</Text>
          <Text style={styles.coffeeSuccessDesc}>{t.miscCoffeeThankYouDesc}</Text>
          <Button
            mode="contained"
            onPress={onClose}
            buttonColor="#128AFA"
            textColor="#FFFFFF"
            style={styles.coffeeDoneButton}
          >
            {t.miscCoffeeDone}
          </Button>
        </View>
      ) : (
        <>
          <Text style={styles.drawerTitle}>☕ {t.miscCoffeeDrawerTitle}</Text>
          <Text style={styles.coffeeDesc}>{t.miscCoffeeDrawerDesc}</Text>

          {isAdFree ? (
            <View style={styles.coffeeAlreadyOwned}>
              <Text style={styles.coffeeAlreadyOwnedText}>
                ✨ {t.miscCoffeeAlreadyOwned}
              </Text>
            </View>
          ) : (
            <>
              {drawerState === 'purchasing' ? (
                <View style={styles.coffeePurchasing}>
                  <ActivityIndicator color="#128AFA" />
                </View>
              ) : (
                <View style={styles.coffeeTierRow}>
                  {/* Small tier */}
                  <View style={[styles.coffeeTierCard, styles.coffeeTierCardSmall]}>
                    <Text style={styles.coffeeTierEmoji}>☕</Text>
                    <Text style={styles.coffeeTierPrice}>$2.99</Text>
                    <Text style={styles.coffeeTierLabel}>{t.miscCoffeeSmallLabel}</Text>
                    <Button
                      mode="contained"
                      onPress={() => handlePurchase(TIP_SKUS.SMALL)}
                      buttonColor="#128AFA"
                      textColor="#FFFFFF"
                      style={styles.coffeeTierButton}
                      labelStyle={styles.coffeeTierButtonLabel}
                    >
                      {t.miscCoffeeButton}
                    </Button>
                  </View>

                  {/* Large tier */}
                  <View style={[styles.coffeeTierCard, styles.coffeeTierCardLarge]}>
                    <View style={styles.coffeeBadgeContainer}>
                      <Text style={styles.coffeeBadge}>{t.miscCoffeeBadge}</Text>
                    </View>
                    <Text style={styles.coffeeTierEmoji}>🍗</Text>
                    <Text style={styles.coffeeTierPrice}>$5.99</Text>
                    <Text style={styles.coffeeTierLabel}>{t.miscCoffeeLargeLabel}</Text>
                    <Button
                      mode="contained"
                      onPress={() => handlePurchase(TIP_SKUS.LARGE)}
                      buttonColor="#128AFA"
                      textColor="#FFFFFF"
                      style={styles.coffeeTierButton}
                      labelStyle={styles.coffeeTierButtonLabel}
                    >
                      {t.miscCoffeeButton}
                    </Button>
                  </View>
                </View>
              )}

              {!!error && (
                <HelperText type="error" visible>
                  {error}
                </HelperText>
              )}

              <View style={styles.coffeeAdFreeNote}>
                <Text style={styles.coffeeAdFreeNoteText}>
                  ✨ {t.miscCoffeeAdFreeNote}
                </Text>
              </View>

              <Button
                mode="text"
                onPress={handleRestore}
                textColor="#128AFA"
                disabled={drawerState === 'purchasing'}
              >
                {t.miscCoffeeRestore}
              </Button>

              {!!restoreMsg && (
                <HelperText
                  type={restoreMsg === t.miscCoffeeRestoreSuccess ? 'info' : 'error'}
                  visible
                  style={styles.coffeeRestoreMsg}
                >
                  {restoreMsg}
                </HelperText>
              )}
            </>
          )}
        </>
      )}
    </BottomDrawer>
  );
});
```

- [ ] **Step 4: Add the Support list item in OtherScreen**

In the `OtherScreen` JSX, find the existing Support `<List.Section>` (around line 328) and add a new `List.Item` after the feedback item:

```tsx
        <List.Section>
          <List.Subheader>{t.miscSupport}</List.Subheader>
          <List.Item
            title={t.miscFeedbackItem}
            description={t.miscFeedbackItemDesc}
            left={(props) => (
              <List.Icon {...props} icon="message-text" color="#128AFA" />
            )}
            onPress={() => setOpenDrawer('feedback')}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title={t.miscCoffeeItem}
            description={t.miscCoffeeItemDesc}
            left={(props) => (
              <List.Icon {...props} icon="coffee" color="#128AFA" />
            )}
            onPress={() => setOpenDrawer('coffee')}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>
```

- [ ] **Step 5: Add CoffeeDrawer to the render output**

At the bottom of the `OtherScreen` return, after `<DisclaimerDrawer ... />`, add:

```tsx
      <CoffeeDrawer
        visible={openDrawer === 'coffee'}
        onClose={close}
        t={t}
      />
```

- [ ] **Step 6: Add the new styles**

In the `StyleSheet.create` block, add these entries at the end (before the closing `}`):

```typescript
  // Coffee drawer
  coffeeDesc: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    marginBottom: 20,
  },
  coffeeTierRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  coffeeTierCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  coffeeTierCardSmall: {
    backgroundColor: 'rgba(18,138,250,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(18,138,250,0.25)',
  },
  coffeeTierCardLarge: {
    backgroundColor: 'rgba(18,138,250,0.15)',
    borderWidth: 2,
    borderColor: '#128AFA',
    paddingTop: 20,
  },
  coffeeBadgeContainer: {
    position: 'absolute',
    top: -11,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  coffeeBadge: {
    backgroundColor: '#128AFA',
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 99,
    overflow: 'hidden',
  },
  coffeeTierEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  coffeeTierPrice: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  coffeeTierLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 10,
  },
  coffeeTierButton: {
    width: '100%',
    borderRadius: 8,
  },
  coffeeTierButtonLabel: {
    fontSize: 13,
  },
  coffeePurchasing: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coffeeAdFreeNote: {
    backgroundColor: 'rgba(18,138,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(18,138,250,0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 4,
  },
  coffeeAdFreeNoteText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  coffeeRestoreMsg: {
    textAlign: 'center',
  },
  coffeeAlreadyOwned: {
    backgroundColor: 'rgba(18,138,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(18,138,250,0.2)',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  coffeeAlreadyOwnedText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    textAlign: 'center',
  },
  coffeeSuccess: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  coffeeSuccessEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  coffeeSuccessDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  coffeeDoneButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
  },
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If there are missing import errors for `memo`, `useEffect`, `useState` — confirm they are in the existing imports at the top of `other.tsx` (`memo`, `useRef`, `useState`, `useEffect` are all already imported).

- [ ] **Step 8: Run the full test suite**

```bash
npx jest --watchAll=false
```

Expected: all tests pass (the 5 hook tests + 2 InlineAd tests).

- [ ] **Step 9: Commit**

```bash
git add app/(tabs)/other.tsx
git commit -m "feat: add Buy Me a Coffee drawer with Google Play IAP tiers"
```

---

## Task 9: Play Console setup (manual — outside code)

This task cannot be automated. You must complete it before testing purchases on a real device.

- [ ] **Step 1: Create products in Play Console**

In [Google Play Console](https://play.google.com/console) → your app → **Monetize** → **Products** → **In-app products**:

1. Create product: ID = `tip_kopi_ice`, Price = USD $2.99, Status = Active
2. Create product: ID = `tip_chicken_rice`, Price = USD $5.99, Status = Active

- [ ] **Step 2: Add a tester account**

Under **Setup** → **License testing**, add your Google account as a tester. Testers can make test purchases without being charged.

- [ ] **Step 3: Publish to internal testing track**

The app must be published to at least the internal testing track for IAP to work. Upload a signed APK/AAB built with `eas build --profile production --platform android`, then promote it to internal testing.

---

## Post-implementation Checklist

- [ ] On a real device (not emulator): tap "Buy Me a Coffee", purchase $2.99 tier, confirm Play billing sheet appears, purchase completes, ads disappear, thank-you screen shows
- [ ] Reinstall the app, open Misc tab, verify ads are gone (AsyncStorage cache)
- [ ] Tap "Restore Purchase", confirm it silently restores without repurchase prompt
- [ ] Switch language to ZH, KO, JA and confirm drawer strings are correct
- [ ] Verify all existing drawers (language, feedback, disclaimer) have adequate bottom padding on a phone with gesture nav bar
