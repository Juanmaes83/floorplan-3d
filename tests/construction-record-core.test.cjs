'use strict';
/* FT3D-8 · M2-1 — construction record of a library subject: identity, isolation, versions, correspondence, links. */
const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../js/construction-record-core.js'),S=require('../js/construction-schedule-core.js');
const REV_A='a'.repeat(64),REV_A2='b'.repeat(64);
const entryA={id:'prj_entryA',name:'Vivienda A',project:{id:'prj_docA'}};
const entryB={id:'prj_entryB',name:'Vivienda A',project:{id:'prj_docB'}};           // same NAME, other subject
const building={id:'prj_entryC',name:'Edificio',kind:'building',activeLevelId:'lvl_1',building:{id:'bld_1',levels:[
  {id:'lvl_0',name:'Planta baja',order:0,project:{id:'prj_l0'}},{id:'lvl_1',name:'Planta primera',order:1,project:{id:'prj_l1'}}]}};
const task=(id,o={})=>({id,title:'Tarea '+id,wbs:'1.'+id.slice(-1),startDate:'2026-03-02',endDate:'2026-03-06',dependsOn:[],...(o.elements?{}:{elementIds:[]}),...(o.budgetAllocations?{}:{budgetItemIds:[]}),source:'Plan de prueba',...o});
const plan=(subject,revision,tasks=[task('t1')])=>S.create({id:'sch_test',projectRef:{type:subject.type,id:subject.id,revision},tasks});
const memory=(fail=null)=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>{if(fail)throw fail;m.set(k,v);},m};};

test('M2-1 · identity is subject type + id inside one library entry; names never identify',()=>{
  const a=R.subjectOf(entryA),b=R.subjectOf(entryB),c=R.subjectOf(building);
  assert.deepEqual([a.type,a.id,a.entryId],['project','prj_docA','prj_entryA']);
  assert.notEqual(R.keyOf(entryA.id,a),R.keyOf(entryB.id,b),'two entries with the same name are two subjects');
  assert.deepEqual([c.type,c.id,c.activeLevelId,c.levels.map(l=>l.projectId)],['building','bld_1','lvl_1',['prj_l0','prj_l1']]);
  assert.throws(()=>R.subjectOf({id:'x',name:'n'}),{code:'subject-required'});
  // The same document imported twice is flagged, never merged.
  assert.deepEqual(R.duplicateSubjects([entryA,{...entryB,project:{id:'prj_docA'}},building]),[{subject:'project:prj_docA',entryIds:['prj_entryA','prj_entryB']}]);
});

test('M2-1 · a plan is stored only for its own subject; other subjects stay untouched',()=>{
  const a=R.subjectOf(entryA),b=R.subjectOf(entryB);
  let st=R.putSchedule(R.empty(),entryA.id,a,plan(a,REV_A),{at:'2026-11-06T10:00:00Z'});
  assert.throws(()=>R.putSchedule(st,entryB.id,b,plan(a,REV_A),{at:'2026-11-06T10:01:00Z'}),{code:'schedule-other-project'});
  st=R.putSchedule(st,entryB.id,b,plan(b,REV_A,[task('t1'),task('t2')]),{at:'2026-11-06T10:02:00Z'});
  assert.equal(st.records[R.keyOf(entryA.id,a)].schedule.tasks.length,1);
  assert.equal(st.records[R.keyOf(entryB.id,b)].schedule.tasks.length,2);
  assert.equal(st.records[R.keyOf(entryA.id,a)].planHistory.length,1);
  // A building plan is the building's (type building), not one of its level projects.
  const c=R.subjectOf(building);
  assert.throws(()=>R.putSchedule(st,building.id,c,S.create({id:'sch_l',projectRef:{type:'project',id:'prj_l0',revision:REV_A},tasks:[]}),{at:'2026-11-06T10:03:00Z'}),{code:'schedule-other-project'});
});

test('M2-1 · versions: unknown version rejected, invalid data rejected, empty store when nothing saved',()=>{
  assert.deepEqual(R.parseStore(null),R.empty());
  assert.throws(()=>R.parseStore(JSON.stringify({schema:R.SCHEMA,schemaVersion:'9.0.0',records:{}})),{code:'record-version-unsupported'});
  assert.throws(()=>R.parseStore('{nope'),{code:'record-invalid'});
  const a=R.subjectOf(entryA),st=R.putSchedule(R.empty(),entryA.id,a,plan(a,REV_A),{at:'2026-11-06T10:00:00Z'});
  const tampered=JSON.parse(JSON.stringify(st));tampered.records[R.keyOf(entryA.id,a)].schedule.projectRef.id='prj_other';
  assert.throws(()=>R.parseStore(JSON.stringify(tampered)),{code:'record-invalid'});
  assert.deepEqual(R.parseStore(JSON.stringify(st)),st,'round trip is lossless');
});

test('M2-1 · correspondence uses the S1 results: absent, match, obsolete, unverifiable (never match)',()=>{
  const a=R.subjectOf(entryA),now={subject:a,revision:REV_A};
  const res=(rec,n=now)=>Object.fromEntries(R.correspondence(rec,n).map(x=>[x.aspect,x.result]));
  assert.deepEqual(res(null),{plan:'absent',review:'absent','budget-revision':'unverifiable',delivery:'absent'});
  let st=R.putSchedule(R.empty(),entryA.id,a,plan(a,REV_A),{at:'2026-11-06T10:00:00Z'});const key=R.keyOf(entryA.id,a);
  assert.equal(res(st.records[key]).plan,'match');
  assert.equal(res(st.records[key],{...now,revision:REV_A2}).plan,'obsolete','the project changed after the plan was saved');
  st=R.putBinding(st,entryA.id,a,{schema:'rubik-sota.construction-binding',scheduleId:'sch_test',fingerprints:{project:REV_A,schedule:'c'.repeat(64),budget:null}},{at:'2026-11-06T10:05:00Z'});
  assert.equal(res(st.records[key],{...now,scheduleFingerprint:'c'.repeat(64)}).review,'match');
  assert.equal(res(st.records[key],{...now,scheduleFingerprint:'d'.repeat(64)}).review,'obsolete','a date changed after the review');
  // Delivery: frozen fingerprints compared aspect by aspect.
  st=R.addDelivery(st,entryA.id,a,{id:'dlv_1',kind:'construction-evolution',fingerprints:{project:REV_A,schedule:'c'.repeat(64),budget:null,brand:'e'.repeat(64),site:null}},{at:'2026-11-06T11:00:00Z'});
  const same={...now,scheduleFingerprint:'c'.repeat(64),budgetFingerprint:null,brandFingerprint:'e'.repeat(64),siteFingerprint:null};
  assert.equal(res(st.records[key],same).delivery,'match');
  const brandChanged=R.correspondence(st.records[key],{...same,brandFingerprint:'f'.repeat(64)}).find(x=>x.aspect==='delivery');
  assert.deepEqual([brandChanged.result,brandChanged.changed],['obsolete',['brand']]);
  assert.equal(st.records[key].deliveries.length,1,'history kept');
  assert.throws(()=>R.addDelivery(st,entryA.id,a,{id:'x'},{at:'2026-11-06T11:00:00Z'}),{code:'record-invalid'});
});

test('M2-1 · links index: item → tasks → elements and element → tasks, shares never above 100 %',()=>{
  const a=R.subjectOf(entryA);
  const s=plan(a,REV_A,[task('t1',{elements:[{elementId:'project/w1',role:'build'}],budgetAllocations:[{itemId:'paint',sharePercent:60}]}),
    task('t2',{elements:[{elementId:'project/w2',role:'finish'}],budgetAllocations:[{itemId:'paint',sharePercent:40},{itemId:'floor',sharePercent:50}]})]);
  const L=R.links(s);
  assert.deepEqual(L.byItem.get('paint').map(x=>[x.taskId,x.sharePercent]),[['t1',60],['t2',40]]);
  assert.deepEqual(L.elementsOfItem('paint'),['project/w1','project/w2']);
  assert.deepEqual(L.byElement.get('project/w2').map(x=>[x.taskId,x.role]),[['t2','finish']]);
  assert.equal(L.allocatedPercent('paint'),100);assert.equal(L.allocatedPercent('floor'),50);assert.equal(L.allocatedPercent('none'),0);
  assert.throws(()=>plan(a,REV_A,[task('t1',{budgetAllocations:[{itemId:'paint',sharePercent:70}]}),task('t2',{budgetAllocations:[{itemId:'paint',sharePercent:40}]})]),/beyond 100/);
});

test('M2-1 · injected storage: persists, reloads, and a full or blocked storage changes nothing',()=>{
  const a=R.subjectOf(entryA),mem=memory(),store=R.open(mem);
  store.saveSchedule(entryA.id,a,plan(a,REV_A));
  assert.equal(R.open(mem).get(entryA.id,a).schedule.id,'sch_test','survives a reload');
  assert.equal(R.open(mem).get(entryB.id,R.subjectOf(entryB)),null);
  const full=memory(Object.assign(new Error('full'),{name:'QuotaExceededError'})),fs=R.open(full);
  assert.throws(()=>fs.saveSchedule(entryA.id,a,plan(a,REV_A)),{code:'storage-full'});
  assert.equal(fs.get(entryA.id,a),null,'in-memory state unchanged after a failed write');
  assert.match(R.human({code:'storage-full'}),/No hay espacio/);
  // Price history is per budget subject (level project for buildings), bounded.
  store.addPriceChange(entryA.id,a,'prj_docA',{itemId:'paint',before:{unitPrice:null},after:{unitPrice:8.5},revBefore:'rev_1',revAfter:'rev_2'});
  assert.equal(R.open(mem).get(entryA.id,a).priceHistory.prj_docA[0].after.unitPrice,8.5);
});
