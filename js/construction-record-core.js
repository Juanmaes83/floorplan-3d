/* FT3D-8 · M2 (S4-A): the construction record of ONE subject of the RUBIK library.
   It stores what had no home before M2 — the construction plan, its reviewed binding, the history of price changes
   applied through Presupuestar and the metadata of local deliveries — next to the subject, never inside it:
   - it never rewrites the project/building geometry nor the budget (both keep their own authority and storage);
   - identity is subject type + id (project.id | building.id) inside one library entry (entry.id is collection
     metadata). Names never identify anything;
   - a plan is accepted only if its projectRef is this subject; its revision is checked, never assumed;
   - unknown versions are rejected; nothing is migrated silently.
   Storage: localStorage['rubik-construction-v1'] = {schema, schemaVersion, records:{"<entryId>|<type>:<id>": record}}.
   Pure core with injected storage (testable in Node). */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./construction-schedule-core.js'):root.FloorPlanConstructionSchedule);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanConstructionRecord=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Schedule){
  'use strict';
  const KEY='rubik-construction-v1',SCHEMA='rubik-sota.construction-record',VERSION='0.1.0';
  const LIMITS=Object.freeze({plans:6,planHistory:40,priceHistory:200,deliveries:40,storeBytes:4*1024*1024});
  const RESULTS=Object.freeze(['match','mismatch','obsolete','absent','unverifiable']);
  class RecordError extends Error{constructor(code,message){super(message||code);this.name='RecordError';this.code=code;}}
  const fail=(code,message)=>{throw new RecordError(code,message);};
  const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
  const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
  const SHA=/^[0-9a-f]{64}$/;
  const MESSAGES=Object.freeze({
    'record-version-unsupported':'Los datos de obra de este navegador tienen una versión que esta versión de RUBIK no sabe leer. No se ha cambiado nada.',
    'record-invalid':'Los datos de obra guardados en este navegador no son válidos. No se ha cambiado nada.',
    'schedule-other-project':'El plan pertenece a otro proyecto: no se guarda aquí.',
    'subject-required':'Abre un proyecto de tu biblioteca para trabajar con su plan de obra.',
    'storage-full':'No hay espacio en este navegador para guardar el plan. Libera espacio (por ejemplo, imágenes de proyectos que no uses) y vuelve a intentarlo.',
    'storage-unavailable':'Este navegador no permite guardar datos. El plan no se ha guardado.'});
  const human=e=>e&&MESSAGES[e.code]||e?.message||String(e);

  /* ---------- identity ---------- */
  // Subject of a library entry as FloorPlanLibrary stores it ({id,name,project} | {id,name,kind:'building',building,activeLevelId}).
  function subjectOf(entry){
    if(!isObj(entry)||typeof entry.id!=='string')fail('subject-required');
    if(entry.kind==='building'){
      const b=entry.building;if(!isObj(b)||typeof b.id!=='string')fail('subject-required');
      return {entryId:entry.id,type:'building',id:b.id,name:entry.name,activeLevelId:entry.activeLevelId??null,
        levels:b.levels.map(l=>({id:l.id,name:l.name,order:l.order,projectId:l.project.id}))};
    }
    if(!isObj(entry.project)||typeof entry.project.id!=='string')fail('subject-required');
    return {entryId:entry.id,type:'project',id:entry.project.id,name:entry.name,activeLevelId:null,
      levels:[{id:null,name:null,order:0,projectId:entry.project.id}]};
  }
  const subjectDoc=entry=>entry.kind==='building'?entry.building:entry.project;
  const keyOf=(entryId,subject)=>{
    if(typeof entryId!=='string'||!entryId||!subject||!['project','building'].includes(subject.type)||typeof subject.id!=='string'||!subject.id)fail('subject-required');
    return entryId+'|'+subject.type+':'+subject.id;
  };
  // Subject ids present in more than one library entry (e.g. the same file imported twice): never merged.
  function duplicateSubjects(entries){
    const seen=new Map();
    for(const e of entries){let s;try{s=subjectOf(e);}catch{continue;}const k=s.type+':'+s.id;seen.set(k,[...(seen.get(k)||[]),e.id]);}
    return [...seen].filter(([,ids])=>ids.length>1).map(([k,ids])=>({subject:k,entryIds:ids}));
  }

  /* ---------- validation ---------- */
  const empty=()=>({schema:SCHEMA,schemaVersion:VERSION,records:{}});
  function validRecord(key,r){
    if(!isObj(r)||r.key!==key||typeof r.entryId!=='string'||!isObj(r.subject)||keyOf(r.entryId,r.subject)!==key)fail('record-invalid');
    if(!Array.isArray(r.plans)||r.plans.length>LIMITS.plans)fail('record-invalid');
    const ids=new Set();
    for(const p of r.plans){try{Schedule.validate(p);}catch(e){fail('record-invalid','Plan guardado no válido: '+e.message);}
      if(p.projectRef.type!==r.subject.type||p.projectRef.id!==r.subject.id||ids.has(p.id))fail('record-invalid');ids.add(p.id);}
    if(r.selectedScheduleId!==null&&!ids.has(r.selectedScheduleId))fail('record-invalid');
    // `schedule` is the explicitly selected plan (derived, kept for readers); never a guess among several.
    r.schedule=r.selectedScheduleId?r.plans.find(p=>p.id===r.selectedScheduleId):null;
    if(r.binding!==null&&!(isObj(r.binding)&&isObj(r.binding.fingerprints)&&SHA.test(r.binding.fingerprints.project||'')))fail('record-invalid');
    for(const k of ['planHistory','deliveries'])if(!Array.isArray(r[k]))fail('record-invalid');
    if(!isObj(r.priceHistory))fail('record-invalid');
    return r;
  }
  function parseStore(text){
    if(text===null||text===undefined||text==='')return empty();
    let s;try{s=JSON.parse(text);}catch{fail('record-invalid');}
    if(!isObj(s)||s.schema!==SCHEMA)fail('record-invalid');
    if(s.schemaVersion!==VERSION)fail('record-version-unsupported');
    if(!isObj(s.records))fail('record-invalid');
    for(const [k,r] of Object.entries(s.records))validRecord(k,r);
    return s;
  }
  const newRecord=(entryId,subject)=>({key:keyOf(entryId,subject),entryId,subject:{type:subject.type,id:subject.id},
    plans:[],selectedScheduleId:null,schedule:null,binding:null,planHistory:[],priceHistory:{},deliveries:[],updatedAt:null});

  /* ---------- pure updates (return a new store) ---------- */
  function withRecord(store,entryId,subject,fn,at){
    const next=clone(store),key=keyOf(entryId,subject),r=next.records[key]?clone(next.records[key]):newRecord(entryId,subject);
    fn(r);r.updatedAt=at;validRecord(key,r);next.records[key]=r;return next;
  }
  const bounded=(list,n)=>list.slice(Math.max(0,list.length-n));
  function putSchedule(store,entryId,subject,schedule,{at,action='save',select=true}){
    let s;try{s=Schedule.validate(schedule);}catch(e){throw new RecordError('schedule-invalid',e.message);}
    if(s.projectRef.type!==subject.type||s.projectRef.id!==subject.id)fail('schedule-other-project');
    return withRecord(store,entryId,subject,r=>{
      // The previous review binding is kept: its fingerprints make it `obsolete` (visible), never silently dropped.
      const i=r.plans.findIndex(p=>p.id===s.id);
      if(i>=0)r.plans[i]=s;else{if(r.plans.length>=LIMITS.plans)fail('plans-limit','Cada proyecto guarda hasta '+LIMITS.plans+' planes. Elimina uno antes de crear otro.');r.plans.push(s);}
      if(select||!r.selectedScheduleId)r.selectedScheduleId=s.id;r.planHistory=bounded([...r.planHistory,{at,action,scheduleId:s.id,tasks:s.tasks.length,revision:s.projectRef.revision,review:s.review.status}],LIMITS.planHistory);
    },at);
  }
  function removeSchedule(store,entryId,subject,scheduleId,{at}){
    return withRecord(store,entryId,subject,r=>{const p=r.plans.find(x=>x.id===scheduleId);if(!p)fail('record-invalid','Plan no encontrado');
      r.planHistory=bounded([...r.planHistory,{at,action:'remove',scheduleId:p.id,tasks:p.tasks.length,revision:p.projectRef.revision,review:p.review.status}],LIMITS.planHistory);
      r.plans=r.plans.filter(x=>x.id!==scheduleId);if(r.binding?.scheduleId===scheduleId)r.binding=null;
      // Removing the selected plan never selects another one silently.
      if(r.selectedScheduleId===scheduleId)r.selectedScheduleId=null;},at);
  }
  function selectSchedule(store,entryId,subject,scheduleId,{at}){
    return withRecord(store,entryId,subject,r=>{if(scheduleId!==null&&!r.plans.some(p=>p.id===scheduleId))fail('record-invalid','Plan no encontrado');r.selectedScheduleId=scheduleId;
      r.planHistory=bounded([...r.planHistory,{at,action:'select',scheduleId}],LIMITS.planHistory);},at);
  }
  // A copy is a new draft plan (new id, review reset); the original stays saved and selected until the professional chooses.
  function duplicateSchedule(schedule,{id,title}={}){const s=Schedule.validate(schedule);
    return Schedule.create({id,projectRef:{...s.projectRef},source:title||s.source+' (copia)',tasks:JSON.parse(JSON.stringify(s.tasks)),review:{status:'draft',by:null,at:null}});}
  function putBinding(store,entryId,subject,binding,{at}){
    return withRecord(store,entryId,subject,r=>{if(!r.schedule||binding.scheduleId!==r.schedule.id)fail('record-invalid','El vínculo no corresponde al plan guardado');r.binding=clone(binding);},at);
  }
  function addPriceChange(store,entryId,subject,budgetSubjectId,change,{at}){
    if(typeof budgetSubjectId!=='string'||!budgetSubjectId)fail('record-invalid');
    return withRecord(store,entryId,subject,r=>{r.priceHistory[budgetSubjectId]=bounded([...(r.priceHistory[budgetSubjectId]||[]),{at,...clone(change)}],LIMITS.priceHistory);},at);
  }
  function addDelivery(store,entryId,subject,delivery,{at}){
    if(!isObj(delivery)||!/^dlv_/.test(delivery.id||''))fail('record-invalid','Entrega sin identificador dlv_');
    return withRecord(store,entryId,subject,r=>{if(r.deliveries.some(d=>d.id===delivery.id))return;r.deliveries=bounded([...r.deliveries,{at,...clone(delivery)}],LIMITS.deliveries);},at);
  }

  /* ---------- correspondence (S1 vocabulary) ---------- */
  // now: {subject:{type,id}, revision:<sha of the subject>, budgetFingerprint, brandFingerprint, siteFingerprint}
  function correspondence(record,now){
    const out=[];
    const push=(aspect,result,code,detail={})=>out.push({aspect,result,code,...detail});
    if(!record||!record.schedule){push('plan','absent','planning-unavailable');}
    else{
      const ref=record.schedule.projectRef;
      if(ref.type!==now.subject.type||ref.id!==now.subject.id)push('plan','mismatch','schedule-other-project');
      else if(ref.revision!==now.revision)push('plan','obsolete','schedule-project-revision-obsolete',{expected:ref.revision,current:now.revision});
      else push('plan','match','schedule-current');
    }
    if(!record||!record.binding)push('review','absent','plan-not-reviewed');
    else{
      const f=record.binding.fingerprints;
      if(f.project!==now.revision)push('review','obsolete','binding-project-revision-obsolete');
      else if(f.schedule&&now.scheduleFingerprint&&f.schedule!==now.scheduleFingerprint)push('review','obsolete','binding-schedule-revision-obsolete');
      else if(f.budget!==undefined&&f.budget!==null&&now.budgetFingerprint&&f.budget!==now.budgetFingerprint)push('review','obsolete','binding-budget-revision-obsolete');
      else push('review','match','binding-current');
    }
    // C1-C4 does not store the project revision (DEC-07): never claimed as a match.
    push('budget-revision','unverifiable','budget-revision-not-in-contract');
    const last=record?.deliveries?.at(-1)||null;
    if(!last)push('delivery','absent','delivery-none');
    else{
      // Every aspect frozen in the delivery is compared with its current fingerprint (null = absent on both sides).
      const current={project:now.revision,schedule:now.scheduleFingerprint??null,budget:now.budgetFingerprint??null,brand:now.brandFingerprint??null,site:now.siteFingerprint??null};
      const f=last.fingerprints||{},changed=Object.keys(current).filter(k=>k in f&&(f[k]??null)!==current[k]);
      push('delivery',changed.length?'obsolete':'match',changed.length?'delivery-obsolete':'delivery-current',{changed,deliveryId:last.id});
    }
    return out;
  }

  /* ---------- links: one index for the three directions ---------- */
  function links(schedule){
    const s=Schedule.canonical(schedule),byItem=new Map(),byElement=new Map(),byTask=new Map();
    for(const t of s.tasks){
      byTask.set(t.id,{task:t,items:t.budgetAllocations.map(a=>({...a})),elements:t.elements.map(e=>({...e}))});
      for(const a of t.budgetAllocations){if(!byItem.has(a.itemId))byItem.set(a.itemId,[]);byItem.get(a.itemId).push({taskId:t.id,title:t.title,wbs:t.wbs,sharePercent:a.sharePercent});}
      for(const e of t.elements){if(!byElement.has(e.elementId))byElement.set(e.elementId,[]);byElement.get(e.elementId).push({taskId:t.id,title:t.title,wbs:t.wbs,role:e.role});}
    }
    // Elements of an item = elements of the tasks that carry it (the plan has no direct item↔element link).
    const elementsOfItem=itemId=>[...new Set((byItem.get(itemId)||[]).flatMap(x=>byTask.get(x.taskId).elements.map(e=>e.elementId)))];
    const allocatedPercent=itemId=>(byItem.get(itemId)||[]).reduce((sum,x)=>sum+Math.round(x.sharePercent*100),0)/100;
    return {byItem,byElement,byTask,elementsOfItem,allocatedPercent};
  }

  /* ---------- ids ---------- */
  const hex=n=>{const a=new Uint8Array(n);(globalThis.crypto?.getRandomValues?globalThis.crypto.getRandomValues(a):a.forEach((_,i)=>a[i]=Math.floor(Math.random()*256)));return [...a].map(x=>x.toString(16).padStart(2,'0')).join('');};
  const newId=prefix=>prefix+'_'+hex(8);

  /* ---------- stateful store over injected storage ---------- */
  function open(storage){
    if(!storage||typeof storage.getItem!=='function')fail('storage-unavailable');
    let store=parseStore(storage.getItem(KEY));
    const commit=next=>{const text=JSON.stringify(next);if(text.length>LIMITS.storeBytes)fail('storage-full');
      try{storage.setItem(KEY,text);}catch(e){fail(e&&e.name==='QuotaExceededError'?'storage-full':'storage-unavailable');}store=next;return next;};
    const now=()=>new Date().toISOString();
    return {
      get:(entryId,subject)=>clone(store.records[keyOf(entryId,subject)]||null),
      all:()=>clone(store),
      saveSchedule:(entryId,subject,schedule,opts={})=>commit(putSchedule(store,entryId,subject,schedule,{at:now(),...opts})).records[keyOf(entryId,subject)],
      removeSchedule:(entryId,subject,scheduleId)=>commit(removeSchedule(store,entryId,subject,scheduleId,{at:now()})).records[keyOf(entryId,subject)],
      selectSchedule:(entryId,subject,scheduleId)=>commit(selectSchedule(store,entryId,subject,scheduleId,{at:now()})).records[keyOf(entryId,subject)],
      saveBinding:(entryId,subject,binding)=>commit(putBinding(store,entryId,subject,binding,{at:now()})).records[keyOf(entryId,subject)],
      addPriceChange:(entryId,subject,budgetSubjectId,change)=>commit(addPriceChange(store,entryId,subject,budgetSubjectId,change,{at:now()})).records[keyOf(entryId,subject)],
      addDelivery:(entryId,subject,delivery)=>commit(addDelivery(store,entryId,subject,delivery,{at:now()})).records[keyOf(entryId,subject)],
      reload(){store=parseStore(storage.getItem(KEY));return clone(store);}
    };
  }

  return Object.freeze({KEY,SCHEMA,VERSION,LIMITS,RESULTS,MESSAGES,RecordError,human,
    subjectOf,subjectDoc,keyOf,duplicateSubjects,empty,parseStore,putSchedule,removeSchedule,selectSchedule,duplicateSchedule,putBinding,addPriceChange,addDelivery,
    correspondence,links,newId,open});
});
