/* Finding 13 (23-10-2026): the overview of a small home (the ground level of a duplex) was framed with a radius that
   only considered the plan, so the foot of its outer walls left the frame and the walls read as a shaft; the card
   covered part of the home too. The whole level box (wall meshes, floor to top) must now be inside the region the
   card leaves free. Checked with the walls the scene really draws (View3D.wallMeshes) and the real camera
   (View3D.cameraState), independently of the framing code. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile),{chromium}=require('playwright');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),S=require('./fixtures/stair-conflict-building.cjs');
const QA=process.env.OVERVIEW_ARTIFACTS||path.join(os.tmpdir(),'presentation-overview');let server,url,browser,zip;const cache=new Map();
const three=target=>require('./helpers/three-module.cjs')(target,()=>run('curl',['--fail','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout));
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',file.endsWith('.hdr')?'application/octet-stream':/\.m?js$/.test(file)?'text/javascript':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(QA,{recursive:true});
 // The duplex of the stair-conflict suite without its two conflicting pieces, so it can be presented.
 const b=S.build().building;for(const l of b.levels)l.project.objects=l.project.objects.filter(o=>!/sofa|bed/.test(o.id));
 const {entries}=await B.packageEntries(b,()=>null,T.imageInfo);zip=path.join(await fs.mkdtemp(path.join(os.tmpdir(),'overview-')),'duplex.zip');await fs.writeFile(zip,Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(t,viewport){const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();if(!cache.has(target))cache.set(target,three(target));await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await cache.get(target)});});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationRoute,null,{timeout:30000});return {page,errors};}
async function present(page){await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:180000});await page.waitForTimeout(300);}
// Screen position of every corner of every wall mesh, and the free region beside the card (as the card-aware framing).
const measure=page=>page.evaluate(()=>{const c=View3D.cameraState,[qx,qy,qz,qw]=c.quaternion,p=c.position,tV=Math.tan(c.fov*Math.PI/360),tH=tV*c.aspect;
 // Camera rotation matrix (columns: camera x, y, z axes in world); camera space = Rᵀ·(v − p), looking along −z.
 const R=[[1-2*(qy*qy+qz*qz),2*(qx*qy-qz*qw),2*(qx*qz+qy*qw)],[2*(qx*qy+qz*qw),1-2*(qx*qx+qz*qz),2*(qy*qz-qx*qw)],[2*(qx*qz-qy*qw),2*(qy*qz+qx*qw),1-2*(qx*qx+qy*qy)]];
 const inv=v=>[0,1,2].map(k=>R[0][k]*v[0]+R[1][k]*v[1]+R[2][k]*v[2]);
 const pts=[];for(const w of View3D.wallMeshes){const {width,height,depth}=w.dimensions,ca=Math.cos(w.angle),sa=Math.sin(w.angle);
  for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){const lx=sx*width/2,lz=sz*depth/2;pts.push([w.position[0]+lx*ca+lz*sa,w.position[1]+sy*height/2,w.position[2]-lx*sa+lz*ca]);}}
 const ndc=pts.map(q=>{const v=inv([q[0]-p[0],q[1]-p[1],q[2]-p[2]]);return [v[0]/(-v[2])/tH,v[1]/(-v[2])/tV];});
 const stage=document.querySelector('#stage').getBoundingClientRect(),box=document.querySelector('.presentation-card').getBoundingClientRect();
 const l=(box.left-stage.left)/stage.width,r=(box.right-stage.left)/stage.width,t=(box.top-stage.top)/stage.height,b=(box.bottom-stage.top)/stage.height;
 const region=[[0,0,l,1],[r,0,1,1],[0,0,1,t],[0,b,1,1]].map(x=>x.map(v=>Math.min(1,Math.max(0,v)))).sort((x,y)=>(y[2]-y[0])*(y[3]-y[1])-(x[2]-x[0])*(x[3]-x[1]))[0];
 const sx=ndc.map(n=>(n[0]+1)/2),sy=ndc.map(n=>(1-n[1])/2);
 return {walls:View3D.wallMeshes.length,region,box:[Math.min(...sx),Math.min(...sy),Math.max(...sx),Math.max(...sy)].map(v=>+v.toFixed(3)),stop:document.querySelector('.presentation-card h2')?.textContent.trim(),order:FloorPlanBuildingUI?.context?.order??null};});
const inside=(m,tol=.005)=>m.box[0]>=m.region[0]-tol&&m.box[1]>=m.region[1]-tol&&m.box[2]<=m.region[2]+tol&&m.box[3]<=m.region[3]+tol;
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`overview: the whole duplex level is inside the free region ${viewport.width}x${viewport.height}`,{timeout:300000},async t=>{
 const {page,errors}=await open(t,viewport),name=`${viewport.width}x${viewport.height}`;
 const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.locator('#welcomeUpload').click()]);await chooser.setFiles(zip);
 await page.waitForFunction(()=>window.FloorPlanBuildingUI?.context?.levels===2,null,{timeout:60000});await page.waitForTimeout(500);
 const editor=await page.evaluate(()=>({level:FloorPlanBuildingUI.context.levelId,project:JSON.stringify(FloorPlanApp.project)}));
 await present(page);const ground=await measure(page);await page.screenshot({path:path.join(QA,`${name}-duplex-ground-overview.png`)});
 assert.equal(ground.stop,'Vista general');assert.equal(ground.order,0);assert.ok(ground.walls>0);assert.ok(inside(ground),`${name} ground ${JSON.stringify(ground)}`);
 // The upper level opens with its own overview: it must fit too.
 await page.evaluate(()=>{const i=FloorPlanPresentation.plan.stops.findIndex((s,k)=>k>0&&s.kind==='overview');document.querySelectorAll('.presentation-stops button')[i].click();});
 await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&document.querySelector('.presentation-card h2')?.textContent.trim()==='Vista general'&&FloorPlanBuildingUI.context?.order===1,null,{timeout:120000});await page.waitForTimeout(300);
 const upper=await measure(page);assert.equal(upper.order,1);await page.screenshot({path:path.join(QA,`${name}-duplex-upper-overview.png`)});assert.ok(inside(upper),`${name} upper ${JSON.stringify(upper)}`);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active);await page.waitForTimeout(400);
 const back=await page.evaluate(()=>({level:FloorPlanBuildingUI.context.levelId,project:JSON.stringify(FloorPlanApp.project)}));assert.deepEqual(back,editor,'the editor keeps its level and project');
 assert.deepEqual(errors,[],name);
});
test('overview: the example home is inside the free region 1440x900',{timeout:300000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await page.locator('#welcomeExample').click();await page.waitForTimeout(500);
 await present(page);const m=await measure(page);await page.screenshot({path:path.join(QA,'1440x900-example-overview.png')});assert.ok(inside(m),JSON.stringify(m));assert.deepEqual(errors,[]);
});
