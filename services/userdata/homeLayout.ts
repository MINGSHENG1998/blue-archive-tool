// Persisted Home layout (which sections show, their order, the pinned tools).
// The rules live in services/home/layout.ts; this file only names the key and
// wires the normalizer into the shared JsonStore, which already guarantees the
// two storage rules: nothing throws, and a key we could not read is never
// overwritten.

import { defaultHomeLayout, normalizeHomeLayout, type HomeLayout } from "@/services/home/layout";
import { createJsonStore } from "./storage";

export const HOME_LAYOUT_KEY = "home:v1";

export const homeLayoutStore = createJsonStore<HomeLayout>(
  HOME_LAYOUT_KEY,
  normalizeHomeLayout,
  defaultHomeLayout,
);
