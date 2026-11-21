'use strict';
// SCULPT OP-07 · polish (decisions D-OP07-1/2/3 approved 18/11/2026): per-face areas, geometric conservation and
// protection against degraded saves. Synthetic, targeted cases; the donor baseline is not repeated here.
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../wall-geometry-core.js');
const near=(a,b,tol=1e-9,msg='')=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${msg} ${a} ≠ ${b}`);
const wall=(o={})=>({id:'w',start:{x:0,y:0},end:{x:5000,y:0},thicknessMm:200,heightMm:2500,...o});
const door={id:'d',wallId:'w',kind:'door',offsetMm:500,widthMm:900,sillHeightMm:0,heightMm:2100};
const win={id:'v',wallId:'w',kind:'window',offsetMm:3000,widthMm:1200,sillHeightMm:900,heightMm:1000};
const arc=wall({end:{x:4000,y:0},curve:{control:{x:2000,y:1500}}});

// ── 1. Per-face gross and net areas ──────────────────────────────────────────────────────────────────────────────
test('faces · straight level wall: both faces = L·H, union of holes, reveals by hand',()=>{
 const f=G.faceAreas(wall(),[door,win]);assert.equal(f.complete,true);
 for(const s of ['centre','left','right']){near(f[s].grossMm2,12.5e6);near(f[s].openingsMm2,900*2100+1200*1000);near(f[s].netMm2,12.5e6-3.09e6);}
 near(f.revealsMm2,200*(2*2100+900)+200*(2*1000+1200+1200)); // door: jambs + head; window: jambs + head + sill
});
test('faces · sloped wall: trapezoid gross, opening under the lower edge, no clipping when it does not fit',()=>{
 const s=wall({end:{x:6000,y:0},heightEndMm:1200}),ok={...win,offsetMm:1000};
 const f=G.faceAreas(s,[ok]);near(f.left.grossMm2,6000*(2500+1200)/2);near(f.left.openingsMm2,1.2e6);near(f.right.netMm2,6000*1850-1.2e6);
 const bad=G.faceAreas(s,[{...win,offsetMm:4800}]);
 assert.equal(bad.complete,false);assert.equal(bad.status,'invalid-opening-geometry');assert.deepEqual(bad.invalid,['v']);
 assert.equal(bad.left.netMm2,null);assert.equal(bad.revealsMm2,null);near(bad.left.grossMm2,6000*1850,1e-9,'gross still known');
});
test('faces · overlapping openings count once',()=>{
 const a={...win,id:'a',offsetMm:1000},b={...win,id:'b',offsetMm:1600};
 near(G.faceAreas(wall(),[a,b]).left.openingsMm2,(1600+1200-1000)*1000);
});
test('faces · curved wall: outer face larger, holes wider outside, left + right = 2 × centreline exactly',()=>{
 const f=G.faceAreas(arc,[{...door,offsetMm:1500}]);assert.equal(f.complete,true);
 assert.ok(f.left.grossMm2>f.centre.grossMm2&&f.centre.grossMm2>f.right.grossMm2);
 assert.ok(f.left.openingsMm2>900*2100&&f.right.openingsMm2<900*2100);
 for(const k of ['lengthMm','grossMm2','openingsMm2','netMm2'])near(f.left[k]+f.right[k],2*f.centre[k],1e-12,k);
 near(f.centre.openingsMm2,900*2100,1e-9,'centreline hole = the opening');
});
test('faces · curved and sloped: identity holds and the 1 mm tolerance converges to the true integral',()=>{
 const w={...arc,heightEndMm:1800},base=G.faceAreas(w),fine=G.faceAreas(w,[],{toleranceMm:.01}),T=G.trueGross(w);
 near(base.left.grossMm2+base.right.grossMm2,2*base.centre.grossMm2,1e-12);
 assert.ok(Math.abs(base.centre.grossMm2-T)/T<1e-3,'16 facets within 0.1 %');assert.ok(Math.abs(fine.centre.grossMm2-T)/T<1e-6,'tolerance mode within 1 ppm');
});
test('faces · a curve tighter than half the thickness is rejected, not measured',()=>{
 const tight=wall({end:{x:600,y:0},thicknessMm:400,curve:{control:{x:300,y:900}}});
 assert.ok(G.minRadius(tight)<200);assert.deepEqual(G.validateWall(tight),['curve too tight for wall thickness']);
 const f=G.faceAreas(tight);assert.equal(f.complete,false);assert.equal(f.status,'invalid-wall-geometry');assert.equal(f.right.netMm2,null);
 assert.deepEqual(G.validateWall(wall({curve:{control:{x:9000,y:0}}})),['curve folds back']);
 assert.deepEqual(G.validateWall(wall({curve:{control:{x:2500,y:0}}})),[],'collinear inside the chord = straight');
});

// ── 2. Precision and conservation ────────────────────────────────────────────────────────────────────────────────
const W=(ex,cx,cy)=>wall({end:{x:ex,y:0},thicknessMm:240,curve:{control:{x:cx,y:cy}}});
function measuredDeviation(w,opts){const n=G.facetCount(w,opts);let m=0;
 for(let i=0;i<n;i++)for(let k=1;k<20;k++){const u=k/20,p=G.point(w,(i+u)/n),a=G.point(w,i/n),b=G.point(w,(i+1)/n);m=Math.max(m,Math.hypot(p.x-a.x-(b.x-a.x)*u,p.y-a.y-(b.y-a.y)*u));}
 return m;}
test('precision · the facet error bound is exact; 16 facets (baseline) vs 1 mm tolerance on typical, pronounced and long walls',()=>{
 const cases=[['typical 4 m',W(4000,2000,1500),16,2.93,28],['pronounced 3 m',W(3000,1500,2800),16,5.47,38],['long 60 m',W(60000,30000,20000),16,39.06,100]];
 for(const [name,w,n0,dev0,n1] of cases){
  assert.equal(G.facetCount(w),n0,name);near(G.deviationBound(w),dev0,1e-3,name+' baseline bound');
  near(measuredDeviation(w),G.deviationBound(w),1e-9,name+' bound is attained');
  assert.equal(G.facetCount(w,{toleranceMm:1}),n1,name);assert.ok(measuredDeviation(w,{toleranceMm:1})<=1+1e-9,name+' ≤ 1 mm');
  const T=G.arcLength(w);assert.ok(T-G.pathProfile(w,{toleranceMm:1}).length<T-G.pathProfile(w).length,name+' length improves');}
 assert.equal(G.facetCount(wall(),{toleranceMm:1}),1,'straight walls stay one facet');
 assert.equal(G.facetCount(W(1e6,5e5,4e5),{toleranceMm:.001}),G.MAX_FACETS,'capped');
});
test('conservation · successive exact splits: pieces are the original curve, length and heights conserved',()=>{
 const w={...W(12000,6000,5000),heightEndMm:1500};let pieces=[{w,t0:0,t1:1}],seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let g=0;g<10;g++){const i=Math.floor(rnd()*pieces.length),p=pieces[i],L=G.pathProfile(p.w).length,r=G.splitAt(p.w,L*(.15+.7*rnd()),[],{newId:'p'+g}),tm=p.t0+r.param*(p.t1-p.t0);
  pieces.splice(i,1,{w:r.first,t0:p.t0,t1:tm},{w:r.second,t0:tm,t1:p.t1});}
 pieces.forEach((p,i)=>{if(i)assert.deepEqual(p.w.start,pieces[i-1].w.end,'joined exactly');
  for(const s of [0,.3,.7,1]){const q=G.point(p.w,s),o=G.point(w,p.t0+s*(p.t1-p.t0));assert.ok(Math.hypot(q.x-o.x,q.y-o.y)<1e-6,'on the original curve');
   near(G.heightAtParam(p.w,s),G.heightAtParam(w,p.t0+s*(p.t1-p.t0)),1e-9,'height');}});
 near(pieces.reduce((s,p)=>s+G.arcLength(p.w),0),G.arcLength(w),1e-9,'true length');
});
/** True distance from q to the curve: coarse scan, then ternary search on the parameter (the squared distance is
    unimodal near its minimum). */
function distanceToCurve(w,q){const d=t=>{const p=G.point(w,t);return Math.hypot(p.x-q.x,p.y-q.y);};let best=0;
 for(let i=1;i<=2000;i++)if(d(i/2000)<d(best/2000))best=i;let a=Math.max(0,(best-1)/2000),b=Math.min(1,(best+1)/2000);
 for(let i=0;i<100;i++){const m1=a+(b-a)/3,m2=b-(b-a)/3;if(d(m1)<d(m2))b=m2;else a=m1;}return d((a+b)/2);}
test('conservation · rounding to whole mm (as project-core stores): joined exactly, drift bounded by 0.71 mm per generation',()=>{
 const w=W(12000,6000,5000);let pieces=[{w,depth:0}],seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let g=0;g<12;g++){const i=Math.floor(rnd()*pieces.length),p=pieces[i],r=G.splitAt(p.w,G.pathProfile(p.w).length*(.2+.6*rnd()),[],{roundMm:true,newId:'p'+g});
  pieces.splice(i,1,{w:r.first,depth:p.depth+1},{w:r.second,depth:p.depth+1});}
 let worst=0;
 pieces.forEach((p,i)=>{if(i)assert.deepEqual(p.w.start,pieces[i-1].w.end);for(const k of ['x','y'])assert.ok(Number.isInteger(p.w.end[k])&&Number.isInteger(p.w.curve.control[k]));
  let m=0;for(let k=0;k<=20;k++)m=Math.max(m,distanceToCurve(w,G.point(p.w,k/20)));
  assert.ok(m<=Math.SQRT1_2*p.depth+0.01,`piece ${i} depth ${p.depth} drift ${m}`);worst=Math.max(worst,m);});
assert.ok(worst<1,`measured worst drift (0.51 mm on 18/11) ${worst.toFixed(3)} mm after 12 rounded splits`);
 near(pieces.reduce((s,p)=>s+G.arcLength(p.w),0),G.arcLength(w),1e-4,'true length within 0.1 per mil');
});
test('conservation · openings keep their place in plan across splits (anchored by parameter)',()=>{
 const w={...W(8000,4000,3500),heightEndMm:2400},ops=[{...door,offsetMm:600},{...door,id:'e',offsetMm:6200}];
 for(const opts of [{},{toleranceMm:.1}]){const r=G.splitAt(w,4000,ops,opts);
  assert.deepEqual(r.blocked,[]);assert.ok(r.maxDriftMm<=2*G.deviationBound(w,G.facetCount(w,opts))+1e-9,`drift ${r.maxDriftMm}`);
  for(const o of r.openings){const piece=o.part==='first'?r.first:r.second;assert.equal(o.wallId,piece.id);assert.deepEqual(G.validateOpening(piece,o,opts),[]);}}
 assert.ok(G.splitAt(w,4000,ops,{toleranceMm:.1}).maxDriftMm<0.2,'fine resolution: sub-millimetre');
});
test('conservation · long straight wall, many splits: exact lengths and linear heights',()=>{
 let pieces=[wall({end:{x:100000,y:0},heightEndMm:1000})];
 for(let g=0;g<20;g++){const p=pieces.shift(),r=G.splitAt(p,G.pathProfile(p).length/3,[],{newId:'s'+g});pieces.push(r.first,r.second);}
 near(pieces.reduce((s,p)=>s+G.pathProfile(p).length,0),100000,1e-12);
 for(const p of pieces)near(G.startHeight(p),2500-1500*p.start.x/100000,1e-9,'height follows the original slope');
});

// ── 3. Protection against degraded saves and information loss ───────────────────────────────────────────────────
const sloped=wall({id:'s',end:{x:6000,y:0},heightEndMm:1200});
const project=()=>({walls:[{...arc,id:'c'},sloped,wall({id:'p',start:{x:0,y:3000},end:{x:5000,y:3000}})],openings:[{...door,wallId:'c',offsetMm:1500}]});
const ALL=['wall.curve','wall.heightEnd'];
test('protection · a degraded legacy view can never be saved, in memory or after JSON',()=>{
 const prev=project(),v=G.legacyView(prev.walls[0]);
 assert.ok(Object.isFrozen(v.wall));assert.throws(()=>G.assertSavable({walls:[v.wall]}),/degraded/);
 assert.deepEqual(G.guardSave({previous:prev,next:{...prev,walls:[v.wall,...prev.walls.slice(1)]},writerFeatures:ALL}).issues.map(i=>i.code),['degraded-view','curve-lost']);
 const json=JSON.parse(JSON.stringify({walls:prev.walls.map(w=>G.legacyView(w).wall),openings:prev.openings}));
 assert.deepEqual(G.guardSave({previous:prev,next:json,writerFeatures:ALL}).issues.map(i=>i.code).sort(),['curve-lost','slope-lost']);
});
test('protection · a writer that does not know a feature cannot overwrite a project that uses it',()=>{
 const r=G.guardSave({previous:project(),next:project(),writerFeatures:[]});
 assert.deepEqual(r.issues.map(i=>i.feature),ALL);
 const plain={walls:[wall()],openings:[]};assert.equal(G.guardSave({previous:plain,next:plain,writerFeatures:[]}).ok,true,'old projects: unchanged');
});
test('protection · intended edits pass; unintended losses are named',()=>{
 const prev=project(),straight={...prev,walls:prev.walls.map(w=>w.id==='c'?(({curve,...x})=>x)(w):w)};
 assert.equal(G.guardSave({previous:prev,next:straight,writerFeatures:ALL}).ok,false);
 assert.equal(G.guardSave({previous:prev,next:straight,writerFeatures:ALL,intent:{straightened:['c']}}).ok,true);
 const r=G.splitAt(prev.walls[0],3000,prev.openings,{newId:'c2'}),afterSplit={walls:[r.first,r.second,...prev.walls.slice(1)],openings:r.openings.map(({part,driftMm,...o})=>o)};
 assert.equal(G.guardSave({previous:prev,next:afterSplit,writerFeatures:ALL,intent:{split:{c:['c','c2']}}}).ok,true);
 assert.deepEqual(G.guardSave({previous:prev,next:afterSplit,writerFeatures:ALL}).issues.map(i=>i.code),[],'first piece keeps the id');
 const noOpening={...prev,openings:[]};
 assert.deepEqual(G.guardSave({previous:prev,next:noOpening,writerFeatures:ALL}).issues.map(i=>i.code),['opening-lost']);
 assert.equal(G.guardSave({previous:prev,next:noOpening,writerFeatures:ALL,intent:{removedOpenings:['d']}}).ok,true);
});
test('protection · a save that breaks the rules is refused (opening over a slope, tight curve)',()=>{
 const p=project();p.openings.push({...win,wallId:'s',offsetMm:4800});p.walls.push(wall({id:'t',end:{x:600,y:0},thicknessMm:400,curve:{control:{x:300,y:900}}}));
 assert.deepEqual(G.guardSave({next:p,writerFeatures:ALL}).issues.map(i=>i.code).sort(),['invalid-opening','invalid-wall']);
});
