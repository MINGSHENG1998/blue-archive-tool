/** A deliberate downward swipe closes; a short nudge returns to the resting position. */
export function shouldDismissSheet(distance: number, velocity: number): boolean {
  return distance > 100 || (distance > 24 && velocity > .8);
}
