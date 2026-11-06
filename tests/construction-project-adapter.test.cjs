/* FT3D-8 project adapter (Phase C): real RUBIK authorities -> verifiable temporal representation.
   Fixtures are synthetic FloorPlanProjectV1/BuildingV1 documents validated by the real validators. */
const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../js/project-core.js');
const Building=require('../js/building-core.js');
const Budget=require('../js/budget-core.js');
const Schedule=require('../js/construction-schedule-core.js');
const Visual=require('../js/construction-visual-state.js');
const A=require('../js/construction-project-adapter.js');
const F=require('../labs/ft3d-8/fidelity-fixtures.js');

const el=(m,key)=>m.inventory.elements.find(e=>e.key===key);
const codes=m=>m.issues.map(i=>i.code);

test('fixtures are labelled, valid for the real validators and never reuse the demo house',async()=>{
  for(const id of F.ids){
    const c=await F.build(id);
    assert.match(c.source.name,/FIXTURE/);assert.match(c.source.id,/fx-/);
    assert.equal(A.validateSource(c.source),id==='B'?'building':'project');
    if(c.schedule)assert.ok(c.schedule.tasks.every(t=>/FIXTURE/.test(t.source)));
  }
  assert.doesNotThrow(()=>Core.validate(F.projectA(),{strict:true}));
  assert.doesNotThrow(()=>Building.validate(F.buildingB()));
});

test('identity, stable keys and canonical fingerprints',async()=>{
  const a=F.projectA(),b=F.projectA();
  assert.equal(await A.fingerprint(a),await A.fingerprint(b),'same content, same revision');
  assert.match(await A.fingerprint(a),/^[0-9a-f]{64}$/);
  const inv=A.inventory(a);
  assert.equal(inv.id,'prj_fx-house-a');assert.equal(inv.kind,'project');
  assert.deepEqual(A.inventory(F.projectA()).elements.map(e=>e.key),inv.elements.map(e=>e.key),'keys are stable');
  assert.ok(inv.elements.every(e=>e.key.startsWith('project/')));
  assert.equal(A.elementKey('lvl_fx-b0','wal_b0-1'),'lvl_fx-b0/wal_b0-1');
  // Key order of JSON objects does not change the canonical revision; a real edit does.
  const reordered=Object.fromEntries(Object.entries(structuredClone(a)).reverse());
  assert.equal(await A.fingerprint(reordered),await A.fingerprint(a));
  const edited=structuredClone(a);edited.walls[0].heightMm=2800;
  assert.notEqual(await A.fingerprint(edited),await A.fingerprint(a));
});

test('geometry is copied from FloorPlanCore.geometry, not re-derived',()=>{
  const p=F.projectA(),g=Core.geometry(p),inv=A.inventory(p);
  for(const w of p.walls){
    const e=el({inventory:inv},'project/'+w.id),solids=e.pieces.filter(x=>x.kind==='solid');
    const expected=g.walls.filter(r=>r.id===w.id);
    assert.equal(solids.length,expected.length,w.id);
    solids.forEach((s,i)=>{assert.deepEqual(s.center,expected[i].center);assert.equal(s.spanMm,expected[i].spanMm);
      assert.equal(s.thicknessMm,w.thicknessMm);assert.equal(s.ytMm,w.heightMm);});
    assert.equal(e.lengthMm,Math.round(Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y)));
  }
  // Windows: sill and lintel pieces use the opening's own sill/head.
  const n=el({inventory:inv},'project/wal_a-n');
  const below=n.pieces.filter(x=>x.kind==='below-opening'&&x.openingId==='opn_a-n1')[0],above=n.pieces.filter(x=>x.kind==='above-opening'&&x.openingId==='opn_a-n1')[0];
  assert.equal(below.ytMm,900);assert.equal(above.ybMm,900+1300);assert.equal(above.ytMm,2700);assert.equal(below.spanMm,2200);
  // Total solid + opening spans along a wall equal its length.
  const spans=n.pieces.filter(x=>x.kind!=='above-opening').reduce((s,x)=>s+x.spanMm,0);
  assert.equal(Math.round(spans),11000);
});

test('materials and openings come from the project; missing materials use declared viewer defaults',()=>{
  const inv=A.inventory(F.projectA()),B0=A.inventory(F.buildingB());
  assert.deepEqual(el({inventory:inv},'project/wal_a-n').material,{id:'mat_fx-lime',name:'FIXTURE mortero de cal',color:'#e9e1d1',source:'project'});
  assert.equal(el({inventory:inv},'project/wal_a-p1').material.source,'viewer-default');
  assert.equal(el({inventory:inv},'project/rom_a-bath').material.color,'#e6e1d6');
  const win=el({inventory:inv},'project/opn_a-n1');
  assert.equal(win.type,'window');assert.equal(win.widthMm,2200);assert.equal(win.sillHeightMm,900);assert.ok(win.representable);
  const door=el({inventory:inv},'project/opn_a-s1');assert.equal(door.door.entrance,true);assert.equal(door.material.color,A.VIEWER_DEFAULTS.entrance);
  assert.equal(el({inventory:B0},'lvl_fx-b0/wal_b0-1').material.color,'#b5745a');
  assert.equal(el({inventory:B0},'lvl_fx-b0/wal_b0-0').material.color,A.VIEWER_DEFAULTS.facade);
});

test('two different projects produce different geometry, levels and roofs',()=>{
  const a=A.inventory(F.projectA()),b=A.inventory(F.buildingB());
  assert.equal(a.levels.length,1);assert.equal(b.levels.length,2);
  assert.deepEqual(b.levels.map(l=>[l.levelId,l.elevationMm,l.slabThicknessMm]),[['lvl_fx-b0',0,0],['lvl_fx-b1',2900,300]]);
  assert.notDeepEqual(a.levels[0].envelope,b.levels[0].envelope);
  assert.equal(a.elements.filter(e=>e.type==='wall').length,6);assert.equal(b.elements.filter(e=>e.type==='wall').length,11);
  const roofA=a.elements.find(e=>e.type==='roof'),roofsB=b.elements.filter(e=>e.type==='roof');
  assert.equal(roofA.surfaces[0].kind,'top-roof');assert.equal(roofA.surfaces[0].elevationMm,2700);
  // FloorPlanRoof returns the exposed part of the lower level as several polygons; they are used as given.
  assert.ok(roofsB[0].surfaces.length>=1&&roofsB[0].surfaces.every(s=>s.kind==='exposed-roof'&&s.elevationMm===2600));
  assert.deepEqual(roofsB[1].surfaces.map(s=>s.kind+'@'+s.elevationMm),['top-roof@5400']);
  assert.equal(roofA.surfaces[0].polygon.length,4);
});

test('associations are per level: same raw id on another level is a different element',async()=>{
  const c=await F.build('B'),m=await A.evaluate(c);
  const keys=m.inventory.elements.map(e=>e.key);
  assert.ok(keys.includes('lvl_fx-b0/roof')&&keys.includes('lvl_fx-b1/roof'));
  const roofTask=c.schedule.tasks.find(t=>t.id==='pa-cubierta');
  assert.deepEqual(roofTask.elements.map(e=>e.elementId),['lvl_fx-b1/roof']);
  assert.ok(m.links.every(l=>l.status==='ok'));
});

test('no fictitious elements: categories RUBIK does not model are listed, never inventoried',async()=>{
  const m=await A.evaluate(await F.build('A'));
  const types=new Set(m.inventory.elements.map(e=>e.type));
  for(const t of ['foundation','excavation','crane','scaffold','fence'])assert.ok(!types.has(t));
  assert.deepEqual(m.inventory.notInAuthority.map(x=>x.category),['foundation','excavation','structural-frame','pitched-roof-covering','wall-layers','site-temporary-works']);
  // The plan may contain a foundation TASK; it simply has no element to draw.
  assert.deepEqual(m.coverage.tasks.withoutElements,['cimentacion']);
});

test('evidence uses the real states and is never upgraded',async()=>{
  const ma=await A.evaluate(await F.build('A')),mc=await A.evaluate(await F.build('C')),md=await A.evaluate(await F.build('D'));
  assert.equal(ma.inventory.levels[0].scale.status,'verified');
  assert.ok(ma.visualElements.every(e=>e.evidence==='verified'));
  assert.equal(mc.inventory.levels[0].scale.status,'estimated');
  assert.equal(el(mc,'project/wal_c-x0').evidence.status,'pending','template + unreviewed stays pending');
  assert.equal(el(mc,'project/wal_c-new1').evidence.status,'estimated','confirmed element on estimated scale');
  assert.equal(md.inventory.levels[0].scale.status,'pending');
  assert.equal(el(md,'project/wal_d-2').evidence.reasons[1],'origen no declarado');
  // Scale "real" without a consistent verification is rejected by RUBIK itself, so it cannot reach the adapter.
  const bad=F.projectA();bad.scale.verification.status='discrepant';
  assert.throws(()=>A.inventory(bad));
});

test('reform starts from the existing building: existing walls are pre-existing, demolition is scheduled',async()=>{
  const c=await F.build('C'),m=await A.evaluate(c),v=k=>m.visualElements.find(e=>e.key===k);
  assert.equal(v('project/wal_c-x0').timeline,'pre-existing');
  assert.equal(v('project/wal_c-old').timeline,'scheduled');assert.equal(v('project/wal_c-old').lifecycle,'demolished');
  assert.equal(v('project/wal_c-new1').timeline,'scheduled');
  assert.equal(v('project/opn_c-w1').timeline,'pre-existing');
  const first=Visual.frameAt(c.schedule,Visual.timeline(c.schedule).preStartDate);
  assert.equal(first.elements.find(e=>e.elementId==='project/wal_c-old').state,'standing','demolished wall still stands at plan start');
  assert.equal(first.elements.find(e=>e.elementId==='project/wal_c-new1').present,false);
  const last=Visual.frameAt(c.schedule,Visual.timeline(c.schedule).completionDate);
  assert.equal(last.elements.find(e=>e.elementId==='project/wal_c-old').state,'removed');
  // Demolished walls keep their geometry for the "before" state, without openings.
  assert.ok(el(m,'project/wal_c-old').pieces.length>=1);
});

test('budget comes from the selected C1-C4 budget: exact per item, no double count, null stays unknown',async()=>{
  const c=await F.build('C'),m=await A.evaluate(c),r=m.costs.report,calc=Budget.calculateBudget(c.budget);
  assert.equal(m.costs.status,'available');assert.equal(r.budgetId,'bud_prj_fx-reform-c');
  const line=id=>calc.lines.find(l=>l.id===id);
  assert.equal(r.byTask.find(t=>t.taskId==='demolicion').totalNet,line('demolition').subtotalNet);
  assert.equal(r.byTask.find(t=>t.taskId==='puerta').totalNet,Budget.roundMoney(line('opening:door').subtotalNet/2));
  assert.deepEqual(m.coverage.budget.pendingAllocations,[{itemId:'opening:door',allocatedPercent:50,pendingPercent:50}]);
  assert.deepEqual(m.coverage.budget.unknownItemIds.sort(),['floor:mat_fx-tile','opening:window']);
  assert.equal(r.byTask.find(t=>t.taskId==='suelos').totalNet,null,'a task with an unpriced item has unknown total');
  assert.ok(r.byTask.find(t=>t.taskId==='suelos').knownNet>0);
  assert.ok(m.coverage.budget.allocatedKnownNet<=m.coverage.budget.budgetKnownNet);
  // Quantities come from the real 7A engine with provenance.
  assert.equal(c.budget.items.find(i=>i.id==='paint').quantity.source.engine,'FloorPlanQuantities');
  assert.equal(c.budget.items.find(i=>i.id==='paint').quantity.status,'estimated','estimated scale -> estimated quantity');
  const ma=await A.evaluate(await F.build('A'));
  assert.equal(ma.coverage.budget.allocatedPercentOfKnown,100);
  assert.equal(ma.costs.report.projectRevision.check,'unverifiable');
  assert.match(ma.delivery.assurances.budgetToProject,/no verificable por C1-C4; emparejamiento declarado/);
});

test('a building has no building-level budget in RUBIK: costs unavailable, never borrowed from one level',async()=>{
  const m=await A.evaluate(await F.build('B'));
  assert.equal(m.costs.status,'unavailable');assert.equal(m.costs.reason,'building-budget-not-supported');
  assert.equal(m.costs.levels[0].subject.id,'prj_fx-house-b-l0');assert.equal(m.coverage.budget,null);
  assert.ok(codes(m).includes('building-budget-not-supported'));
});

test('missing planning is reported, not invented',async()=>{
  const m=await A.evaluate(await F.build('D'));
  assert.equal(m.planning.status,'unavailable');assert.equal(m.planning.message,'PLANIFICACION NO DISPONIBLE O PENDIENTE');
  assert.equal(m.delivery.level,'internal');assert.deepEqual(m.delivery.blockers,['planning-unavailable','approval-not-authenticated']);
  assert.equal(m.costs.status,'budget-only');assert.equal(m.links.length,0);
  assert.equal(m.inventory.roof.status,'unavailable');
  assert.equal(el(m,'project/roof').representable,false);assert.equal(el(m,'project/roof').unavailableReason,'open-or-branched-facade');
});

test('revision changes invalidate: project, schedule and budget edits mark the binding obsolete',async()=>{
  const c=await F.build('A');
  assert.equal((await A.evaluate(c)).delivery.level,'evidenced-plan');
  const p2=structuredClone(c.source);p2.walls[0].heightMm=2900;
  const m1=await A.evaluate({...c,source:p2});
  assert.equal(m1.obsolescence.project,'obsolete');
  assert.ok(codes(m1).includes('schedule-project-revision-obsolete')&&codes(m1).includes('project-revision-obsolete'));
  assert.notEqual(m1.delivery.level,'evidenced-plan');assert.ok(m1.delivery.blockers.includes('project-revision-not-current'));
  const b2=structuredClone(c.budget);b2.items[0]={...b2.items[0],wastePercent:7};
  const m2=await A.evaluate({...c,budget:Budget.validateBudget(b2)});
  assert.equal(m2.obsolescence.budget,'obsolete');assert.equal(m2.delivery.level,'orientative');
  const s2=structuredClone(c.schedule);s2.tasks[1].endDate='2027-10-09';
  const m3=await A.evaluate({...c,schedule:s2});
  assert.equal(m3.obsolescence.schedule,'obsolete');
});

test('explanatory errors: broken link, role mismatch, other project, invalid binding',async()=>{
  const c=await F.build('C');
  const s=structuredClone(c.schedule);
  s.tasks[0].elements.push({elementId:'project/wal_nope',role:'demolition'});
  s.tasks[3].elements.push({elementId:'project/wal_c-old',role:'finish'});
  const m=await A.evaluate({...c,schedule:s});
  const broken=m.issues.find(i=>i.code==='link-unknown-element');
  assert.match(broken.message,/wal_nope.*no existe/);assert.equal(broken.severity,'error');
  assert.ok(m.issues.some(i=>i.code==='role-status-mismatch'&&/finish incompatible con wall demolished/.test(i.message)));
  assert.equal(m.delivery.level,'internal');assert.ok(m.delivery.blockers.includes('errors-present'));
  const other=await A.evaluate({...c,budget:{...c.budget,subject:{type:'project',id:'prj_other'}}});
  assert.ok(codes(other).includes('budget-other-project'));
  const bad=await A.evaluate({...c,binding:{...c.binding,fingerprints:{...c.binding.fingerprints,project:'abc'}}});
  assert.ok(codes(bad).includes('binding-invalid'));
  assert.throws(()=>A.createBinding({id:'bnd_fx-x1',source:c.source,fingerprints:{project:'0'.repeat(64)},review:{status:'reviewed'}}),/requires by and at/);
  assert.throws(()=>A.validateBinding({...c.binding,extra:1}),/unknown field extra/);
});

test('new elements without a task are unscheduled and block an approved plan',async()=>{
  const c=await F.build('A'),s=structuredClone(c.schedule);
  // Stored 0.2.0 form: all-'build' links are kept as legacy elementIds.
  const carp=s.tasks.find(t=>t.id==='carpinteria');carp.elementIds=carp.elementIds.filter(id=>id!=='project/opn_a-w1');
  const m=await A.evaluate({...c,schedule:s,binding:{...c.binding,fingerprints:{...c.binding.fingerprints,schedule:await A.fingerprint(s)}}});
  assert.equal(m.visualElements.find(e=>e.key==='project/opn_a-w1').timeline,'unscheduled');
  assert.ok(codes(m).includes('element-unscheduled'));
  assert.ok(m.coverage.elements.unscheduled.includes('project/opn_a-w1'));
  assert.equal(m.delivery.level,'orientative');assert.ok(m.delivery.blockers.includes('elements-unscheduled'));
});

test('temporal reversibility over real element keys and dates untouched',async()=>{
  const c=await F.build('A'),before=structuredClone(c.schedule),tl=Visual.timeline(c.schedule);
  const mid=Visual.frameAt(c.schedule,'2027-10-12');
  Visual.frameAt(c.schedule,tl.completionDate);
  assert.deepEqual(Visual.frameAt(c.schedule,'2027-10-12'),mid);
  assert.equal(mid.elements.find(e=>e.elementId==='project/wal_a-n').state,'standing');
  assert.equal(mid.elements.find(e=>e.elementId==='project/roof').state,'building');
  assert.equal(mid.elements.find(e=>e.elementId==='project/opn_a-n1').present,false);
  const end=Visual.frameAt(c.schedule,tl.completionDate);
  assert.ok(end.elements.every(e=>e.present));
  assert.deepEqual(c.schedule,before);
});

test('no mutation of project, building, schedule, budget or binding',async()=>{
  for(const id of F.ids){
    const c=await F.build(id),snap=structuredClone(c);
    await A.evaluate(c);A.inventory(c.source);
    assert.deepEqual(c,snap,id);
  }
});

test('compatibility: legacy 0.1.0 schedule strings over real keys still evaluate',async()=>{
  const c=await F.build('C'),fp=await A.fingerprint(c.source);
  const legacy={schema:Schedule.SCHEMA,schemaVersion:'0.1.0',id:'sch_legacy',projectRef:{type:'project',id:c.source.id,revision:fp},source:'FIXTURE legacy',
    review:{status:'draft',by:null,at:null},tasks:[{id:'t1',title:'FIXTURE tabiques',wbs:'01',startDate:'2027-02-08',endDate:'2027-02-19',dependsOn:[],
      elementIds:['project/wal_c-new1','project/wal_c-new2'],budgetItemIds:['partition-new'],source:'FIXTURE'}]};
  const m=await A.evaluate({source:c.source,schedule:legacy,budget:c.budget});
  assert.ok(m.links.every(l=>l.status==='ok'&&l.role==='build'));
  assert.equal(m.costs.status,'available');
  assert.equal(m.planning.evidence,'plan-estimated');
});

/* ---------- Phase A corrections (traceability) ---------- */
const withBinding=async(c,patch={})=>({...c,binding:A.createBinding({id:'bnd_fx-test',source:c.source,
  fingerprints:{project:await A.fingerprint(c.source),schedule:await A.fingerprint(c.schedule),budget:c.budget?await A.fingerprint(c.budget):null,...(patch.fingerprints||{})},
  scheduleId:patch.scheduleId!==undefined?patch.scheduleId:c.schedule.id,budgetId:patch.budgetId!==undefined?patch.budgetId:(c.budget?c.budget.id:null),
  review:patch.review||{status:'reviewed',by:'FIXTURE arquitecta',at:'2026-11-05T09:00:00+01:00'}})});

test('A1: the highest level reachable today is "evidenced-plan"; accredited approval is never claimed',async()=>{
  const m=await A.evaluate(await F.build('A'));
  assert.equal(m.delivery.level,'evidenced-plan');
  assert.match(m.delivery.label,/revisión declarada, no acreditada/);
  assert.doesNotMatch(m.delivery.label,/Entrega profesional|verificad[oa] completamente|certificad[oa]\b/i);
  assert.ok(m.delivery.blockers.includes('approval-not-authenticated'));
  assert.ok(A.DELIVERY.includes('accredited'));
  assert.match(m.delivery.assurances.approval,/identidad no verificada/);
  assert.match(m.delivery.scopeNotice,/Alcance parcial: RUBIK no modela foundation/);
});
test('A1: correct project fingerprint but unbound budget cannot reach evidenced-plan',async()=>{
  const c=await F.build('A'),m=await A.evaluate(await withBinding(c,{fingerprints:{budget:null},budgetId:null}));
  assert.equal(m.obsolescence.budget,'unbound');
  assert.ok(m.issues.some(i=>i.code==='budget-unbound')&&m.issues.some(i=>i.code==='binding-budget-unbound'));
  assert.equal(m.delivery.level,'orientative');assert.ok(m.delivery.blockers.includes('budget-revision-not-current'));
});
test('A1: obsolete plan fingerprint and obsolete budget fingerprint both block a declared plan',async()=>{
  const c=await F.build('A');
  const ms=await A.evaluate(await withBinding(c,{fingerprints:{schedule:'0'.repeat(64)}}));
  assert.equal(ms.obsolescence.schedule,'obsolete');assert.equal(ms.delivery.level,'orientative');assert.ok(ms.delivery.blockers.includes('schedule-revision-not-current'));
  const mb=await A.evaluate(await withBinding(c,{fingerprints:{budget:'1'.repeat(64)}}));
  assert.equal(mb.obsolescence.budget,'obsolete');assert.equal(mb.delivery.level,'orientative');assert.ok(mb.delivery.blockers.includes('budget-revision-not-current'));
});
test('A1: partially defined binding (plan not fixed) never raises confidence',async()=>{
  const c=await F.build('A'),m=await A.evaluate(await withBinding(c,{fingerprints:{schedule:null},scheduleId:null}));
  assert.equal(m.obsolescence.schedule,'unbound');
  assert.ok(m.issues.some(i=>i.code==='binding-schedule-unbound'));
  assert.equal(m.delivery.level,'orientative');
  // A binding fixing a document that was not supplied is reported, not assumed.
  const noBudget=await A.evaluate({...(await withBinding(c)),budget:null});
  assert.equal(noBudget.obsolescence.budget,'missing-document');assert.ok(noBudget.issues.some(i=>i.code==='budget-missing'));
});
test('A1/A4: a reviewer declared in JSON is a declaration, not an authenticated approval',async()=>{
  const c=await F.build('A'),m=await A.evaluate(await withBinding(c,{review:{status:'reviewed',by:'Cualquiera',at:'2026-11-05T10:00:00Z'}}));
  assert.equal(m.delivery.level,'evidenced-plan');
  assert.match(m.delivery.assurances.approval,/declarada en el vinculo por Cualquiera.*identidad no verificada/);
  assert.notEqual(m.delivery.level,'accredited');
  const draft=await A.evaluate(await withBinding(c,{review:{status:'draft'}}));
  assert.equal(draft.delivery.level,'orientative');assert.ok(draft.delivery.blockers.includes('binding-not-reviewed'));
});
test('A1: incomplete budget coverage stays at declared-plan with explicit blockers',async()=>{
  const m=await A.evaluate(await F.build('C'));
  assert.equal(m.delivery.level,'declared-plan');
  assert.ok(['budget-coverage-incomplete','budget-lines-unverified','geometry-not-verified'].every(b=>m.delivery.blockers.includes(b)));
});
test('A2: a plan of another project never animates this geometry, even with identical task names',async()=>{
  const a=await F.build('A'),c=await F.build('C');
  // Same task ids/titles as C's plan, but it belongs to project A.
  const twin=structuredClone(c.schedule);twin.projectRef={...a.schedule.projectRef};
  const m=await A.evaluate({source:c.source,schedule:twin,budget:c.budget});
  assert.equal(m.planning.status,'rejected');assert.equal(m.planning.reason,'schedule-other-project');
  assert.match(m.planning.message,/PLAN DE OTRO PROYECTO \(prj_fx-house-a\)/);
  assert.equal(m.links.length,0,'no element is linked through a rejected plan');
  assert.equal(m.costs.status,'budget-only','costs are not combined with a rejected plan');
  assert.equal(m.fingerprints.schedule,null);
  assert.ok(m.delivery.blockers.includes('planning-rejected'));
  // Same project id but tasks pointing to A's keys: rejected through ids, never through texts.
  const forged=structuredClone(a.schedule);forged.projectRef={...c.schedule.projectRef};
  const m2=await A.evaluate({source:c.source,schedule:forged,budget:c.budget});
  assert.equal(m2.planning.status,'available');
  assert.ok(m2.issues.filter(i=>i.code==='link-unknown-element').length>=6);
  assert.equal(m2.delivery.level,'internal');
  // A building plan on a single project is rejected too.
  const b=await F.build('B');
  assert.equal((await A.evaluate({source:c.source,schedule:b.schedule})).planning.status,'rejected');
});
test('A3: a level budget is identified and never used as the whole building budget',async()=>{
  const b=await F.build('B'),levelBudget=b.budgets[0].budget;
  const m=await A.evaluate({...b,budget:levelBudget});
  assert.equal(m.costs.status,'unavailable');assert.equal(m.costs.reason,'level-budget-not-building');assert.equal(m.costs.levelId,'lvl_fx-b0');
  assert.match(m.costs.message,/planta lvl_fx-b0/);assert.equal(m.coverage.budget,null);
  const other=await A.evaluate({...b,budget:(await F.build('C')).budget});
  assert.equal(other.costs.reason,'budget-other-project');
});
test('S1: a C1-C4 budget whose subject is the building itself is accepted by identity (schema allows it)',async()=>{
  const b=await F.build('B'),whole={...structuredClone(b.budgets[0].budget),id:'bud_fx-building-b',subject:{type:'building',id:b.source.id}};
  Budget.validateBudget(whole);
  const m=await A.evaluate({...b,budget:whole});
  assert.equal(m.costs.status,'available');assert.equal(m.costs.report.budgetId,'bud_fx-building-b');
  assert.ok(!codes(m).includes('budget-other-project')&&!codes(m).includes('level-budget-not-building'));
  // The same subject id under another type is another subject: never matched.
  const a=await F.build('A'),wrongType={...structuredClone(a.budget),subject:{type:'building',id:a.source.id}};
  assert.equal((await A.evaluate({...a,budget:wrongType})).costs.reason,'budget-other-project');
});
test('A6: three coverages are separate; 100 % of loaded items is not 100 % of the works',async()=>{
  const m=await A.evaluate(await F.build('A'));
  assert.equal(m.coverage.budget.allocatedPercentOfKnown,100);
  assert.match(m.coverage.budget.note,/no equivale al porcentaje de la obra presupuestada/);
  const scope=m.coverage.scope;
  assert.ok(scope.categories.find(x=>x.category==='roof').status==='not-budgetable-in-c1-c4');
  assert.ok(scope.notModeled.includes('foundation'));
  assert.ok(scope.budgetedKnown>0&&scope.notBudgetable>0);
  assert.equal(m.coverage.geometry.phasesWithElements,6);assert.equal(m.coverage.geometry.phases,7);
  const c=await A.evaluate(await F.build('C'));
  assert.equal(c.coverage.scope.categories.find(x=>x.category==='openings:window').status,'budgeted-unpriced');
  assert.equal(c.coverage.scope.categories.find(x=>x.category==='floors:mat_fx-tile').status,'budgeted-unpriced');
  const d=await A.evaluate(await F.build('D'));
  assert.ok(d.coverage.scope.categories.every(x=>['budgeted-unpriced','not-in-budget','not-budgetable-in-c1-c4'].includes(x.status)));
});
test('Gate D: illustrative site resources are explicit plan links, drawn as illustrations, never project geometry',async()=>{
  const a=await F.build('A'),base=await A.evaluate(a);
  const plan=structuredClone(a.schedule);
  plan.tasks.unshift({id:'implantacion',wbs:'00',title:'FIXTURE Implantacion de obra',startDate:'2027-09-01',endDate:'2027-09-03',source:'FIXTURE',dependsOn:[],
    elements:[{elementId:'illustrative/site-fence',role:'site'},{elementId:'illustrative/site-hut',role:'site'}],budgetAllocations:[]});
  plan.tasks.push({id:'grua',wbs:'08',title:'FIXTURE Grua',startDate:'2027-09-20',endDate:'2027-10-22',source:'FIXTURE',dependsOn:[],
    elements:[{elementId:'illustrative/crane',role:'temporary'}],budgetAllocations:[]});
  Schedule.validate(plan);
  const m=await A.evaluate({...a,schedule:plan,binding:null});
  assert.deepEqual(m.illustrative.map(r=>[r.key,r.label]),[['illustrative/site-fence','Vallado de obra'],['illustrative/site-hut','Caseta de obra'],['illustrative/crane','Grúa']]);
  assert.ok(m.links.filter(l=>l.elementKey.startsWith('illustrative/')).every(l=>l.status==='illustrative'));
  assert.ok(!codes(m).includes('link-unknown-element'));
  assert.equal(m.issues.filter(i=>i.code==='illustrative-resource').length,3);
  const v=m.visualElements.filter(e=>e.illustrative);assert.equal(v.length,3);assert.ok(v.every(e=>e.evidence==='illustrative'&&e.type==='illustrative'));
  // Coverage and evidence of the project are unchanged by illustrations.
  assert.deepEqual(m.coverage.elements,base.coverage.elements);assert.deepEqual(m.inventory.elements.length,base.inventory.elements.length);
  // Unknown kinds and roles outside the allowed ones are errors.
  const bad=structuredClone(plan);bad.tasks[0].elements=[{elementId:'illustrative/helicopter',role:'site'}];bad.tasks.at(-1).elements=[{elementId:'illustrative/crane',role:'finish'}];
  const mb=await A.evaluate({...a,schedule:bad,binding:null});
  assert.ok(codes(mb).includes('illustrative-unknown'));assert.ok(mb.issues.some(i=>i.code==='role-status-mismatch'&&/Grúa/.test(i.message)));
  assert.equal(mb.delivery.level,'internal');
});
