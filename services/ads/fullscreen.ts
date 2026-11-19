// One full-screen ad at a time. A rewarded or interstitial ad runs in its own
// Android activity, so the app goes to the background while it plays and
// comes back when it closes. To the app-open ad that looks like the user
// returning to the app, and it would fire right on top of the ad that just
// closed. It checks fullscreenBusy() first.

const SETTLE_MS = 5000;

let showing = 0;
let closedAt = 0;

export function fullscreenBegin() {
  showing += 1;
}

export function fullscreenEnd(now = Date.now()) {
  showing = Math.max(0, showing - 1);
  closedAt = now;
}

/** True while a full-screen ad is up, and for a few seconds after it closes. */
export function fullscreenBusy(now = Date.now()) {
  return showing > 0 || now - closedAt < SETTLE_MS;
}

/** Test hook: forget every earlier ad. */
export function resetFullscreen() {
  showing = 0;
  closedAt = 0;
}
