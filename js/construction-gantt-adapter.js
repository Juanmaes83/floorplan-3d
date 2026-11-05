/* FT3D-8V Gantt adapter: pure rows for a FUTURE Gantt (target: Frappe Gantt, MIT), not installed.
   Dates come only from the professional's schedule; costs only from C1-C4 via budgetReport.
   - progress is EXECUTION progress in Frappe and stays 0: planned progress never fills a bar.
   - Frappe draws finish-to-start arrows only, so `dependencies` carries FS links ONLY. SS/FF/SF links go to
     _ft3d.nonFsDependencies (and FS lags to _ft3d.fsLags) so the UI labels them instead of misdrawing them.
   - Frappe treats a date-only end as inclusive (adds 24 h); our endDate is inclusive too. */
(function(root, factory){
  const core=typeof module==='object'&&module.exports?require('./construction-schedule-core.js'):root.FloorPlanConstructionSchedule;
  const api=factory(core);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FloorPlanConstructionGantt=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Schedule){
  'use strict';
  if(!Schedule||typeof Schedule.ganttRows!=='function')throw new TypeError('FloorPlanConstructionGantt requires FloorPlanConstructionSchedule');
  const toGanttTasks=(schedule,{budgetReport=null}={})=>{
    const rows=Schedule.ganttRows(schedule),level=Schedule.evidence(schedule).level;
    if(budgetReport&&budgetReport.scheduleId!==Schedule.validate(schedule).id)throw new TypeError('FloorPlanConstructionGantt: budget report belongs to another schedule');
    const costs=new Map((budgetReport?budgetReport.byTask:[]).map(t=>[t.taskId,t]));
    return rows.map(r=>{
      const c=costs.get(r.id);
      return {id:r.id,name:r.wbs+' '+r.name,start:r.start,end:r.end,
        // Only finish-to-start links become Frappe arrows; SS/FF/SF would be drawn as FS and mislead.
        dependencies:r.dependencyDetails.filter(d=>d.type==='FS').map(d=>d.taskId).join(', '),progress:0,custom_class:'ft3d-'+level,
        _ft3d:{wbs:r.wbs,title:r.name,source:r.source,evidence:level,dependencyDetails:r.dependencyDetails,
          nonFsDependencies:r.dependencyDetails.filter(d=>d.type!=='FS').map(d=>({...d})),
          fsLags:r.dependencyDetails.filter(d=>d.type==='FS'&&d.lagDays!==0).map(d=>({...d})),
          budgetAllocations:r.budgetAllocations,elements:r.elements,
          cost:c?{currency:'EUR',knownNet:c.knownNet,totalNet:c.totalNet,verified:c.verified,
            // "verified" = reviewed budget lines; it never implies a project<->budget revision match.
            projectRevisionCheck:budgetReport.projectRevision.check,
            missingItemIds:[...c.missingItemIds],pendingAllocationItemIds:[...c.pendingAllocationItemIds],
            estimatedQuantityItemIds:[...c.estimatedQuantityItemIds]}:null}};
    });
  };
  const nonFsDependencies=schedule=>Schedule.ganttRows(schedule).flatMap(r=>r.dependencyDetails
    .filter(d=>d.type!=='FS'||d.lagDays!==0).map(d=>({from:d.taskId,to:r.id,type:d.type,lagDays:d.lagDays})));
  // Today/cursor marker for the Gantt, driven by the same day-quantized date as the 3D frame.
  const cursor=(schedule,date)=>{
    const st=Schedule.stateAt(schedule,date);
    return {date:st.date,label:'Plan '+st.date,evidence:st.evidence,illustrative:true,
      activeTaskIds:st.tasks.filter(t=>t.plannedPhase==='in-progress').map(t=>t.id)};
  };
  return Object.freeze({toGanttTasks,nonFsDependencies,cursor});
});
