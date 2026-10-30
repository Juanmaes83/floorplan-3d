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
 // North up, as the 2D editor: the camera sits on +z of the target (top of the screen = top of the plan).
 assert.ok(close(Math.atan2(off[2],off[0]),Math.PI/2,1e-6));assert.ok(s.furnitureScale<.01,'furniture flattened as in the plan');
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
 assert.ok(Story.NARRATIVES.includes('plan-reveal'));
});

test('play time is proportional to the distance in p; reduced motion is immediate',()=>{
 assert.equal(Story.playMs(0,1),6000);assert.equal(Story.playMs(1,0),6000);assert.equal(Story.playMs(.5,1),3000);
 assert.equal(Story.playMs(0,1,{reduced:true}),0);assert.equal(Story.playMs(.3,.3),0);
});

// FT3D-1b «Entrar en la estancia»: overview → the presentation's own room pose, walls down to its section.
const overviewPose={position:dir.map(v=>v*18),target:[0,0,0],fov:45},roomPose={position:[3.2,4.1,2.6],target:[1.6,.4,1.1],fov:45};
const descent={start:overviewPose,end:roomPose,wallScaleEnd:1.2/2.8,base:{near:.05,far:300}};
test('room descent: p = 0 is the overview, p = 1 is exactly the room stop pose with the walls at its section',()=>{
 const n=Story.create('room-descent',descent),a=n.stateAt(0),b=n.stateAt(1);
 assert.deepEqual(a.position,overviewPose.position);assert.deepEqual(a.target,overviewPose.target);assert.equal(a.wallScale,1);assert.equal(a.phase,'overview');
 assert.deepEqual(b.position,roomPose.position);assert.deepEqual(b.target,roomPose.target);assert.equal(b.fov,45);assert.equal(b.phase,'room');
 // At p = 1 the real section is on (the lowered walls handed over to it) and the walls are not scaled.
 assert.equal(b.section,true);assert.equal(b.wallScale,1);assert.equal(a.section,false);
 assert.equal(b.near,.05);assert.equal(b.far,300);
 // Every state carries its camera distance (View3D keeps the orbit limit above it).
 for(const p of [0,.3,.7,1]){const st=n.stateAt(p);assert.ok(close(st.distance,Math.hypot(...[0,1,2].map(k=>st.position[k]-st.target[k])),1e-9));}
 // A room framed at full wall height keeps the walls.
 const full=Story.create('room-descent',{...descent,wallScaleEnd:1});assert.equal(full.stateAt(.6).wallScale,1);assert.equal(full.stateAt(1).section,false);
 // The hand-over to the section happens once, at the height of the section, and goes back below it.
 const n2=Story.create('room-descent',descent);assert.ok(close(n2.stateAt(.7499).wallScale,1.2/2.8,1e-3));assert.equal(n2.stateAt(.7499).section,false);assert.equal(n2.stateAt(.75).section,true);
});
test('room descent: the camera descends along one arc (as the editor flights), walls go down monotonically, reversible',()=>{
 const n=Story.create('room-descent',descent),steps=Array.from({length:101},(_,i)=>i/100),states=steps.map(p=>n.stateAt(p));
 for(let i=1;i<states.length;i++){
  assert.ok(states[i].position[1]<=states[i-1].position[1]+1e-9,'never climbs');
  const h=st=>st.section?1.2/2.8:st.wallScale;assert.ok(h(states[i])<=h(states[i-1])+1e-12,'walls never rise while entering');
  // Continuity: no step longer than 6 % of the whole travel.
  assert.ok(Math.hypot(...[0,1,2].map(k=>states[i].position[k]-states[i-1].position[k]))<=.06*n.info.travel+1e-9);
 }
 const back=[...steps].reverse().map(p=>n.stateAt(p)).reverse();
 states.forEach((s,i)=>assert.ok(sameState({...s,lens:0,distance:0},{...back[i],lens:0,distance:0})));
 // Same distance to the target as the editor's spherical tween at the middle.
 const mid=n.stateAt(.5),r=Math.hypot(...[0,1,2].map(k=>mid.position[k]-mid.target[k])),r0=18,r1=Math.hypot(1.6,3.7,1.5);
 assert.ok(close(r,(r0+r1)/2,1e-9));
});
test('room descent: play time follows the travel within bounds; missing poses fail readably',()=>{
 const near=Story.create('room-descent',{...descent,start:{...roomPose,position:[3.3,4.2,2.7]}}),far=Story.create('room-descent',{...descent,start:{...overviewPose,position:dir.map(v=>v*60)}});
 assert.equal(near.info.playMs,1800);assert.equal(far.info.playMs,4200);
 assert.throws(()=>Story.create('room-descent',{...descent,end:{position:[0,0,0],target:[0,NaN,0],fov:45}}),/estancia/);
 assert.deepEqual(Story.NARRATIVES,['plan-reveal','room-descent']);
});
test('from the 2D editor view: p = 0 keeps its centre and framed height; the view turns once, smoothly, to the overview',()=>{
 const start={target:[1.3,0,-.7],frameHeight:12.4},n=Story.create('plan-reveal',{...input,start}),a=n.stateAt(0);
 assert.deepEqual(a.target,[1.3,0,-.7]);assert.ok(close(a.frameHeight,12.4,1e-9));assert.equal(n.info.fromEditorView,true);
 // The same image as the editor: a flattened plan framed with the same height around the same centre.
 const t=Math.tan(a.fov*Math.PI/360);assert.ok(close(2*a.distance*t,12.4,1e-9));
 const az=st=>{const o=[0,1,2].map(i=>st.position[i]-st.target[i]);return Math.atan2(o[2],o[0]);};
 const steps=Array.from({length:101},(_,i)=>i/100).map(p=>n.stateAt(p)),turn=n.info.turnDeg*Math.PI/180;
 assert.ok(Math.abs(n.info.turnDeg)<=180);
 for(let i=1;i<steps.length;i++){const d=Math.atan2(Math.sin(az(steps[i])-az(steps[i-1])),Math.cos(az(steps[i])-az(steps[i-1])));assert.ok(d*Math.sign(turn)>=-1e-9,'turns one way only');assert.ok(Math.abs(d)<.12,'no sudden turn');}
 assert.deepEqual(n.stateAt(1).position,end.position);assert.equal(n.stateAt(1).furnitureScale,1);
 for(let i=1;i<steps.length;i++)assert.ok(steps[i].furnitureScale>=steps[i-1].furnitureScale);
 // An invalid start is ignored (derived framing), never trusted.
 assert.equal(Story.create('plan-reveal',{...input,start:{target:[NaN,0,0],frameHeight:3}}).info.fromEditorView,false);
});

// FT3D-2: a story is one progress over a sequence of narratives.
test('sequence: P ↔ (scene, local p) are pure and inverse; boundaries go to the next scene; shares follow the weights',()=>{
 const seq=Story.sequence([6000,3500,6000,3500]);
 assert.equal(seq.count,4);assert.deepEqual(seq.locate(0),{i:0,p:0});assert.deepEqual(seq.locate(1),{i:3,p:1});
 assert.ok(close(seq.starts[1],6000/19000,1e-12));assert.deepEqual(seq.locate(seq.starts[1]),{i:1,p:0});
 for(let k=0;k<=1000;k++){const P=k/1000,{i,p}=seq.locate(P);assert.ok(close(seq.at(i,p),P,1e-12),`P=${P}`);assert.ok(p>=0&&p<=1);}
 for(let i=0;i<4;i++)for(const p of [0,.3,.999]){const P=seq.at(i,p),l=seq.locate(P);assert.equal(l.i,i);assert.ok(close(l.p,p,1e-9));}
 // Monotonic: scene index never decreases as P grows.
 let last=0;for(let k=0;k<=1000;k++){const {i}=seq.locate(k/1000);assert.ok(i>=last);last=i;}
 assert.deepEqual(seq.locate(-2),{i:0,p:0});assert.deepEqual(seq.locate(9),{i:3,p:1});
 assert.equal(Story.sequence([1]).locate(.4).p,.4);
 assert.throws(()=>Story.sequence([]),/escenas/);
 assert.ok(Story.SCENE_MS['plan-reveal']>0&&Story.SCENE_MS['room-descent']>0);
});
