'use strict';

const { sameSite, sameCode, MIN_CODE, MAX_CODE } = require('./_share-auth.js');
const { restExec } = require('./_spend-ledger.js');
const PLACE_TYPES = ['school', 'supermarket', 'pharmacy', 'bus_station', 'train_station'];
const MODES = ['WALK', 'DRIVE'];
const PLACE_ID = /^[A-Za-z0-9_-]{1,256}$/;
const DAY_LIMIT = "local n=tonumber(redis.call('GET',KEYS[1]) or '0'); if n>=tonumber(ARGV[1]) then return 0 end; redis.call('INCR',KEYS[1]); if n==0 then redis.call('EXPIRE',KEYS[1],172800) end; return 1";

function config(env) {
  const code = env.RUBIK_CONTEXT_TOKEN;
  const cap = Number(env.RUBIK_CONTEXT_DAILY_LIMIT);
  if (env.RUBIK_CONTEXT_ENABLED !== '1' || env.VERCEL_ENV !== 'preview' ||
      typeof code !== 'string' || code.length < MIN_CODE || code.length > MAX_CODE ||
      [env.RUBIK_RENDER_TOKEN, env.RUBIK_SHARE_TOKEN, env.RUBIK_ASSISTANT_TOKEN, env.RUBIK_PHOTO_REFORM_TOKEN].includes(code) ||
      !env.RUBIK_CONTEXT_GOOGLE_KEY || !env.RUBIK_SPEND_STORE_URL || !env.RUBIK_SPEND_STORE_TOKEN ||
      !Number.isSafeInteger(cap) || cap < 1 || cap > 1000) return null;
  return { code, cap, key: env.RUBIK_CONTEXT_GOOGLE_KEY };
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

async function read(req) {
  const limit = 2048;
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > limit) throw Error('body-too-large');
    return JSON.parse(raw);
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.from(chunk);
    size += bytes.length;
    if (size > limit) throw Error('body-too-large');
    chunks.push(bytes);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function valid(input) {
  if (!input || !Number.isFinite(input.latitude) || Math.abs(input.latitude) > 85 ||
      !Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180 ||
      !['es', 'en', 'zh-CN'].includes(input.language)) return false;
  const fields = ['action', 'latitude', 'longitude', 'language'];
  if (input.action === 'route') {
    fields.push('placeId', 'mode');
    if (typeof input.placeId !== 'string' || !PLACE_ID.test(input.placeId) || !MODES.includes(input.mode)) return false;
  } else if (!['nearby', 'street'].includes(input.action)) return false;
  return Object.keys(input).every(key => fields.includes(key));
}

async function google(input, key, fetch) {
  const { latitude, longitude, language } = input;
  const latLng = { latitude, longitude };
  let url, fieldMask, body;
  switch (input.action) {
    case 'nearby':
      url = 'https://places.googleapis.com/v1/places:searchNearby';
      fieldMask = 'places.id,places.displayName,places.formattedAddress,places.attributions';
      body = { includedTypes: PLACE_TYPES, maxResultCount: 8, rankPreference: 'DISTANCE', languageCode: language,
        locationRestriction: { circle: { center: latLng, radius: 1200 } } };
      break;
    case 'route':
      url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
      fieldMask = 'routes.distanceMeters,routes.duration';
      body = { origin: { location: { latLng } }, destination: { placeId: input.placeId },
        travelMode: input.mode, languageCode: language, computeAlternativeRoutes: false };
      break;
    case 'street':
      url = 'https://maps.googleapis.com/maps/api/streetview/metadata?' + new URLSearchParams({
        location: latitude + ',' + longitude, radius: '50', source: 'outdoor', key
      });
      break;
  }
  const options = body ? { method: 'POST', headers: { 'Content-Type': 'application/json',
    'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fieldMask }, body: JSON.stringify(body) } : {};
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(6500), redirect: 'error' });
  if (!response.ok) throw Error('provider');
  const data = await response.json();
  if (input.action === 'nearby') {
    const places = (Array.isArray(data.places) ? data.places : []).filter(place =>
      typeof place.id === 'string' && PLACE_ID.test(place.id) && typeof place.displayName?.text === 'string').slice(0, 8);
    return { places: places.map(place => ({
      id: place.id, name: place.displayName.text.slice(0, 200),
      address: typeof place.formattedAddress === 'string' ? place.formattedAddress.slice(0, 300) : '',
      credits: (Array.isArray(place.attributions) ? place.attributions : []).slice(0, 12).flatMap(a =>
        typeof a.provider === 'string' ? [{ name: a.provider.slice(0, 200), url: /^https:\/\//i.test(a.providerUri) ? a.providerUri : null }] : [])
    })) };
  }
  if (input.action === 'route') {
    const route = data.routes?.[0];
    if (!route) return { available: false };
    const duration = /^(\d+(?:\.\d+)?)s$/.exec(route.duration);
    if (!duration || !Number.isSafeInteger(route.distanceMeters) || route.distanceMeters < 0) throw Error('provider');
    return { available: true, seconds: Number(duration[1]), meters: route.distanceMeters };
  }
  if (['ZERO_RESULTS', 'NOT_FOUND'].includes(data.status)) return { available: false };
  if (data.status !== 'OK') throw Error('provider');
  return { available: true, date: /^\d{4}(-\d{2})?$/.test(data.date) ? data.date : null };
}

function createHandler({ env = process.env, fetch = globalThis.fetch, now = Date.now,
  exec = () => restExec({ url: env.RUBIK_SPEND_STORE_URL, token: env.RUBIK_SPEND_STORE_TOKEN, fetch }) } = {}) {
  return async function handler(req, res) {
    if (req.method !== 'POST') return send(res, 405, { error: 'method' });
    if (!sameSite(req)) return send(res, 403, { error: 'origin' });
    const settings = config(env);
    if (!settings) return send(res, 503, { error: 'unavailable' });
    const code = req.headers['x-rubik-context-code'];
    if (typeof code !== 'string' || code.length > MAX_CODE || !sameCode(code, settings.code)) {
      return send(res, 401, { error: 'code' });
    }
    let input;
    try { input = await read(req); } catch { return send(res, 400, { error: 'input' }); }
    if (!valid(input)) return send(res, 400, { error: 'input' });
    try {
      const day = new Date(now()).toISOString().slice(0, 10);
      const accepted = await exec()(['EVAL', DAY_LIMIT, '1', 'rubik:territory:quota:' + day, settings.cap]);
      if (Number(accepted) !== 1) return send(res, 429, { error: 'quota' });
    } catch { return send(res, 503, { error: 'unavailable' }); }
    try { return send(res, 200, await google(input, settings.key, fetch)); }
    catch { return send(res, 502, { error: 'provider' }); }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
