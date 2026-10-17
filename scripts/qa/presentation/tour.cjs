// R10 virtual-time recording. Usage: node tour.cjs <outDir> <W>x<H> [roomId=rom_mbath] [rooms=rom_mbath,rom_master]
// REPO=<checkout> records another revision. The MP4 shows the motion at 1x; it does not measure real frame rate.
// Records at virtual 30 fps: overview -> room stop -> "Recorrer desde entrada" -> arrival/return.
const H=require('./harness.cjs'),{Recorder}=require('./vrec.cjs'),measure=require('./metric.cjs'),fs=require('node:fs/promises'),path=require('node:path');
const [OUT,SIZE,ROOM='rom_mbath',ROOMS='rom_mbath,rom_master']=process.argv.slice(2),[W,Hh]=SIZE.split('x').map(Number);
const fn=`(${measure.toString()})`;
const sample=()=>({pose:View3D.cameraState,cut:View3D.presentationInspect()?.options?.cut,route:View3D.presentationRouteInfo.status,progress:View3D.presentationRouteInfo.progress??null,moving:document.querySelector('#presentationOverlay').dataset.moving,title:document.querySelector('.presentation-card h2')?.textContent,routeText:document.querySelector('#presentationRouteStatus')?.textContent||''});
(async()=>{await fs.mkdir(OUT,{recursive:true});const env=await H.start();try{
 const {page,context,errors}=await H.page(env,{width:W,height:Hh});
 await page.locator('#presentationBtn').click();
 await page.evaluate(ids=>{document.querySelectorAll('#presentationConfig input[type=checkbox]').forEach(i=>{const want=ids.includes(i.value);if(i.checked!==want){i.checked=want;i.dispatchEvent(new Event('change'));}});},ROOMS.split(','));
 await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&View3D.presentationLight.status!=='loading',null,{timeout:90000});
 await page.waitForTimeout(1500);
 const rec=new Recorder(page,path.join(OUT,`frames-${SIZE}`));await rec.init();
 const project0=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await rec.hold(1,sample);
 await page.evaluate(id=>{const i=FloorPlanPresentation.plan.stops.findIndex(s=>s.roomId===id);document.querySelectorAll('.presentation-stops button')[i].click();},ROOM);
 await rec.frame(sample);await rec.until(()=>document.querySelector('#presentationOverlay').dataset.moving==='false',sample,10);
 await rec.hold(1.5,sample);const stopFrame=rec.n-1;
 await page.screenshot({path:path.join(OUT,`${SIZE}-${ROOM}-stop.png`)});
 const stopMetric=await page.evaluate(([f,id])=>eval(f)({roomId:id}),[fn,ROOM]);
 await page.evaluate(()=>document.querySelector('#presentationRoute').click());
 await rec.frame(sample);const ok=await rec.until(()=>['complete','off','unavailable'].includes(View3D.presentationRouteInfo.status),sample,60);
 await rec.until(()=>document.querySelector('#presentationOverlay').dataset.moving!=='true'&&!View3D.lifecycleMetrics.flying,sample,10);
 await rec.hold(2,sample);
 const video=await rec.encode(path.join(OUT,`${SIZE}-${ROOM}-tour.mp4`));
 const metrics=await page.evaluate(([f,id,log])=>{const m=eval(f);return log.map(s=>{const r=m({roomId:id,cols:48,rows:30,pose:s.pose,cut:s.cut});return {frame:s.frame,t:s.t,route:s.route,progress:s.progress,moving:s.moving,title:s.title,cut:s.cut,pos:s.pose.position.map(v=>+v.toFixed(3)),pitch:r.pitchDownDeg,h:r.height,target:r.target,topOther:r.topOther,nearWall:r.nearWall,nearFloor:r.nearFloor,median:r.medianHitM,floorVisible:r.floorVisible};});},[fn,ROOM,rec.log]);
 const routeInfo=await page.evaluate(()=>View3D.presentationRouteInfo),project1=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await fs.writeFile(path.join(OUT,`${SIZE}-${ROOM}-tour.json`),JSON.stringify({size:SIZE,room:ROOM,rooms:ROOMS,fps:30,frames:rec.n,stopFrame,completed:ok,routeInfo,stopMetric,projectUnchanged:project0===project1,errors,metrics},null,1));
 const route=metrics.filter(m=>m.route==='running');const pct=(a,q)=>{a=[...a].sort((x,y)=>x-y);return a[Math.floor(q*(a.length-1))];};
 console.log(SIZE,ROOM,'frames',rec.n,'stop target',stopMetric.target,'other',JSON.stringify(stopMetric.topOther),'floorVis',stopMetric.floorVisible,'| route',routeInfo.kind,routeInfo.code,'runFrames',route.length,'pitch p50/p90/max',pct(route.map(m=>m.pitch),.5),pct(route.map(m=>m.pitch),.9),Math.max(...route.map(m=>m.pitch)),'nearWall>.3',route.filter(m=>m.nearWall>.3).length,'nearFloor>.4',route.filter(m=>m.nearFloor>.4).length,'errors',errors.length,'unchanged',project0===project1);
 await context.close();
}finally{await env.close();}})().catch(e=>{console.error(e);process.exit(1);});
