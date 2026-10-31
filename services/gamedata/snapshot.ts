// The bundled SchaleDB snapshot: the app's offline floor.
//
// Regenerate with `npm run gamedata:refresh` before cutting a release.
//
// `require` rather than `import`: these are large JSON files, and a typed
// import makes TypeScript infer a literal type for all 278 records on every
// typecheck. The cast is safe because the generator writes them through the
// same trim functions the runtime uses.

import type {
  GameConfig,
  GameLocalization,
  GameRaids,
  GameStudent,
  NameMap,
  OverlayLocale,
  RaidNames,
} from "./types";

export const bundledConfig = require("../../assets/gamedata/config.json") as GameConfig;
export const bundledStudents = require("../../assets/gamedata/students.json") as GameStudent[];
export const bundledNames: Partial<Record<OverlayLocale, NameMap>> = {
  ja: require("../../assets/gamedata/names.ja.json") as NameMap,
  ko: require("../../assets/gamedata/names.ko.json") as NameMap,
  zh: require("../../assets/gamedata/names.zh.json") as NameMap,
  vi: require("../../assets/gamedata/names.vi.json") as NameMap,
  th: require("../../assets/gamedata/names.th.json") as NameMap,
};
export const bundledLabels: Partial<Record<"en" | OverlayLocale, GameLocalization>> = {
  en: require("../../assets/gamedata/labels.en.json") as GameLocalization,
  ja: require("../../assets/gamedata/labels.ja.json") as GameLocalization,
  ko: require("../../assets/gamedata/labels.ko.json") as GameLocalization,
  zh: require("../../assets/gamedata/labels.zh.json") as GameLocalization,
  vi: require("../../assets/gamedata/labels.vi.json") as GameLocalization,
  th: require("../../assets/gamedata/labels.th.json") as GameLocalization,
};
export const bundledRaids = require("../../assets/gamedata/raids.json") as GameRaids;
export const bundledRaidNames: Partial<Record<OverlayLocale, RaidNames>> = {
  ja: require("../../assets/gamedata/raids.ja.json") as RaidNames,
  ko: require("../../assets/gamedata/raids.ko.json") as RaidNames,
  zh: require("../../assets/gamedata/raids.zh.json") as RaidNames,
  vi: require("../../assets/gamedata/raids.vi.json") as RaidNames,
  th: require("../../assets/gamedata/raids.th.json") as RaidNames,
};
