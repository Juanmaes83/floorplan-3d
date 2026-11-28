// Guarda: cada pieza del kit (scene-delivery-core KIT) tiene cabecera esperada en scene-export-ui (KIT_HEAD) y su fuente empieza
// por ella. Si falta una, la interfaz descarta el kit entero y el ZIP sale sin render ni rodaje (regresión de d46eb6be).
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=require('../js/scene-delivery-core.js'),root=path.join(__dirname,'..');
test('KIT_HEAD cubre todo el KIT y cada fuente empieza por su cabecera',()=>{
 const ui=fs.readFileSync(path.join(root,'js/scene-export-ui.js'),'utf8');const SPDX='# SPDX-License-Identifier: GPL-3.0-or-later';
 const HEAD=Function('SPDX','return '+/const KIT_HEAD=(\{[^;]*\});/.exec(ui)[1])(SPDX);
 assert.deepEqual(Object.keys(HEAD).sort(),Object.keys(D.KIT).sort());
 for(const [k,src] of Object.entries(D.KIT_SOURCES))assert.ok(fs.readFileSync(path.join(root,src),'utf8').startsWith(HEAD[k]),k+' '+src);});
