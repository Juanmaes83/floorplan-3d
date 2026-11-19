'use strict';
// UX-03 · Panel de estancia: paredes de la estancia (cara interior) con la autoridad única de quantity-core.
// Para CADA estancia del ejemplo, las cifras bruta, huecos y neta del panel son las de FloorPlanQuantities.room(…)
// y la neta coincide con la fila de esa estancia en «Cantidades del proyecto» (Presupuestar). Sin 2,8 m fijos. Si no
// se puede calcular, el panel dice por qué y cómo resolverlo, y ofrece abrir el muro. Solo lectura. 1440x900 y 390x844.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`UX-03 · paredes de la estancia = quantity-core = Cantidades del proyecto ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await require('./editor-fixture.cjs')(page);
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 const rows=await page.evaluate(async()=>{
  const fmt=v=>v===null||v===undefined?'—':FloorPlanQuantitySchedule.round(v).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
  const schedule=new Map(FloorPlanQuantitySchedule.build(FloorPlanApp.project).rooms.map(r=>[r.id,r])),out=[];
  for(const room of FloorPlanApp.project.rooms){
   window.select({kind:'room',id:room.id});await new Promise(r=>setTimeout(r,30));
   const box=document.querySelector('#panel .wall-faces'),txt=k=>box?.querySelector(`[data-wall-face="${k}"] .big`)?.textContent??null;
   const f=FloorPlanQuantities.room(FloorPlanApp.project,room.id).wallFaces,row=schedule.get(room.id);
   out.push({id:room.id,panel:{gross:txt('gross'),openings:txt('openings'),net:txt('net')},core:{gross:fmt(f.status==='unavailable'||f.reason==='invalid-wall-geometry'?null:f.grossAreaM2),openings:fmt(f.openingAreaM2),net:fmt(f.netAreaM2)},
    schedule:row.wallNetM2===null?'—':row.wallNetM2.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}),
    text:document.querySelector('#panel .room-panel').innerText,openingM2:f.openingAreaM2,reason:f.reason||null});
  }
  return out;});
 assert.ok(rows.length>=10,'el ejemplo tiene todas sus estancias');
 for(const r of rows){
  assert.deepEqual(r.panel,r.core,`panel = quantity-core en ${r.id}`);
  assert.equal(r.panel.net,r.schedule,`panel = «Cantidades del proyecto» en ${r.id}`);
  assert.doesNotMatch(r.text,/2,8 ?m|2\.8 ?m|aprox\./,'sin estimación fija de 2,8 m');
  assert.match(r.text,/Paredes de la estancia · cara interior[\s\S]*Bruta[\s\S]*Huecos[\s\S]*Neta/);
 }
 assert.ok(rows.some(r=>r.openingM2>0),'al menos una estancia descuenta huecos reales');
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'el panel no modifica el proyecto');
 // Altura real: subir la altura de un muro de la estancia cambia la bruta en (Δaltura × tramo) y nada se estima.
 const real=await page.evaluate(async()=>{const room=FloorPlanApp.project.rooms[0],f0=FloorPlanQuantities.room(FloorPlanApp.project,room.id).wallFaces,seg=f0.segments[0],w=FloorPlanApp.project.walls.find(x=>x.id===seg.wallId),h=w.heightMm;
  w.heightMm=h+500;window.select({kind:'room',id:room.id});await new Promise(r=>setTimeout(r,30));const f1=FloorPlanQuantities.room(FloorPlanApp.project,room.id).wallFaces,shown=document.querySelector('#panel [data-wall-face="gross"] .big').textContent;w.heightMm=h;
  return {delta:f1.grossAreaM2-f0.grossAreaM2,expected:seg.lengthM*0.5,shown,gross:FloorPlanQuantitySchedule.round(f1.grossAreaM2).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})};});
 assert.ok(Math.abs(real.delta-real.expected)<1e-9,'la bruta usa la altura real del muro');assert.equal(real.shown,real.gross);
 // Casos honestos: altura no válida → causa, solución y «Abrir muro» que selecciona ese muro.
 const broken=await page.evaluate(async()=>{const room=FloorPlanApp.project.rooms[0],seg=FloorPlanQuantities.room(FloorPlanApp.project,room.id).wallFaces.segments[0],w=FloorPlanApp.project.walls.find(x=>x.id===seg.wallId),h=w.heightMm;
  w.heightMm=0;window.select({kind:'room',id:room.id});await new Promise(r=>setTimeout(r,30));
  const box=document.querySelector('#panel .wall-faces'),res={state:box.dataset.wallFaces,reason:box.querySelector('[data-wall-faces-reason]')?.dataset.wallFacesReason,text:box.innerText,net:box.querySelector('[data-wall-face="net"] .big').textContent,fix:box.querySelector('[data-wall-fix]')?.dataset.wallFix,wall:w.id,minH:Math.min(...[...box.querySelectorAll('.btn')].map(b=>b.getBoundingClientRect().height))};
  return {res,restore:()=>0,h};});
 assert.equal(broken.res.state,'incomplete');assert.equal(broken.res.reason,'invalid-wall-geometry');assert.equal(broken.res.net,'—','nunca se inventa una cifra');
 assert.match(broken.res.text,/no tiene una altura válida[\s\S]*corrige su altura/);assert.equal(broken.res.fix,broken.res.wall);assert.ok(broken.res.minH>=44,'objetivo táctil ≥ 44 px');
 await page.evaluate(()=>drawer('panel',true));await page.waitForTimeout(300);const fix=page.locator('#panel [data-wall-fix]').first();await fix.scrollIntoViewIfNeeded();mobile?await fix.tap():await fix.click();
 assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'wall',id:broken.res.wall},'«Abrir muro» lleva al muro que hay que corregir');
 await page.evaluate(({id,h})=>{FloorPlanApp.project.walls.find(x=>x.id===id).heightMm=h;},{id:broken.res.wall,h:broken.h});
 // Contorno sin ningún muro (estancia desplazada lejos de sus muros) → causa y solución, sin cifras.
 const none=await page.evaluate(async()=>{const p=FloorPlanApp.project,poly=p.rooms[0].polygon;p.rooms[0].polygon=poly.map(q=>({x:q.x+500000,y:q.y}));window.select({kind:'room',id:p.rooms[0].id});await new Promise(r=>setTimeout(r,30));
  const box=document.querySelector('#panel .wall-faces'),out={reason:box.querySelector('[data-wall-faces-reason]')?.dataset.wallFacesReason,net:box.querySelector('[data-wall-face="net"] .big').textContent,gross:box.querySelector('[data-wall-face="gross"] .big').textContent,text:box.innerText};p.rooms[0].polygon=poly;return out;});
 assert.equal(none.reason,'room-wall-association-not-demonstrable');assert.equal(none.gross,'—');assert.equal(none.net,'—');assert.match(none.text,/Ningún muro coincide[\s\S]*Dibuja sus muros/);
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);
 await page.evaluate(id=>{window.select({kind:'room',id});drawer('panel',true);},rows[0].id);await page.waitForTimeout(300);
 const fit=await page.evaluate(()=>{const s=document.querySelector('#panel .wall-faces-stats'),r=s.getBoundingClientRect(),p=document.querySelector('aside.right').getBoundingClientRect();return {inside:r.left>=p.left-1&&r.right<=p.right+1,scroll:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,overflow:[...s.children].some(c=>c.scrollWidth>c.clientWidth+1)};});
 assert.deepEqual(fit,{inside:true,scroll:false,overflow:false},'las tres cifras caben, sin desplazamiento horizontal');
 if(process.env.UX03_SHOTS){await fs.mkdir(process.env.UX03_SHOTS,{recursive:true});await page.locator('#panel .wall-faces').screenshot({path:path.join(process.env.UX03_SHOTS,`ux03-${viewport.width}.png`)});}
 assert.deepEqual(errors,[]);
});
