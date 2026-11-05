/* HV2 prototype sequence: salón → cocina on RUBIK's example home. NOT product code.
   usage: node sequence.cjs <out> stills|video [fps] [from] [to] */
const {start,openExample}=require('./harness.cjs');const fs=require('fs'),path=require('path');
const [out,mode='stills',fpsArg='24',fromArg,toArg]=process.argv.slice(2);const fps=Number(fpsArg);
const DURATION=13.0;
// Camera keys (world metres; RUBIK origin = plan centre). Salón → comedor → cocina, then the turn that prepares the next room.
const KEYS=[
 {t:0.0, pos:[4.25,1.60,1.80],tgt:[0.70,0.85,4.05]},
 {t:4.4, pos:[3.85,1.60,2.10],tgt:[0.60,0.85,3.90]},
 {t:7.2, pos:[2.20,1.60,3.20],tgt:[-3.70,0.95,1.90]},
 {t:10.2,pos:[0.25,1.60,2.05],tgt:[-5.00,1.00,1.10]},
 {t:13.0,pos:[-0.15,1.60,2.30],tgt:[-4.40,1.00,-0.80]}];
// Realism seeds: anchored on chosen furniture (fid) or on an architectural point (wall), each with its own moment.
const SEEDS=[
 // salón
 {fid:'obj_template-032',room:'rom_living',p:[2.45,0.46,4.78],t:0.9,vObj:0.95,vEnv:0.62,envDelay:0.9,noise:0.8,why:'sofá: el protagonista'},
 {fid:'obj_template-033',room:'rom_living',p:[1.35,0.44,3.52],t:1.75,vObj:0.55,vEnv:0.6,envDelay:0.5,noise:0.7,why:'mesa de centro y alfombra'},
 {room:'rom_living',p:[-1.05,1.55,3.6],t:2.35,vEnv:0.55,envDelay:0.0,noise:0.9,maxR:3.2,why:'muro del fondo: luz sobre el yeso'},
 {fid:'obj_template-031',room:'rom_living',p:[2.30,0.52,1.52],t:2.9,vObj:0.8,vEnv:0.55,envDelay:0.6,noise:0.7,why:'mueble de TV'},
 {fid:'obj_template-037',room:'rom_living',p:[-0.68,0.9,1.75],t:3.45,vObj:0.7,vEnv:0.5,envDelay:0.8,noise:0.6,maxR:2.0,why:'planta junto al paso al comedor'},
 {fid:'obj_template-034',room:'rom_living',p:[3.55,0.45,3.60],t:3.95,vObj:0.7,vEnv:0.55,envDelay:0.6,noise:0.6,why:'sillón'},
 // comedor y cocina
 {fid:'obj_template-024',room:'rom_dining',p:[-2.30,0.76,1.30],t:6.55,vObj:0.5,vEnv:0.55,envDelay:0.7,noise:0.7,why:'mesa de comedor'},
 {fid:'obj_template-023',room:'rom_dining',p:[-3.15,1.10,0.30],t:7.35,vObj:0.9,vEnv:0.5,envDelay:0.9,noise:0.6,maxR:2.4,why:'frigorífico de acero'},
 {fid:'obj_template-020',room:'rom_kitchen',p:[-4.40,0.92,2.40],t:7.95,vObj:0.7,vEnv:0.55,envDelay:0.6,noise:0.7,why:'encimera'},
 {fid:'obj_template-029',room:'rom_dining',p:[-2.40,0.80,2.50],t:8.6,vObj:0.7,vEnv:0.5,envDelay:0.8,noise:0.6,maxR:2.4,why:'aparador'},
 {fid:'obj_template-019',room:'rom_kitchen',p:[-5.60,0.92,1.20],t:9.25,vObj:0.7,vEnv:0.5,envDelay:0.6,noise:0.7,why:'frente de cocina'},
];
const DRESS={floors:{rom_living:'surface-oak-wood-planks',rom_dining:'surface-oak-wood-planks',rom_hall:'surface-oak-wood-planks',rom_kitchen:'surface-marble-01'},
 walls:{rom_kitchen:'surface-long-white-tiles'},
 feature:null};

const lerp=(a,b,s)=>a.map((v,i)=>v+(b[i]-v)*s);
// Time-parameterised cubic Hermite (C1 in time): tangents by finite differences over real seconds, zero at the start.
function tangent(i,key){const n=KEYS.length;if(i===0)return KEYS[0][key].map(()=>0);if(i===n-1)return KEYS[n-1][key].map((v,k)=>(v-KEYS[n-2][key][k])/(KEYS[n-1].t-KEYS[n-2].t));
 return KEYS[i][key].map((_,k)=>(KEYS[i+1][key][k]-KEYS[i-1][key][k])/(KEYS[i+1].t-KEYS[i-1].t));}
function herm(i,key,t){const a=KEYS[i],b=KEYS[i+1],dt=b.t-a.t,s=(t-a.t)/dt,s2=s*s,s3=s2*s,h00=2*s3-3*s2+1,h10=s3-2*s2+s,h01=-2*s3+3*s2,h11=s3-s2,ma=tangent(i,key),mb=tangent(i+1,key);
 return a[key].map((v,k)=>h00*v+h10*dt*ma[k]+h01*b[key][k]+h11*dt*mb[k]);}
function camAt(t){t=Math.max(0,Math.min(KEYS[KEYS.length-1].t,t));let i=KEYS.findIndex((k,j)=>j<KEYS.length-1&&t>=k.t&&t<=KEYS[j+1].t);if(i<0)i=KEYS.length-2;
 return {pos:herm(i,'pos',t),tgt:herm(i,'tgt',t)};}

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const h=await start();const {p,errors}=await openExample(h.browser,h.url);
 await p.waitForFunction(()=>window.FloorPlanSurfaces?.entries?.length>0,null,{timeout:60000});
 // QA-only dressing with RUBIK's own surface catalogue (never stored)
 const dressed=await p.evaluate((D)=>{const near=(pt,a,b)=>{const vx=b[0]-a[0],vy=b[1]-a[1],L=vx*vx+vy*vy,s=Math.max(0,Math.min(1,((pt[0]-a[0])*vx+(pt[1]-a[1])*vy)/L));return Math.hypot(pt[0]-a[0]-s*vx,pt[1]-a[1]-s*vy);};
  const log=[];const roomOf=id=>geometry.rooms.find(r=>r.id===id);
  for(const [rid,sid] of Object.entries(D.floors)){project=FloorPlanSurfaces.apply(project,FloorPlanSurfaces.get(sid),{kind:'floor',id:rid});log.push(['floor',rid,sid]);}
  const wallsOf=rid=>{const r=roomOf(rid);return project.walls.filter(w=>{const m=[(w.start.x+w.end.x)/2,(w.start.y+w.end.y)/2];return r.poly.some((q,i)=>near(m,q,r.poly[(i+1)%r.poly.length])<w.thicknessMm/2+40);});};
  for(const [rid,sid] of Object.entries(D.walls))for(const w of wallsOf(rid)){try{project=FloorPlanSurfaces.apply(project,FloorPlanSurfaces.get(sid),{kind:'wall',id:w.id});log.push(['wall',rid,w.id,sid]);}catch(e){log.push(['wall-skip',w.id,String(e.message)]);}}
  if(D.feature){const lr=roomOf(D.feature.room),ymin=Math.min(...lr.poly.map(q=>q[1]));
  for(const w of wallsOf(D.feature.room))if(Math.abs(w.start.y-ymin)<200&&Math.abs(w.end.y-ymin)<200){project=FloorPlanSurfaces.apply(project,FloorPlanSurfaces.get(D.feature.surface),{kind:'wall',id:w.id});log.push(['feature',w.id,D.feature.surface]);}}
  refreshProject();renderAll();window.View3D?.refreshSurfaces();return log;},DRESS);
 await p.evaluate(async()=>{await View3D.setPresentationLightPreset('warm');View3D.setSurfaceQuality('enhanced');View3D.setPresentationContactShadows(true);});
 await p.waitForTimeout(9000);
 await p.addScriptTag({url:h.url+'__poc/proto.js'});
 const info=await p.evaluate(()=>HV2.setup({width:1280,height:720,fov:55}));
 // seeds → uniforms; furniture that is not a protagonist lands whole when its room's front reaches it
 const furn=info.furniture,byFid=Object.fromEntries(furn.map(f=>[f.fid,f]));
 const roomIdx=Object.fromEntries(info.rooms.rooms.map(r=>[r.id,r.i]));
 const seeds=SEEDS.map(s=>({p:s.p,t:s.t,obj:s.fid?byFid[s.fid].i:0,room:roomIdx[s.room],vObj:s.vObj,vEnv:s.vEnv,envDelay:s.envDelay,maxR:s.maxR??7,noise:s.noise}));
 const anchored=new Set(SEEDS.filter(s=>s.fid).map(s=>s.fid));
 const roomOfPoint=await p.evaluate(F=>F.map(f=>{const c=[(f.min[0]+f.max[0])/2*1000+__hv2().OX,(f.min[2]+f.max[2])/2*1000+__hv2().OY];const inside=(q,P)=>{let k=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])k=!k;}return k;};return (geometry.rooms.find(r=>inside(c,r.poly))||{}).id||null;}),furn);
 let jit=7;const rnd=()=>{jit=(jit*16807)%2147483647;return jit/2147483647;};
 const objects=[];furn.forEach((f,k)=>{if(anchored.has(f.fid))return;const room=roomOfPoint[k];const cand=SEEDS.filter(s=>s.room===room);if(!cand.length)return;
  let best=null;for(const s of cand){const q=[Math.max(f.min[0],Math.min(f.max[0],s.p[0])),Math.max(f.min[1],Math.min(f.max[1],s.p[1])),Math.max(f.min[2],Math.min(f.max[2],s.p[2]))];const d=Math.hypot(q[0]-s.p[0],q[2]-s.p[2]);const t=s.t+(s.envDelay??0.6)+d/s.vEnv+0.15+rnd()*0.45;if(!best||t<best.t)best={i:f.i,p:q,t,fid:f.fid,room};}
  objects.push(best);});
 await p.evaluate(([S,O])=>{HV2.setSeeds(S);HV2.setObjects(O);HV2.setParams({uSkyT:4.4});},[seeds,objects]);
 fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify({keys:KEYS,seeds:SEEDS,objects,dressed,errors},null,1));
 const times=mode==='stills'?[0.4,1.6,3.0,4.8,6.4,8.0,9.6,12.2]:Array.from({length:Math.round(DURATION*fps)},(_,i)=>i/fps);
 const from=Number(fromArg||0),to=Number(toArg||times.length);
 const label=mode==='stills';
 for(let i=from;i<Math.min(to,times.length);i++){const t=times[i];const c=camAt(t);const t0=Date.now();
  await p.evaluate(([c,t])=>{HV2.pose(c.pos,c.tgt);HV2.frame(t,'comp');},[c,t]);
  const file=path.join(out,mode==='stills'?`still-${t.toFixed(1).padStart(4,'0')}.png`:`f${String(i).padStart(4,'0')}.png`);
  await p.screenshot({path:file,clip:{x:0,y:0,width:1280,height:720}});
  if(i%12===0||label)console.log(i,t.toFixed(2),Date.now()-t0,'ms');}
 if(mode==='stills'){for(const m of ['real','drawn']){const c=camAt(0.4);await p.evaluate(([c,m])=>{HV2.pose(c.pos,c.tgt);HV2.frame(0,m);},[c,m]);await p.screenshot({path:path.join(out,`ref-${m}-A.png`),clip:{x:0,y:0,width:1280,height:720}});
   const d=camAt(10.2);await p.evaluate(([c,m])=>{HV2.pose(c.pos,c.tgt);HV2.frame(0,m);},[d,m]);await p.screenshot({path:path.join(out,`ref-${m}-D.png`),clip:{x:0,y:0,width:1280,height:720}});}}
 console.log('errors',errors.slice(0,5));await h.close();})();
