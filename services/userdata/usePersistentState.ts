// React binding for a JsonStore: one value, read once on mount, written back
// debounced. This is the house restored-before-save guard (see
// app/gachaTracker.tsx) made reusable, with one improvement: an edit made
// before the read lands is not dropped, it is replayed on top of what was
// read.
//
// One mounted owner per key. Two components using the same store would each
// hold their own copy and the last writer would win; state that several
// screens share belongs in a provider (see contexts/user-data-context.tsx).

import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { createSerialWriter, type JsonStore, type SerialWriter } from "./storage";

/** Long enough to coalesce a burst of taps, short enough to survive a swipe-away. */
export const DEFAULT_WRITE_DELAY_MS = 300;

export interface PersistentState<T> {
  value: T;
  /** False until the stored value has been read back (or the read failed). */
  ready: boolean;
  /**
   * Functional update. `fn` must be pure: before `ready` it runs twice, once
   * on the default (so the UI responds immediately) and again on the stored
   * value once it arrives.
   */
  update: (fn: (prev: T) => T) => void;
}

export function usePersistentState<T>(
  store: JsonStore<T>,
  delayMs: number = DEFAULT_WRITE_DELAY_MS,
): PersistentState<T> {
  const [value, setValue] = useState<T>(store.fallback);
  const [ready, setReady] = useState(false);

  // The committed value, readable synchronously by update() without leaning
  // on React's updater semantics (updaters may run twice in StrictMode, and
  // a write must happen exactly once).
  const valueRef = useRef(value);
  const restored = useRef(false);
  const writable = useRef(true);
  // Edits made before the stored value arrived, replayed onto it in order.
  const pending = useRef<((prev: T) => T)[]>([]);

  const writerRef = useRef<SerialWriter<T> | null>(null);
  if (!writerRef.current) {
    writerRef.current = createSerialWriter((next: T) => store.save(next), delayMs);
  }
  const writer = writerRef.current;

  useEffect(() => {
    let cancelled = false;
    store
      .load()
      .catch(() => ({ value: store.fallback(), writable: false }))
      .then((loaded) => {
        if (cancelled) return;
        let next = loaded.value;
        for (const fn of pending.current) next = fn(next);
        const hadEdits = pending.current.length > 0;
        pending.current = [];

        valueRef.current = next;
        restored.current = true;
        writable.current = loaded.writable;
        setValue(next);
        setReady(true);
        if (hadEdits && loaded.writable) writer.schedule(next);
      });
    return () => {
      cancelled = true;
      // Unmounting inside the debounce window must not lose the last edit.
      void writer.flush();
    };
  }, [store, writer]);

  // Backgrounding is the last reliable moment before the OS may kill us.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (status) => {
      if (status !== "active") void writer.flush();
    });
    return () => sub?.remove?.();
  }, [writer]);

  const update = useCallback(
    (fn: (prev: T) => T) => {
      const next = fn(valueRef.current);
      if (!restored.current) {
        pending.current.push(fn);
      } else if (Object.is(next, valueRef.current)) {
        return;
      }
      valueRef.current = next;
      setValue(next);
      if (restored.current && writable.current) writer.schedule(next);
    },
    [writer],
  );

  return { value, ready, update };
}
