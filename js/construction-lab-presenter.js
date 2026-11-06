/* FT3D-8 lab presenter: pure text/structure for the Visual Lab (and later Entregas). No DOM, no Three.js.
   Turns core outputs (stateAt, budgetReport, ganttRows) into labels that never overclaim:
   - planned progress is "plan", never "terminado" or "ejecutado";
   - a known amount is "presupuestado", never "gastado" or "pagado";
   - reviewed budget lines are NOT a verified project<->budget revision match when that cannot be checked;
   - only finish-to-start links become arrows; SS/FF/SF are badges. */
(function(root,factory){
  const S=typeof module==='object'&&module.exports?require('./construction-schedule-core.js'):root.FloorPlanConstructionSchedule;
  const api=factory(S);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FloorPlanConstructionLabPresenter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Schedule){
  'use strict';
  if(!Schedule)throw new TypeError('FloorPlanConstructionLabPresenter requires FloorPlanConstructionSchedule');
  const DAY=86400000;
  const DAYS=['dom','lun','mar','mie','jue','vie','sab'];
  const MONTHS=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const ms=d=>{if(typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d))throw new TypeError('date must be YYYY-MM-DD');return Date.parse(d+'T00:00:00Z');};
  const iso=x=>new Date(x).toISOString().slice(0,10);
  const pad=n=>String(n).padStart(2,'0');
  const dateLabel=d=>{const x=new Date(ms(d));return DAYS[x.getUTCDay()]+' '+x.getUTCDate()+' '+MONTHS[x.getUTCMonth()]+' '+x.getUTCFullYear();};
  // Deterministic Spanish euro format (no locale dependency): 82.654,80 €
  const euro=n=>{
    if(n===null||n===undefined)return '—';
    const neg=n<0,c=Math.round(Math.abs(n)*100),int=String(Math.floor(c/100)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
    return (neg?'-':'')+int+','+pad(c%100)+' €';
  };
  // Weeks counted from the plan's first day (not ISO weeks): week 1 = startDate..startDate+6.
  const weeks=schedule=>{
    const b=Schedule.bounds(schedule);
    if(b.startDate===null)return [];
    const start=ms(b.startDate),end=ms(b.endDate),n=Math.floor((end-start)/DAY/7)+1;
    return Array.from({length:n},(_,i)=>({n:i+1,startDate:iso(start+i*7*DAY),endDate:iso(Math.min(end,start+(i*7+6)*DAY))}));
  };
  const weekOf=(schedule,date)=>{
    const w=weeks(schedule),t=ms(date);
    if(!w.length)return {n:0,total:0,label:'SIN PLAN'};
    if(t<ms(w[0].startDate))return {n:0,total:w.length,label:'SEM 00 / '+pad(w.length)+' · ANTES DE OBRA'};
    if(t>ms(w.at(-1).endDate))return {n:w.length,total:w.length,label:'FIN DEL PLAN · '+pad(w.length)+' SEMANAS'};
    const n=Math.floor((t-ms(w[0].startDate))/DAY/7)+1;
    return {n,total:w.length,label:'SEM '+pad(n)+' / '+pad(w.length)};
  };
  const ISSUE_TEXT=Object.freeze({
    'price-missing':'partida sin precio','price-unreviewed':'precio sin revisar','quantity-unavailable':'cantidad no disponible',
    'quantity-incomplete':'medicion incompleta','allocation-pending':'reparto pendiente','project-revision-mismatch':'revision de proyecto distinta',
    'quantity-estimated':'cantidad estimada','price-source-undated':'precio sin fecha'});
  const REVISION_TEXT=Object.freeze({
    unverifiable:'Revision proyecto ↔ presupuesto: no verificable (el presupuesto no declara revision)',
    match:'Revision proyecto ↔ presupuesto: coincide',
    mismatch:'Revision proyecto ↔ presupuesto: NO coincide'});
  /* Cost status of one task:
     sin-partidas | desconocido (nothing priced) | parcial (some unknown) | no-verificado (known, blocked) | revisado */
  const costView=(taskCost,report)=>{
    if(!taskCost||!report)throw new TypeError('costView requires a task cost and its budget report');
    const issues=[...new Set(taskCost.lines.flatMap(l=>l.issues))];
    const blocking=issues.filter(i=>report.blockingIssues.includes(i));
    const notes=[];
    if(report.dataStatus!=='reviewed')notes.push('Plan en borrador: costes no verificables');
    for(const i of issues)notes.push(ISSUE_TEXT[i]||i);
    let status,label;
    if(!taskCost.lines.length){status='sin-partidas';label='Sin partidas asignadas';}
    else if(taskCost.knownNet===null){status='desconocido';label='Importe desconocido';}
    else if(taskCost.totalNet===null){status='parcial';label='Importe parcial: hay partidas sin precio';}
    else if(!taskCost.verified){status='no-verificado';label='Importe conocido, no verificado';}
    else {status='revisado';label='Presupuestado con partidas revisadas';}
    return {status,label,known:taskCost.knownNet,knownText:euro(taskCost.knownNet),
      total:taskCost.totalNet,totalText:taskCost.totalNet===null?'desconocido':euro(taskCost.totalNet),
      blocking,notes,revisionCheck:report.projectRevision.check,revisionText:REVISION_TEXT[report.projectRevision.check],
      // An explicit flag so no UI can confuse reviewed lines with a revision match.
      revisionMatchVerified:report.projectRevision.check==='match',
      evidence:'Coste presupuestado · no es gasto ejecutado ni certificado'};
  };
  const summary=report=>({
    knownText:euro(report.scheduleTotals.allocatedKnownNet),known:report.scheduleTotals.allocatedKnownNet,
    complete:report.scheduleTotals.complete,
    unknownItemIds:[...report.budgetTotals.missingItemIds],
    unverifiedTaskIds:report.byTask.filter(t=>t.lines.length&&!t.verified).map(t=>t.taskId),
    revisionText:REVISION_TEXT[report.projectRevision.check],revisionMatchVerified:report.projectRevision.check==='match'});
  const TYPE_TEXT=Object.freeze({FS:'fin→inicio',SS:'inicio→inicio',FF:'fin→fin',SF:'inicio→fin'});
  const ganttLinks=schedule=>{
    const rows=Schedule.ganttRows(schedule),wbs=new Map(rows.map(r=>[r.id,r.wbs]));
    const arrows=[],badges=[];
    for(const r of rows)for(const d of r.dependencyDetails){
      const lag=(d.lagDays>=0?'+':'')+d.lagDays+'d';
      if(d.type==='FS')arrows.push({from:d.taskId,to:r.id,lagDays:d.lagDays,text:d.lagDays?'FS'+lag:''});
      else badges.push({from:d.taskId,to:r.id,type:d.type,lagDays:d.lagDays,
        text:d.type+lag+' ← '+wbs.get(d.taskId),title:TYPE_TEXT[d.type]+' con '+wbs.get(d.taskId)+' ('+lag+')'});
    }
    return {arrows,badges};
  };
  // Card for the cursor date: active tasks, or the next/last ones when nothing runs.
  const taskCard=(schedule,report,date)=>{
    const st=Schedule.stateAt(schedule,date),costs=new Map(report.byTask.map(t=>[t.taskId,t]));
    const view=t=>({id:t.id,wbs:t.wbs,title:t.title,startDate:t.startDate,endDate:t.endDate,
      plannedPercent:Math.round(t.visualProgress*100),phaseText:t.plannedPhase==='completed'?'completada segun plan':t.plannedPhase==='in-progress'?'en curso segun plan':'pendiente segun plan',
      cost:costView(costs.get(t.id),report)});
    const active=st.tasks.filter(t=>t.plannedPhase==='in-progress');
    const next=st.tasks.filter(t=>t.plannedPhase==='not-started').sort((a,b)=>a.startDate.localeCompare(b.startDate))[0]||null;
    const allDone=st.tasks.length>0&&st.tasks.every(t=>t.plannedPhase==='completed');
    return {date,dateText:dateLabel(date),week:weekOf(schedule,date),evidence:st.evidence,
      // The plan DECLARES its approval; nobody authenticated it (approval-not-authenticated): never say «aprobado» alone.
      evidenceText:st.evidence==='plan-approved'?'Plan declarado como aprobado · animación ilustrativa':'Plan estimado (borrador) · animación ilustrativa',
      active:active.map(view),next:next?view(next):null,
      headline:allDone?'Plan completado: todas las tareas planificadas terminadas':active.length?active.map(t=>t.title).join(' · '):next?'Antes de: '+next.title:'—',
      stage:allDone?'final':active.length||st.tasks.some(t=>t.plannedPhase==='completed')?'en-obra':'inicio'};
  };
  return Object.freeze({dateLabel,euro,weeks,weekOf,costView,summary,ganttLinks,taskCard,ISSUE_TEXT,REVISION_TEXT});
});
