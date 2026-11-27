// «Tu proyecto cobra vida»: tres efectos con guion > 20 s, requisitos sobre datos reales y estimación honesta.
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../js/pelicula-efectos-core.js'),ref=require('../js/reference-project.js');
test('tres efectos con nombre ES/EN, qué explica, inicio, transición y final',()=>{
 assert.deepEqual(E.EFFECTS.map(e=>e.id),['pieza-a-pieza','maqueta-abierta','desde-el-paisaje']);
 for(const e of E.EFFECTS)for(const k of ['name','explains','chooseWhen','start','transition','end'])assert.ok(e[k].es&&e[k].en,e.id+' '+k);});
test('cada guion dura estrictamente más de 20 s, planos contiguos y fotogramas coherentes',()=>{
 for(const e of E.EFFECTS){const s=E.script(e.id);assert.ok(s.seconds>20,e.id);let t=0;for(const sh of s.shots){assert.equal(sh.seconds[0],t);t=sh.seconds[1];}assert.equal(s.frames,Math.round(s.seconds*24));assert.equal(s.shots.at(-1).frames[1],s.frames-1);}});
test('requisitos sobre el proyecto real: el ejemplo cumple Pieza a pieza y Maqueta abierta; Desde el paisaje pide emplazamiento',()=>{
 assert.equal(E.requirements('pieza-a-pieza',ref).ready,true);assert.equal(E.requirements('maqueta-abierta',ref).ready,true);
 const p=E.requirements('desde-el-paisaje',ref,{siteMissing:['parcel']});assert.equal(p.ready,false);
 assert.deepEqual(p.rows.filter(r=>!r.ok).map(r=>r.key),['site']);assert.deepEqual(p.rows.find(r=>r.key==='site').missing,['parcel']);
 assert.equal(E.requirements('desde-el-paisaje',ref,{siteMissing:[]}).ready,true,'con emplazamiento completo y la entrada marcada del ejemplo');
 const vacio={rooms:[],walls:[],openings:[]};assert.equal(E.requirements('pieza-a-pieza',vacio).ready,false);});
test('estimación: sin medición real dice «no disponible»; con medición da rango y factores',()=>{
 const s=E.script('maqueta-abierta'),p=E.PROFILES[0];assert.deepEqual(E.estimate(s,p,{}).available,false);
 const r=E.estimate(s,p,{'revision-720':30});assert.equal(r.seconds,720*30);assert.ok(r.low<r.seconds&&r.high>r.seconds);assert.equal(r.factors.at(-1).source,'measured');});
