/* FT3D-6: real Chromium, real domain descriptors and the existing reversible player. No hosted writes. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),http=require('node:http'),{chromium}=require('playwright');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),S=require('./fixtures/stair-conflict-building.cjs');
const ROOT=path.resolve(__dirname,'..'),QA=process.env.TEMPLATES_ARTIFACTS||path.join(os.tmpdir(),'presentation-templates');
let server,url,browser,duplex,partial,singleSite;const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
before(async()=>{
 await fs.mkdir(QA,{recursive:true});
 const pack=async(name,mutate)=>{const b=S.build().building;for(const l of b.levels)l.project.objects=l.project.objects.filter(o=>!/sofa|bed/.test(o.id));mutate?.(b);const {entries}=await B.packageEntries(b,()=>null,T.imageInfo);const file=path.join(QA,name+'.zip');await fs.writeFile(file,Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));return file;};
 duplex=await pack('duplex');partial=await pack('partial',b=>{for(const w of b.levels[1].project.walls)w.status='demolished';});
 const site=require('./fixtures/territorial-integration.cjs').build().building.site;
 singleSite=await pack('single-site',b=>{b.levels=b.levels.slice(0,1);b.stairs=[];Object.assign(b,B.setSite(b,{parcel:site.parcel,northOffsetDeg:site.northOffsetDeg,buildingPlacement:{horizontal:{modelAnchorMm:{x:1300,y:-700},parcelLocalAnchorMm:{x:4200,y:9100},source:{type:'user-entered'}},vertical:{modelZeroElevationM:621.35,verticalReference:'orthometric',source:{type:'user-entered'}}}}));});
 server=http.createServer(async(req,res)=>{try{const file=path.resolve(ROOT,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(ROOT+path.sep))throw Error('path');res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(t,{viewport={width:1440,height:900},zip=null,locale='es'}={}){
 const context=await browser.newContext({viewport,reducedMotion:'reduce'});t.after(()=>context.close());const page=await context.newPage(),errors=[],external=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message);});
 await page.addInitScript(lang=>localStorage.setItem('rubik-sota-floorplan-lang',lang),locale);
 await page.route('**/*',async route=>{const target=route.request().url(),prefix='https://cdn.jsdelivr.net/npm/three@0.160.0/';if(target.startsWith(prefix))return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await fs.readFile(path.join(process.env.THREE_LOCAL_DIR||path.join(ROOT,'vendor/three'),target.slice(prefix.length)))});if(target.startsWith(url)||/^(blob:|data:)/.test(target))return route.continue();external.push(target);return route.abort();});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin);
 if(zip){const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.locator('#welcomeUpload').click()]);await chooser.setFiles(zip);await page.waitForFunction(()=>!!FloorPlanBuildingUI?.context);}else await page.locator('#welcomeExample').click();
 await page.waitForTimeout(800);return {page,context,errors,external};
}
const config=async page=>{await page.evaluate(()=>FloorPlanPresentation.open());await page.locator('#presentationConfig[open]').waitFor();};
const state=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),building:JSON.stringify(FloorPlanBuildingUI?.presentationSources?.()?.levels.map(l=>[l.levelId,l.project,l.revision])??null),revision:FloorPlanGuide.revision(FloorPlanApp.project),undo:undoStack.length,storage:{...localStorage},level:FloorPlanApp.levelContext?.levelId??null}));
const templates=page=>page.evaluate(()=>FloorPlanPresentation.templates);
function noTemplateStorage(before,after){
 // Frozen-baseline campaign already writes these three existing UI/guide progress keys on Presentation entry/exit.
 // All other values (including room sidecars, brand, audience and every unknown/new key) must remain identical.
 const legacyProgress=new Set(['huxing-panes','rubik-sota-guide-v1','rubik-sota-journey-v1']);
 for(const key of new Set([...Object.keys(before),...Object.keys(after)]))if(!legacyProgress.has(key))assert.equal(after[key],before[key],'storage '+key);
}
const start=async page=>{await page.getByRole('button',{name:/^(Iniciar presentación|Start presentation|开始展示)$/}).click();try{await page.waitForFunction(()=>FloorPlanPresentation.active&&!!FloorPlanPresentation.story&&!FloorPlanPresentation.story.busy);}catch(error){throw Error(error.message+' '+JSON.stringify(await page.evaluate(()=>({active:FloorPlanPresentation.active,story:FloorPlanPresentation.story,status:document.querySelector('.presentation-status')?.textContent,view:View3D.levelView}))));}};
const scrub=async(page,p)=>{await page.evaluate(p=>{const s=document.querySelector('#presentationStorySlider');s.value=String(p*Number(s.max));s.dispatchEvent(new Event('input',{bubbles:true}));},p);await page.waitForFunction(()=>!FloorPlanPresentation.story?.busy);await page.waitForTimeout(100);};
async function stop(page,how='close'){if(how==='escape')await page.keyboard.press('Escape');else if(how==='back')await page.goBack();else await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&!document.body.classList.contains('presentation-exiting'));}
const overflow=page=>page.evaluate(()=>document.scrollingElement.scrollWidth>innerWidth+1||document.querySelector('#presentationConfig').scrollWidth>document.querySelector('#presentationConfig').clientWidth+1);
for(const profile of ['real-estate','developer','architecture','renovation','interior-design'])test(`FT6 ${profile}: compiled story, frozen choices, scrub/reverse, project restore and no template storage`,async t=>{
 const {page,errors,external}=await open(t,{zip:profile==='developer'||profile==='architecture'?duplex:null}),before=await state(page);await config(page);
 assert.equal(await page.locator('#presentationTemplate').inputValue(),'');await page.locator('#presentationTemplate').selectOption(profile);
 const resolved=(await templates(page)).resolved;assert.equal(resolved.execution.available,true);assert.equal(resolved.minimumStory.satisfied,true);
 if(profile==='developer')assert.equal(resolved.buildingReading,'exploded-levels');if(profile==='architecture')assert.equal(resolved.buildingReading,'axon');
 await page.screenshot({path:path.join(QA,profile+'-config.png')});await start(page);
 const frozen=(await templates(page)).frozen;assert.deepEqual(frozen,resolved);const kinds=await page.evaluate(()=>FloorPlanPresentation.story.kinds);
 assert.deepEqual(kinds,resolved.sequence.filter(s=>s.type==='scene').map(s=>s.adapterId));assert.ok(kinds.filter(k=>/axon|exploded/.test(k)).length<=1);
 // Attempts to dispatch a hidden legacy control cannot rewrite the frozen reading or facade.
 await page.evaluate(()=>{const n=document.querySelector('#presentationAxonOff');n.checked=true;n.dispatchEvent(new Event('change'));});assert.deepEqual((await templates(page)).frozen,frozen);
 for(const p of [0,.22,.5,.645,1,.645,.22,0])await scrub(page,p);
 await page.screenshot({path:path.join(QA,profile+'-story.png')});await stop(page,profile==='architecture'?'back':profile==='renovation'?'escape':'close');
 const end=await state(page);for(const key of ['project','building','revision','undo','level'])assert.deepEqual(end[key],before[key],key+' unchanged');noTemplateStorage(before.storage,end.storage);
 const residue=await page.evaluate(()=>View3D.presentationAxonResidue);assert.equal(residue.active,false);assert.equal(residue.handles,0);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await config(page);assert.equal(await page.locator('#presentationTemplate').inputValue(),'');assert.equal((await templates(page)).resolved,null);
});
for(const viewport of [{width:390,height:844},{width:844,height:390}])test(`FT6 mobile ${viewport.width}: controls, focus, reset, explicit exploded choice and no overflow`,async t=>{
 const {page,errors}=await open(t,{viewport,zip:duplex});await config(page);await page.locator('#presentationTemplate').selectOption('architecture');
 await page.locator('.presentation-template-options').first().locator('summary').click();await page.locator('#presentationTemplateBuildingReading').focus();await page.locator('#presentationTemplateBuildingReading').selectOption('exploded');assert.equal((await templates(page)).resolved.buildingReading,'exploded-levels');
 assert.equal(await page.locator('#presentationTemplateBuildingReading').evaluate(n=>n===document.activeElement),true);assert.equal(await overflow(page),false);
 await page.locator('#presentationTemplateReset').click();assert.equal((await templates(page)).session.buildingReading,'automatic');assert.equal((await templates(page)).resolved.buildingReading,'axon');
 await start(page);for(const p of [.2,.55,.9,0])await scrub(page,p);assert.equal(await page.evaluate(()=>document.scrollingElement.scrollWidth>innerWidth+1),false);await stop(page);assert.deepEqual(errors,[]);
});
test('FT6 snapshot once per session, None restores manual choices, switch discards overrides, roomless gate and partial truth',async t=>{
 const {page}=await open(t,{zip:partial});await config(page);const snap=(await templates(page)).snapshot;
 await page.locator('#presentationStoryOption').check();const chosen=await page.locator('.presentation-room-list input:checked').count();
 await page.locator('#presentationTemplate').selectOption('developer');assert.equal((await templates(page)).resolved.buildingReading,'axon');assert.equal((await templates(page)).snapshot.structural.axon.availability,'partial');
 await page.locator('.presentation-template-options').first().locator('summary').click();assert.equal(await page.locator('#presentationTemplateBuildingReading option[value=exploded]').evaluate(n=>n.disabled),true,'native option.disabled forbids the unsupported variant');assert.match(await page.locator('#presentationTemplateBuildingReason').textContent(),/planta|level/);
 await page.locator('#presentationTemplateBuildingReading').selectOption('off');await page.locator('#presentationTemplate').selectOption('architecture');assert.equal((await templates(page)).session.buildingReading,'automatic');assert.deepEqual((await templates(page)).snapshot,snap);
 await page.locator('#presentationTemplate').selectOption('');assert.equal(await page.locator('#presentationStoryOption').isChecked(),true);assert.equal(await page.locator('.presentation-room-list input:checked').count(),chosen);
 await page.locator('#presentationTemplate').selectOption('interior-design');const checks=page.locator('.presentation-room-list input:checked');while(await checks.count())await checks.first().uncheck();
 assert.equal((await templates(page)).resolved.execution.available,false);assert.equal(await page.getByRole('button',{name:'Iniciar presentación',exact:true}).isDisabled(),true);
});
for(const locale of ['es','en','zh'])test(`FT6 ${locale}: localized template controls, labelled disabled reasons and no duplicate dialog`,async t=>{
 const {page,errors}=await open(t,{locale});await config(page);await page.locator('#presentationTemplate').selectOption('developer');
 const expected={es:'Plantilla profesional',en:'Professional template',zh:'专业模板'}[locale];assert.match(await page.locator('#presentationTemplates').textContent(),new RegExp(expected));
 await page.locator('.presentation-template-options').first().locator('summary').click();assert.equal(await page.locator('#presentationTemplateBuildingReading option[value=exploded]').evaluate(n=>n.disabled),true);
 assert.equal(await page.locator('#presentationTemplateBuildingReading').getAttribute('aria-describedby'),'presentationTemplateBuildingReason');
 for(const id of await page.locator('#presentationTemplates input:disabled').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-describedby'))))assert.ok(id&&await page.locator('#'+id).textContent());
 await page.evaluate(()=>document.querySelector('#presentationConfig').close());await config(page);assert.equal(await page.locator('#presentationTemplates').count(),1);assert.equal(await page.locator('#presentationTemplate').inputValue(),'');assert.deepEqual(errors,[]);
});
test('FT6 structural snapshot survives active→all with rooms only on lower level, and restores all→all',async t=>{
 const {page,errors}=await open(t,{zip:duplex});await page.locator('[data-view="3d"]').first().click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'));await page.evaluate(()=>document.querySelector('#levelViewAll').click());await page.waitForFunction(()=>View3D.levelView==='all');const before=await state(page);
 await config(page);await page.locator('#presentationTemplate').selectOption('developer');const upper=await page.locator('.presentation-level-group').last().getAttribute('data-level');const checks=page.locator(`.presentation-level-group[data-level="${upper}"] input:checked`);while(await checks.count())await checks.first().uncheck();
 const snapshot=(await templates(page)).snapshot;assert.equal(snapshot.levels.length,2);assert.equal((await templates(page)).resolved.decisions.find(c=>c.id==='exploded-levels').details.levelIds.length,2);
 await start(page);await page.locator('#presentationStoryNext').click();await page.locator('#presentationStoryNext').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='exploded-levels-open');assert.deepEqual((await templates(page)).snapshot,snapshot);
 await stop(page);assert.equal(await page.evaluate(()=>View3D.levelView),'all');assert.deepEqual((await state(page)).project,before.project);assert.deepEqual(errors,[]);
});
test('FT6 preferred adapter Begin failure restores and degrades, required tour failure closes with full restore',async t=>{
 const {page,errors}=await open(t),before=await state(page);await config(page);await page.locator('#presentationTemplate').selectOption('architecture');
 await page.evaluate(()=>{const begin=View3D.presentationStoryBegin;View3D.presentationStoryBegin=function(...args){const value=begin.apply(this,args);if(args[2]==='section-open')throw Error('QA section after Begin');return value;};});
 await start(page);await page.locator('#presentationStoryNext').click();await page.waitForFunction(()=>FloorPlanPresentation.templates.failures.length>0);assert.equal(await page.locator('#presentationTemplateRuntimeWarning').isVisible(),true);assert.equal(await page.evaluate(()=>FloorPlanPresentation.active),true);
 await stop(page);assert.deepEqual((await state(page)).project,before.project);
 // Interior has a required room-tour; losing it leaves no valid minimum.
 await config(page);await page.locator('#presentationTemplate').selectOption('interior-design');await page.evaluate(()=>{const begin=View3D.presentationStoryBegin;View3D.presentationStoryBegin=function(...args){const value=begin.apply(this,args);if(args[2]==='room-descent')throw Error('QA room after Begin');return value;};});
 await start(page);await page.locator('#presentationStoryNext').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&!document.body.classList.contains('presentation-exiting'));
 const end=await state(page);for(const key of ['project','revision','undo','level'])assert.deepEqual(end[key],before[key]);noTemplateStorage(before.storage,end.storage);assert.deepEqual(errors,[]);
});
test('FT6 Apply failure after real axon mutation rolls back without an unhandled frame rejection',async t=>{
 const {page,errors}=await open(t,{zip:duplex}),before=await state(page);await config(page);await page.locator('#presentationTemplate').selectOption('architecture');
 await page.evaluate(()=>{const apply=View3D.presentationStoryApply;View3D.presentationStoryApply=function(...args){const value=apply.apply(this,args);if(FloorPlanPresentation.story?.kind==='axon-open')throw Error('QA after actual Apply');return value;};});
 await start(page);for(let i=0;i<3;i++){await page.locator('#presentationStoryNext').click();await page.waitForFunction(()=>!FloorPlanPresentation.story?.busy);}
 await page.waitForFunction(()=>FloorPlanPresentation.templates.failures.some(f=>f.capability==='axon'));assert.equal(await page.evaluate(()=>FloorPlanPresentation.active),true);
 const residue=await page.evaluate(()=>View3D.presentationAxonResidue);assert.equal(residue.active,false);assert.equal(residue.handles,0);assert.ok(residue.levelDeltas.every(l=>Math.abs(l.deltaY)<1e-9));
 const failedP=await page.evaluate(()=>{const run=FloorPlanPresentation.story,seq=FloorPlanPresentationStory.sequence(run.kinds.map(k=>FloorPlanPresentationStory.SCENE_MS[k]));return seq.at(run.kinds.indexOf('axon-open'),.5);});
 await scrub(page,.99);await scrub(page,failedP);assert.equal(await page.evaluate(()=>View3D.presentationAxonResidue.active),false,'seeking back to a skipped scene must not reactivate its renderer state');
 await stop(page);assert.deepEqual((await state(page)).project,before.project);assert.deepEqual(errors,[]);
});
test('FT6 historical explicit sidecar >6 survives profile/reset and is never rewritten by a template',async t=>{
 const {page,errors}=await open(t);const saved=await page.evaluate(()=>{const app=FloorPlanApp,C=FloorPlanPresentationCore,ids=app.geometry.rooms.filter(r=>r.poly.length>=3&&C.area(r.poly)>0).slice(0,8).map(r=>r.id),key=C.key(app.entryId,app.project.id),value=JSON.stringify(C.sidecar(app.project.id,app.entryId,FloorPlanGuide.revision(app.project),ids));localStorage.setItem(key,value);return {key,value,ids};});
 await config(page);await page.locator('#presentationTemplate').selectOption('real-estate');assert.equal((await templates(page)).resolved.selectedRooms.length,8);assert.equal(await page.locator('[data-code=room-budget-exceeded]').count(),1);
 await page.locator('#presentationTemplate').selectOption('interior-design');await page.locator('#presentationTemplateReset').click();assert.deepEqual((await templates(page)).resolved.selectedRooms.map(r=>r.roomId),saved.ids);
 await start(page);await stop(page);assert.equal(await page.evaluate(k=>localStorage.getItem(k),saved.key),saved.value);assert.deepEqual(errors,[]);
});
for(const reading of ['compact','exploded'])test(`FT6 ${reading}: p0/p1 equal real overview, five reversible cycles, no rebuild per Apply`,async t=>{
 const {page,errors}=await open(t,{zip:duplex});await config(page);await page.locator('#presentationTemplate').selectOption('architecture');await page.locator('.presentation-template-options').first().locator('summary').click();await page.locator('#presentationTemplateBuildingReading').selectOption(reading);await start(page);
 await page.locator('.presentation-stops button').first().click();await page.waitForFunction(()=>!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 const pose=()=>page.evaluate(()=>View3D.presentationPose()),overview=await pose();
 const same=(actual)=>{for(const key of ['position','target'])actual[key].forEach((v,i)=>assert.ok(Math.abs(v-overview[key][i])<1e-6,key+' overview endpoint'));assert.ok(Math.abs(actual.fov-overview.fov)<1e-6);};
 for(let cycle=0;cycle<5;cycle++){
  await page.locator('#presentationAxonPlay').click();await page.waitForFunction(()=>!!FloorPlanPresentation.story);await scrub(page,0);same(await pose());const rebuilds=await page.evaluate(()=>View3D.presentationAxonResidue.rebuilds);
  for(const p of reading==='exploded'?[.22,.645,.86,1,.645,0,.645]:[.5,1,.5,0,.5]){await scrub(page,p);if(p===0||p===1)same(await pose());}
  assert.equal(await page.evaluate(()=>View3D.presentationAxonResidue.rebuilds),rebuilds,'Apply must not rebuild');
  await page.locator('#presentationStoryPlan').click();await page.waitForFunction(()=>!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false');const residue=await page.evaluate(()=>View3D.presentationAxonResidue);assert.equal(residue.active,false);assert.equal(residue.handles,0);assert.ok(residue.levelDeltas.every(l=>Math.abs(l.deltaY)<1e-9));same(await pose());
 }
 await stop(page);assert.deepEqual(errors,[]);
});
test('FT6 one-level building reads existing site data from its building authority',async t=>{
 const {page,errors}=await open(t,{zip:singleSite}),before=await state(page);assert.equal(await page.evaluate(()=>FloorPlanApp.levelContext.levels),1);
 assert.equal(await page.evaluate(()=>!!FloorPlanBuildingUI.site.buildingPlacement),true);assert.equal(await page.evaluate(()=>!!FloorPlanApp.project.site),false);
 await config(page);await page.locator('#presentationTemplate').selectOption('developer');const data=await templates(page);assert.equal(data.snapshot.resources['site-data'].availability,'supported');assert.deepEqual(data.resolved.decisions.find(c=>c.id==='site-context').compatibleHosts,['elevation']);assert.deepEqual((await state(page)).project,before.project);assert.deepEqual(errors,[]);
});
