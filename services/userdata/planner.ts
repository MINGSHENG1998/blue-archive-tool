// Storage for the pull planner (`planner:v1`). The planner's shape —
// pyroxene, tickets, income presets, targets — belongs to the planner screen
// (S6); this module pins the key and gives it the same guarantees as every
// other slice: normalized on read, never clobbered before the first read,
// debounced writes. Usage:
//
//   const plannerStore = createPlannerStore(normalizePlanner, defaultPlanner);
//   // in the screen:
//   const { value, ready, update } = usePersistentState(plannerStore);
//
// Create the store once at module level, not inside a component: the
// persistence hook keys its load effect on the store's identity.

import { createJsonStore, type JsonStore } from "./storage";

export const PLANNER_KEY = "planner:v1";

export function createPlannerStore<T>(
  normalize: (raw: unknown) => T,
  fallback: () => T,
): JsonStore<T> {
  return createJsonStore(PLANNER_KEY, normalize, fallback);
}
