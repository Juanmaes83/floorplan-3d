/* RUBIK · Asistente IA V2 · AG-0: contratos versionados del asistente (puro: sin DOM, red, almacenamiento ni proveedor).
   Un solo lugar define los mensajes, las llamadas a herramientas, sus resultados, las propuestas y la auditoría de una
   ejecución. Todo lo que venga de un usuario, de un proyecto importado o de un modelo es DATO a validar, nunca una orden:
   los validadores son cerrados (claves permitidas, tipos, longitudes y enumeraciones) y fallan con un código cerrado.
   Las mismas definiciones se publican como JSON Schema en docs/contracts/assistant-v1/; una prueba comprueba que
   ambas coinciden (enumeraciones, claves y obligatorias), para que el esquema publicado no pueda divergir del código.
   UMD: window.RubikAssistantContracts / module.exports. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikAssistantContracts=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const VERSION='1.0.0';
 const ROLES=Object.freeze(['user','assistant','tool','system']);
 const ERRORS=Object.freeze(['invalid_arguments','not_authorized','not_found','not_available','revision_mismatch','conflict',
  'rate_limited','budget_exceeded','timeout','cancelled','provider_disabled','consent_required','unsupported_intent','internal']);
 const MEASURE=Object.freeze(['measured','estimated','unavailable','mixed','not_applicable']);
 const PROPOSAL_STATES=Object.freeze(['proposed','rejected','stale','confirmed','applied','undone','failed']);
 const OPERATIONS=Object.freeze(['set_room_floor_material','move_object']);
 const CAP_STATES=Object.freeze(['available','validation','preparation','blocked']);
 const AREAS=Object.freeze(['design','analyze','budget','deliver','studio']);
 const MODES=Object.freeze(['deterministic','mock','provider']);
 const LIMITS=Object.freeze({text:2000,id:150,tools:12,findings:200,label:200});
 const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const isStr=(x,max=LIMITS.text)=>typeof x==='string'&&x.length<=max;
 const isId=x=>typeof x==='string'&&x.length>0&&x.length<=LIMITS.id&&/^[A-Za-z0-9_.:-]+$/.test(x);
 const isIso=x=>typeof x==='string'&&x.length<=40&&Number.isFinite(Date.parse(x));
 const isNum=x=>typeof x==='number'&&Number.isFinite(x);
 const only=(o,keys)=>Object.keys(o).every(k=>keys.includes(k));
 const fail=(code,path,message)=>({ok:false,error:{code,path,message}});
 const OK=Object.freeze({ok:true});
 // Each shape: required keys, allowed keys and per-key checks. The JSON Schemas are written from these same lists.
 const SHAPES=Object.freeze({
  AssistantMessageV1:{required:['version','id','role','text','at'],allowed:['version','id','role','text','at','area','projectId','revision','toolCallIds','proposalId','mode']},
  AssistantToolCallV1:{required:['version','id','tool','args'],allowed:['version','id','tool','args','projectId','revision','idempotencyKey']},
  AssistantToolResultV1:{required:['version','callId','ok'],allowed:['version','callId','ok','data','provenance','limitations','error']},
  AssistantProposalV1:{required:['version','id','operation','params','baseRevision','projectId','state','diff'],allowed:['version','id','operation','params','baseRevision','projectId','state','diff','warnings','conflicts','alternatives','explanation','createdAt']},
  AssistantRunAuditV1:{required:['version','runId','at','mode','tools','providerCalls','cost'],allowed:['version','runId','at','mode','area','projectId','revision','intent','tools','proposalId','providerCalls','cost','durationMs','error']},
  CapabilitiesForAssistantV1:{required:['version','generatedAt','operations'],allowed:['version','generatedAt','operations','provider']}
 });
 function shape(name,x){
  const s=SHAPES[name];if(!isObj(x))return fail('invalid_arguments','',`${name}: no es un objeto`);
  if(!only(x,s.allowed))return fail('invalid_arguments','',`${name}: clave no permitida (${Object.keys(x).filter(k=>!s.allowed.includes(k)).join(', ')})`);
  for(const k of s.required)if(!(k in x))return fail('invalid_arguments',k,`${name}: falta «${k}»`);
  if(x.version!==VERSION)return fail('invalid_arguments','version',`${name}: versión ${String(x.version).slice(0,20)} no admitida (se espera ${VERSION})`);
  return OK;
 }
 const opt=(x,k,check)=>!(k in x)||check(x[k]);
 function message(x){
  const r=shape('AssistantMessageV1',x);if(!r.ok)return r;
  if(!isId(x.id))return fail('invalid_arguments','id','id no válido');
  if(!ROLES.includes(x.role))return fail('invalid_arguments','role','rol no permitido');
  if(!isStr(x.text))return fail('invalid_arguments','text',`texto ausente o de más de ${LIMITS.text} caracteres`);
  if(!isIso(x.at))return fail('invalid_arguments','at','fecha no válida');
  if(!opt(x,'area',a=>AREAS.includes(a)))return fail('invalid_arguments','area','área no permitida');
  if(!opt(x,'projectId',isId)||!opt(x,'revision',v=>isStr(v,LIMITS.id)))return fail('invalid_arguments','projectId','proyecto o revisión no válidos');
  if(!opt(x,'toolCallIds',a=>Array.isArray(a)&&a.length<=LIMITS.tools&&a.every(isId)))return fail('invalid_arguments','toolCallIds','llamadas no válidas');
  if(!opt(x,'proposalId',isId))return fail('invalid_arguments','proposalId','propuesta no válida');
  if(!opt(x,'mode',m=>MODES.includes(m)))return fail('invalid_arguments','mode','modo no permitido');
  return OK;
 }
 function toolCall(x,tools){
  const r=shape('AssistantToolCallV1',x);if(!r.ok)return r;
  if(!isId(x.id))return fail('invalid_arguments','id','id no válido');
  if(!isId(x.tool)||(Array.isArray(tools)&&!tools.includes(x.tool)))return fail('not_authorized','tool','herramienta fuera de la lista blanca');
  if(!isObj(x.args)||Object.keys(x.args).length>6)return fail('invalid_arguments','args','argumentos no válidos');
  if(JSON.stringify(x.args).length>LIMITS.text)return fail('invalid_arguments','args','argumentos demasiado largos');
  if(!opt(x,'projectId',isId)||!opt(x,'revision',v=>isStr(v,LIMITS.id))||!opt(x,'idempotencyKey',isId))return fail('invalid_arguments','projectId','contexto no válido');
  return OK;
 }
 function provenance(p){
  if(!isObj(p)||!only(p,['source','projectId','revision','status','engine','asOf','budgetId']))return false;
  return isStr(p.source,LIMITS.label)&&opt(p,'projectId',isId)&&opt(p,'revision',v=>v===null||isStr(v,LIMITS.id))&&opt(p,'status',s=>MEASURE.includes(s))&&opt(p,'engine',v=>isStr(v,LIMITS.label))&&opt(p,'asOf',v=>v===null||isIso(v))&&opt(p,'budgetId',v=>v===null||isStr(v,LIMITS.id));
 }
 function toolResult(x){
  const r=shape('AssistantToolResultV1',x);if(!r.ok)return r;
  if(!isId(x.callId)||typeof x.ok!=='boolean')return fail('invalid_arguments','ok','resultado no válido');
  if(x.ok){if(!('data' in x)||!provenance(x.provenance))return fail('invalid_arguments','provenance','un resultado correcto exige datos y procedencia');
   if(!opt(x,'limitations',a=>Array.isArray(a)&&a.length<=20&&a.every(s=>isStr(s,LIMITS.text))))return fail('invalid_arguments','limitations','límites no válidos');
   if('error' in x)return fail('invalid_arguments','error','un resultado correcto no lleva error');}
  else if(!isObj(x.error)||!ERRORS.includes(x.error.code)||!isStr(x.error.message,LIMITS.text)||'data' in x)return fail('invalid_arguments','error','un fallo exige un código cerrado y ningún dato');
  return OK;
 }
 function proposal(x){
  const r=shape('AssistantProposalV1',x);if(!r.ok)return r;
  if(!isId(x.id)||!isId(x.projectId)||!isStr(x.baseRevision,LIMITS.id))return fail('invalid_arguments','id','identificadores no válidos');
  if(!OPERATIONS.includes(x.operation))return fail('not_authorized','operation','operación no permitida');
  if(!PROPOSAL_STATES.includes(x.state))return fail('invalid_arguments','state','estado no permitido');
  if(!isObj(x.params))return fail('invalid_arguments','params','parámetros no válidos');
  if(x.operation==='set_room_floor_material'){if(!only(x.params,['roomId','materialId'])||!isId(x.params.roomId)||!isId(x.params.materialId))return fail('invalid_arguments','params','roomId y materialId obligatorios');}
  else if(!only(x.params,['objectId','dxMm','dyMm','rotationDeg'])||!isId(x.params.objectId)||!opt(x.params,'dxMm',v=>Number.isInteger(v)&&Math.abs(v)<=20000)||!opt(x.params,'dyMm',v=>Number.isInteger(v)&&Math.abs(v)<=20000)||!opt(x.params,'rotationDeg',v=>Number.isInteger(v)&&v>=0&&v<360))return fail('invalid_arguments','params','objectId y desplazamiento entero en mm (±20 000) o giro 0–359');
  if(!Array.isArray(x.diff)||x.diff.length>40||!x.diff.every(d=>isObj(d)&&only(d,['path','before','after','label'])&&isStr(d.path,LIMITS.label)))return fail('invalid_arguments','diff','diferencias no válidas');
  for(const k of ['warnings','conflicts','alternatives'])if(!opt(x,k,a=>Array.isArray(a)&&a.length<=40))return fail('invalid_arguments',k,`${k} no válido`);
  return OK;
 }
 function runAudit(x){
  const r=shape('AssistantRunAuditV1',x);if(!r.ok)return r;
  if(!isId(x.runId)||!isIso(x.at)||!MODES.includes(x.mode))return fail('invalid_arguments','mode','ejecución no válida');
  if(!Array.isArray(x.tools)||x.tools.length>LIMITS.tools||!x.tools.every(isId))return fail('invalid_arguments','tools','herramientas no válidas');
  if(!Number.isInteger(x.providerCalls)||x.providerCalls<0)return fail('invalid_arguments','providerCalls','contador no válido');
  // Cost: «unknown» is null, never 0 by omission. Without a provider the measured cost is exactly 0.
  if(!isObj(x.cost)||!only(x.cost,['estimatedUsd','billedUsd','basis'])||!(x.cost.estimatedUsd===null||isNum(x.cost.estimatedUsd))||!(x.cost.billedUsd===null||isNum(x.cost.billedUsd))||!isStr(x.cost.basis,LIMITS.label))return fail('invalid_arguments','cost','coste no válido');
  if(x.providerCalls===0&&(x.cost.estimatedUsd!==0||x.cost.billedUsd!==0))return fail('invalid_arguments','cost','sin llamadas al proveedor el coste es 0');
  // Audit lines never carry free text from the user or the project: only closed identifiers.
  if(!opt(x,'intent',isId)||!opt(x,'error',e=>ERRORS.includes(e)))return fail('invalid_arguments','intent','la auditoría solo admite identificadores cerrados');
  return OK;
 }
 function capabilities(x){
  const r=shape('CapabilitiesForAssistantV1',x);if(!r.ok)return r;
  if(!isIso(x.generatedAt)||!Array.isArray(x.operations)||x.operations.length>60)return fail('invalid_arguments','operations','operaciones no válidas');
  for(const o of x.operations){
   if(!isObj(o)||!only(o,['id','kind','state','writes','preview','costUnknown','confirmation','owner','reason','source']))return fail('invalid_arguments','operations','operación con claves no permitidas');
   if(!isId(o.id)||!['read','proposal','visual','advanced'].includes(o.kind)||!CAP_STATES.includes(o.state)||typeof o.writes!=='boolean'||typeof o.preview!=='boolean'||typeof o.costUnknown!=='boolean'||!['none','per-action','per-generation'].includes(o.confirmation))return fail('invalid_arguments','operations',`operación ${String(o.id).slice(0,40)} no válida`);
   if(o.state!=='available'&&!isStr(o.reason,LIMITS.text))return fail('invalid_arguments','operations',`${o.id}: una operación no disponible debe explicar por qué`);
  }
  if(!opt(x,'provider',p=>isObj(p)&&only(p,['enabled','mode','reason'])&&typeof p.enabled==='boolean'&&MODES.includes(p.mode)))return fail('invalid_arguments','provider','estado del proveedor no válido');
  return OK;
 }
 return Object.freeze({VERSION,ROLES,ERRORS,MEASURE,PROPOSAL_STATES,OPERATIONS,CAP_STATES,AREAS,MODES,LIMITS,SHAPES,
  message,toolCall,toolResult,proposal,runAudit,capabilities,provenance,isId});
});
