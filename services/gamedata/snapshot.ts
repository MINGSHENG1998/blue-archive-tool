// The bundled SchaleDB snapshot: the app's offline floor.
//
// Regenerate with `npm run gamedata:refresh` before cutting a release.
//
// `require` rather than `import`: these are large JSON files, and a typed
// import makes TypeScript infer a literal type for all 272 records on every
// typecheck. The cast is safe because the generator writes them through the
// same trim functions the runtime uses.

import type {
  GameConfig,
  GameLocalization,
  GameStudent,
  NameMap,
} from "./types";

export const bundledConfig = require("../../assets/gamedata/config.json") as GameConfig;
export const bundledStudents = require("../../assets/gamedata/students.json") as GameStudent[];
export const bundledNames: Partial<Record<"ja" | "ko" | "zh", NameMap>> = {
  ja: require("../../assets/gamedata/names.ja.json") as NameMap,
  ko: require("../../assets/gamedata/names.ko.json") as NameMap,
  zh: require("../../assets/gamedata/names.zh.json") as NameMap,
};
export const bundledLabels: Partial<
  Record<"en" | "ja" | "ko" | "zh", GameLocalization>
> = {
  en: require("../../assets/gamedata/labels.en.json") as GameLocalization,
  ja: require("../../assets/gamedata/labels.ja.json") as GameLocalization,
  ko: require("../../assets/gamedata/labels.ko.json") as GameLocalization,
  zh: require("../../assets/gamedata/labels.zh.json") as GameLocalization,
};
