'use strict';
// OP-07 · S4b en el renderer real: render bajo demanda de OP-02 intacto (sin fotogramas en reposo), coste de reconstruir
// el 3D con un muro curvo frente al mismo proyecto recto, y vista del salón con el muro curvo e inclinado (modo Recorrer).
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
const K=require('./photo-project/kit.cjs'),F=require('./op07/fixtures.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
async function measure(project,shot){
 const {context,page,watch}=await K.editor(env,{viewport:{width:1440,height:900}});
 try{
  if(project){const r=await page.evaluate(p=>FloorPlanApp.applyExtension(()=>({ok:true,project:p})),project);assert.equal(r.ok,true);}
  await K.open3D(page);await page.waitForTimeout(800);
  // Reconstrucción completa del 3D con este proyecto (la misma ruta que tras un cambio).
  const rebuild=await page.evaluate(async()=>{const t=[];for(let i=0;i<5;i++){const a=performance.now();FloorPlanApp.applyExtension(p=>({ok:true,project:{...p,name:p.name+' '}}));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));t.push(performance.now()-a);}t.sort((a,b)=>a-b);return t[2];});
  await page.waitForTimeout(600);const f0=await page.evaluate(()=>View3D.renderedFrames);await page.waitForTimeout(2000);const idle=await page.evaluate(()=>View3D.renderedFrames)-f0;
  const meshes=await page.evaluate(()=>View3D.wallsInspect().length);
  if(shot){await page.evaluate(()=>{document.getElementById('nav3dToggle')?.getAttribute('aria-expanded')==='true'&&document.getElementById('nav3dToggle').click();View3D.flyToRoom('rom_living');});await page.waitForTimeout(2500);
   await fs.mkdir(path.dirname(shot),{recursive:true});await page.locator('#stage').screenshot({path:shot});}
  assert.deepEqual(watch.errors,[]);return {rebuild,idle,meshes};
 }finally{await context.close();}
}
test('S4b · render bajo demanda (OP-02): 0 fotogramas en reposo y coste de reconstrucción medido',{timeout:240000},async()=>{
 const plain=await measure(null),{project}=F.curved(F.base(),{heightEndMm:2400});const curved=await measure(project,process.env.OP07_SHOTS?path.join(process.env.OP07_SHOTS,'s4b-salon-3d.png'):null);
 console.log(`# OP-02 · reposo: recto ${plain.idle} / curvo ${curved.idle} fotogramas en 2 s · reconstrucción (mediana de 5): recto ${plain.rebuild.toFixed(1)} ms / curvo ${curved.rebuild.toFixed(1)} ms · mallas de muro ${plain.meshes} → ${curved.meshes}`);
 assert.equal(plain.idle,0);assert.equal(curved.idle,0,'el muro curvo no despierta el bucle de render');
 assert.ok(curved.meshes>plain.meshes);
});
