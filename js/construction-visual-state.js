/* FT3D-8V visual state adapter: pure, serializable frames for a FUTURE timelapse.
   Consumes FloorPlanConstructionSchedule; no DOM, no Three.js, no demo geometry, no mutations.
   A frame is a PLANNED / ILLUSTRATIVE picture of the professional's plan on a given day:
   moving the cursor never records executed or certified work.

   Role behaviours (inspired by the Flat-to-3D Schedule Build pattern "element joins a phase",
   re-implemented here; no donor code copied):
   - appear     (site, build, structure, envelope, services): absent before, grows during, stays after.
   - layer      (cladding, finish): a surface layer applied on an element that already exists.
   - transient  (temporary): scaffolding, crane, site hut... present only while its task runs.
   - remove     (demolition): present before, being removed during, gone after.
   An element with no "appear" role is treated as PRE-EXISTING (e.g. kitchen reform walls). */
(function(root, factory){
  const core=typeof module==='object'&&module.exports?require('./construction-schedule-core.js'):root.FloorPlanConstructionSchedule;
  const api=factory(core);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FloorPlanConstructionVisualState=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Schedule){
  'use strict';
  if(!Schedule||typeof Schedule.canonical!=='function')throw new TypeError('FloorPlanConstructionVisualState requires FloorPlanConstructionSchedule');
  const SCHEMA='rubik-sota.construction-visual-frame';
  const VERSION='0.1.0';
  const DAY=86400000;
  const ROLE_BEHAVIOUR=Object.freeze({site:'appear',build:'appear',structure:'appear',envelope:'appear',services:'appear',
    cladding:'layer',finish:'layer',temporary:'transient',demolition:'remove'});
  const err=s=>{throw new TypeError('FloorPlanConstructionVisualState: '+s);};
  const dayMs=(v,name)=>{
    if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))err(name+' must be YYYY-MM-DD');
    const ms=Date.parse(v+'T00:00:00Z');
    if(!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,10)!==v)err(name+' must be a real calendar date');
    return ms;
  };
  const iso=ms=>new Date(ms).toISOString().slice(0,10);

  /* Timeline: day-quantized cursor shared by the future Gantt and 3D view.
     Position 0 is the day BEFORE the first task (empty site = "inicio"); the last position is the
     last planned day ("final"). Every position is a whole calendar day, so scrubbing is stable. */
  const timeline=schedule=>{
    const s=Schedule.canonical(schedule),b=Schedule.bounds(s);
    if(b.startDate===null)return {startDate:null,endDate:null,preStartDate:null,positions:0,checkpoints:[]};
    const start=dayMs(b.startDate,'startDate'),end=dayMs(b.endDate,'endDate');
    const set=new Set([iso(start-DAY),b.endDate]);
    for(const t of s.tasks){set.add(t.startDate);set.add(t.endDate);const after=dayMs(t.endDate,'endDate')+DAY;if(after<=end)set.add(iso(after));}
    return {startDate:b.startDate,endDate:b.endDate,preStartDate:iso(start-DAY),
      positions:Math.round((end-start)/DAY)+2,checkpoints:[...set].sort()};
  };
  const progressToDate=(schedule,p)=>{
    if(typeof p!=='number'||!Number.isFinite(p))err('progress must be a finite number');
    const t=timeline(schedule);
    if(!t.positions)return null;
    const i=Math.round(Math.min(1,Math.max(0,p))*(t.positions-1));
    return iso(dayMs(t.preStartDate,'preStartDate')+i*DAY);
  };
  const dateToProgress=(schedule,date)=>{
    const t=timeline(schedule);
    if(!t.positions)return null;
    const i=Math.round((dayMs(date,'date')-dayMs(t.preStartDate,'preStartDate'))/DAY);
    return Math.min(1,Math.max(0,i/(t.positions-1)));
  };

  const frameAt=(schedule,date)=>{
    const st=Schedule.stateAt(schedule,date);
    const byElement=new Map();
    for(const t of st.tasks)for(const e of t.elements){
      if(!byElement.has(e.elementId))byElement.set(e.elementId,[]);
      byElement.get(e.elementId).push({taskId:t.id,role:e.role,behaviour:ROLE_BEHAVIOUR[e.role],
        phase:t.plannedPhase,progress:t.visualProgress,startDate:t.startDate,endDate:t.endDate});
    }
    const elements=[...byElement.keys()].sort().map(elementId=>{
      const layers=byElement.get(elementId).sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.taskId.localeCompare(b.taskId));
      const of=k=>layers.filter(l=>l.behaviour===k);
      const appear=of('appear'),transient=of('transient'),remove=of('remove'),layer=of('layer');
      const onlyTransient=transient.length===layers.length;
      let base=appear.length?appear.some(l=>l.progress>0):!onlyTransient;
      const removed=remove.some(l=>l.phase==='completed');
      if(removed)base=false;
      const present=base||transient.some(l=>l.phase==='in-progress');
      const active=layers.filter(l=>l.phase==='in-progress');
      const building=active.filter(l=>l.behaviour==='appear'||l.behaviour==='layer');
      const state=!present?(removed?'removed':'absent')
        :active.some(l=>l.behaviour==='remove')?'removing'
        :building.length?'building'
        :!base?'temporary':'standing';
      return {elementId,present,state,
        builtFraction:appear.length?Math.max(...appear.map(l=>l.progress)):(present?1:0),
        appliedLayers:layer.filter(l=>l.progress>0).map(l=>({role:l.role,taskId:l.taskId,progress:l.progress})),
        layers:layers.map(({startDate,endDate,...l})=>l)};
    });
    return {schema:SCHEMA,schemaVersion:VERSION,date:st.date,scheduleId:st.scheduleId,projectRef:st.projectRef,
      evidence:st.evidence,illustrative:true,
      activeTaskIds:st.tasks.filter(t=>t.plannedPhase==='in-progress').map(t=>t.id),
      completedTaskIds:st.tasks.filter(t=>t.plannedPhase==='completed').map(t=>t.id),
      elements,disclaimer:'Estado visual planificado e ilustrativo; no certifica ejecucion ni pago'};
  };
  // Transitions between two frames, so a renderer can animate entries/exits in either direction.
  const diff=(from,to)=>{
    if(!from||!to||from.scheduleId!==to.scheduleId)err('frames must belong to the same schedule');
    const a=new Map(from.elements.map(e=>[e.elementId,e])),b=new Map(to.elements.map(e=>[e.elementId,e]));
    const ids=[...new Set([...a.keys(),...b.keys()])].sort();
    const direction=to.date>from.date?'forward':to.date<from.date?'backward':'none';
    return {from:from.date,to:to.date,direction,changes:ids.flatMap(id=>{
      const x=a.get(id),y=b.get(id);
      const sx=x?x.state:'absent',sy=y?y.state:'absent';
      const lx=x?x.appliedLayers.map(l=>l.role).join(','):'',ly=y?y.appliedLayers.map(l=>l.role).join(','):'';
      if(sx===sy&&lx===ly&&(x&&y?x.builtFraction===y.builtFraction:true))return [];
      return [{elementId:id,fromState:sx,toState:sy,enter:!(x&&x.present)&&!!(y&&y.present),exit:!!(x&&x.present)&&!(y&&y.present)}];
    })};
  };
  return Object.freeze({SCHEMA,VERSION,ROLE_BEHAVIOUR,timeline,progressToDate,dateToProgress,frameAt,diff});
});
