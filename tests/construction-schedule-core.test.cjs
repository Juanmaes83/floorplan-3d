const test=require('node:test');
const assert=require('node:assert/strict');
const Schedule=require('../js/construction-schedule-core.js');
const Budget=require('../js/budget-core.js');

const projectRef={type:'project',id:'project-a',revision:'rev-17'};
const tasks=[
  {id:'prepare',title:'Preparacion',wbs:'01',startDate:'2026-11-10',endDate:'2026-11-12',
   dependsOn:[],elementIds:['site'],budgetItemIds:['work-prepare'],source:'Plan firmado'},
  {id:'walls',title:'Muros y carpinteria',wbs:'02',startDate:'2026-11-13',endDate:'2026-11-20',
   dependsOn:['prepare'],elementIds:['wall-1','wall-2'],budgetItemIds:['work-walls'],source:'Plan firmado'},
  {id:'finishes',title:'Acabados',wbs:'03',startDate:'2026-11-21',endDate:'2026-11-23',
   dependsOn:['walls'],elementIds:['floor-1'],budgetItemIds:[],source:'Plan firmado'}
];
const schedule=()=>Schedule.create({id:'schedule-a',projectRef,source:'Profesional',tasks,review:{status:'draft'}});
const fixed=()=>Schedule.create({id:'schedule-a',projectRef,source:'Profesional',tasks,
  review:{status:'reviewed',by:'tecnico',at:'2026-11-09T10:30:00+01:00'}});

const item=(id,quantity,price,reviewed=false)=>{
  const value=Budget.createItem({id,description:id,quantity:Budget.manualQuantity({value:quantity,unit:'unit',label:'Medicion revisada'}),
    ...Budget.manualPrice({unitPrice:price,label:'Tarifa estudio',asOf:'2026-11-05'})});
  return reviewed?Budget.markReviewed(value,{reviewedAt:'2026-11-09T10:00:00+01:00'}):value;
};
const budget=(withPending=false)=>({
  ...Budget.createBudget({id:'budget-a',subject:{type:'project',id:'project-a'},taxRatePercent:21}),
  items:[item('work-prepare',2,120,true),item('work-walls',10,35,true),
    ...(withPending?[Budget.createItem({id:'work-extra',description:'Pendiente',quantity:Budget.manualQuantity({value:2,unit:'unit'}),unitPrice:null,priceSource:null})]:[])]
});

test('creates a versioned schedule without modifying the project or its tasks',()=>{
  const original=structuredClone(tasks);
  const s=schedule();
  assert.equal(s.schema,'rubik-sota.construction-schedule');
  assert.deepEqual(s.projectRef,projectRef);
  assert.deepEqual(tasks,original);
  assert.equal(s.review.status,'draft');
  assert.equal(Schedule.parse(Schedule.serialize(s)).tasks.length,3);
});
test('validates impossible dates, invalid schema and inverted date ranges',()=>{
  const s=schedule();
  assert.throws(()=>Schedule.validate({...s,schemaVersion:'1.0'}),/schema/);
  assert.throws(()=>Schedule.validate({...s,tasks:[{...s.tasks[0],startDate:'2026-02-30'}]}),/calendar date/);
  assert.throws(()=>Schedule.validate({...s,tasks:[{...s.tasks[0],startDate:'2026-11-15',endDate:'2026-11-10'}]}),/ends before/);
});
test('detects unknown dependencies, cycles and duplicate task IDs',()=>{
  const s=schedule();
  assert.throws(()=>Schedule.validate({...s,tasks:[{...s.tasks[0],dependsOn:['unknown']},...s.tasks.slice(1)]}),/unknown predecessor/);
  assert.throws(()=>Schedule.validate({...s,tasks:[{...s.tasks[0],dependsOn:['finishes']},...s.tasks.slice(1)]}),/cycle/);
  assert.throws(()=>Schedule.validate({...s,tasks:[s.tasks[0],s.tasks[0]]}),/duplicate task/);
});
test('rejects duplicated budget links and visual element ownership',()=>{
  const s=schedule();
  assert.throws(()=>Schedule.validate({...s,tasks:[s.tasks[0],{...s.tasks[1],budgetItemIds:['work-prepare']},s.tasks[2]]}),/assigned to both/);
  assert.throws(()=>Schedule.validate({...s,tasks:[s.tasks[0],{...s.tasks[1],elementIds:['site']},s.tasks[2]]}),/assigned to both/);
});
test('unknown professional review cannot be presented as a reviewed plan',()=>{
  const s=schedule();
  assert.throws(()=>Schedule.validate({...s,review:{status:'reviewed',by:null,at:null}}),/review.by/);
  assert.throws(()=>Schedule.validate({...s,review:{status:'draft',by:'someone',at:null}}),/draft review/);
  assert.equal(fixed().review.by,'tecnico');
});
test('stateAt is deterministic and reversible: same date produces same result regardless of visit history',()=>{
  const s=schedule(),early=Schedule.stateAt(s,'2026-11-09'),middle=Schedule.stateAt(s,'2026-11-15'),last=Schedule.stateAt(s,'2026-11-23');
  assert.deepEqual(early.tasks.map(t=>t.phase),['not-started','not-started','not-started']);
  assert.deepEqual(middle.tasks.map(t=>t.phase),['completed','in-progress','not-started']);
  assert.deepEqual(last.tasks.map(t=>t.phase),['completed','completed','in-progress']);
  assert.deepEqual(Schedule.stateAt(s,'2026-11-09'),early);
  assert.deepEqual(Schedule.stateAt(s,'2026-11-15'),middle);
  assert.deepEqual(Schedule.stateAt(s,'2026-11-25').tasks.map(t=>t.phase),['completed','completed','completed']);
  assert.equal(middle.dataStatus,'draft');
  assert.equal(middle.visualGroups.find(g=>g.elementId==='wall-1').visible,true);
  assert.equal(middle.visualGroups.find(g=>g.elementId==='floor-1').visible,false);
});
test('Gantt rows and bounds preserve user-supplied dates, not fabricated durations',()=>{
  const s=schedule(),rows=Schedule.ganttRows(s);
  assert.deepEqual(Schedule.bounds(s),{startDate:'2026-11-10',endDate:'2026-11-23'});
  assert.deepEqual(rows[1].dependencies,['prepare']);
  assert.equal(rows[1].start,'2026-11-13');
  assert.equal(rows[1].end,'2026-11-20');
  assert.equal(rows[0].budgetItemIds[0],'work-prepare');
  assert.deepEqual(Schedule.bounds({...s,tasks:[]}),{startDate:null,endDate:null});
});
test('budget report draws real amounts only from C1-C4 and does not double count',()=>{
  const r=Schedule.budgetReport(fixed(),budget(),Budget);
  assert.equal(r.byTask[0].totalNet,240);
  assert.equal(r.byTask[1].totalNet,350);
  assert.equal(r.byTask[0].verified,true);
  assert.equal(r.byTask[1].verified,true);
  assert.equal(r.byTask[2].totalNet,null);
  assert.equal(r.budgetTotals.amount,590);
  assert.equal(r.budgetTotals.complete,true);
  assert.deepEqual(r.unassignedBudgetItemIds,[]);
  assert.match(r.disclaimer,/no gasto ejecutado/);
});
test('unreviewed prices and missing assignments cannot masquerade as verified or zero',()=>{
  const s=schedule(),b=budget(true);
  b.items[1]=item('work-walls',10,35,false);
  const r=Schedule.budgetReport(s,b,Budget);
  assert.equal(r.byTask[0].verified,false);
  assert.equal(r.byTask[1].verified,false);
  assert.deepEqual(r.unassignedBudgetItemIds,['work-extra']);
  assert.equal(r.budgetTotals.complete,false);
  const clone=structuredClone(s);
  clone.tasks[1].budgetItemIds=['work-extra'];
  const unknown=Schedule.budgetReport(clone,b,Budget);
  assert.equal(unknown.byTask[1].totalNet,null);
  assert.deepEqual(unknown.byTask[1].missingItemIds,['work-extra']);
});
test('budget provenance is enforced: wrong project and unknown items reject',()=>{
  const b=budget(),s=schedule();
  assert.throws(()=>Schedule.budgetReport(s,{...b,subject:{type:'project',id:'other'}},Budget),/subject does not match/);
  const modified=structuredClone(s);
  modified.tasks[0].budgetItemIds=['absent'];
  assert.throws(()=>Schedule.budgetReport(modified,b,Budget),/unknown budget item/);
});
test('stateAt and budget adapter never mutate incoming project data or budgets',()=>{
  const s=schedule(),b=budget(),a=structuredClone(s),p=structuredClone(b);
  Schedule.stateAt(s,'2026-11-17');
  Schedule.budgetReport(s,b,Budget);
  assert.deepEqual(s,a);assert.deepEqual(b,p);
});
