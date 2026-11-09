// HOM-01 · Home por profesión. The hero, «Lo que puedes hacer hoy» and the Render IA band adapt to the chosen field,
// only show capabilities from the verified registry, and every access opens an existing place (the upload entry, the
// example walk or a professional work area). The project never changes. No AI provider is called: Render IA is only
// reached through Deliver, where the real dialog and its access code live.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {createServer}=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),{chromium}=require('playwright');
const R=require('../js/capability-registry.js');
const root=path.resolve(__dirname,'..');let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!f.startsWith(root+path.sep))throw Error('path');
 res.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':f.endsWith('.webp')?'image/webp':'text/html');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(t,viewport,audience=null){const narrow=viewport.width<=1100,ctx=await browser.newContext({viewport,isMobile:narrow,hasTouch:narrow});t.after(()=>ctx.close());
 const page=await ctx.newPage(),errors=[],provider=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.route('**/api/render',r=>{provider.push(r.request().url());return r.abort();});
 if(audience)await page.addInitScript(a=>localStorage.setItem('rubik-professional-audience-v1',a),audience);
 await page.goto(url);await page.locator('#welcomeDialog[open]').waitFor();
 const press=async s=>{const l=page.locator(s);await l.scrollIntoViewIfNeeded();if(narrow)await l.tap();else await l.click();};
 return {page,errors,provider,press,narrow};}
const cards=page=>page.locator('#welcomeCapabilities .capability-card').evaluateAll(n=>n.map(c=>c.dataset.capability));
const PROFILES=['architecture','real-estate','developer','renovation','interior'];

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`neutral Home: hero, capabilities and Render IA band, honest and without horizontal scroll ${viewport.width}x${viewport.height}`,{timeout:90000},async t=>{
 const {page,errors,provider}=await open(t,viewport);
 assert.equal(await page.locator('#welcomeDialogTitle').textContent(),'¿Qué quieres hacer?','neutral hero unchanged');
 assert.deepEqual(await cards(page),R.ORDER.general);
 assert.deepEqual(await page.locator('#welcomeCapabilities .capability-state').allTextContents(),Array(4).fill('Disponible'));
 const band=await page.locator('#welcomeRenderAI').textContent();
 for(const must of [/orientativa/,/código de acceso/,/créditos de IA/,/Entregar → Vistas del proyecto/])assert.match(band,must);
 assert.match(await page.locator('#welcomeRenderAI figcaption').textContent(),/Vista 3D real de Rubik/,'the visual is a real Rubik capture, labelled as such');
 const order=await page.evaluate(()=>['.welcome-entries','.welcome-audience','#welcomeCapabilities','#welcomeRenderAI','#welcomeWalk','#welcomeSolutions'].map(s=>document.querySelector(s).getBoundingClientRect().top));
 for(let i=1;i<order.length;i++)assert.ok(order[i-1]<order[i],'reading order '+i);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 assert.deepEqual(provider,[]);assert.deepEqual(errors,[]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`each profession adapts hero and capabilities without touching the project ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors,provider,press}=await open(t,viewport);
 const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));const titles=new Set();
 for(const p of PROFILES){await press('#welcomeAudience-'+p);
  const h=await page.locator('#welcomeDialogTitle').textContent();assert.notEqual(h,'¿Qué quieres hacer?',p+' hero adapts');titles.add(h);
  assert.notEqual(await page.locator('.welcome-eyebrow').first().textContent(),'Para inmobiliarias, promotoras y estudios',p+' eyebrow adapts');
  assert.deepEqual(await cards(page),R.ORDER[p],p+' capabilities from the registry');
  const n=await page.locator('#welcomeCapabilities .capability-card').count();assert.ok(n>=3&&n<=4);
  assert.equal(await page.locator('#welcomeCapabilities .capability-go').count(),n,'each available capability has an access');
  assert.match(await page.locator('#welcomeCapabilitiesTitle').textContent(),/Lo que puedes hacer hoy · /);
  assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project,p+' does not change the project');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,p+' no horizontal scroll');
  await press('#welcomeAudience-'+p);assert.equal(await page.locator('#welcomeDialogTitle').textContent(),'¿Qué quieres hacer?',p+' deselect returns to neutral');}
 assert.equal(titles.size,PROFILES.length,'one hero per profession');
 const text=(await page.locator('#welcomeCapabilities, #welcomeRenderAI, .welcome-intro').allTextContents()).join(' ');
 assert.doesNotMatch(text,/certificad[ao]s? (oficial|automátic)|garantiza|en tiempo real|exclusiv/i,'no false promises');
 assert.deepEqual(provider,[]);assert.deepEqual(errors,[]);
});

test('every access opens an existing place: upload, walk, work areas and Render IA in Deliver 1440x900',{timeout:120000},async t=>{
 const vp={width:1440,height:900};
 // Render IA card → Deliver work area (never the AI dialog directly, never a provider call).
 {const {page,errors,provider,press}=await open(t,vp,'interior');await press('#welcomeCap-render-ai');
  await page.waitForFunction(()=>!document.querySelector('#welcomeDialog').open&&window.FloorPlanProfessionalUI?.area==='deliver');
  assert.equal(await page.locator('#aiRenderDialog[open]').count(),0,'the AI dialog is not opened behind the user');assert.deepEqual(provider,[]);assert.deepEqual(errors,[]);}
 // Render IA band → Deliver.
 {const {page,errors,press}=await open(t,vp);await press('#welcomeRenderAIGo');await page.waitForFunction(()=>window.FloorPlanProfessionalUI?.area==='deliver');assert.deepEqual(errors,[]);}
 // Budget and Analyze cards → their areas.
 for(const [aud,cap,area] of [['architecture','budget','budget'],['architecture','analyze','analyze'],['developer','brand','studio']]){
  const {page,errors,press}=await open(t,vp,aud);await press('#welcomeCap-'+cap);await page.waitForFunction(a=>window.FloorPlanProfessionalUI?.area===a,area);assert.deepEqual(errors,[]);}
 // Import → the file picker of «Subir un plano»; the hero's first action too.
 {const {page,press}=await open(t,vp,'architecture');const chooser=page.waitForEvent('filechooser',{timeout:8000});await press('#welcomeCap-import');await chooser;}
 {const {page,press}=await open(t,vp,'renovation');assert.equal(await page.locator('#welcomeHeroPrimary').getAttribute('data-first'),'upload');const chooser=page.waitForEvent('filechooser',{timeout:8000});await press('#welcomeHeroPrimary');await chooser;}
 // Walk → the welcome closes into the existing example walk.
 {const {page,errors,press}=await open(t,vp,'real-estate');assert.equal(await page.locator('#welcomeHeroPrimary').getAttribute('data-first'),'walk');await press('#welcomeCap-walk3d');await page.waitForFunction(()=>!document.querySelector('#welcomeDialog').open);assert.deepEqual(errors,[]);}
 // Secondary hero action scrolls to the capabilities and focuses their title.
 {const {page,press}=await open(t,vp);await press('#welcomeHeroSecondary');await page.waitForFunction(()=>document.activeElement?.id==='welcomeCapabilitiesTitle');}
});

test('keyboard: the profession selector and the capability accesses are reachable and focus is visible 1440x900',{timeout:60000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});
 await page.locator('#welcomeAudience-interior').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('#welcomeAudience-interior').getAttribute('aria-pressed'),'true');
 const go=page.locator('#welcomeCap-render-ai');await go.focus();
 assert.equal(await go.evaluate(b=>getComputedStyle(b).outlineStyle!=='none'||getComputedStyle(b).boxShadow!=='none'),true,'visible focus');
 assert.deepEqual(errors,[]);
});
