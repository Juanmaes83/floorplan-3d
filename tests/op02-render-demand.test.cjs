'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

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
