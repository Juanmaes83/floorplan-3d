// Post-publication smoke test on the public Production domain. Every /api/render and /api/share request is
// Usage: node scripts/qa/home-production-smoke.cjs <abs path to js/capability-registry.js> <screenshot dir>
// intercepted and aborted (recorded), so nothing billable or publishing can happen.
const {chromium}=require('playwright');const assert=require('node:assert/strict');
const R=require(process.argv[2]);const URL='https://floorplan-3d-alpha.vercel.app/';const OUT=process.argv[3];
const PROFILES=['architecture','real-estate','developer','renovation','interior','construction'];
const results=[];const ok=(name,extra='')=>{results.push('PASS '+name+(extra?' — '+extra:''));console.log('PASS',name,extra);};
(async()=>{const browser=await chromium.launch();let blocked=[];
 async function open(vp,audience){const narrow=vp.width<1100;const ctx=await browser.newContext({viewport:vp,isMobile:narrow,hasTouch:narrow,deviceScaleFactor:1});
  const page=await ctx.newPage(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  await page.route(/\/api\/(render|share|unshare)/,r=>{blocked.push(r.request().method()+' '+r.request().url());return r.abort();});
  if(audience)await page.addInitScript(a=>localStorage.setItem('rubik-professional-audience-v1',a),audience);
  await page.goto(URL);await page.locator('#welcomeDialog[open]').waitFor();
  const press=async s=>{const l=page.locator(s);await l.scrollIntoViewIfNeeded();if(narrow)await l.tap();else await l.click();};
  return {ctx,page,errors,press};}
 const cards=p=>p.locator('#welcomeCapabilities .capability-card').evaluateAll(n=>n.map(c=>c.dataset.capability));
 const noHScroll=p=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
 for(const vp of [{width:1440,height:900},{width:390,height:844}]){const tag=vp.width+'x'+vp.height;
  const {ctx,page,errors,press}=await open(vp);
  assert.equal(await page.locator('#welcomeDialogTitle').textContent(),'¿Qué quieres hacer?');
  assert.equal(await page.locator('.welcome-entry').count(),3);assert.deepEqual(await cards(page),R.ORDER.general);
  const band=await page.locator('#welcomeRenderAI').textContent();for(const m of [/orientativa/,/código de acceso/,/créditos de IA/])assert.match(band,m);
  assert.ok(await noHScroll(page));ok(tag+' Home sin perfil: cabecera original, 3 entradas, 4 capacidades, banda Render IA, sin scroll horizontal');
  await page.screenshot({path:`${OUT}/prod-${tag}-neutral.png`});
  const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));const titles=new Set();
  for(const p of PROFILES){await press('#welcomeAudience-'+p);const h=await page.locator('#welcomeDialogTitle').textContent();assert.notEqual(h,'¿Qué quieres hacer?');titles.add(h);
   assert.deepEqual(await cards(page),R.ORDER[p],p);assert.equal(await page.locator('#welcomeCapabilities .capability-go').count(),R.ORDER[p].length);
   assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project,p+' project unchanged');assert.ok(await noHScroll(page),p+' h-scroll');
   if(p==='construction'){const t=await page.locator('#welcomeCapabilities, .welcome-intro').allTextContents();const s=t.join(' ');assert.match(s,/No sustituye el seguimiento real de la obra/);assert.doesNotMatch(s,/seguimiento en tiempo real|certificad[ao]|sensor/i);
    await page.locator('#welcomeCapabilities').scrollIntoViewIfNeeded();await page.screenshot({path:`${OUT}/prod-${tag}-construction.png`});}
   await press('#welcomeAudience-'+p);}
  assert.equal(titles.size,6);ok(tag+' seis perfiles: cabecera propia, capacidades del registro, proyecto intacto, sin scroll horizontal');
  assert.deepEqual(errors,[]);await ctx.close();}
 // Persistence of the preference (outside the project).
 {const {ctx,page,errors}=await open({width:1440,height:900},'construction');assert.equal(await page.locator('#welcomeAudience-construction').getAttribute('aria-pressed'),'true');
  assert.deepEqual(await cards(page),R.ORDER.construction);assert.ok(!(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project))).includes('construction'));assert.deepEqual(errors,[]);await ctx.close();ok('preferencia persistida en localStorage y fuera del proyecto');}
 // Accesses from the Home → real areas.
 const vp={width:1440,height:900};
 for(const [aud,cap,area] of [['construction','construction-plan','budget'],['construction','evolution-4d','deliver'],['architecture','analyze','analyze'],['architecture','budget','budget'],['developer','brand','studio'],['interior','render-ai','deliver']]){
  const {ctx,page,errors,press}=await open(vp,aud);await press('#welcomeCap-'+cap);await page.waitForFunction(a=>window.FloorPlanProfessionalUI?.area===a,area);
  assert.equal(await page.locator('#aiRenderDialog[open]').count(),0);assert.deepEqual(errors,[]);await ctx.close();}
 {const {ctx,page,errors,press}=await open(vp);await press('#welcomeRenderAIGo');await page.waitForFunction(()=>window.FloorPlanProfessionalUI?.area==='deliver');assert.deepEqual(errors,[]);await ctx.close();}
 {const {ctx,page,press}=await open(vp,'renovation');const ch=page.waitForEvent('filechooser',{timeout:8000});await press('#welcomeHeroPrimary');await ch;await ctx.close();}
 {const {ctx,page,errors,press}=await open(vp,'real-estate');await press('#welcomeCap-walk3d');await page.waitForFunction(()=>!document.querySelector('#welcomeDialog').open);assert.deepEqual(errors,[]);await ctx.close();}
 ok('accesos reales: Presupuestar, Entregar, Analizar, Mi estudio, selector de archivos y recorrido del ejemplo; el diálogo de Render IA no se abre por detrás');
 // Keyboard.
 {const {ctx,page}=await open(vp);await page.locator('#welcomeAudience-construction').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#welcomeAudience-construction').getAttribute('aria-pressed'),'true');await ctx.close();ok('teclado: selector de profesión con Enter');}
 // Example project → 2D/3D → five work areas → Render IA dialog (opened, never sent).
 {const {ctx,page,errors}=await open(vp);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanProfessionalUI&&window.FloorPlanAIRender&&window.FloorPlanProjectViews);
  const geo=()=>page.evaluate(()=>{const p=FloorPlanApp.project;return JSON.stringify({w:p.walls,r:p.rooms,d:p.doors,win:p.windows});});const g0=await geo();
  await page.locator('#viewSeg [data-view="3d"]').click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d',null,{timeout:60000});await page.waitForTimeout(1500);
  await page.screenshot({path:`${OUT}/prod-1440x900-example-3d.png`});await page.locator('#viewSeg [data-view="2d"]').click();await page.waitForFunction(()=>FloorPlanApp.viewMode!=='3d');ok('proyecto de ejemplo en 2D y 3D');
  for(const a of ['design','analyze','budget','deliver','studio']){await page.locator('#workArea-'+a).click();await page.waitForFunction(x=>FloorPlanProfessionalUI.area===x,a);}
  ok('áreas Diseñar, Analizar, Presupuestar, Entregar y Mi estudio');
  const ws=page.locator('#professionalWorkspace');await page.locator('#workArea-deliver').click();await ws.locator('[data-route="prepare-views"]').first().click();
  await page.waitForFunction(()=>FloorPlanProjectViews.status()!=='busy',null,{timeout:240000});
  await ws.getByRole('button',{name:'Generar imágenes',exact:true}).click();await ws.getByRole('button',{name:'Render IA de: Vista general',exact:true}).click();
  const dlg=page.locator('#aiRenderDialog');await dlg.waitFor();assert.match(await dlg.locator('#aiRenderConsent').innerText(),/Se envía sólo la imagen de esta vista a OpenAI/);
  await page.screenshot({path:`${OUT}/prod-1440x900-render-ia-dialog.png`});await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#aiRenderDialog').open);
  assert.equal(await geo(),g0,'geometry unchanged');assert.deepEqual(errors,[]);await ctx.close();ok('Render IA: el diálogo real se abre desde Entregar → Vistas del proyecto y se cierra sin enviar nada; geometría intacta');}
 assert.deepEqual(blocked,[],'no request to /api/render or /api/share was attempted');ok('ninguna petición a /api/render ni /api/share durante toda la prueba');
 await browser.close();console.log('ALL PASS',results.length);})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
