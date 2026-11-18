'use strict';
/* E2 · comparativas profesionales en el navegador, datos SINTÉTICOS (fixtures UX-07/ENT-04, precios ficticios):
   E2.1 acceso desde Entregar · E2.3 vigencia (cambio en otra pestaña, verify «íntegro» ≠ «vigente») · D02 cero escrituras ·
   E2.5 orden de cambio (motivo obligatorio, delta solo coherente, sin plazo sin plan, sin firma) · 1440/820/390 sin desborde.
   Evidencia visual opcional: E2_SHOTS=<dir>. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const K=require('./ux07/kit.cjs'),F=require('../labs/ux07-ent04/fixtures.js'),V=require('../js/variants-compare-adapter.js'),L=require('../js/project-library.js');
const shots=process.env.E2_SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
function seed({budgets='complete'}={}){const m=new Map(),st={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
  const lib=L.load(st,F.before());lib.variant(F.before(),'Reforma A');const v=lib.group(lib.activeId()).find(g=>g.id===lib.activeId());const e=F.after();e.id=v.project.id;e.name=v.project.name;lib.save(e);const group=lib.group(lib.activeId());
  const B={complete:{[group[0].project.id]:F.budget('complete',group[0].project),[group[1].project.id]:F.budget('complete',group[1].project)},
    incoherent:{[group[0].project.id]:F.budget('complete',group[0].project),[group[1].project.id]:F.budget('complete',group[0].project)},none:null}[budgets];
  if(B)m.set('rubik-budget-v1',JSON.stringify(B));return {storage:Object.fromEntries(m),group};}
async function open(storage,group,opts={}){const ctx=await env.browser.newContext({acceptDownloads:true,...opts});
  await ctx.addInitScript(s=>{if(window.top!==window||sessionStorage.getItem('s'))return;localStorage.clear();for(const [k,v] of Object.entries(s))localStorage.setItem(k,v);sessionStorage.setItem('s','1');},storage);
  const page=await ctx.newPage();const w=K.watch(page,env.base);await page.goto(env.base+'comparar/?'+V.handoff({beforeId:group[0].id,afterId:group[1].id})+'&anchor='+encodeURIComponent(group[1].id));
  await page.waitForSelector('#cmpCard:not([hidden])');await page.waitForFunction(()=>window.__ux07Compare.prepared);return {ctx,page,w};}
const dump=p=>p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))));

test('E2.3 + D02 · cambio en otra pestaña: aviso, sin preparar ni descargar; verify distingue íntegro de vigente; cero escrituras',async()=>{
  const {storage,group}=seed();const {ctx,page,w}=await open(storage,group);try{
    const s0=await dump(page);await page.locator('#buildBtn').click();await page.waitForSelector('#dosOut:not([hidden])');
    await page.locator('#verifyBtn').click();await page.waitForSelector('#verifyOut li[data-check="vigencia"]');
    assert.equal(await page.locator('#verifyOut li[data-check="vigencia"]').getAttribute('data-ok'),'true');assert.equal(await dump(page),s0,'D02: preparar y verificar no escriben');
    const other=await ctx.newPage();await other.goto(env.base+'comparar/?src=library&before=x&after=y');
    await other.evaluate(({id})=>{const k='rubik-sota-project-library-v1',l=JSON.parse(localStorage.getItem(k));const en=l.entries.find(e=>e.id===id);en.name+=' (cambiada)';localStorage.setItem(k,JSON.stringify(l));},{id:group[1].id});
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
    const [popup]=await Promise.all([ctx.waitForEvent('page'),card.locator('[data-route^="compare-"]').first().click()]);await popup.waitForLoadState();
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
    assert.equal(await access.evaluate(b=>b.parentElement.id),'territoryDialog','fuera de la fila de cabecera');
    assert.equal(await page.locator('#territoryDialog').evaluate(n=>n.scrollWidth<=n.clientWidth+1),true,'sin desbordamiento horizontal');
    assert.ok(await page.locator('#territoryClose').isVisible());await page.locator('#territoryClose').click({trial:true});
    await access.click();await page.waitForFunction(()=>document.getElementById('assistantHost').open);
    assert.equal(await page.evaluate(()=>{const r=document.getElementById('assistantPanel').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1;}),true,'el panel cabe en 390');
    assert.deepEqual(w.errors.filter(e=>!/module script.*MIME type/.test(e)),[]);}finally{await ctx.close();}});
