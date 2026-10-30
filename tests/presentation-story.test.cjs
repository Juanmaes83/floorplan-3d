const {test}=require('node:test');
const assert=require('node:assert/strict');
const Story=require('../js/presentation-story-core.js');

// A 10 × 7 m home and the overview pose the presentation would compute for it (direction .42/.84/.34, fov 45).
const corners=[[-5,-3.5],[5,-3.5],[5,3.5],[-5,3.5]];
const dir=(()=>{const l=Math.hypot(.42,.84,.34);return [.42/l,.84/l,.34/l];})();
const end={target:[0,0,0],position:dir.map(v=>v*18),fov:45};
const input={corners,wallTop:2.8,end,aspect:16/9,region:null,base:{near:.05,far:300}};
const close=(a,b,eps=1e-9)=>Math.abs(a-b)<=eps;
const sameState=(a,b,eps=1e-9)=>['p','wallScale','lens','fov','near','far','distance'].every(k=>close(a[k],b[k],eps))&&a.position.every((v,i)=>close(v,b.position[i],eps))&&a.target.every((v,i)=>close(v,b.target[i],eps));
// Screen projection of a world point for a camera at `position` looking at `target` (world up +y).
function project(state,point,aspect){
 const f=[0,1,2].map(i=>state.target[i]-state.position[i]),fl=Math.hypot(...f),fn=f.map(v=>v/fl);
 let r=[fn[1]*0-fn[2]*1,fn[2]*0-fn[0]*0,fn[0]*1-fn[1]*0];const rl=Math.hypot(...r);r=r.map(v=>v/rl);
 const u=[r[1]*fn[2]-r[2]*fn[1],r[2]*fn[0]-r[0]*fn[2],r[0]*fn[1]-r[1]*fn[0]];
 const v=[0,1,2].map(i=>point[i]-state.position[i]),z=v.reduce((n,x,i)=>n+x*fn[i],0),t=Math.tan(state.fov*Math.PI/360);
 return {x:v.reduce((n,x,i)=>n+x*r[i],0)/z/(t*aspect),y:v.reduce((n,x,i)=>n+x*u[i],0)/z/t,z};
}

test('p = 1 is exactly the overview pose, lens and the view near/far (no jump into the presentation)',()=>{
 const s=Story.create('plan-reveal',input).stateAt(1);
 assert.deepEqual(s.position,end.position);assert.deepEqual(s.target,end.target);
 assert.equal(s.fov,45);assert.equal(s.wallScale,1);assert.equal(s.near,.05);assert.equal(s.far,300);assert.equal(s.phase,'3d');
});

test('p = 0 is the plan: seen from above with a narrow, derived lens and flattened walls',()=>{
 const n=Story.create('plan-reveal',input),s=n.stateAt(0);
 assert.equal(s.phase,'plan');assert.ok(s.wallScale<.02,'walls flattened to a line');
 assert.ok(s.fov>=1.5&&s.fov<=8,`narrow lens ${s.fov}`);
 // Derived flatness: the camera is at least 100 × the wall top away (≤ 1 % perspective between wall foot and top).
 assert.ok(s.distance>=100*2.8-1e-6||s.fov===1.5,`distance ${s.distance}`);
 const off=[0,1,2].map(i=>s.position[i]-s.target[i]),elev=Math.asin(off[1]/Math.hypot(...off))*180/Math.PI;assert.ok(elev>89.5,`from above (${elev}°)`);
 // Same azimuth as the end view: the transition tilts, it never spins.
 assert.ok(close(Math.atan2(off[2],off[0]),Math.atan2(dir[2],dir[0]),1e-6));
 // Every plan corner fits the screen with a margin.
 for(const [x,z] of corners){const q=project(s,[x,0,z],16/9);assert.ok(Math.abs(q.x)<.95&&Math.abs(q.y)<.95,`corner ${x},${z} → ${q.x.toFixed(3)},${q.y.toFixed(3)}`);}
 // near/far keep the whole home inside the depth range.
 for(const [x,z] of corners)for(const h of [0,2.8]){const q=project(s,[x,h,z],16/9);assert.ok(q.z>s.near&&q.z<s.far);}
});

test('checkpoints 0, .25, .5, .75, 1 are monotonic: walls rise, lens opens, camera approaches',()=>{
 const n=Story.create('plan-reveal',input),states=n.checkpoints.map(p=>n.stateAt(p));
 assert.deepEqual(n.checkpoints,[0,.25,.5,.75,1]);
 for(let i=1;i<states.length;i++){
  assert.ok(states[i].wallScale>=states[i-1].wallScale,'walls never sink while p grows');
  assert.ok(states[i].fov>=states[i-1].fov-1e-9,'lens never closes while p grows');
  assert.ok(states[i].distance<=states[i-1].distance+1e-9,'camera never moves away while p grows');
 }
 assert.ok(states[2].wallScale>.8,'walls almost complete at the middle');assert.equal(states[3].wallScale,1);
 // Every state keeps the plan corners on screen (framing is preserved during the dolly zoom).
 for(const s of states)for(const [x,z] of corners){const q=project(s,[x,0,z],16/9);assert.ok(q.z>0&&Math.abs(q.x)<1.05&&Math.abs(q.y)<1.05,`p=${s.p} corner ${x},${z} → ${q.x.toFixed(2)},${q.y.toFixed(2)}`);}
});

test('reversible and deterministic: 0→1, 1→0 and 0→1→0 visit identical states; a new narrative gives the same',()=>{
 const n=Story.create('plan-reveal',input),steps=Array.from({length:101},(_,i)=>i/100);
 const forward=steps.map(p=>n.stateAt(p)),backward=[...steps].reverse().map(p=>n.stateAt(p)).reverse(),again=steps.map(p=>n.stateAt(p));
 forward.forEach((s,i)=>{assert.ok(sameState(s,backward[i]),`p=${steps[i]} differs going back`);assert.ok(sameState(s,again[i]));});
 const other=Story.create('plan-reveal',structuredClone(input));
 steps.forEach(p=>assert.ok(sameState(other.stateAt(p),n.stateAt(p))));
 // Continuity: no jump between neighbouring steps (fine sampling near both ends).
 for(const p of [.999,.9999])assert.ok(Math.hypot(...[0,1,2].map(i=>n.stateAt(p).position[i]-end.position[i]))<.05);
 assert.ok(close(n.stateAt(.0001).distance,n.stateAt(0).distance,1e-6));
 // Out-of-range input is clamped, never extrapolated.
 assert.ok(sameState(n.stateAt(-3),n.stateAt(0)));assert.ok(sameState(n.stateAt(7),n.stateAt(1)));
});

test('derived from the project, not from the example: other sizes, aspect and a card region',()=>{
 const small=Story.create('plan-reveal',{...input,corners:[[0,0],[3,0],[3,2.4],[0,2.4]],wallTop:2.5,end:{target:[1.5,0,1.2],position:[1.5+dir[0]*7,dir[1]*7,1.2+dir[2]*7],fov:45}});
 const big=Story.create('plan-reveal',{...input,corners:[[-20,-12],[20,-12],[20,12],[-20,12]],wallTop:3.2,end:{target:[0,0,0],position:dir.map(v=>v*60),fov:45}});
 assert.ok(small.info.frameStart<big.info.frameStart);assert.notEqual(small.info.fovStart,big.info.fovStart);
 // Portrait phone with the card at the bottom: the plan sits in the free top region.
 const phone=Story.create('plan-reveal',{...input,aspect:390/844,region:[0,0,1,.55]}),s=phone.stateAt(0);
 for(const [x,z] of corners){const q=project(s,[x,0,z],390/844);assert.ok(q.y>1-2*.55-.01,`corner above the card (${q.y.toFixed(3)})`);assert.ok(Math.abs(q.x)<1);}
 assert.deepEqual(phone.stateAt(1).position,end.position);
});

test('rejects missing facts with a readable error and keeps the input untouched; unknown narratives fail',()=>{
 assert.throws(()=>Story.create('plan-reveal',{...input,corners:[[0,0]]}),/contorno/);
 assert.throws(()=>Story.create('plan-reveal',{...input,end:{position:[0,1,0],target:[0,0,NaN],fov:45}}),/vista general/);
 assert.throws(()=>Story.create('section-sweep',input),/desconocida/);
 const copy=structuredClone(input);Story.create('plan-reveal',input).stateAt(.5);assert.deepEqual(input,copy);
 assert.deepEqual(Story.NARRATIVES,['plan-reveal']);
});

test('play time is proportional to the distance in p; reduced motion is immediate',()=>{
 assert.equal(Story.playMs(0,1),6000);assert.equal(Story.playMs(1,0),6000);assert.equal(Story.playMs(.5,1),3000);
 assert.equal(Story.playMs(0,1,{reduced:true}),0);assert.equal(Story.playMs(.3,.3),0);
});
