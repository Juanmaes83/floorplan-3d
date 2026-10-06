const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../js/project-core.js'),T=require('../js/tracing-core.js'),R=require('../js/layout-review.js');
const obj=(id,x,y,w,d,rot=0,type='table',name=id)=>({id:'obj_'+id,type,name,position:{x,y},size:{widthMm:w,depthMm:d},rotationDeg:rot});
function room(){const p=T.blank(),c=[{x:0,y:0},{x:6000,y:0},{x:6000,y:4000},{x:0,y:4000}];for(let i=0;i<4;i++)T.wall(p,c[i],c[(i+1)%4]);return p;}
function freeze(x){if(x&&typeof x==='object'){Object.freeze(x);Object.values(x).forEach(freeze);}return x;}
const codes=r=>r.findings.map(f=>f.code+':'+f.objects.join('+'));

test('footprint helper is the W3 oriented footprint (clockwise rotation, y down)',()=>{
 const f=T.footprint(obj('a',1000,1000,2000,1000,90));
 assert.deepEqual(f.map(v=>({x:Math.round(v.x)+0,y:Math.round(v.y)+0})),[{x:1500,y:0},{x:1500,y:2000},{x:500,y:2000},{x:500,y:0}]);
});

test('overlap uses the rotated footprint: no false positive where an axis-aligned box would overlap',()=>{
 const p=room();const s=1000/Math.SQRT2;
 // Two 1000 mm squares rotated 45°, touching corner-to-edge region only through their enclosing boxes.
 p.objects=[obj('a',2000,2000,1000,1000,45),obj('b',2000+s*2+10,2000,1000,1000,45)];
 assert.deepEqual(codes(R.review(p)),[]);
 p.objects[1].position.x=2000+s*2-100;
 const r=R.review(p);assert.deepEqual(codes(r),['solape:obj_a+obj_b']);
 assert.ok(r.findings[0].measurementMm>0&&r.findings[0].measurementMm<=100);
 assert.match(r.findings[0].limitation,/no evalúa altura/);
});

test('touching footprints are not an overlap; positive penetration is measured in mm',()=>{
 const p=room();p.objects=[obj('a',1000,1000,1000,1000),obj('b',2000,1000,1000,1000)];
 assert.deepEqual(codes(R.review(p)),[]);
 p.objects[1].position.x=1950;const r=R.review(p);assert.equal(r.findings[0].measurementMm,50);
});

test('clearance needs an explicit threshold; without it the check is insufficient but overlaps still run',()=>{
 const p=room();p.objects=[obj('a',1000,1000,1000,1000),obj('b',2100,1000,1000,1000),obj('c',4000,1000,1000,1000),obj('d',4900,1000,1000,1000)];
 const r=R.review(p);
 assert.equal(r.checks.holgura.status,'insufficient_evidence');assert.equal(r.checks.solapes.status,'checked');
 assert.equal(r.status,'partial');assert.deepEqual(codes(r),['solape:obj_c+obj_d']);
 for(const bad of [0,-5,'x',NaN])assert.throws(()=>R.review(p,{clearanceMm:bad}),/mayor que 0/);
 assert.equal(R.review(p,{clearanceMm:''}).checks.holgura.status,'insufficient_evidence');
});

test('clearance threshold boundary: equal is fine, just below is reported once per pair',()=>{
 const p=room();p.objects=[obj('a',1000,1000,1000,1000),obj('b',2600,1000,1000,1000)];
 assert.deepEqual(codes(R.review(p,{clearanceMm:600})),[]);
 const r=R.review(p,{clearanceMm:601});assert.deepEqual(codes(r),['holgura:obj_a+obj_b']);
 assert.equal(r.findings[0].measurementMm,600);assert.equal(r.findings[0].thresholdMm,601);
 assert.equal(r.checks.holgura.status,'checked');
 p.objects[1].rotationDeg=30;const rotated=R.review(p,{clearanceMm:601});
 assert.ok(rotated.findings[0].measurementMm<600,'rotated corner gets closer than the axis-aligned gap');
});

test('a wall between two pieces is not a free gap, but a doorway in that wall is',()=>{
 const p=room();const w=T.wall(p,{x:3000,y:0},{x:3000,y:4000});
 p.objects=[obj('left',2500,1000,800,800),obj('right',3500,1000,800,800)];
 let r=R.review(p,{clearanceMm:500});
 assert.deepEqual(codes(r),[]);assert.equal(r.excluded.length,1);assert.match(r.excluded[0].reason,/atraviesa un muro/);
 T.opening(p,w.id,{x:3000,y:1000},'opening',900);
 r=R.review(p,{clearanceMm:500});assert.deepEqual(codes(r),['holgura:obj_left+obj_right']);assert.equal(r.excluded.length,0);
});

test('door sweep follows the stored hinge and side; contact angle is reported',()=>{
 const p=room();const w=p.walls[0];// y=0, start (0,0) → end (6000,0); left of start→end is −y (outside), right is +y (inside).
 const door=T.opening(p,w.id,{x:1400,y:0},'door',800);door.swing={hinge:'start',side:'right'};
 const g=C.geometry(p).doors[0];assert.deepEqual(g.h,[1000,w.thicknessMm/2]);
 p.objects=[obj('chair',1500,600,300,300)];
 let r=R.review(p);const f=r.findings.find(f=>f.code==='puerta');
 assert.ok(f,'chair inside the swept quarter circle');assert.deepEqual(f.objects,[door.id,'obj_chair']);
 assert.ok(f.measurementDeg>0&&f.measurementDeg<90);assert.equal(r.checks.puertas.status,'checked');
 // Same chair with the door opening outwards: no interference.
 door.swing.side='left';assert.equal(R.review(p).findings.length,0);
 // Hinge at the other jamb mirrors the sector; a chair beyond the radius never interferes.
 door.swing={hinge:'end',side:'right'};p.objects=[obj('far',1300,1500,300,300)];assert.equal(R.review(p).findings.length,0);
 p.objects=[obj('near',1700,250,200,200)];assert.equal(R.review(p).findings[0].code,'puerta');
});

test('door without swing data is never declared blocked: partial or insufficient evidence',()=>{
 const p=room();const a=T.opening(p,p.walls[0].id,{x:1400,y:0},'door',800),b=T.opening(p,p.walls[2].id,{x:3000,y:4000},'door',800);
 delete a.swing;p.objects=[obj('chair',1300,400,300,300)];
 let r=R.review(p);
 assert.equal(r.checks.puertas.status,'partial');assert.ok(r.skipped.some(s=>s.id===a.id&&/swing/.test(s.reason)));
 assert.ok(!r.findings.some(f=>f.objects.includes(a.id)),'geometry default hinge is not used as evidence');
 delete b.swing;r=R.review(p);assert.equal(r.checks.puertas.status,'insufficient_evidence');
 p.openings=p.openings.filter(o=>o.kind!=='door');assert.equal(R.review(p).checks.puertas.status,'checked');
});

test('stacking by design in Rubik 3D is excluded and listed, not reported or hidden',()=>{
 const p=room();p.objects=[obj('rug',2000,2000,2400,1700,0,'rug'),obj('sofa',2000,2000,2000,900,0,'sofa'),obj('counter',4500,600,1600,600,0,'counter'),obj('stove',4500,600,750,450,0,'stove'),obj('stove2',2000,2400,750,450,0,'stove')];
 const r=R.review(p);
 assert.deepEqual(codes(r),['solape:obj_sofa+obj_stove2']);
 assert.equal(r.excluded.length,3);assert.ok(r.excluded.every(e=>/revestimiento de suelo|encimera/.test(e.reason)));
});

test('invalid or missing geometry is skipped and degrades the status',()=>{
 const p=room();p.objects=[obj('a',1000,1000,1000,1000),{id:'obj_bad',type:'table',name:'x',position:{x:1,y:1},size:{widthMm:0,depthMm:5},rotationDeg:0}];
 const r=R.review(p,{clearanceMm:100});assert.equal(r.checks.solapes.status,'partial');assert.equal(r.status,'partial');assert.equal(r.skipped[0].id,'obj_bad');
});

test('review is read-only: frozen projects work and the serialized project is unchanged',()=>{
 const p=C.initial(),before=JSON.stringify(p);freeze(p);
 for(const clearanceMm of [undefined,300,900])R.review(p,{clearanceMm,label:o=>o.name.toUpperCase()});
 assert.equal(JSON.stringify(p),before);
});

test('reference plan: intentional stacks excluded, swing interference measured, limits always stated',()=>{
 const p=C.initial(),r=R.review(p);
 assert.equal(r.status,'partial');assert.equal(r.checks.puertas.status,'checked');
 assert.deepEqual(codes(r),['puerta:opn_door-3+obj_template-016']);assert.equal(r.findings[0].measurementDeg,6);
 assert.equal(r.excluded.length,4);
 assert.deepEqual(r.unsupported.map(u=>u.check),['altura','muros','circulacion','normativa','mallas']);
 const withThreshold=R.review(p,{clearanceMm:300});assert.equal(withThreshold.status,'checked');
 const pairs=withThreshold.findings.map(f=>f.code+f.objects.slice().sort().join());assert.equal(new Set(pairs).size,pairs.length,'no duplicate findings');
});
