/* FT3D-8 S1-D: construction dossier lab in real Chromium. The REAL Catastro provider reads the fixture GML; documents are
   loaded through the real file input as RUBIK exports them; switching projects leaves nothing of the previous one; a real
   video is recorded, downloaded and played back with its manifest bound to the dossier. FIXTURE data only (no client
   data, no network: every request outside the local server fails the test). Evidence -> FT3D8_DOSSIER_SHOTS. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{createServer}=require('node:http'),{chromium}=require('playwright');
const X=require('../labs/ft3d-8/dossier-fixtures.js'),Budget=require('../js/budget-core.js'),Schedule=require('../js/construction-schedule-core.js'),M=require('../js/construction-mp4-muxer.js');
const root=path.resolve(__dirname,'..'),shots=process.env.FT3D8_DOSSIER_SHOTS||null;
const TYPES={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'};
let server,browser,base,tmp;
before(async()=>{
  server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';
    const file=path.resolve(root,'.'+decodeURIComponent(p));if(!file.startsWith(root+path.sep))throw Error('path');
    res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/`;
  browser=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
  tmp=await fs.mkdtemp(path.join(require('node:os').tmpdir(),'ft3d8-dos-'));if(shots)await fs.mkdir(shots,{recursive:true});
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
function watch(page){const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/^Failed to load resource/.test(m.text()))errors.push(m.text());});
  page.on('request',r=>{const u=r.url();if(!u.startsWith(base)&&!/^(data|blob):/.test(u))external.push(u);});return {errors,external};}
// The 3D loop is paused while an element is captured (SwiftShader keeps the page busy otherwise).
// Gate D layout: open the section and blocks that contain an element before reading or capturing it, as a user would.
const reveal=(page,sel)=>page.evaluate(s=>window.__ft3dUI.reveal(s),sel);
const read=async(page,sel)=>{await reveal(page,sel);return page.locator(sel).innerText();};
// A full-page capture clipped to the element: no «element is stable» wait, which a busy CI runner can starve.
async function shot(page,selector,name){if(!shots)return;await reveal(page,selector);await page.evaluate(()=>window.__ft3dFidelity.scene.setSuspended(true));
  try{const box=await page.evaluate(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height};},selector);
    await page.screenshot({path:path.join(shots,name),fullPage:true,clip:{x:Math.max(0,box.x),y:Math.max(0,box.y),width:Math.ceil(box.width),height:Math.ceil(box.height)},timeout:60000});}
  finally{await page.evaluate(()=>window.__ft3dFidelity.scene.setSuspended(false));}}
async function pageShot(page,name){if(!shots)return;await page.evaluate(()=>window.__ft3dFidelity.scene.setSuspended(true));
  try{await page.screenshot({path:path.join(shots,name),timeout:60000});}finally{await page.evaluate(()=>window.__ft3dFidelity.scene.setSuspended(false));}}
const ready=page=>page.waitForFunction(()=>/^dos_/.test(document.body.dataset.dossier||'')&&window.__ft3dDossier?.evaluation&&window.__ft3dDelivery,null,{timeout:60000});
const scenario=(page,id)=>page.evaluate(id=>window.__ft3dDossier.loadScenario(id),id);
// textContent (not innerText): hidden and collapsed blocks are checked too, so nothing of the previous project can hide there.
const panelText=page=>page.evaluate(()=>['projSummary','dossierPanel','projMeta','cardTasks','gantt','stepProject','stepPlan','brandPreview','topProject'].map(id=>document.getElementById(id)?.textContent||'').join('\n'));
// The documents exactly as RUBIK and FT3D-8 export them (JSON text) plus the Catastro GML file.
async function filesOf(id,{only=null}={}){
  const c=await X.dossier(id),out=[];
  const add=(kind,name,text,mimeType='application/json')=>{if(!only||only.includes(kind))out.push({name,mimeType,buffer:Buffer.from(text)});};
  add('project',`rubik-sota-${c.project.id}.json`,JSON.stringify(c.project,null,2));
  for(const b of c.budgets)add('budget',`rubik-sota-presupuesto-${b.id}.json`,Budget.serializeBudget(b));
  if(c.schedule)add('schedule',`plan-${c.schedule.id}.json`,Schedule.serialize(c.schedule));
  if(c.binding)add('binding',`vinculo-${c.binding.id}.json`,JSON.stringify(c.binding));
  if(c.brand)add('brand',`marca-${id}.json`,JSON.stringify(c.brand.snapshot));
  if(c.gml)add('gml',c.gml.fileName,c.gml.text,'application/gml+xml');
  return out;
}
// Waits on the lab's load counter (incremented for accepted AND rejected loads): never on a value that may not change.
const load=async(page,files)=>{const seq=await page.evaluate(()=>window.__ft3dDossier.state.seq);
  await page.locator('#dossierFiles').setInputFiles(files);
  await page.waitForFunction(n=>window.__ft3dDossier.state.seq>n,seq,{timeout:60000,polling:100});
  return page.evaluate(()=>window.__ft3dDossier.summary());};

test('the REAL Catastro provider reads the fixture GML exactly as the Node stand-in (contract is shared)',{timeout:120000},async t=>{
  const ctx=await browser.newContext();t.after(()=>ctx.close());const page=await ctx.newPage(),{errors,external}=watch(page);
  await page.goto(`${base}labs/ft3d-8/`);await ready(page);
  for(const id of ['A','B','C']){
    const real=await page.evaluate(({text})=>window.FloorPlanCatastroParcel.provider.getParcel({mode:'document',text}),{text:X.gml(X.PARCELS[id].reference,X.PARCELS[id].ring)});
    assert.deepEqual(real,X.catastroResult(id),id);
  }
  const wrong=await page.evaluate(text=>window.FloorPlanCatastroParcel.provider.getParcel({mode:'document',text}),X.gml('FX00A00001AA01',X.PARCELS.A.ring,{crs:'4326'}));
  assert.deepEqual(wrong,{status:'unsupported',reason:'unsupported-source-crs'});
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('desktop 1440x900 · scenarios A-J: correspondence, human messages, captures',{timeout:600000},async t=>{
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>ctx.close());
  const page=await ctx.newPage(),{errors,external}=watch(page);
  await page.goto(`${base}labs/ft3d-8/`);await ready(page);
  const expect={A:{steps:['valid','ok','declared','declared','available','declared'],errors:[]},
    B:{steps:['valid','estimated','partial','pending','available','pending'],errors:[]},
    C:{steps:['valid','estimated','partial','declared','available','declared'],errors:[]},
    D:{steps:['valid','missing','partial','missing','missing','missing'],errors:[]},
    E:{steps:['valid','ok','conflict','declared','available','conflict'],errors:['budget-other-project']},
    F:{steps:['valid','ok','declared','conflict','missing','conflict'],errors:['schedule-other-project']},
    G:{steps:['valid','conflict','declared','declared','available','conflict'],errors:['parcel-other-project']},
    H:{steps:['valid','ok','declared','obsolete','available','pending'],errors:[]},
    I:{steps:['valid','estimated','partial','declared','available','pending'],errors:[]}};
  const ids={};
  for(const [id,e] of Object.entries(expect)){
    const s=await scenario(page,id);ids[id]=s.id;
    assert.deepEqual(s.steps,e.steps,id+' steps');assert.deepEqual(s.errors,e.errors,id+' errors');
  }
  assert.equal(new Set(Object.values(ids)).size,Object.keys(ids).length,'every scenario is a distinct dossier');
  // Human messages are shown; codes live in the diagnostics panel.
  await scenario(page,'E');let text=await read(page,'#dossierFlow');
  assert.match(text,/El presupuesto pertenece a otro proyecto/);assert.ok(!text.includes('budget-other-project'));
  assert.ok((await page.locator('#dossierDiag').textContent()).includes('budget-other-project'),'codes stay in the (collapsed) diagnostics panel');
  assert.equal(await page.locator('#videoGo').isDisabled(),true);assert.match(await page.locator('#videoBlocked').innerText(),/incompatibilidades/);
  await shot(page,'#dossierPanel','05-error-presupuesto-ajeno.png');
  await scenario(page,'F');text=await read(page,'#dossierFlow');assert.match(text,/La planificación pertenece a otro proyecto/);
  assert.match(await page.locator('#gantt').innerText(),/PLAN DE OTRO PROYECTO/);await shot(page,'#dossierPanel','06-error-planificacion-ajena.png');
  await scenario(page,'G');text=await read(page,'#dossierFlow');assert.match(text,/La parcela está asociada a otro proyecto/);
  await shot(page,'#dossierPanel','07-error-parcela-ajena.png');
  await scenario(page,'H');text=await read(page,'#dossierFlow');assert.match(text,/La planificación se hizo sobre otra revisión del proyecto/);
  await shot(page,'#dossierPanel','08-revision-obsoleta.png');
  await scenario(page,'I');text=await read(page,'#dossierFlow');assert.match(text,/sin precio/);assert.match(text,/incompleto/);assert.ok(!/0,00 €/.test(text),'unknown amounts are never 0 €');
  await shot(page,'li.dstep[data-step="3"]','09-presupuesto-parcial.png');
  await scenario(page,'D');text=await read(page,'#dossierFlow');assert.match(text,/Todavía no hay una planificación asociada/);assert.match(text,/No se inventa ninguna/);
  assert.match(await page.locator('#gantt').innerText(),/PLANIFICACIÓN NO DISPONIBLE/);assert.match(text,/desconocido/);
  await pageShot(page,'10-proyecto-sin-plan.png');
  // J: an invalid GML is rejected with a readable message and the previous valid dossier stays.
  const j=await scenario(page,'J');assert.equal(j.error.code,'parcel-document-invalid');assert.equal(j.id,ids.A);assert.deepEqual(j.steps,expect.A.steps);
  assert.match(await page.locator('#dossierError').innerText(),/sistema de coordenadas no admitido.*se conserva/);
  await shot(page,'#dossierPanel','11b-gml-no-valido-estado-conservado.png');
  // Building: each level budget, never a sum.
  await scenario(page,'B');text=await read(page,'li.dstep[data-step="3"]');
  assert.match(text,/planta lvl_fx-b0/);assert.match(text,/planta lvl_fx-b1/);assert.match(text,/sin sumarlos/);
  await shot(page,'#dossierPanel','04-edificio-dos-plantas-alcance-economico.png');
  await scenario(page,'A');await shot(page,'#dossierPanel','01-proyecto-A-vinculado.png');
  await reveal(page,'#dossierFull');await page.locator('.ddiag summary').click();await shot(page,'#dossierPanel','01b-proyecto-A-diagnostico.png');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('project switch through the real file input: A -> B with A\'s documents -> B coherent; nothing of A survives',{timeout:600000},async t=>{
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>ctx.close());
  const page=await ctx.newPage(),{errors,external}=watch(page);
  await page.goto(`${base}labs/ft3d-8/?dossier=D`);await ready(page);
  // 1-3: project A with its budget, plan, binding, brand and parcel, exactly as exported.
  let s=await load(page,await filesOf('A'));
  assert.equal(s.subject,'prj_fx-house-a');assert.deepEqual(s.errors,[]);assert.deepEqual(s.steps,['valid','ok','declared','declared','available','declared']);
  const ev=await page.evaluate(()=>{const e=window.__ft3dDossier.evaluation;return {route:e.dossier.route,ev:e.authorities.territory.evidence.status,brand:e.authorities.brand.status,budget:e.authorities.budget.selected.map(b=>b.budgetId)};});
  assert.deepEqual(ev,{route:'local-documents',ev:'match',brand:'snapshot',budget:['bud_prj_fx-house-a']});
  assert.equal(await page.evaluate(()=>window.__ft3dDelivery.state.source),'dossier','the dossier brand is used');
  await page.evaluate(()=>window.__ft3dFidelity.setDate('2027-09-25'));assert.match(await page.locator('#cardTasks').innerText(),/Muros de fachada/);
  // 4-5: project B (the reform C fixture) alone: a NEW dossier; no costs, phases, parcel evidence or brand of A.
  s=await load(page,await filesOf('C',{only:['project']}));
  assert.equal(s.subject,'prj_fx-reform-c');assert.equal(s.change.subjectChanged,true);
  const b=await page.evaluate(()=>{const e=window.__ft3dDossier.evaluation;return {budgets:e.authorities.budget.selected.length,schedule:e.authorities.schedule.status,brand:e.authorities.brand.status,evidence:e.authorities.territory.evidence,
    parcel:e.authorities.territory.parcel?.reference,source:window.__ft3dDelivery.state.source,video:window.__ft3dDelivery.state.video};});
  assert.deepEqual(b,{budgets:0,schedule:'absent',brand:'absent',evidence:null,parcel:'FX00C00001CC01',source:'none',video:null});
  let txt=await panelText(page);
  for(const leak of ['prj_fx-house-a','bud_prj_fx-house-a','sch_fx-house-a','FX00A00001AA01','FIXTURE Estudio Norte','Muros de fachada'])assert.ok(!txt.includes(leak),leak+' survived the switch');
  // 6-7: A's budget and A's plan pushed into B: blocked by identity, never used.
  s=await load(page,(await filesOf('A',{only:['budget','schedule']})));
  assert.ok(s.errors.includes('budget-other-project')&&s.errors.includes('schedule-other-project'),s.errors.join());
  assert.equal(s.usable.costs,false);assert.equal(s.usable.timelapse,false);assert.equal(s.usable.delivery,false);
  assert.equal(await page.locator('#videoGo').isDisabled(),true);
  await shot(page,'#dossierPanel','12b-cambio-documentos-de-A-en-B-bloqueados.png');
  // 8-9: B's own documents: coherent again, and still nothing of A.
  s=await load(page,await filesOf('C',{only:['project','budget','schedule','binding','brand','gml']}));
  assert.equal(s.subject,'prj_fx-reform-c');assert.deepEqual(s.errors,[]);assert.deepEqual(s.steps,['valid','estimated','partial','declared','available','declared']);
  txt=await panelText(page);
  for(const leak of ['prj_fx-house-a','bud_prj_fx-house-a','sch_fx-house-a','FX00A00001AA01','FIXTURE Estudio Norte','Muros de fachada'])assert.ok(!txt.includes(leak),leak+' survived the switch');
  assert.equal(await page.evaluate(()=>window.__ft3dDelivery.state.source),'dossier');
  assert.match(await page.locator('#brandPreview').innerText(),/FIXTURE Reformas Centro/);
  await shot(page,'#dossierPanel','02-proyecto-B-vinculado-tras-el-cambio.png');
  // Reform view: demolition + new partitions in the timelapse.
  await page.evaluate(()=>{window.__ft3dFidelity.setDate('2027-02-03');window.__ft3dFidelity.setPose(window.__ft3dFidelity.frameEnvelope('iso'));});
  assert.equal(await page.evaluate(()=>window.__ft3dFidelity.last.activeTaskIds.join()),'demolicion');
  await shot(page,'.stagewrap','03-reforma-demolicion-en-curso.png');
  // An unknown document is refused; the dossier stays as it was.
  const keep=s.id;s=await load(page,[{name:'otro.json',mimeType:'application/json',buffer:Buffer.from('{"schema":"desconocido"}')}]);
  assert.equal(s.error.code,'import-unknown-kind');assert.equal(s.id,keep);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('dossier package round trip: save, reopen, verified integrity, same id; Gantt sync and reversible timelapse',{timeout:300000},async t=>{
  const ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>ctx.close());
  const page=await ctx.newPage(),{errors,external}=watch(page);
  await page.goto(`${base}labs/ft3d-8/?dossier=A`);await ready(page);
  const id=await page.evaluate(()=>window.__ft3dDossier.evaluation.dossier.id);
  const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('#dossierSave').click()]);
  const file=path.join(tmp,dl.suggestedFilename());await dl.saveAs(file);
  const text=await fs.readFile(file,'utf8');assert.ok(!text.includes('<g:FeatureCollection'),'the restricted GML is not inside the package');
  await scenario(page,'D');
  const s=await load(page,[{name:path.basename(file),mimeType:'application/json',buffer:Buffer.from(text)}]);
  const o=await page.evaluate(()=>{const e=window.__ft3dDossier.evaluation;return {integrity:e.dossier.integrity,route:e.dossier.route,evidence:e.authorities.territory.evidence.status};});
  assert.deepEqual(o,{integrity:'verified',route:'local-package',evidence:'registered-not-loaded'});
  assert.equal(s.subject,'prj_fx-house-a');assert.equal(s.id,id,'the reopened package is the same dossier');
  // A package edited by hand is reported as altered and cannot be delivered.
  const bad=JSON.parse(text);bad.parts.budgets[0].items[0].unitPrice=1;
  const s2=await load(page,[{name:'alterado.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))}]);
  assert.ok(s2.errors.includes('dossier-altered'));assert.equal(s2.usable.delivery,false);
  // Gantt and 3D share one date; going forward and back returns to the same state.
  await scenario(page,'A');
  const a=await page.evaluate(()=>window.__ft3dFidelity.setDate('2027-10-12'));assert.equal(a.ganttCursorDate,'2027-10-12');
  await page.evaluate(()=>window.__ft3dFidelity.setDate('2027-11-20'));
  const back=await page.evaluate(()=>window.__ft3dFidelity.setDate('2027-10-12'));assert.deepEqual(back,a);
  // The final timelapse state is the RUBIK model: same pieces as the fidelity case A without dossier (the site adds no geometry).
  const withDossier=await page.evaluate(()=>{const f=window.__ft3dFidelity;f.end();return {last:f.last,inspect:f.inspect()};});
  await pageShot(page,'11-timelapse-final-con-expediente.png');
  const without=await page.evaluate(async()=>{const f=window.__ft3dFidelity;await f.loadCase('A');f.end();return {last:f.last,inspect:f.inspect()};});
  assert.deepEqual(withDossier.inspect,without.inspect);assert.deepEqual(withDossier.last.presentElements,without.last.presentElements);
  assert.equal(await page.evaluate(()=>window.__ft3dDossier.evaluation),null,'a loose fidelity case is not presented as a dossier');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('video and delivery bound to the dossier: record, download, play, history kept after switching',{timeout:900000},async t=>{
  const ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>ctx.close());
  const page=await ctx.newPage(),{errors,external}=watch(page);
  await page.goto(`${base}labs/ft3d-8/?dossier=A`);await ready(page);
  const dos=await page.evaluate(()=>window.__ft3dDossier.evaluation.dossier.id);
  assert.equal(await page.evaluate(()=>window.__ft3dDelivery.state.source),'dossier');
  await reveal(page,'#videoGo');await page.locator('#videoGo').click();
  await page.waitForFunction(()=>window.__ft3dDelivery.state.video||/cancelad|no válido|no generó|no puede/.test(document.getElementById('videoStatus').textContent),null,{timeout:600000});
  const v=await page.evaluate(()=>{const s=window.__ft3dDelivery.state;return s.video&&{type:s.video.type,durationMs:s.video.durationMs,sha256:s.video.sha256,manifest:{id:s.manifest.id,dossier:s.manifest.dossier,territory:s.manifest.territory,brand:s.manifest.brand.name,schemaVersion:s.manifest.schemaVersion}};});
  assert.ok(v,'a video was produced: '+await page.locator('#videoStatus').innerText());
  assert.equal(v.manifest.schemaVersion,'0.2.0');assert.equal(v.manifest.dossier.id,dos);assert.equal(v.manifest.brand,'FIXTURE Estudio Norte');
  assert.deepEqual({ref:v.manifest.territory.reference,geo:v.manifest.territory.geometryIncluded},{ref:'FX00A00001AA01',geo:false});
  const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('#videoDownload').click()]);
  const file=path.join(tmp,dl.suggestedFilename());await dl.saveAs(file);
  const bytes=await fs.readFile(file);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),v.sha256);
  if(v.type==='video/mp4'){const info=M.inspect(bytes);assert.equal(info.valid,true);assert.ok(Math.abs(info.movieDurationSec*1000-v.durationMs)<=41);}
  // Playback of the downloaded file: duration, seeking, end.
  const pctx=await browser.newContext();const p=await pctx.newPage();
  await p.route('http://player.local/**',r=>r.request().url().endsWith('/video')?r.fulfill({path:file,contentType:v.type,headers:{'accept-ranges':'bytes'}}):r.fulfill({body:'<!doctype html><body style="margin:0;background:#000"></body>',contentType:'text/html'}));
  await p.goto('http://player.local/');
  const play=await p.evaluate(async()=>{const el=document.createElement('video');el.muted=true;el.src='/video';el.width=640;document.body.append(el);
    await new Promise((r,j)=>{el.onloadedmetadata=r;el.onerror=()=>j(Error('cannot load'));});const d=el.duration,landed=[];
    for(const k of [.3,.6,.9]){el.currentTime=d*k;await new Promise(r=>el.addEventListener('seeked',r,{once:true}));landed.push(el.currentTime/d);}
    el.currentTime=0;await new Promise(r=>el.addEventListener('seeked',r,{once:true}));el.playbackRate=4;await el.play();
    await new Promise((r,j)=>{el.addEventListener('ended',r,{once:true});setTimeout(()=>j(Error('no end')),d*1000);});return {d,landed,ended:el.currentTime};});
  if(shots)await p.screenshot({path:path.join(shots,'13-reproduccion-video-descargado.png')});
  await pctx.close();
  assert.ok(Math.abs(play.d*1000-v.durationMs)<=80,'player duration = declared');play.landed.forEach((x,i)=>assert.ok(Math.abs(x-[.3,.6,.9][i])<0.02));
  // Client presentation: dossier id and parcel reference as text, never the parcel geometry.
  await page.evaluate(()=>window.__ft3dDelivery.prepareDocument());
  const doc=await page.evaluate(()=>window.__ft3dDelivery.state.doc.html);
  assert.ok(doc.includes(dos)&&doc.includes('FX00A00001AA01')&&doc.includes('Dirección General del Catastro'));
  for(const c of ['500030','4500020','500015','4500010'])assert.ok(!doc.includes(c),'parcel coordinate '+c+' in the client file');
  let hist=await page.evaluate(()=>window.__ft3dDelivery.history);
  assert.deepEqual(hist.map(h=>[h.kind,h.dossierId]),[['vídeo',dos],['presentación',dos]]);
  await shot(page,'#step5','14-entrega-vinculada-al-expediente.png');
  // Switching dossier invalidates the prepared delivery but keeps the history and the downloaded file intact.
  await scenario(page,'C');
  hist=await page.evaluate(()=>window.__ft3dDelivery.history);assert.equal(hist.length,2);assert.ok(hist.every(h=>h.dossierId===dos));
  assert.equal(await page.evaluate(()=>window.__ft3dDelivery.state.video),null);
  assert.equal(crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'),v.sha256,'the downloaded video keeps its historical content');
  assert.match(await page.locator('#brandPreview').innerText(),/FIXTURE Reformas Centro/);
  await shot(page,'#step5','14b-historial-tras-cambiar-de-expediente.png');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('mobile 390x844 · dossier readable, no horizontal scroll, steps stacked',{timeout:300000},async t=>{
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});t.after(()=>ctx.close());
  const page=await ctx.newPage(),{errors,external}=watch(page);
  await page.goto(`${base}labs/ft3d-8/?dossier=A`);await ready(page);
  await reveal(page,'#dossierFull');
  const m=await page.evaluate(()=>{const steps=[...document.querySelectorAll('#dossierFlow .dstep')].map(e=>e.getBoundingClientRect());
    return {sw:document.documentElement.scrollWidth,cols:new Set(steps.map(r=>Math.round(r.left))).size,minW:Math.min(...steps.map(r=>r.width))};});
  assert.ok(m.sw<=391,'no horizontal scroll: '+m.sw);assert.equal(m.cols,1);assert.ok(m.minW>300);
  await shot(page,'#dossierPanel','12-movil-expediente.png');
  await scenario(page,'E');assert.match(await read(page,'#dossierFlow'),/El presupuesto pertenece a otro proyecto/);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});
