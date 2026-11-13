'use strict';
/* OBR-02/03 · genera review-obr02/obra.js: datos SINTÉTICOS de la Preview de revisión de la integración (la obra del
   examen FT3D-8, la misma de las pruebas). Dos casos:
   - «con presupuesto»: un presupuesto C1–C4 generado por el borrador real (FloorPlanBudgetDraft) con PRECIOS FICTICIOS
     de prueba, cuyas partidas se asignan a tareas del plan (enlace verificable → coste planificado a la fecha);
   - «sin presupuesto»: el mismo plan sin presupuesto (→ «No disponible», nunca 0);
   - «adversarial»: el mismo presupuesto con un plan NO CONCORDANTE: hecho sobre otra revisión del proyecto y con un
     vínculo de la tarea 10 a un elemento que no existe (→ avisos, sin fantasma inventado, presentación «interna»).
   Uso: node tests/obr02/build-review-fixture.cjs */
const fs=require('node:fs'),path=require('node:path');
const FX=require('../obr01/obra-fixture.cjs');
const R=require('../../js/construction-record-core.js'),S=require('../../js/construction-schedule-core.js'),Draft=require('../../js/budget-draft-core.js'),B=require('../../js/budget-core.js');
const LABELS={title:'Presupuesto de prueba',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura de paredes',newWalls:'Tabiquería nueva',demolition:'Demolición',door:'Puerta',slidingDoor:'Puerta corredera',window:'Ventana',tariff:'Precio de prueba ficticio (revisión)',
  chapters:{floors:'Pavimentos y rodapiés',walls:'Acabados de paredes',partitions:'Tabiquería',carpentry:'Carpintería'}};
// Precio ficticio por clave de tarifa (cualquier pavimento 35 €/m²); solo para ejercitar el cálculo.
const price=k=>k.startsWith('floor:')?35:({skirting:9,paint:7,'partition-new':38,demolition:18,'opening:door':260,'opening:sliding-door':480,'opening:window':390})[k]??50;
// Qué tarea del plan del examen ejecuta cada capítulo (asignación del 100 %).
const TASK_OF={floors:'T09',walls:'T10',partitions:'T04',carpentry:'T07'};
(async()=>{
  const base=await FX.build({entryId:'ent_obr02-review'});
  const project=JSON.parse(base.storage['rubik-sota-project-library-v1']).entries[0].project;
  const lines=Draft.lines(project,{labels:LABELS}),tariff=Object.fromEntries(lines.map(l=>[l.tariffKey,{unitPrice:price(l.tariffKey),asOf:'2026-11-12'}]));
  const budget=Draft.draft(project,{tariff,labels:LABELS,now:'2026-11-12T10:00:00Z'}).budget;
  const schedule=JSON.parse(JSON.stringify(base.schedule));
  for(const item of budget.items){const t=schedule.tasks.find(x=>x.id===TASK_OF[item.chapterId]);if(t)(t.budgetAllocations||(t.budgetAllocations=[])).push({itemId:item.id,sharePercent:100});}
  for(const t of schedule.tasks){if(t.budgetAllocations){delete t.budgetItemIds;}}
  const validated=S.validate(schedule);B.validateBudget(budget);
  const store=R.putSchedule(R.empty(),base.entry.id,base.subject,validated,{at:'2026-11-12T10:00:00Z'});
  const conPresupuesto={...base.storage,[R.KEY]:JSON.stringify(store),'rubik-budget-v1':JSON.stringify({[project.id]:budget})};
  const sinPresupuesto={...base.storage,'rubik-budget-v1':JSON.stringify({})};
  // Adversarial: plan válido según el contrato, pero no concordante con el proyecto (otra revisión + vínculo roto).
  const bad=JSON.parse(JSON.stringify(validated));bad.id=bad.id+'-no-concordante';bad.projectRef.revision='0'.repeat(64);
  const t10=bad.tasks.find(t=>t.id==='T10');t10.elements=[...t10.elements,{elementId:'project/wal_no-existe',role:'finish'}];
  const storeBad=R.putSchedule(R.empty(),base.entry.id,base.subject,S.validate(bad),{at:'2026-11-12T10:00:00Z'});
  const adversarial={...base.storage,[R.KEY]:JSON.stringify(storeBad),'rubik-budget-v1':JSON.stringify({[project.id]:budget})};
  const cases={
    con:{title:'Vivienda del examen con presupuesto de prueba (precios ficticios) enlazado al plan',storage:conPresupuesto,url:base.url},
    sin:{title:'La misma vivienda sin presupuesto',storage:sinPresupuesto,url:base.url},
    adversarial:{title:'La misma vivienda con un plan NO concordante (otra revisión y un vínculo roto)',storage:adversarial,url:base.url},
  };
  const out=path.join(__dirname,'..','..','review-obr02','obra.js');
  fs.writeFileSync(out,'/* GENERADO por tests/obr02/build-review-fixture.cjs — datos SINTÉTICOS y precios FICTICIOS de prueba, no de clientes. */\nwindow.OBR02_REVIEW='+JSON.stringify({generated:'2026-11-13',cases})+';\n');
  console.log(out,fs.statSync(out).size,'bytes',budget.items.length,'partidas');
})().catch(e=>{console.error(e);process.exit(1);});
