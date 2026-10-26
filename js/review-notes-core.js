/* Client review by file, without a server (result 3, option A of
   docs/product/professional-client-experience-2026-10-21.md §11.1): observations about one identifiable version of a
   project, exchanged as `observaciones.json` (format rubik-sota.review-notes v1). An observation never edits the
   project: the professional decides, per observation, «Incorporar» (to do by hand) or «Descartar». */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanReviewNotes=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const FORMAT='rubik-sota.review-notes',VERSION=1,MAX_NOTES=200,MAX_TEXT=1000,MAX_NAME=80;
 // Short, stable version code of a project revision string (the same FNV-1a as the sheet's «Revisión»).
 function versionCode(revision){let h=2166136261;const s=String(revision);for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return (h>>>0).toString(16).padStart(8,'0');}
 const clean=(v,max)=>String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').trim().slice(0,max);
 const id=()=>'obs_'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
 function create(project,revision,{reviewer='',now=new Date().toISOString()}={}){
  if(!project?.id)throw Error('Proyecto no válido');
  return {format:FORMAT,version:VERSION,projectId:project.id,projectName:clean(project.name,120),versionCode:versionCode(revision),reviewer:clean(reviewer,MAX_NAME),createdAt:now,notes:[]};
 }
 // anchor: {kind:'project'} or {kind:'room', roomId, label}. The label is copied so the file reads on its own.
 function add(doc,{anchor,text},now=new Date().toISOString()){
  const body=clean(text,MAX_TEXT);if(!body)throw Error('Escribe la observación.');
  if(doc.notes.length>=MAX_NOTES)throw Error(`Como máximo ${MAX_NOTES} observaciones por archivo.`);
  const a=anchor?.kind==='room'&&anchor.roomId?{kind:'room',roomId:clean(anchor.roomId,80),label:clean(anchor.label,100)}:{kind:'project'};
  const note={id:id(),anchor:a,text:body,createdAt:now};return {...doc,notes:[...doc.notes,note]};
 }
 function remove(doc,noteId){return {...doc,notes:doc.notes.filter(n=>n.id!==noteId)};}
 // Strict reading of a received file: unknown fields are dropped, every text is bounded; throws a readable error.
 function read(value){
  const d=typeof value==='string'?JSON.parse(value):value;
  if(!d||d.format!==FORMAT)throw Error('No es un archivo de observaciones de Rubik.');
  if(d.version!==VERSION)throw Error('Versión de observaciones no admitida.');
  if(typeof d.projectId!=='string'||!d.projectId||typeof d.versionCode!=='string'||!/^[0-9a-f]{8}$/.test(d.versionCode))throw Error('Al archivo le falta la identidad del proyecto.');
  if(!Array.isArray(d.notes)||d.notes.length>MAX_NOTES)throw Error('Lista de observaciones no válida.');
  const notes=d.notes.map(n=>{const text=clean(n?.text,MAX_TEXT);if(!text||typeof n.id!=='string')throw Error('Hay una observación vacía o sin identificador.');
   const a=n.anchor?.kind==='room'&&typeof n.anchor.roomId==='string'?{kind:'room',roomId:clean(n.anchor.roomId,80),label:clean(n.anchor.label,100)}:{kind:'project'};
   return {id:clean(n.id,40),anchor:a,text,createdAt:clean(n.createdAt,40)};});
  if(new Set(notes.map(n=>n.id)).size!==notes.length)throw Error('Hay observaciones repetidas.');
  return {format:FORMAT,version:VERSION,projectId:clean(d.projectId,80),projectName:clean(d.projectName,120),versionCode:d.versionCode,reviewer:clean(d.reviewer,MAX_NAME),createdAt:clean(d.createdAt,40),notes};
 }
 // Which version the observations refer to, compared with the open project.
 function match(doc,project,revision){
  const sameProject=doc.projectId===project?.id,sameVersion=sameProject&&doc.versionCode===versionCode(revision);
  const rooms=new Set((project?.rooms||[]).map(r=>r.id));
  return {sameProject,sameVersion,missingRooms:doc.notes.filter(n=>n.anchor.kind==='room'&&!rooms.has(n.anchor.roomId)).map(n=>n.id)};
 }
 const DECISIONS=['pending','incorporate','discard'];
 // The professional's answer (format rubik-sota.review-response v1): per observation, received / planned («se
 // incorporará», a decision that changes nothing) / discarded / implemented in version X (declared by the
 // professional when the change is made, with the version code of the project at that moment). Texts are copied so
 // the client reads it on its own; no project data.
 const RESPONSE='rubik-sota.review-response',STATUS={pending:'received',incorporate:'planned',discard:'discarded'};
 function respond(doc,decisions,implemented,project,revision,now=new Date().toISOString()){
  if(doc.projectId!==project?.id)throw Error('La respuesta debe salir del mismo proyecto.');
  return {format:RESPONSE,version:1,projectId:project.id,projectName:clean(project.name,120),versionCode:versionCode(revision),answeredAt:now,notesCreatedAt:doc.createdAt,reviewer:doc.reviewer,
   items:doc.notes.map(n=>{const v=implemented?.[n.id];return v?{id:n.id,anchor:n.anchor,text:n.text,status:'implemented',implementedIn:v}:{id:n.id,anchor:n.anchor,text:n.text,status:STATUS[decisions?.[n.id]]||'received'};})};
 }
 function readResponse(value){
  const d=typeof value==='string'?JSON.parse(value):value;
  if(!d||d.format!==RESPONSE)throw Error('No es una respuesta de observaciones de Rubik.');
  if(d.version!==1||typeof d.projectId!=='string'||!/^[0-9a-f]{8}$/.test(d.versionCode||''))throw Error('Respuesta sin identidad válida.');
  if(!Array.isArray(d.items)||d.items.length>MAX_NOTES)throw Error('Lista de respuestas no válida.');
  const items=d.items.map(i=>{const status=['received','planned','discarded','implemented'].includes(i?.status)?i.status:null;if(!status||typeof i.id!=='string')throw Error('Respuesta con un estado no válido.');
   if(status==='implemented'&&!/^[0-9a-f]{8}$/.test(i.implementedIn||''))throw Error('Una observación implementada debe indicar su versión.');
   const a=i.anchor?.kind==='room'?{kind:'room',roomId:clean(i.anchor.roomId,80),label:clean(i.anchor.label,100)}:{kind:'project'};
   return {id:clean(i.id,40),anchor:a,text:clean(i.text,MAX_TEXT),status,...(status==='implemented'?{implementedIn:i.implementedIn}:{})};});
  return {format:RESPONSE,version:1,projectId:clean(d.projectId,80),projectName:clean(d.projectName,120),versionCode:d.versionCode,answeredAt:clean(d.answeredAt,40),notesCreatedAt:clean(d.notesCreatedAt,40),reviewer:clean(d.reviewer,MAX_NAME),items};
 }
 return {FORMAT,VERSION,MAX_TEXT,versionCode,create,add,remove,read,match,DECISIONS,RESPONSE,respond,readResponse};
});
