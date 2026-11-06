/* FT3D-8 · M2 (S4-D): where the Evolución page gets its data.
   - ?source=library&entry=…&subject=type:id&revision=… → the project SAVED in this browser's RUBIK library (same
     origin), its budget(s) (rubik-budget-v1), its construction record (plan + declared review) and the Mi estudio
     signature chosen for it. Identity is verified (entry + subject type:id); on any mismatch nothing is shown.
   - ?lab=1 → the Gate D lab with synthetic fixtures (QA only).
   - otherwise → nothing is loaded; the page asks to open a project from RUBIK.
   Classic script, runs before the modules: window.__ft3dSource. */
(function(){
 'use strict';
 const q=new URLSearchParams(location.search),R=window.FloorPlanConstructionRecord,A=window.FloorPlanConstructionProject,B=window.FloorPlanBudget,Brand=window.FloorPlanBrand;
 const mode=q.get('source')==='library'?'library':q.get('lab')==='1'?'lab':'none';
 document.documentElement.dataset.source=mode;
 const src=window.__ft3dSource={mode,error:null,entry:null,subject:null,record:null,input:null,requestedRevision:q.get('revision')||null,initialDate:q.get('date')||null,initialTask:q.get('task')||null};
 const fail=m=>{src.error=m;};
 if(mode==='library'){
  try{
   const lib=JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')||'null'),entry=lib?.entries?.find(e=>e.id===q.get('entry'));
   if(!entry)throw Error('No se encuentra este proyecto en tu biblioteca de este navegador. Vuelve a RUBIK y ábrelo desde la biblioteca.');
   const subject=R.subjectOf(entry);
   if(subject.type+':'+subject.id!==q.get('subject'))throw Error('El proyecto guardado no es el que se pidió: no se muestra nada para no mezclar datos de dos proyectos.');
   const doc=R.subjectDoc(entry);A.validateSource(doc);
   let record=null;try{record=R.open(localStorage).get(entry.id,subject);}catch(e){src.recordError=R.human(e);}
   let saved={};try{saved=JSON.parse(localStorage.getItem('rubik-budget-v1'))||{};}catch{}
   const parse=raw=>{try{return raw?B.parseBudget(JSON.stringify(raw)):null;}catch{return null;}};
   // One budget per 1.x project: the project's own, or one per level for a building (never summed, never mixed).
   const budgets=subject.type==='project'?[parse(saved[doc.id])].filter(Boolean):doc.levels.map(l=>parse(saved[l.project.id])).filter(Boolean);
   const snapshot=Brand?.snapshot(localStorage,entry.id,entry.name)||null;
   src.entry={id:entry.id,name:entry.name,activeLevelId:entry.activeLevelId??null};src.subject=subject;src.record=record;
   src.input={project:doc,budgets,selectedBudgetIds:null,schedule:record?.schedule||null,binding:record?.binding||null,
    brand:snapshot?{snapshot,appliesTo:{type:subject.type,id:subject.id}}:null,registeredParcel:null,parcelDocument:null};
  }catch(e){fail(e.message);}
 }
 // Messages to RUBIK (same origin only). RUBIK opens its own dialogs over this page; closing them returns here.
 src.toRubik=(action,data={})=>{if(window.parent!==window)window.parent.postMessage({type:'rubik-construction',action,...data},location.origin);return window.parent!==window;};
 src.embedded=window.parent!==window;
 // Inside RUBIK the page uses RUBIK's bar (status, mode and steps are mirrored there): one bar, more room for the house.
 if(mode==='library'&&src.embedded)document.documentElement.dataset.embedded='1';
 document.addEventListener('click',e=>{const b=e.target.closest('[data-rubik]');if(!b)return;e.preventDefault();src.toRubik(b.dataset.rubik,{...b.dataset});});
 // Every delivery generated here is recorded in the project's construction record, with the fingerprints it froze.
 src.recordDelivery=async(kind,manifest,extra={})=>{
  if(mode!=='library'||!src.entry)return null;
  // The project's Mi estudio signature at delivery time (RUBIK compares the current one with it).
  try{const brand=Brand.snapshot(localStorage,src.entry.id,src.entry.name);
   const f=await R.aspectFingerprints(A.fingerprint,{doc:src.input.project,schedule:src.input.schedule,budget:src.input.budgets.length===1?src.input.budgets[0]:null,brand});
   R.open(localStorage).addDelivery(src.entry.id,src.subject,{id:manifest.id,kind:'construction-evolution',output:kind,title:manifest.project?.name||src.entry.name,fingerprints:f,...extra});
   src.toRubik('delivered',{deliveryId:manifest.id});return f;
  }catch(e){console.error(e);return null;}
 };
})();
