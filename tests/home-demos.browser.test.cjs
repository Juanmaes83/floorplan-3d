// HOM-04 · «Descubre RUBIK en acción»: two large visual cards right after the ways to start, and the
// direct start of «Dibujo vivo» (?demo=dibujo-vivo) with the example home and the existing presentation (Hybrid V2).
// The demo opens with a short intro, plays, ends with «Volver a ver» / «Cómo hacerlo con mi proyecto» / «Volver al
// inicio», changes none of the visitor's projects, publishes nothing and calls no AI provider. labs/ answers 404.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.HOME_DEMOS_SHOTS||null,LIB='rubik-sota-project-library-v1';
const TYPES={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.hdr':'application/octet-stream','.wasm':'application/wasm'};
let server,browser,url;
before(async()=>{
 server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://local').pathname);
  if(p.startsWith('/labs/')){res.statusCode=404;return res.end('not published');}
  let file=path.resolve(root,'.'+p);if(!file.startsWith(root))throw Error('path');if(p.endsWith('/'))file=path.join(file,'index.html');
  res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
const shot=async(page,name)=>{if(SHOTS){await fs.mkdir(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,name+'.png')});}};
async function open(viewport){
 const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 page.on('request',r=>{const u=r.url();if(!u.startsWith(url)&&!/^(data|blob):/.test(u))external.push(u);});page.setDefaultTimeout(120000);
 return {context,page,errors,external};
}
const projects=page=>page.evaluate(k=>{const l=JSON.parse(localStorage.getItem(k)||'null');return l?{active:l.activeId,entries:Object.fromEntries(l.entries.map(e=>[e.id,JSON.stringify(e.project||e.building)]))}:null;},LIB);

test('Home: «Descubre RUBIK en acción» right after the ways to start, two visual cards with real captures and clear actions',{timeout:120000},async t=>{
 const {context,page,errors}=await open({width:1440,height:900});t.after(()=>context.close());
 await page.goto(url);await page.locator('#welcomeInAction').waitFor();await page.locator('#welcomeInAction').scrollIntoViewIfNeeded();
 const h=await page.evaluate(()=>{const s=document.getElementById('welcomeInAction'),entries=document.getElementById('welcomeExample'),aud=document.querySelector('.welcome-audience'),ai=document.getElementById('welcomeModules');
  const after=(a,b)=>!!(a&&b)&&!!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);
  return {afterEntries:after(entries,s),beforeAudience:after(s,aud),beforeAI:after(s,ai),title:s.querySelector('h2').textContent,
   cards:[...s.querySelectorAll('.demo-card:not(.demo-card-lab)')].map(c=>({id:c.dataset.demo,title:c.querySelector('h3').textContent,img:c.querySelector('img').naturalWidth,go:c.querySelector('.demo-card-go').textContent}))};});
 assert.equal(h.title,'Descubre RUBIK en acción');assert.equal(h.afterEntries,true);assert.equal(h.beforeAudience,true);assert.equal(h.beforeAI,true,'before the modules of «¿En qué trabajas?»');
 // UX-312 PERLA · Home aprobada: diez tarjetas en este orden, cada una con su portada real (carga diferida: se recorre
 // la sección para que el navegador las pida) y su acción. Blueprint 3D y Despiece 3D ya están integrados (bpdp-routes).
 for(const c of await page.locator('#welcomeInAction .demo-card').all()){await c.scrollIntoViewIfNeeded();}
 await page.waitForFunction(()=>[...document.querySelectorAll('#welcomeInAction img')].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:60000});
 const cards=await page.evaluate(()=>[...document.querySelectorAll('#welcomeInAction .demo-card')].map(c=>({id:c.dataset.demo,title:c.querySelector('h3').textContent,img:c.querySelector('img')?.naturalWidth||0,go:c.querySelector('.demo-card-go')?.textContent})));
 assert.deepEqual(cards.map(c=>c.id),['evolucion-obra','dibujo-vivo','blueprint-3d','despiece-3d','recorrido','video','comparativa','asistente','estilos','entrega']);
 assert.deepEqual(cards.slice(0,2).map(c=>[c.id,c.title,c.go]),[['evolucion-obra','Descubre cómo evoluciona una obra','Ver demo de evolución 4D'],['dibujo-vivo','Del dibujo a la realidad','Ver demo de dibujo vivo']]);
 assert.ok(cards.slice(0,2).every(c=>c.img>=900),'the two original cards keep their 16:9 capture');
 assert.ok(cards.every(c=>c.img>0&&c.go),'every card has its real cover and its action');
 await shot(page,'01-home-in-action-1440');assert.deepEqual(errors,[]);
});

test('Dibujo vivo demo from the Home: intro → play → end card → how to → back to start; the visitor\'s projects untouched',{timeout:600000},async t=>{
 const {context,page,errors,external}=await open({width:1440,height:900});t.after(()=>context.close());
 // A visitor who already has a project of their own, open in RUBIK.
 await page.goto(url);await page.locator('#welcomeBlank').waitFor();
 await page.evaluate(()=>{switchProject(library.create('Mi proyecto del visitante'));});
 const mine=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).activeId,LIB),before=await projects(page);
 assert.ok(Object.keys(before.entries).length>=1);
 await page.locator('#welcomeInAction').scrollIntoViewIfNeeded();await page.locator('#welcomeDemo-dibujo-vivo').click();
 await page.waitForURL(/\?demo=dibujo-vivo$/);const start=page.locator('#homeDemoStart');await start.waitFor();
 assert.match(await page.locator('#homeDemoCard').innerText(),/Del dibujo a la realidad[\s\S]*grafito/);assert.equal(await page.locator('#homeDemoBar').isVisible(),true);
 await shot(page,'02-dibujo-intro');
 await page.locator('#homeDemoHelp').click();assert.match(await page.locator('#homeDemoCard').innerText(),/Reproducir o pausar/);await page.locator('#homeDemoCard .btn.primary').click();
 await page.locator('#homeDemoStart').click();
 await page.waitForFunction(()=>window.FloorPlanPresentation.story?.kind==='living-drawing'&&View3D.presentationStoryInfo?.living);
 assert.equal(await page.evaluate(()=>View3D.presentationLivingDrawingInfo.active),true,'the existing Hybrid V2 engine draws');
 await page.waitForTimeout(4000);await shot(page,'03-dibujo-playing');
 // Hold the final camera handoff so replay is requested while the internal control is disabled.
 await page.evaluate(()=>{
  const go=View3D.presentationGo;
  View3D.presentationGo=async function(...args){
   View3D.presentationGo=go;
   const settled=go.apply(this,args);
   await new Promise(resolve=>{window.releaseHomeDemoCamera=resolve;});
   return settled;
  };
 });
 await page.waitForFunction(()=>window.RubikHomeDemos.state.ended,null,{timeout:300000});
 for(const id of ['#homeDemoReplay','#homeDemoHowTo','#homeDemoExplore'])assert.equal(await page.locator(id).isVisible(),true,id);await shot(page,'04-dibujo-end');
 await page.locator('#homeDemoHowTo').click();assert.match(await page.locator('#homeDemoCard').innerText(),/Dibujo vivo[\s\S]*Iniciar|inicia la presentación/);
 await page.locator('#homeDemoCard .btn',{hasText:/^Volver$/}).click();
 // «Volver a ver» replays the same scene.
 // HERO FINAL (corte C): the ending is held on its last frame; «Volver a ver» releases it with the same camera handoff.
 await page.locator('#homeDemoReplay').click();
 await page.waitForFunction(()=>{const c=document.getElementById('presentationLivingPlay');return c&&!c.hidden;});
 assert.equal(await page.locator('#presentationLivingPlay').isDisabled(),true,'the presentation is still settling');
 await page.evaluate(()=>window.releaseHomeDemoCamera());
 await page.waitForFunction(()=>window.FloorPlanPresentation.story?.kind==='living-drawing'&&View3D.presentationLivingDrawingInfo.active);
 // Back to start: the presentation closes, the visitor's own project is open again and nothing of theirs changed.
 await page.locator('#homeDemoHome').click();await page.waitForURL(u=>!u.search);await page.locator('#welcomeBlank').waitFor({state:'attached'});
 const after=await projects(page);assert.equal(after.active,mine,'the visitor\'s project is the open one again');
 // The visitor's projects are byte-identical. RUBIK's own example entry is the one «Probar el ejemplo» opens: as there,
 // only its display name is localized («Proyecto de ejemplo»); its content is the same.
 const noName=doc=>{const x=JSON.parse(doc);delete x.name;return JSON.stringify(x);};
 for(const [id,doc] of Object.entries(before.entries)){const ex=JSON.parse(doc).id==='prj_reference-home';
  if(ex)assert.equal(noName(after.entries[id]),noName(doc),'the example keeps its content');else assert.equal(after.entries[id],doc,'project '+id+' unchanged');}
 assert.deepEqual(external,[],'no external request: no AI, no publication');assert.deepEqual(errors,[]);
});

test('Dibujo vivo demo on a phone 390×844: the intro fits, the drawing starts, no horizontal overflow',{timeout:300000},async t=>{
 const {context,page,errors}=await open({width:390,height:844});t.after(()=>context.close());
 await page.goto(url+'?demo=dibujo-vivo');await page.locator('#homeDemoStart').waitFor();
 const fit=await page.evaluate(()=>{const c=document.getElementById('homeDemoCard').getBoundingClientRect(),b=document.getElementById('homeDemoBar').getBoundingClientRect();
  return {card:c.left>=0&&c.right<=innerWidth&&c.top>=0&&c.bottom<=innerHeight,bar:b.left>=0&&b.right<=innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1};});
 assert.deepEqual(fit,{card:true,bar:true,overflow:false});await shot(page,'05-dibujo-390-intro');
 await page.locator('#homeDemoStart').tap();await page.waitForFunction(()=>window.FloorPlanPresentation.story?.kind==='living-drawing');
 await page.waitForTimeout(3000);await shot(page,'06-dibujo-390-playing');assert.deepEqual(errors,[]);
});
