/* SCULPT OP-02 · OpenPlan3D @771c9e1 (MIT), orbitDamping.ts. */
export function updateOrbitDamping(controls, elapsedSeconds) {
  const factor = controls.dampingFactor;
  const elapsed = Number.isFinite(elapsedSeconds) && elapsedSeconds > 0 ? Math.min(elapsedSeconds, 1) : 1 / 60;
  controls.dampingFactor = 1 - Math.pow(1 - factor, elapsed * 60);
  try {
    return controls.update();
  } finally {
    // Pointer events call update() themselves and keep their configured response.
    controls.dampingFactor = factor;
  }
}

/* WalkthroughMotion's input clock and elapsed cap, using one monotonic clock for
   both input events and frames. RUBIK owns the movement and its collision steps. */
export function createWalkClock() {
  let previous;
  return {
    start(now) { previous ??= now; },
    stop() { previous = undefined; },
    take(now) {
      const before = previous;
      previous = now;
      return before === undefined ? 0 : Math.max(0, Math.min((now - before) / 1000, .25));
    },
  };
}
