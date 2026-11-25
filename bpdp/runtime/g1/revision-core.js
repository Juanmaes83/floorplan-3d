/* BP-DP · VIGENCIA (G1-D) · núcleo puro (UMD, sin DOM, sin escrituras).
 *
 * Huellas de la revisión observada para decidir si una representación o afirmación sigue vigente. NO es una autoridad
 * de versiones ni de persistencia: solo LEE el proyecto canónico (FloorPlanApp.project) y el registro de fuentes que se
 * le pase, y compara. RUBIK no ofrece hoy un evento público de «proyecto editado» (solo `floorplan-project-switched`
 * y `floorplan-level-switched`), así que quien lo use debe comprobar periódicamente; el coste se mide (G1-D).
 *
 * Dependencias de una afirmación (strings):
 *   'entity:<id>'   el elemento (cualquier campo, incluida su revisión `source.review`)
 *   'global:<k>'    scale | defaults | levels | meta (resto de campos de primer nivel, salvo fechas)
 *   'source:<key>'  lo que el registro de fuentes dice sobre esa afirmación
 * Estado: 'current' | 'stale' (cambió algo de lo que depende) | 'switched' (otro proyecto) | 'unverifiable'.
 * Es PEGAJOSO: una vez no vigente, solo una revalidación explícita (reconstruir desde el proyecto actual) lo devuelve a
 * vigente. Nunca se actualiza una afirmación en silencio.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikBpdpRevision=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const sortKeys=v=>Array.isArray(v)?v.map(sortKeys):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sortKeys(v[k])])):v;
 const canon=x=>JSON.stringify(sortKeys(x));
 // cyrb53: hash rápido NO criptográfico (solo para detectar cambios; la revisión registrada es SHA-256, la calcula quien llama).
 function hash(str){let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677);}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return (4294967296*(2097151&h2)+(h1>>>0)).toString(16).padStart(14,'0');}
 const ENTITY_ARRAYS=['walls','openings','rooms','objects'],DATES=new Set(['createdAt','updatedAt']);
 /** Huella de un proyecto (+ registro de fuentes). Lanza si no hay proyecto legible. */
 function fingerprint(project,sources){
  if(!project||typeof project!=='object'||typeof project.id!=='string')throw Object.assign(Error('Proyecto no legible'),{code:'UNVERIFIABLE'});
  const entities={},globals={},src={};
  for(const k of ENTITY_ARRAYS)for(const e of project[k]||[])if(e&&e.id)entities[e.id]=hash(canon(e));
  globals.scale=hash(canon(project.scale??null));globals.defaults=hash(canon(project.defaults??null));globals.levels=hash(canon(project.levels??null));
  const meta={};for(const k of Object.keys(project))if(!ENTITY_ARRAYS.includes(k)&&!DATES.has(k)&&!['scale','defaults','levels'].includes(k))meta[k]=project[k];globals.meta=hash(canon(meta));
  for(const s of Array.isArray(sources)?sources:[])for(const x of (s&&s.supports)||[])if(x&&x.key)src[x.key]=hash((src[x.key]||'')+canon(s));
  const content=hash(canon({e:entities,g:globals,s:src}));
  return Object.freeze({projectId:project.id,content,entities:Object.freeze(entities),globals:Object.freeze(globals),sources:Object.freeze(src)});
 }
 /** Diferencias entre dos huellas: ids de elementos, claves globales y claves de fuente que han cambiado. */
 function diff(a,b){
  if(!a||!b)return {switched:false,unverifiable:true,deps:new Set()};
  if(a.projectId!==b.projectId)return {switched:true,deps:new Set(['*'])};
  const deps=new Set();
  for(const id of new Set([...Object.keys(a.entities),...Object.keys(b.entities)]))if(a.entities[id]!==b.entities[id])deps.add('entity:'+id);
  for(const k of Object.keys(a.globals))if(a.globals[k]!==b.globals[k])deps.add('global:'+k);
  for(const k of new Set([...Object.keys(a.sources),...Object.keys(b.sources)]))if(a.sources[k]!==b.sources[k])deps.add('source:'+k);
  return {switched:false,deps};
 }
 /** ¿Le afecta el cambio a esta lista de dependencias? */
 const affects=(deps,d)=>d.switched||d.unverifiable||(Array.isArray(deps)&&deps.some(x=>d.deps.has(x)));
 /**
  * Vigilante con estado pegajoso. read() devuelve {project, sources}; puede lanzar (→ unverifiable).
  * check() es síncrono y barato (≈1 ms con el proyecto de referencia); quien lo usa decide cuándo llamarlo.
  */
 function watcher(read){
  let base=null,status={state:'current',changed:new Set(),reason:null,checks:0};
  function snap(){const r=read();return fingerprint(r&&r.project,r&&r.sources);}
  base=snap();
  function check(){status.checks++;let now;
   try{now=snap();}catch(e){if(status.state!=='switched')status={...status,state:'unverifiable',reason:e.code||'UNVERIFIABLE'};return view();}
   if(now.content===base.content&&now.projectId===base.projectId)return view();
   const d=diff(base,now);
   if(d.switched){status={...status,state:'switched',reason:'PROJECT_SWITCHED',changed:new Set(['*'])};return view();}
   const changed=new Set([...status.changed,...d.deps]);
   if(changed.size)status={...status,state:status.state==='current'?'stale':status.state,reason:status.reason||'PROJECT_CHANGED',changed};
   return view();
  }
  function view(){return Object.freeze({state:status.state,reason:status.reason,changed:[...status.changed].sort(),checks:status.checks,baseProjectId:base.projectId,baseContent:base.content});}
  /** ¿Sigue vigente algo que depende de `deps`? (si el estado global no es current, solo lo no afectado lo es) */
  function isCurrent(deps){if(status.state==='current')return true;if(status.state!=='stale')return false;return !deps.some(x=>status.changed.has(x));}
  return {check,view,isCurrent,base:()=>base};
 }
 return Object.freeze({fingerprint,diff,affects,watcher,hash,canon});
});
