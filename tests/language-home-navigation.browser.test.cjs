// CC2 · Localización general (primer corte): Home y navegación global en ES · EN · ZH.
// Bloqueante. Comprueba, con las pantallas abiertas y por el camino real de la persona (teclado y ratón):
//  1. ES → EN → ZH → ES desde el botón de idioma de la Home y desde el de la cabecera;
//  2. que lo que se ve tras el cambio es EXACTAMENTE lo que se ve al recargar en ese idioma (sin restos del anterior)
//     en Home, cabecera, barra de áreas, guía y accesos móviles, con cada área de trabajo abierta;
//  3. foco, Escape y nombres accesibles; 4. política de nombres; 5. que nada del proyecto ni del almacenamiento cambia;
//  6. que los avisos y diálogos generales del núcleo no tienen literales solo en español.
// Sin segundo motor de idioma: usa LANG / setLang del producto y el evento «rubik:languagechange».
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');
 res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

const LANG_KEY='rubik-sota-floorplan-lang',NEXT={es:'en',en:'zh',zh:'es'};
const AREAS={design:{es:'Diseñar',en:'Design',zh:'设计'},analyze:{es:'Analizar',en:'Analyze',zh:'分析'},budget:{es:'Presupuestar',en:'Budget',zh:'预算'},deliver:{es:'Entregar',en:'Deliver',zh:'交付'},studio:{es:'Mi estudio',en:'My studio',zh:'我的事务所'}};
const PRESENT={es:'Presentar mi vivienda',en:'Present my home',zh:'展示我的住宅'};
// Regions that are the product's global surfaces. The CJK check skips #langBtn: its label belongs to the language selector.
const REGIONS=['#welcomeDialog','header','#professionalNav','#mobileDock','#guideBar','#traceStatus','#tip','#legalLink'];

async function open(viewport,lang,{example=false}={}){
 const mobile=viewport.width<800,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});
 await context.addInitScript(([key,l])=>{try{if(!localStorage.getItem(key))localStorage.setItem(key,l);}catch{}},[LANG_KEY,lang]);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanGuideUI&&document.documentElement.classList.contains('lang-ready'),null,{timeout:30000});
 if(example){await page.locator('#welcomeExample').click();await page.waitForFunction(()=>!document.getElementById('welcomeDialog').open);}
 await page.waitForTimeout(300);
 return {page,context,errors};
}
// Visible text, titles and accessible names of the given regions (each line tagged with its region).
const lines=(page,regions=REGIONS)=>page.evaluate(regions=>{const out=[],seen=new Set(),vis=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
 const add=(t,k,r)=>{t=(t||'').replace(/\s+/g,' ').trim();if(t&&!seen.has(r+k+t)){seen.add(r+k+t);out.push(`${r} ${k}: ${t}`);}};
 for(const r of regions)for(const root of document.querySelectorAll(r)){if(!vis(root))continue;
  const walk=n=>{for(const c of n.childNodes){if(c.nodeType===3){const e=c.parentElement;if(e&&vis(e)&&!e.closest('script,style,template,[hidden],#langBtn'))add(c.textContent,'T',r);}else if(c.nodeType===1&&getComputedStyle(c).display!=='none'&&c.tagName!=='TEMPLATE'&&c.id!=='langBtn')walk(c);}};
  walk(root);
  for(const e of [root,...root.querySelectorAll('[title],[aria-label],[placeholder]')])if(vis(e)&&e.id!=='langBtn')for(const a of ['title','aria-label','placeholder'])if(e.getAttribute(a))add(e.getAttribute(a),a,r);}
 return out.sort();},regions);
const state=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),keys:Object.keys(localStorage).filter(k=>k!=='rubik-sota-floorplan-lang').sort()}));
const langNow=page=>page.evaluate(()=>LANG);
const diff=(a,b)=>({onlyLive:a.filter(x=>!b.includes(x)),onlyFresh:b.filter(x=>!a.includes(x))});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`Home: ES→EN→ZH→ES with the Home open, by keyboard, equals a fresh load in each language (${viewport.width}x${viewport.height})`,{timeout:240000},async t=>{
 const live=await open(viewport,'es');t.after(()=>live.context.close());const {page}=live;
 assert.equal(await page.locator('#welcomeDialog').evaluate(d=>d.open),true);
 const before=await state(page);
 for(const expected of ['en','zh','es']){
  await page.locator('#welcomeLanguage').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(l=>LANG===l&&document.documentElement.lang===(l==='zh'?'zh-CN':l),expected);
  // The button is rebuilt with the Home: keyboard focus must stay on it so the next Enter keeps cycling.
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'welcomeLanguage',`focus stays on the language button (${expected})`);
  assert.equal(await page.locator('#welcomeDialog').evaluate(d=>d.open),true,'the Home stays open');
  // The Home keeps its five project phases, in the new language, after the rebuild (contract for the STUDIO Home).
  assert.equal(await page.locator('.solutions-phases > *').count(),5,`five phases (${expected})`);
  const fresh=await open(viewport,expected);
  try{
   const d=diff(await lines(page),await lines(fresh.page));
   assert.deepEqual(d,{onlyLive:[],onlyFresh:[]},`Home and navigation after switching to ${expected} must equal a fresh load`);
   assert.deepEqual(await fresh.page.locator('.solutions-phases > *').allTextContents(),await page.locator('.solutions-phases > *').allTextContents(),`phases (${expected})`);
   assert.deepEqual(fresh.errors,[]);
  }finally{await fresh.context.close();}
  // Rule of the owner: no Chinese text in a Spanish or English session.
  if(expected!=='zh')assert.deepEqual((await lines(page)).filter(l=>/[㐀-鿿]/.test(l)),[],`no Chinese text in ${expected}`);
 }
 assert.equal(await langNow(page),'es');
 // Escape closes nothing it should not break: the Home dialog closes and the project is untouched.
 assert.deepEqual(await state(page),before,'switching language changes neither the project nor the storage');
 assert.deepEqual(live.errors,[]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`Editor: every work area stays open and equals a fresh load after ES→EN→ZH→ES (${viewport.width}x${viewport.height})`,{timeout:420000},async t=>{
 const live=await open(viewport,'es',{example:true});t.after(()=>live.context.close());const {page}=live;
 const before=await state(page);
 // «Diseñar» and «Presentar mi vivienda» never appear unlocalized.
 for(const area of [null,...Object.keys(AREAS)]){
  if(area)await page.locator('#workArea-'+area).click();
  for(const lang of ['en','zh','es']){
   await page.locator('#langBtn').focus();await page.keyboard.press('Enter');
   await page.waitForFunction(l=>LANG===l,lang);
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'langBtn','focus stays on the header language button');
   for(const [key,names] of Object.entries(AREAS)){
    assert.equal((await page.locator('#workArea-'+key).textContent()).trim(),names[lang],`${key} in ${lang}`);
    assert.equal(await page.locator('#workArea-'+key).getAttribute('aria-label'),names[lang],`${key} accessible name in ${lang}`);}
   assert.match(await page.locator('#presentationBtn').textContent(),new RegExp(PRESENT[lang]),`«${PRESENT[lang]}» in ${lang}`);
   // «Diseñar» is the editor itself (the workspace panel is hidden); the other areas open their panel.
   assert.equal(await page.locator('#professionalWorkspace').isVisible(),!!area&&area!=='design','the open area stays open');
   assert.equal(await page.locator('#workArea-'+(area||'design')).getAttribute('aria-current'),'page','the current area stays marked');
   const regions=[...REGIONS,'#professionalTitle'],fresh=await open(viewport,lang,{example:true});
   try{
    if(area)await fresh.page.locator('#workArea-'+area).click();
    assert.deepEqual(diff(await lines(page,regions),await lines(fresh.page,regions)),{onlyLive:[],onlyFresh:[]},`${area||'editor'} in ${lang} equals a fresh load`);
    assert.deepEqual(fresh.errors,[]);
   }finally{await fresh.context.close();}
   if(lang!=='zh')assert.deepEqual((await lines(page,regions)).filter(l=>/[㐀-鿿]/.test(l)),[],`no Chinese text in ${lang}`);
  }
 }
 assert.deepEqual(await state(page),before,'the project and the storage are untouched');
 assert.deepEqual(live.errors,[]);
});

test('Home → editor → Home keeps working in every language: Escape returns focus and the language survives a reload',{timeout:240000},async t=>{
 const {page,context,errors}=await open({width:1440,height:900},'es',{example:true});t.after(()=>context.close());
 for(const lang of ['en','zh','es']){
  await page.locator('#langBtn').click();await page.waitForFunction(l=>LANG===l,lang);
  await page.locator('#welcomeBtn').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.getElementById('welcomeDialog').open);
  assert.equal(await page.locator('.solutions-phases > *').count(),5,`the reopened Home keeps its five phases in ${lang}`);
  assert.equal(await page.evaluate(()=>document.documentElement.lang),lang==='zh'?'zh-CN':lang);
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.getElementById('welcomeDialog').open);
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'welcomeBtn','Escape closes the Home and returns focus to where it was opened');
  // The projects dialog is localized, Escape closes it and returns focus.
  await page.locator('#projectsBtn').click();await page.waitForFunction(()=>document.getElementById('projectsDialog').open);
  const title=await page.locator('#projectsTitle').textContent();
  assert.equal(title,{es:'Proyectos locales',en:'Local projects',zh:'本地项目'}[lang]);
  assert.deepEqual((await page.locator('#projectsDialog').innerText()).match(/[áéíóúñ]/g)&&lang==='en'?['es-chars']:[],[],'no Spanish in the English projects dialog');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.getElementById('projectsDialog').open);
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'projectsBtn','Escape closes the projects dialog and returns focus');
 }
 await page.locator('#langBtn').click();await page.waitForFunction(()=>LANG==='en');
 await page.reload();await page.waitForFunction(()=>window.FloorPlanGuideUI&&document.documentElement.classList.contains('lang-ready'));
 assert.equal(await langNow(page),'en','the chosen language survives a reload (the existing storage key, nothing new)');
 assert.deepEqual(errors,[]);
});

test('Names policy: the project and its names are shown as stored and never rewritten when the language changes',{timeout:120000},async t=>{
 const {page,context,errors}=await open({width:1440,height:900},'es',{example:true});t.after(()=>context.close());
 const ids=await page.evaluate(()=>({name:FloorPlanApp.project.name,rooms:FloorPlanApp.project.rooms.map(r=>r.name),objects:FloorPlanApp.project.objects.map(o=>o.name)}));
 assert.ok(ids.name&&ids.rooms.length&&ids.objects.length,'the example has its stored names');
 for(const lang of ['en','zh','es']){
  await page.locator('#langBtn').click();await page.waitForFunction(l=>LANG===l,lang);
  const shown=await page.locator('.guide-project').textContent();
  assert.equal(shown,{es:'Proyecto de ejemplo',en:'Example project',zh:'示例项目'}[lang],'the example is localized with the known dictionary');
  assert.deepEqual(await page.evaluate(()=>({name:FloorPlanApp.project.name,rooms:FloorPlanApp.project.rooms.map(r=>r.name),objects:FloorPlanApp.project.objects.map(o=>o.name)})),ids,'stored names untouched');
 }
 assert.deepEqual(errors,[]);
});

test('General notices and dialogs of the core have no Spanish-only literal (static guard)',async()=>{
 // A toast, confirm or announcement in index.html (the core) must pass through the language helpers.
 const html=await fs.readFile(path.join(root,'index.html'),'utf8'),bad=[];
 for(const m of html.matchAll(/\b(toast|confirm)\(/g)){let i=m.index+m[0].length,d=1,j=i;while(j<html.length&&d>0&&j-i<700){const c=html[j];if(c==='(')d++;else if(c===')')d--;j++;}
  const arg=html.slice(i,j-1);if(/^\s*['"`]/.test(arg)&&/[áéíóúñ¿¡«]|\b(No|Se|El|La|Añad|Introduce|Colección)\b/.test(arg)&&!/\b(L3|tr|tx)\(/.test(arg))bad.push(html.slice(0,m.index).split('\n').length+': '+arg.slice(0,90));}
 assert.deepEqual(bad,[],'every toast/confirm of the core is localized');
});
