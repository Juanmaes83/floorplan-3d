'use strict';
// OP-07 · S4 3D en el editor real (Chromium, 1440x900, 844x390 y 390x844): un muro curvo e inclinado se construye con
// piezas con pendiente del núcleo único; los demás muros siguen siendo cajas; sin errores ni red externa.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
const K=require('./photo-project/kit.cjs'),F=require('./op07/fixtures.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
for(const viewport of [{width:1440,height:900},{width:844,height:390},{width:390,height:844}])
test(`S4 · muro curvo e inclinado en 3D ${viewport.width}x${viewport.height}`,{timeout:180000},async()=>{
 const {context,page,watch}=await K.editor(env,{viewport});
 try{
  const {project,wall}=F.curved(F.base(),{heightEndMm:2400});
  const r=await page.evaluate(p=>FloorPlanApp.applyExtension(()=>({ok:true,project:p})),project);assert.equal(r.ok,true,JSON.stringify(r));
  await K.open3D(page);await page.waitForFunction(()=>window.View3D.wallsInspect().length>0);
  const meshes=await page.evaluate(()=>View3D.wallsInspect()),mine=meshes.filter(m=>m.wallId===wall.id),others=meshes.filter(m=>m.wallId!==wall.id);
  const pieces=await page.evaluate(id=>FloorPlanCore.geometry(FloorPlanApp.project).walls.filter(r=>r.id===id).length,wall.id);
  assert.ok(mine.length>=pieces&&mine.every(m=>m.sloped),'cada pieza del muro curvo es una pieza con pendiente');
  assert.ok(others.every(m=>!m.sloped),'los demás muros siguen siendo cajas');
  const top=Math.max(...mine.map(m=>m.maxY));assert.ok(top<=2.8+1e-6&&top>2.4,'cima entre 2,4 y 2,8 m');
  if(process.env.OP07_SHOTS){await fs.mkdir(process.env.OP07_SHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.OP07_SHOTS,`s4-3d-${viewport.width}x${viewport.height}.png`)});}
  assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
 }finally{await context.close();}
});
