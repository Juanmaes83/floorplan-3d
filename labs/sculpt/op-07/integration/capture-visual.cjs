// Uso (desde un árbol con los parches aplicados): CHROME=… node labs/sculpt/op-07/integration/capture-visual.cjs <carpeta>
// Captura comparativa: mismo proyecto de ejemplo con el muro recto (estado actual) y con el muro curvo e inclinado
// (S1–S5 aplicados), en 2D y en 3D, en el editor real. Ejecutar desde el árbol con los parches.
const path=require('path'),fs=require('fs/promises');const root=process.cwd();
const K=require(path.join(root,'tests/photo-project/kit.cjs')),F=require(path.join(root,'tests/op07/fixtures.cjs'));
const out=process.argv[2];
(async()=>{await fs.mkdir(out,{recursive:true});const env=await K.start();try{
 for(const [name,make] of [['01-recto',()=>({project:F.base(),wall:F.longest(F.base())})],['02-curvo',()=>F.curved(F.base(),{bulgeMm:700})],['03-curvo-inclinado',()=>F.curved(F.base(),{bulgeMm:700,heightEndMm:2200})],
  // 20/11/2026: el anillo tras dividir el muro curvo (S3b) y un hueco en un muro recto inclinado (corrección de S2).
  ['04-curvo-dividido',()=>{const c=F.curved(F.base(),{bulgeMm:700,withOpening:false}),C=require(path.join(root,'js/project-core.js')),r=C.splitWall(c.project,c.wall.id,Math.round(C.wallLength(c.wall)/2),{newId:'wal_op07-pieza2'});if(!r.ok)throw Error(r.explanation);return {project:r.project,wall:c.wall};}],
  ['05-recto-inclinado-ventana',()=>{const s=F.sloped(F.base(),{heightEndMm:2300});s.project.openings.push({id:'opn_op07-slopewin',wallId:s.wall.id,kind:'window',offsetMm:900,widthMm:1200,heightMm:1100,sillHeightMm:900});return s;}]]){
  const {context,page,watch}=await K.editor(env,{viewport:{width:1440,height:900},deviceScaleFactor:2});
  try{const {project,wall}=make();
   if(name!=='01-recto'){const r=await page.evaluate(p=>FloorPlanApp.applyExtension(()=>({ok:true,project:p})),project);if(!r.ok)throw Error(JSON.stringify(r));}
   // 2D: plano completo encuadrado, sin selección (el muro se ve tal cual).
   await page.evaluate(()=>{select(null);fitView();});await page.waitForTimeout(500);
   await page.locator('#plan').screenshot({path:path.join(out,`${name}-2d.png`)});
   await K.open3D(page);await page.waitForTimeout(800);
   await page.evaluate(()=>{const t=[...document.querySelectorAll('button')].find(b=>/Navegación/.test(b.textContent)&&b.getAttribute('aria-expanded')==='true');t?.click();document.getElementById('nav3dFrame-iso')?.click();});await page.waitForTimeout(1500);
   await page.locator('#stage').screenshot({path:path.join(out,`${name}-3d.png`)});
   if(watch.errors.length)console.log(name,'errores',watch.errors);
  }finally{await context.close();}}
}finally{await env.stop();}})();
