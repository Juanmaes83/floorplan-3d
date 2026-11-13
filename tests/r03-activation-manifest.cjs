// SCULPT-R03 · manifiesto de la activación R03-I1 (no es una prueba: lo usan las pruebas I0/I1 y A4).
//
// Hasta R03-I0 (#198) y la preintegración (#214), dos pruebas exigían que index.html NO cargase R03.
// La activación R03-I1 autoriza EXACTAMENTE lo que hay aquí y nada más:
//   · una hoja de estilos y ocho módulos R03, en este orden y solo desde js/ y css/ (mismo origen);
//   · cinco puntos de conexión en el editor, todos a través del puente (RubikCabinetBridge) o de su diálogo
//     (RubikCabinetRubikUI);
//   · ningún módulo de laboratorio (labs/) ni de otras piedras SCULPT (R01, R02, …).
// Sigue PROHIBIDO, sin cambios: ampliar el esquema canónico (FloorPlanProjectV1). El interior vive solo en
// extensions['x-r03-cabinet'] y nunca en una propiedad nueva del objeto.
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const STYLES = Object.freeze(['css/r03-cabinet-editor.css']);
const SCRIPTS = Object.freeze([
  'js/r03-cabinet-core.js', 'js/r03-cabinet-contract.js', 'js/r03-cabinet-editor-core.js', 'js/r03-cabinet-editor-ui.js',
  'js/r03-cabinet-geometry.js', 'js/r03-cabinet-three.js', 'js/r03-cabinet-bridge.js', 'js/r03-cabinet-rubik-ui.js',
]);
// Cada punto de conexión, con el número exacto de apariciones permitidas en index.html.
const HOOKS = Object.freeze([
  { what: 'botón «Interior del armario…» solo en armarios', pattern: /window\.RubikCabinetBridge\?\.isCabinet\(/g, count: 1 },
  { what: 'abrir el diálogo y guardar dentro de mutate()', pattern: /window\.RubikCabinetRubikUI\.open\(/g, count: 1 },
  { what: 'borrar sin dejar interiores huérfanos', pattern: /window\.RubikCabinetBridge\?\.afterDelete\(/g, count: 1 },
  { what: 'duplicar con su interior', pattern: /window\.RubikCabinetBridge\?\.afterDuplicate\(/g, count: 1 },
  { what: 'armario exacto en el 3D del editor', pattern: /window\.RubikCabinetBridge\?\.model3D\(/g, count: 1 },
]);
// Total de referencias a los globales R03 en index.html: las cinco de arriba y ninguna más.
const GLOBAL_REFERENCES = 5;

const indexHtml = () => fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const loadedScripts = html => [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);
const loadedStyles = html => [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/g)].map(m => m[1]);

module.exports = { STYLES, SCRIPTS, HOOKS, GLOBAL_REFERENCES, indexHtml, loadedScripts, loadedStyles };
