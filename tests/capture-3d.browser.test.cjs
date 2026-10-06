const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile);
let server,browser,url;const cache=new Map();
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.glb')?'model/gltf-binary':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function setup(t,viewport){const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,acceptDownloads:true});t.after(()=>context.close());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Official Three.js 0.160.0 modules fetched with the system curl, as in the other software-3D suites.
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();let p=cache.get(target);if(!p){p=run('curl',['--fail','--silent','--show-error','--max-time','20',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout);cache.set(target,p);}await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await p});});
 await page.goto(url);await page.waitForFunction(()=>window.View3D);
 if(mobile)await page.evaluate(()=>document.querySelectorAll('aside.open').forEach(a=>a.classList.remove('open')));
 await page.locator('[data-view="3d"]').click();await page.waitForFunction(()=>document.querySelector('#stage').classList.contains('is3d')&&!document.body.classList.contains('busy'));
 await page.waitForTimeout(1500);return {page,errors,mobile};}
// Everything the capture must leave untouched: project, history, storage, working camera and working canvas.
const state=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),undo:undoStack.length,redo:redoStack.length,storage:JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))),camera:View3D.cameraState,canvas:View3D.canvasState}));
async function capture(page,size,aspect){
 await page.evaluate(([size,aspect])=>{document.querySelector('details.menu').open=true;const s=document.querySelector('#shot3dSize'),a=document.querySelector('#shot3dAspect');s.value=size;s.dispatchEvent(new Event('change'));a.value=aspect;a.dispatchEvent(new Event('change'));},[size,aspect]);
 assert.equal(await page.locator('#shot3dAspect').isDisabled(),size==='view','aspect only applies to explicit sizes');
 const dims=await page.locator('#shot3dDims').textContent();
 const pending=page.waitForEvent('download');await page.locator('#exportPng').click();const dl=await pending;
 assert.equal(dl.suggestedFilename(),'rubik-sota-floor-plan-3D.png');
 const chunks=[];for await(const c of await dl.createReadStream())chunks.push(c);const png=Buffer.concat(chunks);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG signature');assert.equal(png.subarray(12,16).toString(),'IHDR');
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 // Decode in the page and sample: a real render has many colours, not a blank or uniform buffer.
 const colours=await page.evaluate(async b64=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const c=document.createElement('canvas');c.width=64;c.height=64;const x=c.getContext('2d');x.drawImage(img,0,0,64,64);const d=x.getImageData(0,0,64,64).data,set=new Set();for(let i=0;i<d.length;i+=4)set.add(d[i]>>3<<10|d[i+1]>>3<<5|d[i+2]>>3);return set.size;},png.toString('base64'));
 assert.ok(colours>40,`rendered content, ${colours} colour buckets`);
 return {png,width,height,dims};}
const ratio=(w,h)=>w/h;
for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`3D capture options download real PNGs without touching the working view ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const {page,errors,mobile}=await setup(t,viewport),name=`${viewport.width}x${viewport.height}`,initial=await state(page);
 // Default: unchanged historical behaviour (current canvas buffer).
 const def=await capture(page,'view','view');
 assert.deepEqual([def.width,def.height],[initial.canvas.width,initial.canvas.height]);assert.equal(def.dims,`${def.width} × ${def.height} px`);
 const cases=mobile?[['1280','9:16',720,1280],['1280','view',null,1280]]:[['1920','16:9',1920,1080],['1280','1:1',1280,1280],['2560','4:3',2560,1920]];
 await fs.mkdir('docs/qa/artifacts/capture-3d',{recursive:true});
 for(const [size,aspect,w,h] of cases){
  const out=await capture(page,size,aspect);
  if(w)assert.deepEqual([out.width,out.height],[w,h]);
  else{assert.equal(Math.max(out.width,out.height),Number(size));assert.ok(Math.abs(ratio(out.width,out.height)-ratio(initial.canvas.width,initial.canvas.height))<0.01,'same as view keeps the working aspect');}
  assert.equal(out.dims,`${out.width} × ${out.height} px`);
  await fs.writeFile(`docs/qa/artifacts/capture-3d/${name}-${size}-${aspect.replace(':','x')}.png`,out.png);
  assert.deepEqual(await state(page),initial,`no mutation after ${size} ${aspect}`);
 }
 // The working canvas keeps rendering at its own size after captures.
 assert.deepEqual(await page.evaluate(()=>View3D.canvasState),initial.canvas);
 assert.deepEqual(errors,[]);
});
test('capture size is bounded by the pixel budget and GPU limits, and 2D export is unchanged',{timeout:120000},async t=>{
 const {page,errors}=await setup(t,{width:1440,height:900});
 const sizes=await page.evaluate(()=>['16:9','4:3','1:1','9:16','view'].flatMap(a=>['1280','1920','2560'].map(s=>({a,s,...View3D.shotSize({size:s,aspect:a})}))));
 for(const r of sizes){assert.ok(r.width*r.height<=2560*1920,`${r.s} ${r.a} within pixel budget`);assert.ok(Math.max(r.width,r.height)<=2560);}
 const square=sizes.find(r=>r.s==='2560'&&r.a==='1:1');assert.equal(square.reduced,true);assert.equal(square.width,square.height);assert.equal(square.width,Math.floor(Math.sqrt(2560*1920)));
 await assert.rejects(page.evaluate(()=>View3D.shotSize({size:'9999',aspect:'1:1'})),/no válida|Invalid/);
 // 2D export: same 3200 px wide image as before, independent of the 3D options.
 await page.locator('[data-view="2d"]').click();await page.waitForFunction(()=>!document.body.classList.contains('m3d')&&!document.body.classList.contains('busy'));
 const before=await state(page);await page.evaluate(()=>document.querySelector('details.menu').open=true);
 const pending=page.waitForEvent('download');await page.locator('#exportPng').click();const dl=await pending;
 assert.equal(dl.suggestedFilename(),'rubik-sota-floor-plan.png');const chunks=[];for await(const c of await dl.createReadStream())chunks.push(c);const png=Buffer.concat(chunks);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),3200);
 assert.equal(await page.locator('#shot3dOptions').isVisible(),false,'3D options are hidden in 2D');
 assert.deepEqual(await state(page),before);assert.deepEqual(errors,[]);
});
