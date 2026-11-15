// HOM-03 · «Nuevos servicios IA» in the Home. The section comes from the verified registry and separates four states
// (available in Production, pilot in this browser, simulation, in preparation). Every button opens the real place
// where the service lives; Render IA is not duplicated (its card points to the existing band); CAT-04 work is never
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
 await page.locator('#welcomeAIServices .ai-service-go').first().waitFor();
 const press=async s=>{const l=page.locator(s);await l.scrollIntoViewIfNeeded();if(narrow)await l.tap();else await l.click();};
 return {page,errors,api,press,narrow};}
const groups=page=>page.locator('#welcomeAIServices .ai-service-group').evaluateAll(n=>n.map(g=>({state:g.dataset.state,label:g.querySelector('.capability-state').textContent,ids:[...g.querySelectorAll('.ai-service')].map(s=>s.dataset.service),buttons:[...g.querySelectorAll('.ai-service-go')].map(b=>b.id)})));
const PROFILES=['architecture','real-estate','developer','renovation','interior','construction'];
const noScroll=page=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&[...document.querySelectorAll('#welcomeAIServices *')].every(n=>n.getBoundingClientRect().right<=innerWidth+1));

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`four verified states, honest texts, no duplicate Render IA, no CAT-04, no /api ${viewport.width}x${viewport.height}`,{timeout:90000},async t=>{
 const {page,errors,api}=await open(t,viewport);
 const g=await groups(page);
 assert.deepEqual(g.map(x=>x.state),['available','pilot','simulation','preparation']);
 assert.deepEqual(g.map(x=>x.label),['Disponible','Piloto en este navegador','Simulación','En preparación']);
 assert.deepEqual(g.flatMap(x=>x.ids),R.aiServices('general').map(s=>s.id),'straight from the registry');
 assert.deepEqual(g[0].ids,['render-ai'],'only Render IA is presented as available');
 assert.deepEqual(g[3].buttons,[],'nothing in preparation has a button');
 assert.deepEqual(g.slice(0,3).flatMap(x=>x.buttons),['welcomeAI-render-ai','welcomeAI-assistant','welcomeAI-catalogs','welcomeAI-visual-studio','welcomeAI-photo-reform']);
 const text=await page.locator('#welcomeAIServices').textContent();
 assert.doesNotMatch(text,/Presupuestar|consulta tus catálogos|CAT-04/,'CAT-04 work is not announced');
 assert.match(text,/ningún modelo de lenguaje/);assert.match(text,/no llama a ningún proveedor de IA/);assert.match(text,/no las genera una IA/);
 assert.doesNotMatch(text,/garantiza|en tiempo real|exclusiv|certificad/i);
 // Render IA keeps a single paid entry: the existing band. Its card has no «Abrir Entregar» of its own.
 assert.equal(await page.locator('#welcomeAIServices #welcomeRenderAIGo').count(),0);assert.equal(await page.locator('#welcomeRenderAIGo').count(),1);
 assert.equal(await page.locator('#welcomeAI-render-ai').textContent(),'Ver Render IA');
 const order=await page.evaluate(()=>['#welcomeCapabilities','#welcomeRenderAI','#welcomeAIServices','#welcomeWalk','#welcomeSolutions'].map(s=>document.querySelector(s).getBoundingClientRect().top));
 for(let i=1;i<order.length;i++)assert.ok(order[i-1]<order[i],'reading order '+i);
 assert.equal(await noScroll(page),true,'no horizontal scroll');
 for(const b of await page.locator('#welcomeAIServices .ai-service-go').all()){const box=await b.boundingBox();assert.ok(box.height>=44,'44 px target');}
 assert.deepEqual(api,[]);assert.deepEqual(errors,[]);
});

test('every button opens the real service: Render IA band, Assistant, My catalogues, Image studio and FOT-01 (simulations) 1440x900',{timeout:150000},async t=>{
 const vp={width:1440,height:900};
 {const {page,errors,api,press}=await open(t,vp);await press('#welcomeAI-render-ai');
  await page.waitForFunction(()=>document.activeElement?.id==='welcomeRenderAITitle');
  assert.equal(await page.locator('#welcomeDialog[open]').count(),1,'stays in the Home');assert.equal(await page.locator('#aiRenderDialog[open]').count(),0,'never opens the paid dialog');
  assert.deepEqual(api,[]);assert.deepEqual(errors,[]);}
 {const {page,errors,api,press}=await open(t,vp);const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));await press('#welcomeAI-assistant');
  await page.waitForFunction(()=>!document.querySelector('#welcomeDialog').open&&!document.querySelector('#assistantPanel').hidden);
  assert.match(await page.locator('#assistantPanel').textContent(),/modelo de lenguaje/i,'the panel itself says there is no language model');
  assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project);assert.deepEqual(api,[]);assert.deepEqual(errors,[]);}
 for(const [id,area,dialog,must] of [['catalogs','studio','#catalogDialog',/catálogo/i],['visual-studio','deliver','#visualStudioDialog',/SIMULACIÓN|simulación/],['photo-reform','deliver','#photoReformDialog',/simulad|SIMULACIÓN|simulación/i]]){
  const {page,errors,api,press}=await open(t,vp);const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));await press('#welcomeAI-'+id);
  await page.waitForFunction(([a,d])=>!document.querySelector('#welcomeDialog').open&&window.FloorPlanProfessionalUI?.area===a&&document.querySelector(d)?.open,[area,dialog]);
  assert.match(await page.locator(dialog).textContent(),must,id+' shows its real state');
  await page.keyboard.press('Escape');await page.waitForFunction(d=>!document.querySelector(d).open,dialog);
  assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project,id+' does not change the project');
  assert.deepEqual(api,[],id+' calls no API');assert.deepEqual(errors,[],id);}
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`six professions: same four states, relevant services first, project untouched ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors,api,press}=await open(t,viewport);const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 for(const p of PROFILES){await press('#welcomeAudience-'+p);
  const g=await groups(page);assert.deepEqual(g.map(x=>x.state),['available','pilot','simulation','preparation'],p);
  assert.deepEqual(g.flatMap(x=>x.ids),R.aiServices(p).map(s=>s.id),p+' order from the registry');
  assert.equal(await page.locator('#welcomeAIServices .ai-service-go').count(),5,p+' same real accesses');
  assert.equal(await noScroll(page),true,p+' no horizontal scroll');
  await press('#welcomeAudience-'+p);}
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project);assert.deepEqual(api,[]);assert.deepEqual(errors,[]);
});

test('EN and ZH: section, states and buttons translated; keyboard reaches every button with a visible focus 1440x900',{timeout:90000},async t=>{
 for(const [lang,title,states,go] of [['en','New AI services',['Available','Pilot in this browser','Simulation','In preparation'],'Open the Assistant'],['zh','新 AI 服务',['可用','此浏览器中的试点','模拟','准备中'],'打开助手']]){
  const {page,errors,api}=await open(t,{width:1440,height:900},{lang});
  assert.equal(await page.locator('#welcomeAIServicesTitle').textContent(),title);
  assert.deepEqual((await groups(page)).map(x=>x.label),states);assert.equal(await page.locator('#welcomeAI-assistant').textContent(),go);
  assert.doesNotMatch(await page.locator('#welcomeAIServices').textContent(),/Simulación|Disponible|Piloto|preparación/,lang+' no Spanish left');
  assert.deepEqual(api,[]);assert.deepEqual(errors,[]);}
 const {page,errors}=await open(t,{width:1440,height:900});
 await page.locator('#welcomeAudience-construction').focus();
 const seen=new Set();for(let i=0;i<200&&seen.size<5;i++){await page.keyboard.press('Tab');const id=await page.evaluate(()=>document.activeElement?.id||'');
  if(id.startsWith('welcomeAI-')){seen.add(id);const focus=await page.evaluate(()=>{const s=getComputedStyle(document.activeElement);return s.outlineStyle!=='none'||s.boxShadow!=='none';});assert.equal(focus,true,id+' visible focus');}}
 assert.equal(seen.size,5,'all five buttons reachable with Tab');
 await page.locator('#welcomeAI-render-ai').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.activeElement?.id==='welcomeRenderAITitle');
 assert.deepEqual(errors,[]);
});
