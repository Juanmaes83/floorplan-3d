// Frame-time comparison for the first multi-level cut: the synthetic two-level fixture (both levels visible in 3D)
// against a single-level project with the same rooms as its ground floor. Prints the WebGL renderer, Chromium
// version and median/p90 frame times. Software renderers (SwiftShader, llvmpipe) are reported as not representative.
// Usage (repo root): CHROME=<chrome or chromium> node scripts/qa/multilevel/perf.cjs [viewport, e.g. 1440x900]
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..','..','..'),F=require(path.join(root,'tests/fixtures/building-fixture.cjs'));
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
const [w,h]=(process.argv[2]||'1440x900').split('x').map(Number);
(async()=>{
 const server=http.createServer((q,r)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(q.url,'http://l').pathname.replace(/^\/$/,'/index.html')));if(!p.startsWith(root+path.sep))throw Error();r.setHeader('Content-Type',types[path.extname(p)]||'text/html');r.end(fs.readFileSync(p));}catch{r.writeHead(404);r.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const {building}=F.build(),single=structuredClone(building.levels[0].project);single.id='prj_perf-single';
 const library=(entries,activeId)=>JSON.stringify({version:1,activeId,entries});
 const cases=[['single-level',library([{id:'prj_entry-single',name:'Una planta',project:single}],'prj_entry-single'),'active'],
  ['two-levels (all visible)',library([{id:'prj_entry-building',name:building.name,kind:'building',building,activeLevelId:building.levels[0].id}],'prj_entry-building'),'all']];
 const results=[],version=browser.version();
 try{for(const [name,data,view] of cases){
  const context=await browser.newContext({viewport:{width:w,height:h}}),page=await context.newPage();
  if(process.env.THREE_LOCAL_DIR)await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async x=>{const rel=new URL(x.request().url()).pathname.replace('/npm/three@0.160.0/','');await x.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(path.join(process.env.THREE_LOCAL_DIR,rel))});});
  await page.addInitScript(d=>{try{if(!sessionStorage.getItem('perf-seeded')){localStorage.setItem('rubik-sota-project-library-v1',d);sessionStorage.setItem('perf-seeded','1');}}catch{}},data);
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.View3D&&window.FloorPlanApp,null,{timeout:90000});
  if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false))await page.locator('#welcomeActionInput').press('Escape');
  await page.evaluate(()=>setView('3d'));await page.waitForTimeout(2000);
  if(view==='all')await page.evaluate(()=>{const b=document.querySelector('#levelViewAll');if(b&&b.getAttribute('aria-pressed')!=='true')b.click();});
  await page.evaluate(()=>document.querySelector('#vIso')?.click());await page.waitForTimeout(3000);
  const r=await page.evaluate(async()=>{const c=document.createElement('canvas').getContext('webgl'),d=c&&c.getExtension('WEBGL_debug_renderer_info'),renderer=d?c.getParameter(d.UNMASKED_RENDERER_WEBGL):'unknown';
   const s=[];let p=performance.now();for(let i=0;i<40;i++){await new Promise(requestAnimationFrame);const n=performance.now();s.push(n-p);p=n;}s.sort((a,b)=>a-b);
   return {renderer,medianMs:+s[20].toFixed(1),p90Ms:+s[36].toFixed(1),levels:View3D.levelInspect().levels.length,stairs:View3D.levelInspect().stairs.length};});
  results.push({case:name,...r});await context.close();
 }}finally{await browser.close();server.close();}
 const software=results.some(r=>/swiftshader|llvmpipe|software/i.test(r.renderer)),ratio=+(results[1].medianMs/results[0].medianMs).toFixed(2);
 console.log(JSON.stringify({browser:version,viewport:`${w}x${h}`,results,ratio,criterion:'two-level median ≤ 1.5 × single-level median',meets:ratio<=1.5,representative:!software},null,1));
 if(software)console.log('Software renderer: timings are not representative of GPU or phones; repeat on a GPU PC and on physical phones.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
