'use strict';
/* E2 · comparativas profesionales en el navegador, datos SINTÉTICOS (fixtures UX-07/ENT-04, precios ficticios):
   E2.1 acceso desde Entregar · E2.3 vigencia (cambio en otra pestaña, verify «íntegro» ≠ «vigente») · D02 cero escrituras ·
   E2.5 orden de cambio (motivo obligatorio, delta solo coherente, sin plazo sin plan, sin firma) · 1440/820/390 sin desborde.
   Evidencia visual opcional: E2_SHOTS=<dir>. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const K=require('./ux07/kit.cjs'),F=require('../labs/ux07-ent04/fixtures.js'),V=require('../js/variants-compare-adapter.js'),L=require('../js/project-library.js');
const shots=process.env.E2_SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
let env;test.before(async()=>{env=await K.start({authority:true});});test.after(async()=>{await env?.stop();});
function seed({budgets='complete'}={}){const m=new Map(),st={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
  const lib=L.load(st,F.before());lib.variant(F.before(),'Reforma A');const v=lib.group(lib.activeId()).find(g=>g.id===lib.activeId());const e=F.after();e.id=v.project.id;e.name=v.project.name;lib.save(e);const group=lib.group(lib.activeId());
  const B={complete:{[group[0].project.id]:F.budget('complete',group[0].project),[group[1].project.id]:F.budget('complete',group[1].project)},
    incoherent:{[group[0].project.id]:F.budget('complete',group[0].project),[group[1].project.id]:F.budget('complete',group[0].project)},none:null}[budgets];
  if(B)m.set('rubik-budget-v1',JSON.stringify(B));return {storage:Object.fromEntries(m),group};}
async function open(storage,group,opts={}){const ctx=await env.browser.newContext({acceptDownloads:true,...opts});
  await ctx.addInitScript(s=>{if(window.top!==window||sessionStorage.getItem('s'))return;localStorage.clear();for(const [k,v] of Object.entries(s))localStorage.setItem(k,v);sessionStorage.setItem('s','1');},storage);
  const page=await ctx.newPage();await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
  const w=K.watch(page,env.base);await page.goto(env.base+'comparar/?'+V.handoff({beforeId:group[0].id,afterId:group[1].id})+'&anchor='+encodeURIComponent(group[1].id));
  await page.waitForSelector('#cmpCard:not([hidden])');await page.waitForFunction(()=>window.__ux07Compare.prepared);return {ctx,page,w};}
const dump=p=>p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))));

test('E2.3 + D02 · cambio en otra pestaña: aviso, sin preparar ni descargar; verify distingue íntegro de vigente; cero escrituras',async()=>{
  const {storage,group}=seed();const {ctx,page,w}=await open(storage,group);try{
    const s0=await dump(page);await page.locator('#buildBtn').click();await page.waitForSelector('#dosOut:not([hidden])');
    await page.locator('#verifyBtn').click();await page.waitForSelector('#verifyOut li[data-check="vigencia"]');
    assert.equal(await page.locator('#verifyOut li[data-check="vigencia"]').getAttribute('data-ok'),'true');assert.equal(await dump(page),s0,'D02: preparar y verificar no escriben');
    const other=await ctx.newPage();await other.goto(env.base);
    await other.waitForFunction(()=>window.FloorPlanApp);
    await other.evaluate(async id=>{
      const {storage,persistence}=FloorPlanApp,k='rubik-sota-project-library-v1',l=JSON.parse(storage.getItem(k));
      l.entries.find(e=>e.id===id).name+=' (cambiada)';
      storage.setItem(k,JSON.stringify(l));await persistence.requireSaved();
    },group[1].id);
    await page.waitForSelector('#staleNotice:not([hidden])');assert.ok(await page.locator('#buildBtn').isDisabled());assert.ok(await page.locator('#dlHtml').isDisabled());
    await page.locator('#verifyBtn').click();await page.waitForFunction(()=>document.querySelector('#verifyOut li[data-check="vigencia"]')?.dataset.ok==='false');
    assert.equal(await page.locator('#verifyOut li[data-check="integridad"]').getAttribute('data-ok'),'true','sigue íntegro');
    assert.equal(await page.locator('#verifyOut li.sum').getAttribute('data-ok'),'false','el resumen único no da por verificado un borrador no vigente');assert.match(await page.locator('#verifyOut li.sum').innerText(),/íntegro, pero NO vigente/);
    if(shots)await page.screenshot({path:shots+'/e2-vigencia-aviso.png',fullPage:false});
    assert.deepEqual(w.errors,[]);assert.deepEqual(w.external,[]);}finally{await ctx.close();}});

test('E2.5 · orden de cambio: motivo obligatorio; con presupuestos completos lleva delta; incoherentes no; sin plazo; sin firma',async()=>{
  for(const budgets of ['complete','incoherent']){const {storage,group}=seed({budgets});const {ctx,page,w}=await open(storage,group);try{
    const s0=await dump(page);assert.ok(await page.locator('#orderBuild').isDisabled(),'sin motivo no se prepara');
    await page.fill('#orderAuthor','Profesional de prueba');await page.fill('#orderMotivo','La propiedad pide abrir la cocina al comedor (texto de prueba).');
    await page.locator('#orderBuild').click();await page.waitForSelector('#orderOut:not([hidden])');
    const html=await page.evaluate(()=>window.__ux07Compare.order.html),man=await page.evaluate(()=>window.__ux07Compare.order.manifest);
    assert.match(html,/abrir la cocina al comedor/);assert.match(html,/Escrito por Profesional de prueba/);assert.match(html,/Sin plazo/);assert.match(html,/no lleva firma digital/);
    assert.equal(man.signature,'none');assert.equal(man.acceptance,'not-recorded');assert.equal(man.schedule,null);
    if(budgets==='complete'){assert.equal(man.economic.status,'complete');assert.ok(Number.isFinite(man.economic.delta.net));assert.match(html,/Diferencia de los dos presupuestos/);}
    else{assert.equal(man.economic.delta,null);assert.match(html,/no incluye diferencia económica/);}
    await page.locator('#orderVerify').click();await page.waitForSelector('#orderVerifyOut li[data-check="vigencia"]');
    assert.equal(await page.locator('#orderVerifyOut li[data-check="integridad"]').getAttribute('data-ok'),'true');assert.equal(await dump(page),s0,'D02');
    if(shots&&budgets==='complete'){await page.locator('#orderCard').screenshot({path:shots+'/e2-orden-de-cambio.png'});fs.writeFileSync(shots+'/e2-orden-de-cambio.borrador-interno.html',html);}
    assert.deepEqual(w.errors,[]);}finally{await ctx.close();}}});

for(const [name,vp,mobile] of [['escritorio',{width:1440,height:900},false],['tableta',{width:820,height:1180},true],['movil',{width:390,height:844},true]])
test(`E2.4 · ${name}: contexto visible y sin desplazamiento horizontal`,async()=>{const {storage,group}=seed();const {ctx,page}=await open(storage,group,{viewport:vp,isMobile:mobile,hasTouch:mobile});try{
  assert.match(await page.locator('#limitsNotice').innerText(),/planta/);const ov=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);assert.ok(ov<=1,'desborde '+ov);
  if(shots)await page.screenshot({path:`${shots}/e2-comparador-${name}.png`,fullPage:true});}finally{await ctx.close();}});

test('E2.1 · Entregar: sin variante explica cómo crearla; con variante abre el comparador existente con el mismo handoff',async()=>{
  const ctx=await env.browser.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();const w=K.watch(page,env.base);try{
    await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(env.base);await require('./editor-fixture.cjs')(page);await page.waitForFunction(()=>!!window.FloorPlanApp?.compareTargets);
    const s0=await dump(page);await page.locator('#workArea-deliver').click();const card=page.locator('.professional-card[data-compare-state]');await card.waitFor();
    const st0=await card.getAttribute('data-compare-state');assert.ok(['no-variant','no-library'].includes(st0),st0);assert.equal(await dump(page),s0,'abrir Entregar no escribe');
    if(shots)await card.screenshot({path:shots+'/e2-entregar-sin-variante.png'});
    // variante con la interfaz del editor
    await page.locator('#workArea-design').click().catch(()=>{});await page.locator('#projectsBtn').click();await page.locator('#projectsDialog').waitFor();await page.locator('#projectVariant').click();
    await page.waitForFunction(()=>{const l=JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')||'null');return !!l?.entries.find(e=>e.id===l.activeId)?.variantOf;});await page.locator('#projectClose').click();
    await page.locator('#workArea-deliver').click();await card.waitFor();await page.waitForFunction(()=>document.querySelector('.professional-card[data-compare-state]')?.dataset.compareState==='ready');
    if(shots)await card.screenshot({path:shots+'/e2-entregar-con-variante.png'});
    const [popup]=await Promise.all([ctx.waitForEvent('page'),card.locator('[data-route^="compare-"]').first().click()]);await popup.waitForURL(/\/comparar\/\?/);
    assert.match(popup.url(),/\/comparar\/\?src=library&before=.+&after=.+&anchor=/);await popup.waitForSelector('#cmpCard:not([hidden])');
    assert.deepEqual(w.errors.filter(e=>!/module script.*MIME type/.test(e)),[],'(el kit sirve .mjs sin tipo: límite del servidor de pruebas)');assert.deepEqual(w.external,[]);}finally{await ctx.close();}});

// El diálogo de la aplicación no recibe NADA que sus consultas genéricas puedan ver (botones, formularios, campos).
const pollution=(page,id)=>page.evaluate(id=>{const d=document.getElementById(id);return {buttons:[...d.querySelectorAll('button')].filter(b=>/^assistant/.test(b.id||'')||b.closest('#assistantPanel')).length,
  forms:d.querySelectorAll('#assistantPanel, #assistantForm, #assistantGenCodeForm, #assistantFab').length,access:!!d.querySelector('rubik-assistant-access'),first:d.querySelector('select,input,button')?.id||''};},id);

test('E2 · asistente presente en toda la plataforma: acceso dentro del diálogo de presupuesto y panel encima, sin contaminar el diálogo',async()=>{
  const ctx=await env.browser.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();const w=K.watch(page,env.base);try{
    await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(env.base);await require('./editor-fixture.cjs')(page);await page.waitForFunction(()=>!!window.RubikAssistantUI&&!!window.FloorPlanBudgetUI);
    assert.ok(await page.locator('#assistantOpen').isVisible()||await page.locator('#assistantFab').isVisible(),'accesible en el editor (navegación de áreas o flotante)');
    const first0=await page.evaluate(()=>{FloorPlanBudgetUI.open();const d=document.getElementById('budgetDialog');return d.querySelector('select,input,button')?.id||'';});
    await page.waitForFunction(()=>!!document.querySelector('#budgetDialog rubik-assistant-access'));
    const access=page.locator('#budgetDialog rubik-assistant-access');assert.ok(await access.isVisible(),'acceso visible dentro del diálogo de presupuesto');
    const p0=await pollution(page,'budgetDialog');assert.deepEqual([p0.buttons,p0.forms],[0,0],'ni botones ni formularios del asistente visibles para el diálogo');assert.equal(p0.first,first0,'el primer control del diálogo sigue siendo el suyo');
    await access.click();await page.waitForFunction(()=>document.getElementById('assistantHost').open&&!document.getElementById('assistantPanel').hidden);
    assert.ok(await page.evaluate(()=>document.getElementById('assistantHost').matches(':modal')&&document.getElementById('assistantHost').contains(document.getElementById('assistantPanel'))),'panel en su propio diálogo, encima');
    const p1=await pollution(page,'budgetDialog');assert.deepEqual([p1.buttons,p1.forms],[0,0],'con el panel abierto tampoco');
    assert.match(await page.locator('#assistantWhere').innerText(),/Estás en:/);
    await page.fill('#assistantInput','¿Cuál es la superficie útil?');assert.equal(await page.inputValue('#assistantInput'),'¿Cuál es la superficie útil?','el panel es usable');
    if(shots)await page.screenshot({path:shots+'/e2-asistente-en-presupuesto.png'});
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.getElementById('assistantHost').open);
    assert.ok(await page.evaluate(()=>document.getElementById('budgetDialog').open),'Escape cierra el panel, no el presupuesto');assert.ok(await access.isVisible(),'vuelve el acceso del diálogo');
    assert.deepEqual(w.errors.filter(e=>!/module script.*MIME type/.test(e)),[]);}finally{await ctx.close();}});

test('E2 · asistente en móvil 390×844: dentro de un diálogo con cabecera en fila (territorio) no desborda la cabecera ni tapa «Cerrar»',async()=>{
  const ctx=await env.browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await ctx.newPage();const w=K.watch(page,env.base);try{
    await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(env.base);await require('./editor-fixture.cjs')(page);await page.waitForFunction(()=>!!window.RubikAssistantUI&&!!window.FloorPlanTerritoryUI);
    await page.locator('#territoryOpen').evaluate(n=>n.closest('details').open=true);await page.locator('#territoryOpen').click();await page.locator('#territoryDialog[open]').waitFor();
    const access=page.locator('#territoryDialog rubik-assistant-access');await access.waitFor();assert.ok(await access.isVisible(),'acceso visible en el diálogo de territorio');
    assert.deepEqual(await access.evaluate(b=>[b.parentElement.id,b.parentElement.lastElementChild===b]),['territoryDialog',true],'último elemento del diálogo, fuera de la cabecera');
    assert.equal(await page.locator('#territoryDialog').evaluate(n=>n.scrollWidth<=n.clientWidth+1),true,'sin desbordamiento horizontal');
    assert.equal(await access.evaluate(b=>{const r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.right<=innerWidth;}),true,'acceso dentro de la pantalla sin desplazar');
    assert.ok(await page.locator('#territoryClose').isVisible());await page.locator('#territoryClose').click({trial:true});
    await access.click();await page.waitForFunction(()=>document.getElementById('assistantHost').open);
    assert.equal(await page.evaluate(()=>{const r=document.getElementById('assistantPanel').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1;}),true,'el panel cabe en 390');
    assert.deepEqual(w.errors.filter(e=>!/module script.*MIME type/.test(e)),[]);}finally{await ctx.close();}});

// Superficie NO modal (como la tarjeta de presentación): el flotante fijo taparía sus controles de abajo a la derecha
// (FT3D-6 y building-presentation en 30abf6f). El acceso va en flujo al final de la superficie y el flotante se oculta.
for(const [name,vp,mobile] of [['390×844',{width:390,height:844},true],['844×390',{width:844,height:390},true],['1440×900',{width:1440,height:900},false]])
test(`E2 · asistente ${name}: en una superficie no modal no tapa sus controles; al cerrarla vuelve el acceso normal`,async()=>{
  const ctx=await env.browser.newContext({viewport:vp,isMobile:mobile,hasTouch:mobile});const page=await ctx.newPage();const w=K.watch(page,env.base);try{
    await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(env.base);await require('./editor-fixture.cjs')(page);await page.waitForFunction(()=>!!window.RubikAssistantUI);
    await page.evaluate(()=>{const s=document.createElement('section');s.id='surfaceX';s.dataset.assistantHost='';s.style.cssText='position:fixed;inset:0;z-index:60;overflow:auto;background:#fff;padding:8px';
      const r=document.createElement('div');r.style.cssText='display:flex;justify-content:flex-end;min-height:calc(100vh - 16px);align-items:flex-end';const b=document.createElement('button');b.id='stopX';b.type='button';b.textContent='Parada';
      b.onclick=()=>{b.dataset.clicked='1';};r.append(b);s.append(r);s.hidden=true;document.body.append(s);});
    await page.evaluate(()=>{document.getElementById('surfaceX').hidden=false;}); // como la presentación: existe oculta y se muestra
    const access=page.locator('#surfaceX rubik-assistant-access');await access.waitFor({state:'attached'});
    assert.equal(await page.locator('#assistantFab').isVisible(),false,'sin flotante sobre la superficie');
    assert.equal(await access.evaluate(a=>a.parentElement.lastElementChild===a&&getComputedStyle(a).position),'static','acceso en flujo, último de la superficie');
    assert.equal(await page.locator('#stopX').evaluate(b=>{const r=b.getBoundingClientRect();return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)===b;}),true,'nada intercepta el control');
    await page.locator('#stopX').click();assert.equal(await page.locator('#stopX').getAttribute('data-clicked'),'1');
    await access.scrollIntoViewIfNeeded();await access.click();await page.waitForFunction(()=>document.getElementById('assistantHost').open);await page.keyboard.press('Escape');
    await page.evaluate(()=>{document.getElementById('surfaceX').hidden=true;});
    await page.waitForFunction(()=>!document.querySelector('#surfaceX rubik-assistant-access')||!document.getElementById('surfaceX').getClientRects().length);
    assert.ok(await page.locator('#assistantOpen').isVisible()||await page.locator('#assistantFab').isVisible(),'acceso normal de vuelta');
    assert.deepEqual(w.errors.filter(e=>!/module script.*MIME type/.test(e)),[]);}finally{await ctx.close();}});

// A26/H03 · carrera: los datos cambian MIENTRAS se genera (otra pestaña escribe entre dos pasos asíncronos de la exportación).
// La primera huella verifica el estado de apertura. En la segunda, otra pestaña confirma una revisión en IndexedDB.
async function armRace(ctx,page){
 const other=await ctx.newPage();
 await other.goto(env.base);
 await other.waitForFunction(()=>window.FloorPlanApp);
 await page.exposeFunction('commitOtherRevision',()=>other.evaluate(async()=>{
  const {storage,persistence}=FloorPlanApp,k='rubik-budget-v1',map=JSON.parse(storage.getItem(k));
  map[Object.keys(map)[1]].title+=' (otra pestaña)';
  storage.setItem(k,JSON.stringify(map));await persistence.requireSaved();
 }));
 await page.evaluate(()=>{const orig=crypto.subtle.digest.bind(crypto.subtle);let calls=0;
  crypto.subtle.digest=async(...a)=>{if(++calls===2)await commitOtherRevision();return orig(...a);};});
}
test('A26/H03 · cambio de datos DURANTE la generación asíncrona: el borrador se descarta, no se puede descargar ni dar por vigente',async()=>{
  const {storage,group}=seed();const {ctx,page,w}=await open(storage,group);try{
    await armRace(ctx,page);await page.locator('#buildBtn').click();
    await page.waitForFunction(()=>/durante la preparación/.test(document.getElementById('dosError').textContent));
    assert.equal(await page.locator('#dosOut').isHidden(),true,'no se muestra un borrador hecho con datos que ya no son los guardados');
    assert.equal(await page.evaluate(()=>window.__ux07Compare.dossier??null),null,'no queda borrador retenido');
    await page.waitForSelector('#staleNotice:not([hidden])');assert.ok(await page.locator('#buildBtn').isDisabled(),'hay que recargar para comparar lo actual');
    assert.deepEqual(w.errors,[]);}finally{await ctx.close();}});
test('A26/H03 · orden de cambio: cambio de datos DURANTE su generación la descarta',async()=>{
  const {storage,group}=seed();const {ctx,page,w}=await open(storage,group);try{
    await page.fill('#orderAuthor','Arquitecta responsable');await page.fill('#orderMotivo','Petición del cliente: ampliar la cocina');
    await armRace(ctx,page);await page.locator('#orderBuild').click();
    await page.waitForFunction(()=>/durante la preparación/.test(document.getElementById('orderStatus').textContent));
    assert.equal(await page.locator('#orderPreview').evaluate(n=>!n.srcdoc),true,'sin vista previa de una orden desfasada');
    assert.ok(await page.locator('#orderDlHtml').isDisabled());assert.ok(await page.locator('#orderDlManifest').isDisabled());
    assert.deepEqual(w.errors,[]);}finally{await ctx.close();}});
test('Marca · los borradores del comparador no llevan la marca: cambiarla no los desfasa ni altera su contenido',async()=>{
  const {storage,group}=seed();storage['rubik-sota-brand-profiles-v1']=JSON.stringify({version:1,activeId:'b1',profiles:[{id:'b1',name:'ESTUDIO-MARCA-ZETA',person:'Persona Zeta'}]});
  const {ctx,page,w}=await open(storage,group);try{
    await page.locator('#buildBtn').click();await page.waitForSelector('#dosOut:not([hidden])');
    const html1=await page.evaluate(()=>window.__ux07Compare.dossier.html);assert.doesNotMatch(html1,/ESTUDIO-MARCA-ZETA|Persona Zeta/,'el borrador interno no incluye la marca');
    await page.evaluate(()=>localStorage.setItem('rubik-sota-brand-profiles-v1',JSON.stringify({version:1,activeId:'b2',profiles:[{id:'b2',name:'OTRA-MARCA'}]})));
    await page.locator('#verifyBtn').click();await page.waitForSelector('#verifyOut li[data-check="vigencia"]');
    assert.equal(await page.locator('#verifyOut li.sum').getAttribute('data-ok'),'true','cambiar la marca no desfasa un borrador que no la usa');
    assert.equal(await page.locator('#staleNotice').isHidden(),true);
    assert.deepEqual(w.errors,[]);}finally{await ctx.close();}});
