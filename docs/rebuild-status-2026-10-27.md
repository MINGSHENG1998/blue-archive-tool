# Blue Archive 2.0 rebuild checkpoint

> Historical audit. The current implementation status is in [the October 30 development handoff](development-completion-2026-10-30.md).

Checked on 2026-10-27 (Asia/Kuala_Lumpur). Astra coordinated; two Sol agents audited the app and backoffice. This checkpoint compares the working trees with Claude's approved `docs/superpowers/specs/2026-10-24-v2-design.md` and its companion research/audit files.

## Release decision

**The complete 2.0 rebuild is not ready for deployment.** The app is at the foundation/integration stage. The backoffice is substantially implemented but has unfinished workflow and verification work. No production deployment, store submission, Firestore mutation, commit, or branch change was performed during this audit.

Preserve the existing local work in both repositories. Do not reset either checkout or assume everything is available from GitHub.

## App: C:/project/blue-archive-tool

On `master` at `06c864a` (`feat: SchaleDB game-data layer and Phase 1 screens`), one commit ahead of the locally recorded `origin/master`, with extensive additional uncommitted/untracked 2.0 work. The remote-tracking ref was not refreshed during this audit.

### Present

- Eight-theme tokens, contrast coverage, Saira typography, motion constants, and partial `components/schale` primitives.
- Shared AppCard, ScreenLayout, and StackScreenHeader restyling.
- Expanded game-data snapshot/cache, student profile/terrain fields, raids and live-data helpers.
- Banner normalization/cache, app-config services, and local watchlist/roster/AP/inventory storage with tests.
- Web stubs for native ads/purchases.

### Still missing or disconnected

- `app/_layout.tsx` does not mount `AppDataProviders` or `SparkProvider`; the new data hooks have no screen consumers.
- Tabs still use Home/Banner/Bond Exp/Chara Builder/Misc. Students/Tools/Sensei navigation, CommandDeck, and the planned route migration are absent.
- Planner, AP timer, reminders, notification planning/reconciliation, and native notification configuration are absent. Planner currently has only a storage helper.
- Home remains the old layout and illustration. Students still uses a nonvirtualized mapped list in a ScrollView rather than the planned register/browser.
- Gacha tracker still uses the old session format and has no recruitment-charge model.
- Banner screen still reads Firestore directly and interprets date-only values at midnight. The new service's 02:00 UTC rotation handling is not connected.
- Shared controls such as SlantSegmented, FilterPill, SearchField, BottomSheet, NumberHero, Capsule, EmptyState, Skeleton, and the component barrel remain absent.
- Full screen localization, visual acceptance, and native release smoke testing remain to be completed.

### Validation and small repairs

| Check | Result |
|---|---|
| `npm run lint:colors` | Passed |
| `npx tsc --noEmit` | Passed after the two type repairs below |
| `npx jest --watchAll=false --runInBand --cacheDirectory node_modules/.cache/codex-audit-jest` | 29 suites, 564 tests, 1 snapshot passed; exit 0 |
| `npm run lint` | Exit 0; 18 warnings remain |
| Web export | Passed; 20 static routes in ignored `dist/status-audit-web` |

The default Jest temp-cache location was inaccessible in this environment, so the test run used a workspace cache. A successful web export verifies bundling only; no visual/device acceptance or native production build was performed.

This audit made only these narrow source/test repairs:

1. `components/ExternalLink.tsx`: use Expo Router's external-URL type.
2. `components/ui/IconSymbol.tsx`: use TextStyle for the fallback text-based icon.
3. `components/__tests__/ThemedText-test.tsx` and its snapshot: render/unmount inside `act`, assert a non-null render, and replace an invalid `null` snapshot with the actual Text tree.

All pre-existing Claude work was retained. The fixes remain uncommitted for integration with that work.

## Backoffice: C:/project/personal-backoffice-react

On `master` at `d1dbb2d`, with 28 tracked files modified plus new rebuild files. No source edits were made there during this audit.

| Area | Status |
|---|---|
| BO-A: schedule board | Implemented: exclusive date chaining, UTC helpers, ordering, runway/health warnings, live comparison, accessible actions, member reorder, guarded writes, dashboard health. Schedule regression tests still missing. |
| BO-B: sync engine | Implemented: metadata derivation, CompositeArmor, student-ID matching, live/official-notice reconciliation, chunked writes, embedded-copy propagation, stale-isNew clearing, run-status/history generation. Workflow modernization and engine tests still missing. |
| BO-C: admin | Implemented: App Config editor, student picker/filter/delete protection/bulk clear, translation race fixes, route scoping and 404. Authenticated save flows still need smoke testing. |

### Validation

- `npm test`: 25/25 passed across three BO-C helper test files.
- `npm run build`: passed, with a bundle-size warning.
- `npm run lint`: failed with 9 errors and 8 warnings. The changed BA code has irregular whitespace at `src/lib/ba-sync/notices.ts:148`; remaining errors are outside the changed BA files.
- `npm run ba-sync -- --dry`: passed using public reads only. Observed 11 banners and 160 characters; proposed no new banners or date shifts, but would clear 14 stale `isNew` flags. Nothing was applied.
- Live schedule already includes the corrected October 27-November 3 banner and Misaki (Swimsuit), and has a continuous curated runway through February 9, 2027.
- `appConfig/app`, `syncRuns/latest`, and `syncConfig/ba` were absent. Optional config defaults handle absence; sync operational health is not yet populated.

`.github/workflows/ba-sync.yml` still uses twice-monthly scheduling, Node 20, actions v4, and `npm install`. The approved scope calls for weekly Tuesday reconciliation, the newer runtime/actions, and `npm ci` with caching.

## Deployment state checked directly

- Expo access works. Latest listed Android production build is **1.2.2, build 61**, completed July 24, 2026, from commit `6dd804d`. No 2.0 build was found. A successful EAS build does not prove Google Play publication; Play publication was not checked.
- Build record: https://expo.dev/accounts/ms_oldhorse/projects/blue-archive-tool/builds/96bbb6f4-1420-4801-81e9-081b72eb18db
- Firebase access works for both hosting projects.
- Backoffice target: `personal-backoffice-ms`, https://personal-backoffice-ms.web.app; latest live hosting release October 2, 2026 at 10:13 MYT.
- App asset target: `blue-archive-tool`, https://blue-archive-tool.web.app; latest live hosting release October 2, 2026 at 09:25 MYT. This site's configured content is the student-icon mirror, not the Android app or exported app website.
- Backoffice deployment must be scoped to hosting: its checked-in Firestore rules belong to the separate gacha-calendar project. Do not publish those rules to the Blue Archive database or indiscriminately deploy all Firebase resources.

## Resume order

1. Finish the shared UI components, navigation, root provider integration, and Paper theme mapping.
2. Implement the approved Home/Banners/Students/Tools/Sensei screens, planner, AP timer, recruitment-charge tracker, and reminders, preserving calculator math and ad/purchase contracts.
3. Finish backoffice workflow changes; add schedule/sync regression coverage; resolve lint errors and verify authenticated saves with controlled test data.
4. Run visual checks across themes/locales, offline/error flows, and Android native checks (ads, purchases, notifications, deep links).
5. Refresh bundled data/icons as required; prepare version/config changes; verify and commit coherent app/backoffice releases directly on master.
6. Publish the backoffice hosting build and any asset updates to their explicit targets, build Android with the existing EAS production profile, and verify the actual release artifact before store submission.

The user's deployment condition was completion of the app. That condition is not met, so deployment was deferred on evidence, not because deployment credentials were unavailable.
