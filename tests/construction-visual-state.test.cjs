/* FT3D-8V visual-state and Gantt adapters: deterministic, reversible, serializable, fixture-only data. */
const test=require('node:test');
const assert=require('node:assert/strict');
const Schedule=require('../js/construction-schedule-core.js');
const Visual=require('../js/construction-visual-state.js');
const Gantt=require('../js/construction-gantt-adapter.js');
const Budget=require('../js/budget-core.js');
const F=require('./fixtures/construction-schedule-fixtures.cjs');

const el=(frame,id)=>frame.elements.find(e=>e.elementId===id);

test('fixtures are explicitly labelled FIXTURE and are valid schedules',()=>{
  for(const k of ['simpleHouse','kitchenReform','incompletePlan']){
    const {schedule,budget}=F[k]();
    assert.match(schedule.source,/FIXTURE/);
    assert.ok(schedule.tasks.every(t=>/FIXTURE/.test(t.source)&&/FIXTURE/.test(t.title)));
    assert.ok(budget.items.every(i=>/FIXTURE/.test(i.description)));
    assert.match(schedule.id,/^fixture-/);
    assert.ok(Schedule.validate(schedule));
  }
});
test('timeline: inicio is an empty site the day before work, final is the day after the last task',()=>{
  const {schedule}=F.simpleHouse(),t=Visual.timeline(schedule);
  assert.equal(t.preStartDate,'2026-11-30');
  assert.equal(t.endDate,'2027-02-26');
  assert.equal(t.completionDate,'2027-02-27');
  assert.equal(Visual.progressToDate(schedule,0),'2026-11-30');
  assert.equal(Visual.progressToDate(schedule,1),'2027-02-27');
  assert.equal(Visual.progressToDate(schedule,-3),'2026-11-30');
  assert.equal(Visual.progressToDate(schedule,9),'2027-02-27');
  const start=Visual.frameAt(schedule,'2026-11-30');
  assert.ok(start.elements.every(e=>!e.present));
  assert.equal(start.stage,'inicio');
  // On the last planned day the last task is still running: not yet an unequivocal end state.
  assert.equal(Visual.frameAt(schedule,'2027-02-26').stage,'en-obra');
  const end=Visual.frameAt(schedule,t.completionDate);
  assert.equal(end.stage,'final');assert.equal(end.planComplete,true);
  assert.deepEqual(end.activeTaskIds,[]);
  assert.ok(end.elements.every(e=>e.state==='standing'||e.state==='removed'||e.state==='absent'));
  assert.equal(el(end,'crane').present,false);
  assert.ok(['wall-n','roof','floor-slab','foundation'].every(id=>el(end,id).present));
  assert.deepEqual(el(end,'wall-n').appliedLayers.map(l=>l.role),['cladding','finish']);
  assert.ok(t.checkpoints.includes('2027-01-05'));
});
test('progress <-> date round-trip is stable for every day',()=>{
  const {schedule}=F.kitchenReform(),t=Visual.timeline(schedule);
  for(let i=0;i<t.positions;i++){
    const p=i/(t.positions-1),d=Visual.progressToDate(schedule,p);
    assert.equal(Visual.dateToProgress(schedule,d),p);
  }
  assert.equal(Visual.progressToDate(Schedule.create({id:'x',projectRef:{type:'project',id:'p',revision:'r'}}),0.5),null);
});
test('same wall: structure, then cladding, then finish (multi-role timelapse)',()=>{
  const {schedule}=F.simpleHouse();
  const during=Visual.frameAt(schedule,'2027-01-01'),clad=Visual.frameAt(schedule,'2027-02-05'),fin=Visual.frameAt(schedule,'2027-02-20');
  assert.equal(el(during,'wall-n').state,'building');
  assert.ok(el(during,'wall-n').builtFraction>0&&el(during,'wall-n').builtFraction<1);
  assert.deepEqual(el(during,'wall-n').appliedLayers,[]);
  assert.equal(el(clad,'wall-n').builtFraction,1);
  assert.deepEqual(el(clad,'wall-n').appliedLayers.map(l=>l.role),['cladding']);
  assert.deepEqual(el(fin,'wall-n').appliedLayers.map(l=>l.role),['cladding','finish']);
  assert.equal(el(during,'crane').state,'temporary');
});
test('overlapping tasks (SS) are active simultaneously',()=>{
  const {schedule}=F.simpleHouse(),f=Visual.frameAt(schedule,'2027-01-12');
  assert.deepEqual(f.activeTaskIds,['structure','services']);
  assert.equal(el(f,'services-core').state,'building');
});
test('reform: pre-existing walls stand, demolished parts leave, temporary protection comes and goes',()=>{
  const {schedule}=F.kitchenReform();
  const before=Visual.frameAt(schedule,'2027-02-28'),demo=Visual.frameAt(schedule,'2027-03-02'),after=Visual.frameAt(schedule,'2027-03-13');
  assert.equal(el(before,'wall-existing-1').state,'standing');
  assert.equal(el(before,'old-cabinets').state,'standing');
  assert.equal(el(before,'dust-screen').present,false);
  assert.equal(el(demo,'old-cabinets').state,'removing');
  assert.equal(el(demo,'dust-screen').state,'temporary');
  assert.equal(el(after,'old-cabinets').state,'removed');
  assert.equal(el(after,'dust-screen').present,false);
  assert.deepEqual(el(after,'partition').appliedLayers.map(l=>l.role),['finish']);
  assert.equal(el(after,'new-cabinets').state,'standing');
});
test('scrubbing forward/backward is exactly reversible and history-independent',()=>{
  const {schedule}=F.simpleHouse(),t=Visual.timeline(schedule);
  const reference=new Map(t.checkpoints.map(d=>[d,Visual.frameAt(schedule,d)]));
  const path=[...t.checkpoints,...[...t.checkpoints].reverse(),t.checkpoints[3],t.checkpoints[0],t.checkpoints.at(-1)];
  for(const d of path)assert.deepEqual(Visual.frameAt(schedule,d),reference.get(d));
  const a=reference.get(t.checkpoints[2]),b=reference.get(t.checkpoints.at(-1));
  const fwd=Visual.diff(a,b),back=Visual.diff(b,a);
  assert.equal(fwd.direction,'forward');assert.equal(back.direction,'backward');
  assert.deepEqual(fwd.changes.map(c=>c.elementId),back.changes.map(c=>c.elementId));
  for(const c of fwd.changes){
    const r=back.changes.find(x=>x.elementId===c.elementId);
    assert.equal(r.fromState,c.toState);assert.equal(r.toState,c.fromState);
    assert.equal(r.enter,c.exit);assert.equal(r.exit,c.enter);
  }
  assert.deepEqual(Visual.diff(a,a).changes,[]);
});
test('frames are plain serializable data, labelled planned/illustrative, with no demo geometry',()=>{
  const {schedule}=F.kitchenReform(),f=Visual.frameAt(schedule,'2027-03-07');
  assert.deepEqual(JSON.parse(JSON.stringify(f)),f);
  assert.equal(f.illustrative,true);
  assert.equal(f.evidence,'plan-estimated');
  assert.match(f.disclaimer,/no certifica/);
  const ids=new Set(Schedule.canonical(schedule).tasks.flatMap(t=>t.elements.map(e=>e.elementId)));
  assert.deepEqual(new Set(f.elements.map(e=>e.elementId)),ids);
  assert.ok(!JSON.stringify(f).match(/position|mesh|geometry/));
});
test('visual adapter never mutates schedule',()=>{
  const {schedule}=F.simpleHouse(),copy=structuredClone(schedule);
  Visual.timeline(schedule);Visual.frameAt(schedule,'2027-01-20');Visual.progressToDate(schedule,.4);
  assert.deepEqual(schedule,copy);
});
test('Gantt tasks: user dates, execution progress 0, costs only from the C1-C4 report',()=>{
  const {schedule,budget}=F.simpleHouse(),report=Schedule.budgetReport(schedule,budget,Budget);
  const rows=Gantt.toGanttTasks(schedule,{budgetReport:report});
  const floors=rows.find(r=>r.id==='floors');
  assert.equal(floors.start,'2027-02-08');assert.equal(floors.end,'2027-02-15');
  assert.equal(floors.progress,0);
  assert.equal(floors.custom_class,'ft3d-plan-approved');
  // floors depends on cladding through FF+3: it must NOT become a Frappe finish-to-start arrow.
  assert.equal(floors.dependencies,'');
  assert.deepEqual(floors._ft3d.nonFsDependencies,[{taskId:'cladding',type:'FF',lagDays:3}]);
  const services=rows.find(r=>r.id==='services');
  assert.equal(services.dependencies,'');
  assert.deepEqual(services._ft3d.nonFsDependencies,[{taskId:'structure',type:'SS',lagDays:15}]);
  const structure=rows.find(r=>r.id==='structure');
  assert.equal(structure.dependencies,'foundations');
  assert.deepEqual(structure._ft3d.fsLags,[{taskId:'foundations',type:'FS',lagDays:2}]);
  assert.equal(floors._ft3d.cost.projectRevisionCheck,'unverifiable');
  assert.equal(floors._ft3d.cost.totalNet,report.byTask.find(t=>t.taskId==='floors').totalNet);
  assert.equal(rows.find(r=>r.id==='finishes').dependencies,'services, floors');
  assert.equal(Gantt.toGanttTasks(schedule)[0]._ft3d.cost,null);
  assert.throws(()=>Gantt.toGanttTasks(schedule,{budgetReport:{...report,scheduleId:'other'}}),/another schedule/);
  assert.deepEqual(Gantt.nonFsDependencies(schedule),[
    {from:'foundations',to:'structure',type:'FS',lagDays:2},{from:'structure',to:'services',type:'SS',lagDays:15},{from:'cladding',to:'floors',type:'FF',lagDays:3}]);
});
test('Gantt cursor and 3D frame share the same date and active tasks',()=>{
  const {schedule}=F.simpleHouse(),d=Visual.progressToDate(schedule,.5);
  const c=Gantt.cursor(schedule,d),f=Visual.frameAt(schedule,d);
  assert.equal(c.date,f.date);
  assert.deepEqual(c.activeTaskIds,f.activeTaskIds);
  assert.equal(c.illustrative,true);
});
