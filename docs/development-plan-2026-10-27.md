# Blue Archive 2.0 completion plan

> Workers use subagent-driven development with explicit file ownership, behavioral tests, and independent review. The user has asked to finish development using Sol under Astra coordination. Work directly on master; preserve Claude's changes. Do not deploy as part of development acceptance.

**Goal:** Complete the approved Schale Field Tablet rebuild, including its useful game tools and backoffice support, and verify the integrated app.

**Architecture:** Keep Expo Router and React Native Paper infrastructure, with the custom Schale visual system and normalized cached data providers. User data stays local. Firebase remains editorial/schedule authority; SchaleDB remains game-fact authority. Backoffice changes remain additive for older app versions.

**Tech stack:** Expo SDK 53, React Native, TypeScript, Reanimated, existing Expo notifications/IAP/ads packages; React/Vite/Firebase backoffice. No unnecessary new packages.

## Acceptance baseline

The binding feature/design details and per-screen preservation rules are in `docs/superpowers/specs/2026-10-24-v2-design.md`, `2026-10-24-v2-visual-research.md`, and `2026-10-24-v2-ui-inventory.md`. The previous audit is `docs/rebuild-status-2026-10-27.md`.

## Work packages

- [x] A. Shared UI and navigation: complete `components/schale/`, map Paper's fonts/palette, mount providers, build CommandDeck, move routes to the approved structure, create Tools hub. Preserve old screen math until their dedicated pass. Tests focus on interactions/data behavior; visual controls are checked in-browser.
- [x] B. Gacha suite: `services/gacha/`, planner calculation helpers, `/tools/planner`, `/tools/gacha`, `/tools/ap`, localized strings. Test ticket conversion, dated income, future targets, spark/charge thresholds and pools, migration/undo/reset, AP regeneration. Store user inputs safely after hydration. Expose editable estimates, never guaranteed future rewards.
- [x] C. Backoffice completion: finish weekly workflow/runtime/cache setup, fix lint, add tests for schedule/reconciliation/chunked writes/official notices, verify schema compatibility and build. No production writes.
- [x] D. Home and Banners: build the Lobby, live events/raids/recruiting, reset capsules, watched targets, MomoTalk student, and a cached banner timeline with correct rotation times/calendar links. Preserve ad cadence and fallback images. Localize all visible copy.
- [x] E. Students: virtualized Browse/Register tab, filters, ownership/stars, collection stats, import/export, detailed student dossier, watch/own toggles and calculator links. Keep missing-student handling and fallback imagery.
- [x] F. Calculators: restyle bond/level/eleph/skill/raid using shared controls; repair drag/hold input behavior; connect shared inventory. Keep existing formulas/ranges and explicit-action interstitial gating. Add regression tests only where logic is extracted/changed.
- [x] G. Sensei, birthdays and reminders: finish theme previews, language/support/data/privacy settings, birthday calendar, localized missing-page state; add tested local-notification planner/reconciler, permission handling, web stubs and Android native metadata/resources.
- [x] H. Integrate and review: verify requirement coverage, independent code review and fixes, all tests/type/lint checks, web/native bundling, visual checks at narrow/wide widths and in light/dark/CJK settings. Document any device-only limits explicitly.

## Ownership and ordering

Start A, B, C on non-overlapping files. A owns root/tabs/shared controls and route movement except gacha, which belongs to B. B owns only its three routes, gacha/planner services and strings. C touches only the backoffice repository. After A completes, assign D/E/F against its published component API. G owns notification wiring; root integration changes are coordinated. Only Astra starts preview servers or performs browser checks.

## Verification commands

App: `npm run lint:colors`; `npx tsc --noEmit`; `npx jest --watchAll=false --runInBand --cacheDirectory node_modules/.cache/codex-audit-jest`; `npm run lint`; `npx expo export --platform web --output-dir dist/development-review`.

Backoffice: `npm test`; `npm run build`; `npm run lint`. Dry-run sync may read live public data but must not apply changes.

## Completion rules

- No placeholder features, inert buttons, fake live data, English copies masquerading as translations, or generic template dashboard replacement.
- Test calculations, hydration/migration, schedules, and failure paths. Honor reduced motion, theme tokens, safe areas, and minimum touch targets.
- Review the final working tree, preserve prior user/Claude changes, and keep source/native configuration coherent.
- Deployment readiness is separate from development completion; verify device-dependent purchases, ads and notifications before claiming a production-ready release.

## Final development checkpoint — 2026-10-30

Packages A–H are implemented and reviewed in the local working trees. See `docs/development-completion-2026-10-30.md` for the final scope, screenshots, evidence and release limitations. This replaces the interrupted baseline with five app test failures; those failures and subsequent review findings have been fixed.

- App: TypeScript, color lint, 43 Jest suites / 817 tests / 1 snapshot pass. ESLint has 0 errors and 3 test-only import warnings.
- Android arm64 debug compilation passes. Combined Android Hermes and web production export passes, including 23 static web routes.
- Backoffice: final independent rerun passes all 80 tests, lint and production build. Existing large-bundle advisory remains.
- Browser checks cover Home, planner budgeting, student registration/dossier navigation, the authenticated backoffice dashboard/board, and narrow light/CJK tools/calculator/reminders views. Five screenshots are saved in `docs/review/`.
- Final backoffice sync selection/lifecycle fixes passed automated checks; the protected browser Apply flow was not exercised against production records.
- Version metadata is aligned to 2.0.0. Both repositories remain on master with uncommitted changes preserved. No deployment, store submission or live data write was performed.
- Real-device ads, purchases/restore, notifications and signed-release smoke testing remain release gates; development acceptance does not assert production readiness.
