// FT3D-5: axonometric reading and spatial breakdown of the building — pure descriptor (FloorPlanPresentationAxon) and
// the two narratives of the Story engine. Contract V2 §§4–12, 17–21, 35 (docs/product/ft3d-5-axon-exploded-building-contract-2026-11-01.md).
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../js/presentation-axon-core.js'),Story=require('../js/presentation-story-core.js'),Core=require('../js/project-core.js');
let wid=0;const wall=(x0,y0,x1,y1,extra={})=>({id:'w'+(++wid),start:{x:x0,y:y0},end:{x:x1,y:y1},thicknessMm:200,heightMm:2700,status:'existing',...extra});
const box=(x0,y0,x1,y1,extra)=>[[x0,y0,x1,y0],[x1,y0,x1,y1],[x1,y1,x0,y1],[x0,y1,x0,y0]].map(([a,b,c,d])=>wall(a,b,c,d,extra));
const project=(walls,extra={})=>({id:'p'+(++wid),walls,rooms:[{id:'r',polygon:[{x:walls[0].start.x,y:walls[0].start.y},{x:walls[1].start.x,y:walls[1].start.y},{x:walls[2].start.x,y:walls[2].start.y},{x:walls[3].start.x,y:walls[3].start.y}]}],openings:[],objects:[],defaults:{wallHeightMm:2700},...extra});
const geom=p=>({envelope:(()=>{const xs=p.walls.flatMap(w=>[w.start.x,w.end.x]),ys=p.walls.flatMap(w=>[w.start.y,w.end.y]);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};})()});
const level=(levelId,order,elevationMm,p,offsetMm={x:0,y:0})=>({levelId,order,elevationMm,offsetMm,project:p,geometry:geom(p)});
const twoLevels=()=>[level('L0',0,0,project(box(0,0,10000,8000))),level('L1',1,3000,project(box(0,0,10000,8000)))];
const end={position:[10,12,9],target:[0,0,0],fov:40};
const world=d=>({compact:A.cornersMm(d.envelope).map(([x,y,h])=>[x/1000,h/1000,y/1000]),exploded:A.cornersMm(d.explodedEnvelope).map(([x,y,h])=>[x/1000,h/1000,y/1000])});
const narrative=(kind,d,extra={})=>{const w=world(d);return Story.create(kind,{end,...w,direction:[9,8.5,12.5],aspect:1.6,region:[0,0,1,1],base:{near:.1,far:200,maxDistance:80},
 levels:d.levels.map(l=>({levelId:l.levelId,dyM:kind==='exploded-levels-open'?l.explodedExtraYmm/1000:0})),includedLevelIds:d.levels.map(l=>l.levelId),baseVisibleLevelIds:['L0'],...extra});};

test('1–2. one level: axon supported; breakdown unsupported as single-level',()=>{
 const d=A.derive({levels:[level(null,0,0,project(box(0,0,9000,7000)))]});
 assert.equal(d.supported,true);assert.equal(d.reason,null);assert.equal(d.partial,false);
 assert.deepEqual(d.variants.axon,{supported:true,reason:null,variant:'compact-building'});
 assert.deepEqual(d.variants.exploded,{supported:false,reason:'single-level',variant:'vertical-levels'});
 assert.equal(d.explodedEnvelope,null);assert.equal(d.baseVisualGapMm,null);assert.equal(d.visualClearanceMm,null);
 assert.equal(d.levels[0].explodedExtraYmm,0);
});
test('3–4. two levels: both variants, top-level semantics',()=>{
 const d=A.derive({levels:twoLevels()});
 assert.equal(d.version,2);assert.equal(d.supported,true);assert.equal(d.variants.exploded.supported,true);assert.equal(d.variants.exploded.reason,null);
 assert.deepEqual(d.levels.map(l=>l.levelId),['L0','L1']);
 for(const k of ['version','supported','reason','partial','variants','levels','nominalStoreyMm','baseVisualGapMm','visualClearanceMm','envelope','explodedEnvelope','excluded'])assert.ok(k in d,k);
});
test('6–9. model-space coordinates: offsets on X / plan Y, real elevation, bounds bottom/top',()=>{
 const d=A.derive({levels:[level('L0',0,0,project(box(0,0,10000,8000))),level('L1',1,3200,project(box(1000,500,7000,6500)),{x:2500,y:-1500})]});
 const L1=d.levels[1];
 assert.deepEqual(L1.offsetMm,{x:2500,y:-1500});assert.equal(L1.elevationMm,3200);
 assert.deepEqual(L1.boundsMm,{minXmm:3500,maxXmm:9500,minPlanYmm:-1000,maxPlanYmm:5000,bottomMm:3200,topMm:5900});
 assert.ok(!('baseMm' in L1)&&!('minY' in L1.boundsMm),'no ambiguous x/y/z names');
 assert.deepEqual(d.envelope,{minXmm:0,maxXmm:10000,minPlanYmm:-1000,maxPlanYmm:8000,bottomMm:0,topMm:5900});
});
test('10. stable order: order → sourceIndex → levelId',()=>{
 const p=()=>project(box(0,0,5000,5000));
 const d=A.derive({levels:[level('b',1,3000,p()),level('z',0,0,p()),level('a',1,3000,p())]});
 assert.deepEqual(d.levels.map(l=>l.levelId),['z','b','a'],'equal order keeps source order');
 assert.deepEqual(d.levels.map(l=>l.sourceIndex),[1,0,2]);
});
test('11. reason precedence',()=>{
 assert.equal(A.derive({levels:[]}).reason,'no-levels');assert.equal(A.derive({}).reason,'no-levels');
 const noWalls={levelId:'x',order:0,elevationMm:0,project:{walls:[],defaults:{wallHeightMm:2700}},geometry:{envelope:{x:0,y:0,w:100,h:100}}};
 assert.equal(A.derive({levels:[noWalls]}).reason,'invalid-level-geometry');
 const demolished=project(box(0,0,5000,5000,{status:'demolished'}));
 assert.equal(A.derive({levels:[level('d',0,0,demolished)]}).reason,'invalid-level-geometry');
 const flat=project(box(0,0,5000,5000,{heightMm:0}),{defaults:{}});
 assert.equal(A.derive({levels:[level('f',0,0,flat)]}).reason,'invalid-level-geometry','no demonstrable height');
 const d=A.derive({levels:[level('L0',0,0,project(box(0,0,5000,5000))),noWalls]});
 assert.equal(d.supported,true);assert.equal(d.variants.exploded.reason,'insufficient-valid-levels');
});
test('12–14. partial: invalid levels excluded and reported; every structural level is read',()=>{
 const bad={levelId:'B',order:1,elevationMm:3000,project:{walls:[]},geometry:{envelope:null}};
 const d=A.derive({levels:[level('L0',0,0,project(box(0,0,5000,5000))),bad,level('L2',2,6000,project(box(0,0,5000,5000)))]});
 assert.equal(d.partial,true);assert.deepEqual(d.excluded,[{levelId:'B',reason:'invalid-level-geometry'}]);
 assert.deepEqual(d.levels.map(l=>l.levelId),['L0','L2']);assert.equal(d.variants.exploded.supported,true);
});
test('15–17. nominal gap, visual clearance and overlap-safe extra',()=>{
 const d=A.derive({levels:twoLevels()});
 assert.equal(d.nominalStoreyMm,3000);assert.equal(d.baseVisualGapMm,1350);assert.equal(d.visualClearanceMm,338);
 assert.deepEqual(d.levels.map(l=>l.explodedExtraYmm),[0,1350]);
 // Clamp limits.
 const tall=A.derive({levels:[level('a',0,0,project(box(0,0,5000,5000))),level('b',1,6000,project(box(0,0,5000,5000)))]});
 assert.equal(tall.baseVisualGapMm,1600);assert.equal(tall.visualClearanceMm,400);
 const low=A.derive({levels:[level('a',0,0,project(box(0,0,5000,5000))),level('b',1,1000,project(box(0,0,5000,5000)))]});
 assert.equal(low.baseVisualGapMm,800);assert.equal(low.visualClearanceMm,200);
 // Fallback: no positive step → tallest wall.
 const same=A.derive({levels:[level('a',0,0,project(box(0,0,5000,5000))),level('b',1,0,project(box(0,0,5000,5000)))]});
 assert.equal(same.nominalStoreyMm,2700);
});
test('18. unusual wall heights: lifted levels never overlap vertically',()=>{
 // Lower level with 6 m walls under a level only 3 m up: the nominal gap alone would leave them overlapping.
 const d=A.derive({levels:[level('L0',0,0,project(box(0,0,8000,8000,{heightMm:6000}))),level('L1',1,3000,project(box(0,0,8000,8000)))]});
 const [a,b]=d.levels,top0=a.boundsMm.topMm+a.explodedExtraYmm,bottom1=b.boundsMm.bottomMm+b.explodedExtraYmm;
 assert.ok(bottom1-top0>=d.visualClearanceMm-1e-9,'clear of the level below');assert.ok(b.explodedExtraYmm>d.baseVisualGapMm);
 assert.equal(b.elevationMm,3000,'real elevation kept');
});
test('19–20. compact and exploded envelopes',()=>{
 const d=A.derive({levels:twoLevels()});
 assert.deepEqual(d.envelope,{minXmm:0,maxXmm:10000,minPlanYmm:0,maxPlanYmm:8000,bottomMm:0,topMm:5700});
 assert.deepEqual(d.explodedEnvelope,{...d.envelope,topMm:5700+1350});
 assert.equal(A.cornersMm(d.envelope).length,8);
});
test('21–23. serializable, no mutation, deterministic',()=>{
 const input={levels:twoLevels()},frozen=JSON.stringify(input);
 const a=A.derive(input),b=A.derive(structuredClone(input));
 assert.equal(JSON.stringify(input),frozen);assert.deepEqual(a,b);assert.deepEqual(JSON.parse(JSON.stringify(a)),a);
});
test('33. N levels: conceptual accumulation (the product stays at two levels)',()=>{
 const d=A.derive({levels:[0,1,2].map(i=>level('L'+i,i,i*3000,project(box(0,0,5000,5000))))});
 assert.deepEqual(d.levels.map(l=>l.explodedExtraYmm),[0,1350,2700]);
});
test('24, 30. axon-open: p0/p1 exactly the overview, 7000 ms, levels unmoved',()=>{
 const n=narrative('axon-open',A.derive({levels:twoLevels()}));
 assert.equal(Story.SCENE_MS['axon-open'],7000);assert.equal(n.info.playMs,7000);
 for(const p of [0,1]){const s=n.stateAt(p);assert.deepEqual(s.position,end.position);assert.deepEqual(s.target,end.target);assert.equal(s.fov,40);
  assert.equal(s.near,.1);assert.equal(s.far,200);assert.equal(s.maxDistance,80);assert.deepEqual(s.visibleLevelIds,['L0']);assert.equal(s.showContact,true);
  assert.ok(s.levelDeltas.every(x=>x.dyM===0));}
 for(const p of [.1,.5,.9])assert.ok(n.stateAt(p).levelDeltas.every(x=>x.dyM===0),'axon never separates levels');
 assert.equal(n.stateAt(.5).phase,'axon');assert.deepEqual(n.stateAt(.5).visibleLevelIds.sort(),['L0','L1']);
 assert.equal(n.stateAt(.5).showStairs,true);
});
test('25–26, 30. exploded: p0/p1 overview with zero deltas, full separation in the hold, 10000 ms',()=>{
 const d=A.derive({levels:twoLevels()}),n=narrative('exploded-levels-open',d);
 assert.equal(Story.SCENE_MS['exploded-levels-open'],10000);assert.equal(n.info.playMs,10000);
 for(const p of [0,1]){const s=n.stateAt(p);assert.equal(s.phase,'overview');assert.deepEqual(s.position,end.position);assert.ok(s.levelDeltas.every(x=>x.dyM===0));assert.equal(s.showStairs,true);}
 const hold=n.stateAt(.645);assert.equal(hold.phase,'exploded');
 assert.deepEqual(hold.levelDeltas,[{levelId:'L0',dyM:0},{levelId:'L1',dyM:1.35}]);
 for(const k of ['showStairs','showGround','showContext','showRoofExterior','showContact'])assert.equal(hold[k],false,k);
 assert.equal(n.stateAt(.2).levelDeltas[1].dyM,0,'entry is compact');assert.equal(n.stateAt(.95).levelDeltas[1].dyM,0,'recomposed before return');
 assert.equal(n.stateAt(.3).phase,'separate');assert.equal(n.stateAt(.8).phase,'recompose');
});
test('17 (contract). state is serializable plain data',()=>{
 const n=narrative('exploded-levels-open',A.derive({levels:twoLevels()}));
 for(const p of [0,.3,.645,.85,1]){const s=n.stateAt(p);assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
  for(const k of ['phase','position','target','fov','near','far','maxDistance','levelDeltas','visibleLevelIds','showStairs','showGround','showContext','showRoofExterior'])assert.ok(k in s,k);}
});
test('27. stateAt is history-independent (reverse, scrub)',()=>{
 const n=narrative('exploded-levels-open',A.derive({levels:twoLevels()}));
 const ps=[0,.1,.22,.3,.55,.645,.74,.82,.9,.95,1],fwd=ps.map(p=>JSON.stringify(n.stateAt(p)));
 const rev=[...ps].reverse().map(p=>JSON.stringify(n.stateAt(p))).reverse();
 assert.deepEqual(rev,fwd);
 const scrub=[.645,.1,.9,.645].map(p=>JSON.stringify(n.stateAt(p)));assert.equal(scrub[0],scrub[3]);
});
test('28–29. world-space fit: every corner in front and on screen; far/maxDistance cover the box',()=>{
 const d=A.derive({levels:twoLevels()}),n=narrative('exploded-levels-open',d),corners=world(d).exploded,s=n.stateAt(.645);
 const f=[s.target[0]-s.position[0],s.target[1]-s.position[1],s.target[2]-s.position[2]],L=Math.hypot(...f);
 for(const c of corners){const v=[c[0]-s.position[0],c[1]-s.position[1],c[2]-s.position[2]],z=(v[0]*f[0]+v[1]*f[1]+v[2]*f[2])/L;
  assert.ok(z>s.near,'in front of the near plane');assert.ok(Math.hypot(...v)<s.far,'within the far plane');}
 assert.ok(s.maxDistance>=s.distance,'orbit limit allows the pose');assert.ok(s.near>0);
 const a=narrative('axon-open',d).stateAt(.5);assert.ok(a.distance<s.distance+1e-9,'compact needs no more distance than exploded');
});
test('31. reduced-motion holds land on the readable states',()=>{
 const d=A.derive({levels:twoLevels()});
 assert.equal(narrative('axon-open',d).stateAt(Story.AXON_OPEN.reducedHold).phase,'axon');
 const n=narrative('exploded-levels-open',d),c=n.stateAt(Story.EXPLODED_LEVELS_OPEN.reducedCompact),e=n.stateAt(Story.EXPLODED_LEVELS_OPEN.reducedExploded);
 assert.ok(c.levelDeltas.every(x=>x.dyM===0)&&c.showStairs,'compact hold');assert.equal(e.phase,'exploded');assert.equal(e.levelDeltas[1].dyM,1.35);
});
test('32. independent of north, labels and language',()=>{
 const p=project(box(0,0,10000,8000));const q=structuredClone(p);q.site={northOffsetDeg:137};q.rooms[0].name='Salón';
 const a=A.derive({levels:[level('L0',0,0,p)]}),b=A.derive({levels:[level('L0',0,0,{...q,id:p.id})]});
 assert.deepEqual(a,b);
});
test('narratives refuse incomplete input instead of guessing',()=>{
 const d=A.derive({levels:twoLevels()});
 assert.throws(()=>Story.create('axon-open',{end,compact:[]}));
 assert.throws(()=>Story.create('exploded-levels-open',{end,...world(d),levels:[{levelId:'L0',dyM:0}]}),/dos niveles/);
 assert.throws(()=>Story.create('exploded-levels-open',{end,compact:world(d).compact,exploded:[],levels:d.levels}));
});
test('real project geometry (Core.geometry) is accepted',()=>{
 const p=project(box(0,0,6000,4000));const d=A.derive({levels:[{levelId:null,order:0,elevationMm:0,offsetMm:{x:0,y:0},project:p,geometry:Core.geometry(p)}]});
 assert.equal(d.supported,true);
});
