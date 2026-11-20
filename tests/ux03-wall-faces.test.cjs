'use strict';
// UX-03 · guardas de fuente: el panel de estancia ya no estima con 2,8 m fijos y lee la autoridad única (quantity-core).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('UX-03: sin 2,8 m fijos en el panel y con FloorPlanQuantities.room como única fuente',()=>{
 assert.doesNotMatch(html,/perim\(r\.poly\)\s*\*\s*2\.8/,'la estimación perímetro × 2,8 m desaparece');
 assert.doesNotMatch(html,/openings not deducted|未扣门窗/,'ni su texto ni su traducción');
 assert.match(html,/FloorPlanQuantities\?\.room\(project,id\)\?\.wallFaces/,'el panel lee quantity-core');
 const fn=html.slice(html.indexOf('function roomWallFacesBlock'),html.indexOf('function roomPanel('));
 assert.doesNotMatch(fn,/heightMm|2800|2\.8|perim\(/,'el panel no mide geometría por su cuenta');
 for(const r of ['invalid-room-polygon','room-wall-association-not-demonstrable','ambiguous-wall-face-association','invalid-wall-geometry','invalid-opening-geometry'])assert.ok(fn.includes(`'${r}'`),'causa y solución para '+r);
 assert.ok(html.indexOf('js/quantity-core.js')>0,'quantity-core se carga en el editor');
});
