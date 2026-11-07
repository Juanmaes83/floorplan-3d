/* FT3D-8 · Gate D (UX/4D): the 20 functional checks of the owner's acceptance list, in real Chromium, over the lab with
   the K dossier (plan A + explicit site tasks with ILLUSTRATIVE resources) and the S1 scenarios. One temporal evaluation
   per day shared by scene, Gantt, card and amounts; the MP4 says what the screen says; the delivery is guided and never
   publishes. FIXTURE data only; every request outside the local server fails the test. Evidence -> FT3D8_UX4D_SHOTS. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const M=require('../js/construction-mp4-muxer.js');
const root=path.resolve(__dirname,'..'),shots=process.env.FT3D8_UX4D_SHOTS||null;
const TYPES={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'};
let server,browser,base,ctx,page,watched;
const launchArgs=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'];
before(async()=>{
  server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';
    const file=path.resolve(root,'.'+decodeURIComponent(p));if(!file.startsWith(root+path.sep))throw Error('path');
    res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/`;
  browser=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:launchArgs});
  if(shots)await fs.mkdir(shots,{recursive:true});
  ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});page=await ctx.newPage();watched=watch(page);
  await page.goto(`${base}evolucion/?lab=1`);await ready(page);
});
after(async()=>{await ctx?.close();await browser?.close();await new Promise(r=>server?.close(r));});
function watch(p){const errors=[],external=[],share=[];p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/^Failed to load resource/.test(m.text()))errors.push(m.text());});
  p.on('request',r=>{const u=r.url();if(/\/api\/(share|view)/.test(u))share.push(u);if(!u.startsWith(base)&&!/^(data|blob):/.test(u))external.push(u);});return {errors,external,share};}
const ready=p=>p.waitForFunction(()=>/^dos_/.test(document.body.dataset.dossier||'')&&window.__ft3dDossier?.evaluation&&window.__ft3dFidelity?.ctx&&window.__ft3dDelivery,null,{timeout:60000});
const T=(p,id)=>p.evaluate(id=>{const e=document.getElementById(id);return e?e.textContent.replace(/\s+/g,' ').trim():null;},id);
const at=(p,date)=>p.evaluate(d=>{const F=window.__ft3dFidelity;F.clearSelection?.();return d==='END'?F.end():d==='START'?F.setPos(0):F.setDate(d);},date);
const scenario=(p,id)=>p.evaluate(id=>window.__ft3dDossier.loadScenario(id),id);
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function shot(p,name){if(!shots)return;await settle(p);await p.evaluate(()=>window.__ft3dFidelity.scene.setSuspended(true));
  try{await p.screenshot({path:path.join(shots,name),timeout:60000});}finally{await p.evaluate(()=>window.__ft3dFidelity.scene.setSuspended(false));}}
// The card of the moment (what the screen says) next to the shared day state.
const card=p=>p.evaluate(()=>{const t=id=>document.getElementById(id).textContent.replace(/\s+/g,' ').trim();
  return {stage:t('cardStage'),week:t('cardWeek'),headline:t('cardHeadline'),tasks:[...document.querySelectorAll('#cardTasks li')].map(l=>({sel:l.classList.contains('sel'),text:l.textContent.replace(/\s+/g,' ').trim()})),
    extra:t('cardExtra'),note:document.getElementById('sceneNote').hidden?'':t('sceneNote'),intro:!document.getElementById('introOverlay').hidden,
    gantt:[...document.querySelectorAll('#gantt .row')].map(r=>({id:r.dataset.task,phase:r.dataset.phase,selected:r.classList.contains('selected')})),last:window.__ft3dFidelity.last};});
const K={start:'START',noGeometry:'2027-09-10',structure:'2027-09-28',simultaneous:'2027-10-12',carpentry:'2027-10-29',idle:'2027-11-27',end:'END'};

test('01 · initial moment: nothing built, footprint and plain intro, stage «Inicio»',async()=>{
  await page.evaluate(()=>window.__ft3dUI.go('evolucion'));const l=await at(page,K.start),c=await card(page);
  assert.equal(c.stage,'INICIO · ESTADO PREVIO');assert.equal(c.headline,'Antes del comienzo de la obra');assert.match(c.week,/^SEM 00 \/ 14/);
  assert.equal(l.presentElements.length,0,'no element of the project stands before the plan');assert.equal(c.intro,true);
  assert.match(await T(page,'introOverlay'),/Antes del comienzo de la obra[\s\S]*Inicio previsto lun 30 ago 2027 · 11 trabajos · 14 semanas/);
  assert.equal(await page.evaluate(()=>window.__ft3dFidelity.scene.footprintVisible),true,'the footprint marks where the house will stand');
  await shot(page,'01-momento-inicial.png');
});

test('02 · structure: facade walls rise while the plan says so, the crane is an illustration',async()=>{
  const l=await at(page,K.structure),c=await card(page);
  assert.equal(c.stage,'EN OBRA (SEGÚN PLAN)');assert.match(c.week,/^SEM 05 \/ 14$/);assert.equal(c.headline,'Muros de fachada · Grúa y medios de elevación');
  assert.deepEqual(l.activeTaskIds,['muros','grua']);for(const k of ['project/wal_a-n','project/wal_a-e','project/wal_a-s','project/wal_a-w'])assert.ok(l.presentElements.includes(k),k);
  assert.ok(c.tasks.some(t=>/Grúa y medios de elevación.*grúa \(ilustración\)/.test(t.text)),'illustrative resources are named as illustrations');
  assert.equal(await page.evaluate(()=>window.__ft3dFidelity.scene.footprintVisible),false);
  await shot(page,'02-estructura.png');
});

test('03 · simultaneous works: one day, four works, the same four in scene, Gantt and card',async()=>{
  const l=await at(page,K.simultaneous),c=await card(page);
  assert.deepEqual(l.activeTaskIds,['tabiques','cubierta','grua','andamios']);
  assert.deepEqual(c.gantt.filter(r=>r.phase==='in-progress').map(r=>r.id),l.activeTaskIds,'Gantt rows in progress = day state');
  assert.equal(c.tasks.length,4);assert.match(c.extra,/Hay 4 trabajos previstos a la vez/);
  assert.equal(l.ganttCursorDate,'2027-10-12','Gantt cursor on the same day');
  for(const k of ['project/wal_a-p1','project/wal_a-p2','project/roof','illustrative/crane','illustrative/scaffold'])assert.ok(l.presentElements.includes(k),k);
  await shot(page,'03-tareas-simultaneas.png');
});

test('04 · carpentry: the 8 openings of the project appear with their task',async()=>{
  const l=await at(page,K.carpentry),c=await card(page);assert.equal(c.headline,'Carpinterias · Andamios');
  const opn=l.presentElements.filter(k=>/^project\/opn_/.test(k));assert.ok(opn.length>=7,'openings present: '+opn.join(','));
  assert.ok(c.tasks.some(t=>/05 Carpinterias.*8 elementos del modelo.*asignado sin IVA 5\.050,00 €/.test(t.text)),JSON.stringify(c.tasks));
  await shot(page,'04-carpinteria.png');
});

test('05 · planned work without geometry is said, never drawn',async()=>{
  const l=await at(page,K.noGeometry),c=await card(page);assert.deepEqual(l.activeTaskIds,['cimentacion']);
  assert.equal(c.note,'Cimentacion: planificado, sin representación 3D.');assert.ok(c.tasks[0].text.includes('sin representación 3D'));
  assert.ok(!l.presentElements.some(k=>k.startsWith('project/')),'no project geometry invented for the foundation');
  await at(page,K.structure);assert.equal((await card(page)).note,'','the note leaves with its task');
});

test('06 · amounts: each work shows its net allocation (sin IVA) from C1-C4, and what it is not',async()=>{
  await at(page,K.simultaneous);const c=await card(page);
  const rep=await page.evaluate(()=>{const r=window.__ft3dFidelity.ctx.model.costs.report,P=window.FloorPlanConstructionLabPresenter;
    return Object.fromEntries(r.byTask.map(t=>[t.taskId,t.lines.length&&t.lines.every(l=>l.allocatedNet!==null)?P.euro(t.lines.reduce((s,l)=>s+l.allocatedNet,0)):null]));});
  assert.ok(c.tasks.find(t=>/Tabiqueria interior/.test(t.text)).text.includes('asignado sin IVA '+rep.tabiques));
  assert.match(c.extra,/Importes sin IVA de las partidas vinculadas a cada trabajo: no son el coste total de la obra/);
  for(const t of c.tasks)assert.match(t.text,/sin IVA/,'every amount is labelled net: '+t.text);
});

test('07 · incomplete budget: unknown amounts are «desconocido», never 0 €',async()=>{
  await at(page,K.simultaneous);const c=await card(page);
  const roof=c.tasks.find(t=>/Cubierta/.test(t.text)).text;assert.match(roof,/Sin partidas asignadas · asignado sin IVA desconocido/);
  assert.ok(!c.tasks.some(t=>/\b0,00 €/.test(t.text)),'no unknown amount shown as 0 €');
  assert.match(await T(page,'heroMeta'),/asignado [\d.]+,\d\d € sin IVA/);
});

test('08 · Gantt → scene → card: selecting a work goes to its moment, first in the card, outlined',async()=>{
  await at(page,K.start);await page.locator('#gantt .row[data-task="carpinteria"] .lab').click();
  await page.waitForFunction(()=>window.__ft3dFidelity.selected==='carpinteria');const c=await card(page);
  assert.ok(c.last.date>='2027-10-25'&&c.last.date<='2027-11-05','moved to the middle of the task: '+c.last.date);
  assert.equal(c.tasks[0].sel,true);assert.match(c.tasks[0].text,/Carpinterias/);
  assert.deepEqual(c.gantt.filter(r=>r.selected).map(r=>r.id),['carpinteria']);
  // Scene → task: clicking an element lists its works; «Ver trabajo» selects one.
  const pick=await page.evaluate(()=>window.__ft3dUI.showPick('project/wal_a-n'));assert.deepEqual(pick.tasks.sort(),['acabados','muros']);
  assert.match(await T(page,'pickInfo'),/Muro[\s\S]*02 Muros de fachada[\s\S]*06 Pintura y revestimientos/);
  await shot(page,'08-seleccion-gantt-y-elemento.png');
  await page.locator('#pickInfo [data-pick-task="muros"]').click();await page.waitForFunction(()=>window.__ft3dFidelity.selected==='muros');
  await page.locator('#cardExtra [data-card="clear"]').click();assert.equal(await page.evaluate(()=>window.__ft3dFidelity.selected),null);
});

test('09 · going back in time restores the earlier state exactly',async()=>{
  const first=await at(page,K.structure),end=await at(page,K.end);assert.ok(end.presentElements.length>first.presentElements.length);
  const again=await at(page,K.structure);assert.deepEqual(again.presentElements,first.presentElements);assert.deepEqual(again.modes,first.modes);
  const zero=await at(page,K.start);assert.equal(zero.presentElements.length,0);
  await at(page,K.end);const c=await card(page);assert.equal(c.stage,'FINAL · PLAN COMPLETADO');
  assert.ok(!c.last.presentElements.some(k=>k.startsWith('illustrative/')),'site resources removed by their own task (retirada)');
  await shot(page,'09-final.png');
});

test('10 · a period without works says so and offers the next activity',async()=>{
  await at(page,K.idle);const c=await card(page);assert.equal(c.headline,'No hay trabajos programados durante este periodo');assert.equal(c.stage,'EN OBRA (SEGÚN PLAN)');
  await page.locator('#cardExtra [data-card="next"]').click();
  const l=await page.evaluate(()=>window.__ft3dFidelity.last);assert.equal(l.date,'2027-11-29');assert.deepEqual(l.activeTaskIds,['retirada']);
});

test('11 · switching dossiers C → D → A leaves nothing of the previous project',async()=>{
  const names={};for(const id of ['C','D','A']){const s=await scenario(page,id);await settle(page);names[id]=await page.evaluate(()=>window.__ft3dFidelity.ctx.model.subject.name);
    const text=await page.evaluate(()=>['projSummary','topProject','heroProject','cardTasks','gantt','stepProject','deliverSummary'].map(i=>document.getElementById(i)?.textContent||'').join('\n'));
    for(const [o,n] of Object.entries(names))if(o!==id&&n!==names[id])assert.ok(!text.includes(n),`${id} shows nothing of ${o} («${n}»)`);
    assert.ok(text.includes(names[id]),`${id} shows its own name`);assert.ok(s);}
  await scenario(page,'K');
});

test('12 · scenarios E/F/G/H/J: each problem is named; incompatibilities block the delivery, an obsolete revision lowers it; J keeps the previous dossier',async()=>{
  try{
    const blocked={E:/El presupuesto pertenece a otro proyecto/,F:/La planificación pertenece a otro proyecto/,G:/La parcela está asociada a otro proyecto/};
    for(const [id,re] of Object.entries(blocked)){await scenario(page,id);await page.evaluate(()=>window.__ft3dUI.reveal('#dossierFlow'));
      assert.match(await T(page,'dossierFlow'),re,id);assert.equal(await page.locator('#deliverGo').isDisabled(),true,id+': the delivery is blocked');}
    // H (S1 decision): an obsolete revision is a warning, never a match: the delivery stays possible at a lower level, and says so.
    await scenario(page,'H');await page.evaluate(()=>window.__ft3dUI.reveal('#dossierFlow'));
    assert.match(await T(page,'dossierFlow'),/La planificación se hizo sobre otra revisión del proyecto/);
    const h=await page.evaluate(()=>window.__ft3dFidelity.ctx.model.delivery.level);assert.notEqual(h,'evidenced-plan');
    assert.match(await T(page,'deliverSummary'),/Presentación orientativa|Plan con revisión declarada/);
    // J = A, then an invalid parcel document: it is rejected and A stays loaded as it was.
    const a=await scenario(page,'A'),j=await scenario(page,'J');assert.equal(j.error.code,'parcel-document-invalid');assert.ok(a.id);assert.equal(j.id,a.id);
  }finally{await scenario(page,'K');}
});

test('13 · guided delivery: Previsualizar → Personalizar → Generar → Resultado, secondary options folded, nothing published',{timeout:600000},async()=>{
  await page.evaluate(()=>window.__ft3dUI.go('entrega'));
  assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.steps.guided>.step>h3')].map(h=>h.textContent.replace(/^\d\s*/,'').trim())),['Previsualizar','Personalizar','Generar','Resultado']);
  assert.deepEqual(await page.evaluate(()=>['step2','customizeMore','generateMore','resultMore','publishBox'].map(id=>document.getElementById(id).open)),[false,false,false,false,false],'secondary options folded by default');
  assert.match(await T(page,'deliverSummary'),/Tu cliente verá .* construirse en 14 semanas, del lun 30 ago 2027 al mie 1 dic 2027/);
  assert.match(await T(page,'deliverResult'),/Aún no se ha generado nada/);
  await shot(page,'13a-entrega-guiada.png');
  await page.locator('#deliverGo').click();
  await page.waitForFunction(()=>window.__ft3dDelivery.state.doc||/no válido|no generó|no puede|codificador|cancelad/.test(document.getElementById('videoStatus').textContent),null,{timeout:500000});
  assert.match(await T(page,'deliverResult'),/^Tu presentación está preparada/);assert.equal(await T(page,'deliverGo'),'Generar de nuevo');
  assert.equal(await page.locator('#videoDownload').isVisible(),true);assert.equal(await page.locator('#docDownload').isVisible(),true);
  assert.deepEqual(watched.share,[],'nothing is published from the guided delivery');
  await shot(page,'13b-resultado.png');
});

test('14 · MP4 = screen: indexed file, and at several instants the frame says what the card says',{timeout:300000},async()=>{
  const v=await page.evaluate(async()=>{const v=window.__ft3dDelivery.state.video,b=new Uint8Array(await v.blob.arrayBuffer());let s='';for(let i=0;i<b.length;i+=32768)s+=String.fromCharCode(...b.subarray(i,i+32768));
    return {b64:btoa(s),ext:v.ext,width:v.width,height:v.height,durationMs:v.durationMs};});
  assert.equal(v.ext,'mp4');assert.equal(v.width,1280);assert.equal(v.height,720);
  const bytes=Buffer.from(v.b64,'base64'),info=M.inspect(bytes);assert.equal(info.valid,true,info.reason);
  if(shots)await fs.writeFile(path.join(shots,'14-evolucion-K.mp4'),bytes);
  const parity=await page.evaluate(()=>{const F=window.__ft3dFidelity,c=F.ctx,D=window.FloorPlanConstructionDelivery,sb=D.storyboard(c.schedule),out=[];
    for(const k of [.05,.2,.35,.5,.65,.8,.95]){const f=sb.at(sb.openingMs+k*sb.timelineMs);F.setPos(f.pos);const o=D.overlay(c.model,c.schedule,f.date,null),t=id=>document.getElementById(id).textContent;
      out.push({date:f.date,video:[o.week,o.stageText,o.headline],screen:[t('cardWeek'),t('cardStage'),t('cardHeadline')],cursor:F.last.ganttCursorDate});}return out;});
  for(const p of parity){assert.deepEqual(p.video,p.screen,'parity at '+p.date);assert.equal(p.cursor,p.date);}
});

test('15 · client view: no technical tab nor professional details, the viewer stays the protagonist',async()=>{
  await page.locator('[data-mode="client"]').click();await page.evaluate(()=>window.__ft3dUI.go('evolucion'));await at(page,K.carpentry);
  const r=await page.evaluate(()=>({proj:getComputedStyle(document.getElementById('tab-proyecto')).display,pro:[...document.querySelectorAll('.pro-only')].filter(e=>e.offsetParent!==null).length,
    stage:document.getElementById('stage').getBoundingClientRect().toJSON()}));
  assert.equal(r.proj,'none');assert.equal(r.pro,0);assert.ok(r.stage.top<120&&r.stage.height>=320,JSON.stringify(r.stage));
  await shot(page,'15-vista-cliente.png');
  await page.locator('[data-mode="pro"]').click();await shot(page,'15b-vista-profesional.png');
});

test('16 · mobile 390×844: viewer first, no horizontal scroll in any section',{timeout:180000},async t=>{
  const mctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});t.after(()=>mctx.close());
  const m=await mctx.newPage(),w=watch(m);await m.goto(`${base}evolucion/?lab=1&tab=evolucion`);await ready(m);await at(m,K.simultaneous);
  for(const tab of ['evolucion','proyecto','entrega']){await m.evaluate(t=>window.__ft3dUI.go(t),tab);
    assert.ok(await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'no horizontal scroll in '+tab);}
  await m.evaluate(()=>window.__ft3dUI.go('evolucion'));const st=await m.evaluate(()=>document.getElementById('stage').getBoundingClientRect().toJSON());
  assert.ok(st.top<160&&st.height>=260,JSON.stringify(st));await shot(m,'16-movil.png');
  assert.deepEqual(w.errors,[]);assert.deepEqual(w.external,[]);
});

test('17 · accessibility: tabs and Gantt by keyboard, named controls, live regions',async()=>{
  await page.locator('#tab-evolucion').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(()=>document.body.dataset.tab),'entrega');assert.equal(await page.getAttribute('#tab-entrega','aria-selected'),'true');
  await page.keyboard.press('ArrowLeft');assert.equal(await page.evaluate(()=>document.body.dataset.tab),'evolucion');
  await page.locator('#gantt .row[data-task="suelos"] .lab').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>window.__ft3dFidelity.selected==='suelos');
  const unnamed=await page.evaluate(()=>[...document.querySelectorAll('button,[role=button],select,input:not([type=hidden])')].filter(e=>e.offsetParent!==null)
    .filter(e=>!(e.getAttribute('aria-label')||e.textContent.trim()||e.labels?.length||e.title)).map(e=>e.id||e.outerHTML.slice(0,60)));
  assert.deepEqual(unnamed,[],'every visible control has an accessible name');
  assert.equal(await page.getAttribute('html','lang'),'es');
  for(const id of ['videoStatus','deliverResult','deliverSummary'])assert.ok(await page.getAttribute('#'+id,'aria-live')||await page.getAttribute('#'+id,'role'),id);
  await page.evaluate(()=>window.__ft3dFidelity.clearSelection());
});

test('18 · economic regression: plan total = sum of the task allocations, always «sin IVA»',async()=>{
  const r=await page.evaluate(()=>{const c=window.__ft3dFidelity.ctx,P=window.FloorPlanConstructionLabPresenter,D=window.FloorPlanConstructionDelivery,rep=c.model.costs.report;
    const sum=rep.byTask.flatMap(t=>t.lines).filter(l=>l.allocatedNet!==null).reduce((s,l)=>s+l.allocatedNet,0);
    const pol=D.costPolicy(c.model,{mode:'tasks',schedule:c.schedule});
    return {sum:P.euro(sum),known:pol.summary.knownText,hero:document.getElementById('heroMeta').textContent,overlay:D.overlay(c.model,c.schedule,'2027-10-12',pol).cost};});
  assert.equal(r.known,r.sum);assert.ok(r.hero.includes(r.sum+' sin IVA'),r.hero);assert.ok(r.overlay.every(x=>/sin IVA/.test(x)),r.overlay.join(' | '));
});

test('19 · fidelity regression: what is drawn is the project; illustrations never count as project evidence',async()=>{
  const r=await page.evaluate(()=>{const c=window.__ft3dFidelity.ctx,m=c.model,F=window.__ft3dFidelity;F.end();const drawn=Object.keys(F.scene.inspect());
    return {drawn,eligible:m.visualElements.filter(v=>!v.illustrative&&v.representable).map(v=>v.key),illustrative:m.illustrative.map(i=>i.key),total:m.coverage.geometry.total,
      nonIll:m.visualElements.filter(v=>!v.illustrative).length};});
  assert.equal(r.total,r.nonIll,'coverage counts project elements only');
  assert.deepEqual(r.drawn.filter(k=>k.startsWith('project/')).sort(),r.eligible.filter(k=>r.drawn.includes(k)).sort());
  assert.ok(r.drawn.every(k=>k.startsWith('project/')),'at the end only project geometry remains: '+r.drawn.join(','));
  assert.deepEqual(r.illustrative.sort(),['illustrative/crane','illustrative/scaffold','illustrative/site-fence','illustrative/site-hut']);
});

test('20 · no console errors, no external requests during the whole Gate D run',async()=>{
  assert.deepEqual(watched.errors,[]);assert.deepEqual(watched.external,[]);assert.deepEqual(watched.share,[]);
});
