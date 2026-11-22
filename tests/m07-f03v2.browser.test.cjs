// M07 · F03 V2 en el producto (Chromium): vivienda con acabados exteriores asignados por la ruta real → Escena 3D →
// «Detalle arquitectónico» → «Fachadas ▾» → interruptor ON → materiales del acabado asignado → OFF con retorno EXACTO
// (píxel a píxel) → proyecto, almacenamiento y cámara intactos. Además: fallo de carga de un material (parcial con motivo).
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),PROJECT=path.join(__dirname,'fixtures/f03v2/vivienda-ejemplo-fachadas.json'),SHOTS=process.env.M07_SHOTS||'';
const T={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.glb':'model/gltf-binary','.svg':'image/svg+xml','.hdr':'application/octet-stream'};
let browser,server,port,fail=null;
before(async()=>{server=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
  if(fail&&fail(p)){r.writeHead(503);return r.end('fallo inyectado');}
  const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
  r.writeHead(200,{'content-type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));port=server.address().port;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
const quiet=pg=>pg.waitForFunction(()=>{const q=window.View3D.architecturalQuality();return q.facade.status!=='loading'&&q.facade.resources.pending===0;},null,{timeout:120000})
 .then(()=>pg.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
const canvas=pg=>pg.evaluate(()=>document.querySelector('#view3d canvas').toDataURL('image/png'));
const state=pg=>pg.evaluate(()=>{const a=View3D.architecturalQuality();return {enabled:a.enabled,v2:!!a.facadeV2,status:a.facade.status,active:a.facade.active.length,error:a.facade.error};});
async function open(){
 const ctx=await browser.newContext({viewport:{width:1440,height:900}});await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
 const pg=await ctx.newPage(),errors=[];pg.on('pageerror',e=>errors.push(e.message));pg.setDefaultTimeout(120000);
 await pg.goto(`http://127.0.0.1:${port}/`);await pg.waitForFunction(()=>window.FloorPlanApp&&document.getElementById('welcomeExample'));
 await pg.evaluate(()=>document.querySelector('#welcomeDialog[open]')&&document.getElementById('welcomeExample').click());
 await pg.waitForFunction(()=>!document.querySelector('#welcomeDialog[open]'));
 await pg.setInputFiles('#fileIn',PROJECT);await pg.waitForFunction(id=>FloorPlanApp.project?.id===id,JSON.parse(fs.readFileSync(PROJECT,'utf8')).id);
 await pg.click('button[data-view="3d"]');
 await pg.waitForFunction(()=>{const m=View3D.lifecycleMetrics;return document.getElementById('stage')?.classList.contains('is3d')&&m&&!m.animating&&!m.flying&&!m.pendingAssets;});
 await pg.evaluate(()=>View3D.presentationRestorePose({position:[2.545,1.6,12.4],target:[2.545,1.4,5.4],quaternion:[0,0,0,1],fov:45}));
 await pg.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 return {ctx,pg,errors};
}

test('ON/OFF reversible por la interfaz real, con el material asignado a cada muro y el proyecto intacto',{timeout:600000},async()=>{
 const {ctx,pg,errors}=await open();
 try{
  const project0=await pg.evaluate(()=>JSON.stringify(FloorPlanApp.project)),storage0=await pg.evaluate(()=>JSON.stringify({...localStorage}));
  await pg.click('#architecturalQuality');await quiet(pg);const B=await canvas(pg);
  assert.equal((await state(pg)).enabled,true);assert.equal(await pg.locator('#facadeV2Menu').isVisible(),true,'«Fachadas ▾» appears with the architectural detail');
  await pg.click('#facadeV2Menu');assert.equal(await pg.getAttribute('#facadeV2Menu','aria-expanded'),'true');
  const items=await pg.locator('#facadeV2List li').allTextContents();assert.ok(items.some(t=>/Revoco pintado/.test(t)&&/elegible/.test(t)),items.join(' | '));
  await pg.click('#facadeV2Toggle');await quiet(pg);
  const on=await state(pg);assert.equal(on.v2,true);assert.equal(on.status,'ready');assert.ok(on.active>=10,'walls with V2: '+on.active);
  const C=await canvas(pg);assert.notEqual(C,B,'the higher-fidelity materials are visible');
  if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await pg.screenshot({path:path.join(SHOTS,'m07-menu-activo.png')});}
  await pg.click('#facadeV2Toggle');await quiet(pg);
  assert.equal((await state(pg)).v2,false);assert.equal(await canvas(pg),B,'OFF returns exactly to the previous image');
  assert.equal(await pg.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project0,'project untouched');
  assert.equal(await pg.evaluate(()=>JSON.stringify({...localStorage})),storage0,'storage untouched (session-only toggle)');
  assert.deepEqual(errors,[]);
 }finally{await ctx.close();}
});

test('fallo de carga de un material: resultado parcial con su motivo, el resto se aplica y nada se rompe',{timeout:600000},async()=>{
 fail=p=>/\/assets\/materials\/f03\/v2\/wood_planks_grey\//.test(p);
 const {ctx,pg,errors}=await open();
 try{
  await pg.click('#architecturalQuality');await quiet(pg);await pg.click('#facadeV2Menu');await pg.click('#facadeV2Toggle');await quiet(pg);
  const s=await state(pg);assert.equal(s.status,'partial');assert.match(String(s.error),/wood_planks_grey/);assert.ok(s.active>0);
  assert.match(await pg.locator('#facadeV2Pop').textContent(),/fallo de carga|no se ha podido cargar|carga/i);
  assert.deepEqual(errors,[]);
 }finally{fail=null;await ctx.close();}
});
