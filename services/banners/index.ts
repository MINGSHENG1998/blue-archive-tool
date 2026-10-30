// Banner schedule: Firestore fetch, normalization, cache and pure selectors.
// Screens read it through contexts/banners-context.tsx (useBanners); import
// from here for the types and the selectors (countdowns, D-n, search).

export * from "./types";
export {
  DAY_MS,
  GLOBAL_ROTATION_UTC_HOUR,
  HOUR_MS,
  parseInstant,
  parseScheduleString,
  utcDayKey,
} from "./time";
export {
  compareBanners,
  normalizeBanner,
  normalizeBanners,
  normalizeCharacter,
  studentIdFromImage,
  toBannerType,
} from "./normalize";
export * from "./select";
export {
  BANNERS_CACHE_KEY,
  readBannersCache,
  reviveBannersCache,
  writeBannersCache,
  type BannersCache,
} from "./cache";
export {
  BannerFetchError,
  FETCH_TIMEOUT_MS,
  fetchBanners,
  type BannerFetchErrorCode,
} from "./fetch";
