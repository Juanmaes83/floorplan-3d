/* FT3D-8 S1-C: construction dossier over the REAL authorities (cases A-J, economy, territory, no mutation, imports,
   package integrity, invalidation, compatibility). Fixtures are synthetic and validated by the real validators. */
const test=require('node:test');
const assert=require('node:assert/strict');
const D=require('../js/construction-dossier-core.js');
const X=require('../labs/ft3d-8/dossier-fixtures.js');
const Budget=require('../js/budget-core.js');
const Core=require('../js/project-core.js');
const Schedule=require('../js/construction-schedule-core.js');
const Territory=require('../js/territory-integration-core.js');
const Policy=require('../js/territory-export-policy.js');
const A=require('../js/construction-project-adapter.js');

const parcelOf=async(c,over={})=>c.gml?D.readParcelDocument(over.text??c.gml.text,{provider:X.stubProvider,fileName:c.gml.fileName,associatedWith:over.associatedWith===undefined?c.gml.associatedWith:over.associatedWith}):null;
const run=async(c,over={})=>D.evaluate({...c,parcelDocument:await parcelOf(c,over.gml||{}),...over.input});
const codes=e=>e.issues.map(i=>i.code);
const errors=e=>e.issues.filter(i=>i.severity==='error').map(i=>i.code);
const result=(e,authority,against)=>e.correspondence.filter(c=>c.authority===authority&&(!against||c.against===against)).map(c=>c.result);

test('Case A: single-level house, budget, plan, parcel and brand of the same project are matched by identity',async()=>{
  const c=await X.dossier('A'),e=await run(c);
  assert.deepEqual(errors(e),[]);
  assert.equal(e.subject.type,'project');assert.equal(e.subject.id,'prj_fx-house-a');
  assert.match(e.dossier.id,/^dos_[0-9a-f]{16}$/);
  for(const [a,b] of [['budget','subject'],['schedule','subject'],['schedule','project-revision'],['binding','project'],['binding','schedule'],['binding','budget'],['parcel','project-site'],['brand','subject']])
    assert.deepEqual(result(e,a,b),['match'],a+'/'+b);
  // C1-C4 keeps no project revision: never reported as a match.
  assert.deepEqual(result(e,'budget','project-revision'),['unverifiable']);
  assert.equal(e.authorities.budget.scope,'project');
  assert.ok(e.usable.timelapse&&e.usable.costs&&e.usable.delivery);
  assert.equal(e.delivery.level,'evidenced-plan');assert.ok(e.delivery.blockers.includes('approval-not-authenticated'));
  assert.ok(D.RESULTS.length===5&&e.correspondence.every(x=>D.RESULTS.includes(x.result)));
});
test('Case B: two-level building shows each level budget separately and never a building total',async()=>{
  const c=await X.dossier('B'),e=await run(c);
  assert.equal(e.subject.type,'building');assert.equal(e.subject.levels.length,2);
  const b=e.authorities.budget;
  assert.equal(b.scope,'levels-not-summed');assert.equal(b.selected.length,2);
  assert.deepEqual(b.selected.map(x=>x.levelId),['lvl_fx-b0','lvl_fx-b1']);
  assert.ok(codes(e).includes('building-budgets-not-summed'));
  assert.match(b.message,/sin sumarlos/);
  // No field anywhere carries a sum of both levels.
  const sum=Math.round((b.selected[0].totals.net.amount+b.selected[1].totals.net.amount)*100)/100;
  assert.ok(!JSON.stringify(e.authorities.budget).includes(String(sum)));
  assert.equal(e.usable.costs,false);assert.equal(e.model.costs.reason,'building-budget-not-supported');
  // One level budget alone is identified as such.
  const one=await D.evaluate({...c,budgets:[c.budgets[0]]});
  assert.equal(one.authorities.budget.scope,'level');assert.equal(one.model.costs.reason,'level-budget-not-building');
});
test('Case C: reform keeps existing/new/demolished elements and partial allocations pending',async()=>{
  const c=await X.dossier('C'),e=await run(c);
  assert.deepEqual(errors(e),[]);
  const life=new Set(e.model.inventory.elements.map(x=>x.lifecycle));
  for(const l of ['existing','new','demolished'])assert.ok(life.has(l),l);
  assert.ok(e.coverage.budget.pendingAllocations.some(p=>p.itemId==='opening:door'&&p.pendingPercent===50));
  assert.ok(e.authorities.budget.selected[0].unpricedItemIds.length>0);
});
test('Case D: without plan the model is shown and no date is invented',async()=>{
  const c=await X.dossier('D'),e=await D.evaluate(c);
  assert.equal(e.usable.model,true);assert.equal(e.usable.timelapse,false);
  assert.deepEqual(result(e,'schedule','subject'),['absent']);
  assert.ok(codes(e).includes('planning-unavailable'));
  assert.equal(e.authorities.schedule.status,'absent');assert.equal(e.model.coverage.tasks,null);
  assert.equal(e.authorities.budget.selected[0].totals.net.amount,null,'an unknown total stays null, never 0');
});
test('Case E: the budget of another house blocks the binding of costs',async()=>{
  const a=await X.dossier('A'),c=await X.dossier('C'),e=await run(a,{input:{budgets:[c.budgets[0]]}});
  assert.ok(errors(e).includes('budget-other-project'));
  assert.deepEqual(result(e,'budget','subject'),['mismatch']);
  assert.equal(e.usable.costs,false);assert.equal(e.usable.delivery,false);assert.equal(e.delivery.level,'internal');
  assert.ok(e.conflicts.some(x=>x.code==='budget-other-project'&&x.resolution==='none'));
  assert.equal(e.issues.find(i=>i.code==='budget-other-project').message,'El presupuesto pertenece a otro proyecto');
});
test('Case F: a plan of another project with identically named tasks is rejected by identity',async()=>{
  const a=await X.dossier('A');
  const forged={...structuredClone(a.schedule),id:'sch_fx-other',projectRef:{type:'project',id:'prj_fx-other-house',revision:'0'.repeat(64)}};
  assert.deepEqual(forged.tasks.map(t=>t.title),a.schedule.tasks.map(t=>t.title));
  const e=await run(a,{input:{schedule:forged}});
  assert.equal(e.model.planning.status,'rejected');assert.deepEqual(result(e,'schedule','subject'),['mismatch']);
  assert.equal(e.usable.timelapse,false);
  assert.ok(e.conflicts.some(x=>x.code==='schedule-other-project'));
  assert.equal(e.issues.find(i=>i.code==='schedule-other-project').message,'La planificación pertenece a otro proyecto');
});
test('Case G: a parcel associated with another project is a conflict, never placed; another reference too',async()=>{
  const a=await X.dossier('A'),c=await X.dossier('C');
  const e=await run(a,{gml:{associatedWith:{type:'project',id:'prj_fx-reform-c'}}});
  assert.ok(errors(e).includes('parcel-other-project'));
  assert.ok(e.conflicts.some(x=>x.code==='parcel-other-project'));
  assert.notEqual(e.dossier.id,(await run(a)).dossier.id,'a conflicting parcel association never shares the coherent dossier id');
  assert.equal(e.authorities.territory.evidence.status,'other-project');
  // The GML of C associated with A: references differ from A's saved parcel -> conflict, no placement used.
  const e2=await run(a,{gml:{text:c.gml.text,associatedWith:{type:'project',id:a.project.id}}});
  assert.ok(errors(e2).includes('parcel-reference-mismatch'));
  assert.equal(e2.authorities.territory.status,'conflict');assert.equal(e2.authorities.territory.placement.status,'not-placed');
  const cf=e2.conflicts.find(x=>x.code==='parcel-reference-mismatch');
  assert.deepEqual(cf.values,{projectSite:'FX00A00001AA01',document:'FX00C00001CC01'});
  // A project without parcel receiving a GML: candidate only, no automatic placement.
  const d=await X.dossier('D'),e3=await D.evaluate({...d,parcelDocument:await D.readParcelDocument(a.gml.text,{provider:X.stubProvider,associatedWith:{type:'project',id:d.project.id}})});
  assert.equal(e3.authorities.territory.status,'candidate-unplaced');assert.equal(e3.authorities.territory.placement.status,'not-placed');
  assert.ok(codes(e3).includes('parcel-candidate-unplaced'));
});
test('Case H: changing geometry or budget after binding invalidates what depends on it',async()=>{
  const a=await X.dossier('A'),base=await run(a);
  // Move one wall end by 10 mm (a real edit through the validator).
  const moved=structuredClone(a.project);moved.walls[0].end={...moved.walls[0].end,x:moved.walls[0].end.x+10};Core.validate(moved,{strict:true});
  const e=await run({...a,project:moved});
  assert.deepEqual(result(e,'binding','project'),['obsolete']);assert.deepEqual(result(e,'schedule','project-revision'),['obsolete']);
  const inv=D.invalidation(base,e);
  assert.ok(inv.changed.includes('geometry')&&inv.changed.includes('project'));
  assert.equal(inv.invalidates.links,true);assert.equal(inv.invalidates.delivery,true);assert.equal(inv.history,'kept');
  assert.notEqual(e.dossier.id,base.dossier.id);assert.notEqual(e.delivery.level,'evidenced-plan');
  // One price change in one item.
  const priced=structuredClone(a.budgets[0]);priced.items[0].unitPrice=priced.items[0].unitPrice+1;
  const e2=await run({...a,budgets:[priced]});
  assert.deepEqual(result(e2,'binding','budget'),['obsolete']);
  const inv2=D.invalidation(base,e2);assert.deepEqual(inv2.changed,['budget']);assert.equal(inv2.invalidates.costs,true);assert.equal(inv2.invalidates.links,false);
  // A rename changes the document but not the geometry revision.
  const renamed=structuredClone(a.project);renamed.name='FIXTURE A renombrada';
  const inv3=D.invalidation(base,await run({...a,project:renamed}));
  assert.ok(inv3.changed.includes('project')&&!inv3.changed.includes('geometry'));
});
test('Case I: incomplete data degrades explicitly (null prices, pending allocations, estimated geometry, runtime layers)',async()=>{
  const c=await X.dossier('C'),e=await run(c),b=e.authorities.budget.selected[0];
  assert.ok(b.unpricedItemIds.length);assert.equal(b.totals.net.complete,false);
  for(const id of b.unpricedItemIds){const p=b.provenance.find(x=>x.itemId===id);assert.equal(p.unitPrice,null);assert.equal(p.priceStatus,'unknown');}
  assert.ok(b.provenance.some(p=>p.priceStatus==='known-unreviewed'),'known is not reviewed');
  assert.ok(e.coverage.elements.byEvidence.estimated>0,'estimated geometry stays estimated');
  // Runtime layers (real territorial fixture with PNOA/MDT05 metadata): only metadata is persisted, pixels and grids are
  // not in a dossier, so they are neither displayed nor exported from it, even with a verified licence.
  const T=require('./fixtures/territorial-integration.cjs').build(),t=(await D.evaluate({project:T.building})).authorities.territory;
  for(const k of ['orthophoto','terrain']){assert.equal(t.layers[k].persisted,'metadata');assert.equal(t.layers[k].runtime,'not-loaded');
    assert.equal(t.layers[k].canExport,false);assert.equal(t.layers[k].reason,'not-loaded');}
  assert.equal(T.building.site.terrain.source.license.status,'verified');
  assert.equal(Policy.layer(T.building.site.terrain.source,true).canExport,true,'the same layer, once loaded at runtime, would be exportable');
});
test('Case J: invalid GML or unsupported CRS is rejected safely and the saved parcel is kept',async()=>{
  const a=await X.dossier('A');
  await assert.rejects(D.readParcelDocument('{"no":"gml"}',{provider:X.stubProvider}),e=>e.code==='import-not-gml');
  await assert.rejects(D.readParcelDocument('<'+'x'.repeat(D.LIMITS.gmlBytes),{provider:X.stubProvider}),e=>e.code==='import-too-large');
  const wrongCrs=X.gml('FX00A00001AA01',X.PARCELS.A.ring,{crs:'4326'});
  const e=await run(a,{gml:{text:wrongCrs}});
  assert.ok(errors(e).includes('parcel-document-invalid'));
  assert.equal(e.authorities.territory.evidence.reason,'unsupported-source-crs');
  assert.equal(e.authorities.territory.parcel.reference,'FX00A00001AA01','the saved parcel is still the authority');
  assert.equal(e.issues.find(i=>i.code==='parcel-document-invalid').message,'El archivo GML no se puede usar');
});
test('C6 economy: amounts equal the C1-C4 engine, allocations never exceed an item, net/tax/gross stay separate',async()=>{
  const a=await X.dossier('A'),e=await run(a),calc=Budget.calculateBudget(a.budgets[0]),v=e.authorities.budget.selected[0];
  assert.deepEqual(v.totals,{net:calc.totals.net,tax:calc.totals.tax,gross:calc.totals.gross});
  assert.equal(v.discounts,'not-in-contract');
  const r=e.model.costs.report,cents=x=>Math.round(x*100);
  const allocated=r.byTask.reduce((s,t)=>s+cents(t.knownNet??t.totalNet??0),0);
  assert.equal(allocated,cents(r.scheduleTotals.allocatedKnownNet));
  assert.ok(allocated<=cents(calc.totals.net.amount));
  const perItem=new Map();for(const t of r.byTask)for(const l of t.lines)perItem.set(l.itemId,(perItem.get(l.itemId)||0)+cents(l.allocatedNet??0));
  for(const [id,sum] of perItem)assert.ok(sum<=cents(calc.lines.find(x=>x.id===id).subtotalNet),id+' allocated beyond its subtotal');
  // Grouped items are never split onto single elements: links are plan elements, costs are plan allocations.
  assert.ok(r.byTask.every(t=>t.lines.every(l=>!('elementId' in l))));
});
test('C6 provenance: a BC3 reference price keeps provider, code, edition, region and licence',async()=>{
  const a=await X.dossier('A'),b=structuredClone(a.budgets[0]),item=b.items.find(i=>i.unitPrice!==null);
  const ref={providerId:'user-bc3',itemId:'FX-BC3-001',code:'FX01.001',description:'FIXTURE partida BC3',unit:item.quantity.unit,unitPrice:item.unitPrice,currency:'EUR',priceKind:'reference',
    source:{label:'FIXTURE base BC3 del estudio',asOf:'2026-01-15',retrievedAt:'2026-11-05T09:00:00Z',edition:'FIXTURE 2026',region:'FIXTURE región',sourceUrl:null,attribution:null,licenseStatus:'unknown',licenseName:null,licenseUrl:null}};
  Object.assign(item,{priceSource:{type:'provider-reference',providerId:'user-bc3',itemId:'FX-BC3-001'},priceReference:ref});
  Budget.validateBudget(b);
  const e=await D.evaluate({...a,budgets:[b],binding:null}),p=e.authorities.budget.selected[0].provenance.find(x=>x.itemId===item.id);
  assert.equal(p.origin,'user-bc3');
  assert.deepEqual({code:p.priceReference.code,edition:p.priceReference.edition,region:p.priceReference.region,licenseStatus:p.priceReference.licenseStatus},
    {code:'FX01.001',edition:'FIXTURE 2026',region:'FIXTURE región',licenseStatus:'unknown'});
});
test('C7 territory: placement transforms are checked numerically with a documented tolerance',async()=>{
  for(const id of ['A','B','C']){
    const c=await X.dossier(id),e=await run(c),t=e.authorities.territory,site=c.project.site;
    assert.equal(t.placement.status,'placed',id);
    for(const ch of t.placement.checks)assert.equal(ch.ok,true,id+' '+ch.check);
    const anchor=t.placement.checks.find(x=>x.check==='anchor-maps-to-parcel-anchor');assert.ok(anchor.errorMm<=D.TOLERANCE_MM);
    // Independent recomputation: the anchor in source CRS is the parcel frame origin (parcel-local anchor 0,0).
    const src=t.placement.checks.find(x=>x.check==='anchor-inside-parcel').anchorSource;
    assert.ok(Math.abs(src.x-site.parcel.frame.originX)<1e-9&&Math.abs(src.y-site.parcel.frame.originY)<1e-9);
    assert.equal(t.northOffsetDeg,X.PARCELS[id].north);
    // 1 m east in the parcel = rotation by north offset in the model (exact, checked against the authority).
    const m=Territory.parcelToModel(site,{x:1000,y:0}),ang=site.northOffsetDeg*Math.PI/180;
    const exp={x:site.buildingPlacement.horizontal.modelAnchorMm.x+1000*Math.cos(ang),y:site.buildingPlacement.horizontal.modelAnchorMm.y+1000*Math.sin(ang)};
    assert.ok(Math.hypot(m.x-exp.x,m.y-exp.y)<=D.TOLERANCE_MM,id);
    assert.equal(t.layers.parcel.canExport,false,'Catastro restricted is never exportable');
    assert.equal(e.exportPolicy.video.parcelGeometry,false);assert.equal(e.exportPolicy.html.parcelGeometry,false);
    assert.equal(e.exportPolicy.html.parcelReferenceText,true);assert.equal(e.exportPolicy.publicLink.enabled,false);
  }
  const b=await run(await X.dossier('B'));
  assert.equal(b.authorities.territory.placement.levels.length,2);
});
test('C8 no mutation: evaluating and packaging never modify the professional documents',async()=>{
  const c=await X.dossier('A'),parcelDocument=await parcelOf(c),before=JSON.stringify({c,parcelDocument});
  await D.evaluate({...c,parcelDocument});await D.assemble({...c,parcelDocument});
  assert.equal(JSON.stringify({c,parcelDocument}),before);
  const e=await D.evaluate({...c,parcelDocument});assert.ok(Object.isFrozen(e));
});
test('package: assemble -> open is verified; any edit after assembly marks it altered; GML text is not redistributed',async()=>{
  const c=await X.dossier('A'),parcelDocument=await parcelOf(c),pkg=await D.assemble({...c,parcelDocument,assembledAt:'2026-11-05T10:00:00.000Z'});
  assert.equal(pkg.schema,'rubik-sota.construction-dossier');assert.match(pkg.id,/^dos_[0-9a-f]{16}$/);
  assert.ok(!JSON.stringify(pkg).includes('<g:FeatureCollection'),'the restricted GML text never travels in the package');
  assert.equal(pkg.parts.parcelEvidence.reference,'FX00A00001AA01');
  const text=JSON.stringify(pkg),again=D.readJson(text);assert.equal(D.kindOf(again),'dossier');
  const opened=await D.openPackage(again);assert.equal(opened.integrity,'verified');
  const e=await D.evaluate({...opened.input,opened});
  assert.deepEqual(errors(e),[]);assert.equal(e.dossier.integrity,'verified');assert.equal(e.dossier.id,pkg.id);
  assert.equal(e.authorities.territory.evidence.status,'registered-not-loaded');
  // Re-loading the GML restores the evidence check.
  const e2=await D.evaluate({...opened.input,opened,parcelDocument});assert.deepEqual(result(e2,'parcel','project-site'),['match']);
  const tampered=structuredClone(again);tampered.parts.budgets[0].items[0].unitPrice=1;
  const o2=await D.openPackage(tampered);assert.equal(o2.integrity,'altered');assert.ok(o2.changed.some(k=>k.startsWith('budget:')));
  const e3=await D.evaluate({...o2.input,opened:o2});assert.ok(errors(e3).includes('dossier-altered'));assert.equal(e3.usable.delivery,false);
  await assert.rejects(D.openPackage({...again,schemaVersion:'9.0.0'}),x=>x.code==='dossier-version-unsupported');
});
test('C4 imports: content sniffing, size and depth limits, malformed input, kind by schema',()=>{
  assert.throws(()=>D.readJson('<xml/>'),e=>e.code==='import-not-json');
  assert.throws(()=>D.readJson('{"a":'),e=>e.code==='import-malformed');
  assert.throws(()=>D.readJson('{"a":"'+'x'.repeat(D.LIMITS.jsonBytes)+'"}'),e=>e.code==='import-too-large');
  let deep='{}';for(let i=0;i<D.LIMITS.jsonDepth+2;i++)deep='{"a":'+deep+'}';
  assert.throws(()=>D.readJson(deep),e=>e.code==='import-too-deep');
  assert.equal(D.kindOf(D.readJson('﻿  {"schema":"rubik-sota.floorplan-budget"}')),'budget');
  assert.equal(D.kindOf({schema:'rubik-sota.construction-schedule'}),'schedule');
  assert.equal(D.kindOf({schema:'unknown'}),null);
  assert.equal(D.LIMITS.gmlBytes,2000000);assert.equal(D.LIMITS.logoBytes,300*1024);
});
test('fixture size justifies the 8 MiB package limit (S1-B §8)',async()=>{
  const c=await X.dossier('B'),pkg=await D.assemble(c);
  const bytes=Buffer.byteLength(JSON.stringify(pkg));
  assert.ok(bytes<1024*1024,'a 2-level building dossier is '+bytes+' bytes');
});
test('brand: another project or no association is reported; the snapshot is never rewritten',async()=>{
  const a=await X.dossier('A'),c=await X.dossier('C');
  const e=await run(a,{input:{brand:c.brand}});
  assert.ok(errors(e).includes('brand-other-project'));assert.equal(e.authorities.brand.status,'other-project');
  const e2=await run(a,{input:{brand:{snapshot:a.brand.snapshot,appliesTo:null}}});
  assert.ok(codes(e2).includes('brand-association-missing'));
  const e3=await run(a,{input:{brand:null}});assert.deepEqual(result(e3,'brand','subject'),['absent']);
});
test('compatibility: budget 1.0.0 and plan 0.1.0 are read without rewriting the documents',async()=>{
  const d=await X.dossier('D'),old=structuredClone(d.budgets[0]);old.schemaVersion='1.0.0';old.items=old.items.map(({priceReference,...i})=>i);
  const keep=JSON.stringify(old),e=await D.evaluate({...d,budgets:[old]});
  assert.equal(JSON.stringify(old),keep);assert.equal(e.authorities.budget.selected[0].schemaVersion,'1.0.0');
  const a=await X.dossier('A'),fp=await A.fingerprint(a.project);
  const legacy={schema:Schedule.SCHEMA,schemaVersion:'0.1.0',id:'sch_fx-legacy',projectRef:{type:'project',id:a.project.id,revision:fp},source:'FIXTURE',review:{status:'draft',by:null,at:null},
    tasks:[{id:'t1',wbs:'01',title:'FIXTURE muros',startDate:'2027-01-04',endDate:'2027-01-08',source:'FIXTURE',dependsOn:[],elementIds:[A.elementKey(null,'wal_a-n')],budgetItemIds:[]}]};
  const lk=JSON.stringify(legacy),e2=await D.evaluate({project:a.project,budgets:[],schedule:legacy});
  assert.equal(JSON.stringify(legacy),lk);assert.equal(e2.model.planning.status,'available');assert.deepEqual(result(e2,'schedule','subject'),['match']);
});
test('switching dossiers: nothing of A survives in the evaluation of C',async()=>{
  const a=await run(await X.dossier('A')),c=await run(await X.dossier('C'));
  const text=JSON.stringify({...c,model:undefined});
  for(const s of ['prj_fx-house-a','bud_prj_fx-house-a','sch_fx-house-a','FX00A00001AA01','FIXTURE Estudio Norte'])assert.ok(!text.includes(s),s+' leaked into C');
  const inv=D.invalidation(a,c);assert.equal(inv.subjectChanged,true);assert.equal(inv.invalidates.delivery,true);
});
test('every issue has a human message and keeps its technical code',async()=>{
  for(const id of X.ids){const e=await run(await X.dossier(id));for(const i of e.issues){assert.ok(i.message&&i.code);}}
  for(const [code,text] of Object.entries({'budget-other-project':'El presupuesto pertenece a otro proyecto','planning-unavailable':'Todavía no hay una planificación asociada'}))
    assert.equal(D.human(code),text);
  assert.match(D.human('parcel-reference-mismatch'),/^La parcela necesita comprobarse/);
});
