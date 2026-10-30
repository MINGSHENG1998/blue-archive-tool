// Safe JSON persistence shared by every AsyncStorage-backed slice: user data
// (watchlist, roster, AP, inventory, planner) and the remote-data caches
// (banners, app config).
//
// Two rules hold everything up:
//   1. Nothing here throws. Storage is a convenience; a broken disk must
//      degrade to defaults, never to a crash or an error screen.
//   2. A key we could not READ is never overwritten. "Missing" and "corrupt"
//      are safe to replace (there is nothing worth keeping), but a storage
//      failure on read may be hiding a perfectly good roster, so the slice
//      runs memory-only for that session instead of clobbering it.

import AsyncStorage from "@react-native-async-storage/async-storage";

export type ReadResult =
  /** Parsed JSON — still untrusted, run it through a normalizer. */
  | { kind: "value"; value: unknown }
  /** Key absent. Safe to write. */
  | { kind: "missing" }
  /** Present but not JSON. Unrecoverable, so safe to write. */
  | { kind: "corrupt" }
  /** Storage itself failed. Do not write over what we could not see. */
  | { kind: "unavailable" };

async function readOnce(key: string): Promise<ReadResult> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(key);
  } catch {
    return { kind: "unavailable" };
  }
  if (raw == null) return { kind: "missing" };
  try {
    return { kind: "value", value: JSON.parse(raw) as unknown };
  } catch {
    return { kind: "corrupt" };
  }
}

/**
 * Read and parse one key. A storage failure is retried once straight away:
 * the native module occasionally rejects during cold start, and the cost of
 * giving up is a session with no persistence.
 */
export async function readJson(key: string): Promise<ReadResult> {
  const first = await readOnce(key);
  return first.kind === "unavailable" ? readOnce(key) : first;
}

/** Serialize and write. Resolves false instead of throwing. */
export async function writeJson(key: string, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function removeKey(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export interface LoadResult<T> {
  value: T;
  /** False when the read failed: the caller must not persist this session. */
  writable: boolean;
}

/**
 * One persisted value: its key, its default and the normalizer that turns
 * whatever is on disk (older app versions, hand edits, half-written JSON)
 * into a valid `T`.
 */
export interface JsonStore<T> {
  readonly key: string;
  /** A fresh default each call, so callers can never share-mutate it. */
  fallback(): T;
  normalize(raw: unknown): T;
  load(): Promise<LoadResult<T>>;
  save(value: T): Promise<boolean>;
}

export function createJsonStore<T>(
  key: string,
  normalize: (raw: unknown) => T,
  fallback: () => T,
): JsonStore<T> {
  return {
    key,
    fallback,
    normalize,
    async load() {
      const result = await readJson(key);
      switch (result.kind) {
        case "unavailable":
          return { value: fallback(), writable: false };
        case "missing":
        case "corrupt":
          return { value: fallback(), writable: true };
        case "value":
          try {
            return { value: normalize(result.value), writable: true };
          } catch {
            // A normalizer bug must not cost the user a launch.
            return { value: fallback(), writable: true };
          }
      }
    },
    save: (value) => writeJson(key, value),
  };
}

export interface SerialWriter<T> {
  /** Queue `value`; it is written once nothing newer arrives for `delayMs`. */
  schedule(value: T): void;
  /** Write whatever is queued right now. Resolves when storage settles. */
  flush(): Promise<void>;
  /** Drop anything queued but not yet written. */
  cancel(): void;
}

/**
 * Debounced, strictly serialized writes. Rapid taps (a watch star, a stepper)
 * coalesce into one write of the latest value, and two writes never race —
 * the later value is always the one left on disk.
 */
export function createSerialWriter<T>(
  save: (value: T) => Promise<unknown>,
  delayMs: number,
): SerialWriter<T> {
  let queued: { value: T } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight: Promise<void> | null = null;

  const pump = async () => {
    while (queued) {
      const { value } = queued;
      queued = null;
      try {
        await save(value);
      } catch {
        // save() is expected not to throw; this keeps the queue alive if not.
      }
    }
  };

  const run = (): Promise<void> => {
    if (!inFlight) {
      inFlight = pump().finally(() => {
        inFlight = null;
        // Something queued in the gap between the loop ending and this
        // callback would otherwise sit unwritten until the next schedule().
        if (queued && !timer) void run();
      });
    }
    return inFlight;
  };

  return {
    schedule(value) {
      queued = { value };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void run();
      }, delayMs);
    },
    flush() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      return run();
    },
    cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      queued = null;
    },
  };
}
