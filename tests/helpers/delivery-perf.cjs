/* Delivery 3D V1 — performance measurement (not a pass/fail test). Chromium + SwiftShader (CPU WebGL) in a container:
   absolute numbers are NOT representative of a phone; they compare client mode with the normal app on the same machine
   and catch leaks across enter/exit cycles. Usage: CHROME=… node tests/helpers/delivery-perf.cjs [out.json] */
const {chromium}=require('playwright'),fs=require('node:fs'),S=require('./delivery-server.cjs'),D=require('../../js/delivery-core.js');
const median=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:null;},p95=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length*.95)]:null;};
async function frames(page,ms=4000){return page.evaluate(ms=>new Promise(r=>{const t=[];let last=performance.now();const end=last+ms;const f=n=>{t.push(n-last);last=n;if(n<end)requestAnimationFrame(f);else r(t);};requestAnimationFrame(f);}),ms);}
const summary=t=>({frames:t.length,medianMs:+median(t).toFixed(1),p95Ms:+p95(t).toFixed(1),fps:+(1000/median(t)).toFixed(1)});
(async()=>{
 const srv=await S.start();const br=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader','--enable-precise-memory-info']});
 const out={env:{browser:br.version(),webgl:'SwiftShader (CPU)',note:'container, not a phone'},runs:[]};
 const pro=await br.newPage({viewport:{width:1440,height:900}});
 await pro.goto(srv.url);await pro.waitForFunction(()=>window.FloorPlanDeliveryUI);await pro.locator('#welcomeExample').click();await pro.waitForFunction(()=>FloorPlanApp.project.rooms.length>3);
 // The card must not load the 3D model: opening «Entregar» leaves View3D untouched.
 const t0=Date.now();await pro.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));await pro.locator('#delivery3dCard').waitFor();
 out.cardMs=Date.now()-t0;out.cardLoads3D=await pro.evaluate(()=>!!(window.View3D?.rendererMemory));
 const project=await pro.evaluate(()=>structuredClone(FloorPlanApp.project));
 const snap=D.buildSnapshot({project,title:project.name});out.snapshotBytes=Buffer.byteLength(JSON.stringify(snap));
 const url=S.STORE+'/rubik-share/perf-p1.delivery.json';srv.blob.files.set(url,{body:Buffer.from(JSON.stringify(snap)),type:'application/json'});
 // Baseline: the normal app, same project, walk mode.
 const base=await br.newPage({viewport:{width:1440,height:900}});await base.goto(srv.url);await base.waitForFunction(()=>window.FloorPlanDeliveryUI);await base.locator('#welcomeExample').click();await base.waitForFunction(()=>FloorPlanApp.project.rooms.length>3);await base.evaluate(()=>FloorPlanApp.enterPresentation3D());await base.locator('[data-mode="walk"]').click();await base.waitForFunction(()=>View3D.walking());await base.waitForTimeout(1500);
 out.baselineWalk={...summary(await frames(base)),canvas:await base.evaluate(()=>View3D.canvasState)};
 for(const [label,viewport,mobile] of [['desktop 1440×900',{width:1440,height:900},false],['phone 390×844',{width:390,height:844},true]]){
  const ctx=await br.newContext({viewport,isMobile:mobile,hasTouch:mobile});const p=await ctx.newPage();
  const start=Date.now();await p.goto(srv.url+'?entrega='+encodeURIComponent(url));await p.waitForFunction(()=>['ready','error','no-3d'].includes(window.FloorPlanDeliveryClient?.state),null,{timeout:180000});const st=await p.evaluate(()=>FloorPlanDeliveryClient.state);if(st!=='ready')throw Error('client state '+st+' '+await p.locator('#deliveryGate').innerText());
  const run={label,readyMs:Date.now()-start,cycles:[]};
  for(let i=0;i<+(process.env.CYCLES||5);i++){
   const e0=Date.now();await p.locator('#deliveryWalk').click();await p.waitForFunction(()=>View3D.walking());const enterMs=Date.now()-e0;await p.waitForTimeout(800);
   const f=i===0||i===+(process.env.CYCLES||5)-1?summary(await frames(p,3000)):null;
   const mem=await p.evaluate(()=>({canvas:View3D.canvasState&&[View3D.canvasState.width,View3D.canvasState.height,View3D.canvasState.pixelRatio],gpu:View3D.rendererMemory,heapMB:performance.memory?+(performance.memory.usedJSHeapSize/1048576).toFixed(1):null}));
   const x0=Date.now();await p.locator('#deliveryExit').click();await p.waitForFunction(()=>FloorPlanDeliveryClient.mode==='gate');
   run.cycles.push({enterMs,exitMs:Date.now()-x0,...(f?{walk:f}:{}),...mem});
  }
  out.runs.push(run);await ctx.close();
 }
 const file=process.argv[2];const text=JSON.stringify(out,null,1);if(file)fs.writeFileSync(file,text);console.log(text);
 await br.close();await srv.close();
})().catch(e=>{console.error(e);process.exit(1);});
