// Read `appConfig/app`. The doc is optional: until the backoffice first saves
// it, it does not exist, and that is the normal "no overrides" state, not an
// error. Only a failed read throws.

import { doc, getDoc } from "firebase/firestore";

import { db } from "@/firebaseConfig";
import { FETCH_TIMEOUT_MS, withTimeout } from "@/services/banners/fetch";

import { normalizeAppConfig } from "./normalize";
import type { AppConfig } from "./types";

export const APP_CONFIG_COLLECTION = "appConfig";
export const APP_CONFIG_DOC = "app";

export async function fetchAppConfig(): Promise<AppConfig> {
  const snapshot = await withTimeout(
    getDoc(doc(db, APP_CONFIG_COLLECTION, APP_CONFIG_DOC)),
    FETCH_TIMEOUT_MS,
  );
  if (!snapshot.exists()) return {};
  let data: unknown;
  try {
    data = snapshot.data();
  } catch {
    data = undefined;
  }
  return normalizeAppConfig(data);
}
