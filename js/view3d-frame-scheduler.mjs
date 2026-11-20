/* SCULPT OP-02 — OpenPlan3D @771c9e1, src/lib/utils/drawScheduler.ts (MIT).
   Coalesce requests, including invalidation during drawing. A retained RUBIK
   renderer can cancel pending work when hidden and schedule again on re-entry. */
export function createDrawScheduler(draw, request = requestAnimationFrame, cancel = cancelAnimationFrame) {
  let frame;
  const tick = () => {
    frame = undefined;
    draw();
  };
  return {
    invalidate() {
      if (frame === undefined) frame = request(tick);
    },
    cancel() {
      if (frame !== undefined) cancel(frame);
      frame = undefined;
    },
    get pending() { return frame !== undefined; },
  };
}
