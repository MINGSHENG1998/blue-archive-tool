# Blue Archive Tool 2.0 development handoff

Updated 2026-10-30, Asia/Kuala_Lumpur. Astra coordinated Sol implementation and independent reviews. This supersedes the October 27 audit's implementation status.

## Current status

The approved Schale Field Tablet rebuild is implemented in the local app and companion backoffice. Development checks and focused browser checks are complete, including the combined Android/web production export. No public deployment, store submission, or production data write has been performed.

Both repositories remain on `master`. Changes are still uncommitted, including preserved work from Claude. This handoff describes the local working trees, not a release already available from GitHub. Before a release, commit the reviewed implementation and native/build configuration together; exclude personal `.claude` settings and launch metadata.

## Delivered

- Shared Schale visual system, five-tab navigation, eight themes, localized English/Chinese/Japanese/Korean UI, and native-only feature fallbacks for web.
- Home with live/fallback recruitment and game information, reset timers, watched targets, birthdays, and tool shortcuts; cached banner timeline with filters, linked student forms, and correct UTC boundaries.
- Searchable student collection, ownership/stars/UE tracking, import/export, detailed dossiers, and calculator links.
- Pull planner with balances, tickets, dated income and targets; separate spark/charge calculations; migrated pull tracker with undo/reset; AP timer.
- Restyled bond, level, eleph, skill, raid and gacha tools; shared inventory; repaired slider and press/hold controls while retaining calculation rules.
- Settings, theme/language choices, privacy/support/data controls, birthday calendar, and local reminder planning. Reminder schedules handle linked forms, unavailable schedule data and failed storage reads.
- Backoffice schedule board and health checks, character/member management, translation batching, app configuration, schema-preserving writes, and reviewed sync preview/apply logic. Selected date shifts and extensions now determine NEW badge clearing consistently in browser and unattended sync.
- Release metadata aligned to app version `2.0.0`; checked-in Android configuration uses version code `62`. EAS remains configured for remote version management and production auto-increment; no remote version was changed in this work.

## Verification evidence

| Check | Result |
| --- | --- |
| App TypeScript | Passed |
| App Jest | 43 suites, 817 tests, 1 snapshot passed |
| App color lint | Passed |
| App ESLint | 0 errors; 3 test-only import warnings |
| Android arm64 debug build | Passed, 778 tasks; debug APK generated |
| Combined Android/web production export | Passed; Android Hermes bundle and 23 static web routes |
| Backoffice tests | 9 files, 80 tests passed |
| Backoffice lint | Passed |
| Backoffice production build | Passed; bundle-size advisory remains |

The parent independently reran the final backoffice tests, lint and build after the last Sol fix. Its main JavaScript bundle is 1,384.70 kB minified / 385.11 kB gzip; this is a performance advisory, not a failed build.

App logs are local ignored artifacts: `dist/final-tests.log`, `dist/export-review.log`, and `android-build-review.log`. Android debug output is `android/app/build/outputs/apk/debug/app-debug.apk`. It is a development-client build requiring Metro, not a standalone production installer.

## Browser review

The parent checked Home, planner target budgeting, student search/registration/stars/dossier navigation, and the authenticated backoffice dashboard/schedule board after the user's sign-in. Sol additionally checked 390-by-844 Japanese light-theme Tools, the level calculator and reminders, plus Chinese Home and Tools. The calculator recomputed correctly; web reminders displayed the native-only notice. No blocking layout defect was observed in those focused views.

Screenshots:

- [Chinese Home](review/sol-final-zh-light-home-390.jpg)
- [Chinese Tools](review/sol-final-zh-light-tools-390.jpg)
- [Japanese Tools](review/sol-final-ja-light-tools-390.jpg)
- [Japanese level calculator](review/sol-final-ja-light-level-390.jpg)
- [Japanese reminders](review/sol-final-ja-light-reminders-390.jpg)

The last sync selection/lifecycle changes were verified through tests and build; their final protected browser flow was not re-exercised after the last fix. No Apply operation was used against production records.

## Remaining release checks

1. Exercise notifications on a real Android device: permission grant/denial, start/end/birthday/AP reminders, and background delivery.
2. Verify ads consent/privacy changes, ad-free purchase and restore using the intended store test account and native build. Browser stubs cannot verify these integrations.
3. Commit the reviewed source and native configuration on `master`, produce a signed standalone test/release build, and smoke-test it before store submission. No iOS compilation or device test was performed on this Windows machine.
4. For backoffice deployment, use the intended hosting target only. Its Firebase rules configuration references a different project; do not deploy rules as part of a hosting update without separately verifying the target.

These release checks are distinct from the implemented feature work. No claim of production readiness is made until device and release checks pass.
