// Section → Spatial Visit V1: the room-visit narrative only times the route Rubik validates (presentation-route.js).
// Pure, deterministic, reversible; it never goes below the safe height except straight down onto the landing point,
// and it ends exactly on the choreography's arrival view.
const test=require('node:test'),assert=require('node:assert/strict');
const Story=require('../js/presentation-story-core.js'),Route=require('../js/presentation-route.js'),Core=require('../js/project-core.js'),reference=require('../js/reference-project.js');
const geometry=Core.geometry(reference);
// World mapping as View3D does it (plan mm → metres around the plan centre, plan y → world z).
const wx=x=>(x-geometry.center.x)/1000,wz=y=>(y-geometry.center.y)/1000;
function realInput(roomId){
 const plan=Route.plan(reference,geometry,roomId);assert.equal(plan.kind,'interior',plan.reason);
 const moves=Route.choreography(reference,geometry,roomId,plan,{hfovDeg:70,vfovDeg:55});
 const samples=moves.samples.map(q=>({t:q.t,x:wx(q.x),z:wz(q.y),yaw:q.cameraYaw,pitchDeg:q.cameraPitchDeg}));
 return {plan,moves,input:{start:{position:[8,14,12],target:[0,0,0],fov:40},samples,above:3.6,eye:moves.eyeHeight||1.5,walkFov:55,arrival:{yaw:moves.arrival.cameraYaw,pitchDeg:moves.arrival.cameraPitchDeg}}};
}
test('real route of the reference home: deterministic, phases in order, ends on the arrival view',()=>{
 const {input,moves}=realInput('rom_master'),a=Story.create('room-visit',input),b=Story.create('room-visit',input);
 for(const p of [0,.13,.25,.5,.75,.9,1])assert.deepEqual(a.stateAt(p),b.stateAt(p),'same p, same state');
 const order=['overview','approach','descend','close','walk','turn','arrive','room'];let last=0;
 for(let i=0;i<=400;i++){const ph=a.stateAt(i/400).phase,k=order.indexOf(ph);assert.ok(k>=last,`phase order at ${i/400}: ${ph}`);last=k;}
 const end=a.stateAt(1),arr=moves.samples.at(-1);
 assert.deepEqual(end.position.map(v=>+v.toFixed(6)),[wx(arr.x),input.eye,wz(arr.y)].map(v=>+v.toFixed(6)),'arrival at eye height on the last route sample');
 const look=Math.atan2(end.target[2]-end.position[2],end.target[0]-end.position[0]);assert.ok(Math.abs(Math.atan2(Math.sin(look-moves.arrival.cameraYaw),Math.cos(look-moves.arrival.cameraYaw)))<1e-6,'arrival yaw');
 assert.equal(end.fullHeight,true);assert.equal(a.stateAt(0).fullHeight,false);
 assert.ok(a.info.playMs>4000,'long enough to read');
});
test('never below the safe height off the landing column; full height only at eye level',()=>{
 const {input}=realInput('rom_kid'),n=Story.create('room-visit',input),first=input.samples[0];
 for(let i=0;i<=600;i++){const s=n.stateAt(i/600);
  if(s.phase==='approach')assert.ok(s.position[1]>=Math.min(input.start.position[1],input.above)-1e-9,'approach stays at or above the safe height');
  if(s.phase==='descend'){assert.ok(Math.abs(s.position[0]-first.x)<1e-9&&Math.abs(s.position[2]-first.z)<1e-9,'straight down onto the landing point');}
  if(s.fullHeight)assert.ok(Math.abs(s.position[1]-input.eye)<1e-9,'walls close only at eye height');
  if(['walk','turn','arrive','room'].includes(s.phase))assert.equal(s.position[1],input.eye);}
});
test('every walking position is a validated route point (clearance kept by the route module)',()=>{
 const {input,plan}=realInput('rom_master'),n=Story.create('room-visit',input);
 const path=plan.path.map(p=>[wx(p.x),wz(p.y)]),near=(x,z)=>Math.min(...path.map(([a,b])=>Math.hypot(a-x,b-z)));
 for(let i=0;i<=400;i++){const s=n.stateAt(i/400);if(s.phase==='walk')assert.ok(near(s.position[0],s.position[2])<.06,`on the route at ${i/400}`);}
});
test('reverse and seek give the same states as forward',()=>{
 const {input}=realInput('rom_master'),n=Story.create('room-visit',input),fw=[],bw=[];
 for(let i=0;i<=50;i++)fw.push(n.stateAt(i/50));for(let i=50;i>=0;i--)bw.unshift(n.stateAt(i/50));assert.deepEqual(fw,bw);
});
test('refuses without a validated route or valid heights (fallback is the caller\'s, honestly)',()=>{
 const ok={start:{position:[0,10,10],target:[0,0,0],fov:40},samples:[{t:0,x:0,z:0,yaw:0,pitchDeg:8},{t:1,x:1,z:0,yaw:0,pitchDeg:8}],above:3,eye:1.5};
 assert.throws(()=>Story.create('room-visit',{...ok,samples:[]}),/ruta interior validada/);
 assert.throws(()=>Story.create('room-visit',{...ok,samples:[{t:0,x:NaN,z:0,yaw:0,pitchDeg:0},ok.samples[1]]}),/ruta interior validada/);
 assert.throws(()=>Story.create('room-visit',{...ok,above:1}),/Alturas/);
 assert.throws(()=>Story.create('room-visit',{...ok,start:null}),/vista general/);
 assert.ok(Story.NARRATIVES.includes('room-visit'));assert.equal(Story.SCENE_MS['room-visit'],14000);
});
test('a home without an identified entrance gives no route: the chapter must not be offered',()=>{
 const f1b=require('../docs/contracts/examples/floorplan-project-v1.f1b.example.json'),g=Core.geometry(f1b);
 const r=Route.plan(f1b,g,f1b.rooms[0].id);assert.notEqual(r.kind,'interior');assert.ok(r.reason);
});
test('rooms the route module cannot reach from inside (kitchen, balconies of the reference) are not visitable',()=>{
 for(const id of ['rom_kitchen','rom_balcony','rom_bay1']){const r=Route.plan(reference,geometry,id);assert.notEqual(r.kind,'interior',id);assert.match(r.reason,/aéreo|recorrido/);}
});
