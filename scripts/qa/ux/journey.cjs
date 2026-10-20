/* End-to-end journey audit for the premium UX programme: the states a first-time user and a professional preparing a
   client delivery go through (welcome, guided editor, full editor without and with a selection, a building with a
   pending warning, 3D, presentation, «Archivo» menu). For every state it saves a PNG and an inventory of every visible
   control: label, accessible name, region (header, left column, right column, plan, dialog, bottom bar), whether it
   is drawn as a dominant (filled, dark or accent) call to action, and its size. Labels repeated across regions are
   reported as candidate duplicates; states with more than one dominant control as competing calls to action.
   Optional CSS (THEME_CSS=<file>) is injected before every capture so visual directions can be compared on the same
   states without changing the product.
   Usage: node scripts/qa/ux/journey.cjs <checkout> <outdir> [1440x900 390x844 844x390] */
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [rootArg,outArg,...vpArgs]=process.argv.slice(2),root=path.resolve(rootArg),out=path.resolve(outArg);
const VPS=(vpArgs.length?vpArgs:['1440x900','390x844','844x390']).map(s=>s.split('x').map(Number));
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
const themeCss=process.env.THEME_CSS?require('node:fs').readFileSync(process.env.THEME_CSS,'utf8'):'';
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const B=require(path.join(root,'js/building-core.js')),P=require(path.join(root,'js/project-package.js')),T=require(path.join(root,'js/tracing-core.js')),S=require(path.join(root,'tests/fixtures/stair-conflict-building.cjs'));
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'journey-'));const {entries}=await B.packageEntries(S.build().building,()=>null,T.imageInfo);
 await fs.writeFile(path.join(tmp,'duplex.zip'),Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));
 const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(file)]||'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}}).listen(0);
 const url=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({executablePath:process.env.CHROME||undefined});
 const report={commit:(await require('node:util').promisify(require('node:child_process').execFile)('git',['-C',root,'rev-parse','HEAD'])).stdout.trim(),browser:browser.version(),theme:process.env.THEME_CSS?path.basename(process.env.THEME_CSS):null,states:[]};
 for(const [w,h] of VPS){
  const narrow=w<=1100,name=`${w}x${h}`,ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:narrow,hasTouch:narrow}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|Failed to load resource/.test(m.text()))errors.push(m.text());});
  await page.route('https://cdn.jsdelivr.net/**',async r=>{if(!process.env.THREE_LOCAL_DIR)return r.abort();try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require(path.join(root,'tests/helpers/three-module.cjs'))(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
  if(themeCss)await page.addInitScript(css=>{const add=()=>{const s=document.createElement('style');s.id='journeyTheme';s.textContent=css;document.head.append(s);};if(document.head)add();else document.addEventListener('DOMContentLoaded',add);},themeCss);
  const press=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();if(narrow)await l.tap();else await l.click();await page.waitForTimeout(300);};
  async function capture(id,note){
   await page.waitForTimeout(500);await page.screenshot({path:path.join(out,`${name}-${id}.png`)});
   const inv=await page.evaluate(()=>{
    const lum=c=>{const m=c.match(/[\d.]+/g);if(!m)return 1;const [r,g,b,a=1]=m.map(Number);if(a<.5)return null;return [r,g,b].map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);};
    const region=e=>e.closest('dialog[open]')?'dialog':e.closest('header')?'header':e.closest('aside.lib')?'left':e.closest('aside.right')?'right':e.closest('#fab,.fab,.mobile-bar')?'bottom':e.closest('#stage,main')?'plan':'other';
    const shown=e=>{const r=e.getBoundingClientRect();if(r.width<2||r.height<2||r.bottom<=0||r.top>=innerHeight||r.right<=0||r.left>=innerWidth)return false;const s=getComputedStyle(e);if(s.visibility==='hidden'||+s.opacity<.05)return false;const hit=document.elementFromPoint(Math.min(innerWidth-1,Math.max(0,r.left+r.width/2)),Math.min(innerHeight-1,Math.max(0,r.top+r.height/2)));return !!hit&&(e===hit||e.contains(hit)||hit.contains(e));};
    const items=[];for(const e of document.querySelectorAll('button,a[href],summary,select,input:not([type=hidden]):not([type=file]),[role=tab]')){if(!shown(e))continue;
     const s=getComputedStyle(e),bg=lum(s.backgroundColor),fg=lum(s.color),r=e.getBoundingClientRect();
     const label=(e.getAttribute('aria-label')||e.innerText||e.value||e.title||'').replace(/\s+/g,' ').trim().slice(0,60);
     items.push({id:e.id||null,label,region:region(e),dominant:bg!==null&&bg<.3&&fg>.5,w:Math.round(r.width),h:Math.round(r.height),disabled:!!e.disabled||e.getAttribute('aria-disabled')==='true'});}
    return {items,hScroll:document.documentElement.scrollWidth>innerWidth+1,dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.id)};});
   const norm=l=>l.toLowerCase().replace(/[^a-záéíóúñü0-9 ]/g,'').replace(/\s+/g,' ').trim();
   const byLabel={};for(const i of inv.items){const k=norm(i.label);if(k.length<3)continue;(byLabel[k]||=new Set()).add(i.region);}
   const duplicates=Object.entries(byLabel).filter(([,r])=>r.size>1).map(([k,r])=>({label:k,regions:[...r]}));
   const dominant=inv.items.filter(i=>i.dominant&&!i.disabled).map(i=>`${i.region}: ${i.label}`);
   const small=inv.items.filter(i=>narrow&&(i.h<40||i.w<40)&&!i.disabled).map(i=>`${i.region}: ${i.label} (${i.w}×${i.h})`);
   report.states.push({viewport:name,id,note,controls:inv.items.length,byRegion:inv.items.reduce((o,i)=>(o[i.region]=(o[i.region]||0)+1,o),{}),dominant,duplicates,smallTouchTargets:small.length,smallSample:small.slice(0,8),hScroll:inv.hScroll,dialogs:inv.dialogs,items:inv.items});
  }
  // 1. Arrival: welcome with the three ways to start.
  await page.goto(url);await page.waitForFunction(()=>document.querySelector('#welcomeDialog')?.open,null,{timeout:15000}).catch(()=>{});
  await capture('j01-welcome','Llegada: elegir cómo empezar');
  // 2. Guided editor on the example (what a first-time user sees after «Probar con un ejemplo»).
  const example=page.locator('#welcomeExample, [data-welcome="example"], #welcomeDialog button:has-text("ejemplo")').first();
  if(await example.count())await press(`#${await example.evaluate(e=>e.id)||'welcomeExample'}`).catch(async()=>{await example.click();});else await page.locator('#welcomeActionInput').press('Escape');
  await page.waitForTimeout(800);await capture('j02-guided','Editor guiado con el ejemplo');
  // 3. Full editor without selection.
  if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false))await page.locator('#welcomeActionInput').press('Escape');
  await page.locator('#guideDetails').click();await page.locator('#guideAllTools').click();await page.waitForTimeout(500);
  if(narrow)await page.evaluate(()=>drawer(null));await page.waitForTimeout(400);
  await capture('j03-editor','Editor completo sin selección');
  // 4. A room selected (properties visible as the app shows them).
  await page.evaluate(()=>select({kind:'room',id:FloorPlanApp.project.rooms[0].id}));await page.waitForTimeout(400);
  await capture('j04-room-selected','Estancia seleccionada');
  // 5. «Archivo» menu open (desktop) — where export, import and destructive actions live.
  if(!narrow){await page.evaluate(()=>select(null));const menu=page.locator('header details.menu > summary');if(await menu.isVisible()){await menu.click();await capture('j05-file-menu','Menú «Archivo»');await menu.click();}}
  // 6. 3D view.
  await page.evaluate(()=>select(null));await page.evaluate(()=>setView('3d'));await page.waitForFunction(()=>window.View3D&&ui.viewMode==='3d'&&!document.body.classList.contains('busy'),null,{timeout:60000}).catch(()=>{});await page.waitForTimeout(1500);
  await capture('j06-3d','Vista 3D');
  // 7. Presentation configuration.
  await page.evaluate(()=>setView('2d'));await page.waitForTimeout(800);
  await page.evaluate(()=>window.FloorPlanPresentation?.open());await page.waitForTimeout(1500);
  await capture('j07-presentation','Presentar mi vivienda: configuración');
  await page.keyboard.press('Escape');await page.waitForTimeout(500);
  // 8. A building with a pending warning (furniture over the stair): what must the user resolve?
  await page.locator('#uploadIn').setInputFiles(path.join(tmp,'duplex.zip'));await page.waitForFunction(()=>window.FloorPlanBuildingUI?.context?.levels===2,null,{timeout:60000}).catch(()=>{});await page.waitForTimeout(1500);
  if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false))await page.locator('#welcomeActionInput').press('Escape');
  await capture('j08-warning','Edificio con aviso pendiente (mueble sobre la escalera)');
  report.states.push({viewport:name,id:'errors',errors});
  await ctx.close();
 }
 await fs.writeFile(path.join(out,'journey.json'),JSON.stringify(report,null,1));
 await browser.close();server.close();await fs.rm(tmp,{recursive:true,force:true});
})().catch(e=>{console.error(e);process.exit(1);});
