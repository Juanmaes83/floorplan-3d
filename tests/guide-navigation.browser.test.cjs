const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{createServer}=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');let server,url;
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;});
after(async()=>{await new Promise(r=>server.close(r));});
async function setup(t,viewport={width:1440,height:900}){const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox',...(process.env.CHROME_SINGLE_PROCESS?['--no-zygote','--single-process']:[])]});t.after(()=>browser.close());const context=await browser.newContext({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000}),page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);return {page,context,errors};}
const project=page=>page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
const guide=page=>page.evaluate(()=>JSON.stringify(FloorPlanGuideUI.state()));
async function click(page,id){const b=page.locator(id);await b.scrollIntoViewIfNeeded();if(await page.evaluate(()=>matchMedia('(pointer:coarse)').matches))await b.tap();else await b.click();}
const welcome=page=>page.locator('#welcomeDialog').evaluate(d=>d.open);
async function shot(page,name){if(process.env.NAVIGATION_ARTIFACTS){await fs.mkdir(process.env.NAVIGATION_ARTIFACTS,{recursive:true});await page.screenshot({path:path.join(process.env.NAVIGATION_ARTIFACTS,name+'.png')});}}
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])test(`native Back, visible home, explicit reopening and task return ${viewport.width}x${viewport.height}`,async t=>{
 const {page,context,errors}=await setup(t,viewport);assert.equal(await welcome(page),true);await click(page,'#welcomeExample');const original=await project(page);assert.equal(new URL(page.url()).hash,'#editor');
 await page.goBack();assert.equal(await welcome(page),true);assert.deepEqual(await project(page),original);await page.goForward();assert.equal(await welcome(page),false);assert.deepEqual(await project(page),original);
 // Home remains within the viewport even after horizontal toolbar scrolling on phones.
 await page.locator('header').evaluate(h=>{h.scrollLeft=h.scrollWidth;});const rect=await page.locator('#welcomeBtn').boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=viewport.width);await shot(page,`${viewport.width}x${viewport.height}-editor`);await click(page,'#welcomeBtn');assert.equal(await welcome(page),true);assert.equal(new URL(page.url()).hash,'#inicio');await shot(page,`${viewport.width}x${viewport.height}-welcome-return`);await click(page,'#welcomeReturn');assert.equal(await welcome(page),false);assert.deepEqual(await project(page),original);
 await click(page,'#guideCopyExample');const own=await project(page);await click(page,'#guidePrevious');assert.equal(await page.evaluate(()=>FloorPlanGuideUI.state().current),'furniture');const s=await guide(page);await page.reload();assert.equal(await welcome(page),false);assert.deepEqual(await project(page),own);assert.equal(await page.evaluate(()=>FloorPlanGuideUI.state().current),'furniture');assert.equal(await page.evaluate(()=>FloorPlanGuideUI.state().manualTask),true);
 // Reopening the entry URL means welcome; it never deletes or resets the current project.
 const reopened=await context.newPage();await reopened.route('https://cdn.jsdelivr.net/**',r=>r.abort());await reopened.goto(url);assert.equal(await welcome(reopened),true);assert.deepEqual(await project(reopened),own);await click(reopened,'#welcomeContinue');assert.equal(await welcome(reopened),false);assert.deepEqual(await project(reopened),own);assert.deepEqual(await guide(reopened),s);
 assert.ok(await reopened.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
});
test('cancel and Escape from first-room entry return home, browser Back dismisses the dialog without losing the project',async t=>{
 const {page,errors}=await setup(t);await click(page,'#welcomeBlank');const empty=await project(page);assert.equal(await page.locator('#roomDesignDialog').evaluate(d=>d.open),true);await click(page,'#roomDesignCancel');assert.equal(await welcome(page),true);assert.deepEqual(await project(page),empty);
 await click(page,'#welcomeContinue');assert.equal(await welcome(page),false);assert.deepEqual(await project(page),empty);await click(page,'#welcomeBtn');await click(page,'#welcomeBlank');const second=await project(page);await page.locator('#roomDesignName').press('Escape');assert.equal(await welcome(page),true);assert.deepEqual(await project(page),second);
 await click(page,'#welcomeBlank');const third=await project(page);await page.goBack();assert.equal(await welcome(page),true);assert.equal(await page.locator('#roomDesignDialog').evaluate(d=>d.open),false);assert.deepEqual(await project(page),third);assert.deepEqual(errors,[]);
});

// The highlighted stage is always the stage of the task the guide card shows. Before, reopening a task already done in
// the example («Coloca muebles») left «Amueblar» highlighted while the card asked to review in 3D (stage 5), and
// «Presentar mi vivienda» left the guide for the header.
for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`guide stage follows the card ${viewport.width}x${viewport.height}`,async t=>{
 const {page,errors}=await setup(t,viewport);await click(page,'#welcomeExample');
 const read=()=>page.evaluate(()=>{const cur=document.querySelector('#guideBar [aria-current="step"]'),steps=[...document.querySelectorAll('#guideBar [aria-current="step"]')];
  const title=document.querySelector('#guideBar h2')?.textContent.trim()||'',def=Object.values(FloorPlanGuide.definitions).find(d=>title.endsWith(d.title[0]));
  const shown=e=>!!e&&!e.closest('[hidden]')&&e.getClientRects().length>0;
  return {current:steps.length,stage:cur?[...cur.closest('ol').querySelectorAll('button')].indexOf(cur):-1,title,taskStage:def?.stage??null,guidePresent:shown(document.querySelector('#guidePresent'))};});
 const check=async where=>{const r=await read();assert.equal(r.current,1,`${where} one current stage`);if(r.taskStage!==null)assert.equal(r.stage,r.taskStage,`${where} ${JSON.stringify(r)}`);if(r.taskStage===4)assert.equal(r.guidePresent,true,`${where} «Presentar» stays in the guide at stage 5`);return r;};
 await check('example entered');
 await click(page,'#guideDetails');await click(page,'#guideTask-furniture');await page.waitForTimeout(300);
 const after=await check('task already done reopened');assert.notEqual(after.title,'',`title shown`);
 assert.deepEqual(errors,[]);
});

// Changing the example is allowed; the guide then says it has changed and its copy keeps those changes.
for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`a changed example says so and its copy keeps the change ${viewport.width}x${viewport.height}`,async t=>{
 const {page,errors}=await setup(t,viewport);await click(page,'#welcomeExample');
 const line=()=>page.evaluate(()=>({note:document.querySelector('.guide-example span').textContent,button:document.querySelector('#guideCopyExample').textContent,primary:document.querySelector('#guideCopyExample').classList.contains('primary'),shown:!document.querySelector('.guide-example').hidden}));
 const before=await line();assert.equal(before.primary,false);assert.match(before.note,/Exploras el ejemplo/);
 // One name for the copy everywhere in the guide: «Crear mi copia» (plus what it keeps or does next).
 assert.equal(before.button,'Crear mi copia');
 // A real edit: select a piece of furniture on the plan and delete it.
 const total=await page.evaluate(()=>FloorPlanApp.project.objects.length);
 const pt=await page.evaluate(()=>{const r=document.querySelector(`#gFurn [data-fid="${FloorPlanApp.project.objects[0].id}"]`).getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];});
 if(viewport.width<1000)await page.touchscreen.tap(pt[0],pt[1]);else await page.mouse.click(pt[0],pt[1]);await page.waitForFunction(()=>ui.sel?.kind==='furn');
 await page.keyboard.press('Delete');await page.waitForFunction(n=>FloorPlanApp.project.objects.length===n-1,total);const count=total-1;
 const after=await line();assert.equal(after.shown,true,'example line shown');assert.equal(after.note,'Has cambiado el ejemplo. Crea tu copia para conservar estos cambios.');assert.equal(after.button,'Crear mi copia con estos cambios');assert.equal(after.primary,true);
 await click(page,'#guideCopyExample');await page.waitForFunction(()=>FloorPlanGuideUI.state().kind==='own');
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.objects.length),count,'the copy keeps the change');
 assert.deepEqual(errors,[]);
});

// In the example, an action that needs the person's copy (furnishing) asks for it on the guide card, with one copy
// button and the way back to exploring; the task list no longer opens at 0 % with «Necesita revisión» on rooms that exist.
for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`the example asks for the copy in place ${viewport.width}x${viewport.height}`,async t=>{
 const {page,errors}=await setup(t,viewport);await click(page,'#welcomeExample');
 const search=async q=>{await click(page,'#actionSearchBtn');await page.fill('#editorActionInput',q);await page.locator('#editorActionInput').press('ArrowDown');await page.locator('#editorActionInput').press('Enter');await page.waitForTimeout(300);};
 const card=()=>page.evaluate(()=>{const shown=e=>!!e&&!e.closest('[hidden]')&&e.getClientRects().length>0;return {dialog:document.querySelector('#guideDialog').open,title:document.querySelector('#guideBar h2').textContent.trim(),primary:document.querySelector('#guidePrimary').textContent.trim(),focused:document.activeElement?.id,secondary:shown(document.querySelector('#guideSecondary'))?document.querySelector('#guideSecondary').textContent.trim():null,copyButtons:[...document.querySelectorAll('#guideBar button')].filter(b=>shown(b)&&/copia/i.test(b.textContent)).length,kind:FloorPlanGuideUI.state().kind,goal:FloorPlanGuideUI.state().goal};});
 await search('muebles');
 const asked=await card();assert.equal(asked.dialog,false,'no task list');assert.equal(asked.title,'Crea tu copia para seguir');assert.equal(asked.primary,'Crear mi copia y seguir');assert.equal(asked.focused,'guidePrimary');
 assert.equal(asked.secondary,'Seguir explorando el ejemplo');assert.equal(asked.copyButtons,1,'one copy button');
 await click(page,'#guideDetails');const labels=await page.evaluate(()=>[...document.querySelectorAll('#guideDialog .guide-task')].map(b=>b.querySelector('.task-meta b').textContent));
 assert.equal(labels.some(l=>/Necesita revisión/.test(l)),false,`${labels}`);assert.ok(labels.includes('○ Después de: Prepara tu proyecto'),`${labels}`);assert.equal(labels[0],'◉ Ahora: crea tu copia');await click(page,'#guideDialogClose');
 await click(page,'#guideSecondary');const back=await card();assert.equal(back.goal,'review');assert.equal(back.kind,'example');assert.notEqual(back.title,'Crea tu copia para seguir');
 await search('muebles');await click(page,'#guidePrimary');await page.waitForFunction(()=>FloorPlanGuideUI.state().kind==='own');
 assert.equal((await card()).goal,'furnish','the copy goes on with furnishing');
 assert.deepEqual(errors,[]);
});

// «Probar el ejemplo» does not pile up entries with the same name: an unchanged example is reopened; with a changed
// one, the original opens under a different name and the changed one is kept.
test('trying the example again reuses it or keeps the changed one apart 1440x900',async t=>{
 const {page,errors}=await setup(t,{width:1440,height:900});
 const names=()=>page.evaluate(()=>library.list().map(e=>e.name));const count=n=>n.filter(x=>/^Proyecto de ejemplo/.test(x)).length;
 const again=async()=>{await click(page,'#welcomeBtn');await page.waitForFunction(()=>document.querySelector('#welcomeDialog').open);await click(page,'#welcomeExample');await page.waitForFunction(()=>!document.querySelector('#welcomeDialog').open);await page.waitForTimeout(300);};
 await click(page,'#welcomeExample');await page.waitForTimeout(300);const first=await names();
 await again();assert.equal(count(await names()),count(first),`unchanged example reused ${await names()}`);
 assert.equal(await page.evaluate(()=>FloorPlanGuideUI.state().kind),'example');
 // Change it (delete one piece of furniture), then try the example again.
 const total=await page.evaluate(()=>FloorPlanApp.project.objects.length);
 const pt=await page.evaluate(()=>{const r=document.querySelector(`#gFurn [data-fid="${FloorPlanApp.project.objects[0].id}"]`).getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];});
 await page.mouse.click(pt[0],pt[1]);await page.waitForFunction(()=>ui.sel?.kind==='furn');await page.keyboard.press('Delete');await page.waitForFunction(n=>FloorPlanApp.project.objects.length===n-1,total);
 await again();const after=await names();
 assert.ok(after.includes('Proyecto de ejemplo (original)'),`${after}`);assert.equal(await page.evaluate(()=>FloorPlanApp.project.objects.length),total,'the original opens');
 const changed=await page.evaluate(()=>library.all().filter(e=>e.project&&e.id!==library.activeId()).map(e=>e.project.objects.length));assert.ok(changed.includes(total-1),`the changed example is kept ${JSON.stringify(changed)} total ${total}`);
 assert.deepEqual(errors,[]);
});
