'use strict';
/* R02-A · guarda de activación (equivalente a I0/I1 de R03) y convivencia con R03 en index.html. Se apoya en
   tests/r02a-activation-manifest.cjs y tests/r03-activation-manifest.cjs: lo que cargan las dos activaciones está
   enumerado y cualquier otra cosa falla. Nada se relaja: las guardas I0/I1/A4 de R03 siguen exigiendo lo suyo. */
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const M = require('./r02a-activation-manifest.cjs'), R03 = require('./r03-activation-manifest.cjs');
const Schema = require('../js/project-schema.js');

test('activación R02-A: los seis módulos exactos, una vez, en orden, desde js/, después de RUBIK y antes del bloque R03', () => {
  const html = M.indexHtml(), scripts = M.loadedScripts(html), r02 = scripts.filter(s => /r02/i.test(s));
  assert.deepEqual(r02, M.SCRIPTS);
  for (const f of M.SCRIPTS) assert.ok(fs.existsSync(path.resolve(__dirname, '..', f)), `${f} existe`);
  const at = f => scripts.indexOf(f), first = at(M.SCRIPTS[0]), last = at(M.SCRIPTS.at(-1));
  assert.equal(last - first, M.SCRIPTS.length - 1, 'bloque contiguo');
  assert.ok(first > at('js/project-core.js') && first > at('js/safe-dom.js') && first > at('js/project-library.js'), 'después de los módulos de RUBIK que usa');
  assert.ok(last < at(R03.SCRIPTS[0]), 'antes del bloque R03, que sigue siendo el último de la página (I1)');
  assert.doesNotMatch(html, /labs\//, 'nada de labs/');
  for (const s of r02) assert.doesNotMatch(s, /^(https?:)?\/\//, 'mismo origen');
});

test('activación R02-A: los puntos de conexión exactos y ninguna otra referencia al global', () => {
  const html = M.indexHtml();
  for (const h of M.HOOKS) assert.equal((html.match(h.pattern) || []).length, h.count, `punto de conexión: ${h.what}`);
  assert.equal((html.match(/RubikCeiling[A-Za-z]*/g) || []).length, M.GLOBAL_REFERENCES, 'ninguna otra referencia a los globales R02-A');
  const t = M.TRACING_HOOK;assert.equal((M.read(t.file).match(t.pattern) || []).length, t.count, 'tracing-ui: la misma reconciliación, una vez');
  // Las dos activaciones no se llaman entre sí: cada una pasa solo por su puente.
  for (const f of M.SCRIPTS) assert.doesNotMatch(M.read(f), /RubikCabinet/, `${f} no usa R03`);
  for (const f of R03.SCRIPTS) assert.doesNotMatch(M.read(f), /RubikCeiling/, `${f} no usa R02-A`);
});

test('I0 de R02-A: el esquema canónico no se amplía; los techos viven solo en extensions["x-r02a-ceiling"]', () => {
  for (const def of ['object', 'room', 'wall'].filter(d => Schema.$defs[d]?.properties))
    for (const k of Object.keys(Schema.$defs[def].properties)) assert.doesNotMatch(k, /ceiling|r02a|drop|clearHeight/i, `sin propiedad de techo en ${def}: ${k}`);
  assert.doesNotMatch(Object.keys(Schema.properties || {}).join(' '), /ceiling|r02a/i, 'sin colección nueva en el proyecto');
  assert.deepEqual(Object.keys(Schema.$defs.extensions.patternProperties), ['^x-[a-z0-9-]{1,40}$']);
  assert.match('x-r02a-ceiling', new RegExp(Object.keys(Schema.$defs.extensions.patternProperties)[0]), 'la clave cabe en el espacio x- genérico');
});
