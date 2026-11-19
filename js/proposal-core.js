/* K13 · ProposalV1 — contrato ÚNICO de propuesta y vigencia (Plan Maestro v1.12 §6.3; PRE-01 queda fuera de este corte).
   No es un motor: los tres que existen siguen siendo los únicos que calculan, y cada uno conserva su algoritmo de huella,
   sus garantías y su contrato público (las pruebas existentes no cambian sus aserciones):
     · AG-2 · Asistente (js/assistant-proposals-core.js, AssistantProposalV1): base = revisión FNV-1a de 64 bits
       (`rv1-…`); se aplica SOLO con confirmación por acción y en un paso que se deshace (AG-3).
     · MCP · propose_layout (tools/rubik-mcp/src/proposal.cjs, RubikLayoutProposalV1): base = SHA-256 del archivo
       leído; NUNCA se aplica (applied:false siempre).
     · E2 · Comparador (comparar/comparar.js): solo VIGENCIA (decisión 1 de #282): base = SHA-256 de lo guardado; no es
       una propuesta y nunca modifica un proyecto.
   Lo común:
     · base {kind, value} con tres tipos (no se fuerza un algoritmo único) y checkFresh(base, actual), la ÚNICA
       comprobación de vigencia que usan los tres. El código interno es `stale_base`; cada familia conserva el suyo como
       alias de compatibilidad (decisión 2): revision_mismatch, stale-source y stale.
     · la vista ProposalV1 de una propuesta (fromAssistant, fromLayout): sobre común, sin copiar el motor.
     · invariantes que se comprueban siempre (validate): una candidata del MCP no es aplicable y no está aplicada; una
       propuesta del Asistente exige confirmación y deshacer.
   Puro: sin DOM, red, almacenamiento ni escritura de proyectos. UMD: window.RubikProposalCore / module.exports. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikProposalCore=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const VERSION='ProposalV1';
 const STALE='stale_base';
 // Formato de cada huella, tal como la producen hoy sus motores (no se recalcula ni se cambia aquí).
 const BASE_KINDS=Object.freeze({revision:/^rv1-[0-9a-f]{16}$/,'file-sha256':/^[0-9a-f]{64}$/,'stored-sha256':/^[0-9a-f]{64}$/});
 const LEGACY=Object.freeze({revision:'revision_mismatch','file-sha256':'stale-source','stored-sha256':'stale'});
 // Qué es cada familia de propuesta. E2 no figura: solo usa la vigencia.
 const KINDS=Object.freeze({
  'assistant-change':Object.freeze({base:'revision',applicable:true,confirmation:'per-action',undo:true,origin:'AssistantProposalV1'}),
  'layout-candidate':Object.freeze({base:'file-sha256',applicable:false,confirmation:'none',undo:false,origin:'RubikLayoutProposalV1'})});
 const STATES=Object.freeze(['proposed','no-change','blocked','stale','rejected','confirmed','applied','undone','failed']);
 const isBase=b=>!!b&&typeof b==='object'&&Object.prototype.hasOwnProperty.call(BASE_KINDS,b.kind)&&typeof b.value==='string'&&BASE_KINDS[b.kind].test(b.value);
 function base(kind,value){const b=Object.freeze({kind,value});if(!isBase(b))throw new TypeError(`Base de vigencia no válida: ${kind}`);return b;}
 // ¿Sigue vigente lo que se propuso sobre `b`, ahora que la huella actual es `current`? Una base mal formada nunca es
 // vigente (se trata como obsoleta: no se aplica nada sobre algo que no se puede comprobar).
 function checkFresh(b,current){
  if(!isBase(b))return Object.freeze({ok:false,code:STALE,legacyCode:LEGACY[b?.kind]||'stale',kind:b?.kind??null,expected:b?.value??null,actual:current??null,reason:'invalid-base'});
  if(current===b.value)return Object.freeze({ok:true,kind:b.kind});
  return Object.freeze({ok:false,code:STALE,legacyCode:LEGACY[b.kind],kind:b.kind,expected:b.value,actual:current??null,reason:'changed'});
 }
 const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
 const freezeDeep=o=>{if(o&&typeof o==='object'){for(const v of Object.values(o))freezeDeep(v);Object.freeze(o);}return o;};
 // ── Vistas ProposalV1 (adaptadores finos: leen el resultado del motor, no lo recalculan ni lo modifican) ──────────────
 function fromAssistant(p){
  const k=KINDS['assistant-change'];
  return freezeDeep({version:VERSION,kind:'assistant-change',id:p.id,projectId:p.projectId,base:{kind:k.base,value:p.baseRevision},
   operation:p.operation,changes:(p.diff||[]).map(d=>({path:d.path,before:clone(d.before),after:clone(d.after),label:d.label??null})),
   warnings:clone(p.warnings||[]),alternatives:clone(p.alternatives||[]),state:p.state,applicable:true,applied:p.state==='applied',
   requires:{confirmation:k.confirmation,undo:k.undo},origin:{contract:k.origin,version:p.version}});
 }
 const LAYOUT_STATE=r=>r.status==='candidate-reviewable'?'proposed':r.status==='no-change-needed'?'no-change':r.blockingReasons?.some(b=>b.code==='stale-source')?'stale':'blocked';
 function fromLayout(r){
  const k=KINDS['layout-candidate'],changes=[];
  if(r.suggestedPose&&r.currentPose){
   changes.push({path:`objects[${r.objectId}].position`,before:clone(r.currentPose.position),after:clone(r.suggestedPose.position),label:null});
   if(r.suggestedPose.rotationDeg!==r.currentPose.rotationDeg)changes.push({path:`objects[${r.objectId}].rotationDeg`,before:r.currentPose.rotationDeg,after:r.suggestedPose.rotationDeg,label:null});}
  return freezeDeep({version:VERSION,kind:'layout-candidate',id:`layout:${r.objectId}:${r.goal}:${(r.source?.sha256||'').slice(0,12)}`,projectId:null,
   base:{kind:k.base,value:r.source?.sha256??null},operation:r.goal,changes,warnings:clone([...(r.remainingIssues||[]),...(r.uncertainty||[])]),
   alternatives:[],state:LAYOUT_STATE(r),applicable:false,applied:false,requires:{confirmation:k.confirmation,undo:k.undo},
   origin:{contract:k.origin,version:r.proposalVersion,status:r.status}});
 }
 // ── Invariantes ─────────────────────────────────────────────────────────────────────────────────────────────────────
 function validate(p){
  const bad=m=>({ok:false,error:{code:'invalid_proposal',message:m}});
  if(!p||p.version!==VERSION)return bad('versión distinta de ProposalV1');
  const k=KINDS[p.kind];if(!k)return bad('tipo de propuesta desconocido');
  if(!isBase(p.base)||p.base.kind!==k.base)return bad(`la base de «${p.kind}» debe ser ${k.base} válida`);
  if(!STATES.includes(p.state))return bad('estado no permitido');
  if(!Array.isArray(p.changes)||!p.changes.every(c=>c&&typeof c.path==='string'))return bad('cambios mal formados');
  if(p.applicable!==k.applicable)return bad(k.applicable?'una propuesta del Asistente es aplicable':'una candidata del MCP nunca es aplicable');
  if(!k.applicable&&(p.applied!==false||p.state==='applied'||p.state==='confirmed'))return bad('una candidata del MCP nunca se confirma ni se aplica');
  if(p.requires?.confirmation!==k.confirmation||p.requires?.undo!==k.undo)return bad(k.applicable?'una propuesta del Asistente exige confirmación por acción y deshacer':'requisitos de candidata no válidos');
  return {ok:true};
 }
 // ¿Puede aplicarse ESTA propuesta sobre un proyecto cuya huella actual es `current`? Nunca para el MCP; para el
 // Asistente, solo pendiente o confirmada y con la base vigente. No aplica nada: lo decide y lo hace su motor (AG-3).
 function canApply(p,current){
  const v=validate(p);if(!v.ok)return v;
  if(!p.applicable)return {ok:false,error:{code:'not_applicable',message:'Las candidatas del MCP son de solo lectura: nunca se aplican.'}};
  if(p.state!=='proposed'&&p.state!=='confirmed')return {ok:false,error:{code:'conflict',message:'La propuesta ya no está pendiente.'}};
  const f=checkFresh(p.base,current);
  return f.ok?{ok:true}:{ok:false,error:{code:f.legacyCode,internal:f.code,message:'La base de la propuesta ha cambiado: genera una nueva.'}};
 }
 return Object.freeze({VERSION,STALE,BASE_KINDS,LEGACY,KINDS,STATES,base,checkFresh,fromAssistant,fromLayout,validate,canApply});
});
