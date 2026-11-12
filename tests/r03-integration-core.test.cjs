// R03-I0 · pure engine integration gate. No editor, persistence or product UX wired.
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
test('I0: no schema expansion or editor binding is implicitly authorized', () => {
  assert.equal(Schema.$defs.object.additionalProperties,false);
  assert.equal(Schema.$defs.object.properties.cabinetInterior,undefined);
  const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
  assert.doesNotMatch(html,/r03-cabinet-core\.js/);
});
test('I0: original MIT attribution and contributor notice remain present', () => {
  const notice=fs.readFileSync(path.resolve(__dirname,'../docs/licenses/r03-donor-MIT.txt'),'utf8');
  assert.match(notice,/Copyright \(c\) 2026 wuyi/);
  assert.match(notice,/Portions Copyright \(c\) 2026 kai cai/);
  assert.match(notice,/Permission is hereby granted, free of charge/);
});
