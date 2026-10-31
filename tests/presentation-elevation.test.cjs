// FT3D-4: façade candidates for the narrative elevation — pure descriptor (FloorPlanPresentationElevation).
// Contract §4, §5, §6 and §18.
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../js/presentation-elevation-core.js'),Exterior=require('../js/exterior-core.js'),ref=require('../js/reference-project.js');
const rect=(id,x0,y0,x1,y1)=>({id,polygon:[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}]});
const poly=(id,pts)=>({id,polygon:pts.map(([x,y])=>({x,y}))});
let wid=0;const wall=(x0,y0,x1,y1,extra={})=>({id:'w'+(++wid),start:{x:x0,y:y0},end:{x:x1,y:y1},thicknessMm:200,heightMm:2700,status:'existing',...extra});
const ring=pts=>pts.map((p,i)=>{const q=pts[(i+1)%pts.length];return wall(p[0],p[1],q[0],q[1]);});
const box=(x0,y0,x1,y1)=>ring([[x0,y0],[x1,y0],[x1,y1],[x0,y1]]);
const proj=(walls,rooms=[],openings=[],extra={})=>({walls,rooms,openings,defaults:{wallHeightMm:2800},...extra});
const one=(p,extra={})=>E.derive({levels:[{levelId:null,project:p}],...extra});
const rectangle=()=>proj(box(0,0,10000,6000),[rect('r',0,0,10000,6000)]);
const ids=d=>d.candidates.map(c=>c.id);
const angles=d=>d.candidates.map(c=>Math.round(c.anglePlanDeg));

test('1. simple rectangle: four stable candidates, plan-up first and clockwise',()=>{
 const d=one(rectangle());
 assert.equal(d.supported,true);assert.equal(d.partial,false);
 assert.deepEqual(ids(d),['facade-A','facade-B','facade-C','facade-D']);
 assert.deepEqual(angles(d),[0,90,180,270]);
 assert.deepEqual(d.candidates.map(c=>c.totalFacadeLengthMm),[10000,6000,10000,6000]);
 assert.deepEqual(d.candidates.map(c=>c.label),['Fachada A','Fachada B','Fachada C','Fachada D']);
 const a=d.candidates[0];
 assert.deepEqual(a.normalPlan.map(v=>v+0),[0,-1]);assert.deepEqual(a.tangentPlan.map(v=>v+0),[1,0],'clockwise tangent of plan-up is plan-right');
 assert.equal(a.widthMm,10000);assert.equal(a.heightMm,2700);assert.deepEqual(a.centerMm,{x:5000,y:0});
 for(const c of d.candidates)for(const k of ['id','wallRefs','openingRefs','normalPlan','tangentPlan','anglePlanDeg','label','centerMm','widthMm','heightMm','totalFacadeLengthMm','openingCount'])assert.ok(k in c,k);
});
test('2. only walls the Exterior authority marks as façade count',()=>{
 const p=rectangle();p.walls.push(wall(5000,0,5000,6000));p.rooms=[rect('a',0,0,5000,6000),rect('b',5000,0,10000,6000)];
 const ext=Exterior.derive(p),inner=p.walls.at(-1).id;
 assert.equal(ext.walls.find(w=>w.wallId===inner).status,'interior');
 const d=one(p),refs=d.candidates.flatMap(c=>c.wallRefs.map(r=>r.wallId));
 assert.ok(!refs.includes(inner),'the partition between two rooms is not a façade');
 assert.equal(refs.length,ext.walls.filter(w=>w.status==='facade').length);
 // A wall Exterior marks «unavailable» (no room on either side) is not a façade either.
 const q=rectangle();q.walls.push(wall(20000,0,25000,0));const loose=q.walls.at(-1).id;
 assert.ok(!one(q).candidates.flatMap(c=>c.wallRefs.map(r=>r.wallId)).includes(loose));
});
test('3. demolished walls never come back',()=>{
 const p=rectangle();p.walls[0].status='demolished';
 const d=one(p);assert.ok(!d.candidates.flatMap(c=>c.wallRefs.map(r=>r.wallId)).includes(p.walls[0].id));
 assert.deepEqual(angles(d),[90,180,270],'the north side without its wall is not a façade');
});
test('4. outward normal from the rooms, whatever the wall direction',()=>{
 const p=proj(ring([[0,0],[0,6000],[10000,6000],[10000,0]]),[rect('r',0,0,10000,6000)]);// drawn the other way round
 assert.deepEqual(angles(one(p)),[0,90,180,270]);
 const d=one(p);assert.deepEqual(d.candidates[0].normalPlan.map(v=>v+0),[0,-1]);assert.deepEqual(d.candidates[3].normalPlan.map(v=>v+0),[-1,0]);
});
test('5. ambiguous normal: left out of the candidates without reclassifying the wall (partial)',()=>{
 const p=rectangle();p.walls.push(wall(5000,0,5000,6000));p.rooms=[rect('a',0,0,5000,6000),rect('b',5000,0,10000,6000)];
 const inner=p.walls.at(-1).id;
 // An authority that (in a future version) calls that wall a façade: rooms on both sides, so its outside cannot be shown.
 const stub={derive:project=>{const r=Exterior.derive(project);return {...r,walls:r.walls.map(w=>w.wallId===inner?{...w,status:'facade'}:w)};}};
 const d=E.derive({levels:[{project:p}]},{exterior:stub});
 assert.equal(d.supported,true);assert.equal(d.partial,true);
 assert.deepEqual(d.unoriented,[{levelId:null,wallId:inner}]);
 assert.ok(!d.candidates.flatMap(c=>c.wallRefs.map(r=>r.wallId)).includes(inner));
});
test('6. grouping in 45° sectors: a slightly rotated plan keeps four façades, a 30° one moves sector',()=>{
 const rot=(deg,w,h)=>{const a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a),pts=[[0,0],[w,0],[w,h],[0,h]].map(([x,y])=>[Math.round(x*c-y*s),Math.round(x*s+y*c)]);return proj(ring(pts),[poly('r',pts)]);};
 const d10=one(rot(10,10000,6000));assert.deepEqual(d10.candidates.map(c=>c.sector),[0,2,4,6]);assert.deepEqual(angles(d10),[10,100,190,280]);
 const d30=one(rot(30,10000,6000));assert.deepEqual(d30.candidates.map(c=>c.sector),[1,3,5,7],'30° → NE sector, 120° → SE, 210° → SW, 300° → NW (±22.5°)');
});
test('7. irregular (L) plan: walls on the same side add up into one candidate',()=>{
 const pts=[[0,0],[10000,0],[10000,4000],[6000,4000],[6000,8000],[0,8000]];
 const d=one(proj(ring(pts),[poly('r',pts)]));
 assert.deepEqual(angles(d),[0,90,180,270]);
 const right=d.candidates[1],down=d.candidates[2];
 assert.equal(right.totalFacadeLengthMm,8000);assert.equal(right.wallRefs.length,2);assert.equal(down.totalFacadeLengthMm,10000);assert.equal(down.wallRefs.length,2);
 assert.equal(right.widthMm,8000,'width spans the two stepped walls along the façade');
});
test('8. diagonal façades: a chamfered corner gives its own 45° candidate, not forced to N/S/E/O',()=>{
 const pts=[[0,0],[8000,0],[10000,2000],[10000,6000],[0,6000]];
 const d=one(proj(ring(pts),[poly('r',pts)]));
 assert.deepEqual(angles(d),[0,45,90,180,270]);assert.equal(d.candidates.length,5);
 const diamond=[[5000,0],[10000,5000],[5000,10000],[0,5000]];
 assert.deepEqual(angles(one(proj(ring(diamond),[poly('r',diamond)]))),[45,135,225,315]);
});
test('9. stable ids: same order and names whatever the order walls are listed in',()=>{
 const p=rectangle(),q=rectangle();q.walls.reverse();
 assert.deepEqual(ids(one(p)),ids(one(q)));assert.deepEqual(angles(one(p)),angles(one(q)));
 const d=one(proj(box(0,0,10000,6000).filter((_,i)=>i!==0),[rect('r',0,0,10000,6000)]));
 assert.deepEqual(ids(d),['facade-A','facade-B','facade-C'],'letters follow the candidates found, from plan-up clockwise');
 assert.deepEqual(angles(d),[90,180,270]);
});
test('10. default = the longest total façade length',()=>{
 const d=one(proj(box(0,0,6000,10000),[rect('r',0,0,6000,10000)]));
 assert.equal(d.defaultId,'facade-B','the long east side (10 m) wins over the 6 m sides');
});
test('11. equal length → the most openings',()=>{
 const p=rectangle(),south=p.walls[2];
 p.openings=[{id:'o1',wallId:south.id,kind:'window',offsetMm:1000,widthMm:1200,heightMm:1200,sillHeightMm:900},{id:'o2',wallId:south.id,kind:'door',offsetMm:4000,widthMm:900,heightMm:2100}];
 const d=one(p);assert.equal(d.defaultId,'facade-C');
 const c=d.candidates.find(x=>x.id==='facade-C');assert.equal(c.openingCount,2);assert.deepEqual(c.openingRefs,[{levelId:null,openingId:'o1'},{levelId:null,openingId:'o2'}]);
});
test('12. equal length and openings → the first in angular order',()=>{
 assert.equal(one(rectangle()).defaultId,'facade-A');
 assert.equal(one(proj(box(0,0,8000,8000),[rect('r',0,0,8000,8000)])).defaultId,'facade-A');
});
test('13. without north: neutral labels, no cardinal invented',()=>{
 const d=one(rectangle());
 for(const c of d.candidates){assert.equal(c.cardinal,null);assert.equal(c.trueAzimuthDeg,null);assert.match(c.label,/^Fachada [A-D]$/);}
 assert.equal(one(rectangle(),{northOffsetDeg:undefined}).candidates[0].cardinal,null);
 assert.equal(one(rectangle(),{northOffsetDeg:NaN}).candidates[0].cardinal,null);
});
test('14. with north: cardinal from wrap(anglePlanDeg − northOffsetDeg)',()=>{
 const d0=one(rectangle(),{northOffsetDeg:0});assert.deepEqual(d0.candidates.map(c=>c.cardinal),['norte','este','sur','oeste']);
 assert.deepEqual(d0.candidates.map(c=>c.label),['Fachada A · norte','Fachada B · este','Fachada C · sur','Fachada D · oeste']);
 const d90=one(rectangle(),{northOffsetDeg:90});assert.deepEqual(d90.candidates.map(c=>c.cardinal),['oeste','norte','este','sur']);
 assert.equal(d90.candidates[0].trueAzimuthDeg,270);assert.equal(d90.candidates[0].id,'facade-A','ids stay neutral');
});
test('15. north not a multiple of 45°',()=>{
 const d=one(rectangle(),{northOffsetDeg:30});
 assert.deepEqual(d.candidates.map(c=>Math.round(c.trueAzimuthDeg)),[330,60,150,240]);
 assert.deepEqual(d.candidates.map(c=>c.cardinal),['noroeste','noreste','sureste','suroeste']);
 assert.deepEqual(one(rectangle(),{northOffsetDeg:22.4}).candidates.map(c=>c.cardinal),['norte','este','sur','oeste']);
 assert.deepEqual(one(rectangle(),{northOffsetDeg:22.6}).candidates.map(c=>c.cardinal),['noroeste','noreste','sureste','suroeste']);
});
test('16. partial: a tiny façade group is excluded and said so, the others continue',()=>{
 // A 300 mm bay (two 45° faces of 300 mm) is a degenerate façade group; the main four sides are kept.
 const pts=[[0,0],[10000,0],[10000,6000],[5300,6000],[5000,6300],[4700,6000],[0,6000]];
 const d=one(proj(ring(pts),[poly('r',pts)]));
 assert.equal(d.supported,true);assert.equal(d.partial,true);
 assert.deepEqual(d.excluded.map(x=>x.reason),['degenerate-facade','degenerate-facade']);
 assert.deepEqual(angles(d),[0,90,180,270]);
});
test('17. no façade walls: unsupported with its reason',()=>{
 const d=one(proj(box(0,0,10000,6000),[]));
 assert.equal(d.supported,false);assert.equal(d.reason,'no-facade-walls');assert.match(d.message,/fachada/);assert.deepEqual(d.candidates,[]);assert.equal(d.defaultId,null);
});
test('18. façade walls without a demonstrable outside: no-oriented-facade-walls',()=>{
 const p=proj([wall(5000,0,5000,6000)],[rect('a',0,0,5000,6000),rect('b',5000,0,10000,6000)]),w=p.walls[0].id;
 const stub={derive:()=>({walls:[{wallId:w,status:'facade',reason:null}],openings:[],exteriorRooms:[],status:'available'})};
 const d=E.derive({levels:[{project:p}]},{exterior:stub});
 assert.equal(d.supported,false);assert.equal(d.reason,'no-oriented-facade-walls');assert.deepEqual(d.unoriented,[{levelId:null,wallId:w}]);
});
test('19. degenerate: façades too small to read; invalid geometry',()=>{
 const d=one(proj(box(0,0,400,400),[rect('r',0,0,400,400)]));
 assert.equal(d.supported,false);assert.equal(d.reason,'degenerate-facade');assert.ok(d.excluded.length>=4);
 assert.equal(E.derive({levels:[]}).reason,'invalid-geometry');
 assert.equal(E.derive({}).reason,'invalid-geometry');
 assert.equal(E.derive({levels:[{project:{rooms:[]}}]}).reason,'invalid-geometry');
 assert.equal(one(proj([],[rect('r',0,0,1000,1000)])).reason,'invalid-geometry','no wall at all');
});
const building=(offset={x:0,y:0})=>({levels:[
 {levelId:'L0',project:rectangle(),offsetMm:{x:0,y:0},elevationMm:0},
 {levelId:'L1',project:proj(box(0,0,6000,6000),[rect('u',0,0,6000,6000)]),offsetMm:offset,elevationMm:3000}]});
test('20. two levels: façades of the same side add up into one candidate, the façade appears once',()=>{
 const d=E.derive(building());
 assert.equal(d.candidates.length,4);
 const a=d.candidates[0];assert.equal(a.totalFacadeLengthMm,16000);assert.deepEqual(a.levels,['L0','L1']);
 assert.deepEqual(a.wallRefs.map(r=>r.levelId),['L0','L1']);
 assert.equal(a.baseMm,0);assert.equal(a.heightMm,5700,'ground floor to the top of the upper walls');
 assert.equal(d.envelope.topMm,5700);assert.equal(d.envelope.bottomMm,0);
 assert.equal(d.defaultId,'facade-A');
});
test('21. level offsets are respected in the building frame',()=>{
 const d=E.derive(building({x:3000,y:0}));
 const east=d.candidates.find(c=>Math.round(c.anglePlanDeg)===90);
 assert.equal(east.wallRefs.length,2);assert.equal(east.widthMm,6000);
 assert.equal(d.envelope.maxX,10100,'upper box at x 3000–9000 stays inside the lower 0–10000');
 const far=E.derive(building({x:8000,y:0}));
 assert.equal(far.envelope.maxX,14100,'the upper level reaches beyond the lower one');
 const a=far.candidates[0];assert.equal(a.widthMm,14000);assert.equal(a.frame.widthMm,14200);assert.equal(a.frame.centerMm.x,7000);
});
test('22. the input is not mutated',()=>{
 const input=building({x:500,y:-200}),copy=structuredClone(input);
 E.derive({...input,northOffsetDeg:30});assert.deepEqual(input,copy);
 const p=structuredClone(ref),c=structuredClone(p);one(p);assert.deepEqual(p,c);
});
test('23. determinism: the same input gives a deepEqual result',()=>{
 const input={...building({x:500,y:0}),northOffsetDeg:17},a=E.derive(input),b=E.derive(structuredClone(input));
 assert.deepEqual(a,b);assert.deepEqual(JSON.parse(JSON.stringify(a)),a,'plain data, no functions');
});
test('reference project: supported with façades derived from its rooms',()=>{
 const d=one(structuredClone(ref));assert.equal(d.supported,true);assert.ok(d.candidates.length>=4);assert.ok(d.candidates.every(c=>/^facade-[A-H]$/.test(c.id)));
});
