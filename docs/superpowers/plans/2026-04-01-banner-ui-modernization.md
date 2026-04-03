# Banner UI Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize `app/(tabs)/banner.tsx` with a frosted-glass filter panel, glassmorphism banner cards with portrait-strip previews, and a polished expanded character list — preserving all data logic and colors.

**Architecture:** Pure layout/style changes to one file. Replace `List.Accordion` with a custom `Pressable` + `Animated` collapsible. Replace the loose filter section with a unified frosted panel. No new files, no logic changes.

**Tech Stack:** React Native, Expo Router, React Native Paper (Searchbar, Menu, Chip, Button, ActivityIndicator only), `Animated` API

---

## File Map

| File | Change |
|------|--------|
| `app/(tabs)/banner.tsx` | Replace filterSection layout, replace banner card accordion with custom collapsible, add portrait strip, refresh character card styles |

---

### Task 1: Frosted-Glass Filter Panel

Replace the current loose `ThemedView filterSection` with a single frosted-glass `View` panel that wraps Searchbar + sort row together.

**Files:**
- Modify: `app/(tabs)/banner.tsx`

- [ ] **Step 1: Replace the filterSection JSX**

Find this block in the JSX (around line 411–488):

```tsx
{/* Search and Filter Section */}
<ThemedView style={styles.filterSection}>
  <Searchbar
    placeholder={t.searchPlaceholder}
    onChangeText={setSearchQuery}
    value={searchQuery}
    style={styles.searchBar}
    inputStyle={styles.searchInput}
    iconColor="#128AFA"
  />

  <ThemedView style={styles.filterRow}>
    <Menu
      visible={showSortMenu}
      onDismiss={() => setShowSortMenu(false)}
      anchor={
        <Button
          mode="outlined"
          onPress={() => setShowSortMenu(true)}
          icon="sort"
          style={styles.sortButton}
          labelStyle={styles.sortButtonLabel}
        >
          {t.sortButton}
        </Button>
      }
      contentStyle={styles.menuContent}
    >
      <Menu.Item
        onPress={() => {
          setSortOption("date-asc");
          setShowSortMenu(false);
        }}
        title={t.sortEarliest}
      />
      <Menu.Item
        onPress={() => {
          setSortOption("date-desc");
          setShowSortMenu(false);
        }}
        title={t.sortLatest}
      />
    </Menu>

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterChips}
      contentContainerStyle={styles.filterChipsContent}
    >
      {(
        [
          { type: "All" as FilterType, label: t.filterAll },
          { type: "New" as FilterType, label: t.filterNew },
          { type: "Rerun" as FilterType, label: t.filterRerun },
          { type: "Fes" as FilterType, label: t.filterFes },
          { type: "Collab" as FilterType, label: t.filterCollab },
        ]
      ).map(({ type, label }) => (
        <Chip
          key={type}
          selected={filterType === type}
          selectedColor="#0F172A"
          onPress={() => setFilterType(type)}
          style={[
            styles.filterChip,
            filterType === type && styles.selectedFilterChip,
          ]}
          textStyle={[
            styles.filterChipText,
            filterType === type && styles.selectedFilterChipText,
          ]}
        >
          {label}
        </Chip>
      ))}
    </ScrollView>
  </ThemedView>
</ThemedView>
```

Replace with:

```tsx
{/* Search and Filter Section */}
<View style={styles.filterPanel}>
  <Searchbar
    placeholder={t.searchPlaceholder}
    onChangeText={setSearchQuery}
    value={searchQuery}
    style={styles.searchBar}
    inputStyle={styles.searchInput}
    iconColor="#128AFA"
  />

  <View style={styles.filterRow}>
    <Menu
      visible={showSortMenu}
      onDismiss={() => setShowSortMenu(false)}
      anchor={
        <Button
          mode="outlined"
          onPress={() => setShowSortMenu(true)}
          icon="sort"
          style={styles.sortButton}
          labelStyle={styles.sortButtonLabel}
        >
          {t.sortButton}
        </Button>
      }
      contentStyle={styles.menuContent}
    >
      <Menu.Item
        onPress={() => {
          setSortOption("date-asc");
          setShowSortMenu(false);
        }}
        title={t.sortEarliest}
      />
      <Menu.Item
        onPress={() => {
          setSortOption("date-desc");
          setShowSortMenu(false);
        }}
        title={t.sortLatest}
      />
    </Menu>

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterChips}
      contentContainerStyle={styles.filterChipsContent}
    >
      {(
        [
          { type: "All" as FilterType, label: t.filterAll },
          { type: "New" as FilterType, label: t.filterNew },
          { type: "Rerun" as FilterType, label: t.filterRerun },
          { type: "Fes" as FilterType, label: t.filterFes },
          { type: "Collab" as FilterType, label: t.filterCollab },
        ]
      ).map(({ type, label }) => (
        <Chip
          key={type}
          selected={filterType === type}
          selectedColor="#0F172A"
          onPress={() => setFilterType(type)}
          style={[
            styles.filterChip,
            filterType === type && styles.selectedFilterChip,
          ]}
          textStyle={[
            styles.filterChipText,
            filterType === type && styles.selectedFilterChipText,
          ]}
        >
          {label}
        </Chip>
      ))}
    </ScrollView>
  </View>
</View>
```

- [ ] **Step 2: Replace filterSection styles with filterPanel**

In `StyleSheet.create`, find and replace the `filterSection` style:

```ts
// REMOVE this:
filterSection: {
  marginBottom: 24,
  gap: 12,
},

// ADD this:
filterPanel: {
  marginBottom: 24,
  backgroundColor: "rgba(10, 22, 40, 0.85)",
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "rgba(18, 138, 250, 0.12)",
  padding: 12,
  gap: 10,
},
```

Also update `filterRow` to remove `ThemedView` dependency — it's now a plain `View` style, which it already is:
```ts
filterRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
},
```

- [ ] **Step 3: Verify the app compiles and the filter panel renders as a contained frosted box**

Run: `npx expo start` and open on device/simulator. The search bar + sort + chips should appear inside a single dark rounded panel.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/banner.tsx
git commit -m "feat: frosted-glass filter panel for banner page"
```

---

### Task 2: Portrait Strip Component

Add an inline `PortraitStrip` component (defined inside `banner.tsx`) that shows overlapping circular character avatars.

**Files:**
- Modify: `app/(tabs)/banner.tsx`

- [ ] **Step 1: Add the PortraitStrip component above `FutureBannerScreen`**

Insert this after the `BannerTypeChip` component (around line 142) and before `export default function FutureBannerScreen`:

```tsx
const PortraitStrip = ({ characters }: { characters: Character[] }) => {
  const visible = characters.slice(0, 3);
  const overflow = characters.length - 3;

  return (
    <View style={portraitStyles.strip}>
      {visible.map((char, index) => (
        <Image
          key={char.id}
          source={{ uri: char.image }}
          style={[
            portraitStyles.avatar,
            { marginLeft: index === 0 ? 0 : -18 },
          ]}
        />
      ))}
      {overflow > 0 && (
        <View style={[portraitStyles.avatar, portraitStyles.overflowCircle, { marginLeft: -18 }]}>
          <Text style={portraitStyles.overflowText}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
};

const portraitStyles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(18, 138, 250, 0.35)",
    backgroundColor: "#0F2347",
  },
  overflowCircle: {
    backgroundColor: "rgba(18, 138, 250, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  overflowText: {
    color: "#128AFA",
    fontSize: 13,
    fontWeight: "700",
  },
});
```

- [ ] **Step 2: Add `Text` to the import from `react-native`**

At the top of the file, find:
```tsx
import {
  StyleSheet,
  Image,
  View,
  ScrollView,
  Animated,
  Pressable,
} from "react-native";
```

Replace with:
```tsx
import {
  StyleSheet,
  Image,
  View,
  ScrollView,
  Animated,
  Pressable,
  Text,
} from "react-native";
```

- [ ] **Step 3: Verify compile — no errors**

Run: `npx expo start` — confirm no TypeScript/runtime errors. The component isn't rendered anywhere yet so no visual change.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/banner.tsx
git commit -m "feat: add PortraitStrip component for banner preview"
```

---

### Task 3: Custom Collapsible Banner Card

Replace the `Card` + `List.Accordion` banner rendering with a custom collapsible using `Pressable` + `Animated`, incorporating the portrait strip and new 3-row layout.

**Files:**
- Modify: `app/(tabs)/banner.tsx`

- [ ] **Step 1: Replace the banner map JSX**

Find the `{/* Banners List */}` block (around line 491–577) and replace it entirely:

```tsx
{/* Banners List */}
<View style={styles.bannerList}>
  {filteredAndSortedBanners.map((banner) => {
    const daysUntil = getDaysUntil(banner.startDate);
    const isActive =
      daysUntil <= 0 && getDaysUntil(banner.endDate) > 0;
    const isExpanded = expandedBanner === banner.id;

    return (
      <AnimatedCard
        key={banner.id}
        style={styles.bannerCardWrapper}
        onPress={() =>
          setExpandedBanner(isExpanded ? null : banner.id)
        }
      >
        <View
          style={[
            styles.bannerCard,
            isActive && styles.activeBannerCard,
          ]}
        >
          {/* Badge Row */}
          <View style={styles.bannerBadgeRow}>
            <View style={styles.bannerBadgeLeft}>
              <BannerTypeChip type={banner.type} />
              {isActive && (
                <View style={styles.liveBadge}>
                  <ThemedText style={styles.liveBadgeText}>
                    LIVE
                  </ThemedText>
                </View>
              )}
              {daysUntil > 0 && (
                <View style={styles.countdownBadge}>
                  <ThemedText style={styles.countdownText}>
                    {daysUntil}d
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Info Row */}
          <View style={styles.bannerInfoRow}>
            <Text style={styles.bannerTitle} numberOfLines={2}>
              {banner.characters.length > 0
                ? `${getCharacterName(banner.characters[0], locale)} — ${banner.type} ${t.bannerSuffix}`
                : `${banner.type} ${t.bannerSuffix}`}
            </Text>
            <Text style={styles.bannerDateRange}>
              {formatDate(banner.startDate)} – {formatDate(banner.endDate)}
            </Text>
          </View>

          {/* Preview Row */}
          <View style={styles.bannerPreviewRow}>
            <PortraitStrip characters={banner.characters} />
            <View
              style={[
                styles.bannerChevron,
                isExpanded && styles.bannerChevronExpanded,
              ]}
            >
              <Text style={styles.bannerChevronText}>▼</Text>
            </View>
          </View>

          {/* Expanded Character List */}
          {isExpanded && (
            <>
              <View style={styles.expandDivider} />
              <View style={styles.charactersContainer}>
                {banner.characters.map(renderCharacterCard)}
              </View>
            </>
          )}
        </View>
      </AnimatedCard>
    );
  })}
</View>
```

- [ ] **Step 2: Add new banner card styles to `StyleSheet.create`**

Replace the existing `bannerCard`, `bannerHeader`, `bannerInfo`, `accordionHeader`, `accordionTitle`, `accordionDescription`, `accordionImageContainer`, `accordionCharacterImage`, `accordionArrow`, `accordionArrowExpanded`, `accordionArrowText` styles with:

```ts
bannerCard: {
  overflow: "hidden",
  borderRadius: 16,
  backgroundColor: "rgba(15, 35, 71, 0.85)",
  borderWidth: 1,
  borderColor: "rgba(18, 138, 250, 0.18)",
},
activeBannerCard: {
  borderColor: "#128AFA",
  borderWidth: 2,
  shadowColor: "#128AFA",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 8,
},
bannerBadgeRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 14,
  paddingTop: 12,
  paddingBottom: 8,
},
bannerBadgeLeft: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},
bannerInfoRow: {
  paddingHorizontal: 14,
  paddingBottom: 10,
  gap: 4,
},
bannerTitle: {
  color: "#FFFFFF",
  fontSize: 16,
  fontWeight: "700",
},
bannerDateRange: {
  color: "rgba(255,255,255,0.45)",
  fontSize: 12,
},
bannerPreviewRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 14,
  paddingBottom: 14,
},
bannerChevron: {
  justifyContent: "center",
  alignItems: "center",
  transform: [{ rotate: "0deg" }],
},
bannerChevronExpanded: {
  transform: [{ rotate: "180deg" }],
},
bannerChevronText: {
  color: "#94A3B8",
  fontSize: 12,
},
expandDivider: {
  height: 1,
  backgroundColor: "rgba(18, 138, 250, 0.12)",
  marginHorizontal: 0,
},
```

Also update `charactersContainer`:
```ts
charactersContainer: {
  gap: 12,
  padding: 12,
  backgroundColor: "rgba(10, 22, 40, 0.9)",
},
```

- [ ] **Step 3: Remove now-unused `List` import**

`List.Accordion` is gone but `Card`/`Card.Content` are still used inside `renderCharacterCard`. Only remove `List`. Find:

```tsx
import {
  Card,
  Chip,
  Surface,
  List,
  Searchbar,
  Menu,
  Button,
  ActivityIndicator,
} from "react-native-paper";
```

Replace with:

```tsx
import {
  Card,
  Chip,
  Surface,
  Searchbar,
  Menu,
  Button,
  ActivityIndicator,
} from "react-native-paper";
```

- [ ] **Step 4: Verify the app renders banner cards correctly**

Run: `npx expo start`. Banners should show:
- Badge row with type chip + countdown/LIVE at top
- Title + date range in info row
- Overlapping portrait circles + chevron at bottom
- Tapping a card expands to show character list with divider

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/banner.tsx
git commit -m "feat: replace accordion with custom collapsible banner card + portrait strip"
```

---

### Task 4: Character Card Style Refresh

Update the expanded character cards to use a larger image and slightly more prominent border glow.

**Files:**
- Modify: `app/(tabs)/banner.tsx`

- [ ] **Step 1: Update characterImage style**

In `StyleSheet.create`, find:

```ts
characterImage: {
  width: 90,
  height: 90,
  borderRadius: 16,
  borderWidth: 2,
  borderColor: "rgba(148, 163, 184, 0.3)",
},
```

Replace with:

```ts
characterImage: {
  width: 100,
  height: 100,
  borderRadius: 16,
  borderWidth: 2,
  borderColor: "rgba(18, 138, 250, 0.4)",
},
```

- [ ] **Step 2: Update characterCard style**

Find:

```ts
characterCard: {
  backgroundColor: "#0F2347",
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "rgba(18, 138, 250, 0.18)",
},
```

Replace with:

```ts
characterCard: {
  backgroundColor: "rgba(10, 22, 40, 0.85)",
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "rgba(18, 138, 250, 0.18)",
},
```

- [ ] **Step 3: Verify character cards look correct when expanded**

Run: `npx expo start`. Tap a banner to expand it. Character images should be slightly larger (100×100) with a blue-tinted border glow. Card backgrounds should read as darker/nested compared to the banner card.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/banner.tsx
git commit -m "feat: refresh character card image size and glow border"
```

---

### Task 5: Clean Up Dead Styles

Remove leftover styles from the old accordion/filterSection layout that are no longer referenced.

**Files:**
- Modify: `app/(tabs)/banner.tsx`

- [ ] **Step 1: Remove dead style entries from `StyleSheet.create`**

Remove these style keys (they are no longer referenced after Tasks 1–4):

- `backgroundPattern` — the `<View style={styles.backgroundPattern} />` in JSX is also unused; remove the JSX element too
- `filterSection`
- `accordionHeader`
- `accordionTitle`
- `accordionDescription`
- `accordionImageContainer`
- `accordionCharacterImage`
- `accordionArrow`
- `accordionArrowExpanded`
- `accordionArrowText`
- `charactersTitle`

Also remove the `<View style={styles.backgroundPattern} />` JSX line near the top of the return (right after `<ParallaxScrollView ...>`).

- [ ] **Step 2: Run lint to confirm no remaining unused references**

```bash
npm run lint
```

Expected: no errors related to banner.tsx. If any style is flagged as unused, remove it.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/banner.tsx
git commit -m "chore: remove dead styles from banner page refactor"
```
