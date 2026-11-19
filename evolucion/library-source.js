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
 // ?demo=obra: public demo of the example house (js/construction-demo-core.js), built in memory; never reads or writes storage.
 const mode=q.get('source')==='library'?'library':q.get('demo')!==null?'demo':q.get('lab')==='1'?'lab':'none';
 document.documentElement.dataset.source=mode;
 const src=window.__ft3dSource={mode,error:null,entry:null,subject:null,record:null,input:null,requestedRevision:q.get('revision')||null,initialDate:q.get('date')||null,initialTask:q.get('task')||null};
 const fail=m=>{src.error=m;};
 const P=window.FloorPlanPersistence,enabled=P.isTestOrigin(),embedded=window.parent!==window;
 let session,loadedIdentity,bridge;
 const loadedAt=new Date().toISOString();
 function readSource(storage){
   const lib=JSON.parse(storage.getItem('rubik-sota-project-library-v1')||'null'),entry=lib?.entries?.find(e=>e.id===q.get('entry'));
   if(!entry)throw Error('No se encuentra este proyecto en tu biblioteca de este navegador. Vuelve a RUBIK y ábrelo desde la biblioteca.');
   const subject=R.subjectOf(entry);
   if(subject.type+':'+subject.id!==q.get('subject'))throw Error('El proyecto guardado no coincide con el solicitado.');
   const doc=R.subjectDoc(entry);A.validateSource(doc);
   let record=null,recordError=null;try{record=R.open(storage).get(entry.id,subject);}catch(e){recordError=R.human(e);}
   let saved={};try{saved=JSON.parse(storage.getItem('rubik-budget-v1'))||{};}catch{}
   const parse=raw=>{try{return raw?B.parseBudget(JSON.stringify(raw)):null;}catch{return null;}};
   const budgets=(subject.type==='project'?[saved[doc.id]]:doc.levels.map(l=>saved[l.project.id])).map(parse).filter(Boolean);
   const snapshot=Brand?.snapshot(storage,entry.id,entry.name,loadedAt)||null;
   return {entry:{id:entry.id,name:entry.name,activeLevelId:entry.activeLevelId??null},subject,record,recordError,
    input:{project:doc,budgets,selectedBudgetIds:null,schedule:record?.schedule||null,binding:record?.binding||null,
      brand:snapshot?{snapshot,appliesTo:{type:subject.type,id:subject.id}}:null,registeredParcel:null,parcelDocument:null}};
 }
 const identity=source=>JSON.stringify({entry:source.entry,subject:source.subject,input:source.input,recordError:source.recordError});
 async function loadLibrary(){
   let source;
   if(!enabled)source=readSource(localStorage);
   else{
    if(embedded){
     bridge=window.parent.FloorPlanConstructionUI?.evolutionBridge(window);
     if(!bridge)throw Error('Abre Evolución desde el editor de RUBIK.');
    }else session=await P.session();
    const {docs}=await P.readConfirmed();
    source=readSource({getItem:key=>P.KEYS.includes(key)?docs.get(key)??null:localStorage.getItem(key)});
   }
   if(src.requestedRevision&&await A.fingerprint(source.input.project)!==src.requestedRevision)
    throw Error('El proyecto guardado ha cambiado. Vuelve a abrir Evolución desde RUBIK.');
   loadedIdentity=identity(source);
   Object.assign(src,source);
   return src.input;
 }
 if(mode==='library')src.ready=loadLibrary().catch(e=>{fail(e.message);return null;});
 if(mode==='demo'){
  const D=window.FloorPlanConstructionDemo;
  src.demo=q.get('demo');
  src.ready=(D?D.build(src.demo):Promise.reject(Error('La demostración no está disponible en esta versión.'))).then(input=>{src.input=input;return input;})
   .catch(e=>{fail('No se ha podido preparar la demostración: '+(e&&e.message||e)+'. Vuelve a la página de inicio de RUBIK e inténtalo de nuevo.');return null;});
 }
 // Messages to RUBIK (same origin only). RUBIK opens its own dialogs over this page; closing them returns here.
 src.toRubik=(action,data={})=>{if(window.parent!==window)window.parent.postMessage({type:'rubik-construction',action,...data},location.origin);return window.parent!==window;};
 src.embedded=embedded;
 // Inside RUBIK the page uses RUBIK's bar (status, mode and steps are mirrored there): one bar, more room for the house.
 if(mode==='library'&&src.embedded)document.documentElement.dataset.embedded='1';
 // D-09: Escape works with the focus inside this page too: first it closes the element panel, then it returns to RUBIK.
 if(mode==='library'&&src.embedded)document.addEventListener('keydown',e=>{if(e.key!=='Escape'||e.defaultPrevented||document.querySelector('dialog[open]'))return;
  const pick=document.getElementById('pickInfo');if(pick&&!pick.hidden){e.preventDefault();const c=[...pick.querySelectorAll('button')].find(x=>/Cerrar/.test(x.textContent));if(c)c.click();else pick.hidden=true;return;}
  e.preventDefault();src.toRubik('close');});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-rubik]');if(!b)return;e.preventDefault();src.toRubik(b.dataset.rubik,{...b.dataset});});
 // Every delivery generated here is recorded in the project's construction record, with the fingerprints it froze.
 src.recordDelivery=async(kind,manifest,extra={})=>{
  if(mode!=='library'||!src.entry)return null;
  if(src.recordError)throw Error(src.recordError);
  const f=await R.aspectFingerprints(A.fingerprint,{doc:src.input.project,schedule:src.input.schedule,
   budget:src.input.budgets.length===1?src.input.budgets[0]:null,brand:src.input.brand?.snapshot||null});
  const delivery={id:manifest.id,kind:'construction-evolution',output:kind,title:manifest.project?.name||src.entry.name,
   fingerprints:f,withVideo:extra.withVideo===true,bytes:extra.bytes??null,sha256:extra.sha256??null};
  if(bridge){
   const confirmed=await bridge.register({entryId:src.entry.id,subject:src.subject.type+':'+src.subject.id,
    requestedRevision:src.requestedRevision,delivery});
   if(confirmed.id!==delivery.id||!Number.isSafeInteger(confirmed.revision))throw Error('Confirmación local de la entrega inválida.');
  }else if(session){
   const state=await session.flush();
   if(state.status!=='saved'||state.outdated||identity(readSource(session.storage))!==loadedIdentity)
    throw state.error||Error('Los datos de la entrega han cambiado. Vuelve a abrir Evolución.');
   const store=R.open(session.storage),prior=store.get(src.entry.id,src.subject)?.deliveries.find(d=>d.id===delivery.id);
   if(prior&&Object.keys(delivery).some(k=>JSON.stringify(prior[k])!==JSON.stringify(delivery[k])))
    throw Error('Ese identificador de entrega ya está registrado con otros datos.');
   if(!prior)store.addDelivery(src.entry.id,src.subject,delivery);
   const confirmed=await session.flush();
   if(confirmed.status!=='saved')throw confirmed.error||Error('El registro de entrega sigue pendiente.');
  }else R.open(localStorage).addDelivery(src.entry.id,src.subject,delivery);
  if(!bridge)src.toRubik('delivered',{deliveryId:delivery.id});
  return f;
 };
})();
