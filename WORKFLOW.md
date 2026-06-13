# Workflow

**Work directly on `master`.** Do not create long-lived feature branches.

This repo recently had three sibling branches (`feat/buy-me-a-coffee`, `feat/skill-calc`,
`feat/theme-system`) diverge from a common base. Two of them were never merged back, so a
build shipped with the old app icon and missing features, and the eventual integration
required resolving conflicts across many files. Working on `master` avoids this.

## Rules

- Commit to `master` directly for normal work.
- If isolation is genuinely needed (a risky spike), branch — but **merge back to `master`
  the same session** and delete the branch. Never let a branch live for days.
- Keep `master` releasable: run the checks below before pushing.
- Commit `babel.config.js`, `app.json`, native config — EAS builds from committed git
  state, so anything uncommitted is missing from the build.

## Pre-push checks

```bash
npm run lint:colors   # no hardcoded colors / OS-scheme reads (theme system)
npx jest --watchAll=false
npx tsc --noEmit      # ignore the app-example/ baseline errors
npm run lint
```
