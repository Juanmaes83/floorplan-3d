'use strict';
// AST-01 · Tarjeta de plantas: «Añadir una planta» se ofrece a todas las profesiones (guía «¿Qué quieres hacer?» y
// búsqueda de la Home) cuando la capacidad `building` está disponible, y abre «Plantas…» de building-ui (la única
// implementación) con el foco en su primera acción de añadir. Orienta, no genera: crear el edificio sigue siendo una
// pulsación de la persona y el proyecto de una planta no cambia. Sin la capacidad, la tarjeta no se ofrece.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});

async function setup(t,viewport){
 const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);await page.waitForFunction(()=>window.FloorPlanGuideUI&&window.FloorPlanBuildingUI);
 const press=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();mobile?await l.tap():await l.click();await page.waitForTimeout(150);};
 return {page,errors,press,mobile};
}
const titles=page=>page.locator('#editorActionResults [role=option] strong').allTextContents();

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`AST-01 · tarjeta de plantas abre «Plantas…» de building-ui ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const {page,errors,press}=await setup(t,viewport);
 // Home: la búsqueda encuentra la tarjeta con cualquier profesión elegida (también sin elegir ninguna).
 for(const who of ['',...await page.evaluate(()=>[...document.querySelectorAll('.welcome-audience-option')].map(b=>b.id))]){
  if(who)await page.evaluate(id=>document.getElementById(id).click(),who);
  await page.fill('#welcomeActionInput','añadir otra planta al edificio');
  assert.deepEqual(await page.locator('#welcomeActionResults [role=option] strong').allTextContents(),['Añadir una planta'],'profesión '+(who||'ninguna'));
  if(who)await page.evaluate(id=>document.getElementById(id).click(),who);   // vuelve a «sin profesión»
 }
 await page.fill('#welcomeActionInput','');
 await press('#welcomeExample');await page.waitForFunction(()=>!document.querySelector('#welcomeDialog').open);
 const entries0=await page.evaluate(()=>library.list().length),before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 // Editor: «¿Qué quieres hacer?» la ofrece sin escribir nada, junto a las demás tarjetas de inicio.
 await press('#actionSearchBtn');
 const list=await titles(page);assert.ok(list.includes('Añadir una planta'),'tarjeta ofrecida sin buscar: '+list.join(' · '));
 assert.equal(list.indexOf('Añadir una planta'),2,'después de «Subir un plano» y «Crear desde cero»');
 // «añadir planta» es ambigua (planta decorativa del catálogo): se ofrecen las dos opciones, nada se ejecuta.
 await page.fill('#editorActionInput','añadir planta');
 assert.deepEqual(await titles(page),['Añadir una planta','Buscar planta']);assert.match(await page.locator('#editorSearchFeedback').innerText(),/Elige una opción/);
 // Con teclado: «edificio» → Enter abre «Plantas…» con el foco en crear el edificio con una planta vacía.
 await page.fill('#editorActionInput','edificio');await page.locator('#editorActionInput').press('Enter');
 await page.waitForFunction(()=>document.querySelector('#levelsDialog').open);
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'levelCreateEmpty','foco en la primera acción de añadir');
 assert.equal(await page.evaluate(()=>library.list().length),entries0,'abrir la tarjeta no crea nada');
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'ni cambia el proyecto');
 const fit=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,h:document.querySelector('#levelCreateEmpty').getBoundingClientRect().height}));
 assert.equal(fit.scroll,false,'sin desplazamiento horizontal');
 // La persona decide: crear el edificio es la acción de building-ui de siempre; el proyecto de una planta no cambia.
 const original=await page.evaluate(()=>({id:library.activeId(),json:JSON.stringify(FloorPlanApp.project)}));
 await page.locator('#levelCreateEmpty').press('Enter');await page.waitForFunction(n=>library.list().length===n+1,entries0);
 assert.equal(await page.evaluate(()=>library.building()?.levels.length),2,'edificio con dos plantas');
 assert.equal(await page.evaluate(id=>JSON.stringify(library.list().some(e=>e.id===id)),original.id),'true','el proyecto de una planta sigue en la colección');
 await page.evaluate(()=>{const d=document.querySelector('#levelsDialog');if(d.open)d.close();});
 // Ya es un edificio con el máximo de plantas de building-core (2): la tarjeta abre «Plantas…» y lo dice, sin prometer otra.
 await press('#actionSearchBtn');await page.fill('#editorActionInput','nivel');await page.locator('#editorActionInput').press('Enter');
 await page.waitForFunction(()=>document.querySelector('#levelsDialog').open);
 assert.equal(await page.evaluate(()=>!!document.querySelector('#levelAddEmpty')),false,'building-core no admite una tercera planta');
 assert.match(await page.locator('#guideAnnouncement').textContent(),/ya tiene 2 plantas, el máximo actual/);
 assert.equal(await page.evaluate(()=>library.building()?.levels.length),2,'abrir otra vez no añade plantas');
 assert.deepEqual(errors,[]);
});

test('AST-01 · Promotora: la tarjeta del registro «Viviendas de dos plantas» abre «Plantas…»',{timeout:120000},async t=>{
 const {page,errors,press}=await setup(t,{width:1440,height:900});
 await press('#welcomeAudience-developer');
 const go=page.locator('[data-capability="building"] .capability-go');assert.equal(await go.innerText(),'Añadir una planta');
 await press('[data-capability="building"] .capability-go');await page.waitForFunction(()=>document.querySelector('#levelsDialog').open);
 assert.equal(await page.evaluate(()=>document.querySelector('#welcomeDialog').open),false);
 assert.match(await page.evaluate(()=>document.activeElement?.id),/^level(Create|Add)Empty$/);assert.deepEqual(errors,[]);
});

test('AST-01 · sin la capacidad no se anuncia: ni building-ui ni registro «available» → sin tarjeta',{timeout:120000},async t=>{
 const {page,errors,press}=await setup(t,{width:1440,height:900});
 await press('#welcomeExample');await page.waitForFunction(()=>!document.querySelector('#welcomeDialog').open);
 const offered=async()=>{await page.evaluate(()=>{const d=document.querySelector('dialog[open]');if(d)d.close();});await press('#actionSearchBtn');await page.fill('#editorActionInput','edificio');return (await titles(page)).includes('Añadir una planta');};
 assert.equal(await offered(),true);
 await page.evaluate(()=>{const real=FloorPlanCapabilities.byId;window.__byId=real;FloorPlanCapabilities.byId=id=>id==='building'?{...real(id),state:'validation'}:real(id);});
 assert.equal(await offered(),false,'registro sin «available»');
 await page.evaluate(()=>{FloorPlanCapabilities.byId=window.__byId;window.__levels=window.FloorPlanBuildingUI;delete window.FloorPlanBuildingUI;});
 assert.equal(await offered(),false,'building-ui ausente');
 await page.evaluate(()=>{window.FloorPlanBuildingUI=window.__levels;});assert.equal(await offered(),true);
 assert.deepEqual(errors,[]);
});
