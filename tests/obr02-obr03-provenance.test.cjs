'use strict';
/* OBR-02/03 · procedencia (auditoría del propietario 13/11/2026, #211). FloorPlanPlanPreview.provenance ordena lo que el
   adaptador FT3D-8 ya comprueba (FloorPlanConstructionProject.evaluate): fuentes y revisiones, vínculos tarea→elemento,
   presupuesto y su reparto, y lo que NO está disponible. Fixtures SINTÉTICAS de laboratorio (labs/ft3d-8). */
const test=require('node:test'),assert=require('node:assert/strict');
const FX=require('../labs/ft3d-8/fidelity-fixtures.js'),A=require('../js/construction-project-adapter.js'),P=require('../js/construction-plan-preview-core.js');
const clone=x=>JSON.parse(JSON.stringify(x));
// Fecha con siguiente tarea planificada en el caso A (carpinterías, 8 huecos).
const DATE='2027-10-20';
async function view(input,date=DATE){
  const model=await A.evaluate(input),costReport=model.costs.status==='available'?model.costs.report:null;
  const snapshot=P.snapshot({schedule:input.schedule,date,costReport,costUnavailableReason:model.costs.reason});
  return {model,snapshot,prov:P.provenance({snapshot,model,schedule:input.schedule})};
}
const src=(p,k)=>p.sources.find(s=>s.kind===k);
const codes=p=>p.warnings.map(w=>w.code).sort();
// Añade un elemento a la siguiente tarea sin contradecir el contrato (los elementIds heredados se retiran).
function withNextElement(schedule,taskId,el){const s=clone(schedule),t=s.tasks.find(x=>x.id===taskId);t.elements=[...(t.elements||[]),el];delete t.elementIds;return s;}

test('A coherente: fuentes con su revisión, todos los vínculos comprobados, fantasma = vínculos ok, lo que falta se dice',async()=>{
  const c=await FX.build('A'),{model,snapshot,prov}=await view(c);
  assert.equal(src(prov,'project').fingerprint,model.fingerprints.project.slice(0,12));
  const plan=src(prov,'plan');assert.deepEqual([plan.status,plan.matchesProject,plan.review],['present',true,'reviewed']);
  assert.ok(plan.declaredSources.every(s=>/FIXTURE de prueba/.test(s)),'el origen declarado de las tareas dice que es una fixture');
  const b=src(prov,'budget');assert.equal(b.status,'present');assert.equal(b.revisionCheck,'unverifiable');assert.ok(b.priceSources.length>0);
  assert.equal(src(prov,'binding').status,'present');assert.equal(src(prov,'delivery').status,model.delivery.level);
  // Siguiente tarea: cada elemento con el estado del adaptador; el fantasma son exactamente los «ok».
  const next=snapshot.next.tasks.flatMap(t=>t.previewElementIds);assert.ok(next.length>0);
  assert.deepEqual(prov.next.map(x=>x.elementId).sort(),[...next].sort());
  assert.ok(prov.next.every(x=>x.status==='ok'&&x.ghost));assert.deepEqual([...prov.ghostKeys].sort(),[...new Set(next)].sort());
  for(const k of prov.ghostKeys)assert.ok(model.inventory.elements.some(e=>e.key===k&&e.representable),k+' existe y tiene representación');
  // Tareas sin elementos y sin partidas: se nombran (WBS y título), no se dibujan ni se pagan.
  assert.deepEqual(prov.tasksWithoutElements.map(t=>t.taskId),model.coverage.tasks.withoutElements);
  assert.ok(prov.tasksWithoutElements.every(t=>t.wbs&&t.title));assert.deepEqual(prov.tasksWithoutBudget.map(t=>t.taskId),model.coverage.tasks.withoutBudget);
  assert.deepEqual(codes(prov),['budget-revision-unverifiable']);
  assert.match(prov.statements.progress,/no obra ejecutada ni certificada/);assert.match(prov.statements.cost,/supuesto.*no es gasto real/);
  assert.equal(snapshot.executed.status,'not-recorded');
});

test('adversarial: plan sobre otra revisión del proyecto y con un vínculo a un elemento inexistente → sin fantasma inventado y avisado',async()=>{
  const c=await FX.build('A'),base=await view(c),taskId=base.snapshot.next.tasks[0].id;
  const bad=withNextElement(c.schedule,taskId,{elementId:'project/wal_no-existe',role:'structure'});bad.projectRef.revision='0'.repeat(64);
  const {model,prov}=await view({...c,schedule:bad});
  const broken=prov.next.find(x=>x.elementId==='project/wal_no-existe');
  assert.deepEqual([broken.status,broken.ghost],['broken',false]);assert.match(broken.label,/no existe en el proyecto: no se dibuja/);
  assert.ok(!prov.ghostKeys.includes('project/wal_no-existe'));
  assert.deepEqual(codes(prov),['broken-links','budget-revision-unverifiable','plan-other-revision']);
  assert.deepEqual(prov.brokenLinks,[{taskId,elementId:'project/wal_no-existe'}]);
  assert.equal(src(prov,'plan').status,'other-revision');
  assert.equal(model.delivery.level,'internal','con vínculos rotos la presentación baja a vista interna');
});

test('elemento sin representación 3D y recurso ilustrativo: se listan con su motivo y no van al fantasma',async()=>{
  // Caso D: su proyecto tiene una cubierta sin representación ('project/roof'). Se le da un plan mínimo válido (el de A,
  // reapuntado a D) con una tarea que cita la cubierta, un muro real de D y un recurso ilustrativo.
  const d=await FX.build('D'),a=await FX.build('A'),fpD=await A.fingerprint(d.source),inv=A.inventory(d.source);
  const wall=inv.elements.find(e=>e.type==='wall'&&e.representable).key;
  const s=clone(a.schedule);s.projectRef={type:'project',id:d.source.id,revision:fpD};
  for(const t of s.tasks){t.elements=[];delete t.elementIds;t.budgetAllocations=[];delete t.budgetItemIds;}
  const t=s.tasks.find(x=>x.id==='carpinteria');t.elements=[{elementId:'project/roof',role:'envelope'},{elementId:wall,role:'structure'},{elementId:'illustrative/crane',role:'temporary'}];
  const {prov}=await view({source:d.source,schedule:s,budget:null,budgets:null,binding:null});
  const st=Object.fromEntries(prov.next.map(x=>[x.elementId,[x.status,x.ghost]]));
  assert.deepEqual(st,{'project/roof':['not-representable',false],[wall]:['ok',true],'illustrative/crane':['illustrative',false]});
  assert.deepEqual(prov.ghostKeys,[wall]);
  assert.equal(src(prov,'budget').status,'unavailable');assert.match(src(prov,'budget').detail,/No se muestra ningún importe/);
  assert.equal(src(prov,'binding').status,'absent');
});

test('sin plan, plan de otro proyecto y presupuesto de otro proyecto: no se calcula nada y se dice por qué',async()=>{
  const d=await FX.build('D'),none=await view(d);
  assert.equal(src(none.prov,'plan').status,'unavailable');assert.ok(codes(none.prov).includes('plan-unavailable'));
  assert.deepEqual([none.prov.next,none.prov.ghostKeys],[[],[]]);
  const a=await FX.build('A'),other=clone(a.schedule);other.projectRef.id='prj_otro';
  const o=await view({...a,schedule:other});assert.equal(src(o.prov,'plan').status,'rejected');assert.ok(codes(o.prov).includes('plan-rejected'));
  assert.deepEqual(o.prov.ghostKeys,[]);
  const bud=clone(a.budget);bud.subject.id='prj_otro';const b=await view({...a,budget:bud});
  assert.equal(src(b.prov,'budget').status,'unavailable');assert.equal(src(b.prov,'budget').reason,'budget-other-project');
  assert.equal(b.snapshot.cost.status,'unavailable');assert.equal(b.snapshot.cost.amount,null,'nunca 0');
});

test('reparto incompleto del presupuesto: se avisa y su importe no entra en el coste planificado',async()=>{
  // Se quitan las partidas de suelo del plan respetando la forma de cada tarea (budgetItemIds heredado o budgetAllocations).
  const a=await FX.build('A'),s=clone(a.schedule);
  for(const t of s.tasks){if(t.budgetItemIds){t.budgetItemIds=t.budgetItemIds.filter(x=>!/^floor:/.test(x));delete t.budgetAllocations;}
    else if(t.budgetAllocations)t.budgetAllocations=t.budgetAllocations.filter(x=>!/^floor:/.test(x.itemId));}
  const {model,prov,snapshot}=await view({...a,schedule:s});assert.equal(model.planning.status,'available','el plan modificado sigue siendo válido');
  assert.ok(codes(prov).includes('budget-allocation-incomplete'));assert.ok(src(prov,'budget').unassignedItems>0);
  assert.ok(src(prov,'budget').allocatedPercentOfKnown<100);
  // El total planificado del coste no incluye lo no asignado: es menor que el importe conocido del presupuesto.
  assert.ok(snapshot.cost.plannedTotalKnown<model.coverage.budget.budgetKnownNet);
});

test('provenance no muta el modelo, la instantánea ni el plan; sin modelo, lo dice',async()=>{
  const c=await FX.build('A'),{model,snapshot}=await view(c),snap=JSON.stringify([model,snapshot,c.schedule]);
  P.provenance({snapshot,model,schedule:c.schedule});assert.equal(JSON.stringify([model,snapshot,c.schedule]),snap);
  assert.deepEqual(codes(P.provenance({snapshot})),['no-model']);
});

test('cierre del adversarial: plan de OTRA revisión que cita elementos que SÍ existen → ningún fantasma hasta reconciliar',async()=>{
  const c=await FX.build('A'),base=await view(c);
  assert.ok(base.prov.ghostKeys.length>0,'control: con la misma revisión, los vínculos comprobados sí van al fantasma');
  const s=clone(c.schedule);s.projectRef.revision='f'.repeat(64);
  const {model,prov}=await view({...c,schedule:s});
  // Los elementos existen y su vínculo es correcto («ok»)...
  assert.ok(prov.next.length>0&&prov.next.every(x=>x.status==='ok'));
  assert.ok(prov.next.every(x=>model.inventory.elements.some(e=>e.key===x.elementId&&e.representable)),'todos existen y tienen representación');
  // ...pero el plan no es de esta revisión: ninguno se dibuja, y cada uno dice por qué.
  assert.ok(prov.next.every(x=>x.ghost===false&&x.withheld==='plan-other-revision'));
  assert.deepEqual(prov.ghostKeys,[]);
  assert.ok(prov.next.every(x=>/existe en el proyecto, pero el plan es de otra revisión: no se dibuja hasta reconciliar las fuentes/.test(x.label)));
  assert.ok(codes(prov).includes('plan-other-revision'));
  assert.match(prov.warnings.find(w=>w.code==='plan-other-revision').message,/No se dibuja ningún fantasma de este plan hasta reconciliar las fuentes/);
  assert.equal(src(prov,'plan').status,'other-revision');
  // Nada se inventa: ni avance ejecutado ni importes nuevos (el coste planificado sigue siendo el del reparto del presupuesto).
  assert.equal(base.snapshot.executed.status,'not-recorded');
  assert.equal(src(prov,'delivery').status,model.delivery.level,'el nivel es el que calcula el adaptador, no se rebaja ni se eleva aquí');
});
