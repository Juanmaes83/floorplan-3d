/* FT3D-8V 0.2.0 rules: dependencies FS/SS/FF/SF + lag, role-based element participation,
   explicit percentage budget allocation, evidence ladder, legacy compatibility and C1-C4 quality. */
const test=require('node:test');
const assert=require('node:assert/strict');
const Schedule=require('../js/construction-schedule-core.js');
const Budget=require('../js/budget-core.js');
const F=require('./fixtures/construction-schedule-fixtures.cjs');

const projectRef={type:'project',id:'p',revision:'r1'};
const T=(id,startDate,endDate,extra={})=>({id,title:id,wbs:id,startDate,endDate,source:'Profesional',...extra});
const make=(tasks,review={status:'draft'})=>Schedule.create({id:'s',projectRef,source:'Profesional',tasks,review});
const reviewed={status:'reviewed',by:'tecnico',at:'2026-11-09T10:00:00+01:00'};
const dep=(taskId,type,lagDays)=>({taskId,type,lagDays});

// ---------- legacy compatibility ----------
test('0.1.0 schedules still parse and are upgraded to 0.2.0 without changing their stored shape',()=>{
  const legacy={schema:Schedule.SCHEMA,schemaVersion:'0.1.0',id:'old',projectRef,source:'Profesional',review:{status:'draft',by:null,at:null},
    tasks:[T('a','2026-11-02','2026-11-03',{dependsOn:[],elementIds:['e1'],budgetItemIds:['i1']}),
      T('b','2026-11-04','2026-11-05',{dependsOn:['a'],elementIds:['e2'],budgetItemIds:[]})]};
  const up=Schedule.upgrade(structuredClone(legacy));
  assert.equal(up.schemaVersion,'0.2.0');
  assert.deepEqual(up.tasks[1].dependsOn,['a']);
  assert.deepEqual(up.tasks[0].elementIds,['e1']);
  assert.deepEqual(up.tasks[0].budgetItemIds,['i1']);
  assert.equal(up.tasks[0].elements,undefined);
  const c=Schedule.canonical(up).tasks;
  assert.deepEqual(c[1].dependsOn,[{taskId:'a',type:'FS',lagDays:0}]);
  assert.deepEqual(c[0].elements,[{elementId:'e1',role:'build'}]);
  assert.deepEqual(c[0].budgetAllocations,[{itemId:'i1',sharePercent:100}]);
  assert.deepEqual(Schedule.parse(Schedule.serialize(up)),up);
  assert.throws(()=>Schedule.validate({...legacy,schemaVersion:'0.3.0'}),/schema/);
});
test('rich forms round-trip and contradictory legacy + rich fields are rejected',()=>{
  const s=make([T('a','2026-11-02','2026-11-03',{elements:[{elementId:'w',role:'structure'}],budgetAllocations:[{itemId:'i',sharePercent:50}]})]);
  assert.deepEqual(Schedule.parse(Schedule.serialize(s)),s);
  assert.deepEqual(s.tasks[0].elements,[{elementId:'w',role:'structure'}]);
  assert.throws(()=>Schedule.validate({...s,tasks:[{...s.tasks[0],elementIds:['other']}]}),/contradict elements/);
  assert.throws(()=>Schedule.validate({...s,tasks:[{...s.tasks[0],budgetItemIds:['other']}]}),/contradict budgetAllocations/);
});

// ---------- dependencies ----------
test('FS validates finish-to-start and never moves professional dates',()=>{
  const ok=make([T('a','2026-11-02','2026-11-04'),T('b','2026-11-05','2026-11-06',{dependsOn:[dep('a','FS',0)]})]);
  assert.equal(ok.tasks[1].startDate,'2026-11-05');
  assert.throws(()=>make([T('a','2026-11-02','2026-11-04'),T('b','2026-11-04','2026-11-06',{dependsOn:['a']})]),/a -> b \(FS\+0d\) violated by 1 day/);
});
test('positive and negative explicit lags are honoured for FS',()=>{
  const tasks=lag=>[T('a','2026-11-02','2026-11-04'),T('b','2026-11-07','2026-11-09',{dependsOn:[dep('a','FS',lag)]})];
  assert.ok(make(tasks(2)));
  assert.throws(()=>make(tasks(3)),/FS\+3d\) violated by 1 day/);
  // Negative lag (lead): b may overlap a by two days.
  assert.ok(make([T('a','2026-11-02','2026-11-04'),T('b','2026-11-03','2026-11-05',{dependsOn:[dep('a','FS',-2)]})]));
  assert.throws(()=>make([T('a','2026-11-02','2026-11-04'),T('b','2026-11-02','2026-11-05',{dependsOn:[dep('a','FS',-2)]})]),/FS-2d\) violated/);
});
test('SS lets services start while structure is still running',()=>{
  assert.ok(make([T('st','2026-11-02','2026-11-20'),T('sv','2026-11-09','2026-11-25',{dependsOn:[dep('st','SS',7)]})]));
  assert.throws(()=>make([T('st','2026-11-02','2026-11-20'),T('sv','2026-11-08','2026-11-25',{dependsOn:[dep('st','SS',7)]})]),/SS\+7d\) violated by 1 day/);
});
test('FF and SF compare finishes and start-to-finish correctly',()=>{
  assert.ok(make([T('a','2026-11-02','2026-11-10'),T('b','2026-11-05','2026-11-12',{dependsOn:[dep('a','FF',2)]})]));
  assert.throws(()=>make([T('a','2026-11-02','2026-11-10'),T('b','2026-11-05','2026-11-11',{dependsOn:[dep('a','FF',2)]})]),/FF\+2d\) violated/);
  // SF: b cannot finish before a starts (+lag).
  assert.ok(make([T('a','2026-11-10','2026-11-12'),T('b','2026-11-02','2026-11-09',{dependsOn:[dep('a','SF',0)]})]));
  assert.throws(()=>make([T('a','2026-11-10','2026-11-12'),T('b','2026-11-02','2026-11-08',{dependsOn:[dep('a','SF',0)]})]),/SF\+0d\) violated/);
});
test('dependency objects need an explicit type and integer lag; duplicates and cycles reject',()=>{
  const a=T('a','2026-11-02','2026-11-04');
  assert.throws(()=>make([a,T('b','2026-11-05','2026-11-06',{dependsOn:[{taskId:'a',type:'FS'}]})]),/explicit integer/);
  assert.throws(()=>make([a,T('b','2026-11-05','2026-11-06',{dependsOn:[{taskId:'a',type:'XX',lagDays:0}]})]),/FS, SS, FF or SF/);
  assert.throws(()=>make([a,T('b','2026-11-05','2026-11-06',{dependsOn:[dep('a','FS',0.5)]})]),/explicit integer/);
  assert.throws(()=>make([a,T('b','2026-11-05','2026-11-06',{dependsOn:['a',dep('a','SS',0)]})]),/duplicate dependsOn/);
  assert.throws(()=>make([T('a','2026-11-02','2026-11-04',{dependsOn:[dep('b','SS',0)]}),T('b','2026-11-02','2026-11-06',{dependsOn:[dep('a','SS',0)]})]),/cycle/);
});
test('dependencyReport lists slack read-only and gantt rows keep dependency details',()=>{
  const {schedule}=F.simpleHouse(),before=structuredClone(schedule);
  const r=Schedule.dependencyReport(schedule);
  assert.ok(r.every(d=>d.slackDays>=0));
  assert.deepEqual(r.find(d=>d.to==='services'),{from:'structure',to:'services',type:'SS',lagDays:15,slackDays:0});
  const row=Schedule.ganttRows(schedule).find(x=>x.id==='floors');
  assert.deepEqual(row.dependencies,['cladding']);
  assert.deepEqual(row.dependencyDetails,[{taskId:'cladding',type:'FF',lagDays:3}]);
  assert.deepEqual(schedule,before);
});

// ---------- elements with roles ----------
test('one element can take part in several tasks with different visual roles',()=>{
  const s=make([T('frame','2026-11-02','2026-11-04',{elements:[{elementId:'wall',role:'structure'}]}),
    T('clad','2026-11-05','2026-11-06',{dependsOn:['frame'],elements:[{elementId:'wall',role:'cladding'}]})]);
  const groups=Schedule.stateAt(s,'2026-11-06').visualGroups.filter(g=>g.elementId==='wall');
  assert.deepEqual(groups.map(g=>g.role),['structure','cladding']);
  assert.throws(()=>make([T('a','2026-11-02','2026-11-04',{elements:[{elementId:'wall',role:'structure'}]}),
    T('b','2026-11-05','2026-11-06',{elements:[{elementId:'wall',role:'structure'}]})]),/role structure assigned to both a and b/);
  assert.throws(()=>make([T('a','2026-11-02','2026-11-04',{elements:[{elementId:'wall',role:'paint'}]})]),/element role/);
  assert.throws(()=>make([T('a','2026-11-02','2026-11-04',{elements:[{elementId:'w',role:'build'},{elementId:'w',role:'finish'}]})]),/duplicate element/);
});

// ---------- explicit budget allocation ----------
test('allocation shares are explicit, two-decimal, positive and never exceed 100 %',()=>{
  const two=(x,y)=>[T('a','2026-11-02','2026-11-04',{budgetAllocations:[{itemId:'i',sharePercent:x}]}),
    T('b','2026-11-05','2026-11-06',{budgetAllocations:[{itemId:'i',sharePercent:y}]})];
  assert.ok(make(two(33.33,66.67)));
  assert.throws(()=>make(two(60,50)),/beyond 100 %/);
  assert.throws(()=>make(two(0,100)),/\(0,100\]/);
  assert.throws(()=>make(two(33.333,66.667)),/two decimals/);
  assert.throws(()=>make([T('a','2026-11-02','2026-11-04',{budgetAllocations:[{itemId:'i'}]})]),/sharePercent/);
  // Legacy whole-item link + any further share = more than 100 % = double counting.
  assert.throws(()=>make([T('a','2026-11-02','2026-11-04',{budgetItemIds:['i']}),
    T('b','2026-11-05','2026-11-06',{budgetAllocations:[{itemId:'i',sharePercent:10}]})]),/assigned to both/);
});
const budgetOf=items=>({...Budget.createBudget({id:'b',subject:{type:'project',id:'p'},taxRatePercent:21}),items});
const reviewedItem=(id,qty,price,status='measured')=>Budget.markReviewed(Budget.createItem({id,description:id,
  quantity:Budget.manualQuantity({value:qty,unit:'unit',status,label:'Medicion'}),...Budget.manualPrice({unitPrice:price,label:'Tarifa',asOf:'2026-11-01'})}),{reviewedAt:'2026-11-03T10:00:00+01:00'});
test('split items sum to the exact cent of their line: no double counting, no lost cents',()=>{
  const s=make([T('a','2026-11-02','2026-11-04',{budgetAllocations:[{itemId:'i',sharePercent:33.33}]}),
    T('b','2026-11-05','2026-11-06',{budgetAllocations:[{itemId:'i',sharePercent:33.33}]}),
    T('c','2026-11-07','2026-11-08',{budgetAllocations:[{itemId:'i',sharePercent:33.34}]})],reviewed);
  const r=Schedule.budgetReport(s,budgetOf([reviewedItem('i',1,100.01)]),Budget);
  const parts=r.byTask.map(t=>t.totalNet);
  assert.deepEqual(parts,[33.33,33.33,33.35]);
  assert.equal(Math.round(parts.reduce((a,b)=>a+b,0)*100),10001);
  assert.equal(r.scheduleTotals.allocatedKnownNet,100.01);
  assert.equal(r.scheduleTotals.complete,true);
  assert.ok(r.byTask.every(t=>t.verified));
});
test('an allocation below 100 % stays pending: never redistributed and never verified',()=>{
  const {schedule,budget}=F.incompletePlan();
  const r=Schedule.budgetReport(schedule,budget,Budget);
  assert.deepEqual(r.pendingAllocations,[{itemId:'earthworks',allocatedPercent:60,pendingPercent:40}]);
  const e=r.byTask.find(t=>t.taskId==='earthworks');
  assert.equal(e.totalNet,630);
  assert.deepEqual(e.pendingAllocationItemIds,['earthworks']);
  assert.ok(e.lines[0].issues.includes('allocation-pending'));
  assert.equal(e.verified,false);
  assert.equal(r.scheduleTotals.complete,false);
  assert.deepEqual(r.unassignedBudgetItemIds,['landscaping']);
});

// ---------- price quality, sources and unknown amounts ----------
test('unknown prices stay null (never zero) and block verification',()=>{
  const {schedule,budget}=F.incompletePlan();
  const slab=Schedule.budgetReport(schedule,budget,Budget).byTask.find(t=>t.taskId==='slab');
  assert.equal(slab.knownNet,null);
  assert.equal(slab.totalNet,null);
  assert.equal(slab.lines[0].allocatedNet,null);
  assert.deepEqual(slab.lines[0].priceSource,null);
  assert.ok(slab.lines[0].issues.includes('price-missing'));
});
test('reviewed estimated quantities remain flagged as estimated, without blocking',()=>{
  const {schedule,budget}=F.simpleHouse();
  const roof=Schedule.budgetReport(schedule,budget,Budget).byTask.find(t=>t.taskId==='roof');
  assert.equal(roof.lines[0].quantityStatus,'estimated');
  assert.deepEqual(roof.estimatedQuantityItemIds,['roofing']);
  assert.ok(roof.lines[0].issues.includes('quantity-estimated'));
  assert.equal(roof.verified,true);
});
test('incomplete quantities and unreviewed prices block verification; price sources are traceable',()=>{
  const {schedule,budget}=F.incompletePlan();
  const walls=Schedule.budgetReport(schedule,budget,Budget).byTask.find(t=>t.taskId==='walls');
  assert.ok(walls.lines[0].issues.includes('quantity-incomplete'));
  assert.equal(walls.verified,false);
  const k=F.kitchenReform(),r=Schedule.budgetReport(k.schedule,k.budget,Budget);
  const plumbing=r.byTask.find(t=>t.taskId==='services').lines[0];
  assert.ok(plumbing.issues.includes('price-unreviewed'));
  assert.deepEqual(plumbing.priceSource,{type:'manual',label:'FIXTURE tarifa',asOf:'2026-11-01',providerId:null,itemId:null});
  assert.equal(plumbing.reviewStatus,'unreviewed');
});
test('a manual price without date is reported as undated (warning)',()=>{
  const undated=Budget.markReviewed(Budget.createItem({id:'i',description:'i',quantity:Budget.manualQuantity({value:1,unit:'unit',status:'measured'}),
    ...Budget.manualPrice({unitPrice:10,label:'Tarifa'})}),{reviewedAt:'2026-11-03T10:00:00+01:00'});
  const s=make([T('a','2026-11-02','2026-11-04',{budgetItemIds:['i']})],reviewed);
  const line=Schedule.budgetReport(s,budgetOf([undated]),Budget).byTask[0].lines[0];
  assert.ok(line.issues.includes('price-source-undated'));
});
test('a draft plan never yields verified costs even with perfect budget lines',()=>{
  const s=make([T('a','2026-11-02','2026-11-04',{budgetItemIds:['i']})]);
  const r=Schedule.budgetReport(s,budgetOf([reviewedItem('i',2,50)]),Budget);
  assert.equal(r.byTask[0].totalNet,100);
  assert.equal(r.byTask[0].verified,false);
  assert.equal(r.planEvidence,'plan-estimated');
});
test('project revision: unverifiable for C1-C4 budgets, mismatch blocks when a revision is exposed',()=>{
  const {schedule,budget}=F.simpleHouse();
  const r=Schedule.budgetReport(schedule,budget,Budget);
  assert.deepEqual(r.projectRevision,{schedule:'fixture-rev-3',budget:null,check:'unverifiable'});
  // Simulated future engine that exposes a revision (C1-C4 does not today).
  const engine=rev=>({calculateBudget:b=>{const x=Budget.calculateBudget(b);x.subject={...x.subject,revision:rev};return x;}});
  assert.equal(Schedule.budgetReport(schedule,budget,engine('fixture-rev-3')).projectRevision.check,'match');
  const mismatch=Schedule.budgetReport(schedule,budget,engine('fixture-rev-2'));
  assert.equal(mismatch.projectRevision.check,'mismatch');
  assert.ok(mismatch.byTask.every(t=>t.verified===false));
});
test('cost evidence is always "budgeted", never executed spending',()=>{
  const {schedule,budget}=F.simpleHouse();
  const r=Schedule.budgetReport(schedule,budget,Budget);
  assert.equal(r.costEvidence,'budgeted');
  assert.equal(r.planEvidence,'plan-approved');
  assert.match(r.disclaimer,/no gasto ejecutado/);
});

// ---------- evidence ladder ----------
test('evidence ladder: plan-estimated / plan-approved only; execution records reserved',()=>{
  assert.deepEqual(Schedule.EVIDENCE_LEVELS,['plan-estimated','plan-approved','executed','certified']);
  const d=make([T('a','2026-11-02','2026-11-04')]),r=make([T('a','2026-11-02','2026-11-04')],reviewed);
  assert.equal(Schedule.evidence(d).level,'plan-estimated');
  assert.equal(Schedule.evidence(r).level,'plan-approved');
  assert.equal(Schedule.evidence(r).executed,false);
  assert.equal(Schedule.evidence(r).certified,false);
  assert.throws(()=>Schedule.validate({...r,executionRecords:[{taskId:'a',percent:100}]}),/reserved/);
  const st=Schedule.stateAt(r,'2026-11-10');
  assert.equal(st.tasks[0].plannedPhase,'completed');
  assert.equal(st.tasks[0].executionStatus,'not-recorded');
  assert.equal(st.tasks[0].certificationStatus,'not-recorded');
  assert.equal(st.illustrative,true);
});
test('calendar is UTC calendar days; other calendars are rejected instead of misread',()=>{
  const s=make([T('a','2026-11-02','2026-11-04')]);
  assert.deepEqual(s.calendar,{type:'calendar-days',timeZone:'UTC'});
  assert.throws(()=>Schedule.validate({...s,calendar:{type:'working-days',timeZone:'Europe/Madrid'}}),/calendar/);
  // DST change in Europe (2026-10-25) cannot shift day arithmetic.
  const dst=make([T('a','2026-10-24','2026-10-26')]);
  assert.equal(Schedule.stateAt(dst,'2026-10-25').tasks[0].visualProgress,2/3);
});
test('validation never mutates inputs (project refs, tasks, budgets)',()=>{
  const {schedule,budget}=F.simpleHouse(),a=structuredClone(schedule),b=structuredClone(budget);
  Schedule.validate(schedule);Schedule.canonical(schedule);Schedule.budgetReport(schedule,budget,Budget);
  Schedule.stateAt(schedule,'2027-01-10');Schedule.ganttRows(schedule);Schedule.dependencyReport(schedule);
  assert.deepEqual(schedule,a);assert.deepEqual(budget,b);
});
