/* §2.1 · Asistente unificado (texto, voz y avatar). UNA configuración que consumen el Asesor de Home, el Asistente de
   texto y los canales de voz/avatar (simulados). La profesión adapta enfoque y tono; NUNCA concede permisos: el acceso
   lo deciden el modo de sesión y la identidad verificada.
   Memoria: AUDITORÍA (docs/qa/asistente-unificado/AUDITORIA-PERSISTENCIA.md): no existe identidad verificable en el
   navegador ni almacén seguro compartido entre canales; por eso la memoria es LOCAL a este dispositivo, opcional, visible
   y consentida, y no se afirma memoria compartida. Sin consentimiento no se lee ni se escribe nada. */
(function(root){'use strict';
 const COMMON=Object.freeze([
  'Profesional, crítico y realista: señala incoherencias estéticas y técnicas aunque no se pregunte.',
  'Organiza las tareas y su orden.',
  'Distingue fechas comprometidas de estimaciones; no promete plazos sin datos.',
  'Ayuda a presentar el proyecto comercialmente sin falsear sus cualidades.',
  'Cita la fuente de cada dato y de cada acción; pide la confirmación existente si cambia el proyecto o genera gasto.']);
 const COMMON_SKILLS=Object.freeze(['consultar-superficies','mostrar-estancia','resumir-proyecto','continuar-por-texto']);
 const P=Object.freeze({
  architecture:{nombre:'Estudio de arquitectura',saludo:'Hola. Repasemos la distribución y la documentación de tu proyecto.',tono:'Técnico y preciso: superficies, huecos y coherencia entre plano y 3D.',
   enfoque:'Coherencia entre plano, 3D y documentación.',skills:['revisar-coherencia-plano-3d','preparar-documentacion'],
   ejemplos:['¿Cuántos metros útiles tiene cada estancia?','Enséñame el salón','Prefiero seguir por texto']},
  'real-estate':{nombre:'Inmobiliaria',saludo:'Hola. Preparemos el recorrido y la presentación del inmueble.',tono:'Comercial y claro: lo que verá el comprador, sin cifras inventadas.',
   enfoque:'Presentación al comprador sin exagerar cualidades.',skills:['preparar-recorrido','revisar-presentacion'],
   ejemplos:['¿Qué superficie total tiene la vivienda?','Enséñame el dormitorio principal','Prefiero seguir por texto']},
  developer:{nombre:'Promotora',saludo:'Hola. Revisemos variantes y fases de la promoción.',tono:'Ejecutivo: variantes, fases y decisiones con sus implicaciones.',
   enfoque:'Variantes, fases y su impacto.',skills:['comparar-variantes','ordenar-fases'],
   ejemplos:['¿Cuántos metros suma la planta?','Enséñame la cocina','Prefiero seguir por texto']},
  renovation:{nombre:'Reformas',saludo:'Hola. Ordenemos el alcance de la reforma y sus dependencias.',tono:'Práctico: alcance, orden de trabajos y lo que falta por medir.',
   enfoque:'Alcance, dependencias y mediciones pendientes.',skills:['ordenar-trabajos','detectar-mediciones-pendientes'],
   ejemplos:['¿Cuántos metros tiene el baño?','Enséñame el baño','Prefiero seguir por texto']},
  interior:{nombre:'Decoración e interiorismo',saludo:'Hola. Hablemos de materiales, luz y coherencia visual.',tono:'Estético y concreto: materiales, luz y ambiente de cada estancia.',
   enfoque:'Materiales, luz y coherencia visual.',skills:['revisar-materiales','comparar-estilos'],
   ejemplos:['¿Qué superficie tiene el salón?','Enséñame el salón','Prefiero seguir por texto']},
  construction:{nombre:'Constructora / jefe de obra',saludo:'Hola. Vamos con mediciones, partidas y secuencia de obra.',tono:'De obra: mediciones con su fuente, partidas y secuencia; distingue plan, propuesta y dato ausente.',
   enfoque:'Mediciones, partidas y secuencia de obra.',skills:['revisar-mediciones','ordenar-secuencia-obra'],
   ejemplos:['¿Cuántos metros útiles tiene la vivienda?','Enséñame la cocina','Prefiero seguir por texto']}});
 const ids=Object.keys(P),CHANNELS=Object.freeze(['texto','voz-simulada','avatar-simulado']);
 // Acciones por MODO (no por profesión). El modo cliente nunca abre costes internos, herramientas técnicas ni publicación.
 const ACTIONS=Object.freeze({
  cliente:Object.freeze(['consultar','mostrar-estancia','resumir','continuar-por-texto']),
  profesional:Object.freeze(['consultar','mostrar-estancia','resumir','continuar-por-texto','proponer-cambio','ver-costes','abrir-herramientas','publicar'])});
 const FORBIDDEN_CLIENT=Object.freeze(['proponer-cambio','ver-costes','abrir-herramientas','publicar']);
 function allowed(mode,action,{verified=false}={}){const m=mode==='profesional'&&verified?'profesional':'cliente';return ACTIONS[m].includes(action);}
 function limitText(action){return FORBIDDEN_CLIENT.includes(action)?'En modo cliente no se pueden ver costes internos, herramientas técnicas, cambios ni publicación. Pide al profesional que lo haga desde su sesión.':'';}
 function config(id,channel,mode,opts){const p=P[id];if(!p||!CHANNELS.includes(channel))return null;
  return Object.freeze({perfil:id,canal:channel,nombre:p.nombre,saludo:p.saludo,tono:p.tono,enfoque:p.enfoque,criterios:COMMON,
   skills:Object.freeze([...COMMON_SKILLS,...p.skills]),ejemplos:p.ejemplos,acciones:ACTIONS[mode==='profesional'&&opts?.verified?'profesional':'cliente'],
   fuente:'js/assistant-unified.js'});}
 function matrix(){const out=[];for(const id of ids)for(const c of CHANNELS)for(const m of ['cliente','profesional'])out.push(config(id,c,m,{verified:m==='profesional'}));return out;}

 // ---------- Memoria local consentida ----------
 const SENSITIVE=[/\b\d{8}[A-HJ-NP-TV-Z]\b/i,/\b[XYZ]\d{7}[A-Z]\b/i,/\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}\b/,/(?:contrase(?:ñ|n)a|password|clave|token|api[_ -]?key)\s*[:=]/i,/\b(?:\d[ -]?){13,19}\b/];
 const sensitive=s=>SENSITIVE.some(r=>r.test(String(s||'')));
 const FIELDS=Object.freeze(['nombrePreferido','profesion','proyectos','nota']);
 function createMemory({storage,owner}={}){
  // owner: identificador LOCAL de la persona en este dispositivo (no es identidad verificada). Sin owner → sin memoria.
  const okOwner=typeof owner==='string'&&/^[a-z0-9-]{3,48}$/.test(owner);
  const K=okOwner?'rubik-asistente-memoria-v1:'+owner:null,KP=okOwner?'rubik-asistente-proyecto-v1:'+owner+':':null;
  const rd=k=>{try{const v=JSON.parse(storage.getItem(k));return v&&typeof v==='object'?v:null;}catch{return null;}};
  const wr=(k,v)=>{try{storage.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
  const st=()=>rd(K)||{consent:false,data:{},handoff:{allowed:false,fields:[]}};
  const api={
   available:()=>!!okOwner&&!!storage,
   alcance:'Solo en este dispositivo y navegador. No se comparte entre canales remotos ni entre personas. Puedes verla, editarla y borrarla.',
   consent(){return api.available()&&st().consent===true;},
   grant(){if(!api.available())return false;const s=st();s.consent=true;return wr(K,s);},
   view(){return api.consent()?{...st().data}:null;},
   set(field,value){if(!api.consent())return {ok:false,reason:'sin-consentimiento'};if(!FIELDS.includes(field))return {ok:false,reason:'campo'};
    const vals=Array.isArray(value)?value:[value];if(vals.some(sensitive))return {ok:false,reason:'dato-sensible'};
    if(field==='proyectos'&&!vals.every(v=>/^[A-Za-z0-9_-]{1,64}$/.test(String(v))))return {ok:false,reason:'proyecto'};
    const s=st();s.data[field]=field==='proyectos'?vals.map(String):String(value).slice(0,280);return {ok:wr(K,s)};},
   remove(field){if(!api.consent())return false;const s=st();delete s.data[field];return wr(K,s);},
   // Contexto por PROYECTO, separado de la memoria personal.
   project(id){if(!api.consent()||!/^[A-Za-z0-9_-]{1,64}$/.test(String(id)))return null;return {
     get:()=>rd(KP+id)||{},set:(k,v)=>sensitive(v)?{ok:false,reason:'dato-sensible'}:{ok:wr(KP+id,{...(rd(KP+id)||{}),[k]:String(v).slice(0,280)})}};},
   // Traspaso entre canales: solo los campos que la persona autoriza; revocar impide futuros traspasos.
   authorizeHandoff(fields){if(!api.consent())return false;const f=fields.filter(x=>FIELDS.includes(x)||x==='resumen');const s=st();s.handoff={allowed:true,fields:f};return wr(K,s);},
   revokeHandoff(){if(!api.available())return false;const s=st();s.handoff={allowed:false,fields:[]};return wr(K,s);},
   handoff({resumen,projectId}={}){if(!api.consent())return {ok:false,reason:'sin-consentimiento'};const s=st();if(!s.handoff.allowed)return {ok:false,reason:'no-autorizado'};
    const out={campos:[...s.handoff.fields]};for(const f of s.handoff.fields){if(f==='resumen')out.resumen=sensitive(resumen)?'[omitido: dato sensible]':String(resumen||'').slice(0,600);else if(f in s.data)out[f]=s.data[f];}
    if(projectId)out.projectId=String(projectId);return {ok:true,entrega:out,aviso:'Se entrega solo: '+(out.campos.join(', ')||'nada')+'.'};},
   forget(){if(!api.available())return false;try{const ks=[];for(let i=0;i<storage.length;i++){const k=storage.key(i);if(k===K||k.startsWith(KP))ks.push(k);}ks.forEach(k=>storage.removeItem(k));return true;}catch{return false;}}};
  return api;}
 root.RubikAssistantUnified=Object.freeze({ids,CHANNELS,COMMON,COMMON_SKILLS,ACTIONS,FORBIDDEN_CLIENT,profile:id=>P[id]||null,config,matrix,allowed,limitText,createMemory,sensitive,FIELDS});
})(typeof self!=='undefined'?self:globalThis);
