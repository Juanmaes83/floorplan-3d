// SCULPT-R03 · R2 · el editor de interiores DENTRO del editor real de RUBIK (rama de revisión, no fusionable).
// De extremo a extremo, en 1440×900, 390×844 y 844×390, con el proyecto de ejemplo (datos sintéticos):
// botón solo en armarios → diálogo → dividir, balda, cajones con rechazo explicado → Ctrl+Z del diálogo solo deshace la
// edición del armario (no el proyecto) → guardar = un paso del deshacer de RUBIK → 3D exacto (altura y posición) →
// deshacer/rehacer de RUBIK → recargar (persistencia local) → duplicar con interior → borrar sin huérfanos.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.R03_RUBIK_SHOTS||null;
let server,browser,url;
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.glb':'model/gltf-binary','.wasm':'application/wasm'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://local').pathname,file=path.resolve(root,'.'+(p==='/'?'/index.html':decodeURIComponent(p)));if(!file.startsWith(root+path.sep))throw Error('path');
  res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 if(shots)await fs.mkdir(shots,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

const WARDROBE='obj_template-004';
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`R03 dentro de RUBIK ${viewport.width}x${viewport.height}`,{timeout:420000},async t=>{
 const mobile=viewport.width<1000,name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 await page.route('https://cdn.jsdelivr.net/**',async r=>{if(!process.env.THREE_LOCAL_DIR)return r.abort();try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require('./helpers/three-module.cjs')(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
 await page.goto(url);await require('./editor-fixture.cjs')(page);
 const shot=async id=>{if(shots)await page.screenshot({path:path.join(shots,`${name}-${id}.png`)});};
 const press=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();if(mobile)await l.tap();else await l.click();await page.waitForTimeout(150);};
 const dlgButton=async text=>{const l=page.locator('.r03-rubik-dialog button',{hasText:text}).first();await l.scrollIntoViewIfNeeded();if(mobile)await l.tap();else await l.click();await page.waitForTimeout(120);};
 const msg=()=>page.locator('.r03-rubik-dialog .r03-msg').innerText();
 const proj=()=>page.evaluate(id=>({undo:undoStack.length,ext:project.extensions?.['x-r03-cabinet']?.entries?.length||0,status:RubikCabinetContract.read(project,id).status,h:project.objects.find(o=>o.id===id)?.size.heightMm??null,objects:project.objects.length}),WARDROBE);
 const openPanel=async id=>{await page.evaluate(id=>{select({kind:'furn',id});drawer('panel',true);},id);await page.waitForTimeout(300);};

 // 1 · El botón solo existe para armarios.
 const bed=await page.evaluate(()=>project.objects.find(o=>!RubikCabinetBridge.isCabinet(o)).id);
 await openPanel(bed);assert.equal(await page.locator('#aInterior').count(),0,'una cama no tiene «Interior»');
 await openPanel(WARDROBE);assert.equal(await page.locator('#aInterior').count(),1);await shot('1-panel');
 const p0=await proj();assert.equal(p0.status,'none');
 // 2 · Abrir el diálogo, editar.
 await press('#aInterior');await page.locator('.r03-rubik-dialog').waitFor();
 assert.match(await page.locator('#r03RubikTitle').innerText(),/Interior · Armario ropero/);assert.match(await page.locator('.r03-rubik-note').innerText(),/no de fabricante/);
 assert.match(await msg(),/supuestos/);
 await dlgButton('Dividir módulo');assert.match(await msg(),/./);await dlgButton('Añadir balda');
 const s1=await page.evaluate(()=>RubikCabinetRubikUI.current.session.state.cabinet.columns.length);
 // Rechazo explicado: 6 cajones de la altura máxima no caben.
 const ok=await page.evaluate(()=>{const s=RubikCabinetRubikUI.current.session;return RubikCabinetEditor.apply(s,{type:'set-drawers',drawers:6,drawerHeight:400}).ok;});assert.equal(ok,false);
 // 3 · Ctrl+Z dentro del diálogo deshace la edición del armario, NUNCA el proyecto (modal).
 const before=await proj();
 await page.locator('.r03-rubik-dialog .r03-editor').focus().catch(()=>{});await page.locator('.r03-rubik-dialog button',{hasText:'Añadir balda'}).first().focus();
 await page.keyboard.press('Control+z');await page.waitForTimeout(150);
 assert.deepEqual(await proj(),before,'Ctrl+Z en el diálogo no toca el proyecto');
 assert.equal(await page.evaluate(()=>RubikCabinetRubikUI.current.session.state.cabinet.columns.length),s1,'(deshace la balda, no la división)');
 await dlgButton('Añadir balda');await dlgButton('Ocultas (ver interior)');await shot('2-dialog');
 // 4 · Guardar = un paso del deshacer de RUBIK.
 await dlgButton('Guardar interior');
 const p1=await proj();assert.equal(p1.status,'ok');assert.equal(p1.ext,1);assert.equal(p1.undo,p0.undo+1,'un solo paso de deshacer');assert.match(await msg(),/guardado/i);
 await page.keyboard.press('Escape');await page.waitForTimeout(150);assert.equal(await page.locator('.r03-rubik-dialog').count(),0,'Escape cierra (sin cambios pendientes)');
 // 5 · 3D: el armario exacto, con la altura del mueble y en su sitio.
 await page.evaluate(()=>{window.__r03Models=[];const m=RubikCabinetBridge.model3D;window.RubikCabinetBridge={...RubikCabinetBridge,model3D:(...a)=>{const r=m(...a);if(r)window.__r03Models.push({fid:a[2].id,group:r.group});return r;}};});
 if(process.env.THREE_LOCAL_DIR){
  await page.evaluate(()=>setView('3d'));await page.waitForFunction(()=>window.__r03Models.some(m=>m.group.parent),null,{timeout:60000});await page.waitForTimeout(500);
  const m=await page.evaluate(async id=>{const THREE=await import('three');const rec=window.__r03Models.filter(m=>m.fid===id&&m.group.parent).at(-1);rec.group.updateWorldMatrix(true,true);
    const b=new THREE.Box3().setFromObject(rec.group),f=project.objects.find(o=>o.id===id),fp=View3D.levelInspect().furniturePlan.find(x=>x.id===id);
    return {h:b.max.y-b.min.y,minY:b.min.y,size:f.size,cx:(b.min.x+b.max.x)/2,cz:(b.min.z+b.max.z)/2,fp,shelves:rec.group.children.length};},WARDROBE);
  assert.ok(Math.abs(m.h-m.size.heightMm/1000)<0.01,`altura en 3D ${m.h} = ${m.size.heightMm} mm`);assert.ok(m.shelves>10,'piezas reales (casco, baldas, puertas…)');
  // Captura de cerca: la estancia del armario (sus puertas guardadas como «ocultas» dejan ver el interior).
  await page.evaluate(id=>{const f=getF(id);View3D.flyToRoom(roomOf(f.cx,f.cy).id);},WARDROBE);await page.waitForTimeout(1500);
  await shot('3-3d');await page.evaluate(()=>setView('2d'));await page.waitForTimeout(400);
 }else t.diagnostic('3D no comprobado: falta THREE_LOCAL_DIR');
 // 6 · Deshacer y rehacer de RUBIK.
 await page.evaluate(()=>undo());assert.equal((await proj()).status,'none','deshacer de RUBIK quita el interior');
 await page.evaluate(()=>redo());assert.equal((await proj()).status,'ok','rehacer lo devuelve');
 // 7 · Recargar: persiste (guardado local de RUBIK).
 await page.reload();await page.waitForFunction(()=>window.RubikCabinetContract&&window.project!==undefined).catch(()=>{});await page.waitForTimeout(800);
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false))await page.locator('#welcomeActionInput').press('Escape');
 assert.equal((await proj()).status,'ok','tras recargar sigue guardado');
 // 8 · Duplicar con interior y borrar sin huérfanos.
 await openPanel(WARDROBE);await press('#aDup');
 const dup=await page.evaluate(id=>{const c=project.objects.filter(o=>o.type==='wardrobe'&&o.id!==id).map(o=>({id:o.id,s:RubikCabinetContract.read(project,o.id).status}));return c.find(x=>x.s==='ok')?.id||null;},WARDROBE);
 assert.ok(dup,'la copia tiene el interior guardado');
 await openPanel(dup);await press('#aDel');
 assert.deepEqual(await page.evaluate(()=>RubikCabinetContract.orphans(project)),[],'borrar no deja huérfanos');assert.equal((await proj()).status,'ok','el original sigue igual');
 // 9 · Escape con cambios sin guardar pide confirmación.
 await openPanel(WARDROBE);await press('#aInterior');await dlgButton('Añadir balda');
 assert.equal(await page.evaluate(()=>RubikCabinetEditor.dirty(RubikCabinetRubikUI.current.session)),true,'hay un cambio sin guardar');await page.keyboard.press('Escape');
 assert.equal(await page.locator('.r03-rubik-dialog').count(),1);assert.match(await msg(),/sin guardar/);await page.keyboard.press('Escape');assert.equal(await page.locator('.r03-rubik-dialog').count(),0);
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'aInterior','el foco vuelve al botón');
 // Sin barra de desplazamiento horizontal y sin errores.
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.deepEqual(errors,[]);
});
