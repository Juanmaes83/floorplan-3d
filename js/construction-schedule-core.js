/* FT3D-8V: construction schedule is a reviewed PLAN, never a record of built work.
   Pure functions, zero DOM / Three.js / mutations / API calls.
   The canonical project and C1-C4 budget remain separate authorities. */
(function(root, factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FloorPlanConstructionSchedule=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SCHEMA='rubik-sota.construction-schedule';
  const VERSION='0.1.0';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const err=s=>{throw new TypeError('FloorPlanConstructionSchedule: '+s);};
  const string=(v,name)=>typeof v==='string'&&v.trim()?v.trim():err(name+' must be a non-empty string');
  const array=(v,name)=>Array.isArray(v)?v:err(name+' must be an array');
  const dateMs=(v,name)=>{
    if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))err(name+' must be YYYY-MM-DD');
    const [y,m,d]=v.split('-').map(Number),ms=Date.UTC(y,m-1,d),dt=new Date(ms);
    if(y<100||dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d)err(name+' must be a real calendar date');
    return ms;
  };
  const uniqueIds=(values,name)=>{
    const set=new Set();
    for(const raw of array(values,name)){const id=string(raw,name+' item');if(set.has(id))err('duplicate '+name+' '+id);set.add(id);}
    return [...set];
  };
  const validReview=(review)=>{
    if(!review||typeof review!=='object'||Array.isArray(review))err('review is required');
    if(!['draft','reviewed'].includes(review.status))err('review.status must be draft or reviewed');
    const r={status:review.status,by:review.by??null,at:review.at??null};
    if(r.status==='reviewed'){
      string(r.by,'review.by');if(typeof r.at!=='string'||!(/^\d{4}-\d\d-\d\dT/.test(r.at))||!Number.isFinite(Date.parse(r.at)))err('review.at requires ISO datetime');
    }else if(r.by!==null||r.at!==null)err('draft review cannot claim reviewer/date');
    return r;
  };
  const validate=(schedule)=>{
    if(!schedule||typeof schedule!=='object'||Array.isArray(schedule))err('schedule must be an object');
    if(schedule.schema!==SCHEMA||schedule.schemaVersion!==VERSION)err('unsupported schedule schema/version');
    const projectRef=schedule.projectRef;
    if(!projectRef||!['project','building'].includes(projectRef.type))err('projectRef.type must be project/building');
    const project={type:projectRef.type,id:string(projectRef.id,'projectRef.id'),revision:string(projectRef.revision,'projectRef.revision')};
    const review=validReview(schedule.review);
    const rows=array(schedule.tasks,'tasks').map((t,i)=>{
      if(!t||typeof t!=='object'||Array.isArray(t))err('tasks['+i+'] must be an object');
      const id=string(t.id,'task.id'),title=string(t.title,'task.title');
      const startMs=dateMs(t.startDate,'task '+id+' startDate'),endMs=dateMs(t.endDate,'task '+id+' endDate');
      if(startMs>endMs)err('task '+id+' ends before its start');
      const dependsOn=uniqueIds(t.dependsOn??[],'dependsOn'),elementIds=uniqueIds(t.elementIds??[],'elementIds'),budgetItemIds=uniqueIds(t.budgetItemIds??[],'budgetItemIds');
      if(dependsOn.includes(id))err('self-dependency '+id);
      return {id,title,wbs:string(t.wbs,'task.wbs'),startDate:t.startDate,endDate:t.endDate,
        dependsOn,elementIds,budgetItemIds,source:string(t.source,'task.source')};
    });
    const byId=new Map();
    for(const t of rows){if(byId.has(t.id))err('duplicate task '+t.id);byId.set(t.id,t);}
    // A predecessor is a declared dependency, never an inferred CPM result.
    const marks=new Map();
    const visit=id=>{
      if(marks.get(id)==='active')err('dependency cycle at '+id);
      if(marks.get(id)==='done')return;
      marks.set(id,'active');
      for(const before of byId.get(id).dependsOn){if(!byId.has(before))err('unknown predecessor '+before);visit(before);}
      marks.set(id,'done');
    };
    rows.forEach(t=>visit(t.id));
    // First cut: one owner per visual group and budget item; no silent double-counting.
    for(const field of ['budgetItemIds','elementIds']){
      const seen=new Map();
      for(const t of rows)for(const id of t[field]){
        if(seen.has(id))err(field+' '+id+' assigned to both '+seen.get(id)+' and '+t.id);
        seen.set(id,t.id);
      }
    }
    const source=string(schedule.source,'schedule.source');
    return {schema:SCHEMA,schemaVersion:VERSION,id:string(schedule.id,'schedule.id'),projectRef:project,
      source,review,tasks:rows};
  };
  const create=({id,projectRef,source='Plan provisional',tasks=[],review={status:'draft',by:null,at:null}}={})=>
    validate({schema:SCHEMA,schemaVersion:VERSION,id,projectRef,source,tasks,review});
  const bounds=s=>{
    const rows=validate(s).tasks;
    if(!rows.length)return {startDate:null,endDate:null};
    return {startDate:rows.map(t=>t.startDate).sort()[0],endDate:rows.map(t=>t.endDate).sort().at(-1)};
  };
  // A given day is a PLANNED visual state. It does not certify actual progress.
  const stateAt=(schedule,date)=>{
    const s=validate(schedule),at=dateMs(date,'date');
    const tasks=s.tasks.map(t=>{
      const begin=dateMs(t.startDate,'startDate'),end=dateMs(t.endDate,'endDate');
      const durationDays=Math.round((end-begin)/86400000)+1;
      const fraction=at<begin?0:at>end?1:Math.min(1,Math.max(0,(at-begin+86400000)/86400000/durationDays));
      const phase=at<begin?'not-started':at>end?'completed':'in-progress';
      return {id:t.id,title:t.title,wbs:t.wbs,phase,visualProgress:fraction,
        startDate:t.startDate,endDate:t.endDate,elementIds:[...t.elementIds],budgetItemIds:[...t.budgetItemIds]};
    });
    const visualGroups=tasks.flatMap(t=>t.elementIds.map(id=>({
      elementId:id,taskId:t.id,visible:t.visualProgress>0,progress:t.visualProgress,phase:t.phase
    })));
    return {date,scheduleId:s.id,projectRef:clone(s.projectRef),dataStatus:s.review.status,
      tasks,visualGroups,disclaimer:'Plan de obra; la animacion no certifica ejecucion real'};
  };
  const ganttRows=schedule=>validate(schedule).tasks.map(t=>({
    id:t.id,name:t.title,wbs:t.wbs,start:t.startDate,end:t.endDate,
    dependencies:[...t.dependsOn],source:t.source,budgetItemIds:[...t.budgetItemIds]
  }));
  const budgetReport=(schedule,budget,budgetEngine)=>{
    const s=validate(schedule);
    if(!budgetEngine||typeof budgetEngine.calculateBudget!=='function')err('budget engine is required');
    const result=budgetEngine.calculateBudget(budget); // C1-C4 are sole source of amounts.
    if(result.currency!=='EUR')err('budget must use EUR');
    if(result.subject.type!==s.projectRef.type||result.subject.id!==s.projectRef.id)err('budget subject does not match schedule');
    const lineMap=new Map(result.lines.map(line=>[line.id,line]));
    const linkedIds=new Set();
    const tasks=s.tasks.map(t=>{
      const lines=t.budgetItemIds.map(id=>{
        const line=lineMap.get(id);
        if(!line)err('unknown budget item '+id+' in task '+t.id);
        linkedIds.add(id);
        return line;
      });
      const missing=lines.filter(l=>l.subtotalNet===null).map(l=>l.id);
      const unreviewed=lines.filter(l=>l.review.status!=='reviewed'||l.quantity.complete!==true).map(l=>l.id);
      // Use cents for deterministic sums; unknown is null, not zero.
      const knownNetCents=lines.filter(l=>l.subtotalNet!==null).reduce((sum,l)=>sum+Math.round(l.subtotalNet*100),0);
      const allKnown=missing.length===0;
      return {taskId:t.id,budgetItemIds:[...t.budgetItemIds],
        knownNet:lines.length?knownNetCents/100:null,
        totalNet:lines.length&&allKnown?knownNetCents/100:null,
        missingItemIds:missing,unreviewedItemIds:unreviewed,
        verified:s.review.status==='reviewed'&&lines.length>0&&allKnown&&unreviewed.length===0};
    });
    return {scheduleId:s.id,budgetId:result.budgetId,currency:'EUR',
      dataStatus:s.review.status,byTask:tasks,unassignedBudgetItemIds:result.lines.filter(l=>!linkedIds.has(l.id)).map(l=>l.id),
      budgetTotals:clone(result.totals.net),disclaimer:'Coste presupuestado, no gasto ejecutado ni certificacion'};
  };
  const serialize=schedule=>JSON.stringify(validate(schedule));
  const parse=text=>{if(typeof text!=='string')err('serialized schedule must be string');let s;try{s=JSON.parse(text);}catch{err('invalid schedule JSON');}return validate(s);};
  return Object.freeze({SCHEMA,VERSION,create,validate,serialize,parse,bounds,stateAt,ganttRows,budgetReport});
});
