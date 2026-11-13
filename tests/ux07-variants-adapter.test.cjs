'use strict';
/* UX-07 · adaptador Variantes → comparador, con la BIBLIOTECA REAL de RUBIK (FloorPlanLibrary): el original y una variante
   creada con su propia API (library.variant), el grupo que devuelve library.group(activeId) y los presupuestos guardados.
   Datos sintéticos (fixtures del laboratorio) y precios ficticios. */
const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../js/project-library.js'),V=require('../js/variants-compare-adapter.js'),F=require('../labs/ux07-ent04/fixtures.js'),Core=require('../js/project-core.js');
const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),dump:()=>JSON.stringify([...m])};};
// Flujo real del editor: biblioteca con el original (antes); «Crear variante» copia lo que se ve y abre la variante
// (library.variant); la persona la reforma y se guarda (library.save). Resultado: original intacto + variante reformada.
function library(){
  const storage=memory(),lib=L.load(storage,F.before());
  lib.variant(F.before(),'Reforma A');const v=lib.group(lib.activeId()).find(g=>g.id===lib.activeId());
  const edited=F.after();edited.id=v.project.id;edited.name=v.project.name;lib.save(edited);
  return {storage,lib,group:lib.group(lib.activeId())};
}

test('el grupo real de la biblioteca: original frente a la variante, relación de variante y los 7 cambios reales',()=>{
  const {lib,group}=library();assert.equal(group.length,2);assert.equal(group[1].variantOf,group[0].id);
  const p=V.pairs(group,lib.activeId());assert.deepEqual(p.map(x=>[x.beforeId,x.afterId,x.active]),[[group[0].id,group[1].id,true]]);
  const r=V.prepare({group,activeId:lib.activeId(),beforeId:group[0].id,afterId:group[1].id});
  assert.equal(r.relation,'library-variant');assert.notEqual(r.before.id,r.after.id,'la variante tiene su propio identificador de proyecto');
  assert.deepEqual(r.comparison.counts,{added:2,removed:1,modified:4,total:7});assert.deepEqual(r.labels,{before:group[0].name,after:'Reforma A'});
  assert.equal(r.budgetComparison,null);assert.ok(r.notes.some(n=>/no muestra importes/.test(n)));
});

test('la distribución abierta usa lo que se ve en el editor (como renderVariants), no la copia guardada',()=>{
  const {lib,group}=library(),visible=Core.clone(group[1].project);visible.rooms.find(r=>r.id==='rom_kitchen').floorMaterialId='mat_marble';
  const r=V.prepare({group,activeId:lib.activeId(),activeProject:visible,beforeId:group[0].id,afterId:group[1].id});
  const k=r.comparison.materials.find(m=>m.entityId==='rom_kitchen');assert.equal(k.after.name,'Mármol');
  assert.ok(r.notes.some(n=>/está abierta: se compara lo que ves/.test(n)));
});

test('presupuestos guardados de cada proyecto: comparación completa; uno solo: «one-sided»; nunca se inventa',()=>{
  const {lib,group}=library(),[o,v]=group;
  const budgets={[o.project.id]:F.budget('complete',o.project),[v.project.id]:F.budget('complete',v.project)};
  const r=V.prepare({group,activeId:lib.activeId(),beforeId:o.id,afterId:v.id,budgets});
  assert.equal(r.budgetComparison.status,'complete');assert.ok(r.budgetComparison.totals.net.delta>0);
  const one=V.prepare({group,activeId:lib.activeId(),beforeId:o.id,afterId:v.id,budgets:{[v.project.id]:budgets[v.project.id]}});
  assert.equal(one.budgetComparison.status,'one-sided');assert.equal(one.budgets.before,null);
  // Un presupuesto guardado bajo el id de la variante pero hecho para otro proyecto: rechazado, no se compara.
  assert.throws(()=>V.prepare({group,activeId:lib.activeId(),beforeId:o.id,afterId:v.id,budgets:{[v.project.id]:budgets[o.project.id]}}),e=>e.code==='budget-subject-mismatch');
});

test('fuera del grupo, la misma entrada o sin grupo: error explicado; no se declara una relación que la biblioteca no tiene',()=>{
  const {lib,group}=library();
  assert.throws(()=>V.prepare({group,beforeId:group[0].id,afterId:group[0].id}),e=>e.code==='same-entry');
  assert.throws(()=>V.prepare({group,beforeId:group[0].id,afterId:'prj_otro'}),e=>e.code==='not-in-group');
  assert.throws(()=>V.prepare({group:[],beforeId:'a',afterId:'b'}),e=>e.code==='group-required');
  assert.deepEqual(V.pairs([group[0]],lib.activeId()),[],'sin variantes no hay nada que comparar');
});

test('no muta el grupo, el proyecto abierto ni los presupuestos; ni escribe en la biblioteca',()=>{
  const {storage,lib,group}=library(),[o,v]=group,budgets={[v.project.id]:F.budget('partial',v.project)},visible=Core.clone(v.project);
  const snap=JSON.stringify([group,budgets,visible]),before=storage.dump();
  V.prepare({group,activeId:lib.activeId(),activeProject:visible,beforeId:o.id,afterId:v.id,budgets});
  assert.equal(JSON.stringify([group,budgets,visible]),snap);assert.equal(storage.dump(),before);
});

test('handoff: parámetros de URL para abrir el comparador en solo lectura con esas dos entradas',()=>{
  assert.equal(V.handoff({beforeId:'prj_a b',afterId:'prj_ü'}),'src=library&before=prj_a%20b&after=prj_%C3%BC');
  assert.throws(()=>V.handoff({beforeId:'x'}),e=>e.code==='ids-required');
});
