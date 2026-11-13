// SCULPT-R02-A · manifiesto de la activación R02-A en el editor (no es una prueba: lo usan las guardas de R02-A y la A4 de
// R03 para que las dos activaciones convivan sin relajar ninguna).
//
// Hasta la integración (#223), dos pruebas de #203/#217 exigían que index.html NO cargase R02-A, y la A4 de R03 vetaba
// cualquier script «r02a». La integración de R02-A (EXPERIMENTAL, pendiente del GO del propietario) autoriza EXACTAMENTE
// lo que hay aquí y nada más:
//   · seis módulos R02-A, en este orden y solo desde js/ (mismo origen); ninguna hoja de estilos propia (el panel trae
//     la suya en línea);
//   · seis puntos de conexión en index.html y uno en js/tracing-ui.js, todos a través de RubikCeilingEditor o de
//     FloorPlanApp.applyCeiling (que pasa por commit(): validación, deshacer y guardado de RUBIK);
//   · ningún módulo de laboratorio (labs/) ni de otras piedras SCULPT.
// Sigue PROHIBIDO: ampliar el esquema canónico. Los techos viven solo en extensions['x-r02a-ceiling'] (contrato candidato).
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const SCRIPTS = Object.freeze([
  'js/r02a-donor-extracts.js', 'js/r02a-ceiling-core.js', 'js/r02a-ceiling-session.js',
  'js/r02a-ceiling-contract.js', 'js/r02a-ceiling-bridge.js', 'js/r02a-ceiling-editor.js',
]);
const HOOKS = Object.freeze([
  { what: 'commit(): retirar el techo de una estancia eliminada en el mismo paso', pattern: /window\.RubikCeilingEditor\?\.reconcile\(/g, count: 1 },
  { what: 'sección «Techo y elementos altos» en el panel de la estancia', pattern: /window\.RubikCeilingEditor\?\.roomPanel\(/g, count: 1 },
  { what: 'renderAll(): capa del plano y avisos', pattern: /window\.RubikCeilingEditor\?\.render\(/g, count: 1 },
  { what: 'grupo 3D propio, creado una vez', pattern: /window\.RubikCeilingEditor\?\.create3D\(/g, count: 1 },
  { what: 'sync() del 3D: origen del plano', pattern: /window\.RubikCeilingEditor\?\.update3D\(/g, count: 1 },
  { what: 'FloorPlanApp.applyCeiling: escribir solo por commit()', pattern: /applyCeiling\(fn\)\{/g, count: 1 },
]);
// Referencias al global R02-A en index.html: las cinco de RubikCeilingEditor de arriba y ninguna más.
const GLOBAL_REFERENCES = 5;
// js/tracing-ui.js borra estancias sin pasar por commit(): la misma reconciliación, una vez.
const TRACING_HOOK = Object.freeze({ file: 'js/tracing-ui.js', pattern: /window\.RubikCeilingEditor\?\.reconcile\(/g, count: 1 });

const read = f => fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8');
const indexHtml = () => read('index.html');
const loadedScripts = html => [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);

module.exports = { SCRIPTS, HOOKS, GLOBAL_REFERENCES, TRACING_HOOK, read, indexHtml, loadedScripts };
