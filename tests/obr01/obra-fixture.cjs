'use strict';
/* OBR-01 · obra sintética reproducible (SOLO DATOS INVENTADOS). Reutiliza la obra del examen FT3D-8 M2/S4
   (tests/qa-m2/obra-sintetica.cjs: vivienda de referencia en obra nueva + 10 tareas + hito) y la deja en el formato
   real del navegador: biblioteca RUBIK + registro de obra (FloorPlanConstructionRecord) con el plan guardado.
   Los selectores {structure|tipo, n} se resuelven sobre el inventario real (FloorPlanConstructionProject.inventory),
   en su orden, igual que el examen elegía «los N primeros» del tipo pedido. No toca código de producto. */
const path=require('node:path');
const Q=require('../qa-m2/obra-sintetica.cjs');
const A=require('../../js/construction-project-adapter.js'),R=require('../../js/construction-record-core.js'),S=require('../../js/construction-schedule-core.js');
const LIB='rubik-sota-project-library-v1';

function selectElements(inv,sel){
  if(!sel)return [];
  const list=inv.elements.filter(e=>e.representable&&(sel.structure?e.type==='wall'&&e.structure===sel.structure:e.type===sel.tipo));
  return list.slice(0,sel.n).map(e=>({elementId:e.key,role:sel.rol}));
}
/* project: un FloorPlanProjectV1 ya validado. tasks: por defecto las del examen. Devuelve {storage, entry, subject, schedule}. */
async function build({project=Q.viviendaPrincipal(),tasks=[...Q.TAREAS,Q.HITO],entryId='ent_obr01-a',at='2026-11-12T10:00:00Z'}={}){
  const inv=A.inventory(project),revision=await A.fingerprint(project);
  const entry={id:entryId,name:project.name,project};
  const subject=R.subjectOf(entry);
  const schedule=S.validate({schema:'rubik-sota.construction-schedule',schemaVersion:'0.2.0',id:'sch_obr01',
    projectRef:{type:'project',id:project.id,revision},review:{status:'draft'},source:'Obra sintética OBR-01 (examen FT3D-8)',
    tasks:tasks.map(t=>({id:t.id,title:t.titulo,wbs:t.wbs,startDate:t.inicio,endDate:t.fin,
      dependsOn:t.deps.map(([taskId,type,lagDays])=>({taskId,type,lagDays})),
      elements:selectElements(inv,t.elementos),budgetAllocations:[],source:'Obra sintética OBR-01 (examen FT3D-8)'}))});
  const store=R.putSchedule(R.empty(),entry.id,subject,schedule,{at});
  const storage={[LIB]:JSON.stringify({version:1,activeId:entry.id,entries:[entry]}),[R.KEY]:JSON.stringify(store)};
  return {storage,entry,subject,schedule,inventory:inv,url:`evolucion/index.html?source=library&entry=${encodeURIComponent(entry.id)}&subject=${encodeURIComponent(subject.type+':'+subject.id)}`};
}
// Elementos de una tarea tal como los guarda el plan (los de papel «build» quedan como elementIds heredados).
const elementsOf=(schedule,taskId)=>{const t=schedule.tasks.find(x=>x.id===taskId);return t?[...(t.elements||[]).map(e=>e.elementId),...(t.elementIds||[])]:[];};
module.exports={build,selectElements,elementsOf,Q};
