/* FT3D-8 Visual Lab: fixture validity, presenter labels and the four pre-release corrections:
   1) unequivocal finished state without moving dates; 2) temporaries leave on time;
   3) SS/FF/SF never become finish-to-start arrows; 4) reviewed budget != verified revision match. */
const test=require('node:test');
const assert=require('node:assert/strict');
const Schedule=require('../js/construction-schedule-core.js');
const Visual=require('../js/construction-visual-state.js');
const Gantt=require('../js/construction-gantt-adapter.js');
const P=require('../js/construction-lab-presenter.js');
const Budget=require('../js/budget-core.js');
const Lab=require('../labs/ft3d-8/lab-fixture.js');

const lab=()=>Lab.labHouse();
const el=(f,id)=>f.elements.find(e=>e.elementId===id);
const TEMPORARY=['crane','scaffold','excavator','spoil-heap'];
const SITE=['site-fence','site-hut'];

test('lab fixture is labelled FIXTURE everywhere and validates through the real core',()=>{
  const {schedule,budget,label}=lab();
  assert.match(label,/FIXTURE/);assert.match(label,/no es un proyecto real/);
  assert.match(schedule.id,/^fixture-/);assert.match(schedule.source,/FIXTURE/);
  assert.ok(schedule.tasks.every(t=>/FIXTURE/.test(t.source)));
  assert.ok(budget.items.every(i=>/^FIXTURE /.test(i.description)));
  assert.equal(Schedule.validate(schedule).tasks.length,14);
  assert.ok(Schedule.dependencyReport(schedule).every(d=>d.slackDays>=0));
});

// ---------- correction 1: unequivocal end state, dates untouched ----------
test('the cursor reaches an unequivocal finished state on completionDate without altering dates',()=>{
  const {schedule}=lab(),before=structuredClone(schedule),t=Visual.timeline(schedule);
  assert.equal(t.endDate,'2027-07-23');assert.equal(t.completionDate,'2027-07-24');
  const last=Visual.frameAt(schedule,t.endDate);
  assert.equal(last.stage,'en-obra');
  assert.equal(el(last,'site-fence').state,'removing','last planned day still shows clearance in progress');
  const end=Visual.frameAt(schedule,Visual.progressToDate(schedule,1));
  assert.equal(end.date,t.completionDate);
  assert.equal(end.stage,'final');assert.equal(end.planComplete,true);
  assert.deepEqual(end.activeTaskIds,[]);
  assert.equal(end.completedTaskIds.length,14);
  assert.ok(end.elements.every(e=>['standing','removed','absent'].includes(e.state)));
  for(const id of ['frame','roof','wall-n','wall-e','windows','deck','lawn','interior-floor'])assert.equal(el(end,id).state,'standing',id);
  assert.deepEqual(el(end,'wall-n').appliedLayers.map(l=>l.role),['cladding','finish']);
  const card=P.taskCard(schedule,Schedule.budgetReport(schedule,lab().budget,Budget),t.completionDate);
  assert.equal(card.stage,'final');assert.match(card.headline,/Plan completado/);
  assert.match(card.week.label,/FIN DEL PLAN/);
  assert.deepEqual(schedule,before);
  assert.deepEqual(Schedule.bounds(schedule),{startDate:'2027-04-05',endDate:'2027-07-23'});
});

// ---------- correction 2: temporaries ----------
test('fence, hut, crane, scaffold, excavator and spoil heap disappear exactly when planned',()=>{
  const {schedule}=lab(),f=d=>Visual.frameAt(schedule,d);
  // Before any work: empty site.
  assert.ok(f('2027-04-04').elements.every(e=>!e.present));
  // Site set-up builds fence and hut, which stay until clearance completes.
  assert.equal(el(f('2027-04-09'),'site-fence').state,'building');
  assert.equal(el(f('2027-06-15'),'site-hut').state,'standing');
  assert.equal(el(f('2027-07-23'),'site-hut').present,true);
  assert.equal(el(f('2027-07-24'),'site-hut').state,'removed');
  // Excavator and spoil heap only during excavation.
  assert.equal(el(f('2027-04-11'),'excavator').present,false);
  assert.equal(el(f('2027-04-14'),'excavator').state,'temporary');
  assert.equal(el(f('2027-04-17'),'excavator').present,false);
  assert.equal(el(f('2027-04-17'),'spoil-heap').present,false);
  // Crane: from structure start (SS) to roof finish (FF).
  assert.equal(el(f('2027-05-03'),'crane').present,false);
  assert.equal(el(f('2027-05-04'),'crane').present,true);
  assert.equal(el(f('2027-06-04'),'crane').present,true);
  assert.equal(el(f('2027-06-05'),'crane').present,false);
  // Scaffold: envelope start (SS) to cladding finish (FF).
  assert.equal(el(f('2027-05-27'),'scaffold').present,true);
  assert.equal(el(f('2027-06-26'),'scaffold').present,false);
  // Excavation pit is backfilled by external works.
  assert.equal(el(f('2027-07-16'),'excavation').state,'removing');
  assert.equal(el(f('2027-07-17'),'excavation').state,'removed');
  const end=f('2027-07-24');
  for(const id of [...TEMPORARY,...SITE,'excavation'])assert.equal(el(end,id).present,false,id);
});
test('scrubbing back from the end restores temporaries exactly (reversible)',()=>{
  const {schedule}=lab(),t=Visual.timeline(schedule);
  const ref=Visual.frameAt(schedule,'2027-05-20');
  Visual.frameAt(schedule,t.completionDate);
  assert.deepEqual(Visual.frameAt(schedule,'2027-05-20'),ref);
  assert.equal(el(ref,'crane').present,true);
  const back=Visual.diff(Visual.frameAt(schedule,t.completionDate),ref);
  assert.equal(back.direction,'backward');
  assert.ok(back.changes.find(c=>c.elementId==='crane').enter);
  assert.ok(back.changes.find(c=>c.elementId==='site-fence').enter);
});

// ---------- correction 3: dependencies ----------
test('SS/FF/SF are never emitted as Frappe finish-to-start arrows',()=>{
  const {schedule}=lab(),rows=Gantt.toGanttTasks(schedule);
  const by=id=>rows.find(r=>r.id===id);
  assert.equal(by('grua').dependencies,'');
  assert.deepEqual(by('grua')._ft3d.nonFsDependencies.map(d=>d.type),['SS','FF']);
  assert.equal(by('cerramientos').dependencies,'');
  assert.equal(by('instalaciones').dependencies,'');
  assert.equal(by('acabados').dependencies,'revestimiento');
  assert.deepEqual(by('acabados')._ft3d.nonFsDependencies,[{taskId:'instalaciones',type:'FF',lagDays:5}]);
  assert.equal(by('estructura').dependencies,'cimentacion');
  for(const r of rows){
    const fs=r._ft3d.dependencyDetails.filter(d=>d.type==='FS').map(d=>d.taskId);
    assert.deepEqual(r.dependencies?r.dependencies.split(', '):[],fs,r.id);
  }
});
test('lab Gantt links: FS arrows only, other types as labelled badges',()=>{
  const {schedule}=lab(),{arrows,badges}=P.ganttLinks(schedule);
  assert.ok(arrows.every(a=>!('type' in a)));
  const all=Schedule.dependencyReport(schedule);
  assert.equal(arrows.length,all.filter(d=>d.type==='FS').length);
  assert.equal(badges.length,all.filter(d=>d.type!=='FS').length);
  assert.ok(badges.length>=5);
  assert.deepEqual(badges.find(b=>b.to==='grua'&&b.type==='FF'),{from:'cubierta',to:'grua',type:'FF',lagDays:0,text:'FF+0d ← 05',title:'fin→fin con 05 (+0d)'});
  assert.equal(arrows.find(a=>a.to==='estructura').text,'FS+3d');
  assert.equal(arrows.find(a=>a.to==='cubierta').text,'');
});

// ---------- correction 4: revision ----------
test('reviewed budget lines are never presented as a verified project-budget revision match',()=>{
  const {schedule,budget}=lab(),r=Schedule.budgetReport(schedule,budget,Budget);
  const estructura=r.byTask.find(t=>t.taskId==='estructura');
  assert.equal(estructura.verified,true);
  assert.equal(r.projectRevision.check,'unverifiable');
  const v=P.costView(estructura,r);
  assert.equal(v.status,'revisado');
  assert.equal(v.revisionMatchVerified,false);
  assert.match(v.revisionText,/no verificable/);
  assert.doesNotMatch(v.label+' '+v.revisionText,/coincide|verificad[oa] con el proyecto/i);
  assert.match(v.evidence,/no es gasto ejecutado/);
  const s=P.summary(r);
  assert.equal(s.revisionMatchVerified,false);assert.match(s.revisionText,/no verificable/);
  const row=Gantt.toGanttTasks(schedule,{budgetReport:r}).find(x=>x.id==='estructura');
  assert.equal(row._ft3d.cost.verified,true);
  assert.equal(row._ft3d.cost.projectRevisionCheck,'unverifiable');
  // Only an engine that exposes the same revision may say "coincide".
  const engine={calculateBudget:b=>{const x=Budget.calculateBudget(b);x.subject={...x.subject,revision:'fixture-rev-1'};return x;}};
  const m=Schedule.budgetReport(schedule,budget,engine);
  assert.equal(P.costView(m.byTask[4],m).revisionMatchVerified,true);
});

// ---------- presenter cost states ----------
test('cost card distinguishes known-reviewed, known-unverified, partial/unknown and none',()=>{
  const {schedule,budget}=lab(),r=Schedule.budgetReport(schedule,budget,Budget);
  const view=id=>P.costView(r.byTask.find(t=>t.taskId===id),r);
  assert.equal(view('estructura').status,'revisado');
  assert.equal(view('estructura').totalText,'17.760,00 €');
  const and=view('andamios');
  assert.equal(and.status,'no-verificado');assert.deepEqual(and.blocking,['price-unreviewed']);
  assert.ok(and.notes.includes('precio sin revisar'));
  const urb=view('urbanizacion');
  assert.equal(urb.status,'parcial');assert.equal(urb.totalText,'desconocido');assert.equal(urb.knownText,'1.840,80 €');
  assert.ok(urb.notes.includes('partida sin precio'));
  const cub=view('cubierta');
  assert.equal(cub.status,'revisado');assert.ok(cub.notes.includes('cantidad estimada'));
  // A task with only an unpriced line is unknown, never zero.
  const s2=structuredClone(schedule);
  s2.tasks.find(t=>t.id==='urbanizacion').budgetAllocations=[{itemId:'jardineria',sharePercent:100}];
  s2.tasks.find(t=>t.id==='cimentacion').budgetAllocations=[{itemId:'hormigon',sharePercent:100}];
  const r2=Schedule.budgetReport(s2,budget,Budget),u=P.costView(r2.byTask.find(t=>t.taskId==='urbanizacion'),r2);
  assert.equal(u.status,'desconocido');assert.equal(u.knownText,'—');assert.equal(u.totalText,'desconocido');
  const none=Schedule.create({id:'x',projectRef:schedule.projectRef,tasks:[{id:'a',title:'a',wbs:'1',startDate:'2027-04-05',endDate:'2027-04-06',source:'s'}]});
  const rn=Schedule.budgetReport(none,budget,Budget);
  assert.equal(P.costView(rn.byTask[0],rn).status,'sin-partidas');
  assert.ok(P.costView(rn.byTask[0],rn).notes.some(n=>/borrador/.test(n)));
  const sum=P.summary(r);
  assert.equal(sum.complete,false);assert.deepEqual(sum.unknownItemIds,['jardineria']);
  assert.ok(sum.unverifiedTaskIds.includes('andamios')&&sum.unverifiedTaskIds.includes('urbanizacion'));
});
test('weeks, labels and euro formatting are deterministic',()=>{
  const {schedule}=lab(),w=P.weeks(schedule);
  assert.equal(w.length,16);
  assert.deepEqual(w[0],{n:1,startDate:'2027-04-05',endDate:'2027-04-11'});
  assert.equal(w.at(-1).endDate,'2027-07-23');
  assert.equal(P.weekOf(schedule,'2027-04-04').n,0);
  assert.equal(P.weekOf(schedule,'2027-04-12').label,'SEM 02 / 16');
  assert.match(P.weekOf(schedule,'2027-07-24').label,/FIN DEL PLAN/);
  assert.equal(P.dateLabel('2027-05-05'),'mie 5 may 2027');
  assert.equal(P.euro(82654.8),'82.654,80 €');assert.equal(P.euro(0),'0,00 €');assert.equal(P.euro(null),'—');
});
test('task card never claims execution: planned phases and illustrative label',()=>{
  const {schedule,budget}=lab(),r=Schedule.budgetReport(schedule,budget,Budget);
  const c=P.taskCard(schedule,r,'2027-05-20');
  assert.deepEqual(c.active.map(t=>t.id),['grua','estructura']);
  assert.ok(c.active.every(t=>/segun plan/.test(t.phaseText)));
  assert.match(c.evidenceText,/ilustrativa/);
  const before=P.taskCard(schedule,r,'2027-04-04');
  assert.equal(before.stage,'inicio');assert.equal(before.next.id,'implantacion');
  assert.doesNotMatch(JSON.stringify(c),/ejecutad[oa]\b(?! ni)|pagad[oa]/i);
});
