// Shared calculator inventory: what Sensei already holds (credits, reports,
// elephs, books…), entered once and subtracted by every calculator. Item keys
// belong to the calculators ("credits", "eleph:10000", "item:9999"); this
// module only guarantees every count is a sane non-negative integer.

import { asRecord, clampInt, intInRange } from "./sanitize";
import { createJsonStore } from "./storage";

export const INVENTORY_KEY = "inventory:v1";

export type Inventory = Record<string, number>;

/** Credits run into the billions late game; anything past this is a typo. */
export const MAX_ITEM_COUNT = 99_999_999_999;
export const MAX_INVENTORY_ITEMS = 2000;
const KEY_PATTERN = /^[A-Za-z0-9_.:-]{1,64}$/;

export const isInventoryKey = (key: string) => KEY_PATTERN.test(key);

/** Valid keys with positive counts. Zero is the same as absent, so it is not stored. */
export function normalizeInventory(raw: unknown): Inventory {
  const record = asRecord(raw);
  const out: Inventory = {};
  if (!record) return out;
  let count = 0;
  for (const [key, value] of Object.entries(record)) {
    if (count >= MAX_INVENTORY_ITEMS) break;
    if (!isInventoryKey(key)) continue;
    const n = intInRange(value, 1, MAX_ITEM_COUNT);
    if (n === undefined) continue;
    out[key] = n;
    count += 1;
  }
  return out;
}

/**
 * Apply several counts at once: a number sets (clamped), null or 0 removes.
 * Returns `inventory` itself when nothing changes.
 */
export function setInventoryItems(
  inventory: Inventory,
  patch: Record<string, number | null>,
): Inventory {
  let next: Inventory | null = null;
  for (const [key, value] of Object.entries(patch)) {
    if (!isInventoryKey(key)) continue;
    const n = value === null ? 0 : clampInt(value, 0, MAX_ITEM_COUNT, 0);
    const current = (next ?? inventory)[key] ?? 0;
    if (n === current) continue;
    if (!next) next = { ...inventory };
    if (n === 0) delete next[key];
    else if (key in next || Object.keys(next).length < MAX_INVENTORY_ITEMS) {
      next[key] = n;
    }
  }
  return next ?? inventory;
}

export const setInventoryItem = (
  inventory: Inventory,
  key: string,
  count: number | null,
) => setInventoryItems(inventory, { [key]: count });

/** Add (or with a negative delta, use up) items, flooring at 0. */
export const adjustInventoryItem = (
  inventory: Inventory,
  key: string,
  delta: number,
) => {
  const step = clampInt(delta, -MAX_ITEM_COUNT, MAX_ITEM_COUNT, 0);
  return setInventoryItem(inventory, key, (inventory[key] ?? 0) + step);
};

export const inventoryStore = createJsonStore<Inventory>(
  INVENTORY_KEY,
  normalizeInventory,
  () => ({}),
);
