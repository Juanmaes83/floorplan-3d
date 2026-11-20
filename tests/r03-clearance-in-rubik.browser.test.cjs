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
 const state=()=>page.evaluate(()=>{const b=document.querySelector('.r03-clear');return {hidden:b.hidden,open:b.open,summary:b.dataset.summary,ms:+b.dataset.ms,paintMs:+b.dataset.paintMs,text:b.querySelector('.r03-clear-sum').textContent,title:document.querySelector('#r03RubikTitle').textContent,
  groups:[...b.querySelectorAll('.r03-clear-group')].map(g=>({kind:g.dataset.kind,count:+g.dataset.count,level:g.className.split('is-')[1],items:[...g.querySelectorAll('li')].map(li=>li.textContent)}))};});
 const fingerprint=()=>page.evaluate(()=>JSON.stringify(project));

 // 1 · Positivo de control: el armario del ejemplo, tal cual. La sección existe y es de solo lectura (no hay controles).
 const before=await fingerprint(),undo0=await page.evaluate(()=>undoStack.length);
 await openDialog();const s0=await state();assert.equal(s0.hidden,false);
 assert.equal(s0.open,false,'detalle plegado por defecto: prioridad al dibujo');
 assert.doesNotMatch(s0.title,/Armario ropero «Armario»/,'sin nombre redundante');assert.match(s0.title,/^Interior · Armario ropero · \d+ × \d+ mm$/);
 // El dibujo del armario empieza en la mitad superior de la pantalla, también en móvil.
 const elevTop=await page.evaluate(()=>document.querySelector('.r03-rubik-dialog .r03-elev')?.getBoundingClientRect().top??9999);
 assert.ok(elevTop<viewport.height*0.5,`dibujo visible pronto (top ${Math.round(elevTop)} px de ${viewport.height})`);
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
 assert.match(s1.text,new RegExp(`^Conflictos: puertas ${rubik.count}( · cajones \\d+)?\\. Orientativo: \\d+\\. No impiden guardar\\.$`),s1.text);assert.equal(rubik.count,1);
 await page.locator('.r03-clear>summary').click();assert.equal((await state()).open,true,'el detalle se despliega');
 assert.doesNotMatch(await page.locator('.r03-rubik-dialog').innerText(),/[\u3400-\u9fff]/,'sin chino visible (regla del propietario)');await shot('2-mueble-en-el-barrido');

 // 3 · Rendimiento durante la edición: 20 cambios. Tres medidas por cambio: cálculo; sección completa (cálculo + DOM +
 //     maquetación + fotograma pintado); y de extremo a extremo, del clic al siguiente fotograma pintado.
 const samples=[];
 for(let i=0;i<20;i++){const label=i%2?'Deshacer':'Añadir balda';
  const e2e=await page.evaluate(label=>new Promise(res=>{const b=[...document.querySelectorAll('.r03-rubik-dialog button')].find(x=>x.textContent.trim()===label&&!x.disabled);if(!b)return res(null);
   const t0=performance.now();b.click();requestAnimationFrame(()=>setTimeout(()=>res(performance.now()-t0),0));}),label);
  await page.waitForTimeout(30);const st=await state();samples.push({calc:st.ms,section:st.paintMs,e2e});}
 const stat=k=>{const v=samples.map(x=>x[k]).filter(Number.isFinite).sort((a,b)=>a-b);return {n:v.length,p50:v[Math.floor(v.length/2)],p95:v[Math.min(v.length-1,Math.ceil(v.length*0.95)-1)],max:v.at(-1)};};
 const perf={viewport:name,calc:stat('calc'),section:stat('section'),e2e:stat('e2e'),env:await page.evaluate(()=>({ua:navigator.userAgent,cores:navigator.hardwareConcurrency,dpr:devicePixelRatio,gl:(()=>{try{const g=document.createElement('canvas').getContext('webgl');const d=g.getExtension('WEBGL_debug_renderer_info');return g.getParameter(d.UNMASKED_RENDERER_WEBGL);}catch{return null;}})()}))};
 for(const k of ['calc','section','e2e'])assert.ok(perf[k].n>=10,`${k}: muestras ${perf[k].n}`);
 assert.ok(perf.calc.p95<50,`cálculo p95 ${perf.calc.p95} ms`);assert.ok(perf.section.p95<100,`sección completa p95 ${perf.section.p95} ms`);
 if(shots)await fs.writeFile(path.join(shots,`r03-holguras-rendimiento-${name}.json`),JSON.stringify(perf,null,1));
 console.log(`# rendimiento ${name} · cálculo p50 ${perf.calc.p50} / p95 ${perf.calc.p95} ms · sección p50 ${perf.section.p50} / p95 ${perf.section.p95} ms · clic→fotograma p50 ${perf.e2e.p50?.toFixed(1)} / p95 ${perf.e2e.p95?.toFixed(1)} ms`);
 // 3b · Negativo: los avisos NO bloquean el guardado ni aplican nada. Un cambio del borrador recalcula la sección.
 const g0=s1.groups.length;await press(page.locator('.r03-rubik-dialog button',{hasText:'Añadir balda'}).first());
 assert.equal((await state()).groups.length,g0,'una balda no cambia la apertura');
 await press(page.locator('.r03-rubik-dialog button',{hasText:'Guardar interior'}).first());
 assert.match(await page.locator('.r03-rubik-dialog .r03-msg').innerText(),/guardado/i,'se guarda aunque haya avisos');
 const after=await page.evaluate(id=>({undo:undoStack.length,intruder:project.objects.find(o=>o.id===id)}),intruder.id);
 assert.deepEqual(after.intruder.position,JSON.parse(moved).objects.find(o=>o.id===intruder.id).position,'el mueble no se mueve: nada se aplica');
 await shot('3-guardado-con-avisos');await closeDialog();

 // 5 · Nombres: solo se omite el nombre si es EXACTAMENTE el del tipo; uno parcial o personalizado se muestra siempre.
 for(const [nameSet,expect] of [['Arm',/^Interior · Armario ropero «Arm» · /],['Armario',/^Interior · Armario ropero · /],['Col',/^Interior · Armario ropero «Col» · /]]){
  await page.evaluate(([id,n])=>mutate(()=>{project.objects.find(o=>o.id===id).name=n;}),[WARDROBE,nameSet]);await openDialog();
  assert.match((await state()).title,expect,nameSet);await closeDialog();}
 // 6 · Localización COMPLETA en EN y ZH (sin excepciones): todo el texto visible, aria-label y title del diálogo y del
 //     editor. Y el comportamiento del editor en inglés: teclado, rechazo explicado, Escape con cambios y foco devuelto.
 const SPANISH=/[áéíóúñ¿¡]|\b(choca|muro|estancia|Conflictos|Holguras|guardar|Guardar|Cerrar|Armario|medidas|Medidas|puertas|Puertas|cajones|Cajones|Balda|Baldas|módulo|Módulos|Deshacer|Rehacer|Restablecer|Cancelar|Quitar|Añadir|Dividir|Unir|Barra|Ancho|Fondo|Alto|Altura|Interior por defecto|Sin cambios|Aviso)\b/;
 const texts=()=>page.evaluate(()=>{const d=document.querySelector('.r03-rubik-dialog'),out=[];const w=document.createTreeWalker(d,NodeFilter.SHOW_TEXT);for(let n;(n=w.nextNode());){const t=n.nodeValue.trim();if(t)out.push(t);}
  for(const el of d.querySelectorAll('[aria-label],[title]'))for(const v of [el.getAttribute('aria-label'),el.getAttribute('title')])if(v)out.push(v);return out;});
 for(const lang of ['en','zh']){
  await page.evaluate(l=>setLang(l),lang);await page.waitForTimeout(200);
  assert.equal(await page.locator('#aInterior').first().textContent(),lang==='en'?'Cabinet interior…':'柜体内部…');
  await openDialog();await page.locator('.r03-clear>summary').click();
  const all=await texts(),bad=all.filter(t=>SPANISH.test(t));
  assert.deepEqual(bad,[],`${lang}: textos en español en el diálogo: ${JSON.stringify(bad.slice(0,10))}`);
  if(lang==='zh')assert.ok(all.some(t=>/[一-鿿]/.test(t)),'zh: hay texto chino');
  if(lang==='en'){
   const en=await page.evaluate(()=>{const d=document.querySelector('.r03-rubik-dialog');return {title:d.querySelector('#r03RubikTitle').textContent,close:d.querySelector('.r03-rubik-close').textContent,note:d.querySelector('.r03-rubik-note').textContent};});
   assert.match(en.title,/^Interior · Wardrobe( «[^»]+»)? · \d+ × \d+ mm$/);assert.equal(en.close,'Close');assert.match(en.note,/^Experimental parametric interior/);
   // Operación → mensaje en inglés; teclado de pestañas (→) cambia de módulo con su etiqueta inglesa.
   await page.locator('.r03-rubik-dialog button',{hasText:'Add shelf'}).first().click();
   assert.equal(await page.locator('.r03-rubik-dialog .r03-msg').innerText(),'Shelf added.');
   await page.locator('#r03-tab-0').focus();await page.keyboard.press('ArrowRight');
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'r03-tab-1');assert.match(await page.locator('.r03-rubik-dialog legend',{hasText:'Bays'}).innerText(),/^Bays · editing B2$/);
   // Rechazo explicado en inglés (demasiados cajones), sin cambiar nada.
   for(let i=0;i<12;i++)await page.locator('.r03-rubik-dialog button[aria-label="One drawer more"]').click({force:true}).catch(()=>{});
   const msg=await page.locator('.r03-rubik-dialog .r03-msg').innerText();assert.doesNotMatch(msg,SPANISH,msg);assert.match(msg,/drawers|bay|Drawers/i,msg);
   // Escape con cambios sin guardar: pide confirmación en inglés; el segundo cierra y el foco vuelve a «Cabinet interior…».
   await page.locator('.r03-rubik-dialog .r03-rubik-sheet').focus();await page.keyboard.press('Escape');
   assert.match(await page.locator('.r03-rubik-dialog .r03-msg').innerText(),/^There are unsaved changes\. Press Escape again to close without saving them\.$/);
   await page.keyboard.press('Escape');assert.equal(await page.locator('.r03-rubik-dialog').count(),0,'el segundo Escape cierra');
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'aInterior','el foco vuelve al botón que lo abrió');
   if(shots)await (async()=>{await openDialog();await page.screenshot({path:path.join(shots,`r03-holguras-${name}-4-ingles.png`)});await closeDialog();})();
  } else { if(shots)await page.screenshot({path:path.join(shots,`r03-holguras-${name}-5-chino.png`)});await closeDialog(); }
 }
 await page.evaluate(()=>setLang('es'));await page.waitForTimeout(150);
 // 4 · Negativo: sin el módulo de holguras, el diálogo funciona igual y la sección no aparece (sin errores).
 await page.evaluate(()=>{window.__clr=window.RubikCabinetClearance;delete window.RubikCabinetClearance;});
 await openDialog();assert.equal((await state()).hidden,true);await closeDialog();
 await page.evaluate(()=>{window.RubikCabinetClearance=window.__clr;});
 assert.deepEqual(errors,[]);
});
