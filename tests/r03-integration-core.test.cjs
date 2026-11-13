// R03-I0 · pure engine integration gate, and since R03-I1 also the activation gate.
// I0 (unchanged): the canonical schema is never expanded for cabinets. I1 (activation): index.html binds the editor
// ONLY through the explicit, enumerated R03-I1 activation (tests/r03-activation-manifest.cjs) and nothing else.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const K = require('../js/r03-cabinet-core.js');
const Schema = require('../js/project-schema.js');
const outer = Object.freeze({ w: 2000, d: 600 });

test('I0: initial cabinet has explicit assumed dimensions and valid modules', () => {
  const cabinet = K.defaultCabinet('wardrobe', outer);
  assert.equal(K.validate(outer, cabinet).length, 0);
  assert.equal(cabinet.columns.length, 3);
  assert.equal(cabinet.height, 2200);
  assert.match(K.ASSUMED.heightByTypeMm.source, /not measured/);
});
test('I0: closed, hidden and open fronts validate without mutating original', () => {
  const original = K.defaultCabinet('wardrobe', outer);
  for (const front of ['closed','hidden','open']) {
    const changed = structuredClone(original);
    changed.front = front;
    assert.equal(K.validate(outer, changed).length, 0, front);
  }
  assert.equal(original.front,'closed');
});
test('I0: split then merge changes bay count and preserves clear width', () => {
  const original = K.defaultCabinet('wardrobe', outer);
  const before = structuredClone(original);
  const split = K.splitBay(outer, original, 0);
  assert.equal(split.ok, true, JSON.stringify(split.issues));
  assert.equal(split.cabinet.columns.length, 4);
  const merged = K.mergeBay(outer, split.cabinet, 0);
  assert.equal(merged.ok, true, JSON.stringify(merged.issues));
  assert.equal(merged.cabinet.columns.length, 3);
  const width = (c) => c.columns.reduce((sum, col) => sum + col.width, 0);
  assert.ok(Math.abs(width(merged.cabinet) - width(before)) <= K.LIMITS.widthToleranceMm);
  assert.deepEqual(original, before);
});
test('I0: valid shelve/rod/drawers edit produces new state, no source mutation', () => {
  const original = K.defaultCabinet('wardrobe', outer);
  const before = structuredClone(original);
  const changed = K.setBay(outer, original, 0, { shelves:[1400], rod:1000, drawers:0 });
  assert.equal(changed.ok, true, JSON.stringify(changed.issues));
  assert.deepEqual(changed.cabinet.columns[0].shelves,[1400]);
  assert.equal(changed.cabinet.columns[0].rod,1000);
  assert.deepEqual(original,before);
});
test('I0: invalid overlapping shelves and rod are rejected atomically', () => {
  const original = K.defaultCabinet('wardrobe', outer);
  const before = structuredClone(original);
  const bad = K.setBay(outer,original,0,{shelves:[1000,1010],rod:1005});
  assert.equal(bad.ok,false);
  assert.ok(bad.issues.some(i=>i.code==='shelf-gap'));
  assert.ok(bad.issues.some(i=>i.code==='rod'));
  assert.equal(bad.cabinet,undefined);
  assert.deepEqual(original,before);
});
// Before R03-I1 this was one test, «I0: no schema expansion or editor binding is implicitly authorized», which also
// required index.html NOT to load r03-cabinet-core.js. The owner authorized the activation (R03-I1), so the binding half
// is replaced by I1 below, which allows exactly the enumerated activation and fails on anything else. The schema half
// stays as it was: activating R03 does NOT authorize expanding the canonical schema.
test('I0: no schema expansion is implicitly authorized (the interior lives only in extensions)', () => {
  assert.equal(Schema.$defs.object.additionalProperties,false);
  assert.equal(Schema.$defs.object.properties.cabinetInterior,undefined);
  for (const k of Object.keys(Schema.$defs.object.properties)) assert.doesNotMatch(k,/cabinet|interior|r03/i,`no R03 property on objects: ${k}`);
  assert.deepEqual(Object.keys(Schema.$defs.extensions.patternProperties),['^x-[a-z0-9-]{1,40}$'],'extensions keep their generic x- namespace');
  assert.equal(Schema.$defs.extensions.additionalProperties,false);
});
test('I1: the editor binding is exactly the explicit R03-I1 activation, nothing implicit', () => {
  const A=require('./r03-activation-manifest.cjs');
  const html=A.indexHtml(), scripts=A.loadedScripts(html), styles=A.loadedStyles(html);
  const r03Scripts=scripts.filter(s=>/r03/i.test(s)), r03Styles=styles.filter(s=>/r03/i.test(s));
  assert.deepEqual(r03Scripts,A.SCRIPTS,'the eight R03 modules, once each, in dependency order, from js/');
  assert.deepEqual(r03Styles,A.STYLES,'one R03 stylesheet, from css/');
  for (const f of [...A.SCRIPTS,...A.STYLES]) assert.ok(fs.existsSync(path.resolve(__dirname,'..',f)),`${f} exists`);
  // The core must load after the RUBIK modules it is wired into (it is the last block of the page).
  const firstR03=scripts.indexOf(A.SCRIPTS[0]);
  assert.ok(firstR03>scripts.indexOf('js/project-core.js')&&firstR03>scripts.indexOf('js/delivery-client.js'),'R03 loads after RUBIK');
  assert.equal(scripts.slice(firstR03).length,A.SCRIPTS.length,'nothing else loads after the R03 block');
  for (const h of A.HOOKS) assert.equal((html.match(h.pattern)||[]).length,h.count,`hook: ${h.what}`);
  assert.equal((html.match(/RubikCabinet[A-Za-z]*/g)||[]).length,A.GLOBAL_REFERENCES,'no other reference to the R03 globals');
  assert.doesNotMatch(html,/labs\//,'nothing from labs/ (SCULPT laboratories stay out of the product)');
});
test('I0: original MIT attribution and contributor notice remain present', () => {
  const notice=fs.readFileSync(path.resolve(__dirname,'../docs/licenses/r03-donor-MIT.txt'),'utf8');
  assert.match(notice,/Copyright \(c\) 2026 wuyi/);
  assert.match(notice,/Portions Copyright \(c\) 2026 kai cai/);
  assert.match(notice,/Permission is hereby granted, free of charge/);
});
