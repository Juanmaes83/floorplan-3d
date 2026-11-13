/* OBR-02 + OBR-03 · Vista del PLAN en la Evolución 4D (FT3D-8). Núcleo puro: no crea un segundo plan, no guarda nada y
   no convierte el plan en avance real. Todo sale de dos autoridades existentes:
   - FloorPlanConstructionSchedule (contrato del plan, 0.2.0): validate/canonical para las tareas y stateAt para el avance
     PLANIFICADO de cada tarea en una fecha;
   - su budgetReport (reparto de las partidas C1–C4 por tarea, con lo desconocido como null).

   OBR-02 · Siguiente tarea planificada: la(s) que empiezan en la primera fecha posterior al día mostrado, con su WBS,
   fechas, dependencias declaradas (tipo y desfase) y los elementos del modelo que aparecerán (para el fantasma).
   OBR-03 · Anillo «% del plan» (planificado) y coste planificado a la fecha:
   - % = Σ(avance planificado × duración) / Σ duración, con el avance de stateAt; es PLAN, no obra ejecutada;
   - coste = Σ(importe asignado a cada tarea × su avance planificado): reparto lineal por duración (supuesto rotulado).
     Solo con un enlace C1–C4 verificable (presupuesto del mismo sujeto y asignaciones a partidas existentes). Sin eso,
     «No disponible», nunca cero. Si una tarea ya empezada tiene partidas sin importe, el coste es PARCIAL y se dice.
   - Ejecutado: siempre «sin registrar» (el contrato reserva executionRecords; RUBIK no registra avance real).

   Estados que el contrato no admite (tareas «canceladas», tareas sin fechas): el validador rechaza las tareas sin
   fechas; un campo de estado que no forma parte del contrato se descartaría en silencio y la tarea contaría como
   planificada. Aquí se detecta y NO se calcula nada (ni %, ni coste, ni siguiente tarea) para no contar trabajo cancelado. */
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const api=factory(node?require('./construction-schedule-core.js'):root.FloorPlanConstructionSchedule);
  if(node)module.exports=api;else root.FloorPlanPlanPreview=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(S){
  'use strict';
  if(!S||typeof S.stateAt!=='function')throw Error('FloorPlanPlanPreview requiere FloorPlanConstructionSchedule.');
  const SCHEMA='rubik-sota.plan-preview',VERSION='1.0.0',DAY=86400000;
  const ms=d=>Date.parse(d+'T00:00:00Z'),iso=x=>new Date(x).toISOString().slice(0,10);
  const r1=x=>Math.round(x*10)/10,cents=x=>Math.round(x*100);
  const STATUS_FIELDS=['status','state','cancelled','canceled','estado'];
  const APPEAR=['site','build','structure','envelope','services'];
  // Huella estable del plan tal y como llega (FNV-1a sobre el JSON canónico): cambia si cambia cualquier dato del plan.
  function planKey(canon){const t=JSON.stringify(canon);let h=0x811c9dc5;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return canon.id+':'+h.toString(16).padStart(8,'0');}
  const unavailable=(reason,message,extra={})=>({schema:SCHEMA,version:VERSION,state:'unavailable',reason,message,
    progress:null,cost:{status:'unavailable',reason,message,amount:null},next:null,executed:EXECUTED,...extra});
  // Motivos del adaptador existente (construction-project-adapter) en palabras: no se inventa ninguno.
  const COST_REASONS={missing:'no hay un presupuesto C1–C4 de este proyecto','budget-other-project':'el presupuesto es de otro proyecto','level-budget-not-building':'el presupuesto es de una planta, no del edificio',
    'building-budget-not-supported':'los presupuestos por edificio todavía no se reparten entre tareas','planning-unavailable':'no hay plan válido','report-failed':'el reparto del presupuesto entre tareas ha fallado',
    'schedule-invalid':'el plan no es válido','schedule-other-project':'el plan es de otro proyecto','no-budget-link':'no hay un presupuesto C1–C4 vinculado a este plan'};
  const EXECUTED=Object.freeze({status:'not-recorded',label:'Sin registrar: RUBIK no registra avance real de obra; todo lo de aquí es plan.'});

  /* Tareas con un estado ajeno al contrato (p. ej. cancelada) en el plan TAL Y COMO LLEGA. */
  function unsupportedStates(raw){
    const out=[];for(const t of Array.isArray(raw?.tasks)?raw.tasks:[])for(const f of STATUS_FIELDS)if(t&&Object.prototype.hasOwnProperty.call(t,f))out.push({taskId:t.id??null,field:f,value:t[f]});
    return out;
  }

  /* schedule: plan en bruto (como se cargó). date: día mostrado (YYYY-MM-DD). costReport: S.budgetReport(...) o null.
     costUnavailableReason: por qué no hay reparto (lo dice el adaptador existente), si costReport es null. */
  function snapshot({schedule,date,costReport=null,costUnavailableReason=null}){
    if(!schedule)return unavailable('no-plan','Sin plan de obra: no hay % del plan ni coste planificado.');
    const odd=unsupportedStates(schedule);
    if(odd.length)return unavailable('unsupported-task-state',`El plan marca ${odd.length} tarea(s) con un estado que el contrato no admite (${[...new Set(odd.map(o=>`${o.field}=${o.value}`))].join(', ')}): no se calcula nada para no contar trabajo cancelado como planificado. Corrige el plan quitando esas tareas o sus fechas.`,{unsupported:odd});
    let canon;try{canon=S.canonical(schedule);}catch(e){return unavailable('plan-rejected','El plan no es válido ('+String(e.message||e).replace(/^FloorPlanConstructionSchedule:\s*/,'')+'): no se calcula ni el % ni el coste.');}
    if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return unavailable('no-date','Sin fecha: no hay momento que medir.');
    if(!canon.tasks.length)return unavailable('empty-plan','El plan no tiene tareas.');
    const st=S.stateAt(canon,date),byId=new Map(canon.tasks.map(t=>[t.id,t])),frac=new Map(st.tasks.map(t=>[t.id,t.visualProgress]));
    const dur=t=>Math.round((ms(t.endDate)-ms(t.startDate))/DAY)+1;
    // OBR-03 · % del plan (planificado).
    let num=0,den=0,done=0,running=0,pending=0;
    for(const t of canon.tasks){const f=frac.get(t.id)||0,d=dur(t);num+=f*d;den+=d;if(f>=1)done++;else if(f>0)running++;else pending++;}
    const progress={percent:r1(100*num/den),basis:'Duración planificada de cada tarea (días de calendario)',label:'planificado',
      tasks:{total:canon.tasks.length,completedPlanned:done,inProgressPlanned:running,pendingPlanned:pending},evidence:st.evidence,dataStatus:st.dataStatus};
    // OBR-03 · coste planificado a la fecha.
    let cost;
    if(!costReport){const r=costUnavailableReason||'no-budget-link';cost={status:'unavailable',reason:r,amount:null,message:`No disponible: ${COST_REASONS[r]||'sin enlace verificable con el presupuesto ('+r+')'}.`};}
    else if(costReport.scheduleId!==canon.id)cost={status:'unavailable',reason:'report-other-plan',amount:null,message:'No disponible: el reparto del presupuesto es de otro plan.'};
    else{
      const rows=costReport.byTask.filter(r=>r.lines.length);
      if(!rows.length)cost={status:'unavailable',reason:'no-allocation',amount:null,message:'No disponible: ninguna tarea del plan tiene partidas del presupuesto asignadas.'};
      else{
        let known=0,total=0;const unknown=[];let totalKnown=true;
        for(const r of costReport.byTask){const f=frac.get(r.taskId)||0;
          for(const l of r.lines){if(l.allocatedNet===null){totalKnown=false;if(f>0)unknown.push({taskId:r.taskId,itemId:l.itemId});continue;}
            known+=cents(l.allocatedNet)*f;total+=cents(l.allocatedNet);}}
        const amount=Math.round(known)/100,plannedTotal=total/100;
        cost={status:unknown.length?'partial':'available',amount:unknown.length?null:amount,knownAmount:amount,unknownItems:unknown,
          plannedTotal:totalKnown?plannedTotal:null,plannedTotalKnown:plannedTotal,currency:'EUR',vat:'sin IVA',label:'Coste planificado a la fecha',
          assumption:'Reparto lineal del importe de cada tarea a lo largo de sus días planificados (supuesto de planificación, no gasto).',
          revisionCheck:costReport.projectRevision?.check??'unverifiable',
          message:unknown.length?`Parcial: ${unknown.length} partida(s) de tareas ya empezadas no tienen importe; se muestra solo lo conocido.`:null,
          unassignedBudgetItems:costReport.unassignedBudgetItemIds?.length||0};
      }
    }
    // OBR-02 · siguiente(s) tarea(s): primera fecha de inicio posterior al día mostrado.
    const day=ms(date),later=canon.tasks.filter(t=>ms(t.startDate)>day);let next;
    if(!later.length)next={state:'none',reason:canon.tasks.every(t=>ms(t.endDate)<day)?'plan-finished':'no-later-start',
      message:canon.tasks.every(t=>ms(t.endDate)<day)?'El plan ya está completado en esta fecha.':'Ninguna tarea empieza después de esta fecha; las que quedan ya están en curso.'};
    else{const first=Math.min(...later.map(t=>ms(t.startDate)));
      const tasks=later.filter(t=>ms(t.startDate)===first).sort((a,b)=>a.wbs.localeCompare(b.wbs,'es',{numeric:true})||a.id.localeCompare(b.id)).map(t=>({
        id:t.id,wbs:t.wbs,title:t.title,source:t.source,startDate:t.startDate,endDate:t.endDate,durationDays:dur(t),daysUntil:Math.round((ms(t.startDate)-day)/DAY),
        dependsOn:t.dependsOn.map(d=>{const p=byId.get(d.taskId);return {taskId:d.taskId,wbs:p?.wbs??null,title:p?.title??null,type:d.type,lagDays:d.lagDays,
          predecessorPlanned:(frac.get(d.taskId)||0)>=1?'completed':(frac.get(d.taskId)||0)>0?'in-progress':'pending'};}),
        elements:t.elements.map(e=>({elementId:e.elementId,role:e.role})),
        previewElementIds:[...new Set(t.elements.map(e=>e.elementId))],appearElementIds:[...new Set(t.elements.filter(e=>APPEAR.includes(e.role)).map(e=>e.elementId))]}));
      next={state:'planned',startDate:iso(first),daysUntil:Math.round((first-day)/DAY),tasks,label:'planificado'};}
    return {schema:SCHEMA,version:VERSION,state:'available',date,scheduleId:canon.id,planKey:planKey(canon),progress,cost,next,executed:EXECUTED,
      disclaimer:'Plan de obra: el anillo, el coste y la siguiente tarea son PLANIFICADOS, no avance real ni certificación.'};
  }
  /* Procedencia (auditoría del propietario, 13/11/2026). NO es una autoridad nueva: lee lo que el adaptador FT3D-8 ya
     calculó (FloorPlanConstructionProject.evaluate → model: links, coverage, fingerprints, planning, costs, delivery) y lo
     ordena para que la persona vea, por cada dato, de dónde sale, qué es un supuesto y qué no está disponible:
     - fuentes: proyecto (huella SHA-256 actual), plan (revisión del proyecto sobre la que se hizo, estado de revisión,
       origen declarado de las tareas), presupuesto C1–C4 (sujeto, comprobación de revisión, origen de los precios,
       reparto a tareas), vínculo profesional y nivel de entrega;
     - vínculos de la siguiente tarea: cada elemento con el estado que le dio el adaptador (ok | broken | not-representable
       | illustrative). SOLO los «ok» se dibujan en fantasma: nunca se inventa geometría para un identificador roto, sin
       representación o ilustrativo;
     - tareas sin elementos del modelo y sin partidas (se dicen, no se dibujan ni se pagan);
     - avisos: plan sobre otra revisión del proyecto, vínculos rotos, presupuesto no verificable, coste parcial, borrador. */
  const short=h=>typeof h==='string'&&h.length>12?h.slice(0,12):h??null;
  const LINK_ES={ok:'vinculado y comprobado en el modelo',broken:'el identificador no existe en el proyecto: no se dibuja','not-representable':'existe en el proyecto pero no tiene representación 3D: no se dibuja',
    illustrative:'recurso ilustrativo del plan, no es geometría del proyecto: no se dibuja en fantasma','role-mismatch':'rol no admitido para ese recurso: no se dibuja'};
  const OTHER_REVISION_ES='plan de otra revisión · no validado sobre la actual';
  const WITHHELD_ES='existe en el proyecto, pero el plan es de otra revisión: no se dibuja hasta reconciliar las fuentes';
  const REVIEW_ES={draft:'borrador: fechas sin aprobar',reviewed:'revisado (declarado por el profesional, no acreditado)'};
  function provenance({snapshot,model,schedule=null,meta=null}={}){
    const out={schema:SCHEMA+'-provenance',version:VERSION,sources:[],next:[],ghostKeys:[],tasksWithoutElements:[],tasksWithoutBudget:[],brokenLinks:[],warnings:[],
      statements:{progress:'El % es del CALENDARIO del plan (días planificados), no obra ejecutada ni certificada: el 100 % al final del plan no significa obra terminada.',
        cost:'Coste planificado = importe asignado a cada tarea repartido en línea recta por sus días (supuesto de planificación): no es gasto real ni certificación.',
        executed:EXECUTED.label}};
    if(!model){out.warnings.push({code:'no-model',message:'Sin modelo evaluado: no se puede comprobar ninguna procedencia.'});return out;}
    let canon=null;try{canon=schedule?S.canonical(schedule):null;}catch{canon=null;}
    const fp=model.fingerprints||{};
    // Proyecto.
    // Origen DECLARADO por quien abrió la vista (fixture de laboratorio, importación, biblioteca): no se deduce de los datos.
    const origin=typeof meta?.origin==='string'?meta.origin:typeof meta?.text==='string'?meta.text:null;
    out.synthetic=meta?.kind==='fixture'?'declared':'unknown';
    out.sources.push({kind:'project',label:'Proyecto',name:model.subject?.name??null,id:model.subject?.id??null,updatedAt:model.subject?.updatedAt??null,origin,
      fingerprint:short(fp.project),status:'present',detail:`${model.subject?.name||'—'} · geometría del proyecto guardado (FloorPlanCore), huella SHA-256 ${short(fp.project)||'—'}…${origin?' · origen: '+origin:''}`});
    // Plan.
    if(model.planning?.status==='available'&&canon){
      const sameRev=canon.projectRef.revision===fp.project,srcs=[...new Set(canon.tasks.map(t=>t.source).filter(Boolean))];
      out.sources.push({kind:'plan',label:'Plan de obra (WBS)',id:canon.id,tasks:canon.tasks.length,review:canon.review.status,reviewLabel:REVIEW_ES[canon.review.status]||canon.review.status,
        projectRevision:short(canon.projectRef.revision),matchesProject:sameRev,declaredSources:srcs,status:sameRev?'present':'other-revision',
        detail:`${canon.tasks.length} tareas · ${REVIEW_ES[canon.review.status]||canon.review.status} · ${sameRev?'hecho sobre esta revisión del proyecto':'hecho sobre OTRA revisión del proyecto'}${srcs.length?' · origen declarado: '+srcs.join(' · '):''}`});
      if(!sameRev)out.warnings.push({code:'plan-other-revision',message:'El plan se hizo sobre otra revisión del proyecto: sus vínculos pueden no corresponder a la geometría actual. No se dibuja ningún fantasma de este plan hasta reconciliar las fuentes.'});
      if(canon.review.status!=='reviewed')out.warnings.push({code:'plan-draft',message:'Plan en borrador: las fechas no están aprobadas.'});
    }else{const st=model.planning?.status==='rejected'?'rejected':'unavailable';
      out.sources.push({kind:'plan',label:'Plan de obra (WBS)',status:st,detail:model.planning?.message||'Sin plan: no hay % ni siguiente tarea.'});
      out.warnings.push({code:'plan-'+st,message:st==='rejected'?'El plan cargado no es válido o es de otro proyecto: no se usa (ni %, ni siguiente tarea, ni costes).':'Sin plan de obra: no hay % del plan, ni siguiente tarea, ni coste planificado.'});}
    // Presupuesto C1–C4 y su reparto a tareas.
    const costs=model.costs||{},rep=costs.report,cov=model.coverage?.budget;
    if(costs.status==='available'&&rep){
      const labels=[...new Set(rep.byTask.flatMap(t=>t.lines).map(l=>l.priceSource?.label).filter(Boolean))];
      out.sources.push({kind:'budget',label:'Presupuesto C1–C4',id:rep.budgetId,status:'present',revisionCheck:rep.projectRevision.check,priceSources:labels,
        allocatedPercentOfKnown:cov?.allocatedPercentOfKnown??null,unassignedItems:cov?.unassignedItemIds?.length??0,pendingAllocations:cov?.pendingAllocations?.length??0,
        detail:`${rep.budgetId} · revisión del proyecto: ${rep.projectRevision.check==='match'?'coincide':rep.projectRevision.check==='mismatch'?'NO coincide':'no verificable (C1–C4 no guarda la revisión)'}`
          +` · ${cov?.allocatedPercentOfKnown??'—'} % del importe conocido asignado a tareas${cov?.unassignedItemIds?.length?` · ${cov.unassignedItemIds.length} partida(s) sin tarea`:''}${labels.length?' · precios: '+labels.join(' · '):''}`});
      if(rep.projectRevision.check!=='match')out.warnings.push({code:'budget-revision-'+rep.projectRevision.check,message:rep.projectRevision.check==='mismatch'?'El presupuesto es de otra revisión del proyecto.':'No se puede verificar sobre qué revisión del proyecto se hizo el presupuesto (C1–C4 no la guarda).'});
      if(cov?.unassignedItemIds?.length||cov?.pendingAllocations?.length)out.warnings.push({code:'budget-allocation-incomplete',message:`Reparto incompleto: ${cov.unassignedItemIds.length} partida(s) sin tarea y ${cov.pendingAllocations.length} con reparto pendiente; su importe no entra en el coste planificado.`});
    }else out.sources.push({kind:'budget',label:'Presupuesto C1–C4',status:'unavailable',reason:costs.reason||null,detail:'No disponible: '+(COST_REASONS[costs.reason]||costs.reason||'sin presupuesto')+'. No se muestra ningún importe.'});
    // Vínculo profesional y nivel de entrega (lo calcula el adaptador; aquí solo se dice).
    const b=model.obsolescence||{};
    out.sources.push({kind:'binding',label:'Vínculo profesional',status:Object.values(b).some(v=>v!=='unknown')?'present':'absent',
      detail:Object.values(b).some(v=>v!=='unknown')?`proyecto ${b.project}, plan ${b.schedule}, presupuesto ${b.budget}`:'Sin vínculo: ningún profesional ha fijado las revisiones.'});
    // El nivel lo calcula el adaptador FT3D-8 y no se toca. Su rótulo «orientativa» habla de un plan «sin revisión declarada
    // o incompleto»; si el plan SÍ declara revisión pero es OTRA, se dice al lado, sin ambigüedad (auditoría #219).
    const planOtherRevision=!!canon&&model.planning?.status==='available'&&canon.projectRef.revision!==fp.project;
    out.sources.push({kind:'delivery',label:'Nivel de la presentación',status:model.delivery?.level||'unknown',
      ...(planOtherRevision?{planRevision:'other'}:{}),
      detail:(model.delivery?.label||'—')+(planOtherRevision?' · '+OTHER_REVISION_ES:'')});
    // Vínculos: la siguiente tarea y las tareas sin elementos o sin partidas.
    const links=model.links||[],key=(t,e)=>t+'\u0000'+e,byLink=new Map(links.map(l=>[key(l.taskId,l.elementKey),l]));
    // Cierre del caso adversarial (auditoría #211): un plan hecho sobre OTRA revisión del proyecto no dibuja ningún fantasma,
    // ni siquiera de los elementos que todavía existen (que existan no prueba que el plan se refiera a ellos tal y como
    // están ahora). Cada elemento conserva su estado de vínculo y dice por qué no se dibuja, hasta reconciliar las fuentes.
    const otherRevision=!!canon&&canon.projectRef.revision!==fp.project;
    for(const t of snapshot?.next?.state==='planned'?snapshot.next.tasks:[])for(const e of t.elements){
      const l=byLink.get(key(t.id,e.elementId)),status=l?.status||'broken',withheld=otherRevision&&status==='ok';
      out.next.push({taskId:t.id,wbs:t.wbs,elementId:e.elementId,role:e.role,status,label:withheld?WITHHELD_ES:LINK_ES[status]||status,ghost:status==='ok'&&!otherRevision,
        ...(withheld?{withheld:'plan-other-revision'}:{})});}
    out.ghostKeys=[...new Set(out.next.filter(x=>x.ghost).map(x=>x.elementId))];
    const tmeta=new Map((canon?.tasks||[]).map(t=>[t.id,t]));
    const named=id=>{const t=tmeta.get(id);return {taskId:id,wbs:t?.wbs??null,title:t?.title??null};};
    out.tasksWithoutElements=(model.coverage?.tasks?.withoutElements||[]).map(named);
    out.tasksWithoutBudget=(model.coverage?.tasks?.withoutBudget||[]).map(named);
    out.brokenLinks=links.filter(l=>l.status==='broken').map(l=>({taskId:l.taskId,elementId:l.elementKey}));
    if(out.brokenLinks.length)out.warnings.push({code:'broken-links',message:`${out.brokenLinks.length} vínculo(s) del plan apuntan a elementos que no existen en el proyecto: no se dibujan.`});
    if(snapshot?.cost?.status==='partial')out.warnings.push({code:'cost-partial',message:'Coste planificado parcial: hay partidas sin importe en tareas ya empezadas.'});
    return out;
  }
  return Object.freeze({SCHEMA,VERSION,snapshot,unsupportedStates,planKey,COST_REASONS,provenance,LINK_ES,OTHER_REVISION_ES});
});
