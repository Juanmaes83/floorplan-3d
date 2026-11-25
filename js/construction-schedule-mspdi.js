/* M13 · Exportación del plan de obra a MSPDI (Microsoft Project XML), legible por Microsoft Project y GanttProject.
   Función PURA sobre la autoridad de planificación existente (FloorPlanConstructionSchedule): valida el plan con su
   `canonical()` y NO lo modifica, no recalcula fechas (no es un motor CPM) y no crea otro modelo de planificación.

   Equivalencias declaradas (también se devuelven en el informe):
   - Calendario: RUBIK planifica en días naturales (calendar-days, UTC). Se exporta un calendario base propio con los
     7 días laborables, 8 h/día (08:00–12:00, 13:00–17:00), para que 1 día RUBIK = 1 día del destino, fines de semana
     incluidos. Una tarea [inicio, fin] (días completos, ambos incluidos) → Start = inicio 08:00, Finish = fin 17:00.
   - Fechas ANCLADAS: cada tarea lleva la restricción «No comenzar antes de» (SNET) en su inicio. Sin ella, la
     aplicación de destino adelantaría las tareas con holgura y cambiaría fechas que pertenecen al profesional.
   - Hito: el mismo criterio que RUBIK (`construction-context`): un solo día y sin elementos vinculados → hito de
     duración 0 en el inicio del día. Un día con elementos o partidas es una tarea de 1 día.
   - Dependencias FS/SS/FF/SF con desfase en días → PredecessorLink con LinkLag en décimas de minuto (8 h = 1 día).
     La semántica coincide: RUBIK exige succ.X ≥ pred.Y + desfase sobre días completos.
   - Identidad: el id de RUBIK y su WBS viajan en campos de texto personalizados (Texto1, Texto2) y en las notas.
   - Evidencia: plan previsto o aprobado, NUNCA ejecución. Porcentaje completado 0, sin fechas reales ni costes.
   - No viajan (sin equivalente fiel en MSPDI): vínculos a elementos 3D, repartos de partidas, firma de revisión como
     dato estructurado y procedencia. Se listan en el informe y en las notas, no se inventan campos. */
(function(root, factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FloorPlanScheduleMSPDI=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const FORMAT='mspdi';
  const VERSION='1.0.0';
  const DAY_MS=86400000,HOURS_PER_DAY=8,MINUTES_PER_DAY=HOURS_PER_DAY*60;
  const LINK_TYPE=Object.freeze({FF:0,FS:1,SF:2,SS:3});
  const FIELD=Object.freeze({rubikId:{id:188743731,name:'Text1',alias:'RUBIK id'},wbs:{id:188743734,name:'Text2',alias:'RUBIK WBS'},evidence:{id:188743737,name:'Text3',alias:'RUBIK evidencia'}});
  const CONSTRAINT_SNET=4;
  // Orden de los elementos según mspdi_pj12.xsd (Microsoft Office Project 2007 XML Data Interchange Schema).
  const O=Object.freeze({
    project:['SaveVersion','UID','Name','Title','Subject','Category','Company','Manager','Author','CreationDate','Revision','LastSaved','ScheduleFromStart','StartDate','FinishDate','FYStartDate','CriticalSlackLimit','CurrencyDigits','CurrencySymbol','CurrencyCode','CurrencySymbolPosition','CalendarUID','DefaultStartTime','DefaultFinishTime','MinutesPerDay','MinutesPerWeek','DaysPerMonth','DefaultTaskType','DefaultFixedCostAccrual','DefaultStandardRate','DefaultOvertimeRate','DurationFormat','WorkFormat','EditableActualCosts','HonorConstraints','EarnedValueMethod','InsertedProjectsLikeSummary','MultipleCriticalPaths','NewTasksEffortDriven','NewTasksEstimated','SplitsInProgressTasks','SpreadActualCost','SpreadPercentComplete','TaskUpdatesResource','FiscalYearStart','WeekStartDay','MoveCompletedEndsBack','MoveRemainingStartsBack','MoveRemainingStartsForward','MoveCompletedEndsForward','BaselineForEarnedValue','AutoAddNewResourcesAndTasks','StatusDate','CurrentDate','MicrosoftProjectServerURL','Autolink','NewTaskStartDate','DefaultTaskEVMethod','ProjectExternallyEdited','ExtendedCreationDate','ActualsInSync','RemoveFileProperties','AdminProject','OutlineCodes','WBSMasks','ExtendedAttributes','Calendars','Tasks','Resources','Assignments'],
    task:['UID','ID','Name','Type','IsNull','CreateDate','Contact','WBS','WBSLevel','OutlineNumber','OutlineLevel','Priority','Start','Finish','Duration','DurationFormat','Work','Stop','Resume','ResumeValid','EffortDriven','Recurring','OverAllocated','Estimated','Milestone','Summary','Critical','IsSubproject','IsSubprojectReadOnly','SubprojectName','ExternalTask','ExternalTaskProject','EarlyStart','EarlyFinish','LateStart','LateFinish','StartVariance','FinishVariance','WorkVariance','FreeSlack','TotalSlack','FixedCost','FixedCostAccrual','PercentComplete','PercentWorkComplete','Cost','OvertimeCost','OvertimeWork','ActualStart','ActualFinish','ActualDuration','ActualCost','ActualOvertimeCost','ActualWork','ActualOvertimeWork','RegularWork','RemainingDuration','RemainingCost','RemainingWork','RemainingOvertimeCost','RemainingOvertimeWork','ACWP','CV','ConstraintType','CalendarUID','ConstraintDate','Deadline','LevelAssignments','LevelingCanSplit','LevelingDelay','LevelingDelayFormat','PreLeveledStart','PreLeveledFinish','Hyperlink','HyperlinkAddress','HyperlinkSubAddress','IgnoreResourceCalendar','Notes','HideBar','Rollup','BCWS','BCWP','PhysicalPercentComplete','EarnedValueMethod','PredecessorLink','ActualWorkProtected','ActualOvertimeWorkProtected','ExtendedAttribute'],
    calendar:['UID','Name','IsBaseCalendar','BaseCalendarUID','WeekDays','Exceptions','WorkWeeks'],
    weekDay:['DayType','DayWorking','TimePeriod','WorkingTimes'],
    link:['PredecessorUID','Type','CrossProject','CrossProjectName','LinkLag','LagFormat'],
    taskExt:['FieldID','Value','ValueGUID','DurationFormat'],
    projectExt:['FieldID','FieldName','CFType','Guid','ElemType','MaxMultiValues','UserDef','Alias'],
  });
  const core=()=>{
    const S=(typeof module==='object'&&module.exports)?require('./construction-schedule-core.js'):root.FloorPlanConstructionSchedule;
    if(!S||typeof S.canonical!=='function')throw new Error('FloorPlanScheduleMSPDI: FloorPlanConstructionSchedule is required');
    return S;
  };
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'})[c]).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
  const tag=(name,value)=>`<${name}>${esc(value)}</${name}>`;
  const days=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/DAY_MS);
  const dur=hours=>`PT${hours}H0M0S`;
  const isMilestone=t=>t.startDate===t.endDate&&!(t.elements||[]).length&&!(t.budgetAllocations||[]).length;

  /** Exporta el plan. `options.projectName` (texto visible), `options.createdAt` (ISO, opcional: sin él la salida es
   *  determinista). Devuelve {xml, report}. Lanza el error de validación del plan si no es válido (no lo «arregla»). */
  function toMSPDI(schedule,options={}){
    const S=core(),plan=S.canonical(schedule); // valida y normaliza en una copia; el original no se toca
    const evidence=plan.review.status==='reviewed'?'plan-approved':'plan-estimated';
    const evidenceText=evidence==='plan-approved'?`Plan aprobado por ${plan.review.by} el ${plan.review.at.slice(0,10)} (previsión revisada, no ejecución ni certificación)`:'Plan previsto en borrador (no revisado, no ejecución ni certificación)';
    const tasks=plan.tasks.slice().sort((a,b)=>a.startDate<b.startDate?-1:a.startDate>b.startDate?1:0);
    const uid=new Map(tasks.map((t,i)=>[t.id,i+1]));
    const start=tasks.length?tasks.reduce((m,t)=>t.startDate<m?t.startDate:m,tasks[0].startDate):null;
    const finish=tasks.length?tasks.reduce((m,t)=>t.endDate>m?t.endDate:m,tasks[0].endDate):null;
    const name=(options.projectName&&String(options.projectName).trim())||`Plan de obra ${plan.projectRef.type} ${plan.projectRef.id}`;
    const report={format:FORMAT,version:VERSION,evidence,tasks:0,milestones:0,links:0,anchoredDates:tasks.length,
      calendar:'RUBIK · días naturales: 7 días laborables de 8 h (08:00–12:00, 13:00–17:00)',
      notCarried:[],warnings:[]};
    const linkedEl=tasks.filter(t=>t.elements.length).length,linkedIt=tasks.filter(t=>t.budgetAllocations.length).length;
    if(linkedEl)report.notCarried.push(`Vínculos con elementos del proyecto 3D (${linkedEl} tareas): MSPDI no tiene un equivalente; se citan en las notas de cada tarea.`);
    if(linkedIt)report.notCarried.push(`Repartos de partidas del presupuesto (${linkedIt} tareas): se citan en las notas; no se exportan importes ni costes.`);
    report.notCarried.push('Revisión del plan: se indica como texto en el proyecto y en Texto3; MSPDI no tiene un campo de firma profesional.');
    report.notCarried.push('Calendario en días naturales UTC: se representa con un calendario de 7 días laborables; las horas (08:00–17:00) son convencionales.');
    if(!tasks.length)report.warnings.push('El plan no tiene tareas: el archivo solo contiene el proyecto vacío.');
    const T=s=>`${s}T08:00:00`,F=s=>`${s}T17:00:00`;
    // MSPDI es una secuencia XSD: el orden de los elementos forma parte del formato (validado con mspdi_pj12.xsd).
    const raw=x=>({raw:x});
    const ordered=(order,fields)=>order.filter(k=>fields[k]!==undefined).map(k=>{const v=fields[k];return Array.isArray(v)?v.join(''):(v&&v.raw!==undefined?v.raw:tag(k,v));}).join('');
    const ext=(f,v)=>`<ExtendedAttribute>${ordered(O.taskExt,{FieldID:f.id,Value:v})}</ExtendedAttribute>`;
    const hours=`<WorkingTimes><WorkingTime>${tag('FromTime','08:00:00')}${tag('ToTime','12:00:00')}</WorkingTime><WorkingTime>${tag('FromTime','13:00:00')}${tag('ToTime','17:00:00')}</WorkingTime></WorkingTimes>`;
    const calendar=`<Calendars><Calendar>${ordered(O.calendar,{UID:1,Name:'RUBIK · días naturales (7 días)',IsBaseCalendar:1,BaseCalendarUID:-1,
      WeekDays:raw('<WeekDays>'+[1,2,3,4,5,6,7].map(d=>`<WeekDay>${ordered(O.weekDay,{DayType:d,DayWorking:1,WorkingTimes:raw(hours)})}</WeekDay>`).join('')+'</WeekDays>')})}</Calendar></Calendars>`;
    const taskXml=[];
    if(start){
      const span=days(start,finish)+1;
      taskXml.push(`<Task>${ordered(O.task,{UID:0,ID:0,Name:name,Type:1,IsNull:0,OutlineNumber:0,OutlineLevel:0,Start:T(start),Finish:F(finish),Duration:dur(span*HOURS_PER_DAY),DurationFormat:7,Milestone:0,Summary:1,PercentComplete:0,CalendarUID:-1})}</Task>`);
    }
    tasks.forEach((t,i)=>{
      const ms=isMilestone(t),span=days(t.startDate,t.endDate)+1;
      if(ms)report.milestones++;else report.tasks++;
      const notes=[`RUBIK ${t.id} · WBS ${t.wbs} · ${evidence==='plan-approved'?'plan aprobado':'plan previsto'} (no ejecución).`];
      if(t.elements.length)notes.push('Elementos del proyecto: '+t.elements.map(e=>`${e.elementId} (${e.role})`).join(', ')+'.');
      if(t.budgetAllocations.length)notes.push('Partidas: '+t.budgetAllocations.map(a=>`${a.itemId} ${a.sharePercent} %`).join(', ')+'.');
      notes.push('Origen: '+t.source+'.');
      const links=t.dependsOn.map(d=>{report.links++;return `<PredecessorLink>${ordered(O.link,{PredecessorUID:uid.get(d.taskId),Type:LINK_TYPE[d.type],CrossProject:0,LinkLag:d.lagDays*MINUTES_PER_DAY*10,LagFormat:7})}</PredecessorLink>`;});
      taskXml.push(`<Task>${ordered(O.task,{UID:uid.get(t.id),ID:i+1,Name:t.title,Type:1,IsNull:0,WBS:t.wbs,OutlineNumber:i+1,OutlineLevel:1,
        Start:T(t.startDate),Finish:ms?T(t.startDate):F(t.endDate),Duration:dur(ms?0:span*HOURS_PER_DAY),DurationFormat:7,Work:'PT0H0M0S',
        ResumeValid:0,EffortDriven:0,Recurring:0,OverAllocated:0,Estimated:0,Milestone:ms?1:0,Summary:0,Critical:0,FixedCost:0,
        PercentComplete:0,PercentWorkComplete:0,Cost:0,ConstraintType:CONSTRAINT_SNET,CalendarUID:-1,ConstraintDate:T(t.startDate),IgnoreResourceCalendar:0,
        Notes:notes.join('\n'),PredecessorLink:links,ExtendedAttribute:[ext(FIELD.rubikId,t.id),ext(FIELD.wbs,t.wbs),ext(FIELD.evidence,evidence)]})}</Task>`);
    });
    const project=ordered(O.project,{SaveVersion:12,Name:name+'.xml',Title:name,
      Subject:`${evidenceText}. RUBIK SOTA ${plan.schema} ${plan.schemaVersion} · ${plan.projectRef.type} ${plan.projectRef.id} · revisión ${plan.projectRef.revision}. Fechas ancladas («No comenzar antes de»).`,
      CreationDate:options.createdAt?String(options.createdAt).slice(0,19):undefined,ScheduleFromStart:1,StartDate:start?T(start):undefined,FinishDate:start?F(finish):undefined,
      FYStartDate:1,CriticalSlackLimit:0,CurrencyDigits:2,CurrencySymbol:'€',CurrencyCode:'EUR',CurrencySymbolPosition:3,CalendarUID:1,DefaultStartTime:'08:00:00',DefaultFinishTime:'17:00:00',MinutesPerDay:MINUTES_PER_DAY,MinutesPerWeek:MINUTES_PER_DAY*7,DaysPerMonth:30,
      DefaultTaskType:0,DefaultFixedCostAccrual:3,DefaultStandardRate:0,DefaultOvertimeRate:0,DurationFormat:7,WorkFormat:2,EditableActualCosts:0,HonorConstraints:1,
      InsertedProjectsLikeSummary:1,MultipleCriticalPaths:0,NewTasksEffortDriven:0,NewTasksEstimated:0,SplitsInProgressTasks:0,SpreadActualCost:0,SpreadPercentComplete:0,TaskUpdatesResource:1,
      FiscalYearStart:0,WeekStartDay:1,MoveCompletedEndsBack:0,MoveRemainingStartsBack:0,MoveRemainingStartsForward:0,MoveCompletedEndsForward:0,BaselineForEarnedValue:0,AutoAddNewResourcesAndTasks:1,
      MicrosoftProjectServerURL:1,Autolink:0,NewTaskStartDate:0,DefaultTaskEVMethod:0,ProjectExternallyEdited:0,ActualsInSync:0,RemoveFileProperties:0,AdminProject:0,
      ExtendedAttributes:raw('<ExtendedAttributes>'+Object.values(FIELD).map(f=>`<ExtendedAttribute>${ordered(O.projectExt,{FieldID:f.id,FieldName:f.name,Alias:f.alias})}</ExtendedAttribute>`).join('')+'</ExtendedAttributes>'),
      Calendars:raw(calendar),Tasks:raw('<Tasks>\n'+taskXml.join('\n')+'\n</Tasks>'),Resources:raw('<Resources/>'),Assignments:raw('<Assignments/>')});
    const out=['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>','<Project xmlns="http://schemas.microsoft.com/project">'+project+'</Project>',''];
    return {xml:out.join('\n'),report};
  }
  /** Texto breve y honesto para la persona: qué se exporta, cómo y qué no viaja. */
  function summary(report){
    const n=(k,one,many)=>`${k} ${k===1?one:many}`;
    return [`${n(report.tasks,'tarea','tareas')}, ${n(report.milestones,'hito','hitos')} y ${n(report.links,'dependencia','dependencias')}. ${report.evidence==='plan-approved'?'Plan aprobado':'Plan en borrador'}: se exporta como previsión, sin avance ni ejecución.`,
      'Fechas ancladas tal como están en RUBIK («No comenzar antes de») con un calendario de 7 días laborables.',
      ...report.notCarried.map(x=>'No viaja: '+x),...report.warnings].join('\n');
  }
  return Object.freeze({FORMAT,VERSION,LINK_TYPE,FIELD,toMSPDI,summary,isMilestone});
});
