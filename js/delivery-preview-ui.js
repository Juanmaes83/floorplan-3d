/* ENT-01 I1B — only the professional's local visual preview. No upload, publication, credentials or changes to permission.
   The screenshot and 3D visit are generated from this browser's current canonical project through the strict
   FloorPlanClientDelivery snapshot and sent only to the same-origin preview window. */
(function(){
 'use strict';
 if(window.RUBIK_DELIVERY)return;
 const app=window.FloorPlanApp,Delivery=window.FloorPlanClientDelivery;
 if(!app||!Delivery)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent)=>{const b=el('button',text,parent,'btn');b.type='button';return b;};
 const sessions=new Map();
 function eligible(){return !(app.levelContext?.levels>1) && (app.project?.rooms||[]).length>0 && (app.project?.walls||[]).length>0;}
 function decision(){
  const project=app.project,Core=window.FloorPlanPresentationCore;
  if(!Core)return [];
  let saved;try{saved=JSON.parse(localStorage.getItem(Core.key(app.entryId,project.id))||'null');}catch{return [];}
  const known=new Set((project.rooms||[]).map(r=>r.id));
  const roomIds=[...new Set((Array.isArray(saved?.roomIds)?saved.roomIds:[]).filter(id=>known.has(id)))];
  return roomIds.length?[{projectId:project.id,levelId:null,roomIds}]:[];
 }
 function snapshot(){
  if(!eligible())throw Error(tx('Esta primera prueba está disponible para proyectos de una planta con estancias y muros. Usa «Proyecto de ejemplo».','This first test supports single-level projects with rooms and walls. Use the example project.','目前只支持单层项目，请使用示例项目。'));
  const project=app.project,revision=FloorPlanGuide.revision(project),versionCode=window.FloorPlanReviewNotes?.versionCode(revision)||'';
  const snap=Delivery.buildSnapshot({project,presentation:{sidecars:decision()},revision,versionCode,title:project.name,lang:typeof LANG==='string'?LANG:'es',studio:{name:''}});
  return Delivery.validate(snap,{bytes:new Blob([JSON.stringify(snap)]).size});
 }
 addEventListener('message',event=>{
  if(event.origin!==location.origin||event.data?.type!=='rubik-delivery-ready')return;
  const state=sessions.get(event.source);if(!state||event.source?.closed)return;
  event.source.postMessage({type:'rubik-delivery-snapshot',snapshot:state},location.origin);
  sessions.delete(event.source);
 });
 function preview(){
  const payload=snapshot();
  const url=new URL('./?entrega=vista-previa',location.href);
  const win=window.open(url.href,'_blank');
  if(!win)throw Error(tx('El navegador ha bloqueado la pestaña. Permite abrir la vista previa de RUBIK.','Your browser blocked the preview tab. Please allow pop-ups from RUBIK.','浏览器阻止了预览窗口。'));
  sessions.set(win,payload);return win;
 }
 function card(container){
  if(!container)return;
  container.querySelector('#delivery3dCard')?.remove();
  const card=el('article',undefined,container,'professional-card delivery3d-card');card.id='delivery3dCard';card.dataset.module='client-3d';
  const figure=el('figure',undefined,card,'is-scheme');
  if(!window.FloorPlanProjectPreview?.axonometric(figure))el('span',tx('Proyecto 3D','3D project','三维项目'),figure);
  const body=el('div',undefined,card,'delivery3d-body');
  el('h3',tx('Visita 3D interactiva · prueba privada','Interactive 3D visit · private test','三维参观·私人测试'),body);
  el('p',tx('Explora el modelo real desde el punto de vista del cliente. Esta prueba NO publica ningún enlace ni envía datos a servidores. Usa solo el proyecto de ejemplo.','Explore the real model as a client. This test does NOT publish a link or upload project data. Use the example project only.','仅在本地预览，不上传或发布项目。'),body,'delivery3d-lead');
  el('p',tx('Incluye recorrido libre, plano de estancias para desplazarte y, si la preparaste, presentación guiada. Sin editor.','Includes free walking, a clickable room map, and the guided presentation if prepared. No editor.','自由漫游、平面导航、可选展示，不可编辑。'),body,'delivery3d-meta');
  const actions=el('div',undefined,body,'delivery3d-actions'),b=btn(tx('Revisar como cliente','Review as a client','作为客户预览'),actions);
  b.id='delivery3dPreview';b.dataset.emphasis='accent';b.disabled=!eligible();
  const result=el('p',b.disabled?tx('Selecciona «Proyecto de ejemplo» para habilitar esta prueba.','Select the example project to enable the test.','请选择示例项目。'):'',body,'delivery3d-meta');
  result.id='delivery3dMessage';result.setAttribute('role','status');
  b.onclick=()=>{try{preview();result.textContent=tx('Vista previa abierta. No se ha publicado nada.','Preview opened. Nothing was published.','预览已打开，未发布。');}catch(e){result.textContent=e.message;}};
 }
 window.FloorPlanDeliveryPreview=Object.freeze({snapshot,preview,card,eligible});
})();