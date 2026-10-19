// BW5: furniture over a stair footprint or slab void of its own level. Deterministic cases first, then a seeded
// generative check against an independent sampling oracle (it complements, never replaces, the fixed cases).
const {test}=require('node:test'),assert=require('node:assert/strict');
const B=require('../js/building-core.js'),C=require('../js/project-core.js'),R=require('../js/layout-review.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js');
const F=require('./fixtures/building-fixture.cjs');
const clone=v=>JSON.parse(JSON.stringify(v));
const bw5=b=>B.warnings(b).filter(w=>w.code==='BW5');
// Fixture with one object of `level` replaced (or added) at the given pose.
function withObject(level,{id='obj_test-item',name='Mueble',type='sofa',x,y,w,d,rot=0}){
 const b=clone(F.build().building),l=b.levels[level];l.project.objects=l.project.objects.filter(o=>o.id!==id);
 l.project.objects.push({id,type,name,position:{x,y},size:{widthMm:w,depthMm:d},rotationDeg:rot,color:'#888888'});B.validate(b);return b;
}

test('the corrected fixture has no BW5', ()=>{assert.deepEqual(bw5(F.build().building),[]);});

test('bed over the slab void of the upper level: BW5 with level, object, stair, rule and evidence', ()=>{
 const b=withObject(1,{id:'obj_fixture-bed',name:'Cama',type:'bed',x:2400,y:1500,w:1600,d:2000,rot:90}),[w]=bw5(b);
 assert.equal(w.level,'lvl_fixture-upper');assert.equal(w.objectId,'obj_fixture-bed');assert.equal(w.stairId,'str_fixture-main');assert.equal(w.path,'/levels/lvl_fixture-upper/objects/obj_fixture-bed');
 assert.equal(w.evidence.zone,'hueco');assert.equal(w.evidence.penetrationMm,650);assert.equal(w.evidence.overlapAreaMm2,1100*650);
 assert.match(w.evidence.rule,/penetración > 1 mm/);assert.match(w.message,/«Cama» de «Planta primera» pisa el hueco de la escalera 1: 650 mm de penetración y 0,72 m²/);
 assert.match(w.message,/no es una comprobación normativa ni bloquea nada/);
 assert.equal(B.convexOverlap(w.evidence.overlap,w.evidence.stairPolygon),true);
});

test('sofa over the stair of the lower level: BW5 on the leaving level', ()=>{
 const [w]=bw5(withObject(0,{id:'obj_fixture-sofa',name:'Sofá',x:6000,y:1300,w:2000,d:900}));
 assert.equal(w.level,'lvl_fixture-ground');assert.equal(w.evidence.zone,'escalera');assert.equal(w.evidence.penetrationMm,100);
 assert.match(w.message,/pisa la huella de la escalera 1/);
});

test('rotated furniture: the oriented footprint decides, not its bounding box', ()=>{
 // 1000×1000 at 45°: its bounding box overlaps the void (x 2300–4700, y 1650–2550), the diamond does not.
 const apart=withObject(1,{x:1900,y:1250,w:1000,d:1000,rot:45});
 const T_=T.footprint(apart.levels[1].project.objects.at(-1)),xs=T_.map(p=>p.x),ys=T_.map(p=>p.y);
 assert.ok(Math.max(...xs)>2300&&Math.max(...ys)>1650,'bounding box reaches into the void');
 assert.deepEqual(bw5(apart),[]);
 const over=bw5(withObject(1,{x:2200,y:1550,w:1000,d:1000,rot:45}));assert.equal(over.length,1);assert.ok(over[0].evidence.penetrationMm>1);
});

test('contact without penetration and sub-tolerance overlap are not conflicts; above the tolerance is', ()=>{
 // Edge x = 2300 exactly on the void edge, then 0.5 mm and 2 mm inside.
 assert.deepEqual(bw5(withObject(1,{x:1500,y:2100,w:1600,d:800})),[],'shared edge');
 assert.deepEqual(bw5(withObject(1,{x:1500,y:2100,w:1601,d:800})),[],'0.5 mm ≤ tolerance (positions are integer mm; odd width puts the edge at 2300.5)');
 assert.deepEqual(bw5(withObject(1,{x:1500,y:1250,w:1600,d:800})),[],'corner contact at (2300, 1650)');
 const [w]=bw5(withObject(1,{x:1502,y:2100,w:1600,d:800}));assert.equal(w.evidence.penetrationMm,2);
 assert.equal(B.CONTACT_TOLERANCE_MM,1);
});

test('another level with the same XY never warns: each level uses only its own stairs in its own frame', ()=>{
 // Upper level at the ground stair's local XY (upper offset x 2600), and ground at the upper void's local XY.
 assert.deepEqual(bw5(withObject(1,{x:6100,y:2100,w:1600,d:800})),[]);
 assert.deepEqual(bw5(withObject(0,{x:3500,y:2100,w:1600,d:800})),[]);
 // Same object, same building XY (ground x 6100 = upper x 3500 + 2600): conflicts on both levels.
 assert.equal(bw5(withObject(0,{x:6100,y:2100,w:1600,d:800}))[0].level,'lvl_fixture-ground');
 assert.equal(bw5(withObject(1,{x:3500,y:2100,w:1600,d:800}))[0].level,'lvl_fixture-upper');
});

test('a stair added after the furniture is detected, and BW5 never blocks validation, JSON or ZIP', async ()=>{
 let b=withObject(1,{id:'obj_test-desk',name:'Escritorio',x:3500,y:2100,w:1200,d:600});const stair=clone(b.stairs[0]);
 b=B.removeStair(b,stair.id);assert.deepEqual(bw5(b),[]);
 b=B.setStair(b,stair);const [w]=bw5(b);assert.equal(w.objectId,'obj_test-desk');
 const text=JSON.stringify(b),again=B.prepare(text);assert.equal(B.canonical(again),B.canonical(b),'JSON keeps positions');assert.equal(bw5(again).length,1);
 const fx=F.build(),{entries,building}=await B.packageEntries(b,im=>fx.bytesFor(im.id),T.imageInfo);
 const zip=new Uint8Array(await P.zip(entries,{check:B.packagePath}).arrayBuffer()),read=await B.readEntries(await P.unzip(zip,{check:B.packagePath,required:'building.json',maxEntries:B.MAX_ENTRIES,jsonNames:['building.json','manifest.json']}),T.imageInfo);
 assert.deepEqual(read.building.levels[1].project.objects,building.levels[1].project.objects);assert.equal(bw5(read.building).length,1);
 assert.ok(!('warnings' in read.building)&&!text.includes('BW5'),'the warning is derived, never stored');
});

test('layout review reports the same conflicts, without its own stair geometry', ()=>{
 const b=withObject(1,{id:'obj_fixture-bed',name:'Cama',type:'bed',x:2400,y:1500,w:1600,d:2000,rot:90}),l=b.levels[1];
 const conflicts=B.stairConflicts(b,{levelId:l.id}),r=R.review(l.project,{stairConflicts:conflicts}),f=r.findings.find(x=>x.code==='escalera');
 assert.deepEqual(f.objects,['obj_fixture-bed','str_fixture-main']);assert.equal(f.measurementMm,conflicts[0].penetrationMm);
 assert.deepEqual(f.evidence.polygon,conflicts[0].overlap);assert.equal(f.message,bw5(b)[0].message);
 assert.equal(R.review(l.project).findings.some(x=>x.code==='escalera'),false,'single-level review: no stair input, no stair finding');
 // An unsaved edit of the level is checked with `objects`.
 assert.deepEqual(B.stairConflicts(b,{levelId:l.id,objects:[]}),[]);
});

test('seeded generative check against a sampling oracle (complements the fixed cases)', ()=>{
 let seed=20261018;const rnd=()=>(seed=(seed*1664525+1013904223)>>>0)/2**32;
 const zone=B.toLocal(B.stairFootprint(F.build().building.stairs[0]),F.build().building.levels[1]);
 const inside=(p,P)=>P.every((v,i)=>{const w=P[(i+1)%P.length];return (w.x-v.x)*(p.y-v.y)-(w.y-v.y)*(p.x-v.x)<=0;})||P.every((v,i)=>{const w=P[(i+1)%P.length];return (w.x-v.x)*(p.y-v.y)-(w.y-v.y)*(p.x-v.x)>=0;});
 let checked=0,conflicts=0;
 for(let k=0;k<400;k++){
  const o={position:{x:1500+rnd()*4000,y:800+rnd()*2600},size:{widthMm:300+rnd()*1800,depthMm:300+rnd()*1800},rotationDeg:Math.floor(rnd()*360)},fp=T.footprint(o);
  const depth=R.penetration(fp,zone);if(Math.abs(depth-B.CONTACT_TOLERANCE_MM)<20)continue;// skip the tolerance band itself
  // Oracle: a 10 mm grid over the shared bounding box; a conflict has sample points strictly inside both shapes.
  let hit=false;
  for(let x=Math.max(Math.min(...fp.map(p=>p.x)),2300);x<=Math.min(Math.max(...fp.map(p=>p.x)),4700)&&!hit;x+=10)for(let y=Math.max(Math.min(...fp.map(p=>p.y)),1650);y<=Math.min(Math.max(...fp.map(p=>p.y)),2550);y+=10)if(inside({x,y},fp)&&inside({x,y},zone)&&x>2300&&x<4700&&y>1650&&y<2550){hit=true;break;}
  const found=!!B.zoneConflict(fp,zone);if(depth>40)assert.equal(found,hit,`case ${k}`);else if(depth<0)assert.equal(found,false,`case ${k}`);
  checked++;if(found)conflicts++;
 }
 assert.ok(checked>350&&conflicts>40&&conflicts<checked-40,`balanced sample: ${conflicts}/${checked}`);
});
