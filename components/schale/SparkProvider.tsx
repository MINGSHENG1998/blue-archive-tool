import { createContext, useContext, type ReactNode } from "react";

// Tap feedback used to draw a full-screen spark overlay on every primary
// press. It read as decoration rather than feedback and lingered on web, so
// presses now rely on the press-scale + haptic alone. The provider and hook
// stay so callers keep compiling; emit() is a no-op.

type SparkApi = {
  /** Kept for API compatibility; does nothing. */
  emit: (pageX: number, pageY: number) => void;
};

const NOOP: SparkApi = { emit: () => {} };
const SparkContext = createContext<SparkApi>(NOOP);

export const useSpark = (): SparkApi => useContext(SparkContext);

export function SparkProvider({ children }: { children: ReactNode }) {
  return <SparkContext.Provider value={NOOP}>{children}</SparkContext.Provider>;
}
