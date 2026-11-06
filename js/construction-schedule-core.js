/* FT3D-8V: construction schedule is a reviewed PLAN, never a record of built work.
   Pure functions, zero DOM / Three.js / mutations / API calls.
   The canonical project and C1-C4 budget remain separate authorities.

   Schema 0.2.0 (accepts 0.1.0 input and upgrades it losslessly):
   - dependsOn: legacy 'taskId' strings (= FS, lag 0) or {taskId, type:FS|SS|FF|SF, lagDays}.
     Dates are VALIDATED against every dependency and never moved.
   - elements: [{elementId, role}] lets one 3D element take part in several visual phases
     (e.g. structure, then cladding). Legacy elementIds strings = role 'build'.
   - budgetAllocations: [{itemId, sharePercent}] splits a C1-C4 item across tasks with explicit
     professional percentages; the sum per item may never exceed 100 %. Anything below 100 % stays
     PENDING, never redistributed. Legacy budgetItemIds strings = the whole item (100 %), which is
     exactly what the exclusive 0.1.0 contract meant.
   - Evidence ladder: plan-estimated < plan-approved < executed < certified. This cut only produces
     the two plan levels; execution records are reserved and must stay empty. */
(function(root, factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FloorPlanConstructionSchedule=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SCHEMA='rubik-sota.construction-schedule';
  const VERSION='0.2.0';
  const SUPPORTED_VERSIONS=Object.freeze(['0.1.0','0.2.0']);
  const DEPENDENCY_TYPES=Object.freeze(['FS','SS','FF','SF']);
  const ELEMENT_ROLES=Object.freeze(['site','build','structure','envelope','services','cladding','finish','temporary','demolition']);
  const EVIDENCE_LEVELS=Object.freeze(['plan-estimated','plan-approved','executed','certified']);
  const CALENDAR=Object.freeze({type:'calendar-days',timeZone:'UTC'});
  const MAX_LAG_DAYS=3650;
  const DAY=86400000;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const err=s=>{throw new TypeError('FloorPlanConstructionSchedule: '+s);};
  const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
  const string=(v,name)=>typeof v==='string'&&v.trim()?v.trim():err(name+' must be a non-empty string');
  const array=(v,name)=>Array.isArray(v)?v:err(name+' must be an array');
  const dateMs=(v,name)=>{
    if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))err(name+' must be YYYY-MM-DD');
    const [y,m,d]=v.split('-').map(Number),ms=Date.UTC(y,m-1,d),dt=new Date(ms);
    if(y<100||dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d)err(name+' must be a real calendar date');
    return ms;
  };
  const isoDay=ms=>new Date(ms).toISOString().slice(0,10);
  const uniqueIds=(values,name)=>{
    const set=new Set();
    for(const raw of array(values,name)){const id=string(raw,name+' item');if(set.has(id))err('duplicate '+name+' '+id);set.add(id);}
    return [...set];
  };
  const evidenceOf=review=>review.status==='reviewed'?'plan-approved':'plan-estimated';
  const validReview=(review)=>{
    if(!isObj(review))err('review is required');
    if(!['draft','reviewed'].includes(review.status))err('review.status must be draft or reviewed');
    const r={status:review.status,by:review.by??null,at:review.at??null};
    if(r.status==='reviewed'){
      string(r.by,'review.by');if(typeof r.at!=='string'||!(/^\d{4}-\d\d-\d\dT/.test(r.at))||!Number.isFinite(Date.parse(r.at)))err('review.at requires ISO datetime');
    }else if(r.by!==null||r.at!==null)err('draft review cannot claim reviewer/date');
    return r;
  };
  const validCalendar=c=>{
    if(c===undefined||c===null)return clone(CALENDAR);
    if(!isObj(c)||c.type!==CALENDAR.type||c.timeZone!==CALENDAR.timeZone)err('calendar must be calendar-days/UTC in this version');
    return clone(CALENDAR);
  };
  const validExecution=records=>{
    if(records===undefined||records===null)return [];
    if(!Array.isArray(records))err('executionRecords must be an array');
    // Reserved for a later cut. Moving the simulation cursor never creates executed/certified work.
    if(records.length)err('executionRecords are reserved: actual progress is not supported in this version');
    return [];
  };
  const validDependencies=(raw,taskId)=>{
    const seen=new Set();
    return array(raw??[],'dependsOn').map(dep=>{
      let d;
      if(typeof dep==='string')d={taskId:string(dep,'dependsOn item'),type:'FS',lagDays:0};
      else{
        if(!isObj(dep))err('dependsOn item of '+taskId+' must be a task id or {taskId,type,lagDays}');
        if(!DEPENDENCY_TYPES.includes(dep.type))err('dependency type of '+taskId+' must be FS, SS, FF or SF');
        if(!Number.isInteger(dep.lagDays)||Math.abs(dep.lagDays)>MAX_LAG_DAYS)err('dependency lagDays of '+taskId+' must be an explicit integer within ±'+MAX_LAG_DAYS);
        d={taskId:string(dep.taskId,'dependsOn.taskId'),type:dep.type,lagDays:dep.lagDays};
      }
      if(d.taskId===taskId)err('self-dependency '+taskId);
      if(seen.has(d.taskId))err('duplicate dependsOn '+d.taskId+' in task '+taskId);
      seen.add(d.taskId);
      return d;
    });
  };
  const validElements=(t,id)=>{
    let elements;
    if(t.elements!==undefined){
      const seen=new Set();
      elements=array(t.elements,'elements').map(e=>{
        if(!isObj(e))err('elements item of '+id+' must be {elementId,role}');
        const elementId=string(e.elementId,'elements.elementId');
        if(!ELEMENT_ROLES.includes(e.role))err('element role of '+elementId+' in '+id+' must be one of '+ELEMENT_ROLES.join('/'));
        if(seen.has(elementId))err('duplicate element '+elementId+' in task '+id);
        seen.add(elementId);
        return {elementId,role:e.role};
      });
      if(t.elementIds!==undefined){
        const legacy=uniqueIds(t.elementIds,'elementIds');
        if(legacy.join('\u0000')!==elements.map(e=>e.elementId).join('\u0000'))err('elementIds of '+id+' contradict elements');
      }
    }else elements=uniqueIds(t.elementIds??[],'elementIds').map(elementId=>({elementId,role:'build'}));
    return elements;
  };
  const basisPoints=(v,name)=>{
    if(typeof v!=='number'||!Number.isFinite(v)||v<=0||v>100)err(name+' must be a number in (0,100]');
    const bp=Math.round(v*100);
    if(Math.abs(bp-v*100)>1e-6)err(name+' allows at most two decimals');
    return bp;
  };
  const validAllocations=(t,id)=>{
    let allocations;
    if(t.budgetAllocations!==undefined){
      const seen=new Set();
      allocations=array(t.budgetAllocations,'budgetAllocations').map(a=>{
        if(!isObj(a))err('budgetAllocations item of '+id+' must be {itemId,sharePercent}');
        const itemId=string(a.itemId,'budgetAllocations.itemId');
        if(seen.has(itemId))err('duplicate budget allocation '+itemId+' in task '+id);
        seen.add(itemId);
        // Explicit professional share: no default, no inference.
        const bp=basisPoints(a.sharePercent,'sharePercent of '+itemId+' in '+id);
        return {itemId,sharePercent:bp/100};
      });
      if(t.budgetItemIds!==undefined){
        const legacy=uniqueIds(t.budgetItemIds,'budgetItemIds');
        if(legacy.join('\u0000')!==allocations.map(a=>a.itemId).join('\u0000'))err('budgetItemIds of '+id+' contradict budgetAllocations');
      }
    }else allocations=uniqueIds(t.budgetItemIds??[],'budgetItemIds').map(itemId=>({itemId,sharePercent:100}));
    return allocations;
  };
  // Instants in whole days: a task occupies [start, end+1). Constraint: succ.X >= pred.Y + lag.
  const instants=t=>({start:dateMs(t.startDate,'startDate')/DAY,finish:dateMs(t.endDate,'endDate')/DAY+1});
  const dependencyCheck=(pred,succ,dep)=>{
    const p=instants(pred),s=instants(succ);
    const [left,right]={FS:[s.start,p.finish],SS:[s.start,p.start],FF:[s.finish,p.finish],SF:[s.finish,p.start]}[dep.type];
    return {ok:left>=right+dep.lagDays,slackDays:left-(right+dep.lagDays)};
  };
  const validate=(schedule)=>{
    if(!isObj(schedule))err('schedule must be an object');
    if(schedule.schema!==SCHEMA||!SUPPORTED_VERSIONS.includes(schedule.schemaVersion))err('unsupported schedule schema/version');
    const projectRef=schedule.projectRef;
    if(!projectRef||!['project','building'].includes(projectRef.type))err('projectRef.type must be project/building');
    const project={type:projectRef.type,id:string(projectRef.id,'projectRef.id'),revision:string(projectRef.revision,'projectRef.revision')};
    const review=validReview(schedule.review);
    const calendar=validCalendar(schedule.calendar);
    const executionRecords=validExecution(schedule.executionRecords);
    const rows=array(schedule.tasks,'tasks').map((t,i)=>{
      if(!isObj(t))err('tasks['+i+'] must be an object');
      const id=string(t.id,'task.id'),title=string(t.title,'task.title');
      const startMs=dateMs(t.startDate,'task '+id+' startDate'),endMs=dateMs(t.endDate,'task '+id+' endDate');
      if(startMs>endMs)err('task '+id+' ends before its start');
      const dependsOn=validDependencies(t.dependsOn,id);
      const elements=validElements(t,id),budgetAllocations=validAllocations(t,id);
      return {id,title,wbs:string(t.wbs,'task.wbs'),startDate:t.startDate,endDate:t.endDate,
        dependsOn,elements,budgetAllocations,source:string(t.source,'task.source')};
    });
    const byId=new Map();
    for(const t of rows){if(byId.has(t.id))err('duplicate task '+t.id);byId.set(t.id,t);}
    // A predecessor is a declared dependency, never an inferred CPM result.
    const marks=new Map();
    const visit=id=>{
      if(marks.get(id)==='active')err('dependency cycle at '+id);
      if(marks.get(id)==='done')return;
      marks.set(id,'active');
      for(const before of byId.get(id).dependsOn){if(!byId.has(before.taskId))err('unknown predecessor '+before.taskId);visit(before.taskId);}
      marks.set(id,'done');
    };
    rows.forEach(t=>visit(t.id));
    // Dates belong to the professional: a violated link is an error, never a silent reschedule.
    for(const t of rows)for(const dep of t.dependsOn){
      const c=dependencyCheck(byId.get(dep.taskId),t,dep);
      if(!c.ok)err('dependency '+dep.taskId+' -> '+t.id+' ('+dep.type+(dep.lagDays>=0?'+':'')+dep.lagDays+'d) violated by '+(-c.slackDays)+' day(s)');
    }
    // One element may join several tasks, but never twice with the same visual role.
    const roleOwner=new Map();
    for(const t of rows)for(const e of t.elements){
      const key=e.elementId+'\u0000'+e.role;
      if(roleOwner.has(key))err('elementIds '+e.elementId+' role '+e.role+' assigned to both '+roleOwner.get(key)+' and '+t.id);
      roleOwner.set(key,t.id);
    }
    // A budget item may be split, but its shares can never exceed 100 % (no double counting).
    const shares=new Map();
    for(const t of rows)for(const a of t.budgetAllocations){
      const prev=shares.get(a.itemId)||{bp:0,owners:[]};
      prev.bp+=Math.round(a.sharePercent*100);prev.owners.push(t.id);
      if(prev.bp>10000)err('budgetItemIds '+a.itemId+' assigned to both '+prev.owners.join(' and ')+' beyond 100 %');
      shares.set(a.itemId,prev);
    }
    const source=string(schedule.source,'schedule.source');
    return {schema:SCHEMA,schemaVersion:VERSION,id:string(schedule.id,'schedule.id'),projectRef:project,
      source,review,calendar,executionRecords,tasks:rows.map(storedTask)};
  };
  // Stored form stays 0.1.0-shaped whenever it can (role build, 100 %, FS+0) so legacy readers and
  // editors keep working; the richer form appears only when the professional actually uses it.
  function storedTask(t){
    const legacyDeps=t.dependsOn.map(d=>d.type==='FS'&&d.lagDays===0?d.taskId:{...d});
    const out={id:t.id,title:t.title,wbs:t.wbs,startDate:t.startDate,endDate:t.endDate,dependsOn:legacyDeps};
    if(t.elements.every(e=>e.role==='build'))out.elementIds=t.elements.map(e=>e.elementId);
    else out.elements=clone(t.elements);
    if(t.budgetAllocations.every(a=>a.sharePercent===100))out.budgetItemIds=t.budgetAllocations.map(a=>a.itemId);
    else out.budgetAllocations=clone(t.budgetAllocations);
    out.source=t.source;
    return out;
  }
  // Internal canonical view of a validated task (always the rich form).
  const canonicalTask=t=>({...t,dependsOn:validDependencies(t.dependsOn,t.id),elements:validElements(t,t.id),
    budgetAllocations:validAllocations(t,t.id)});
  const canonical=schedule=>{const s=validate(schedule);return {...s,tasks:s.tasks.map(canonicalTask)};};
  const create=({id,projectRef,source='Plan provisional',tasks=[],review={status:'draft',by:null,at:null},calendar}={})=>
    validate({schema:SCHEMA,schemaVersion:VERSION,id,projectRef,source,tasks,review,calendar});
  const upgrade=schedule=>validate(schedule);
  const evidence=schedule=>{
    const s=validate(schedule);
    return {level:evidenceOf(s.review),levels:[...EVIDENCE_LEVELS],
      executed:false,certified:false,reason:'Plan de obra: no hay registros de ejecucion ni certificacion en esta version'};
  };
  const bounds=s=>{
    const rows=validate(s).tasks;
    if(!rows.length)return {startDate:null,endDate:null};
    return {startDate:rows.map(t=>t.startDate).sort()[0],endDate:rows.map(t=>t.endDate).sort().at(-1)};
  };
  // Pure read-only check: every declared link with its slack. Never proposes new dates.
  const dependencyReport=schedule=>{
    const s=canonical(schedule),byId=new Map(s.tasks.map(t=>[t.id,t]));
    return s.tasks.flatMap(t=>t.dependsOn.map(dep=>({from:dep.taskId,to:t.id,type:dep.type,lagDays:dep.lagDays,
      slackDays:dependencyCheck(byId.get(dep.taskId),t,dep).slackDays})));
  };
  const plannedTask=(t,at)=>{
    const begin=dateMs(t.startDate,'startDate'),end=dateMs(t.endDate,'endDate');
    const durationDays=Math.round((end-begin)/DAY)+1;
    const fraction=at<begin?0:at>end?1:Math.min(1,Math.max(0,(at-begin+DAY)/DAY/durationDays));
    const phase=at<begin?'not-started':at>end?'completed':'in-progress';
    return {fraction,phase,durationDays};
  };
  // A given day is a PLANNED visual state. It does not certify actual progress.
  const stateAt=(schedule,date)=>{
    const s=canonical(schedule),at=dateMs(date,'date'),level=evidenceOf(s.review);
    const tasks=s.tasks.map(t=>{
      const p=plannedTask(t,at);
      return {id:t.id,title:t.title,wbs:t.wbs,phase:p.phase,plannedPhase:p.phase,visualProgress:p.fraction,
        startDate:t.startDate,endDate:t.endDate,elementIds:t.elements.map(e=>e.elementId),elements:clone(t.elements),
        budgetItemIds:t.budgetAllocations.map(a=>a.itemId),evidence:level,executionStatus:'not-recorded',certificationStatus:'not-recorded'};
    });
    const visualGroups=tasks.flatMap(t=>t.elements.map(e=>({
      elementId:e.elementId,role:e.role,taskId:t.id,visible:t.visualProgress>0,progress:t.visualProgress,phase:t.phase
    })));
    return {date,scheduleId:s.id,projectRef:clone(s.projectRef),dataStatus:s.review.status,evidence:level,illustrative:true,
      tasks,visualGroups,disclaimer:'Plan de obra; la animacion no certifica ejecucion real'};
  };
  const ganttRows=schedule=>canonical(schedule).tasks.map(t=>({
    id:t.id,name:t.title,wbs:t.wbs,start:t.startDate,end:t.endDate,
    dependencies:t.dependsOn.map(d=>d.taskId),dependencyDetails:clone(t.dependsOn),source:t.source,
    budgetItemIds:t.budgetAllocations.map(a=>a.itemId),budgetAllocations:clone(t.budgetAllocations),elements:clone(t.elements)
  }));
  const BLOCKING=Object.freeze(['price-missing','price-unreviewed','quantity-unavailable','quantity-incomplete','allocation-pending','project-revision-mismatch']);
  const lineIssues=line=>{
    const issues=[];
    if(line.unitPrice===null)issues.push('price-missing');
    else if(line.review.status!=='reviewed')issues.push('price-unreviewed');
    if(line.quantity.value===null)issues.push('quantity-unavailable');
    else if(line.quantity.complete!==true)issues.push('quantity-incomplete');
    // A reviewed estimate is still an estimate: kept visible as a warning, never upgraded to measured.
    if(line.quantity.status==='estimated')issues.push('quantity-estimated');
    if(line.priceSource&&line.priceSource.type==='manual'&&!line.priceSource.asOf)issues.push('price-source-undated');
    return issues;
  };
  const sourceOf=line=>line.priceSource?{type:line.priceSource.type,label:line.priceSource.label??null,asOf:line.priceSource.asOf??null,
    providerId:line.priceSource.providerId??null,itemId:line.priceSource.itemId??null}:null;
  // Largest-remainder split in cents: the parts of one item always sum to its allocated share, never more.
  const splitCents=(totalCents,parts)=>{
    const exact=parts.map(p=>totalCents*p.bp/10000),floors=exact.map(Math.floor);
    const target=Math.round(totalCents*parts.reduce((s,p)=>s+p.bp,0)/10000);
    let rest=target-floors.reduce((s,v)=>s+v,0);
    const order=exact.map((v,i)=>({i,f:v-floors[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);
    for(const o of order){if(rest<=0)break;floors[o.i]+=1;rest-=1;}
    return floors;
  };
  const budgetReport=(schedule,budget,budgetEngine)=>{
    const s=canonical(schedule);
    if(!budgetEngine||typeof budgetEngine.calculateBudget!=='function')err('budget engine is required');
    const result=budgetEngine.calculateBudget(budget); // C1-C4 are sole source of amounts.
    if(result.currency!=='EUR')err('budget must use EUR');
    if(result.subject.type!==s.projectRef.type||result.subject.id!==s.projectRef.id)err('budget subject does not match schedule');
    // C1-C4 budgets currently carry no project revision: never claim a match we cannot see.
    const budgetRevision=typeof result.subject.revision==='string'?result.subject.revision:null;
    const revisionCheck=budgetRevision===null?'unverifiable':budgetRevision===s.projectRef.revision?'match':'mismatch';
    const lineMap=new Map(result.lines.map(line=>[line.id,line]));
    const parts=new Map();
    s.tasks.forEach((t,ti)=>t.budgetAllocations.forEach(a=>{
      if(!lineMap.has(a.itemId))err('unknown budget item '+a.itemId+' in task '+t.id);
      if(!parts.has(a.itemId))parts.set(a.itemId,[]);
      parts.get(a.itemId).push({taskIndex:ti,bp:Math.round(a.sharePercent*100)});
    }));
    const allocatedCents=new Map(); // key taskIndex|itemId -> cents or null
    const pendingAllocations=[];
    for(const [itemId,list] of parts){
      const line=lineMap.get(itemId),bp=list.reduce((sum,p)=>sum+p.bp,0);
      if(bp<10000)pendingAllocations.push({itemId,allocatedPercent:bp/100,pendingPercent:(10000-bp)/100});
      const cents=line.subtotalNet===null?null:splitCents(Math.round(line.subtotalNet*100),list);
      list.forEach((p,i)=>allocatedCents.set(p.taskIndex+'|'+itemId,cents===null?null:cents[i]));
    }
    const pendingIds=new Set(pendingAllocations.map(p=>p.itemId));
    const tasks=s.tasks.map((t,ti)=>{
      const lines=t.budgetAllocations.map(a=>{
        const line=lineMap.get(a.itemId),issues=lineIssues(line);
        if(pendingIds.has(a.itemId))issues.push('allocation-pending');
        if(revisionCheck==='mismatch')issues.push('project-revision-mismatch');
        const cents=allocatedCents.get(ti+'|'+a.itemId);
        return {itemId:a.itemId,description:line.description??null,sharePercent:a.sharePercent,
          itemSubtotalNet:line.subtotalNet,allocatedNet:cents===null?null:cents/100,
          quantityStatus:line.quantity.status,quantityComplete:line.quantity.complete===true,
          priceSource:sourceOf(line),reviewStatus:line.review.status,reviewedAt:line.review.reviewedAt??null,issues};
      });
      const missing=lines.filter(l=>l.allocatedNet===null).map(l=>l.itemId);
      const unreviewed=lines.filter(l=>l.reviewStatus!=='reviewed'||!l.quantityComplete).map(l=>l.itemId);
      // Use cents for deterministic sums; unknown is null, not zero.
      const knownNetCents=lines.filter(l=>l.allocatedNet!==null).reduce((sum,l)=>sum+Math.round(l.allocatedNet*100),0);
      const allKnown=missing.length===0;
      const blocking=lines.some(l=>l.issues.some(i=>BLOCKING.includes(i)));
      return {taskId:t.id,budgetItemIds:t.budgetAllocations.map(a=>a.itemId),lines,
        knownNet:lines.some(l=>l.allocatedNet!==null)?knownNetCents/100:null,
        totalNet:lines.length&&allKnown?knownNetCents/100:null,
        missingItemIds:missing,unreviewedItemIds:unreviewed,
        estimatedQuantityItemIds:lines.filter(l=>l.quantityStatus==='estimated').map(l=>l.itemId),
        pendingAllocationItemIds:lines.filter(l=>pendingIds.has(l.itemId)).map(l=>l.itemId),
        verified:s.review.status==='reviewed'&&lines.length>0&&allKnown&&!blocking};
    });
    return {scheduleId:s.id,budgetId:result.budgetId,currency:'EUR',
      dataStatus:s.review.status,planEvidence:evidenceOf(s.review),costEvidence:'budgeted',
      projectRevision:{schedule:s.projectRef.revision,budget:budgetRevision,check:revisionCheck},
      byTask:tasks,unassignedBudgetItemIds:result.lines.filter(l=>!parts.has(l.id)).map(l=>l.id),
      pendingAllocations,budgetTotals:clone(result.totals.net),
      scheduleTotals:{allocatedKnownNet:tasks.reduce((sum,t)=>sum+Math.round((t.knownNet??0)*100),0)/100,
        // complete only when every budget line is priced, fully allocated and linked to a task.
        complete:result.totals.net.complete&&pendingAllocations.length===0&&parts.size===result.lines.length&&tasks.every(t=>t.missingItemIds.length===0)},
      blockingIssues:[...BLOCKING],
      disclaimer:'Coste presupuestado, no gasto ejecutado ni certificacion'};
  };
  const serialize=schedule=>JSON.stringify(validate(schedule));
  const parse=text=>{if(typeof text!=='string')err('serialized schedule must be string');let s;try{s=JSON.parse(text);}catch{err('invalid schedule JSON');}return validate(s);};
  return Object.freeze({SCHEMA,VERSION,SUPPORTED_VERSIONS,DEPENDENCY_TYPES,ELEMENT_ROLES,EVIDENCE_LEVELS,CALENDAR,
    create,validate,canonical,upgrade,serialize,parse,bounds,evidence,dependencyReport,stateAt,ganttRows,budgetReport});
});
