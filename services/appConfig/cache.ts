// Last good appConfig/app, so overrides (the recruitment switch date above
// all) apply from the first frame of an offline launch.

import { readJson, writeJson } from "@/services/userdata/storage";
import { asRecord } from "@/services/userdata/sanitize";

import { normalizeAppConfig } from "./normalize";
import type { AppConfig } from "./types";

export const APP_CONFIG_CACHE_KEY = "appConfig:v1";

export interface AppConfigCache {
  config: AppConfig;
  fetchedAt: number;
}

export function reviveAppConfigCache(raw: unknown): AppConfigCache | null {
  const record = asRecord(raw);
  const fetchedAt = record?.fetchedAt;
  if (!record || typeof fetchedAt !== "number" || !Number.isFinite(fetchedAt)) {
    return null;
  }
  return { config: normalizeAppConfig(record.config), fetchedAt };
}

export async function readAppConfigCache(): Promise<AppConfigCache | null> {
  const result = await readJson(APP_CONFIG_CACHE_KEY);
  if (result.kind !== "value") return null;
  try {
    return reviveAppConfigCache(result.value);
  } catch {
    return null;
  }
}

export function writeAppConfigCache(
  config: AppConfig,
  fetchedAt: number,
): Promise<boolean> {
  return writeJson(APP_CONFIG_CACHE_KEY, { fetchedAt, config });
}
