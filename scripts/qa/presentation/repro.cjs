// R10 stop framing/route reproduction. Usage: node repro.cjs <outDir> [stops|route|all]; IRREGULAR=1 uses the rotated fixture;
// REPO=<checkout> measures another revision (e.g. a worktree of 28e0428); VIEWPORTS=1440x900,390x844,...
const H=require('./harness.cjs'),measure=require('./metric.cjs'),fs=require('node:fs/promises'),path=require('node:path');
const OUT=process.argv[2],MODE=process.argv[3]||'all';
const ROOMS=['rom_mbath','rom_master','rom_gbath','rom_hall','rom_laundry','rom_kitchen','rom_dining','rom_kid','rom_child','rom_living','rom_balcony'];
async function present(page,ids){
 await page.locator('#presentationBtn').click({timeout:120000});
 await page.evaluate(ids=>{document.querySelectorAll('#presentationConfig input[type=checkbox]').forEach(i=>{const want=ids.includes(i.value);if(i.checked!==want){i.checked=want;i.dispatchEvent(new Event('change'));}});},ids);
 await page.getByRole('button',{name:'Iniciar presentación'}).click({timeout:120000});
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:60000});
}
const settle=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function goRoom(page,roomId){
 const i=await page.evaluate(id=>FloorPlanPresentation.plan.stops.findIndex(s=>s.roomId===id),roomId);
 await page.evaluate(i=>document.querySelectorAll('.presentation-stops button')[i].click(),i);
 await page.waitForFunction(i=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&document.querySelectorAll('.presentation-stops button')[i].classList.contains('on'),i,{timeout:60000});
 await settle(page);
}
const fn=`(${measure.toString()})`;
const regionFn=()=>{const st=document.querySelector('#stage').getBoundingClientRect(),b=document.querySelector('.presentation-card').getBoundingClientRect();const l=(b.left-st.left)/st.width,r=(b.right-st.left)/st.width,t=(b.top-st.top)/st.height,bb=(b.bottom-st.top)/st.height;return [[0,0,l,1],[r,0,1,1],[0,0,1,t],[0,bb,1,1]].map(x=>x.map(v=>Math.min(1,Math.max(0,v)))).sort((x,y)=>(y[2]-y[0])*(y[3]-y[1])-(x[2]-x[0])*(x[3]-x[1]))[0];};
const metric=(page,roomId)=>page.evaluate(([f,roomId,rf])=>{const region=eval(rf)(),m=eval(f);const full=m({roomId}),vis=m({roomId,region});return {...vis,full:{target:full.target,topOther:full.topOther,floorVisible:full.floorVisible},region,frame:View3D.presentationFrameInfo||null,section:document.querySelector('#presentationSection')?.hidden===false?document.querySelector('#presentationSection').textContent:null};},[fn,roomId,`(${regionFn.toString()})`]);
(async()=>{await fs.mkdir(OUT,{recursive:true});const env=await H.start();const report={stops:{},routes:{}};
 try{
  if(MODE!=='route')for(const vp of (process.env.VIEWPORTS||'1440x900,390x844,844x390').split(',').map(v=>{const [width,height]=v.split('x').map(Number);return {width,height};})){
   const size=`${vp.width}x${vp.height}`,{page,context,errors}=await H.page(env,vp);
   if(process.env.IRREGULAR)await page.evaluate(f=>{const p=eval(f)(FloorPlanReference);FloorPlanApp.importProject(p);},`(${require(path.join(__dirname,'..','..','..','tests','helpers','irregular-home.cjs')).toString()})`);
   await present(page,ROOMS);
   for(const id of ROOMS){await goRoom(page,id);const m=await metric(page,id);m.title=await page.locator('.presentation-card h2').textContent();report.stops[`${size}/${id}`]=m;
    await page.screenshot({path:path.join(OUT,`${size}-${id}.png`),timeout:180000});
    console.log(size,id,m.title,'visibleRegion target',m.target,'full',m.full.target,'other',JSON.stringify(m.topOther),'floorVis',m.floorVisible,'inFrame',m.floorInFrame,'pitch',m.pitchDownDeg,'h',m.height,'section',!!m.section);}
   report.stops[`${size}/errors`]=errors;await context.close();}
  if(MODE!=='stops')for(const id of ['rom_mbath','rom_master']){
   const vp={width:1440,height:900},dir=path.join(OUT,`video-route-${id}`),ctx0=Date.now(),{page,context,errors}=await H.page(env,vp,{video:dir});await present(page,[id]);await goRoom(page,id);
   const stopPose=await page.evaluate(()=>View3D.cameraState);await page.waitForTimeout(800);
   await page.evaluate(()=>{window.__samples=[];const tick=now=>{const r=View3D.presentationRouteInfo;if(r.status==='running')window.__samples.push({t:now,progress:r.progress,pose:View3D.cameraState,cut:View3D.presentationInspect().options.cut});if(!window.__done)requestAnimationFrame(tick);};requestAnimationFrame(tick);});
   const t0=Date.now();await page.locator('#presentationRoute').click();await page.evaluate(()=>{window.__started=true;});
   await page.waitForFunction(()=>View3D.presentationRouteInfo.status==='complete',null,{timeout:90000});const wall=Date.now()-t0;await page.waitForTimeout(2500);await page.evaluate(()=>{window.__done=true;});
   const samples=await page.evaluate(([f,id])=>{const m=eval(f);return window.__samples.map(s=>{const r=m({roomId:id,cols:48,rows:30,pose:s.pose,cut:s.cut});return {t:s.t,progress:s.progress,pos:s.pose.position,q:s.pose.quaternion,pitch:r.pitchDownDeg,h:r.height,target:r.target,nearWall:r.nearWall,nearFloor:r.nearFloor,median:r.medianHitM,floorShare:r.share};});},[fn,id]),info=await page.evaluate(()=>View3D.presentationRouteInfo),end=await page.evaluate(()=>View3D.cameraState);
   report.routes[id]={videoRouteStartSec:(t0-ctx0)/1000,info,wallMs:wall,samples,stopPose,endPose:end,errors};
   const pitches=samples.map(s=>s.pitch).sort((a,b)=>a-b),pct=q=>pitches[Math.floor(q*(pitches.length-1))];
   console.log('route',id,info.kind,info.code,'points',info.points.length,'len',info.lengthMm,'wallMs',wall,'frames',samples.length,'pitch p10/50/90',pct(.1),pct(.5),pct(.9),'nearWall>0.3 frames',samples.filter(s=>s.nearWall>.3).length,'target>0.3',samples.filter(s=>s.target>.3).length,'fps',(samples.length/((samples.at(-1).t-samples[0].t)/1000)).toFixed(1));
   await context.close();}
 }finally{await fs.writeFile(path.join(OUT,'report.json'),JSON.stringify(report,null,1));await env.close();}
})().catch(e=>{console.error(e);process.exit(1);});
