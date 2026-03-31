# Banner Page UI Modernization

**Date:** 2026-04-01
**Scope:** `app/(tabs)/banner.tsx` only
**Theme:** Preserve existing Blue Archive color palette (`#0A1628`, `#128AFA`, `BAColors`)

---

## Problem

Three specific pain points with the current banner page:

1. **Accordion layout is clunky** — `List.Accordion` from React Native Paper creates a visual disconnect: the type chip/badges live outside the accordion header while the title/image live inside. Hard to scan at a glance.
2. **Banner cards are plain/boxy** — flat dark rectangles with no visual hierarchy or depth.
3. **Filter/search area is cramped** — searchbar, sort button, and filter chips float loosely with no cohesive grouping.

---

## Design

### 1. Filter Bar — Frosted Glass Panel

Replace the current loose `filterSection` view with a unified frosted-glass surface panel.

- **Background:** `rgba(10, 22, 40, 0.85)`
- **Border:** 1px `rgba(18, 138, 250, 0.12)`, `borderRadius: 16`
- **Padding:** 12px all sides, gap 10 between rows
- **Row 1:** Full-width `Searchbar` (unchanged styling)
- **Row 2:** Sort button (left) + horizontally scrollable filter chips (right), same row, contained within the panel

The panel provides a clear visual boundary so the search/sort/chips read as one cohesive control group.

### 2. Banner Card — Collapsed State

Replace `Card` + `List.Accordion` with a custom collapsible built on `Pressable` + `Animated`.

**Card surface:**
- Background: `rgba(15, 35, 71, 0.85)`
- Border: 1px `rgba(18, 138, 250, 0.18)`, `borderRadius: 16`
- Active banner override: 2px `#128AFA` border + `shadowColor: #128AFA`, `shadowOpacity: 0.3`, `shadowRadius: 12`

**Layout (top to bottom):**

1. **Badge row** (`paddingHorizontal: 14`, `paddingTop: 12`, `paddingBottom: 8`):
   - Left: `BannerTypeChip` (unchanged colors)
   - Right: LIVE badge OR countdown badge (existing components, unchanged)

2. **Info row** (`paddingHorizontal: 14`, `paddingBottom: 10`):
   - Banner title: first character name + banner type label, `fontSize: 16`, `fontWeight: 700`, white
   - Date range: below title, `fontSize: 12`, `color: rgba(255,255,255,0.45)`

3. **Preview row** (`paddingHorizontal: 14`, `paddingBottom: 14`):
   - Left: Overlapping portrait strip (details below)
   - Right: Chevron icon (`▼`), rotates 180° when expanded, `color: #94A3B8`

**Portrait strip:**
- Show up to 3 circular avatars, each 56×56, `borderRadius: 28`
- Each avatar offset left by 18px from the previous (overlapping)
- Border: 2px `rgba(18, 138, 250, 0.35)`
- If `characters.length > 3`: render a `+N` circle (same size/style as avatars) with `backgroundColor: rgba(18, 138, 250, 0.2)`, text `+N` in `#128AFA`
- Total strip width is contained; does not push the chevron off-screen

### 3. Banner Card — Expanded State

Tap anywhere on the collapsed card to toggle expansion. Use existing `Animated.Value` spring pattern already in the file.

**Separator:** 1px horizontal line, `rgba(18, 138, 250, 0.12)`, between the collapsed preview and the character list.

**Character list container:**
- Background: `rgba(10, 22, 40, 0.9)` (slightly darker than card, creates nesting depth)
- `padding: 12`, `gap: 12`

**Character card refresh (minor):**
- Image: 100×100 (up from 90×90)
- Image border: 2px `rgba(18, 138, 250, 0.4)` (slightly more visible glow)
- Card background: `rgba(10, 22, 40, 0.85)`
- All other content (name, atk/def chips, class badge, NEW/LIMITED overlays) unchanged

---

## What Does NOT Change

- All colors: `BAColors`, `typeColor`, badge colors (red/yellow/purple/gray)
- All data logic: fetch, filter, sort, search, locale
- `BannerTypeChip`, `CharacterClassBadge`, `CustomChip` components
- `InlineAd` placement
- `AnimatedCard` spring press animation (reused on character cards)
- `renderCharacterCard` logic — only style tweaks to image size and card bg

---

## Files Changed

- `app/(tabs)/banner.tsx` — layout restructure + style updates only. No logic changes.

---

## Out of Scope

- No new components or files
- No changes to routing, data fetching, or i18n
- No changes to other screens
