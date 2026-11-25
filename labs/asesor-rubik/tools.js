/* Asesor RUBIK en vivo · LABORATORIO SIMULADO · contrato de herramientas.
   UNA sola lista canónica de herramientas. Los perfiles (los seis del selector de Home, js/guide-ui.js) y los modos
   (técnico / cliente) solo SELECCIONAN subconjuntos explícitos de esta lista; nunca definen herramientas nuevas.
   Cada herramienta declara cómo se ejecuta sobre RUBIK real (la vista del laboratorio es el producto en un iframe del
   mismo origen) y sus anotaciones (readOnlyHint / destructiveHint), con el formato plano previsto para la delegación.
   Las anotaciones DESCRIBEN; la autorización se aplica en el punto de ejecución (authorize), no en el proveedor.
   Sin red: nada de este archivo llama a ningún servicio. */
(function(root){'use strict';
 const T=(name,description,parameters,annotations,run)=>Object.freeze({type:'function',name,description,parameters,annotations,run});
 const room=props=>({type:'object',properties:{roomName:{type:'string',description:'Nombre visible de la estancia (p. ej. «Salón»)'}},required:['roomName'],additionalProperties:false,...props});
 const none={type:'object',properties:{},required:[],additionalProperties:false};
 const fold=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();

 // ---- Lista canónica -------------------------------------------------------------------------------------------------
 const TOOLS=Object.freeze([
  // 1) Consultar superficies → RubikAssistantDomainTools.execute('list_rooms') del producto (FloorPlanQuantities.room).
  T('consultar_superficies','Superficie útil por estancia y total del proyecto activo, con su estado (medida / estimada).',none,
   {readOnlyHint:true,destructiveHint:false},
   (rubik)=>{const r=rubik.tools.execute('list_rooms',{},rubik.ctx(),'lab-sup');if(!r.ok)return {ok:false,error:r.error.code};
    const rooms=r.data.rooms.map(x=>({nombre:rubik.displayName(x.name),m2:x.floor.areaM2,estado:x.floor.status,enComputo:x.counted}));
    const total=rooms.filter(x=>x.enComputo&&Number.isFinite(x.m2)).reduce((s,x)=>s+x.m2,0);
    return {ok:true,data:{estancias:rooms,totalM2:Math.round(total*100)/100},fuente:r.provenance.engine};}),
  // 2) Enfocar una estancia → la misma selección que hace la persona en el plano (select({kind:'room'})): el Inspector
  //    muestra la estancia; en 3D, View3D.focusRoom. Acción de VISTA temporal: no cambia el proyecto.
  T('enfocar_estancia','Selecciona y muestra una estancia en el visor. Cambio temporal de vista, no modifica el proyecto.',room(),
   {readOnlyHint:true,destructiveHint:false},
   (rubik,args)=>{const p=rubik.project(),r=p.rooms.find(x=>fold(rubik.displayName(x.name))===fold(args.roomName)||fold(x.name)===fold(args.roomName));
    if(!r)return {ok:false,error:'room_not_found'};rubik.focusRoom(r.id);return {ok:true,data:{estancia:rubik.displayName(r.name),id:r.id}};}),
  // 3) Continuar con el Asistente de texto → RubikAssistantUI.open() (+ ask solo con texto que la persona autorizó).
  T('continuar_por_texto','Abre el Asistente de texto de RUBIK. Solo se traspasa el texto que la persona autoriza.',
   {type:'object',properties:{pregunta:{type:'string',description:'Pregunta a traspasar, solo si la persona lo autoriza'}},required:[],additionalProperties:false},
   {readOnlyHint:true,destructiveHint:false},
   // Modo cliente: el texto sigue DENTRO del asesor con la misma lista de consultas (el Asistente completo de RUBIK es del
   // profesional y consulta costes internos: abrirlo aquí ampliaría el acceso). Modo técnico: Asistente de texto de RUBIK.
   (rubik,args,session)=>{if(session?.mode==='cliente'){rubik.advisorText?.(args.pregunta||null);return {ok:true,data:{abierto:'texto del asesor',consultas:'las mismas del modo cliente',traspaso:args.pregunta?'pregunta autorizada':'ninguno'}};}
    rubik.openTextAssistant(args.pregunta||null);return {ok:true,data:{abierto:'Asistente de texto de RUBIK',traspaso:args.pregunta?'pregunta autorizada':'ninguno'}};}),
  // ---- Fuera del modo cliente (datos internos o cambios). Existen en la lista para poder RECHAZARLAS en ejecución. ----
  T('resumen_presupuesto','Importes del presupuesto del proyecto (costes internos del profesional).',none,
   {readOnlyHint:true,destructiveHint:false},
   (rubik)=>{const r=rubik.tools.execute('get_budget_summary',{},rubik.ctx(),'lab-bud');return r.ok?{ok:true,data:{neto:r.data?.totals?.net??null}}:{ok:false,error:r.error.code};}),
  T('proponer_cambio_suelo','Propone cambiar el suelo de una estancia. Solo se aplica tras confirmación explícita en RUBIK.',
   room({properties:{roomName:{type:'string'},materialId:{type:'string'}},required:['roomName','materialId']}),
   {readOnlyHint:false,destructiveHint:false},
   ()=>({ok:false,error:'proposal_flow_required'})),
  T('publicar_enlace','Publica un enlace para el cliente.',none,{readOnlyHint:false,destructiveHint:true},()=>({ok:false,error:'not_in_pilot'})),
 ]);
 const BY=Object.fromEntries(TOOLS.map(t=>[t.name,t]));

 // ---- Perfiles (los seis del selector de Home) y modos ----------------------------------------------------------------
 const PROFILES=Object.freeze({architecture:'Estudio de arquitectura','real-estate':'Inmobiliaria',developer:'Promotora',renovation:'Reformas',interior:'Decoración e interiorismo',construction:'Constructora / jefe de obra'});
 // Modo cliente (presentación): lista EXPLÍCITA de consulta; excluye costes internos, edición, publicación.
 const CLIENT=Object.freeze(['consultar_superficies','enfocar_estancia','continuar_por_texto']);
 // Modo técnico: añade lecturas internas; un cambio solo como PROPUESTA del flujo existente (nunca escritura directa).
 const TECH=Object.freeze([...CLIENT,'resumen_presupuesto','proponer_cambio_suelo']);
 const MODES=Object.freeze({cliente:CLIENT,tecnico:TECH});
 // Ajuste por perfil: subconjunto del modo (nunca amplía). En el piloto todos los perfiles comparten las tres consultas.
 const PROFILE_FILTER=Object.freeze({'real-estate':{tecnico:CLIENT},interior:{},architecture:{},developer:{},renovation:{},construction:{}});
 function allowed(profile,mode){const base=MODES[mode]||CLIENT;const f=PROFILE_FILTER[profile]?.[mode];return Object.freeze((f||base).filter(n=>base.includes(n)));}
 const MAX_TOOLS=16;
 // Definiciones en formato plano (delegación responses): lo que se ENVIARÍA al proveedor en una prueba real.
 function definitions(profile,mode){const names=allowed(profile,mode);if(names.length>MAX_TOOLS)throw Error('Máximo 16 herramientas');
  return names.map(n=>{const t=BY[n];return {type:'function',name:t.name,description:t.description,parameters:t.parameters,annotations:{...t.annotations}};});}

 // ---- Autorización en el punto de ejecución ---------------------------------------------------------------------------
 function validArgs(t,args){if(args===null||typeof args!=='object'||Array.isArray(args))return false;const p=t.parameters;
  if(Object.keys(args).some(k=>!(k in p.properties)))return false;if((p.required||[]).some(k=>typeof args[k]!=='string'||!args[k].trim()||args[k].length>120))return false;
  return Object.entries(args).every(([k,v])=>typeof v==='string'&&v.length<=400);}
 function authorize(session,name,args){
  if(!session||session.state!=='live')return {ok:false,code:'no_session',motivo:'No hay una sesión activa.'};
  if(session.projectId!==session.rubik.project()?.id)return {ok:false,code:'project_changed',motivo:'El proyecto activo cambió: la conversación se desvinculó.'};
  const t=BY[name];if(!t)return {ok:false,code:'unknown_tool',motivo:'Herramienta desconocida.'};
  if(!allowed(session.profile,session.mode).includes(name))return {ok:false,code:'not_allowed_in_mode',motivo:session.mode==='cliente'?'En modo cliente esta acción no está permitida.':'Acción no permitida en este modo.'};
  if(!validArgs(t,args||{}))return {ok:false,code:'invalid_arguments',motivo:'Argumentos no válidos.'};
  if(!t.annotations.readOnlyHint)return {ok:false,code:'confirmation_required',motivo:'Los cambios solo se proponen y se confirman en RUBIK.'};
  return {ok:true,tool:t};}
 function run(session,name,args={}){const a=authorize(session,name,args);if(!a.ok)return {ok:false,error:a.code,motivo:a.motivo};
  try{return a.tool.run(session.rubik,args,session);}catch(e){return {ok:false,error:'tool_failed',motivo:String(e.message||e)};}}

 root.AsesorTools=Object.freeze({TOOLS:TOOLS.map(t=>t.name),PROFILES,MODES,allowed,definitions,authorize,run,MAX_TOOLS});
})(typeof self!=='undefined'?self:globalThis);
