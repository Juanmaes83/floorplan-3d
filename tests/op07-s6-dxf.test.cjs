'use strict';
// OP-07 · S6 DXF (G-02): el muro curvo sale con las mismas facetas que el plano; los proyectos existentes, byte a byte
// iguales; el lector DXF de RUBIK lo vuelve a leer como facetas rectas (sin romper el camino exacto de G-02).
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const Core=require('../js/project-core.js'),{exportLevel}=require('../js/dxf-export.js'),{dxfFromText}=require('../js/plan-intake.js');
const DxfParser=require('../vendor/dxf-parser/dxf-parser.js'),Walls=require('../js/wall-geometry-core.js'),F=require('./op07/fixtures.cjs');
const parse=t=>new DxfParser().parseSync(t),layer=(d,l)=>d.entities.filter(e=>e.layer===l&&e.type==='LWPOLYLINE');

test('S6 · proyecto existente: DXF byte a byte idéntico a master (02712b51)',async()=>{
 assert.equal(crypto.createHash('sha256').update(await exportLevel(Core.initial())).digest('hex'),'bac0cac3910084887bbd1d77d46920035bcfec9a12263d1449d3cd87726f6fba');
});

test('S6 · muro curvo: piezas visibles = plano, una huella por faceta y relectura como facetas',async()=>{
 const {project,wall}=F.curved(F.base(),{withOpening:false});wall.status='existing';Core.validate(project);
 const text=await exportLevel(project),dxf=parse(text),n=Walls.facetCount(wall,Core.WALL_PATH);
 const pieces=Core.geometry(project).walls.filter(r=>r.status==='existing');
 assert.equal(layer(dxf,'WALLS_EXISTING').length,pieces.length,'las piezas del plano, una a una');
 const plain=parse(await exportLevel(F.base()));
 assert.equal(layer(dxf,'RUBIK_WALL_FOOTPRINT').length,layer(plain,'RUBIK_WALL_FOOTPRINT').length-1+n,'el muro curvo aporta una huella por faceta');
 assert.ok(layer(dxf,'RUBIK_WALL_FOOTPRINT').every(e=>e.vertices.length===4),'huellas de 4 vértices, como lee plan-intake');
 // Relectura con el lector de RUBIK: el camino exacto de G-02 sigue activo y las facetas reconstruyen la trayectoria.
 const back=await dxfFromText(text,{parse});const L=w=>Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y);
 const total=back.project.walls.reduce((s,w)=>s+L(w),0),expected=F.base().walls.filter(w=>w.status!=='demolished'&&w.id!==wall.id).reduce((s,w)=>s+L(w),0)+Core.wallLength(wall);
 assert.ok(Math.abs(total-expected)<=back.project.walls.length*1.5,`longitud releída ${total.toFixed(1)} ≈ ${expected.toFixed(1)} mm (redondeo a mm por muro)`);
});
