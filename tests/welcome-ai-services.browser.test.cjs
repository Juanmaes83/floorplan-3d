// HOM-03 · «Nuevos servicios IA» in the Home. The section comes from the verified registry and separates four states
// (available in Production, pilot in this browser, simulation, in preparation). Every button opens the real place
// where the service lives; Render IA is not duplicated (its card points to the existing band); CAT-04 in master is
// shown; nothing calls /api; the project never changes; no horizontal scroll in the 3 sizes; ES/EN/ZH; keyboard.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {createServer}=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),{chromium}=require('playwright');
const R=require('../js/capability-registry.js');
const root=path.resolve(__dirname,'..');let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!f.startsWith(root+path.sep))throw Error('path');
 res.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':f.endsWith('.webp')?'image/webp':f.endsWith('.svg')?'image/svg+xml':'text/html');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(t,viewport,{audience=null,lang=null}={}){const narrow=viewport.width<=1100,ctx=await browser.newContext({viewport,isMobile:narrow,hasTouch:narrow});t.after(()=>ctx.close());
 const page=await ctx.newPage(),errors=[],api=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.route('**/api/**',r=>{api.push(r.request().url());return r.abort();});
 if(audience)await page.addInitScript(a=>localStorage.setItem('rubik-professional-audience-v1',a),audience);
 await page.goto(url,{waitUntil:'load'});await page.locator('#welcomeDialog[open]').waitFor();
 if(lang){for(let i=0;i<3&&await page.evaluate(()=>LANG)!==lang;i++)await page.locator('#welcomeLanguage').click();}
 await page.locator('#welcomeModules .ai-service-go').first().waitFor();
 const press=async s=>{const l=page.locator(s);await l.scrollIntoViewIfNeeded();if(narrow)await l.tap();else await l.click();};
 return {page,errors,api,press,narrow};}
// UX-312 #321 (correcciones 4 y 6): los nueve servicios viven en «Módulos para tu trabajo» (#welcomeModules), dentro de
// «¿En qué trabajas?»; el bloque «Nuevos servicios IA» desaparece. Se agrupan por estado a partir de las fichas.
const groups=page=>page.locator('#welcomeModules .ai-service').evaluateAll(n=>{const out=[];for(const s of n){let g=out.find(x=>x.state===s.dataset.state);if(!g){g={state:s.dataset.state,label:s.querySelector('.capability-state').textContent,ids:[],buttons:[]};out.push(g);}g.ids.push(s.dataset.service);const b=s.querySelector('.ai-service-go');if(b)g.buttons.push(b.id);}return out;});
const featured=page=>page.locator('#welcomeModules .ai-service.is-featured').evaluateAll(n=>n.map(s=>s.dataset.service));
const MPRIO={architecture:['assistant','catalog-budget','catalogs','render-ai'],'real-estate':['render-ai','photo-reform','visual-studio'],developer:['render-ai','catalogs','assistant'],renovation:['photo-reform','catalog-budget','render-ai','assistant'],interior:['catalogs','visual-studio','render-ai','assistant-catalogs'],construction:['catalog-budget','assistant']};
const PROFILES=['architecture','real-estate','developer','renovation','interior','construction'];
const noScroll=page=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&[...document.querySelectorAll('#welcomeModules *')].every(n=>n.getBoundingClientRect().right<=innerWidth+1));

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`four verified states, honest texts, CAT-04 pilot, no duplicate Render IA, no /api ${viewport.width}x${viewport.height}`,{timeout:90000},async t=>{
 const {page,errors,api}=await open(t,viewport);
 const g=await groups(page);
 assert.deepEqual(g.map(x=>x.state),['available','pilot','simulation','preparation']);
 assert.deepEqual(g.map(x=>x.label),['Disponible','Piloto en este navegador','Simulación','En preparación']);
 assert.deepEqual(g.flatMap(x=>x.ids),R.aiServices('general').map(s=>s.id),'straight from the registry');
 assert.deepEqual(g[0].ids,['render-ai'],'only Render IA is presented as available');
 assert.deepEqual(g[3].buttons,[],'nothing in preparation has a button');
 assert.deepEqual(g.slice(0,3).flatMap(x=>x.buttons),['welcomeAI-render-ai','welcomeAI-assistant','welcomeAI-catalogs','welcomeAI-catalog-budget','welcomeAI-assistant-catalogs','welcomeAI-visual-studio','welcomeAI-photo-reform']);
 const text=await page.locator('#welcomeModules').textContent();
 assert.match(text,/Presupuestar/,'CAT-04 in master is announced as a pilot');
 assert.doesNotMatch(text,/Pendiente de CAT-04/,'obsolete gate is removed');
 assert.match(text,/ningún modelo de lenguaje/);assert.match(text,/no llama a ningún proveedor de IA/);assert.match(text,/no las genera una IA/);
 assert.doesNotMatch(text,/garantiza|en tiempo real|exclusiv|certificad/i);
 // H-C2 (UX-312 Home): Render IA conserva una sola entrada de pago, su servicio, que abre Entregar → Vistas del proyecto.
 assert.equal(await page.locator('#welcomeRenderAI, #welcomeRenderAIGo').count(),0);
 assert.equal(await page.locator('#welcomeAI-render-ai').textContent(),'Abrir Entregar · Vistas del proyecto');
 assert.equal(await page.locator('#welcomeAIServices').count(),0,'no separate AI services block');assert.equal(await page.getByText('Nuevos servicios IA').count(),0);
 const order=await page.evaluate(()=>['#welcomeSolutions','#welcomeModules','#welcomeCapabilities','#welcomeWalk'].map(s=>document.querySelector(s).getBoundingClientRect().top));
 for(let i=1;i<order.length;i++)assert.ok(order[i-1]<order[i],'reading order '+i);
 assert.equal(await noScroll(page),true,'no horizontal scroll');
 for(const b of await page.locator('#welcomeModules .ai-service-go').all()){const box=await b.boundingBox();assert.ok(box.height>=44,'44 px target');}
 assert.deepEqual(api,[]);assert.deepEqual(errors,[]);
});

test('every button opens the real service: Render IA band, Assistant, CAT-04, Image studio and FOT-01 (simulations) 1440x900',{timeout:150000},async t=>{
 const vp={width:1440,height:900};
 {const {page,errors,api,press}=await open(t,vp);await press('#welcomeAI-render-ai');
  await page.waitForFunction(()=>!document.querySelector('#welcomeDialog').open&&window.FloorPlanProfessionalUI?.area==='deliver');
  assert.equal(await page.locator('#aiRenderDialog[open]').count(),0,'never opens the paid dialog');
  assert.deepEqual(api,[]);assert.deepEqual(errors,[]);}
 {const {page,errors,api,press}=await open(t,vp);const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));await press('#welcomeAI-assistant');
  await page.waitForFunction(()=>!document.querySelector('#welcomeDialog').open&&!document.querySelector('#assistantPanel').hidden);
  assert.match(await page.locator('#assistantPanel').textContent(),/modelo de lenguaje/i,'the panel itself says there is no language model');
  assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project);assert.deepEqual(api,[]);assert.deepEqual(errors,[]);}
 {const {page,errors,api,press}=await open(t,vp);const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));await press('#welcomeAI-catalog-budget');
  await page.waitForFunction(()=>!document.querySelector('#welcomeDialog').open&&window.FloorPlanProfessionalUI?.area==='budget'&&document.querySelector('#budgetDialog')?.open);
  assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project);assert.deepEqual(api,[]);assert.deepEqual(errors,[]);}
 {const {page,errors,api,press}=await open(t,vp);await press('#welcomeAI-assistant-catalogs');
  await page.waitForFunction(()=>!document.querySelector('#welcomeDialog').open&&!document.querySelector('#assistantPanel').hidden);
  assert.deepEqual(api,[]);assert.deepEqual(errors,[]);}
 for(const [id,area,dialog,must] of [['catalogs','studio','#catalogDialog',/catálogo/i],['visual-studio','deliver','#visualStudioDialog',/SIMULACIÓN|simulación/],['photo-reform','deliver','#photoReformDialog',/simulad|SIMULACIÓN|simulación/i]]){
  const {page,errors,api,press}=await open(t,vp);const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));await press('#welcomeAI-'+id);
  await page.waitForFunction(([a,d])=>!document.querySelector('#welcomeDialog').open&&window.FloorPlanProfessionalUI?.area===a&&document.querySelector(d)?.open,[area,dialog]);
  assert.match(await page.locator(dialog).textContent(),must,id+' shows its real state');
  await page.keyboard.press('Escape');await page.waitForFunction(d=>!document.querySelector(d).open,dialog);
  assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project,id+' does not change the project');
  assert.deepEqual(api,[],id+' calls no API');assert.deepEqual(errors,[],id);}
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`six professions: their modules first, all nine with their state, project untouched ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors,api,press}=await open(t,viewport);const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 for(const p of PROFILES){await press('#welcomeAudience-'+p);
  // La profesión pone primero sus módulos (marcados «Para …») y conserva los nueve con su estado.
  assert.deepEqual(await featured(page),MPRIO[p],p+' featured modules first');
  const ids=await page.locator('#welcomeModules .ai-service').evaluateAll(n=>n.map(s=>s.dataset.service));assert.deepEqual(ids.slice(0,MPRIO[p].length),MPRIO[p]);assert.deepEqual([...ids].sort(),R.aiServices(p).map(s=>s.id).sort(),p+' all nine kept');
  assert.equal(await page.locator('#welcomeModules .ai-service-for').count(),MPRIO[p].length);
  assert.equal(await page.locator('#welcomeModules .ai-service-go').count(),7,p+' same real accesses');
  assert.equal(await noScroll(page),true,p+' no horizontal scroll');
  await press('#welcomeAudience-'+p);}
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project);assert.deepEqual(api,[]);assert.deepEqual(errors,[]);
});

test('EN and ZH: section, states and buttons translated; keyboard reaches every button with a visible focus 1440x900',{timeout:90000},async t=>{
 for(const [lang,title,states,go] of [['en','Modules for your work',['Available','Pilot in this browser','Simulation','In preparation'],'Open the Assistant'],['zh','适合你工作的模块',['可用','此浏览器中的试点','模拟','准备中'],'打开助手']]){
  const {page,errors,api}=await open(t,{width:1440,height:900},{lang});
  assert.equal(await page.locator('#welcomeModulesTitle').textContent(),title);
  assert.deepEqual((await groups(page)).map(x=>x.label),states);assert.equal(await page.locator('#welcomeAI-assistant').textContent(),go);
  assert.doesNotMatch(await page.locator('#welcomeModules').textContent(),/Simulación|Disponible|Piloto|preparación/,lang+' no Spanish left');
  assert.deepEqual(api,[]);assert.deepEqual(errors,[]);}
 const {page,errors}=await open(t,{width:1440,height:900});
 await page.locator('#welcomeAudience-construction').focus();
 const seen=new Set();for(let i=0;i<220&&seen.size<7;i++){await page.keyboard.press('Tab');const id=await page.evaluate(()=>document.activeElement?.id||'');
  if(id.startsWith('welcomeAI-')){seen.add(id);const focus=await page.evaluate(()=>{const s=getComputedStyle(document.activeElement);return s.outlineStyle!=='none'||s.boxShadow!=='none';});assert.equal(focus,true,id+' visible focus');}}
 assert.equal(seen.size,7,'all seven buttons reachable with Tab');
 await page.locator('#welcomeAI-render-ai').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>window.FloorPlanProfessionalUI?.area==='deliver');
 assert.deepEqual(errors,[]);
});
