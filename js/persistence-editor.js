/* F0.2b: start the editor only after its authoritative snapshot is ready. */
(function(){
 'use strict';
 const P=window.FloorPlanPersistence,template=document.getElementById('editorScripts');
 const editor=document.querySelector('.app'),openButton=document.getElementById('persistenceOpen');
 const isolated=window.RUBIK_DELIVERY||new URLSearchParams(location.search).get('demo')==='dibujo-vivo';
 const enabled=P.isTestOrigin()&&!isolated;
 let persistenceDialog;
 const runtime=window.FloorPlanPersistenceEditor={storage:null,session:null,requireSaved,openComparison};

 function loadProject(projectKey){
  const storage=runtime.storage,loadedProject=window.FloorPlanCore.load(storage,projectKey);
  let library,libraryError;
  try{library=window.FloorPlanLibrary.load(storage,loadedProject.project);}
  catch(e){libraryError=e.message;}
  return {loadedProject,library,libraryError};
 }
 async function requireSaved(userEvent){
  if(!enabled)return {status:'saved',revision:null,outdated:false};
  if(!runtime.session)throw Error('El almacenamiento del editor no está disponible.');
  const state=await runtime.session.flush({userEvent});
  const outdated=state.outdated||(await runtime.session.currentRevision())!==state.revision;
  if(state.status!=='saved'||outdated)throw state.error||Error(outdated
   ?'Hay una revisión más reciente en otra pestaña. Recarga RUBIK antes de continuar.'
   :'Los cambios aún no están confirmados. Vuelve a intentarlo.');
  return state;
 }
 async function openComparison(href){
  if(!enabled){window.open(href,'_blank','noopener');return;}
  // Reserve the popup during the trusted click, then publish only a confirmed handoff.
  const popup=window.open('about:blank','_blank');
  if(!popup)return notify('El navegador ha bloqueado la pestaña de Comparar.');
  popup.opener=null;
  try{await requireSaved();popup.location.replace(new URL(href,location.href).href);}
  catch(e){popup.close();notify(e.message);}
 }
 function download(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
 function notify(message){
  const toast=document.getElementById('toast');
  if(typeof window.toast==='function')window.toast(message,6000);
  else if(toast)toast.textContent=message;
 }
 function add(parent,tag,label){
  const n=document.createElement(tag);n.textContent=label;parent.append(n);return n;
 }
 function button(parent,label,action){
  const b=add(parent,'button',label);b.className='btn';b.type='button';
  b.onclick=async e=>{
   b.disabled=true;
   try{await action(e);}catch(err){persistenceDialog.message.textContent=err.message;}
   finally{b.disabled=false;}
  };
  return b;
 }
 function statusText(s){
  if(s.status==='conflict')return s.error?.code==='conflict-unsaved'?'Conflicto · cambios sin copia':'Conflicto recuperable';
  if(s.status==='error')return 'Cambios sin guardar';
  if(s.status==='pending')return 'Guardado pendiente';
  if(s.status==='saving')return 'Guardando…';
  if(s.outdated)return 'Hay otra revisión';
  if(P.KEYS.slice(0,2).every(key=>runtime.storage.getItem(key)===null))return 'Sin proyecto guardado';
  return s.mirror?.ok===false?'Guardado local · copia anterior pendiente':'Guardado local';
 }
 async function showStatus(startError){
  if(!persistenceDialog){
   const dialog=add(document.body,'dialog','');dialog.id='persistenceDialog';dialog.setAttribute('aria-labelledby','persistenceTitle');
   const title=add(dialog,'h2','Guardado local');title.id='persistenceTitle';
   const summary=add(dialog,'p',''),message=add(dialog,'p',''),quota=add(dialog,'p',''),actions=add(dialog,'div',''),records=add(dialog,'ul','');
   summary.setAttribute('role','status');message.setAttribute('role','alert');
   persistenceDialog={dialog,summary,message,quota,actions,records};
   if(!startError)button(actions,'Cerrar',()=>dialog.close());
   button(actions,'Recargar RUBIK',async()=>{
    const session=runtime.session, state=session&&await session.flush();
    if(state&&(state.pending||state.status==='saving'||state.status==='error'))throw state.error||Error('Exporta una copia de emergencia antes de recargar.');
    location.reload();
   });
   button(actions,'Exportar copia de emergencia',async()=>{
    const session=runtime.session;
    if(!session)throw Error('El almacenamiento sigue sin abrirse. Recarga RUBIK en este navegador para recuperar los datos.');
    download(await session.emergencyExport(),'rubik-copia-emergencia.json');
   });
   if(!startError)button(actions,'Reintentar guardado',async event=>{
    const state=await runtime.session.flush({userEvent:event});
    if(state.status==='error')throw state.error;
    await refreshRecovery();
   });
  }
  const {dialog,summary,message}=persistenceDialog;
  if(startError){summary.textContent='No se ha abierto el editor.';message.textContent=startError.message;
   dialog.addEventListener('cancel',e=>e.preventDefault());
  }
  if(!dialog.open)dialog.showModal();
  if(runtime.session)await refreshRecovery();
 }
 async function refreshRecovery(){
  const {records,quota,message,summary}=persistenceDialog,session=runtime.session,s=session.state();
  summary.textContent=statusText(s);
  message.textContent=s.error?.message||s.mirror?.message||'';
  records.replaceChildren();
  const saved=await session.conflicts();
  for(const item of saved.reverse()){
   const row=add(records,'li','Revisión '+item.revision+' · '+new Date(item.at).toLocaleString()+' ');
   button(row,'Exportar versión',async()=>download(await session.conflictExport(item.id),'rubik-recuperacion-'+item.id+'.json'));
   button(row,'Recuperar versión',async()=>{
    if(!confirm('¿Abrir esta versión de toda la biblioteca? La versión confirmada actual quedará disponible en Recuperación.'))return;
    await session.adoptConflict(item.id);
    location.reload();
   });
  }
  quota.textContent='';
  const {estimate,persisted}=await session.storageStatus();
  if(estimate?.quota>0){const mb=n=>Math.round(n/1048576);
   quota.textContent='Espacio del sitio: '+mb(estimate.usage||0)+' de '+mb(estimate.quota)+' MB.'
    +(persisted===true?' El navegador concedió almacenamiento persistente.':'');}
 }
 function attachStatus(session){
  const label=document.getElementById('persistenceStatus');
  let protecting=false;
  const protect=e=>{e.preventDefault();e.returnValue=true;};
  const render=s=>{
   label.textContent=statusText(s);label.dataset.state=s.status;
   const warn=s.pending>0||s.status==='saving'||s.status==='error'||s.error?.code==='conflict-unsaved';
   if(warn&&!protecting)addEventListener('beforeunload',protect);
   if(!warn&&protecting)removeEventListener('beforeunload',protect);
   protecting=warn;
   if(persistenceDialog?.dialog.open){
    persistenceDialog.summary.textContent=statusText(s);
    persistenceDialog.message.textContent=s.error?.message||s.mirror?.message||'';
   }
  };
  openButton.hidden=false;openButton.onclick=()=>showStatus().catch(e=>{persistenceDialog.message.textContent=e.message;});
  render(session.state());session.subscribe(render);
  if(session.state().diverged.length)notify('Se encontró una versión de otro RUBIK. Está disponible en Guardado local.');
 }
 function activate(source,marker){
  const script=document.createElement('script');
  for(const {name,value} of source.attributes)script.setAttribute(name,value);
  script.async=false;
  script.textContent=source.textContent;
  if(!source.src&&source.type!=='module'){marker.replaceWith(script);return Promise.resolve();}
  return new Promise((resolve,reject)=>{
   script.onload=resolve;script.onerror=()=>reject(Error('No se pudo cargar '+(source.getAttribute('src')||'el visor 3D')+'.'));
   marker.replaceWith(script);
  });
 }
 async function start(){
  editor.inert=true;
  if(!enabled){
   try{runtime.storage=localStorage;}
   catch{runtime.storage={getItem:()=>null,setItem:()=>{throw Error('Almacenamiento local no disponible.');}};}
   if(isolated&&!window.RUBIK_DELIVERY){
    const values=new Map();
    runtime.storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
   }
  }else{
   runtime.session=await P.session();
   runtime.storage=runtime.session.storage;
   attachStatus(runtime.session);
  }
  const projectKey=P.KEYS[0];
  const bootstrap=loadProject(projectKey);
  if(enabled&&(bootstrap.libraryError||runtime.storage.getItem(window.FloorPlanLibrary.KEY)===null
   &&runtime.storage.getItem(projectKey)!==null&&!bootstrap.loadedProject.saved))
   throw Error('No se pudo leer el proyecto guardado. '+(bootstrap.libraryError||bootstrap.loadedProject.message));
  runtime.bootstrap=bootstrap;
  // Keep the existing classic-script order, and start the deferred renderer after the classic UI.
  const fragment=template.content, plan=[...fragment.querySelectorAll('script')].map(source=>{
   const marker=document.createComment('editor script');source.replaceWith(marker);return {source,marker};
  });
  template.replaceWith(fragment);
  const modules=[],group=[];
  for(const {source,marker} of plan){
   if(source.type==='module'){modules.push({source,marker});continue;}
   if(!source.src)await Promise.all(group.splice(0));
   group.push(activate(source,marker));
  }
  await Promise.all(group);
  if(!window.FloorPlanApp)throw Error('No se pudo iniciar la aplicación.');
  for(const {source,marker} of modules)void activate(source,marker).catch(e=>notify(e.message));
  editor.inert=false;
  document.documentElement.dataset.editorReady='true';
 }
 start().catch(e=>showStatus(e));
})();
