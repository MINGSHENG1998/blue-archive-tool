export function clampInteger(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? Math.round(value) : min));
}
/** Delta from the grabbed thumb, independent of the track's page position. */
export function rangeValueFromDrag(start: number, dx: number, trackWidth: number, min: number, max: number, step: number): number {
  const raw = start + dx / Math.max(1, trackWidth - 26) * (max - min);
  return Math.min(max, Math.max(min, min + Math.round((raw - min) / step) * step));
}
export function holdStep(elapsed: number): number {
  return Math.min(10, Math.round(1.5 ** Math.floor(Math.max(0, elapsed) / 500)));
}
