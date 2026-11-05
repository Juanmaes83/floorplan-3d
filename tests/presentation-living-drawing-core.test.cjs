/* Hybrid V2 «Dibujo vivo» — C0 pure core. Protagonists (D1), deterministic irregular moments, room durations and the
   moment the camera leaves (D4), pure state for seek/reverse, and the optional ambience kept apart from the project (D3). */
const {test}=require('node:test'),assert=require('node:assert/strict');
const L=require('../js/presentation-living-drawing-core.js'),Core=require('../js/project-core.js'),reference=require('../js/reference-project.js');
const catalogue=require('../assets/materials/catalog.json').entries;
const geometry=Core.geometry(reference);
const room=id=>geometry.rooms.find(r=>r.id===id);
const deepFreeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);for(const v of Object.values(o))deepFreeze(v);}return o;};

test('HV2-C0 rooms of the reference home are classified from what they contain (and their name as a fallback)',()=>{
 const cls=id=>L.classify(room(id),L.objectsIn(reference,room(id)));
 assert.equal(cls('rom_living'),'living');assert.equal(cls('rom_kitchen'),'kitchen');assert.equal(cls('rom_dining'),'dining');
 assert.equal(cls('rom_master'),'bedroom');assert.equal(cls('rom_mbath'),'bathroom');
 assert.equal(L.classify({id:'x',name:'Salón principal',poly:[[0,0],[1,0],[1,1]]},[]),'living');
 assert.equal(L.classify({id:'x',family:'kitchen',poly:[[0,0],[1,0],[1,1]]},[{type:'sofa'}]),'kitchen','a declared family wins');
});

test('HV2-C0 protagonists follow the room ranking and the D1 rules (no TV or plant first, doors never, one plant)',()=>{
 const living=L.protagonists('living',L.objectsIn(reference,room('rom_living')));
 assert.deepEqual(living.map(p=>p.type),['sofa','coffeetable','rug','tvstand','armchair','plant'].filter(t=>living.some(p=>p.type===t)));
 assert.equal(living[0].type,'sofa');assert.ok(living.length<=L.LIVING.maxProtagonists);
 assert.ok(living.filter(p=>p.type==='plant').length<=1,'at most one plant');
 const kitchen=L.protagonists('kitchen',L.objectsIn(reference,room('rom_kitchen')));assert.equal(kitchen[0].type,'counter');
 const bedroom=L.protagonists('bedroom',L.objectsIn(reference,room('rom_master')));assert.equal(bedroom[0].type,'bed');
 // A room where the TV and a plant would rank first by size: neither may open it.
 const tvRoom=[{id:'tv',type:'tvstand',color:'#e2cfb4',position:{x:0,y:0},size:{widthMm:2400,depthMm:500}},{id:'p',type:'plant',position:{x:1,y:1},size:{widthMm:600,depthMm:600}},{id:'a',type:'armchair',position:{x:2,y:2},size:{widthMm:800,depthMm:800}}];
 const r=L.protagonists('living',tvRoom);assert.equal(r[0].type,'armchair');assert.equal(r.find(p=>p.type==='tvstand').dark,true);
 const dark=L.protagonists('living',[{id:'s',type:'sofa',color:'#151515',position:{x:0,y:0},size:{widthMm:2000,depthMm:900}},{id:'c',type:'coffeetable',color:'#e8dccb',position:{x:0,y:0},size:{widthMm:900,depthMm:500}}]);
 assert.equal(dark[0].type,'coffeetable','a near-black sofa does not open the room');
 assert.equal(L.protagonists('living',[{id:'d',type:'door',position:{x:0,y:0}}]).length,0,'doors are never protagonists');
});

test('HV2-C0 protagonists and moments are deterministic and independent of the order of project.objects',()=>{
 const shuffled={...reference,objects:reference.objects.slice().reverse()};
 assert.deepEqual(L.timeline(reference,geometry),L.timeline(structuredClone(reference),geometry));
 assert.deepEqual(L.timeline(shuffled,geometry).rooms.map(r=>r.seeds),L.timeline(reference,geometry).rooms.map(r=>r.seeds));
 assert.notDeepEqual(L.seeds('a',[{id:1},{id:2},{id:3},{id:4}]).map(s=>s.at),L.seeds('b',[{id:1},{id:2},{id:3},{id:4}]).map(s=>s.at),'another project or room gets other moments');
});

test('HV2-C0 moments are irregular: first at 0.9 s, gaps ≥ 0.45 s, never two equal gaps in a row',()=>{
 for(const key of ['prj_reference-home|rom_living','x','y','z','long-key-1234']){
  const s=L.seeds(key,Array.from({length:6},(_,i)=>({id:'o'+i,type:'sofa',rank:i}))),gaps=s.slice(1).map((x,i)=>+(x.at-s[i].at).toFixed(3));
  assert.equal(s[0].at,L.LIVING.firstSeedS);
  for(const g of gaps)assert.ok(g>=L.LIVING.minGapS-1e-9,`gap ${g} ≥ ${L.LIVING.minGapS} (${key})`);
  for(let i=1;i<gaps.length;i++)assert.ok(Math.abs(gaps[i]-gaps[i-1])>=L.LIVING.minGapDeltaS-1e-6,`gaps ${gaps[i-1]} and ${gaps[i]} are not mechanically equal (${key})`);
 }
});

test('HV2-C0 rooms last 5–8 s by protagonists, the camera leaves at 70–80 % and every stain lands inside its room',()=>{
 assert.equal(L.roomDuration(1),5);assert.equal(L.roomDuration(6),6.5);assert.equal(L.roomDuration(20),8);
 const tl=L.timeline(reference,geometry,{order:['rom_living','rom_dining','rom_kitchen','rom_master']});
 assert.deepEqual(tl.rooms.map(r=>r.roomId),['rom_living','rom_dining','rom_kitchen','rom_master']);
 let t=0;for(const r of tl.rooms){assert.equal(r.start,+t.toFixed(3));assert.ok(r.duration>=5&&r.duration<=8);
  assert.ok(r.leaveFrac>=.7&&r.leaveFrac<=.8);assert.ok(r.seeds.every(s=>s.at<r.duration));assert.equal(r.seeds[0].id,r.protagonists[0].id);t+=r.duration;}
 assert.equal(tl.total,+t.toFixed(3));
 assert.deepEqual(L.timeline(reference,geometry,{order:['rom_living','nope']}).missing,['nope']);
});

test('HV2-C0 stateAt is pure: seek and reverse give the same state; reduced motion holds the camera with the same stains',()=>{
 const tl=L.timeline(reference,geometry,{order:['rom_living','rom_kitchen']}),ps=[0,.1,.33,.5,.71,.9,1];
 const forward=ps.map(p=>L.stateAt(tl,p)),backward=ps.slice().reverse().map(p=>L.stateAt(tl,p)).reverse();
 assert.deepEqual(forward,backward);
 const mid=L.stateAt(tl,.3);assert.equal(mid.roomId,'rom_living');assert.ok(mid.seeds.some(s=>s.landed)&&mid.seeds.some(s=>!s.landed),'drawing and realism coexist mid-room');
 const leaving=L.stateAt(tl,(tl.rooms[0].leaveAt+.05)/tl.total);assert.equal(leaving.roomId,'rom_living');assert.equal(leaving.leaving,true,'the camera leaves before the room is over');
 const red=L.timeline(reference,geometry,{order:['rom_living','rom_kitchen'],reduced:true}),rs=L.stateAt(red,.3);
 assert.equal(rs.cameraHold,true);assert.equal(rs.leaving,false);assert.deepEqual(rs.seeds,mid.seeds);
 assert.equal(L.stateAt(L.timeline(reference,geometry,{order:[]}),.5).roomIndex,-1);
});

test('HV2-C0 ambience is optional, labelled and never touches the project (D3)',()=>{
 const before=JSON.stringify(reference),frozen=deepFreeze(structuredClone(reference));
 const a=L.ambience(frozen,geometry,catalogue);
 assert.equal(JSON.stringify(reference),before);
 assert.equal(a.source,'ambientacion');assert.equal(a.optional,true);assert.equal(a.defaultOn,false);assert.equal(a.storesInProject,false);assert.match(a.label,/no forma parte del proyecto/);
 const living=a.suggestions.find(s=>s.roomId==='rom_living'&&s.surface==='floor');assert.equal(living.suggested,'surface-oak-wood-planks');assert.equal(living.original,reference.rooms.find(r=>r.id==='rom_living').floorMaterialId,'the client original is kept beside the suggestion');
 assert.ok(a.suggestions.every(s=>catalogue.some(e=>e.id===s.suggested&&e.applications.includes(s.surface==='walls'?'wall':'floor'))),'only real catalogue finishes for their surface');
 assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.suggestions));
 assert.equal(L.ambience(reference,geometry,[]).suggestions.length,0,'no catalogue, no suggestion');
 // a floor the client finished with a catalogue surface stays the client's: no suggestion over it
 const chosen=structuredClone(reference);chosen.materials.push({id:'mat_client_oak',category:'floor',name:'Roble del cliente',appearance:{preset:'surface-oak-wood-planks',color:'#a27553'}});
 chosen.rooms.find(r=>r.id==='rom_living').floorMaterialId='mat_client_oak';
 const b=L.ambience(chosen,geometry,catalogue);assert.equal(b.suggestions.some(s=>s.roomId==='rom_living'&&s.surface==='floor'),false);
 assert.ok(b.suggestions.some(s=>s.roomId==='rom_dining'&&s.surface==='floor'),'the other rooms keep their suggestion');
});

test('HV2-C0 two-level building: each level gets its own protagonists and moments',()=>{
 const S=require('./fixtures/stair-conflict-building.cjs'),b=S.build().building;
 for(const level of b.levels){const g=Core.geometry(level.project),tl=L.timeline(level.project,g);
  for(const r of tl.rooms){assert.ok(r.protagonists.length>0);assert.ok(!r.protagonists[0].dark&&r.protagonists[0].type!=='plant');}
  assert.deepEqual(tl,L.timeline(structuredClone(level.project),g));}
});
