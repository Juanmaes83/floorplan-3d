/* F0.1 · Expediente RUBIK (ADR de continuidad, docs/product/ADR-PERSISTENCIA-CONTINUIDAD-PROYECTO.md).
   One portable file that carries ONE library entry — a 1.x project or a building with its levels — together with the
   documents that hang from its project ids, so it can be kept, moved to another browser and restored without loss.
   It is not a second project engine:
   - Geometry and images keep the existing package layouts and validators. A project expediente IS a project ZIP
     (project.json + images/…, js/project-package.js) and a building expediente IS a building ZIP (building.json +
     manifest.json + levels/…, js/building-core.js); the expediente only adds `expediente.json` and `documents/…`.
   - Budgets stay FloorPlanBudgetV1 (js/budget-core.js validates them); review notes are carried as stored.
   - Restoring goes through the library's own import (js/project-library.js) with the same identity contract: the
     file's id is kept when it is free and replaced when it is taken; budgets follow the id they end up with. The work
     is recognised by content (contentId: geometry + real image bytes + documents), not by its local id.
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
 class ExpedienteError extends Error{constructor(code,message,extra){super(message);this.name='ExpedienteError';this.code=code;if(extra)Object.assign(this,extra);}}
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

 // ── Content identity ───────────────────────────────────────────────────────────────────────────────────────────
 // What makes two subjects «the same work», independently of the local ids a restore may assign: the geometry and its
 // metadata without project/building ids, every image by the SHA-256 of its REAL bytes (the fingerprint project-package
 // and building-core already write; no other integrity authority) and the documents with their project references
 // neutralised by level position. `imageToken(image, levelId)` returns the token of one image.
 async function contentId(subject,documents,imageToken){
  const s=clone(subject.kind==='building'?subject.building:subject.project);
  const levels=subject.kind==='building'?s.levels.map(l=>[l.id,l.project]):[[null,s]],docs={budgets:[],reviews:[]};
  for(const [i,[levelId,p]] of levels.entries()){
   for(const im of p.sourceImages||[]){const token=await imageToken(im,levelId);delete im.storage;delete im.bytes;delete im.originalFileName;im.sha256=token;}
   const id=p.id;delete p.id;
   const b=documents.budgets[id];if(b!==undefined){const c=clone(b);if(c.id===`bud_${id}`)c.id='bud_*';if(isObj(c.subject)&&c.subject.id===id)c.subject={...c.subject,id:'*'};docs.budgets.push([i,c]);}
   if(documents.reviews[id]!==undefined)docs.reviews.push([i,documents.reviews[id]]);
  }
  if(subject.kind==='building')delete s.id;
  return Package.digest(encoder.encode(JSON.stringify([subject.kind,s,docs])));
 }
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const subjectOf=e=>e.kind==='building'?{kind:'building',building:e.building}:{kind:'project',project:e.project};
 function documentsOf(subject,stores){const docs={budgets:{},reviews:{}};for(const p of projectsOf(subject))for(const k of ['budgets','reviews'])if(hasOwn(stores[k],p.id))docs[k][p.id]=stores[k][p.id];return docs;}
 const STORE_KEY={budgets:BUDGETS,reviews:REVIEWS};
 const readStores=storage=>({budgets:readStore(storage,BUDGETS).value,reviews:readStore(storage,REVIEWS).value});

 // ── Recovery journal ───────────────────────────────────────────────────────────────────────────────────────────
 // A restore writes to several independent stores (IndexedDB images, then budgets and reviews, then the library).
 // Before the first write it records what it is going to create; the record is removed once the library holds the
 // new entry. A record left behind (closed tab, crash, failed cleanup) is undone by recover(). Nothing is hidden: a
 // cleanup that fails is reported in the error and its record stays for recover().
 const JOURNAL='rubik-expediente-journal-v1',LOCK='rubik-sota-expediente';
 // One key per operation (`<JOURNAL>:<op>`), never a shared map: localStorage reaches other tabs with a delay, so a
 // read-modify-write of one shared value could bring back a record another tab had already removed.
 function readJournal(storage){const out={};for(let i=0;i<storage.length;i++){const k=storage.key(i);if(typeof k==='string'&&k.startsWith(JOURNAL+':')){let v;try{v=JSON.parse(storage.getItem(k));}catch{v=null;}out[k.slice(JOURNAL.length+1)]=v;}}return out;}
 const journalPut=(storage,op,record)=>storage.setItem(`${JOURNAL}:${op}`,JSON.stringify(record));
 const journalDrop=(storage,op)=>storage.removeItem(`${JOURNAL}:${op}`);
 // Web Locks serialise restore/recover across the tabs of this origin and are released if a tab dies.
 // Each tab keeps the collection in memory and a library write stores the WHOLE collection, so a tab that has not seen
 // another tab's change would erase it. A restore refuses to write from a stale copy.
 const STALE='Otra pestaña ha cambiado la biblioteca de proyectos. Recarga RUBIK antes de restaurar para no sobrescribir ese trabajo; no se ha cambiado nada.';
 function stale(library,storage){if(storage.getItem(Library.KEY)===null)return false;try{return JSON.stringify(Library.load(storage,Core.initial()).all())!==JSON.stringify(library.all());}catch{return true;}}
 const withLock=(locks,fn)=>locks&&typeof locks.request==='function'?locks.request(LOCK,fn):fn();
 const locksOf=ctx=>ctx.locks===undefined?globalThis.navigator?.locks:ctx.locks;

 /* restore(): adds what read() returned to the library as a NEW entry, with its images and documents.
    ctx: {library, storage, putImages(entries), removeImages(keys), getImage(key), visible (project on screen), name,
          copy (true = make a copy even if the same work is already here), locks}.
    Guarantees (see docs/contracts/expediente-v1.md §4):
    - Identity by content: the same work (geometry, real image bytes, documents) already stored → nothing is written.
    - Ids are decided BEFORE writing; documents and images are written first and the library last. The library write
      is a single atomic write and is the commit point: the new entry never appears without its documents.
    - It is NOT atomic across stores: what was written before a failure or a crash is undone (ordinary rollback), or
      later by recover() from the journal. A cleanup that fails is reported, never swallowed.
    - No existing budget or review is replaced; another tab's documents are re-read just before writing. */
 async function restore(parsed,ctx){return withLock(locksOf(ctx),()=>restoreLocked(parsed,ctx));}
 async function restoreLocked(parsed,{library,storage,putImages,removeImages,getImage,visible,name,copy=false}){
  const withBytes=parsed.source!=='project-json'&&parsed.source!=='building-json',images=parsed.images||[];
  if(stale(library,storage))fail('library-stale',STALE);let current=readStores(storage);
  // 1 · Same work already here?
  const tokens=new Map();for(const x of images)tokens.set(`${x.levelId||''}|${x.image.id}`,await Package.digest(x.bytes));
  const refToken=im=>`ref:${im.storage?.ref||im.id}`;
  const incomingToken=async(im,levelId)=>withBytes?tokens.get(`${levelId||''}|${im.id}`):refToken(im);
  const storedToken=async im=>{if(!withBytes)return refToken(im);const blob=getImage?await getImage(im.storage?.ref||im.id):null;return blob?Package.digest(new Uint8Array(await blob.arrayBuffer())):'missing:'+(im.storage?.ref||im.id);};
  const target=await contentId(parsed,parsed.documents,incomingToken);
  if(!copy){const shape=await contentId(parsed,parsed.documents,async()=>'');
   for(const e of library.all()){
    if((e.kind==='building')!==(parsed.kind==='building'))continue;const s=subjectOf(e),docs=documentsOf(s,current);
    if(await contentId(s,docs,async()=>'')===shape&&await contentId(s,docs,storedToken)===target)return {status:'already-present',entryId:e.id,contentId:target};
   }}
  // 2 · Final ids. A project keeps the file's id only if the library does not use it and no other document hangs from it.
  const subject=clone(parsed.kind==='building'?parsed.building:parsed.project),projects=parsed.kind==='building'?subject.levels.map(l=>l.project):[subject];
  const live=new Set(library.projects().map(p=>p.id)),mapping=[];
  for(const p of projects){const from=p.id,inUse=live.has(from),docsInUse=['budgets','reviews'].some(k=>hasOwn(current[k],from)&&!same(current[k][from],parsed.documents[k][from]));
   if(inUse||docsInUse)p.id=Core.id('prj');mapping.push({from,to:p.id,reason:inUse?'id-in-use':docsInUse?'documents-in-use':null});}
  if(parsed.kind==='building')Building.validate(subject);else Core.validate(subject);
  // 3 · Images: new local keys as the existing ZIP imports do. A JSON file carries references only, as before.
  const pending=[],missingImages=[],levelImages=parsed.kind==='building'?subject.levels.flatMap(l=>(l.project.sourceImages||[]).map(im=>[l.id,im])):(subject.sourceImages||[]).map(im=>[null,im]);
  for(const [levelId,im] of levelImages){
   if(!withBytes){if(!getImage||!await getImage(im.storage?.ref||im.id))missingImages.push(im.id);continue;}
   const found=images.find(x=>x.image.id===im.id&&(levelId===null||x.levelId===levelId));if(!found)fail('image-missing','Falta una imagen del proyecto en el expediente: '+im.id);
   const ref=Core.id('img');im.storage={kind:'local-browser',ref};pending.push([ref,new Blob([found.bytes],{type:im.mediaType})]);
  }
  // Documents to create, under the final ids (an identical one already there is reused, never rewritten).
  const planned={budgets:new Map(),reviews:new Map()};
  for(const {from,to} of mapping)for(const k of ['budgets','reviews']){const doc=parsed.documents[k][from];if(doc===undefined||hasOwn(current[k],to))continue;
   const c=clone(doc);if(k==='budgets'&&from!==to){if(c.id===`bud_${from}`)c.id=`bud_${to}`;c.subject={...c.subject,id:to};}planned[k].set(to,c);}
  // 4 · Journal first: if it cannot be written, nothing else is.
  const op=Core.id('exp');
  journalPut(storage,op,{startedAt:new Date().toISOString(),projectIds:mapping.map(m=>m.to),images:pending.map(p=>p[0]),documents:{budgets:[...planned.budgets.keys()],reviews:[...planned.reviews.keys()]}});
  const written={budgets:[],reviews:[]};
  async function abort(cause){
   const cleanup=[];
   for(const k of ['budgets','reviews'])if(written[k].length)try{const fresh=readStore(storage,STORE_KEY[k]).value;let changed=false;
    for(const id of written[k])if(hasOwn(fresh,id)&&same(fresh[id],planned[k].get(id))){delete fresh[id];changed=true;}if(changed)storage.setItem(STORE_KEY[k],JSON.stringify(fresh));}
    catch(e){cleanup.push({store:STORE_KEY[k],message:e.message});}
   if(pending.length)try{await removeImages(pending.map(p=>p[0]));}catch(e){cleanup.push({store:'rubik-sota-images-v1',message:e.message});}
   if(!cleanup.length)try{journalDrop(storage,op);}catch(e){cleanup.push({store:JOURNAL,message:e.message});}
   const why=cause&&cause.message?cause.message:String(cause);
   throw new ExpedienteError(cause&&cause.code||'restore-failed',cleanup.length
    ?`No se ha restaurado el expediente (${why}). No se ha añadido ningún proyecto, pero no se pudieron limpiar todos los restos (${cleanup.map(c=>c.store).join(', ')}); RUBIK los limpiará con recover() al volver a abrirse.`
    :`No se ha restaurado el expediente (${why}). No se ha añadido ni cambiado nada.`,{cause,cleanupPending:cleanup});
  }
  // 5 · Images (asynchronous; invisible until the library refers to them).
  try{if(pending.length)await putImages(pending);}catch(e){return abort(e);}
  // 6 · Documents, then the library (commit point). Synchronous: nothing else of this tab runs in between.
  let entryId,journalPending=false;
  try{
   if(stale(library,storage))fail('library-stale',STALE);current=readStores(storage);
   for(const k of ['budgets','reviews']){if(!planned[k].size)continue;const next=current[k];
    for(const [id,doc] of planned[k]){if(hasOwn(next,id))fail('document-conflict','Otra pestaña ha guardado un documento para ese proyecto mientras se restauraba; no se sobrescribe.');next[id]=doc;}
    storage.setItem(STORE_KEY[k],JSON.stringify(next));written[k]=[...planned[k].keys()];}
   const before=new Set(library.list().map(e=>e.id)),title=name||parsed.manifest?.subject?.name||subject.name;
   if(parsed.kind==='building')library.importBuilding(visible,subject,title);
   else library.importProject(visible,subject,title,{originProjectId:mapping[0].from!==mapping[0].to?mapping[0].from:undefined});
   entryId=library.activeId();if(before.has(entryId))fail('library-unchanged','La biblioteca no ha añadido el proyecto.');
  }catch(e){return abort(e);}
  try{journalDrop(storage,op);}catch{journalPending=true;}// committed; recover() drops the record later
  return {status:'restored',entryId,contentId:target,source:parsed.source,imagesIncluded:withBytes,
   projectIds:Object.fromEntries(mapping.map(m=>[m.from,m.to])),reidentified:mapping.filter(m=>m.from!==m.to),
   images:pending.length,missingImages,budgets:planned.budgets.size,reviews:planned.reviews.size,journalPending};
 }

 /* recover(): undoes what an interrupted or failed restore left behind, using the journal. A record whose projects are
    in the library was committed (only the record is removed). Otherwise its documents and images are removed if no
    project of the library uses them. Call it at start-up, before the person edits. Returns what it did. */
 async function recover(ctx){return withLock(locksOf(ctx),()=>recoverLocked(ctx));}
 async function recoverLocked({library,storage,removeImages}){
  const journal=readJournal(storage),projects=library.projects(),live=new Set(projects.map(p=>p.id));
  const liveImages=new Set(projects.flatMap(p=>(p.sourceImages||[]).map(i=>i.storage?.ref||i.id))),report={committed:0,rolledBack:0,pending:[]};
  for(const [op,r] of Object.entries(journal)){
   try{
    if(!isObj(r)||!Array.isArray(r.projectIds)||!Array.isArray(r.images)||!isObj(r.documents))fail('journal-invalid','Registro de recuperación incompleto.');
    if(r.projectIds.some(id=>live.has(id))){journalDrop(storage,op);report.committed++;continue;}
    for(const k of ['budgets','reviews']){const fresh=readStore(storage,STORE_KEY[k]).value;let changed=false;
     for(const id of r.documents[k]||[])if(!live.has(id)&&hasOwn(fresh,id)){delete fresh[id];changed=true;}if(changed)storage.setItem(STORE_KEY[k],JSON.stringify(fresh));}
    const orphans=r.images.filter(k=>!liveImages.has(k));if(orphans.length)await removeImages(orphans);
    journalDrop(storage,op);report.rolledBack++;
   }catch(e){report.pending.push({op,message:e.message});}
  }
  return report;
 }

 const api={FORMAT,VERSION,MANIFEST,MAX_ENTRIES,NOT_INCLUDED,JOURNAL,ExpedienteError,check,collect,pack,read,restore,recover,contentId};
 if(node)module.exports=api;else root.FloorPlanExpediente=api;
})(typeof globalThis==='object'?globalThis:this);
