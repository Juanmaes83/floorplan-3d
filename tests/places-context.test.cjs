'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../api/places-context.js');

const token = 'example-territory-test-code-of-length-32';
const env = { VERCEL_ENV: 'preview', RUBIK_CONTEXT_ENABLED: '1', RUBIK_CONTEXT_TOKEN: token,
  RUBIK_CONTEXT_DAILY_LIMIT: '4', RUBIK_CONTEXT_GOOGLE_KEY: 'mock-key',
  RUBIK_SPEND_STORE_URL: 'https://unused.example', RUBIK_SPEND_STORE_TOKEN: 'mock-store' };
const point = { latitude: 40.65, longitude: -2.99, language: 'es' };
const responses = {
  nearby: { places: [{ id: 'PLACE_1', displayName: { text: 'Centro de ejemplo' }, formattedAddress: 'Calle 1',
    attributions: [{ provider: 'Fuente de prueba', providerUri: 'https://example.org/' }] }] },
  route: { routes: [{ distanceMeters: 650, duration: '540s' }] },
  street: { status: 'OK', date: '2025-03', pano_id: 'discarded' }
};
function fixture(settings = env, allowance = 1) {
  const requests = [], limits = [];
  const run = createHandler({ env: settings, now: () => Date.parse('2026-11-24T12:00:00Z'),
    exec: () => async args => { limits.push(args); if (allowance instanceof Error) throw allowance; return allowance; },
    fetch: async (url, options) => {
      requests.push({ url, options });
      const action = url.startsWith('https://places.googleapis.com') ? 'nearby' :
        url.startsWith('https://routes.googleapis.com') ? 'route' : 'street';
      return { ok: true, json: async () => responses[action] };
    }
  });
  const send = async (body, headers = {}) => {
    const result = { headers: {} };
    await run({ method: 'POST', headers: { host: 'example.test', 'x-rubik-context-code': token, ...headers }, body }, {
      set statusCode(value) { result.status = value; },
      setHeader(key, value) { result.headers[key] = value; },
      end(raw) { result.data = JSON.parse(raw); }
    });
    return result;
  };
  return { send, requests, limits };
}
test('all three operations use fixed provider endpoints and minimal no-store responses', async () => {
  const f = fixture();
  const nearby = await f.send({ ...point, action: 'nearby' });
  assert.equal(nearby.status, 200);
  assert.equal(nearby.headers['Cache-Control'], 'no-store');
  assert.equal(nearby.data.places[0].credits[0].name, 'Fuente de prueba');
  assert.match(f.requests[0].url, /places:searchNearby$/);
  assert.equal(JSON.parse(f.requests[0].options.body).locationRestriction.circle.radius, 1200);
  const route = await f.send({ ...point, action: 'route', placeId: 'PLACE_1', mode: 'WALK' });
  assert.deepEqual(route.data, { available: true, meters: 650, seconds: 540 });
  assert.equal(JSON.parse(f.requests[1].options.body).destination.placeId, 'PLACE_1');
  const street = await f.send({ ...point, action: 'street' });
  assert.deepEqual(street.data, { available: true, date: '2025-03' });
  assert.equal(new URL(f.requests[2].url).searchParams.get('source'), 'outdoor');
  assert.ok(f.limits.every(call => call[3] === 'rubik:territory:quota:2026-11-24' && call[4] === 4));
  assert.ok(!JSON.stringify([nearby, route, street]).includes('mock-key'));
});
test('disabled, wrong code, invalid input, exhausted quota and unavailable Redis never call Google', async () => {
  const input = { ...point, action: 'nearby' };
  const off = fixture({ ...env, VERCEL_ENV: 'production' });
  assert.equal((await off.send(input)).status, 503);
  assert.equal(off.requests.length, 0);
  const ready = fixture();
  assert.equal((await ready.send(input, { 'x-rubik-context-code': 'wrong' })).status, 401);
  assert.equal((await ready.send(input, { origin: 'https://another.test' })).status, 403);
  assert.equal((await ready.send({ ...input, url: 'https://untrusted.example' })).status, 400);
  assert.equal(ready.limits.length, 0);
  assert.equal(ready.requests.length, 0);
  const capped = fixture(env, 0), offline = fixture(env, new Error('Redis'));
  assert.equal((await capped.send(input)).status, 429);
  assert.equal((await offline.send(input)).status, 503);
  assert.equal(capped.requests.length + offline.requests.length, 0);
});
