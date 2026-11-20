// OP-07 · capturas AMPLIADAS (20/11/2026) en el editor real, estado activo de pruebas (A0 sustituto etiquetado):
// 06 ventana en muro recto inclinado (corrección S2) y 07 unión del muro curvo dividido (S3b). 2D encuadrado sobre el muro.
// Uso (desde el árbol con la serie): CHROME=… node labs/sculpt/op-07/integration/capture-zoom.cjs <carpeta>
const path=require('path'),fs=require('fs/promises'),root=process.cwd();
const K=require(path.join(root,'tests/r02a/editor-kit.cjs')),{withState}=require(path.join(root,'tests/op07/browser-state.cjs'));
globalThis.RUBIK_OP07_STATE='active';const F=require(path.join(root,'tests/op07/fixtures.cjs')),C=require(path.join(root,'js/project-core.js'));
const out=process.argv[2];
(async()=>{await fs.mkdir(out,{recursive:true});const env=withState(await K.start(),'active');try{
 const scenes=[['06-ventana-muro-inclinado',()=>{const s=F.sloped(F.base(),{heightEndMm:2300});s.project.openings.push({id:'opn_op07-slopewin',wallId:s.wall.id,kind:'window',offsetMm:900,widthMm:1200,heightMm:1100,sillHeightMm:900});return {project:s.project,focus:s.wall.id};}],
  ['07-union-muro-curvo-dividido',()=>{const c=F.curved(F.base(),{bulgeMm:700,withOpening:false}),r=C.splitWall(c.project,c.wall.id,Math.round(C.wallLength(c.wall)/2),{newId:'wal_op07-pieza2'});return {project:r.project,focus:'wal_op07-pieza2',joint:r.project.walls.find(w=>w.id==='wal_op07-pieza2').start};}]];
 for(const [name,make] of scenes){const {context,page}=await K.editor(env,{viewport:{width:1440,height:900},deviceScaleFactor:2});
  try{const {project,focus,joint}=make();const r=await page.evaluate(p=>FloorPlanApp.applyExtension(()=>({ok:true,project:p})),project);if(!r.ok)throw Error(JSON.stringify(r));
   await page.evaluate(([id,j])=>{select({kind:'wall',id});const w=FloorPlanApp.project.walls.find(x=>x.id===id),c=j||{x:(w.start.x+w.end.x)/2,y:(w.start.y+w.end.y)/2},pl=svg;
    const R=pl.getBoundingClientRect();view.s=j?0.35:0.16;view.x0=c.x-R.width/2/view.s;view.y0=c.y-R.height/2/view.s;applyView();
    // Corrección medida: llevar el punto de interés al centro visible del plano (matriz real del SVG).
    for(let k=0;k<2;k++){const m=pl.getScreenCTM(),pt=pl.createSVGPoint();pt.x=c.x;pt.y=c.y;const q=pt.matrixTransform(m),R2=pl.getBoundingClientRect();view.x0+=(q.x-(R2.left+R2.width/2))/(m.a||view.s);view.y0+=(q.y-(R2.top+R2.height/2))/(m.d||view.s);applyView();}
    renderAll();},[focus,joint||null]);
   await page.waitForTimeout(400);await page.screenshot({path:path.join(out,name+'-2d.png')});
   await page.evaluate(()=>setView('3d'));await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&View3D.contextAvailable,null,{timeout:60000});await page.waitForTimeout(1500);
   await page.screenshot({path:path.join(out,name+'-3d.png')});
  }finally{await context.close();}}
}finally{await env.stop();}})().catch(e=>{console.error(e);process.exit(1);});
