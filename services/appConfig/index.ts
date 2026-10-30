// Remote app configuration (`appConfig/app`). Screens read it through
// contexts/app-config-context.tsx (useAppConfig); import the pure readers
// (gachaSystemAt, activeAnnouncement, …) from here.

export * from "./types";
export { normalizeAnnouncement, normalizeAppConfig } from "./normalize";
export * from "./select";
export {
  APP_CONFIG_CACHE_KEY,
  readAppConfigCache,
  reviveAppConfigCache,
  writeAppConfigCache,
  type AppConfigCache,
} from "./cache";
export { APP_CONFIG_COLLECTION, APP_CONFIG_DOC, fetchAppConfig } from "./fetch";
