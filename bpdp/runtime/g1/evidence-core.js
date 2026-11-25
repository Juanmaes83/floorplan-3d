/* BP-DP · (copia PREMIUM de G1 ac65aa6 + actor 'synthetic-fixture') · Servicio de evidencia COMPARTIDO por Blueprint 3D y Despiece 3D (núcleo puro, UMD, sin DOM). Versión G1.
 *
 * Origen del contrato: heritage-blueprint-skill@f5e7c53 `references/evidence.md` (MIT): estados de certeza, una fuente por
 * afirmación y «lo que no tiene respaldo es desconocido». GENERALISE para RUBIK (FloorPlanProjectV1).
 *
 * G1 · cambio de contrato respecto al baseline f3360fc (justificado en G1-B-EVIDENCIA.md):
 *  - «Documentado» exige una FUENTE documental identificable (id), con versión, accesible en el contexto autorizado y
 *    vinculada a ESA afirmación (clave) con ESE valor. Ni `source.review === 'confirmed'` ni `structureSource ===
 *    'professional'` ni la existencia de una malla en View3D bastan (en el baseline sí bastaban: era incorrecto).
 *  - «Reportado»: declarado por un actor o fuente identificados, sin respaldo documental suficiente.
 *  - «Estimado»: inferido o calculado con supuestos conocidos (toda medida derivada del modelo, con cualquier escala).
 *  - «Desconocido»: ausente, sin actor identificado (p. ej. valor de plantilla), contradictorio o no acreditable.
 *    Nunca se eleva un desconocido a reportado.
 *  - Se separan cuatro cosas que el baseline mezclaba: REGISTRO del modelo (identidad y geometría: hechos del proyecto,
 *    sin escala de certeza), ESTADO DE REVISIÓN (source.review, se muestra aparte), DECLARACIONES y FUENTES documentales.
 *  - Una fuente privada puede respaldar en un contexto autorizado, pero su detalle no se expone en audiencia pública.
 * RUBIK hoy NO tiene un registro de fuentes documentales por afirmación: el registro se pasa explícitamente (`sources`).
 * Sin registro, ninguna afirmación puede ser «Documentado» (dependencia documentada; no se inventan fuentes).
 * No escribe nada.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikBpdpEvidence=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const CERTAINTY=Object.freeze({documented:{es:'Documentado',en:'Documented'},reported:{es:'Reportado',en:'Reported'},estimated:{es:'Estimado',en:'Estimated'},unknown:{es:'Desconocido',en:'Unknown'}});
 const METHOD={imported:'importado de un archivo',manual:'dibujado en RUBIK',suggested:'sugerido por el asistente',template:'plantilla de ejemplo'};
 const REVIEW={confirmed:'revisado por una persona',unreviewed:'sin revisar'};
 // Actores identificados que pueden DECLARAR (→ Reportado). La plantilla no es un actor: sus valores no están declarados.
 const ACTORS=Object.freeze({professional:'el profesional (declarado en RUBIK)',imported:'el archivo importado',
  'pending-review':'una declaración pendiente de revisión',user:'la persona que dibujó el elemento en RUBIK',reviewer:'la persona que revisó el elemento',
  'synthetic-fixture':'el fixture SINTÉTICO de demostración (no describe ninguna vivienda real)'});
 const NOT_MODELLED=Object.freeze([
  {id:'hidden-structure',es:'Estructura portante oculta (pilares, vigas, forjados)',reason:'El proyecto no modela elementos estructurales ocultos.'},
  {id:'foundation',es:'Cimentación',reason:'El proyecto no modela la cimentación.'},
  {id:'services',es:'Instalaciones empotradas (agua, electricidad, climatización)',reason:'El proyecto no modela instalaciones ocultas.'},
  {id:'wall-layers',es:'Capas constructivas de muros (aislamiento, cámaras, acabados interiores)',reason:'Los muros se modelan como volúmenes con espesor, sin capas.'}]);
 const r1=v=>Math.round(v*10)/10;
 const isUnknown=v=>v==null||v==='unknown'||v==='';

 /** Estado de revisión del ELEMENTO (no es una certeza): se muestra aparte de las afirmaciones. */
 function reviewOf(el){const s=el&&el.source;if(!s||!s.method)return {method:null,review:null,text:'Sin procedencia registrada'};
  return {method:s.method,review:s.review||null,text:[METHOD[s.method]||s.method,REVIEW[s.review]||s.review].filter(Boolean).join(' · ')};}
 const provenanceOf=reviewOf; // compatibilidad con el baseline

 /** Validación de una entrada del registro de fuentes. Devuelve los motivos por los que NO puede respaldar. */
 function sourceProblems(s){const p=[];if(!s||typeof s!=='object')return ['malformed'];
  if(typeof s.id!=='string'||!s.id)p.push('no-id');if(typeof s.version!=='string'||!s.version)p.push('no-version');
  if(s.accessible!==true)p.push('inaccessible');if(!Array.isArray(s.supports))p.push('no-supports');return p;}
 const same=(a,b,tol)=>typeof a==='number'&&typeof b==='number'?Math.abs(a-b)<=(tol||0):String(a)===String(b);

 /** Referencia de fuente para mostrar: una privada solo se detalla en audiencia autorizada. */
 function refOf(s,audience){if(s.exposure==='private'&&audience!=='authorized')return {id:null,title:'Fuente privada (no se muestra)',version:null,exposure:'private'};
  return {id:s.id,title:s.title||s.id,version:s.version,exposure:s.exposure||'public'};}

 /**
  * Evalúa UNA afirmación. kind:
  *  'measure'      medida derivada de la geometría del modelo (scale = project.scale)
  *  'declaration'  valor declarado (declaredBy = clave de ACTORS o null si nadie lo declaró)
  *  'inference'    inferencia automática (p. ej. sugerencia no revisada)
  *  'not-modelled' el proyecto no lo modela
  * sources: registro explícito [{id,title,version,accessible,exposure,supports:[{key,value,tolerance?}]}]
  */
 function assess({key,label,value,display,kind,declaredBy=null,scale=null,sources=[],audience='public',unit=null}){
  if(typeof key!=='string'||!key)throw Error('evidence: cada afirmación necesita una clave estable');
  const out={key,claim:label,value:display!=null?display:value,valueRaw:value,unit,kind,certainty:'unknown',basis:kind,justification:[],sources:[],issues:[]};
  if(kind==='not-modelled'){out.value='No modelado';out.justification.push('El proyecto no modela este aspecto; no se infiere de la apariencia 3D.');return freeze(out);}
  const regs=Array.isArray(sources)?sources:[];
  const touching=regs.filter(s=>s&&Array.isArray(s.supports)&&s.supports.some(x=>x&&x.key===key));
  const supports=touching.filter(s=>s.supports.some(x=>x.key===key&&same(x.value,value,x.tolerance)));
  const contradicts=touching.filter(s=>s.supports.some(x=>x.key===key&&!same(x.value,value,x.tolerance)));
  const valid=s=>sourceProblems(s).length===0;
  if(isUnknown(value)){out.value='Desconocido';out.justification.push('El proyecto no contiene este dato.');
   if(touching.some(valid))out.issues.push('source-without-model-value');return freeze(out);}
  if(contradicts.some(valid)){out.issues.push('contradictory');out.sources=contradicts.filter(valid).map(s=>refOf(s,audience));
   out.justification.push('Una fuente documental verificable afirma otro valor: la afirmación es contradictoria y queda Desconocido hasta resolverla.');return freeze(out);}
  const good=supports.filter(valid),bad=supports.filter(s=>!valid(s));
  for(const s of bad)out.issues.push('source-unverifiable:'+sourceProblems(s).join('+'));
  if(good.length){out.certainty='documented';out.basis='document';out.sources=good.map(s=>refOf(s,audience));
   out.justification.push(...good.map(s=>s.exposure==='private'&&audience!=='authorized'?'Respaldada por una fuente privada accesible en el contexto autorizado (detalle no expuesto).':`Respaldada por «${s.title||s.id}», versión ${s.version}.`));return freeze(out);}
  if(bad.length)out.justification.push('Hay una fuente registrada para esta afirmación, pero no es verificable (sin versión o inaccesible): no eleva la certeza.');
  if(kind==='measure'){const conf=(scale&&scale.confidence)||'desconocida';out.certainty='estimated';out.basis='derived-geometry';out.scaleConfidence=conf;
   out.justification.push(`Calculada a partir de la geometría del modelo con escala «${conf}»${scale&&scale.method?` (método ${scale.method})`:''}. No es una medición ni una cota certificada.`);return freeze(out);}
  if(kind==='inference'){out.certainty='estimated';out.basis='inference';out.justification.push('Inferencia automática no revisada por una persona.');return freeze(out);}
  if(kind==='declaration'){
   if(declaredBy&&ACTORS[declaredBy]){out.certainty='reported';out.basis='declaration';out.declaredBy=declaredBy;
    out.justification.push(`Declarado por ${ACTORS[declaredBy]}; no hay documento que lo respalde. No es una certificación técnica.`);
    if(declaredBy==='pending-review')out.issues.push('pending-review');return freeze(out);}
   out.proposed=out.value;out.value='Desconocido';out.issues.push('no-identified-actor');
   out.justification.push(`Nadie lo ha declarado${value!=null?` (el modelo trae «${display!=null?display:value}» de plantilla)`:''}; sin actor ni fuente no se puede afirmar.`);return freeze(out);}
  throw Error('evidence: tipo de afirmación desconocido: '+kind);
 }
 function freeze(o){o.justification=Object.freeze(o.justification);o.sources=Object.freeze(o.sources);o.issues=Object.freeze(o.issues);return Object.freeze(o);}

 /** Declarante de la EXISTENCIA física de un elemento según su procedencia registrada (nunca Documentado sin fuente). */
 function existenceAssessment(el,key,sources,audience){const s=el&&el.source||{};
  const by=s.review==='confirmed'?'reviewer':s.method==='manual'?'user':s.method==='imported'?'imported':null;
  const kind=!by&&s.method==='suggested'?'inference':'declaration';
  return assess({key,label:'Existencia física',value:'Existe',kind,declaredBy:by,sources,audience});}

 /** Medida derivada: valor mostrado y crudo. */
 function measure({key,label,valueMm,unit='mm',scale,sources,audience}){
  const display=valueMm==null?null:unit==='m'?r1(valueMm/1000)+' m':unit==='m2'?(Math.round(valueMm/1e4)/100)+' m²':Math.round(valueMm)+' mm';
  return assess({key,label,value:valueMm==null?null:Math.round(valueMm),display,kind:'measure',scale,sources,audience,unit});}

 function canonicalJson(x){const sort=v=>Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;return JSON.stringify(sort(x));}
 const stale=(claimRevision,currentRevision)=>claimRevision!==currentRevision;
 const label=c=>CERTAINTY[c]?CERTAINTY[c].es:'Desconocido';
 return Object.freeze({CERTAINTY,NOT_MODELLED,ACTORS,reviewOf,provenanceOf,sourceProblems,assess,existenceAssessment,measure,canonicalJson,stale,label});
});
