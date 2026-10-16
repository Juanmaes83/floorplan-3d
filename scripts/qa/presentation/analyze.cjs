// Usage: node analyze.cjs <tour.json>  -> per-phase motion/composition statistics of a virtual-time recording
const fs=require('node:fs');const d=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const m=d.metrics,fps=d.fps||30;
const run=m.filter(x=>x.route==='running');if(!run.length){console.log('no route frames');process.exit(0);}
const r=d.routeInfo,t0=run[0].t;
const turnMs=r.walkMs?Math.max(0,r.durationMs-(1700+r.walkMs+1300+800+1000)):0;
const phases=r.phases?r.phases.map(p=>[p.name,p.ms]):r.walkMs?[['descend',1700],['walk',r.walkMs],...(turnMs>1?[['turn',turnMs]]:[]),['arrive',1300],['rise',800],['return',1000]]:[['walk',(run.at(-1).t-t0)*1000]];
const phaseOf=t=>{let s=0;for(const [n,dur] of phases){if((t-t0)*1000<s+dur)return n;s+=dur;}return phases.at(-1)[0];};
const yawPitch=q=>{const [x,y,z,w]=q,f=[-(2*(x*z+w*y)),-(2*(y*z-w*x)),-(1-2*(x*x+y*y))];return {yaw:Math.atan2(f[2],f[0]),pitch:Math.asin(-f[1])*180/Math.PI};};
const pct=(a,q)=>{a=[...a].sort((x,y)=>x-y);return a.length?+a[Math.floor(q*(a.length-1))].toFixed(2):null;};
const stats={};let maxJump=0,jumpAt=null;
for(let i=1;i<m.length;i++){const a=m[i-1].pos,b=m[i].pos,dj=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);if(dj>maxJump){maxJump=dj;jumpAt=m[i].frame;}}
const pitchOff=r.viewOffset?.pitchDeg||0;run.forEach(x=>{x.viewPitch=+(x.pitch-pitchOff).toFixed(2);});
for(const [name] of phases){const f=run.filter(x=>phaseOf(x.t)===name);if(!f.length)continue;
 const sp=[],yr=[];for(let i=1;i<f.length;i++){const a=f[i-1],b=f[i],dt=b.t-a.t;if(dt<=0)continue;sp.push(Math.hypot(b.pos[0]-a.pos[0],b.pos[2]-a.pos[2])/dt);}
 stats[name]={frames:f.length,seconds:+(f.length/fps).toFixed(2),eyeH:[pct(f.map(x=>x.h),0),pct(f.map(x=>x.h),1)],pitchP50:pct(f.map(x=>x.pitch),.5),pitchP95:pct(f.map(x=>x.pitch),.95),pitchMax:pct(f.map(x=>x.pitch),1),viewPitchP50:pct(f.map(x=>x.viewPitch),.5),viewPitchP95:pct(f.map(x=>x.viewPitch),.95),viewPitchMax:pct(f.map(x=>x.viewPitch),1),framesViewPitchOver20:f.filter(x=>x.viewPitch>20.05).length,
  framesPitchOver20:f.filter(x=>x.pitch>20).length,framesWallClose30:f.filter(x=>x.nearWall>.3).length,targetP50:pct(f.map(x=>x.target),.5),targetMax:pct(f.map(x=>x.target),1),speedMax:pct(sp,1),speedP50:pct(sp,.5)};}
console.log(JSON.stringify({size:d.size,room:d.room,kind:r.kind,code:r.code,viewOffset:r.viewOffset||null,routeSeconds:+(run.length/fps).toFixed(2),lengthMm:r.lengthMm,walkFov:r.walkFov,closeShare:r.closeShare,maxFrameJumpM:+maxJump.toFixed(3),maxJumpFrame:jumpAt,stopMetric:{target:d.stopMetric.target,topOther:d.stopMetric.topOther,floorVisible:d.stopMetric.floorVisible},projectUnchanged:d.projectUnchanged,errors:d.errors,phases:stats},null,1));
