// Building presentation plan and capture batch reader (presentation-core.js). A building of two levels is presented as
// one plan: levels bottom-up, each with its own overview first and its chosen rooms in the chosen order. Stops are
// keyed by level and room, so equal room IDs on different levels stay apart. The batch reader accepts version 1 (one
// level, also the older batches without editable project) and version 2 (building), and refuses ambiguous batches.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const Core=require('../js/project-core.js'),Guide=require('../js/guide-core.js'),Pres=require('../js/presentation-core.js'),F=require('./fixtures/building-fixture.cjs');

const sources=building=>building.levels.map(l=>({levelId:l.id,name:l.name,order:l.order,project:l.project,geometry:Core.geometry(l.project),revision:Guide.revision(l.project)}));
const roomsOf=(building,i)=>building.levels[i].project.rooms.map(r=>r.id);

test('building plan: levels bottom-up, an overview per level, chosen order kept, stops keyed by level',()=>{
 const {building}=F.build(),[cocina,estar]=roomsOf(building,0),[dorm]=roomsOf(building,1);
 // Selection given upper level first and rooms reversed: levels still go bottom-up, rooms keep the chosen order.
 const plan=Pres.createBuilding(building,[...sources(building)].reverse(),'entry-1',[{levelId:'lvl_fixture-upper',roomId:dorm},{levelId:'lvl_fixture-ground',roomId:estar},{levelId:'lvl_fixture-ground',roomId:cocina}]);
 assert.equal(plan.version,2);assert.equal(plan.scope,'building');assert.equal(plan.buildingId,'bld_fixture-house');
 assert.deepEqual(plan.stops.map(s=>[s.levelId,s.kind,s.roomId]),[['lvl_fixture-ground','overview',null],['lvl_fixture-ground','room',estar],['lvl_fixture-ground','room',cocina],['lvl_fixture-upper','overview',null],['lvl_fixture-upper','room',dorm]]);
 assert.deepEqual(plan.stops.map(s=>s.id),[`level:lvl_fixture-ground:overview`,`level:lvl_fixture-ground:room:${estar}`,`level:lvl_fixture-ground:room:${cocina}`,`level:lvl_fixture-upper:overview`,`level:lvl_fixture-upper:room:${dorm}`]);
 assert.deepEqual(plan.levels.map(l=>[l.levelId,l.projectId,l.order]),[['lvl_fixture-ground','prj_fixture-ground',0],['lvl_fixture-upper','prj_fixture-upper',1]]);
 assert.ok(plan.stops.every(s=>s.levelName&&Number.isInteger(s.levelOrder)&&s.bounds&&s.areaM2>0));
});

test('building plan: a level without chosen rooms is left out; nothing chosen gives no plan; more than two levels refused',()=>{
 const {building}=F.build(),[dorm]=roomsOf(building,1);
 const plan=Pres.createBuilding(building,sources(building),'e',[{levelId:'lvl_fixture-upper',roomId:dorm},{levelId:'lvl_fixture-upper',roomId:dorm},{levelId:'lvl_fixture-ground',roomId:'rom_missing'}]);
 assert.deepEqual(plan.stops.map(s=>[s.levelId,s.kind]),[['lvl_fixture-upper','overview'],['lvl_fixture-upper','room']],'duplicates and unknown rooms ignored');
 assert.deepEqual(plan.levels.map(l=>l.levelId),['lvl_fixture-upper']);
 assert.equal(Pres.createBuilding(building,sources(building),'e',[]),null);
 const three=[...sources(building),{...sources(building)[1],levelId:'lvl_third',order:2}];
 assert.equal(Pres.createBuilding(building,three,'e',[{levelId:'lvl_fixture-upper',roomId:dorm}]),null);
 assert.equal(Pres.MAX_LEVELS,2);
});

test('building plan: equal room IDs on both levels give distinct stops; currentBuilding follows every level',()=>{
 const {building}=F.build(),shared=roomsOf(building,0)[0],upper=building.levels[1].project;
 for(const o of upper.objects)if(o.roomId===upper.rooms[0].id)o.roomId=shared;upper.rooms[0].id=shared;
 const plan=Pres.createBuilding(building,sources(building),'e',[{levelId:'lvl_fixture-ground',roomId:shared},{levelId:'lvl_fixture-upper',roomId:shared}]);
 const rooms=plan.stops.filter(s=>s.kind==='room');
 assert.deepEqual(rooms.map(s=>s.roomId),[shared,shared]);assert.equal(new Set(rooms.map(s=>s.id)).size,2);
 const revisions=new Map(sources(building).map(l=>[l.levelId,{projectId:l.project.id,revision:l.revision}]));
 assert.equal(Pres.currentBuilding(plan,'e',revisions),true);assert.equal(Pres.currentBuilding(plan,'other',revisions),false);
 revisions.set('lvl_fixture-upper',{projectId:'prj_fixture-upper',revision:'changed'});
 assert.equal(Pres.currentBuilding(plan,'e',revisions),false,'a change on the other level invalidates the plan');
 assert.equal(Pres.currentBuilding({...plan,scope:undefined},'e',revisions),false);
});

const v2=()=>({format:'rubik-sota.presentation-captures',version:2,scope:'building',buildingId:'bld_x',levels:[{levelId:'lvl_a',projectId:'prj_a'},{levelId:'lvl_b',projectId:'prj_b'}],
 views:[{order:1,levelId:'lvl_a',kind:'overview',roomId:null,filename:'views/view-001.png'},{order:2,levelId:'lvl_a',kind:'room',roomId:'rom_1',filename:'views/view-002.png'},{order:3,levelId:'lvl_b',kind:'room',roomId:'rom_1',filename:'views/view-003.png'}],
 portableBuilding:{filename:'editable-building.zip'}});
const names=m=>['presentation.json',...m.views.map(v=>v.filename),m.portableBuilding?.filename||m.portableProject?.filename].filter(Boolean);

test('capture reader: a building batch relates every view to one level and room; ambiguous batches are refused',()=>{
 const good=v2();assert.deepEqual(Pres.readCaptures(good,names(good)),{version:2,views:3,levels:['lvl_a','lvl_b'],byLevel:{lvl_a:2,lvl_b:1},portable:'editable-building.zip'});
 const bad=(mutate,files,pattern)=>{const m=v2();mutate(m);assert.throws(()=>Pres.readCaptures(m,files?files(m):names(m)),pattern);};
 bad(m=>{m.views[2].levelId='lvl_a';},null,/misma estancia y planta/);
 bad(m=>{m.views[2].levelId='lvl_z';},null,/no pertenece a una planta/);
 bad(m=>{m.views[2].filename='views/view-002.png';},null,/repetido/);
 bad(m=>{m.views[1].filename='../x.png';},null,/no permitido/);
 bad(()=>{},m=>names(m).filter(n=>n!=='views/view-003.png'),/falta views\/view-003\.png/);
 bad(()=>{},m=>[...names(m),'views/view-009.png'],/no declarados/);
 bad(m=>{m.views[1].order=3;},null,/orden 2/);
 bad(m=>{m.views[1].roomId=null;},null,/sin estancia coherente/);
 bad(m=>{m.levels.push({levelId:'lvl_c',projectId:'prj_c'});},null,/plantas no válidos/);
 bad(m=>{m.levels[1].levelId='lvl_a';},null,/planta repetida/);
 bad(m=>{m.version=3;},null,/versión 3/);
 bad(()=>{},m=>names(m).filter(n=>n!=='editable-building.zip'),/proyecto editable/);
});

// Minimal stored-ZIP reader for the committed batch (Node's zlib only for completeness; the batch is stored).
function unzipNames(buffer){const end=buffer.length-22,count=buffer.readUInt16LE(end+10),items=new Map();let at=buffer.readUInt32LE(end+16);
 for(let i=0;i<count;i++){const method=buffer.readUInt16LE(at+10),size=buffer.readUInt32LE(at+20),n=buffer.readUInt16LE(at+28),extra=buffer.readUInt16LE(at+30),comment=buffer.readUInt16LE(at+32),local=buffer.readUInt32LE(at+42),name=buffer.subarray(at+46,at+46+n).toString();
  const start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28),raw=buffer.subarray(start,start+size);items.set(name,method===8?zlib.inflateRawSync(raw):raw);at+=46+n+extra+comment;}
 return items;}

test('capture reader: existing single-level batches still read (committed r4-m09 batch and the current 1.x shape)',()=>{
 const files=unzipNames(fs.readFileSync(path.join(__dirname,'../docs/qa/artifacts/casa-serra/r4-m09/1440x900-warm-views.zip')));
 const legacy=JSON.parse(files.get('presentation.json').toString());
 assert.equal(legacy.version,1);assert.equal(legacy.portableProject,undefined,'an older batch without editable project');
 assert.deepEqual(Pres.readCaptures(legacy,[...files.keys()]),{version:1,views:2,levels:null,byLevel:null,portable:null});
 const current={format:'rubik-sota.presentation-captures',version:1,viewRepresentation:'static-png',projectId:'prj_x',entryId:'e',revision:'r',center:{x:0,y:0},resources:{},
  views:[{order:1,kind:'overview',roomId:null,filename:'views/view-001.png'},{order:2,kind:'room',roomId:'rom_1',filename:'views/view-002.png'}],portableProject:{filename:'editable-project.zip'}};
 assert.equal(Pres.readCaptures(current,names(current)).portable,'editable-project.zip');
 assert.throws(()=>Pres.readCaptures({...current,projectId:undefined},names(current)),/falta el proyecto/);
});
