/* Hybrid Registered Elevation V1 — pure contract: the Story hybrid state of elevation-open (absent when off, plain data,
   a function of p only) and the pure parts of the runtime helper (identity-only target selection, validation, the
   façade-registered sweep and its camera independence, hatch period from geometry). */
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../js/presentation-story-core.js'),H=require('../js/presentation-elevation-hybrid.js');
const facade={normal:[0,0,1],tangent:[1,0,0],center:[0,1.4,3],width:8,height:2.8};
const input=hybrid=>({facade,corners:[[-4,0,-3],[4,0,-3],[4,2.8,3],[-4,2.8,3]],end:{position:[10,10,10],target:[0,0,0],fov:45},aspect:1.6,region:[0,0,1,1],base:{near:.05,far:300},hybrid});
const O=S.ELEVATION_OPEN;
test('hybrid off: elevation-open states are exactly the existing ones (no hybrid key, same values)',()=>{
 const off=S.create('elevation-open',input(false)),plain=S.create('elevation-open',{...input(false),hybrid:undefined}),on=S.create('elevation-open',input(true));
 for(const p of [0,.1,.28,.35,.45,.5,.6,.7,.86,.95,1]){const a=off.stateAt(p);assert.equal('hybrid' in a,false);assert.deepEqual(a,plain.stateAt(p));const {hybrid,...rest}=on.stateAt(p);assert.ok(hybrid);assert.deepEqual(rest,a,`camera/light unchanged at ${p}`);}
 assert.equal('hybrid' in off.info,false);assert.equal(on.info.hybrid,true);
});
test('p = 0 and p = 1 are neutral; technical enters while aligning; frontal = strongest technical reading',()=>{
 const n=S.create('elevation-open',input(true)),h=p=>n.stateAt(p).hybrid;
 for(const p of [0,1,-1,2])assert.deepEqual(h(p),{enabled:true,technicalMix:0,materialReveal:0,hatchStrength:0,active:false});
 assert.ok(h(.05).technicalMix>0&&h(.05).technicalMix<h(.2).technicalMix&&h(.2).technicalMix<1,'technical rises during align');
 for(const p of [O.alignEnd,O.reducedFront,O.frontEnd-1e-6])assert.deepEqual(h(p),{enabled:true,technicalMix:1,materialReveal:0,hatchStrength:1,active:true});
});
test('material reveal crosses the façade in the frontal/light interval and is complete before the perspective',()=>{
 const n=S.create('elevation-open',input(true)),h=p=>n.stateAt(p).hybrid;let prev=0;
 for(let p=O.frontEnd;p<=O.revealEnd;p+=.01){const r=h(p).materialReveal;assert.ok(r>=prev-1e-12,'monotonic');prev=r;}
 const mid=h((O.frontEnd+O.revealEnd)/2);assert.ok(mid.materialReveal>.4&&mid.materialReveal<.6&&mid.active);
 assert.equal(h(O.revealEnd).materialReveal,1);assert.equal(h(O.revealEnd).active,false,'fully material = normal Rubik rendering');
 assert.equal(h(O.reducedMaterial).materialReveal,1);assert.equal(n.stateAt(O.reducedMaterial).phase,'light','reduced-motion material hold is frontal');
 for(const p of [O.perspEnd,O.reducedPersp,.95])assert.equal(h(p).technicalMix,0,'exterior and return: no technical residue');
});
test('deterministic and history independent: any seek order, reverse and replay give identical plain data',()=>{
 const n=S.create('elevation-open',input(true)),ps=[...Array(101).keys()].map(i=>i/100),first=ps.map(p=>JSON.stringify(n.stateAt(p).hybrid));
 const rev=[...ps].reverse().map(p=>JSON.stringify(n.stateAt(p).hybrid)).reverse();assert.deepEqual(rev,first);
 const shuffled=[...ps].sort((a,b)=>Math.sin(a*97)-Math.sin(b*97));for(const p of shuffled)assert.equal(JSON.stringify(n.stateAt(p).hybrid),first[Math.round(p*100)]);
 const again=S.create('elevation-open',input(true));assert.deepEqual(ps.map(p=>JSON.stringify(again.stateAt(p).hybrid)),first);
 const st=n.stateAt(.47);assert.deepEqual(JSON.parse(JSON.stringify(st.hybrid)),st.hybrid,'serialisable');st.hybrid.technicalMix=99;assert.notEqual(n.stateAt(.47).hybrid.technicalMix,99,'no shared mutable state');
});
test('clamping: out-of-range and non-numeric p are neutral overview states',()=>{
 const n=S.create('elevation-open',input(true));for(const p of [-5,NaN,'x',undefined])assert.equal(n.stateAt(p).hybrid.active,false);assert.equal(n.stateAt(7).hybrid.active,false);
});
// A scene-like tree for the selection (objects with userData, children, isMesh, material).
const mesh=(userData,material={isMeshStandardMaterial:true})=>({isMesh:true,userData,material,children:[]});
const group=(userData,children)=>({userData,children});
test('targets by identity only: façade walls of the right level, its opening pieces; glass, other walls/levels/furniture excluded',()=>{
 const glass={isMeshPhysicalMaterial:true,transparent:true,opacity:.28},w1=mesh({wallId:'w1'}),w1b=mesh({wallId:'w1'}),w2=mesh({wallId:'w2'}),other=mesh({wallId:'w9'}),walk=mesh({wallId:'w1',walkOnly:true});
 const frame=mesh({}),pane=mesh({},glass),win=group({openingId:'o1'},[frame,pane]),door=group({openingId:'o2'},[mesh({door:{id:'o2'}})]),foreignOpening=group({openingId:'o9'},[mesh({})]);
 const sofa=mesh({fid:'sofa'}),upperW1=mesh({wallId:'w1'}),upper=group({levelId:'L1'},[group({},[upperW1])]);
 const active=group({},[w1,w1b,w2,other,walk,win,door,foreignOpening,sofa]);
 const sel=H.selectTargets([{object:active,levelId:'L0'},{object:upper,levelId:'L1'}],{wallRefs:[{levelId:'L0',wallId:'w1'},{levelId:'L0',wallId:'w2'}],openingRefs:[{levelId:'L0',openingId:'o1'},{levelId:'L0',openingId:'o2'}]});
 const got=new Set(sel.meshes.map(t=>t.mesh));
 for(const m of [w1,w1b,w2,frame,door.children[0]])assert.ok(got.has(m));for(const m of [other,walk,pane,foreignOpening.children[0],sofa,upperW1])assert.ok(!got.has(m));
 assert.equal(sel.glass,1);assert.equal(sel.walls.size,2);assert.equal(sel.expectedWalls,2);assert.deepEqual(H.validate(sel),{supported:true,reason:null});
});
test('fail closed: no candidate, no mapped walls, too few walls, unsupported material, no shader capability',()=>{
 const tree=[{object:group({},[mesh({wallId:'a'})]),levelId:null}];
 assert.equal(H.validate(H.selectTargets(tree,{wallRefs:[]})).reason,'no-candidate');
 assert.equal(H.validate(H.selectTargets(tree,{wallRefs:[{levelId:null,wallId:'zz'}]})).reason,'no-targets');
 assert.equal(H.validate(H.selectTargets(tree,{wallRefs:[{levelId:null,wallId:'a'},{levelId:null,wallId:'b'},{levelId:null,wallId:'c'}]})).reason,'insufficient-targets');
 const basic=[{object:group({},[mesh({wallId:'a'},{isMeshBasicMaterial:true})]),levelId:null}];
 assert.equal(H.validate(H.selectTargets(basic,{wallRefs:[{levelId:null,wallId:'a'}]})).reason,'unsupported-material');
 assert.equal(H.validate(H.selectTargets(tree,{wallRefs:[{levelId:null,wallId:'a'}]}),{shader:false}).reason,'shader-unavailable');
});
test('registered sweep: a function of façade coordinates only — camera, FOV and viewport never enter; reverse retraces it',()=>{
 const f=H.frameOf({center:[2,1.4,-3],tangent:[0,0,-1],normal:[1,0,0],width:10,height:2.8});
 const corner=(a,b)=>[f.center[0]+f.tangent[0]*a,f.center[1]+b,f.center[2]+f.tangent[2]*a];
 assert.equal(H.materialAt(f,corner(-5,1.4),0),0);assert.equal(H.materialAt(f,corner(5,-1.4),1),1);
 const first=corner(-5,1.4),last=corner(5,-1.4);let a=[],b=[];
 for(let r=0;r<=1.0001;r+=.05){a.push(H.materialAt(f,first,r));b.push(H.materialAt(f,last,r));}
 for(let i=1;i<a.length;i++){assert.ok(a[i]>=a[i-1]&&b[i]>=b[i-1],'monotonic front');}
 assert.ok(a.findIndex(v=>v>.5)<b.findIndex(v=>v>.5),'the front starts at the upper end and ends at the opposite lower end');
 // a point off the façade plane along its normal (a projecting element) gets the same weight as its façade footprint
 const off=[corner(1,0)[0]+f.normal[0]*.9,corner(1,0)[1],corner(1,0)[2]];for(const r of [.3,.5,.7])assert.equal(H.materialAt(f,off,r),H.materialAt(f,corner(1,0),r));
 const fwd=[.2,.5,.8].map(r=>H.materialAt(f,corner(0,0),r)),back=[.8,.5,.2].map(r=>H.materialAt(f,corner(0,0),r)).reverse();assert.deepEqual(fwd,back);
});
test('hatch period comes from the façade size (fixed for the scene), within bounds',()=>{
 assert.equal(H.periodFor(6.05),.11);assert.ok(Math.abs(H.periodFor(12)-12/55)<1e-12);assert.equal(H.periodFor(100),H.HYBRID.maxPeriodM);assert.equal(H.periodFor(1),H.HYBRID.minPeriodM);
});
test('no donor facts in the generic capability',()=>{
 const src=require('node:fs').readFileSync(require.resolve('../js/presentation-elevation-hybrid.js'),'utf8');
 for(const word of [/albion/i,/townhouse/i,/brick/i,/lenis/i,/viewing/i,/for sale/i,/CONVENTION/,/16:40/])assert.equal(word.test(src),false,String(word));
});
