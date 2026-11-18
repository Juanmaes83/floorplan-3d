/* F0.1 · Expediente RUBIK (ADR de continuidad, docs/product/ADR-PERSISTENCIA-CONTINUIDAD-PROYECTO.md).
   One portable file that carries ONE library entry — a 1.x project or a building with its levels — together with the
   documents that hang from its project ids, so it can be kept, moved to another browser and restored without loss.
   It is not a second project engine:
   - Geometry and images keep the existing package layouts and validators. A project expediente IS a project ZIP
     (project.json + images/…, js/project-package.js) and a building expediente IS a building ZIP (building.json +
     manifest.json + levels/…, js/building-core.js); the expediente only adds `expediente.json` and `documents/…`.
   - Budgets stay FloorPlanBudgetV1 (js/budget-core.js validates them); review notes are carried as stored.
   - Restoring goes through the library's own import (js/project-library.js), so the identity contract is the same:
     the file's id is kept when it is free and replaced when it is taken; budgets follow the id they end up with.
   - The same reader accepts the historical project/building ZIPs and JSON files (they simply have no documents).
   Integrity: every file of the expediente is listed in `expediente.json` with its size and SHA-256 fingerprint and is
   checked before anything is written. A fingerprint detects altered or damaged content; it is NOT a signature and
   does not prove who produced the file.
   Deliberately NOT included (see the ADR, §16): the Assistant log (may hold personal data and is not needed to continue
   a project), the construction record (keyed by library entry; next cut), the studio tariff and brand profiles
   (studio-level, not project-level), published client links (they are deliverables, not the editable project) and
   variant links (local collection metadata that never travels).
   UMD: window.FloorPlanExpediente / module.exports. No network, no third-party code. */
(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports;
 const Core=node?require('./project-core.js'):root.FloorPlanCore,Building=node?require('./building-core.js'):root.FloorPlanBuilding;
 const Package=node?require('./project-package.js'):root.FloorPlanPackage,Tracing=node?require('./tracing-core.js'):root.FloorPlanTracing;
 const Budget=node?require('./budget-core.js'):root.FloorPlanBudget,Library=node?require('./project-library.js'):root.FloorPlanLibrary;
 const FORMAT='rubik-sota.expediente',VERSION=1,MANIFEST='expediente.json';
 const BUDGETS='rubik-budget-v1',REVIEWS='rubik-review-v1';
 const DOCUMENT=/^documents\/(budget|review)-[0-9]{3}\.json$/,SHA=/^[0-9a-f]{64}$/;
 const NOT_INCLUDED=Object.freeze(['assistant-log','construction-record','studio-tariff','brand-profiles','published-links','variant-links']);
 // Building ZIP limit + the manifest + one budget and one review per level.
 const MAX_ENTRIES=Building.MAX_ENTRIES+1+2*Building.LIMITS.levels;
 const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
 class ExpedienteError extends Error{constructor(code,message){super(message);this.name='ExpedienteError';this.code=code;}}
 const fail=(code,message)=>{throw new ExpedienteError(code,message);};
 const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
 const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
 const json=bytes=>{try{return JSON.parse(decoder.decode(bytes));}catch{return fail('invalid-json','El expediente contiene un documento que no es JSON válido.');}};
 const toBytes=v=>encoder.encode(JSON.stringify(v,null,2));

 // Names allowed in an expediente: the manifest, its documents and exactly the names the two package layouts allow.
 function check(name){
  if(name===MANIFEST||DOCUMENT.test(name))return name;
  try{return Package.path(name);}catch{}
  try{return Building.packagePath(name);}catch{}
  return fail('path-not-allowed','Ruta no permitida en el expediente: '+name);
 }
 // A document store in localStorage is {projectId: document}. Missing → {}. Corrupt → refuse, never overwrite it.
 function readStore(storage,key){
  const raw=storage.getItem(key);if(raw===null)return {raw,value:{}};
  let value;try{value=JSON.parse(raw);}catch{value=null;}
  if(!isObj(value))fail('store-invalid',`Los datos guardados en «${key}» no son válidos; no se ha cambiado nada.`);
  return {raw,value};
 }
 const projectsOf=subject=>subject.kind==='building'?subject.building.levels.map(l=>l.project):[subject.project];

 /* collect(): what one library entry is made of, read from the current storage. Synchronous and read-only. */
 function collect({library,storage,entryId}){
  const id=entryId||library.activeId(),entry=library.all().find(e=>e.id===id);
  if(!entry)fail('entry-not-found','Proyecto no encontrado en la biblioteca.');
  const subject=entry.kind==='building'?{kind:'building',name:entry.name,building:clone(entry.building)}:{kind:'project',name:entry.name,project:clone(entry.project)};
  const budgets=readStore(storage,BUDGETS).value,reviews=readStore(storage,REVIEWS).value,docs={budgets:{},reviews:{}};
  for(const p of projectsOf(subject)){
   if(Object.prototype.hasOwnProperty.call(budgets,p.id)){
    try{Budget.validateBudget(budgets[p.id]);}catch(e){fail('budget-invalid',`El presupuesto guardado de «${p.name}» no es válido; corrígelo antes de exportar. ${e.message}`);}
    docs.budgets[p.id]=clone(budgets[p.id]);
   }
   if(Object.prototype.hasOwnProperty.call(reviews,p.id)){if(!isObj(reviews[p.id]))fail('review-invalid',`Las observaciones guardadas de «${p.name}» no son válidas.`);docs.reviews[p.id]=clone(reviews[p.id]);}
  }
  return {...subject,documents:docs};
 }

 /* pack(): the expediente as a ZIP Blob. `getImage(key)` resolves a stored image Blob (FloorPlanImages.get). */
 async function pack(collected,{getImage,now=()=>new Date().toISOString()}){
  let entries,subjectId;
  if(collected.kind==='building'){
   const getBytes=async im=>{const blob=await getImage(im.storage.ref||im.id);return blob?new Uint8Array(await blob.arrayBuffer()):null;};
   ({entries}=await Building.packageEntries(collected.building,getBytes,Tracing.imageInfo));subjectId=collected.building.id;
  }else{
   // The 1.x writer prepares sidecar references, sizes and fingerprints; reading its output back checks it too.
   const blob=await Package.encode(collected.project,getImage);entries=await Package.unzip(await blob.arrayBuffer());subjectId=collected.project.id;
  }
  const documents={budgets:[],reviews:[]};let n=0;
  for(const [kind,list] of [['budget',documents.budgets],['review',documents.reviews]])
   for(const [projectId,doc] of Object.entries(collected.documents[kind+'s'])){const path=`documents/${kind}-${String(++n).padStart(3,'0')}.json`;entries.set(path,toBytes(doc));list.push({projectId,path});}
  const files=[];for(const [path,bytes] of entries)files.push({path,bytes:bytes.length,sha256:await Package.digest(bytes)});
  const manifest={format:FORMAT,version:VERSION,createdAt:now(),subject:{kind:collected.kind,id:subjectId,name:collected.name},files,documents,notIncluded:[...NOT_INCLUDED]};
  entries.set(MANIFEST,toBytes(manifest));
  return {archive:Package.zip(entries,{check}),manifest};
 }

 async function unzipAny(buffer){
  const options={check,maxEntries:MAX_ENTRIES,jsonNames:[MANIFEST,'project.json','building.json','manifest.json']};
  try{return await Package.unzip(buffer,{...options,required:'project.json'});}
  catch(e){if(!/^ZIP sin project\.json/.test(e.message))throw e;return Package.unzip(buffer,{...options,required:'building.json'});}
 }

 /* read(): validates a file completely and returns what it holds, before anything is written anywhere.
    Accepts an expediente, a historical project or building ZIP, or a project or building JSON. */
 async function read(buffer,{decodeImage}={}){
  const bytes=new Uint8Array(buffer);let first=0;while(first<bytes.length&&/\s/.test(String.fromCharCode(bytes[first])))first++;
  if(bytes[first]===0x7b){// JSON: a historical project or building file, without images or documents.
   const text=decoder.decode(bytes),value=JSON.parse(text);
   if(Building.isBuilding(value))return {kind:'building',building:Building.prepare(value),images:[],documents:{budgets:{},reviews:{}},source:'building-json'};
   return {kind:'project',project:Core.prepare(text).project,images:[],documents:{budgets:{},reviews:{}},source:'project-json'};
  }
  const entries=await unzipAny(buffer),building=entries.has('building.json');
  if(building&&entries.has('project.json'))fail('layout-mixed','El expediente mezcla un proyecto y un edificio.');
  const documents={budgets:{},reviews:{}};let source=building?'building-zip':'project-zip',manifest=null;
  if(entries.has(MANIFEST)){
   manifest=json(entries.get(MANIFEST));source='expediente';
   if(!isObj(manifest)||manifest.format!==FORMAT)fail('manifest-invalid','expediente.json no es un manifiesto de expediente RUBIK.');
   if(manifest.version!==VERSION)fail('version-unsupported',`Esta versión de RUBIK no sabe leer expedientes de la versión ${manifest.version}.`);
   if(!isObj(manifest.subject)||manifest.subject.kind!==(building?'building':'project'))fail('manifest-invalid','El manifiesto no coincide con el contenido del expediente.');
   if(!Array.isArray(manifest.files)||!isObj(manifest.documents))fail('manifest-invalid','El manifiesto no lista los archivos del expediente.');
   const listed=new Set();
   for(const f of manifest.files){
    if(!isObj(f)||typeof f.path!=='string'||f.path===MANIFEST||listed.has(f.path)||!Number.isInteger(f.bytes)||!SHA.test(f.sha256||''))fail('manifest-invalid','El manifiesto tiene una entrada repetida o incompleta.');
    listed.add(f.path);const content=entries.get(f.path);
    if(!content)fail('file-missing','Falta un archivo del expediente: '+f.path);
    if(content.length!==f.bytes||await Package.digest(content)!==f.sha256)fail('fingerprint-mismatch','El archivo '+f.path+' no coincide con su huella SHA-256: el expediente está dañado o se ha modificado.');
   }
   if(listed.size!==entries.size-1)fail('file-unlisted','El expediente contiene archivos que su manifiesto no lista.');
   for(const kind of ['budgets','reviews']){
    const list=manifest.documents[kind];if(!Array.isArray(list))fail('manifest-invalid','El manifiesto no describe los documentos.');
    for(const d of list){
     if(!isObj(d)||typeof d.projectId!=='string'||!DOCUMENT.test(d.path||'')||!d.path.startsWith(`documents/${kind.slice(0,-1)}-`)||!entries.has(d.path)||Object.prototype.hasOwnProperty.call(documents[kind],d.projectId))fail('manifest-invalid','Documento del expediente repetido o mal descrito.');
     documents[kind][d.projectId]=json(entries.get(d.path));
    }
   }
  }
  const layout=new Map([...entries].filter(([name])=>name!==MANIFEST&&!DOCUMENT.test(name)));
  const used=Object.values(documents).reduce((n,x)=>n+Object.keys(x).length,0);
  if(entries.size-layout.size-(manifest?1:0)!==used)fail('file-unlisted','El expediente contiene documentos que su manifiesto no describe.');
  let result;
  if(building){const r=await Building.readEntries(layout,Tracing.imageInfo);result={kind:'building',building:r.building,images:r.images};}
  else{const r=await Package.validateEntries(layout,decodeImage);result={kind:'project',project:r.project,images:r.images.map(x=>({image:x.image,bytes:x.bytes}))};}
  if(manifest&&manifest.subject.id!==(building?result.building.id:result.project.id))fail('manifest-invalid','El manifiesto describe otro proyecto.');
  const ids=new Set(projectsOf(result).map(p=>p.id));
  for(const [projectId,doc] of Object.entries(documents.budgets)){
   if(!ids.has(projectId))fail('document-orphan','Un presupuesto del expediente no pertenece a ninguno de sus proyectos.');
   try{Budget.validateBudget(doc);}catch(e){fail('budget-invalid','Un presupuesto del expediente no es válido: '+e.message);}
   if(doc.subject.type!=='project'||doc.subject.id!==projectId)fail('budget-invalid','Un presupuesto del expediente apunta a otro proyecto.');
  }
  for(const [projectId,doc] of Object.entries(documents.reviews))if(!ids.has(projectId)||!isObj(doc))fail('document-orphan','Unas observaciones del expediente no pertenecen a ninguno de sus proyectos.');
  return {...result,documents,source,manifest};
 }

 // Equality used to recognise an expediente that is already in the library: the image *storage* differs by design
 // (sidecar in the file, local key in the browser), the content does not.
 function comparable(subject){
  const s=clone(subject.kind==='building'?subject.building:subject.project);
  for(const p of subject.kind==='building'?s.levels.map(l=>l.project):[s])for(const im of p.sourceImages||[]){delete im.storage;delete im.bytes;delete im.sha256;delete im.originalFileName;}
  return JSON.stringify(s);
 }
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

 /* restore(): adds what read() returned to the library as a NEW entry, with its images and documents.
    ctx: {library, storage, putImages(entries), removeImages(keys), visible (project on screen), name}.
    Nothing is overwritten: an existing budget or review is never replaced. If the same content is already stored
    (same id, same geometry, same documents), nothing is written and its entry is reported. On any failure every write
    of this call is undone and the collection is left as it was. */
 async function restore(parsed,{library,storage,putImages,removeImages,visible,name}){
  const stores={budgets:readStore(storage,BUDGETS),reviews:readStore(storage,REVIEWS)};
  const incoming=projectsOf(parsed),key={budgets:BUDGETS,reviews:REVIEWS};
  const docsMatch=(id,target)=>['budgets','reviews'].every(k=>same(parsed.documents[k][id],stores[k].value[target]));
  // 1 · Already here? Same subject id, same content and the same documents → nothing to do.
  const target=comparable(parsed);
  for(const e of library.all()){
   if(e.kind!==(parsed.kind==='building'?'building':undefined))continue;
   const stored=e.kind==='building'?{kind:'building',building:e.building}:{kind:'project',project:e.project};
   const sameId=parsed.kind==='building'?e.building.id===parsed.building.id:e.project.id===parsed.project.id;
   if(sameId&&comparable(stored)===target&&incoming.every(p=>docsMatch(p.id,p.id)))return {status:'already-present',entryId:e.id};
  }
  // 2 · A project id that is free in the library but still has documents of another project (e.g. left behind by a
  // deleted entry) gets a new id here, so neither those documents nor the incoming ones are lost.
  const subject=clone(parsed.kind==='building'?parsed.building:parsed.project),stored=new Set(library.projects().map(p=>p.id)),preassigned=[];
  for(const p of parsed.kind==='building'?subject.levels.map(l=>l.project):[subject])
   if(!stored.has(p.id)&&['budgets','reviews'].some(k=>Object.prototype.hasOwnProperty.call(stores[k].value,p.id)&&!same(stores[k].value[p.id],parsed.documents[k][p.id]))){const from=p.id;p.id=Core.id('prj');preassigned.push({from,to:p.id});}
  if(parsed.kind==='building')Building.validate(subject);else Core.validate(subject);
  // 3 · Images: new local keys, exactly as the existing ZIP imports do.
  const pending=[],levelImages=parsed.kind==='building'?subject.levels.flatMap(l=>(l.project.sourceImages||[]).map(im=>[l.id,im])):(subject.sourceImages||[]).map(im=>[null,im]);
  for(const [levelId,im] of levelImages){
   const found=parsed.images.find(x=>x.image.id===im.id&&(levelId===null||x.levelId===levelId));if(!found)fail('image-missing','Falta una imagen del proyecto en el expediente: '+im.id);
   const ref=Core.id('img');im.storage={kind:'local-browser',ref};pending.push([ref,new Blob([found.bytes],{type:im.mediaType})]);
  }
  if(pending.length)await putImages(pending);
  const before={activeId:library.activeId(),entries:new Set(library.list().map(e=>e.id))},written=[];
  let entryId=null;
  try{
   // 4 · The library decides the final ids (identity contract) in one atomic write.
   const title=name||parsed.manifest?.subject?.name||subject.name;
   if(parsed.kind==='building')library.importBuilding(visible,subject,title);else library.importProject(visible,subject,title);
   entryId=library.activeId();if(before.entries.has(entryId))fail('library-unchanged','La biblioteca no ha añadido el proyecto.');
   const finalIds=parsed.kind==='building'?new Map(library.building().levels.map(l=>[l.id,l.project.id])):null;
   const originalIds=parsed.kind==='building'?parsed.building.levels.map(l=>[l.project.id,finalIds.get(l.id)]):[[parsed.project.id,library.project().id]];
   // 5 · Documents follow the id each project ended up with. Never over an existing document.
   for(const k of ['budgets','reviews']){
    const next=clone(stores[k].value);let n=0;
    for(const [from,to] of originalIds){
     const doc=parsed.documents[k][from];if(doc===undefined)continue;
     if(Object.prototype.hasOwnProperty.call(next,to)){if(same(next[to],doc))continue;fail('document-conflict','Ya hay un documento guardado para ese proyecto; no se sobrescribe.');}
     const copy=clone(doc);if(k==='budgets'&&from!==to){if(copy.id===`bud_${from}`)copy.id=`bud_${to}`;copy.subject={...copy.subject,id:to};}
     next[to]=copy;n++;
    }
    if(n){storage.setItem(key[k],JSON.stringify(next));written.push(k);}
   }
   const reidentified=originalIds.filter(([a,b])=>a!==b).map(([from,to])=>({from,to}));
   return {status:'restored',entryId,projectIds:Object.fromEntries(originalIds),reidentified,preassigned,images:pending.length,
    budgets:Object.keys(parsed.documents.budgets).length,reviews:Object.keys(parsed.documents.reviews).length,source:parsed.source};
  }catch(e){
   for(const k of written){try{if(stores[k].raw===null)storage.removeItem?.(key[k]);else storage.setItem(key[k],stores[k].raw);}catch{}}
   if(entryId&&!before.entries.has(entryId)){try{library.remove(entryId);library.open(before.activeId);}catch{}}
   if(pending.length){try{await removeImages(pending.map(p=>p[0]));}catch{}}
   throw e;
  }
 }

 const api={FORMAT,VERSION,MANIFEST,MAX_ENTRIES,NOT_INCLUDED,ExpedienteError,check,collect,pack,read,restore,LIBRARY_KEY:Library.KEY};
 if(node)module.exports=api;else root.FloorPlanExpediente=api;
})(typeof globalThis==='object'?globalThis:this);
