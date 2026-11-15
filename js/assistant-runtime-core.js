/* RUBIK · Asistente IA V2 · AG-0 (perímetro del proveedor), AG-4 (orquestación visual) y AG-5 (capacidades avanzadas).
   1) Pipeline de proveedor de TEXTO, DESACTIVADO por defecto. Ningún adaptador real existe en este corte: solo un
      adaptador simulado, rotulado, para pruebas. Cada petición pasa, en este orden, por: proveedor activado →
      consentimiento explícito de los campos que se enviarían → minimización (solo esos campos, sin nombres ni texto
      libre del proyecto) → idempotencia → cortocircuito → límite por ventana → presupuesto acumulado → tiempo máximo y
      cancelación (AbortSignal). Un fallo en cualquier paso responde con un código cerrado y NO llama al adaptador.
      Los contadores viven en memoria: sirven para el simulador y las pruebas, NO son un límite global durable (eso exige
      servidor con sesiones, GOV-06a, que no existe todavía).
   2) CapabilitiesForAssistantV1: qué puede hacer el asistente HOY, derivado del registro de capacidades de RUBIK
      (FloorPlanCapabilities, GOV-03) y de los módulos presentes. Nada «available» sin módulo ni prueba.
   3) Adaptadores visuales versionados (AG-4): el asistente solo PREPARA una solicitud y abre el flujo existente; el
      gasto lo confirma ese flujo (Render IA B2/B8, con su código de acceso). FOT-01 y CAT-IA quedan como stubs con
      contrato y prueba: sus módulos los desarrolla Claude Code 2 y este archivo no los modifica.
   Puro: sin DOM ni red. UMD: window.RubikAssistantRuntime / module.exports. */
(function(root,factory){const K=typeof module==='object'&&module.exports?require('./assistant-contracts.js'):root.RubikAssistantContracts;const api=factory(K);if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikAssistantRuntime=api;})(typeof self!=='undefined'?self:this,function(K){
 'use strict';
 const ADAPTER_VERSION='1.0.0';
 // Fields a text provider could ever receive. Never: room/object names, free text from the project, images, location,
 // contact data, tokens. The question itself is sent only if the person consents to «question».
 const SENDABLE=Object.freeze(['question','intent','counts','areas','budgetTotals','findingCodes']);
 const DEFAULT_LIMITS=Object.freeze({maxPerWindow:5,windowMs:60000,maxBudgetUsd:0,timeoutMs:15000,breakerFailures:3,breakerCooldownMs:60000});
 const err=(code,message)=>({ok:false,error:{code,message}});
 function minimize(payload,consent){
  const out={};for(const k of SENDABLE)if(consent.includes(k)&&payload&&k in payload)out[k]=payload[k];
  if(typeof out.question==='string')out.question=out.question.slice(0,500);
  return out;
 }
 // Mock adapter: deterministic, local, labelled. It never claims to be a language model.
 function mockAdapter({latencyMs=0,fail=false,usd=0}={}){
  return {id:'mock-text',kind:'mock',version:ADAPTER_VERSION,
   async run(request,{signal}={}){
    await new Promise((res,rej)=>{const t=setTimeout(res,latencyMs);signal?.addEventListener('abort',()=>{clearTimeout(t);rej(Object.assign(new Error('aborted'),{name:'AbortError'}));},{once:true});});
    if(fail)throw Object.assign(new Error('mock failure'),{code:'provider_error'});
    return {text:'[SIMULADO] '+(request.intent||'consulta'),usage:{inputTokens:0,outputTokens:0},costUsd:usd,mock:true};}};
 }
 function createPipeline({enabled=false,adapter=null,limits={},now=()=>Date.now()}={}){
  const L={...DEFAULT_LIMITS,...limits};const calls=[];let spent=0,failures=0,openUntil=0;const done=new Map();
  async function request({payload,consent=[],idempotencyKey,signal}={}){
   if(!enabled||!adapter)return err('provider_disabled','El proveedor de texto está desactivado: no hay modelo, credencial, tarifa ni autorización de gasto.');
   if(!Array.isArray(consent)||!consent.length||!consent.every(c=>SENDABLE.includes(c)))return err('consent_required','Hace falta tu consentimiento para los campos que se enviarían.');
   if(!K.isId(idempotencyKey))return err('invalid_arguments','Falta la clave de idempotencia.');
   if(done.has(idempotencyKey))return {...done.get(idempotencyKey),replayed:true};
   const t=now();if(t<openUntil)return err('not_available','El proveedor ha fallado varias veces seguidas: pausa de seguridad.');
   while(calls.length&&calls[0]<=t-L.windowMs)calls.shift();
   if(calls.length>=L.maxPerWindow)return err('rate_limited','Límite de consultas por minuto alcanzado.');
   if(spent>=L.maxBudgetUsd&&adapter.kind!=='mock')return err('budget_exceeded','Se ha alcanzado el presupuesto autorizado.');
   if(signal?.aborted)return err('cancelled','Cancelado.');
   calls.push(t);const ctrl=new AbortController();const onAbort=()=>ctrl.abort();signal?.addEventListener('abort',onAbort,{once:true});
   let timer;const timeout=new Promise((_,rej)=>{timer=setTimeout(()=>{ctrl.abort();rej(Object.assign(new Error('timeout'),{code:'timeout'}));},L.timeoutMs);});
   try{const r=await Promise.race([adapter.run(minimize(payload,consent),{signal:ctrl.signal}),timeout]);
    failures=0;const cost=Number.isFinite(r.costUsd)?r.costUsd:null;if(cost)spent+=cost;
    const out={ok:true,text:String(r.text||'').slice(0,2000),mock:!!r.mock,costUsd:cost,usage:r.usage||null};done.set(idempotencyKey,out);return out;}
   catch(e){if(e.code==='timeout')return err('timeout','El proveedor no ha respondido a tiempo.');if(e.name==='AbortError'||signal?.aborted)return err('cancelled','Cancelado.');
    if(++failures>=L.breakerFailures)openUntil=now()+L.breakerCooldownMs;return err('not_available','El proveedor ha devuelto un error.');}
   finally{clearTimeout(timer);signal?.removeEventListener('abort',onAbort);}
  }
  return {request,get spentUsd(){return spent;},get enabled(){return !!(enabled&&adapter)},get mode(){return enabled&&adapter?(adapter.kind==='mock'?'mock':'provider'):'deterministic';}};
 }
 // ----- CapabilitiesForAssistantV1 -----
 // env: {registry: FloorPlanCapabilities (optional), modules: {render, renderStyles, photoReform, photoReformConfigured, catalog, smartFurnishing}}
 function capabilities(env={},at=new Date().toISOString()){
  const reg=env.registry,state=id=>(reg?.byId?.(id)||null)?.state||null;
  const m=env.modules||{};
  const op=(id,kind,st,extra)=>({id,kind,state:st,writes:false,preview:false,costUnknown:false,confirmation:'none',owner:'claude-code-1',...extra});
  const ops=[
   ...['list_capabilities','get_project_summary','list_rooms','get_room','get_quantities','get_budget_summary','get_layout_review','list_materials','list_objects'].map(id=>op(id,'read','available',{source:'RubikAssistantDomainTools'})),
   // CAT-04: read-only access to «Mis catálogos», the catalogue items of the same budget and the linked visual references,
   // available only where CAT-IA is loaded (module flag). No writes, no provider, no cost.
   ...['list_catalog_products','get_placed_products','get_visual_references'].map(id=>m.catalog?op(id,'read','available',{owner:'claude-code-2',source:'CAT-04 (CatalogCapabilitiesForAssistantV1 · RubikCatalogBudget · RubikVisualReferences)'})
    :op(id,'read','blocked',{owner:'claude-code-2',source:'CAT-04',reason:'«Mis catálogos» no está cargado en esta página.'})),
   op('set_room_floor_material','proposal','available',{writes:true,preview:true,confirmation:'per-action',source:'RubikAssistantProposals'}),
   op('move_object','proposal','available',{writes:true,preview:true,confirmation:'per-action',source:'RubikAssistantProposals'}),
   m.render&&state('render-ai')==='available'
    ?op('render_views','visual','available',{writes:false,preview:true,costUnknown:true,confirmation:'per-generation',source:'FloorPlanAIRender (B2/B8)',reason:'El asistente prepara la vista y el estilo; el gasto lo confirma el diálogo de Render IA con el código de acceso del estudio.'})
    :op('render_views','visual','blocked',{costUnknown:true,confirmation:'per-generation',reason:'Render IA no está disponible en esta página.',source:'FloorPlanAIRender (B2/B8)'}),
   op('photo_reform','visual',m.photoReform?(m.photoReformConfigured?'validation':'blocked'):'preparation',{costUnknown:true,confirmation:'per-generation',owner:'claude-code-2',source:'RubikPhotoReform (FOT-01)',
    reason:m.photoReform?(m.photoReformConfigured?'Proveedor configurado pendiente de validación.':'FOT-01 está en master sin proveedor autorizado: solo el simulador rotulado.'):'FOT-01 no está cargado en esta página.'}),
   op('catalog_products','read',m.catalog?'available':'blocked',{owner:'claude-code-2',source:'CAT-IA (CatalogCapabilitiesForAssistantV1)',reason:m.catalog?'Lectura de Mis catálogos, de sus partidas en Presupuestar y de las referencias visuales vinculadas; el precio se aplica solo en Presupuestar con confirmación.':'«Mis catálogos» no está cargado en esta página.'}),
   op('photo_to_furniture_3d','advanced','preparation',{costUnknown:true,source:'MUE-02',reason:'MUE-02 no está aprobado ni implementado.'}),
   op('generate_layout','advanced','preparation',{costUnknown:true,source:'GEN-01',reason:'GEN-01 no está aprobado ni implementado.'}),
   op('optimize_layout','advanced','preparation',{costUnknown:true,source:'GEN-01',reason:'Requiere criterios y pruebas propios (GEN-01).'})
  ];
  const doc={version:K.VERSION,generatedAt:at,operations:ops,provider:{enabled:false,mode:'deterministic',reason:'Sin modelo de texto autorizado: consulta guiada sin LLM.'}};
  const v=K.capabilities(doc);if(!v.ok)throw Error('CapabilitiesForAssistantV1 inválido: '+v.error.message);
  return doc;
 }
 // ----- AG-4 adapters: prepare, never spend -----
 function renderRequest({styles=[],style,viewId}={}){
  if(!Array.isArray(styles)||!styles.length)return err('not_available','Render IA no está disponible.');
  const s=style&&styles.includes(style)?style:styles[0];
  return {ok:true,request:{version:ADAPTER_VERSION,kind:'render_views',style:s,viewId:typeof viewId==='string'?viewId.slice(0,80):null,
   maxImages:3,costUsd:null,costBasis:'Lo fija el proveedor; el coste estimado solo aparece con la tarifa configurada (IMG-02).',
   confirmation:'El diálogo de Render IA pide confirmación y el código de acceso antes de cada generación.',spendsNow:false}};
 }
 function photoReformRequest(cap){return {ok:false,error:{code:'not_available',message:cap?.reason||'FOT-01 sin proveedor autorizado.'}};}
 function catalogRequest(cap){return {ok:false,error:{code:'not_available',message:cap?.reason||'«Mis catálogos» no está cargado en esta página.'}};}
 // AG-5: closed refusal with what would be needed. Never «operational» because a mock exists.
 const ADVANCED_DECISIONS=Object.freeze(['Aprobar MUE-02 (foto → mueble 3D) con su presupuesto de IA y su validación de medidas.','Aprobar GEN-01 (generador de distribuciones) con criterios, restricciones y pruebas propias.','Decidir proveedor y tope de gasto para cada capacidad.','Revisión legal y de privacidad de fotos (GOV-05).']);
 function advancedRefusal(id){return {ok:false,error:{code:'not_available',message:`«${id}» está en preparación: no se ejecuta.`},decisions:ADVANCED_DECISIONS};}
 function audit({runId,mode='deterministic',area,projectId,revision,intent,tools=[],proposalId,providerCalls=0,costUsd=0,durationMs,error}){
  const a={version:K.VERSION,runId,at:new Date().toISOString(),mode,tools,providerCalls,cost:{estimatedUsd:providerCalls?costUsd:0,billedUsd:providerCalls?null:0,basis:providerCalls?'estimación del proveedor; la factura manda':'sin llamadas al proveedor'}};
  if(area)a.area=area;if(projectId)a.projectId=projectId;if(revision)a.revision=revision;if(intent)a.intent=intent;if(proposalId)a.proposalId=proposalId;if(Number.isFinite(durationMs))a.durationMs=Math.round(durationMs);if(error)a.error=error;
  const v=K.runAudit(a);if(!v.ok)throw Error('AssistantRunAuditV1 inválido: '+v.error.message);return a;
 }
 return Object.freeze({ADAPTER_VERSION,SENDABLE,DEFAULT_LIMITS,minimize,mockAdapter,createPipeline,capabilities,renderRequest,photoReformRequest,catalogRequest,advancedRefusal,ADVANCED_DECISIONS,audit});
});
