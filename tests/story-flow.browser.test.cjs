'use strict';
/* §7.2 · Historia del cambio: de la variante a la descarga desde la interfaz normal, con perfil NUEVO (proyecto inicial) y
   sin instrucciones externas. Estados: sin variante → «Crear variante» (se abre en Diseñar, identificada en la cabecera,
   original intacto); variante idéntica → «Variante creada. Edita algo…» + «Editar variante» (también desde el comparador);
   cambio guardado → revisión con progreso «N de N imágenes listas», motivo de cada acción bloqueada, previsualizar y
   descargar; vuelta contextual (Diseñar ⇄ historia con el MISMO par y capítulo; al cerrar, Entregar recupera ficha y foco);
   cancelación sin escrituras; revisión obsoleta que dice cómo rehacer y conserva la propuesta; comparador → «Preparar
   historia para el cliente» con el mismo par. Escritorio 1440×900 y móvil 390×844. Capturas opcionales: SL_SHOTS=<dir>. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const K=require('./ux07/kit.cjs'),{accion}=require('./helpers-perla-entregar.cjs');
const shots=process.env.SL_SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const CJK=/[㐀-鿿]/,LIB='rubik-sota-project-library-v1';
let env;test.before(async()=>{env=await K.start({authority:true});});test.after(async()=>{await env?.stop();});

async function fresh(viewport){
 const ctx=await env.browser.newContext({acceptDownloads:true,viewport});const page=await ctx.newPage();const w=K.watch(page,env.base);
 await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false)){await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#welcomeDialog[open]'));}
 return {ctx,page,w};}
const deliver=async page=>{await page.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));await page.waitForSelector('#professionalWorkspace [data-route="story-layers"]',{state:'attached'});};
const card=page=>page.evaluate(()=>{const c=document.querySelector('#professionalWorkspace [data-module="story-layers"]');const b=c.querySelector('[data-route="story-layers"]');
 return {state:c.dataset.storyState,step:+c.dataset.storyStep,action:b.textContent.trim(),status:c.querySelector('.professional-state').textContent,steps:[...c.querySelectorAll('.sl-card-steps li')].map(l=>l.textContent)};});
const P10=async page=>{const b=await accion(page,'#professionalWorkspace [data-route="story-layers"]');await b.scrollIntoViewIfNeeded();return b;};
const inDesign=page=>page.waitForFunction(()=>!document.body.classList.contains('professional-area')&&!document.querySelector('#storyLayersDialog[open]')&&!document.getElementById('storyReturn')?.hidden);
const back=async page=>{await page.locator('[data-sl-return="back"]').click();await page.waitForSelector('#storyLayersDialog[open]');};
const lib=page=>page.evaluate(k=>JSON.parse(FloorPlanApp.storage.getItem(k)),LIB);
const entries=l=>(l.entries||[]);
// Un cambio real hecho como la persona: seleccionar un mueble en el plano y pulsar Suprimir.
async function removeFurniture(page){const id=await page.evaluate(()=>FloorPlanApp.project.objects?.[0]?.id||null);
 const n0=await page.evaluate(()=>FloorPlanApp.project.objects.length);
 await page.evaluate(i=>select({kind:'furn',id:i}),id);await page.locator('#plan').focus().catch(()=>{});await page.keyboard.press('Delete');
 await page.waitForFunction(n=>FloorPlanApp.project.objects.length===n-1,n0);await page.evaluate(()=>FloorPlanApp.persistence.requireSaved());return id;}
const noOverlap=(page,sel)=>page.evaluate(s=>{const b=document.querySelector(s)?.getBoundingClientRect();if(!b)return ['sin barra'];
 return [...document.querySelectorAll('header button, #stage button, #stage .perla-canvas-top *, #fab, #mobileDock button')].filter(n=>n.getClientRects().length&&!n.closest(s)).filter(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.right>b.left+1&&r.left<b.right-1&&r.bottom>b.top+1&&r.top<b.bottom-1;})
  // Solo cuenta lo que la persona podría pulsar si la barra no estuviera: lo que está encima en su punto central.
  .filter(n=>{const bar=document.querySelector(s),r=n.getBoundingClientRect();bar.style.visibility='hidden';const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);bar.style.visibility='';return !!hit&&(hit===n||n.contains(hit));})
  .map(n=>n.id||n.textContent.trim().slice(0,30));},sel);

test('§7.2 · escritorio: sin variante → crear → idéntica → editar → cambio → revisión → descarga, con vuelta contextual y comparador',{timeout:420000},async()=>{
 const {ctx,page,w}=await fresh({width:1440,height:900});try{
  await deliver(page);
  // 1) Sin variante: la ficha se titula «Historia del cambio», enseña los tres pasos y ofrece «Crear variante».
  let c=await card(page);assert.equal(c.state,'no-variant');assert.equal(c.step,1);assert.equal(c.action,'Crear variante');
  assert.deepEqual(c.steps,['Crear y editar variante','Revisar el cambio','Descargar para el cliente']);
  if(shots)await (await P10(page)).evaluate(b=>b.closest('.professional-card,.perla-ref')?.scrollIntoView({block:'center'}));if(shots)await page.screenshot({path:shots+'/1-p10-sin-variante.png'});
  const geo=p=>JSON.stringify(['walls','openings','rooms','objects','materials'].map(k=>p[k]));
  const orig0=await page.evaluate(()=>({id:FloorPlanApp.entryInfo().id,project:JSON.parse(JSON.stringify(FloorPlanApp.project))}));
  await (await P10(page)).click();await inDesign(page);
  // Diseñar con la variante abierta e identificada en la cabecera; el original no cambia.
  const l1=await lib(page),act=entries(l1).find(e=>e.id===l1.activeId);assert.ok(act.variantOf,'la entrada abierta es una variante');
  assert.equal(geo(entries(l1).find(e=>e.id===orig0.id).project),geo(orig0.project),'el original se conserva');assert.equal(act.variantOf,orig0.id);
  const hdr=await page.locator('#projectsBtn').getAttribute('data-perla-name');assert.match(hdr,/Variante/,'la cabecera nombra la variante que se edita: '+hdr);
  assert.match(await page.locator('#storyReturn').innerText(),/Editando la variante «.+Variante 1» · el original «.+» se conserva/);
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.slReturn),'back','el foco va a «Volver a la historia»');
  assert.deepEqual(await noOverlap(page,'#storyReturn'),[],'la barra no tapa acciones');
  if(shots)await page.screenshot({path:shots+'/2-disenar-variante-barra.png'});
  // 2) Variante idéntica: la historia lo explica y la acción es «Editar variante».
  await back(page);assert.equal(await page.locator('[data-sl="identical"]').innerText(),'Variante creada. Edita algo para mostrar el primer cambio.');
  assert.ok(await page.locator('[data-sl="edit-variant"]').evaluate(b=>b.classList.contains('primary')&&document.activeElement===b));
  if(shots)await page.locator('#storyLayersDialog').screenshot({path:shots+'/3-historia-variante-identica.png'});
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#storyLayersDialog[open]'));
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.route),'story-layers','al cerrar, el foco vuelve a la ficha P10');
  c=await card(page);assert.equal(c.state,'identical');assert.equal(c.action,'Editar variante');assert.match(c.status,/^Variante creada\. Edita algo/);
  // El comparador, con el mismo par, ofrece también «Editar variante».
  const pair=await page.evaluate(()=>{const t=FloorPlanApp.storyTargets();return {before:t.pairs[0].before.id,after:t.pairs[0].after.id,href:FloorPlanApp.compareTargets().pairs[0].href};});
  const cmp=await ctx.newPage();await cmp.goto(env.base+pair.href);await cmp.waitForSelector('#storyNext:not([hidden])');
  assert.equal(await cmp.locator('#storyNextBtn').innerText(),'Editar variante');assert.match(await cmp.locator('#storyNextBtn').getAttribute('href'),new RegExp('\\?editar='+pair.before+'~'+pair.after+'$'));
  await cmp.close();
  // 3) Editar variante → Diseñar → un cambio real → Volver a la historia (mismo par).
  await (await P10(page)).click();await inDesign(page);await removeFurniture(page);
  await back(page);await page.waitForSelector('#storyLayersDialog [data-sl="state"]');
  assert.equal(await page.locator('[data-sl="steps"] li[aria-current="step"]').innerText().then(t=>t.split('\n')[0]),'Revisar el cambio');
  const prog0=await page.locator('[data-sl="progress"]').innerText();assert.match(prog0,/^Revisión sin guardar · 0 de [1-9]\d* imágenes listas$/,prog0);
  assert.ok(await page.locator('[data-sl="download"]').isDisabled());assert.match(await page.locator('[data-sl="why"]').innerText(),/Guarda la revisión/,'el motivo del bloqueo se dice');
  assert.match(await page.locator('.sl-includes').innerText(),/No incluye notas internas/,'qué incluye el archivo');
  assert.match(await page.locator('[data-sl="p-summary"]').getAttribute('placeholder'),/^Proponemos: Mobiliario: 0 mueble\(s\) nuevo\(s\), 1 quitado/,'el resumen nombra el cambio real');
  assert.ok(await page.locator('#storyLayersDialog [data-chapter="furniture"] g.sl-callout[data-anchor^="object:"]').count()>=1,'rótulo anclado al mueble');
  // Capítulo y vuelta: escribir en un capítulo, ir a Diseñar desde la historia y volver al MISMO capítulo, con el texto.
  const ch=await page.evaluate(()=>document.querySelector('#storyLayersDialog .sl-chapter').dataset.chapter);
  const ta=page.locator(`#storyLayersDialog [data-chapter="${ch}"] textarea`);await ta.fill('Retiramos este mueble para ganar paso.');await ta.press('Tab');
  await page.locator('#storyLayersDialog [data-chapter="'+ch+'"] textarea').focus();await page.locator('[data-sl="edit-variant"]').click();await inDesign(page);
  assert.equal(await page.evaluate(()=>FloorPlanStoryLayersUI.returnContext.chapter),ch);
  await back(page);assert.equal(await page.evaluate(()=>document.activeElement?.closest('[data-chapter]')?.dataset.chapter),ch,'vuelve al mismo capítulo');
  assert.equal(await page.locator(`#storyLayersDialog [data-chapter="${ch}"] textarea`).inputValue(),'Retiramos este mueble para ganar paso.','con el texto escrito');
  // 4) Cancelar: cambiar el título y cerrar sin guardar no escribe nada.
  const dumpAll=()=>page.evaluate(()=>{const st=FloorPlanApp.storage,o={};for(const k of [...Object.keys(localStorage),'rubik-sota-project-library-v1'])o[k]=st.getItem(k)??localStorage.getItem(k);return JSON.stringify(o);});const s0=await dumpAll();
  await page.locator('[data-sl="p-title"]').fill('Título que no se guarda');await page.locator('[data-sl="p-title"]').press('Tab');await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('#storyLayersDialog[open]'));
  assert.equal(await dumpAll(),s0,'cancelar no escribe');
  // 5) Revisión → previsualizar → descargar.
  await (await P10(page)).click();await page.waitForSelector('#storyLayersDialog [data-sl="state"]');
  assert.notEqual(await page.locator('[data-sl="p-title"]').inputValue(),'Título que no se guarda');
  await page.locator('[data-sl="p-title"]').fill('Más paso en el salón');await page.locator('[data-sl="p-title"]').press('Tab');
  await page.locator('[data-sl="save"]').click();
  assert.match(await page.locator('[data-sl="progress"]').innerText(),/^Revisión guardada · 0 de [1-9]\d* imágenes listas$/);assert.match(await page.locator('[data-sl="why"]').innerText(),/Previsualiza como cliente/);
  assert.equal(await page.locator('[data-sl="steps"] li[aria-current="step"]').innerText(),'Descargar para el cliente');
  await page.locator('[data-sl="images"]').click();await page.waitForSelector('#storyLayersDialog [data-sl="preview"] img');
  const prog=await page.locator('[data-sl="progress"]').innerText();assert.match(prog,/^Revisión guardada · (\d+) de \1 imágenes listas$/,prog);
  if(shots)await page.locator('#storyLayersDialog').screenshot({path:shots+'/4-historia-lista.png'});
  const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('[data-sl="download"]').click()]);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'slf-')),zip=path.join(dir,'p.zip');await dl.saveAs(zip);execFileSync('python3',['-c','import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',zip,dir]);
  const man=JSON.parse(fs.readFileSync(path.join(dir,'propuesta/manifiesto.json'),'utf8'));assert.equal(man.title,'Más paso en el salón');assert.ok(man.pages.length>=1);
  for(const p of man.pages)assert.ok(fs.statSync(path.join(dir,p.file)).size>1000,'la imagen abre: '+p.file);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#storyLayersDialog[open]'));
  c=await card(page);assert.equal(c.state,'saved');assert.equal(c.step,3);
  // 6) Obsoleta: otro cambio en la variante; la historia dice cómo rehacer y conserva la propuesta.
  await (await P10(page)).click();await page.waitForSelector('#storyLayersDialog [data-sl="state"]');await page.locator('[data-sl="edit-variant"]').click();await inDesign(page);await removeFurniture(page);
  await back(page);await page.waitForSelector('#storyLayersDialog [data-sl="regenerate"]');
  assert.equal(await page.locator('[data-sl="state"]').getAttribute('data-state'),'OBSOLETE');assert.match(await page.locator('#storyLayersDialog .sl-how').innerText(),/Tu propuesta .* se conserva/);
  assert.ok(await page.locator('[data-sl="download"]').isDisabled());
  await page.locator('[data-sl="regenerate"]').click();await page.waitForSelector('#storyLayersDialog [data-sl="state"][data-state="INCOMPLETE"]');
  assert.equal(await page.locator('[data-sl="p-title"]').inputValue(),'Más paso en el salón','rehacer conserva la propuesta');
  await page.keyboard.press('Escape');
  // 7) Comparador con diferencias guardadas → «Preparar historia para el cliente» con el mismo par.
  const cmp2=await ctx.newPage();const w2=K.watch(cmp2,env.base);await cmp2.goto(env.base+pair.href);await cmp2.waitForSelector('#storyNext:not([hidden])');
  assert.equal(await cmp2.locator('#storyNextBtn').innerText(),'Preparar historia para el cliente');
  if(shots)await cmp2.locator('#storyNext').screenshot({path:shots+'/5-comparador-preparar-historia.png'});
  await cmp2.locator('#storyNextBtn').click();await cmp2.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
  await cmp2.waitForSelector('#storyLayersDialog[open] [data-sl="pairname"]');
  assert.doesNotMatch(cmp2.url(),/historia=/,'la dirección se limpia');assert.equal(await cmp2.evaluate(()=>document.body.classList.contains('professional-area')),true,'abre en Entregar');
  assert.equal(await cmp2.evaluate(a=>FloorPlanStoryLayersUI.state!==null&&FloorPlanApp.entryInfo().id===a,pair.after),true,'mismo par');
  for(const p of [page,cmp2])assert.doesNotMatch(await p.evaluate(()=>document.body.innerText),CJK);
  assert.deepEqual(w.errors,[]);assert.deepEqual(w2.errors,[]);assert.deepEqual(w.external,[]);
 }finally{await ctx.close();}
});

test('§7.2 · móvil 390×844: crear variante, barra sin solapes ni desbordes, volver a la historia y cerrar',{timeout:240000},async()=>{
 const {ctx,page,w}=await fresh({width:390,height:844});try{
  await deliver(page);assert.equal((await card(page)).action,'Crear variante');
  await (await P10(page)).click();await inDesign(page);
  if(shots)await page.screenshot({path:shots+'/6-movil-barra.png'});
  assert.deepEqual(await noOverlap(page,'#storyReturn'),[],'la barra no tapa acciones en móvil');
  const over=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(over<=1,'sin desplazamiento horizontal: '+over);
  await removeFurniture(page);await back(page);await page.waitForSelector('#storyLayersDialog [data-sl="state"]');
  const o2=await page.evaluate(()=>{const d=document.getElementById('storyLayersDialog');return d.scrollWidth-d.clientWidth;});assert.ok(o2<=1,'historia sin desborde: '+o2);
  if(shots)await page.locator('#storyLayersDialog').screenshot({path:shots+'/7-movil-historia.png'});
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#storyLayersDialog[open]'));
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.route),'story-layers');
  assert.doesNotMatch(await page.evaluate(()=>document.body.innerText),CJK);assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});
