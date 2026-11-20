'use strict';
// OP-07 · S5 en el editor real: las operaciones de muro pasan por el camino único de edición (applyExtension), con su
// validación, su deshacer/rehacer y su guardado; una división que cruza una abertura se rechaza sin tocar nada.
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./photo-project/kit.cjs'),F=require('./op07/fixtures.cjs');
let env;test.before(async()=>{env=require('./op07/browser-state.cjs').withState(await K.start(),'active');});test.after(async()=>{await env?.stop();});
test('S5 · curvar, dividir, deshacer y rehacer en el editor; rechazo atómico',{timeout:180000},async()=>{
 const {context,page,watch}=await K.editor(env);
 try{
  const p=F.base(),w=F.longest(p);
  const json=()=>page.evaluate(()=>JSON.stringify(FloorPlanApp.project));const start=await json();
  const curved=await page.evaluate(([id,c])=>FloorPlanApp.applyExtension(p=>FloorPlanCore.setWallCurve(p,id,c)),[w.id,{x:(w.start.x+w.end.x)/2,y:(w.start.y+w.end.y)/2+1200}]);
  assert.equal(curved.ok,true,JSON.stringify(curved));const afterCurve=await json();
  const split=await page.evaluate(id=>FloorPlanApp.applyExtension(p=>FloorPlanCore.splitWall(p,id,1500,{newId:'wal_op07-ui'})),w.id);assert.equal(split.ok,true,JSON.stringify(split));
  assert.ok(await page.evaluate(()=>FloorPlanApp.project.walls.some(x=>x.id==='wal_op07-ui')));
  await page.evaluate(()=>undo());assert.equal(await json(),afterCurve,'deshacer devuelve el muro curvo sin dividir');
  await page.evaluate(()=>redo());assert.ok(await page.evaluate(()=>FloorPlanApp.project.walls.some(x=>x.id==='wal_op07-ui')),'rehacer');
  await page.evaluate(()=>{undo();undo();});assert.equal(await json(),start,'dos pasos atrás: el proyecto de partida');
  // Rechazo atómico: dividir sobre la ventana nueva no cambia nada y explica por qué.
  await page.evaluate(([id,c])=>FloorPlanApp.applyExtension(p=>FloorPlanCore.setWallCurve(p,id,c)),[w.id,{x:(w.start.x+w.end.x)/2,y:(w.start.y+w.end.y)/2+1200}]);
  await page.evaluate(id=>FloorPlanApp.applyExtension(p=>({ok:true,project:{...p,openings:[...p.openings,{id:'opn_op07-ui',wallId:id,kind:'window',offsetMm:1000,widthMm:1000,heightMm:1100,sillHeightMm:900}]}})),w.id);
  const before=await json(),refused=await page.evaluate(id=>FloorPlanApp.applyExtension(p=>FloorPlanCore.splitWall(p,id,1500)),w.id);
  assert.equal(refused.ok,false);assert.match(refused.explanation[0],/atraviesa una abertura/);assert.equal(await json(),before);
  assert.deepEqual(watch.errors,[]);
 }finally{await context.close();}
});
