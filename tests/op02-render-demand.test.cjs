'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('OP-02 orbit damping preserves elapsed motion from 1 to 120 FPS', async () => {
  const {updateOrbitDamping} = await import('../js/view3d-motion.mjs');
  for (const fps of [1, 4, 15, 30, 60, 120]) {
    let remaining = 1;
    const controls = {dampingFactor: .05, update() { remaining *= 1 - this.dampingFactor; }};
    for (let frame = 0; frame < fps; frame++) updateOrbitDamping(controls, 1 / fps);
    assert.ok(Math.abs(remaining - .95 ** 60) < 1e-12, `${fps} FPS`);
    assert.equal(controls.dampingFactor, .05);
  }
});

test('OP-02 walk clock consumes input between frames and discards idle time', async () => {
  const {createWalkClock} = await import('../js/view3d-motion.mjs');
  const clock = createWalkClock();
  clock.start(10000);
  clock.start(10100);
  assert.equal(clock.take(10200), .2, 'a release can consume motion before the first frame');
  assert.equal(clock.take(11100), .25, 'delayed frames cap travel');
  clock.stop();
  assert.equal(clock.take(50000), 0, 'clearing input discards time spent idle');
});

test('OP-02 coalesces invalidations, including a zero handle, and wakes when drawing invalidates again', async () => {
  const {createDrawScheduler} = await import('../js/view3d-frame-scheduler.mjs');
  const queued = new Map();
  let next = 0, draws = 0;
  const scheduler = createDrawScheduler(
    () => { if (++draws === 1) scheduler.invalidate(); },
    callback => { const id = next++; queued.set(id,callback); return id; },
    id => queued.delete(id),
  );
  const tick = () => {
    const [id, callback] = queued.entries().next().value;
    queued.delete(id); callback();
  };
  assert.equal(scheduler.pending,false);
  scheduler.invalidate(); scheduler.invalidate();
  assert.equal(queued.size,1);
  tick();
  assert.equal(scheduler.pending,true);
  tick();
  assert.equal(scheduler.pending,false);
  assert.equal(draws,2);
  scheduler.invalidate(); scheduler.cancel();
  assert.equal(queued.size,0);
  scheduler.invalidate(); tick();
  assert.equal(draws,3);
});
