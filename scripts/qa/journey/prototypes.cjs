/* Visual prototypes of the three orientation alternatives (docs/product/journey-orientation-2026-10-21.md §3), drawn
   over the real application in the same four states, at 1440×900 and 390×844:
   s1 own project after its first room · s2 the example · s3 an image without scale · s4 a duplex with conflicts.
   A: the guide row shows the next action (compact guide). B: a floating card on the plan. C: «Ahora» in the palette.
   The DOM injected here is a mock-up for comparison only; nothing is stored. Usage: node prototypes.cjs <checkout> <outdir> */
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [rootArg,outArg]=process.argv.slice(2),root=path.resolve(rootArg),out=path.resolve(outArg);
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const NEXT={
 s1:{title:'Añade puertas y ventanas',text:'Elige el tipo, toca la estancia y después el muro donde va.',cta:'Añadir puertas y ventanas',alt:'Otra estancia'},
 s2:{title:'Estás viendo un ejemplo',text:'Recórrelo en 3D o crea tu propia vivienda a partir de él.',cta:'Ver en 3D',alt:'Crear mi vivienda desde el ejemplo'},
 s3:{title:'Ajusta la escala del plano',text:'Marca dos puntos de una medida que conozcas y escribe su distancia en milímetros.',cta:'Empezar a calibrar'},
 s4:{title:'Resuelve los conflictos del edificio',text:'2 conflictos en 2 plantas. Mientras sigan, no se puede presentar la vivienda.',cta:'Ver conflictos'}};
function inject([alt,n]){
 const css=document.createElement('style');css.textContent=`
 .proto-next{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.proto-next h2{margin:0;font-size:15px}.proto-next p{margin:2px 0 0;color:var(--ink-muted);font-size:13px}
 .proto-next .copy{flex:1 1 260px;min-width:0}.proto-next .alt{background:none;border:0;color:var(--ink);text-decoration:underline;font:inherit;font-size:13px;padding:6px}
 .proto-card{position:absolute;left:16px;bottom:72px;z-index:20;max-width:380px;background:var(--surface-panel);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);padding:12px 14px}
 @media(max-width:1100px){.proto-card{left:8px;right:8px;bottom:84px;max-width:none}}
 .proto-now{margin:8px;padding:10px;border:1px solid var(--line-strong);border-radius:10px;background:var(--surface-panel)}.proto-now h4{margin:0 0 4px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)}`;
 document.head.append(css);
 const block=()=>{const d=document.createElement('div');d.className='proto-next';d.innerHTML=`<div class="copy"><h2></h2><p></p></div><button class="btn primary" type="button"></button>${n.alt?'<button class="alt" type="button"></button>':''}`;d.querySelector('h2').textContent=n.title;d.querySelector('p').textContent=n.text;d.querySelector('.primary').textContent=n.cta;if(n.alt)d.querySelector('.alt').textContent=n.alt;return d;};
 const bar=document.querySelector('#guideBar');
 if(alt==='A'){bar.classList.add('guide-compact');const cur=bar.querySelector('.guide-current');cur.replaceChildren(block());if(matchMedia('(max-width:600px)').matches)for(const id of ['guidePrevious','guideGoalChange'])document.getElementById(id).style.display='none';const ex=bar.querySelector('.guide-example');if(ex)ex.hidden=true;}
 if(alt==='B'){const card=document.createElement('div');card.className='proto-card';card.append(block());document.querySelector('#stage').append(card);}
 if(alt==='C'){const panel=document.querySelector('#paletteBuild');const now=document.createElement('section');now.className='proto-now';now.innerHTML='<h4>Ahora</h4>';now.append(block());panel.prepend(now);}
}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(file)]||'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}}).listen(0);
 const url=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({executablePath:process.env.CHROME||undefined});
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'proto-'));
 {const B=require(path.join(root,'js/building-core.js')),P=require(path.join(root,'js/project-package.js')),T=require(path.join(root,'js/tracing-core.js')),S=require(path.join(root,'tests/fixtures/stair-conflict-building.cjs'));
  const {entries}=await B.packageEntries(S.build().building,()=>null,T.imageInfo);await fs.writeFile(path.join(tmp,'duplex.zip'),Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));}
 for(const [w,h] of [[1440,900],[390,844]]){const narrow=w<1000;
  for(const state of ['s1','s2','s3','s4'])for(const alt of ['current','A','B','C']){
   const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:narrow,hasTouch:narrow}),page=await ctx.newPage();await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
   await page.goto(url);await page.waitForFunction(()=>window.FloorPlanGuideUI);
   const tap=s=>narrow?page.locator(s).first().tap():page.locator(s).first().click();
   const file=async(btn,f)=>{const fc=page.waitForEvent('filechooser');await tap(btn);await (await fc).setFiles(f);};
   if(state==='s1'){await tap('#welcomeBlank');await page.locator('#roomDesignName').fill('Salón');await tap('#roomDesignReview');await tap('#roomDesignConfirm');if(narrow&&await page.evaluate(()=>document.querySelector('aside.right').classList.contains('open')))await tap('#tgPanel');}
   if(state==='s2')await tap('#welcomeExample');
   if(state==='s3'){await file('#welcomeUpload',path.join(root,'tests/fixtures/manual-plan.png'));await page.waitForTimeout(2500);}
   if(state==='s4'){await file('#welcomeUpload',path.join(tmp,'duplex.zip'));await page.waitForFunction(()=>window.FloorPlanBuildingUI?.context?.levels===2,null,{timeout:60000});}
   await page.waitForTimeout(800);
   if(alt==='C'){if(!(await page.evaluate(()=>document.querySelector('aside.lib').classList.contains('open')||!matchMedia('(max-width:1100px)').matches&&document.querySelector('aside.lib').getBoundingClientRect().width>60)))await tap('#tgLib');await tap('#paletteTabBuild');}
   if(alt!=='current')await page.evaluate(inject,[alt,NEXT[state]]);
   await page.waitForFunction(()=>!document.querySelector('#toast').classList.contains('show'),null,{timeout:10000}).catch(()=>{});await page.waitForTimeout(400);
   await page.screenshot({path:path.join(out,`${w}x${h}-${state}-${alt}.png`)});
   const bar=await page.evaluate(()=>{const b=document.querySelector('#guideBar');return b&&b.getClientRects().length?Math.round(b.getBoundingClientRect().height):0;});
   console.log(w,state,alt,'guide height',bar);await ctx.close();}
 }
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1);});
