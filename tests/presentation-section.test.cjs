// FT3D-3: the dynamic section — pure descriptor (FloorPlanPresentationSection) and the «section-open» narrative
// (FloorPlanPresentationStory). Contract §4, §6, §9, §14 (geometric cases), §15.
const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../js/presentation-section-core.js'),Story=require('../js/presentation-story-core.js'),ref=require('../js/reference-project.js');
const OVERVIEW=[.42,.84,.34];
const rect=(id,x0,y0,x1,y1)=>({id,polygon:[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}]});
let wid=0;const wall=(x0,y0,x1,y1,extra={})=>({id:'w'+(++wid),start:{x:x0,y:y0},end:{x:x1,y:y1},thicknessMm:200,heightMm:2700,status:'existing',...extra});
const box=(x0,y0,x1,y1)=>[wall(x0,y0,x1,y0),wall(x1,y0,x1,y1),wall(x1,y1,x0,y1),wall(x0,y1,x0,y0)];
const proj=(walls,rooms=[],openings=[])=>({walls,rooms,openings,defaults:{wallHeightMm:2800}});
// Three bands along y (normal of an x-section): a thin room at each end, and a middle room placed where wanted.
function bands(middle){const rooms=[rect('a',0,0,12000,500),rect('c',0,9500,12000,10000)];if(middle)rooms.push(rect('m',0,middle[0],12000,middle[1]));return proj([],rooms);}

test('§14.1/2 simple rectangular one-level plan: supported, x axis, centre candidate',()=>{
 const p=proj(box(0,0,10000,6000),[rect('r',0,0,10000,6000)]),d=S.derive(p,{overviewDirection:OVERVIEW});
 assert.equal(d.supported,true);assert.equal(d.axis,'x');assert.deepEqual(d.normal,[0,1]);assert.equal(d.fraction,.5);
 assert.equal(d.intersections.rooms.length,1);assert.equal(d.intersections.walls.length,2,'the two side walls');
});
test('§14.4/5/6 axis: X dominant, Z (plan y) dominant, tie → x',()=>{
 assert.equal(S.derive(proj(box(0,0,10000,4000),[rect('r',0,0,10000,4000)]),{overviewDirection:OVERVIEW}).axis,'x');
 const z=S.derive(proj(box(0,0,4000,10000),[rect('r',0,0,4000,10000)]),{overviewDirection:OVERVIEW});assert.equal(z.axis,'y');assert.deepEqual(z.normal,[1,0]);
 assert.equal(S.derive(proj(box(0,0,6000,6000),[rect('r',0,0,6000,6000)]),{overviewDirection:OVERVIEW}).axis,'x','spanX >= spanZ');
});
test('visible side faces the deterministic overview camera; start is just in front of the envelope',()=>{
 const p=proj(box(0,0,10000,6000),[rect('r',0,0,10000,6000)]);
 const plus=S.derive(p,{overviewDirection:OVERVIEW}),minus=S.derive(p,{overviewDirection:[-.42,.84,-.34]});
 assert.equal(plus.frontSign,1);assert.equal(minus.frontSign,-1);
 assert.ok(plus.startOffset>plus.bounds.maxY&&plus.startOffset-plus.bounds.maxY<400);assert.ok(minus.startOffset<minus.bounds.minY);
 assert.deepEqual(plus.look,[0,-1],'the frontal camera looks against the normal');
});
test('§14.3 irregular (L) plan: deterministic choice with rooms first',()=>{
 const p=proj([...box(0,0,12000,4000),...box(0,4000,4000,9000)],[rect('long',0,0,12000,4000),rect('leg',0,4000,4000,9000)]);
 const d=S.derive(p,{overviewDirection:OVERVIEW});assert.equal(d.supported,true);assert.ok(d.intersections.rooms.length>=1);
 assert.deepEqual(S.derive(p,{overviewDirection:OVERVIEW}),d,'same input → same descriptor');
});
test('§14.7/8/9 candidates 50 % → 40 % → 60 %, measured from the camera side',()=>{
 const centre=S.derive(bands([4800,5200]),{overviewDirection:OVERVIEW});assert.equal(centre.fraction,.5);
 const forty=S.derive(bands([5700,6300]),{overviewDirection:OVERVIEW});assert.equal(forty.fraction,.4);assert.equal(forty.targetOffset,6000);
 const sixty=S.derive(bands([3700,4300]),{overviewDirection:OVERVIEW});assert.equal(sixty.fraction,.6);assert.equal(sixty.targetOffset,4000);
 assert.deepEqual(forty.candidates.map(c=>c.fraction),[.5,.4,.6]);
});
test('ties keep the stable order; rooms win over walls',()=>{
 const p=proj([wall(0,0,0,10000),wall(12000,0,12000,10000),wall(6000,3800,6000,4200),wall(7000,3800,7000,4200),wall(8000,3800,8000,4200)],[rect('a',0,0,12000,500),rect('c',0,9500,12000,10000),rect('m',0,5700,12000,6300)]);
 const d=S.derive(p,{overviewDirection:OVERVIEW});assert.equal(d.fraction,.4,'40 % crosses a room; 60 % only crosses more walls');
});
test('§14.10/13 nothing crossed or no geometry → unsupported with a concrete reason',()=>{
 const none=S.derive(bands(null),{overviewDirection:OVERVIEW});assert.equal(none.supported,false);assert.equal(none.reason,'no-crossing');assert.match(none.message,/50 %, 40 %, 60 %/);
 const empty=S.derive(proj([],[]),{overviewDirection:OVERVIEW});assert.equal(empty.supported,false);assert.equal(empty.reason,'no-bounds');
 const tiny=S.derive(proj([wall(0,0,200,0)]),{overviewDirection:OVERVIEW});assert.equal(tiny.reason,'no-bounds');
});
test('§14.11 demolished walls do not count',()=>{
 const p=bands(null);p.walls=[wall(5000,0,5000,10000,{status:'demolished'}),wall(6000,0,6000,10000,{status:'demolished'})];
 assert.equal(S.derive(p,{overviewDirection:OVERVIEW}).supported,false);
 p.walls[1].status='existing';p.walls.push(wall(7000,0,7000,10000));assert.equal(S.derive(p,{overviewDirection:OVERVIEW}).intersections.walls.length,2);
});
test('§14.12 no rooms but enough walls: supported on walls',()=>{
 const d=S.derive(proj(box(0,0,10000,6000)),{overviewDirection:OVERVIEW});assert.equal(d.supported,true);assert.equal(d.intersections.rooms.length,0);assert.equal(d.intersections.walls.length,2);
});
test('§14.14 openings crossed by the cut become vertical gaps of the cut face (no invented thickness)',()=>{
 const walls=box(0,0,10000,6000),side=walls[1];// x=10000, from y=0 to 6000; the cut at y=3000 is 3000 mm along it
 const p=proj(walls,[rect('r',0,0,10000,6000)],[{id:'win',wallId:side.id,kind:'window',offsetMm:2500,widthMm:1000,heightMm:1200,sillHeightMm:900},{id:'door',wallId:walls[3].id,kind:'door',offsetMm:2000,widthMm:2000,heightMm:2100}]);
 const d=S.derive(p,{overviewDirection:OVERVIEW}),w=d.intersections.walls;
 const win=w.find(x=>x.id===side.id),door=w.find(x=>x.id===walls[3].id);
 assert.deepEqual(win.gaps.map(g=>[g.bottom,g.top]),[[900,2100]]);assert.deepEqual(door.gaps.map(g=>[g.bottom,g.top]),[[0,2100]]);
 assert.equal(win.width,200,'perpendicular wall: its own thickness');assert.equal(win.height,2700);
});
test('oblique wall: cut face width is its thickness across the line',()=>{
 const p=proj([wall(0,0,10000,0),wall(0,6000,10000,6000),wall(0,0,3000,6000)],[rect('r',0,0,10000,6000)]);
 const d=S.derive(p,{overviewDirection:OVERVIEW}),w=d.intersections.walls[0];assert.ok(w.width>200&&w.width<450);
});
test('the reference project: supported, rooms and gaps from the real model',()=>{
 const d=S.derive(ref,{overviewDirection:OVERVIEW});assert.equal(d.supported,true);assert.ok(d.intersections.rooms.length>=3);assert.ok(d.intersections.walls.some(w=>w.gaps.length));
});
test('§9 building: one axis for every level from the envelope in the building frame, offsets respected',()=>{
 const tall=proj(box(0,0,4000,9000),[rect('r',0,0,4000,9000)]),wide=proj(box(0,0,6000,4000),[rect('r',0,0,6000,4000)]);
 const b=S.buildingAxis([{project:tall,offsetMm:{x:0,y:0}},{project:wide,offsetMm:{x:0,y:0}}]);assert.equal(b.axis,'y');
 const shifted=S.buildingAxis([{project:tall,offsetMm:{x:0,y:0}},{project:wide,offsetMm:{x:9000,y:0}}]);assert.equal(shifted.axis,'x','the offset widens the building along x');
 const forced=S.derive(wide,{overviewDirection:OVERVIEW,axis:'y',levelId:'L1'});assert.equal(forced.axis,'y');assert.equal(forced.levelId,'L1');assert.equal(forced.supported,true);
});
test('no mutation of the source and the sweep offset is a pure function',()=>{
 const p=proj(box(0,0,10000,6000),[rect('r',0,0,10000,6000)]),before=JSON.stringify(p),d=S.derive(p,{overviewDirection:OVERVIEW});
 assert.equal(JSON.stringify(p),before);assert.equal(S.offsetAt(d,0),d.startOffset);assert.equal(S.offsetAt(d,1),d.targetOffset);assert.equal(S.offsetAt(d,.5),S.offsetAt(d,.5));assert.equal(S.offsetAt(d,2),d.targetOffset);
});

// ── narrative ────────────────────────────────────────────────────────────────────────────────────────────────────
const end={position:[6.3,12.6,5.1],target:[0,0,0],fov:45};
const input={plane:{normal:[0,0,1],start:5.6,target:0},line:{from:[-6,0],to:[6,0]},wallTop:2.7,depth:10,end,aspect:16/9,region:[0,0,.7,1],base:{near:.05,far:300}};
const close=(a,b,e=1e-9)=>a.every((v,i)=>Math.abs(v-b[i])<e);
test('section-open lives in NARRATIVES and SCENE_MS',()=>{assert.ok(Story.NARRATIVES.includes('section-open'));assert.ok(Story.SCENE_MS['section-open']>0);assert.equal(Story.create('section-open',input).kind,'section-open');});
test('p = 0 is the overview untouched; p = 1 is exactly the overview with the section on',()=>{
 const n=Story.create('section-open',input),a=n.stateAt(0),b=n.stateAt(1);
 assert.deepEqual(a.position,end.position);assert.deepEqual(a.target,end.target);assert.equal(a.fov,45);assert.equal(a.offset,5.6);assert.equal(a.caps,false);assert.equal(a.sectionVisible,false);
 assert.deepEqual(b.position,end.position);assert.deepEqual(b.target,end.target);assert.equal(b.fov,45);assert.equal(b.near,.05);assert.equal(b.far,300);assert.equal(b.offset,0);assert.equal(b.caps,true);assert.equal(b.phase,'overview-cut');
});
test('checkpoints .25 .50 .75 follow the contract phases',()=>{
 const n=Story.create('section-open',input),q=n.stateAt(.25),h=n.stateAt(.5),t=n.stateAt(.75),f=n.stateAt(.35);
 assert.equal(q.phase,'cut');assert.ok(q.offset<5.6&&q.offset>0);assert.ok(q.fov<45);
 assert.equal(f.phase,'front');assert.equal(f.offset,0);assert.equal(f.caps,true);assert.ok(f.fov<=8);assert.ok(Math.abs(f.position[1]-f.target[1])<1e-9,'frontal: horizontal');
 assert.ok(Math.abs(f.position[0]-f.target[0])<1e-9&&f.position[2]>f.target[2],'looks along −normal');
 assert.equal(h.phase,'open');assert.ok(h.fov>f.fov&&h.fov<45);assert.equal(t.phase,'open');assert.equal(t.offset,0);
 assert.deepEqual(n.checkpoints,[0,.25,.5,.75,1]);
});
test('dolly zoom keeps the framed size of the cut while the lens opens',()=>{
 const n=Story.create('section-open',input),o=Story.SECTION_OPEN;
 const frames=[o.holdEnd,(o.holdEnd+o.dollyEnd)/2,o.dollyEnd-1e-6].map(p=>n.stateAt(p));
 for(const s of frames)assert.ok(Math.abs(s.frameHeight-n.info.frameFront)<1e-9);
 assert.ok(frames[2].fov>frames[0].fov*2);assert.ok(frames[2].distance<frames[0].distance);
 for(const s of frames)assert.ok(Math.abs(2*s.distance*Math.tan(s.fov*Math.PI/360)-s.frameHeight)<1e-6);
});
test('continuous across phase boundaries and up to the end',()=>{
 const n=Story.create('section-open',input),o=Story.SECTION_OPEN;
 for(const b of [o.sweepEnd,o.holdEnd,o.dollyEnd,o.openEnd]){const a=n.stateAt(b-1e-7),c=n.stateAt(b+1e-7);assert.ok(close(a.position,c.position,1e-3),`position at ${b}`);assert.ok(Math.abs(a.fov-c.fov)<1e-3,`fov at ${b}`);}
 const e=n.stateAt(o.openEnd-1e-7);assert.ok(close(e.position,end.position,1e-3));
});
test('deterministic and reversible: same p, same state, forwards or backwards',()=>{
 const a=Story.create('section-open',input),b=Story.create('section-open',structuredClone(input));
 const ps=[...Array(41)].map((_,i)=>i/40),fw=ps.map(p=>JSON.stringify(a.stateAt(p))),bw=[...ps].reverse().map(p=>JSON.stringify(b.stateAt(p))).reverse();
 assert.deepEqual(fw,bw);
});
test('reduced-motion hold is the sectioned overview',()=>{const n=Story.create('section-open',input),s=n.stateAt(n.info.reducedHold);assert.equal(s.caps,true);assert.deepEqual(s.position,end.position);assert.equal(s.offset,0);});
test('narrower screens frame the cut wider; input never mutated; bad input refused',()=>{
 const before=JSON.stringify(input),wide=Story.create('section-open',input),tall=Story.create('section-open',{...input,aspect:390/844,region:[0,0,1,.55]});
 assert.ok(tall.info.frameFront>wide.info.frameFront);assert.equal(JSON.stringify(input),before);
 assert.throws(()=>Story.create('section-open',{...input,plane:null}),/plano/);assert.throws(()=>Story.create('section-open',{...input,end:{position:[0,0,0],target:[0,0,NaN],fov:45}}),/vista general/);
});
test('sequence with section-open between the plan reveal and the room descent',()=>{
 const kinds=['plan-reveal','section-open','room-descent'],seq=Story.sequence(kinds.map(k=>Story.SCENE_MS[k]));
 assert.equal(seq.count,3);const at=seq.at(1,.5),loc=seq.locate(at);assert.equal(loc.i,1);assert.ok(Math.abs(loc.p-.5)<1e-9);
 assert.deepEqual(seq.locate(seq.at(2,0)),{i:2,p:0},'the boundary belongs to the descent: section p = 1 hands over at the same pose');
});
