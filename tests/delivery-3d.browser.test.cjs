// Delivery 3D Client Experience V1, end to end in Chromium. The app's static files and the REAL /api/share, /api/view,
// /api/delivery and /api/unshare handlers run over an in-memory Vercel Blob stand-in (tests/helpers/delivery-server.cjs):
// no network, no real store, no real project. Scenarios:
//  A professional → prepare the presentation → «Entregar» card → preview as client → walk → guided → publish → dossier
//    visit link → client view from /api/delivery → back to the dossier;
//  B two-level building delivery (guided over both levels);
//  C unavailable / tampered / unreachable delivery, recoverable retry;
//  D phone portrait and landscape;
//  E no WebGL, and a lost WebGL context during the visit;
//  F security: no access code or store token anywhere, no excluded field, real storage untouched, versioning, withdrawal;
//  G regressions: the downloadable (offline) client file and the old «Enlace para el cliente» default stay unchanged.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{chromium}=require('playwright');
const S=require('./helpers/delivery-server.cjs'),D=require('../js/delivery-core.js'),F=require('./fixtures/building-fixture.cjs');
const SHOTS=process.env.QA_SHOTS||'';let srv,browser;
before(async()=>{srv=await S.start();browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await srv?.close();});
const shot=async(page,name)=>{if(!SHOTS)return;await fs.mkdir(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,name+'.png')});};
// The public store host is answered from the same in-memory store (the dossier's video, a direct blob URL).
async function context(opts={}){
 const ctx=await browser.newContext({viewport:{width:1440,height:900},...opts});const external=[];
 await ctx.route('**/*',r=>{const u=r.request().url();
  if(u.startsWith(S.STORE+'/')){const f=srv.blob.files.get(u.split('?')[0]);return f?r.fulfill({status:200,contentType:f.type,body:f.body}):r.fulfill({status:404,body:''});}
  if(u.startsWith(srv.url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 ctx.external=external;return ctx;
}
const watch=page=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);return errors;};
const clientReady=page=>page.waitForFunction(()=>['ready','no-3d','error'].includes(window.FloorPlanDeliveryClient?.state)&&FloorPlanDeliveryClient.state!=='loading',null,{timeout:120000});
async function openExample(page){
 await page.goto(srv.url);await page.waitForFunction(()=>window.FloorPlanDeliveryUI&&window.FloorPlanPresentation);
 await page.locator('#welcomeExample').click();await page.waitForFunction(()=>FloorPlanApp.project.rooms.length>3);
}
// The professional's own decision, through Rubik's «Presentar mi vivienda» dialog (not a seeded value).
async function preparePresentation(page){
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 const start=page.locator('#presentationConfig .presentation-config-actions .btn').first();await start.scrollIntoViewIfNeeded();await start.click();
 await page.waitForFunction(()=>FloorPlanPresentation.active,null,{timeout:120000});await page.locator('#presentationClose').click();
 await page.waitForFunction(()=>!FloorPlanPresentation.active);
}
async function publishFromCard(page,{code=S.ENV.RUBIK_RENDER_TOKEN}={}){
 await page.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));await page.locator('#delivery3dCard').waitFor();
 await page.locator('#delivery3dPublish').click();await page.locator('#shareLinkDialog[open]').waitFor();
 assert.equal(await page.locator('#shareLink3d').isChecked(),true,'opened from the 3D card: the visit is included');
 await page.locator('#shareLinkToken').fill(code);await page.locator('#shareLinkAgree').check();await page.locator('#shareLinkGo').click();
 await page.waitForFunction(()=>/publicado|published|Error|no /i.test(document.querySelector('#shareLinkStatus')?.textContent||''),null,{timeout:120000});
 return page.evaluate(()=>FloorPlanShareLink.last);
}
const storedOf=kind=>[...srv.blob.files.entries()].filter(([u])=>kind==='delivery'?u.endsWith('.delivery.json'):u.endsWith('.'+kind));

test('A + F + G: prepare, preview as client, walk, guided, publish, open from the dossier, withdraw',{timeout:900000},async t=>{
 const ctx=await context();t.after(()=>ctx.close());const pro=await ctx.newPage(),errors=watch(pro);
 await openExample(pro);
 // G: the old entry point keeps its default — nothing 3D is shared unless chosen.
 await pro.evaluate(()=>FloorPlanShareLink.open());assert.equal(await pro.locator('#shareLink3d').isChecked(),false,'old «Enlace para el cliente»: visit not pre-selected');
 await pro.locator('#shareLinkClose').click();
 // G: the downloadable client file has no visit section and no network-only control.
 const offline=await pro.evaluate(async()=>(await FloorPlanClientShare.build()).html);
 assert.ok(!offline.includes('shareVisit')&&!offline.includes('?entrega='),'offline file unchanged: no 3D visit control');
 // Not prepared: walk available, presentation still to choose.
 let s=await pro.evaluate(()=>FloorPlanDeliveryUI.status());assert.equal(s.walk,true);assert.equal(s.guided,false);
 await preparePresentation(pro);
 s=await pro.evaluate(()=>FloorPlanDeliveryUI.status());assert.equal(s.guided,true);assert.ok(s.rooms>=1);assert.match(s.revision,/^[0-9a-f]{8}$/,'short version code');
 await pro.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));await pro.locator('#delivery3dCard').scrollIntoViewIfNeeded();
 assert.match(await pro.locator('#delivery3dCard h3').textContent(),/listo para recorrer/);
 assert.equal(await pro.locator('#delivery3dState').getAttribute('data-tone'),'ready');
 assert.match(await pro.locator('#delivery3dIncluded').textContent(),/Presentación preparada: \d+ estancia/);
 await shot(pro,'A-pro-card');
 // Preview as client: a new tab fed by this one, nothing uploaded.
 const before=srv.blob.files.size;
 const [pv]=await Promise.all([ctx.waitForEvent('page'),pro.locator('#delivery3dPreview').click()]);const pvErrors=watch(pv);
 await clientReady(pv);assert.equal(await pv.evaluate(()=>FloorPlanDeliveryClient.state),'ready');
 assert.equal(srv.blob.files.size,before,'preview publishes nothing');
 await pv.locator('#deliveryPreviewNote').waitFor();await shot(pv,'A-client-gate-preview');
 assert.equal(await pv.locator('.app>header').isVisible(),false,'no editor chrome for the client');
 // Free walk.
 await pv.locator('#deliveryWalk').click();await pv.waitForFunction(()=>View3D.walking());
 await pv.locator('#deliveryBar').waitFor();assert.equal(await pv.locator('#presentationTools').isVisible(),false);
 await shot(pv,'A-client-walk');
 await pv.locator('#deliveryExit').click();await pv.waitForFunction(()=>FloorPlanDeliveryClient.mode==='gate'&&!View3D.walking());
 // Guided: the professional's rooms, in order; no professional tool.
 const decided=await pro.evaluate(()=>{const C=FloorPlanPresentationCore;return JSON.parse(localStorage.getItem(C.key(FloorPlanApp.entryId,FloorPlanApp.project.id))).roomIds;});
 await pv.locator('#deliveryGuided').click();await pv.waitForFunction(()=>FloorPlanPresentation.active,null,{timeout:120000});
 const stops=await pv.evaluate(()=>FloorPlanPresentation.plan.stops.filter(s=>s.kind==='room').map(s=>s.roomId));
 assert.deepEqual(stops,decided,'the presentation keeps the professional\'s decision');
 for(const id of ['#presentationTools','#presentationClose'])assert.equal(await pv.locator(id).isVisible(),false,id);
 await pv.waitForTimeout(1500);await shot(pv,'A-client-guided');
 await pv.locator('#deliveryExit').click();await pv.waitForFunction(()=>FloorPlanDeliveryClient.mode==='gate'&&!FloorPlanPresentation.active);
 assert.deepEqual(pvErrors,[]);await pv.close();
 // F: the client tab never wrote to the real storage of this origin.
 const keysBefore=await pro.evaluate(()=>Object.keys(localStorage).sort());
 // Publish (with the visit).
 const result=await publishFromCard(pro);assert.ok(result?.visit,'visit link returned');
 const snaps=storedOf('delivery'),pages=storedOf('html');assert.equal(snaps.length,1);assert.equal(pages.length,1);
 const snapText=snaps[0][1].body.toString('utf8'),snap=D.validate(JSON.parse(snapText));
 // F: what the client can download contains no secret and no excluded field.
 for(const secret of [S.ENV.RUBIK_RENDER_TOKEN,S.ENV.BLOB_READ_WRITE_TOKEN,'teststore_0123'])
  for(const [name,text] of [['snapshot',snapText],['page',pages[0][1].body.toString('utf8')],['visit url',result.visit],['link',result.link]])assert.ok(!text.includes(secret),`${name} leaks ${secret.slice(0,6)}…`);
 assert.deepEqual(D.excluded(snap.content.project).filter(k=>k!=='sourceImages'),[]);
 assert.equal(snap.source.versionCode,s.revision);assert.equal(snap.capabilities.guided,true);
 await pro.locator('#shareLinkClose').click();
 assert.equal(await pro.locator('#delivery3dState').getAttribute('data-tone'),'live');assert.match(await pro.locator('#delivery3dPublished').textContent(),/versión [0-9a-f]{8}/);
 await shot(pro,'A-pro-card-published');
 // The client opens the dossier link, then the visit from it, then comes back.
 const client=await ctx.newPage(),cErrors=watch(client);
 await client.goto(result.link);await client.locator('#shareVisitLink').waitFor();await shot(client,'A-dossier-visit-section');
 await client.locator('#shareVisitLink').click();await clientReady(client);
 assert.equal(await client.evaluate(()=>FloorPlanDeliveryClient.state),'ready');
 assert.equal(await client.locator('#deliveryPreviewNote').count(),0,'no preview note for the real client');
 await client.locator('#deliveryWalk').click();await client.waitForFunction(()=>View3D.walking());await client.locator('#deliveryExit').click();
 await client.waitForFunction(()=>FloorPlanDeliveryClient.mode==='gate');
 await client.locator('#deliveryBack').click();await client.waitForURL(/api\/view/);assert.deepEqual(cErrors,[]);
 const keysAfter=await pro.evaluate(()=>Object.keys(localStorage).sort());
 assert.deepEqual(keysAfter.filter(k=>!keysBefore.includes(k)&&k!=='rubik-delivery-publications'&&k!=='rubik-render-token'),[],'the client view wrote nothing to real storage');
 // Outdated: a publication of another version of the project is shown as behind, with what to do.
 await pro.evaluate(()=>{const k='rubik-delivery-publications',l=JSON.parse(localStorage.getItem(k));l[0].revision='00000000';localStorage.setItem(k,JSON.stringify(l));FloorPlanProfessionalUI.open('deliver');});
 await pro.waitForFunction(()=>document.querySelector('#delivery3dState')?.dataset.tone==='warn');
 assert.match(await pro.locator('#delivery3dState').textContent(),/cambió desde la última entrega/);await shot(pro,'A-pro-card-outdated');
 // F: withdrawal — the page, the snapshot and the visit are gone.
 await pro.evaluate(()=>FloorPlanShareLink.open({include3d:true}));await pro.locator('#shareLinkHistory').waitFor();
 await pro.locator('#shareLinkHistory .btn.danger').first().click();
 await pro.waitForFunction(()=>/retirada|withdrawn/i.test(document.querySelector('#shareLinkStatus')?.textContent||''));
 assert.equal(storedOf('delivery').length+storedOf('html').length,0,'files deleted from the store');
 const gone=await ctx.newPage();watch(gone);await gone.goto(result.visit);await clientReady(gone);
 assert.equal(await gone.evaluate(()=>FloorPlanDeliveryClient.state),'error');assert.match(await gone.locator('.delivery-title').textContent(),/ya no está disponible/);
 await shot(gone,'F-withdrawn');
 assert.equal((await gone.request.get(result.link)).status(),404,'dossier link answers not found');
 assert.deepEqual(errors,[]);assert.deepEqual(ctx.external,[],'no external request');
});

test('B: two-level building delivery: guided over both levels, walk available',{timeout:600000},async t=>{
 const b=F.build().building,[g,u]=b.levels;
 const snap=D.buildSnapshot({building:b,presentation:{scope:'building',sidecars:[{projectId:g.project.id,levelId:g.id,roomIds:g.project.rooms.map(r=>r.id)},{projectId:u.project.id,levelId:u.id,roomIds:[u.project.rooms[0].id]}]},title:b.name,versionCode:'b1b2c3d4'});
 const url=S.STORE+'/rubik-share/casa-sintetica-k1.delivery.json';srv.blob.files.set(url,{body:Buffer.from(JSON.stringify(snap)),type:'application/json'});
 const ctx=await context();t.after(()=>ctx.close());const page=await ctx.newPage(),errors=watch(page);
 await page.goto(srv.url+'?entrega='+encodeURIComponent(url));await clientReady(page);
 assert.equal(await page.evaluate(()=>FloorPlanDeliveryClient.state),'ready');
 assert.match(await page.locator('#deliveryFacts').textContent(),/en 2 plantas/);await shot(page,'B-building-gate');
 await page.locator('#deliveryGuided').click();await page.waitForFunction(()=>FloorPlanPresentation.active,null,{timeout:120000});
 const rooms=await page.evaluate(()=>FloorPlanPresentation.plan.stops.filter(s=>s.kind==='room').map(s=>s.roomId));
 assert.deepEqual(rooms.sort(),[...g.project.rooms.map(r=>r.id),u.project.rooms[0].id].sort(),'rooms of both levels, as decided');
 await page.waitForTimeout(1200);await shot(page,'B-building-guided');
 await page.locator('#deliveryExit').click();await page.waitForFunction(()=>FloorPlanDeliveryClient.mode==='gate');
 await page.locator('#deliveryWalk').click();await page.waitForFunction(()=>View3D.walking());await page.locator('#deliveryExit').click();
 assert.deepEqual(errors,[]);srv.blob.files.delete(url);
});

test('C: unavailable, foreign, tampered and unreachable deliveries; recoverable retry',{timeout:600000},async t=>{
 const ctx=await context();t.after(()=>ctx.close());const page=await ctx.newPage(),errors=watch(page);
 for(const f of [S.STORE+'/rubik-share/nada-x1.delivery.json','https://evil.example/rubik-share/a.delivery.json','javascript:alert(1)']){
  await page.goto(srv.url+'?entrega='+encodeURIComponent(f));await clientReady(page);
  assert.equal(await page.evaluate(()=>FloorPlanDeliveryClient.state),'error',f);assert.match(await page.locator('.delivery-title').textContent(),/ya no está disponible/,f);
 }
 await shot(page,'C-missing');
 const bad=D.buildSnapshot({project:require('../docs/contracts/examples/floorplan-project-v1.f1b.example.json')});bad.content.project.extensions={x:1};
 const url=S.STORE+'/rubik-share/manipulada-z9.delivery.json';srv.blob.files.set(url,{body:Buffer.from(JSON.stringify(bad)),type:'application/json'});
 await page.goto(srv.url+'?entrega='+encodeURIComponent(url));await clientReady(page);assert.equal(await page.evaluate(()=>FloorPlanDeliveryClient.state),'error','tampered snapshot refused');
 // Unreachable once, then the retry works.
 const good=D.buildSnapshot({project:require('../docs/contracts/examples/floorplan-project-v1.f1b.example.json'),title:'Casa F1B'});srv.blob.files.set(url,{body:Buffer.from(JSON.stringify(good)),type:'application/json'});
 let fail=true;await page.route('**/api/delivery?*',r=>fail?(fail=false,r.abort()):r.continue());
 await page.goto(srv.url+'?entrega='+encodeURIComponent(url));await clientReady(page);
 assert.equal(await page.evaluate(()=>FloorPlanDeliveryClient.state),'error');await page.locator('#deliveryRetry').waitFor();await shot(page,'C-network-retry');
 await page.locator('#deliveryRetry').click();await clientReady(page);assert.equal(await page.evaluate(()=>FloorPlanDeliveryClient.state),'ready');
 assert.equal(await page.locator('#deliveryGuided').count(),0,'no prepared presentation: no guided button');
 assert.deepEqual(errors,[]);srv.blob.files.delete(url);
});

for(const [name,viewport] of [['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]])
test(`D: phone ${name}: the gate fits, 44px targets, walk with touch controls`,{timeout:600000},async t=>{
 const ex=require('../docs/contracts/examples/floorplan-project-v1.f1b.example.json');
 const snap=D.buildSnapshot({project:ex,presentation:{sidecars:[{projectId:ex.id,roomIds:ex.rooms.map(r=>r.id)}]},title:'Casa F1B'});
 const url=S.STORE+`/rubik-share/movil-${name}.delivery.json`;srv.blob.files.set(url,{body:Buffer.from(JSON.stringify(snap)),type:'application/json'});
 const ctx=await context({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:2});t.after(()=>ctx.close());const page=await ctx.newPage(),errors=watch(page);
 await page.goto(srv.url+'?entrega='+encodeURIComponent(url));await clientReady(page);
 const m=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,w:innerWidth,btn:[...document.querySelectorAll('#deliveryGate button')].map(b=>b.getBoundingClientRect().height)}));
 assert.ok(m.sw<=m.w,'no horizontal scroll');for(const h of m.btn)assert.ok(h>=44,'touch target '+h);
 assert.match(await page.locator('#deliveryFacts').textContent(),/joystick/);await shot(page,`D-${name}-gate`);
 await page.locator('#deliveryWalk').tap();await page.waitForFunction(()=>View3D.walking());
 const bar=await page.locator('#deliveryExit').boundingBox();assert.ok(bar.height>=40);await page.waitForTimeout(800);await shot(page,`D-${name}-walk`);
 await page.locator('#deliveryExit').tap();await page.waitForFunction(()=>FloorPlanDeliveryClient.mode==='gate');
 assert.deepEqual(errors,[]);srv.blob.files.delete(url);
});

test('E: no WebGL, and a lost context during the visit',{timeout:600000},async t=>{
 const ex=require('../docs/contracts/examples/floorplan-project-v1.f1b.example.json');
 const url=S.STORE+'/rubik-share/sin-webgl-e1.delivery.json';srv.blob.files.set(url,{body:Buffer.from(JSON.stringify(D.buildSnapshot({project:ex,title:'Casa F1B'}))),type:'application/json'});
 const ctx=await context();t.after(()=>ctx.close());
 const none=await ctx.newPage();watch(none);
 await none.addInitScript(()=>{const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...a){return /webgl/i.test(k)?null:g.call(this,k,...a);};});
 await none.goto(srv.url+'?entrega='+encodeURIComponent(url));await clientReady(none);
 assert.equal(await none.evaluate(()=>FloorPlanDeliveryClient.state),'no-3d');await none.locator('#deliveryNo3d').waitFor();
 assert.equal(await none.locator('#deliveryWalk').count(),0,'no control that cannot work');await shot(none,'E-no-webgl');
 const page=await ctx.newPage(),errors=watch(page);await page.goto(srv.url+'?entrega='+encodeURIComponent(url));await clientReady(page);
 await page.locator('#deliveryWalk').click();await page.waitForFunction(()=>View3D.walking());
 await page.evaluate(()=>document.querySelector('#stage canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
 await page.waitForFunction(()=>FloorPlanDeliveryClient.mode==='gate');await page.locator('#deliveryInterrupted').waitFor();await shot(page,'E-context-lost');
 assert.deepEqual(errors.filter(e=>!/context/i.test(e)),[]);srv.blob.files.delete(url);
});
