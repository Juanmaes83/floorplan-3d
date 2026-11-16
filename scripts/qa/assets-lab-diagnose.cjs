'use strict';
/* Diagnostic (not a test, changes nothing): loads the SAME 6-model «next Asset Lab cohort» scene that
   tests/assets.browser.test.cjs loads, with the production loader and its unchanged 8 s limit, and records what happens:
   a WebM video, a final screenshot, a 250 ms timeline of every model's state (View3D.assetStatus), console messages,
   machine data (CPU, memory, load) and versions. Usage (from the repository root):
     CHROME=/path/to/chrome node scripts/qa/assets-lab-diagnose.cjs <outDir> [width] [height]
   Run it pinned with `taskset -c 0,1` to reproduce the 2-CPU condition. Like the test, three.js comes from its pinned CDN; no other network. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{createServer}=require('node:http');
const {chromium}=require('playwright'),Core=require('../../js/project-core.js');
const fixture=require('../../docs/contracts/examples/floorplan-project-v1.example.json');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.resolve(process.argv[2]||'qa-results/assets-lab-diagnose'),W=+process.argv[3]||1440,H=+process.argv[4]||900;
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.txt':'text/plain'};
const IDS=['ikea-glostad-2-seat-sofa-knisa-dark-grey-demo','ikea-strandmon-wing-chair-tommaboda-deep-beige-demo','ikea-skogsta-mesa-acacia-demo','ikea-knoxhult-armario-bajo-con-puertas-y-cajon-blanco-demo','ikea-stockholm-2025-aparador-chapa-roble-demo','ikea-nordli-comoda-de-5-cajones-blanco-demo'];
(async()=>{fs.mkdirSync(OUT,{recursive:true});
 const server=createServer((req,res)=>{try{let p=new URL(req.url,'http://l').pathname;if(p.endsWith('/'))p+='index.html';const f=path.resolve(ROOT,'.'+decodeURIComponent(p));if(!f.startsWith(ROOT+path.sep))throw 0;
  res.setHeader('Content-Type',TYPES[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:W,height:H},recordVideo:{dir:OUT,size:{width:W,height:H}}}),page=await context.newPage(),consoleLog=[];
 page.on('console',m=>consoleLog.push({t:Date.now(),type:m.type(),text:m.text().slice(0,300)}));page.on('pageerror',e=>consoleLog.push({t:Date.now(),type:'pageerror',text:e.message}));
 // Same start as setup() in tests/assets.browser.test.cjs: the editor fixture (welcome dismissed) and the 3D view ready.
 await page.goto(base);await require('../../tests/editor-fixture.cjs')(page);await page.waitForFunction(()=>window.View3D&&window.FloorPlanAssetUI?.ready,null,{timeout:40000});
 const entries=await page.evaluate(ids=>ids.map(id=>FloorPlanAssetUI.entries.find(e=>e.id===id)),IDS);
 const p=Core.clone(fixture);p.objects=entries.map((e,i)=>({...Core.clone(fixture.objects[0]),id:'obj_next_'+i,name:e.name,type:e.type,size:{widthMm:e.dimensionsMm.width,depthMm:e.dimensionsMm.depth,heightMm:e.dimensionsMm.height},position:{x:900+(i%3)*1800,y:900+Math.floor(i/3)*1700},assetRef:{catalog:e.catalog,assetId:e.id,catalogRevision:e.revision}}));
 await page.evaluate(p=>FloorPlanApp.importProject(p),p);
 const t0=Date.now(),timeline=[],cpu0=os.cpus().map(c=>c.times);
 await page.click('[data-view="3d"]');// same as open3D() in tests/assets.browser.test.cjs
 const ids=p.objects.map(o=>o.id);
 for(;;){const st=await page.evaluate(ids=>ids.map(id=>View3D?.assetStatus?.(id)||null),ids).catch(()=>ids.map(()=>null));timeline.push({ms:Date.now()-t0,states:st.map(s=>s?{state:s.state,reason:s.reason||null,durationMs:s.durationMs??null}:null),loadavg:os.loadavg()[0]});
  if(st.every(s=>s&&['ready','error'].includes(s.state))||Date.now()-t0>60000)break;await page.waitForTimeout(250);}
 await page.waitForTimeout(800);await page.screenshot({path:path.join(OUT,`scene-${W}x${H}.png`)});
 const cpu1=os.cpus().map(c=>c.times),busy=cpu1.map((c,i)=>{const d=k=>c[k]-cpu0[i][k],tot=['user','nice','sys','idle','irq'].reduce((a,k)=>a+d(k),0);return tot?+(1-d('idle')/tot).toFixed(2):null;});
 const final=timeline.at(-1).states.map((s,i)=>({id:IDS[i],...s}));
 const report={schema:'rubik-assets-lab-diagnose/1',viewport:{width:W,height:H},loaderTimeoutMs:8000,final,aborted:final.filter(s=>s.state==='error').map(s=>s.id),
  machine:{cpus:os.cpus().length,model:os.cpus()[0]?.model,affinity:process.env.TASKSET||null,memTotalMB:Math.round(os.totalmem()/2**20),memFreeMB:Math.round(os.freemem()/2**20),loadavgStart:timeline[0].loadavg,cpuBusyDuringScene:busy},
  versions:{node:process.version,playwright:require('playwright/package.json').version,chrome:browser.version(),os:`${os.type()} ${os.release()}`},timeline,console:consoleLog.slice(0,200)};
 await context.close();await browser.close();server.close();
 const vids=fs.readdirSync(OUT).filter(f=>f.endsWith('.webm'));if(vids.length)fs.renameSync(path.join(OUT,vids[0]),path.join(OUT,`scene-${W}x${H}.webm`));
 fs.writeFileSync(path.join(OUT,`report-${W}x${H}.json`),JSON.stringify(report,null,1));
 console.log(JSON.stringify({viewport:report.viewport,aborted:report.aborted,final:final.map(s=>[s.state,s.durationMs&&Math.round(s.durationMs)]),cpuBusy:busy,loadavgStart:report.machine.loadavgStart}));
})().catch(e=>{console.error(e);process.exit(1);});
