// R03 · holguras en SOLO LECTURA dentro del diálogo de interiores (autorización del 20/11/2026). Positivos, negativos y
// evidencia visual en 1440×900 y 390×844. El servidor y el navegador son los de r03-editor-in-rubik.browser.
// (Cabecera original:) SCULPT-R03 · el editor de interiores DENTRO del editor real de RUBIK (index.html).
// De extremo a extremo, en 1440×900, 390×844 y 844×390, con el proyecto de ejemplo (datos sintéticos):
// botón solo en armarios → diálogo → dividir, balda, cajones con rechazo explicado → Ctrl+Z del diálogo solo deshace la
// edición del armario (no el proyecto) → guardar = un paso del deshacer de RUBIK → 3D exacto (altura y posición) →
// deshacer/rehacer de RUBIK → recargar (persistencia local) → duplicar con interior → borrar sin huérfanos.
// Activación R03-I1: además, archivo del proyecto (exportar → importar) e interior dañado en solo lectura.
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
for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`R03 holguras · ${viewport.width}x${viewport.height}`,{timeout:300000},async t=>{
 const mobile=viewport.width<1000,name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await require('./editor-fixture.cjs')(page);
 const shot=async id=>{if(shots)await page.screenshot({path:path.join(shots,`r03-holguras-${name}-${id}.png`)});};
 const press=async l=>{await l.scrollIntoViewIfNeeded();if(mobile)await l.tap();else await l.click();await page.waitForTimeout(200);};
 const openDialog=async()=>{await page.evaluate(id=>{select({kind:'furn',id});drawer('panel',true);},WARDROBE);await page.waitForTimeout(300);
  await press(page.locator('#aInterior').first());await page.locator('.r03-rubik-dialog .r03-clear').waitFor({state:'attached'});};
 const closeDialog=()=>page.evaluate(()=>RubikCabinetRubikUI.close());
 const state=()=>page.evaluate(()=>{const b=document.querySelector('.r03-clear');return {hidden:b.hidden,summary:b.dataset.summary,text:b.querySelector('.r03-clear-sum').textContent,
  groups:[...b.querySelectorAll('.r03-clear-group')].map(g=>({kind:g.dataset.kind,level:g.className.split('is-')[1],items:[...g.querySelectorAll('li')].map(li=>li.textContent)}))};});
 const fingerprint=()=>page.evaluate(()=>JSON.stringify(project));

 // 1 · Positivo de control: el armario del ejemplo, tal cual. La sección existe y es de solo lectura (no hay controles).
 const before=await fingerprint(),undo0=await page.evaluate(()=>undoStack.length);
 await openDialog();const s0=await state();assert.equal(s0.hidden,false);
 assert.equal(await page.locator('.r03-clear button,.r03-clear input,.r03-clear select').count(),0,'sin acciones: no propone ni aplica');
 await shot('1-ejemplo');await closeDialog();
 assert.equal(await fingerprint(),before,'abrir y mirar no cambia el proyecto');assert.equal(await page.evaluate(()=>undoStack.length),undo0);

 // 2 · Positivo: un mueble dentro del barrido de la primera puerta (colocado a propósito por la prueba, en un paso del deshacer).
 const intruder=await page.evaluate(id=>{const w=project.objects.find(o=>o.id===id),r=RubikCabinetContract.read(project,id);
   const g=RubikCabinetClearance.clearanceGeometry(w,r.outer,r.cabinet),P=g.doors[0].plan.sector,c={x:P.reduce((s,p)=>s+p.x,0)/P.length,y:P.reduce((s,p)=>s+p.y,0)/P.length};
   const o=project.objects.filter(x=>!RubikCabinetBridge.isCabinet(x)&&x.id!==id).sort((a,b)=>a.size.widthMm*a.size.depthMm-b.size.widthMm*b.size.depthMm)[0];
   mutate(()=>{const t=project.objects.find(x=>x.id===o.id);t.position={x:Math.round(c.x),y:Math.round(c.y)};t.size={...t.size,widthMm:200,depthMm:200};});return {id:o.id,name:FloorPlanDisplayName(o.name,o.type)};},WARDROBE);
 const moved=await fingerprint();
 await openDialog();const s1=await state();
 const rubik=s1.groups.find(g=>g.kind==='door-swing-square');
 assert.ok(rubik,'aviso de RUBIK por el barrido: '+JSON.stringify(s1));assert.equal(rubik.level,'rubik');
 assert.ok(rubik.items.some(x=>x.includes(`«${intruder.name}»`)),JSON.stringify(rubik.items));
 for(const g of s1.groups)assert.ok(['rubik','donor','experimental'].includes(g.level),'cada aviso con su autoridad');
 assert.match(s1.text,/no impiden guardar/);
 assert.doesNotMatch(await page.locator('.r03-rubik-dialog').innerText(),/[\u3400-\u9fff]/,'sin chino visible (regla del propietario)');await shot('2-mueble-en-el-barrido');

 // 3 · Negativo: los avisos NO bloquean el guardado ni aplican nada. Un cambio del borrador recalcula la sección.
 const g0=s1.groups.length;await press(page.locator('.r03-rubik-dialog button',{hasText:'Añadir balda'}).first());
 assert.equal((await state()).groups.length,g0,'una balda no cambia la apertura');
 await press(page.locator('.r03-rubik-dialog button',{hasText:'Guardar interior'}).first());
 assert.match(await page.locator('.r03-rubik-dialog .r03-msg').innerText(),/guardado/i,'se guarda aunque haya avisos');
 const after=await page.evaluate(id=>({undo:undoStack.length,intruder:project.objects.find(o=>o.id===id)}),intruder.id);
 assert.deepEqual(after.intruder.position,JSON.parse(moved).objects.find(o=>o.id===intruder.id).position,'el mueble no se mueve: nada se aplica');
 await shot('3-guardado-con-avisos');await closeDialog();

 // 4 · Negativo: sin el módulo de holguras, el diálogo funciona igual y la sección no aparece (sin errores).
 await page.evaluate(()=>{window.__clr=window.RubikCabinetClearance;delete window.RubikCabinetClearance;});
 await openDialog();assert.equal((await state()).hidden,true);await closeDialog();
 await page.evaluate(()=>{window.RubikCabinetClearance=window.__clr;});
 assert.deepEqual(errors,[]);
});
