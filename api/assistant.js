/* RUBIK · Asistente IA V2 · AG-0: perímetro de servidor del asistente (Vercel Node function, POST /api/assistant).
   ESTE ENDPOINT NO LLAMA A NINGÚN PROVEEDOR. No contiene cliente de modelo de lenguaje, ni lee claves, ni envía datos
   fuera. Existe para fijar y probar el perímetro antes de cualquier activación:
   - Solo POST con JSON de hasta 16 KB; otra cosa responde 405/415/413.
   - Una petición que declara un Origin de otro sitio se rechaza (403 'origin'). No se envía ninguna cabecera CORS:
     el navegador de otro sitio no puede leer la respuesta.
   - Sin RUBIK_ASSISTANT_ENABLED === '1' responde 503 'provider_disabled'. Es el estado de este despliegue.
   - Aunque se active, responde 501 'auth_unavailable': no hay sesiones autenticadas, roles ni tenants (GOV-06a no
     existe todavía), y `projectId` o `expectedProjectId` en el cuerpo NO son autenticación. Activar un modelo real
     exige antes: proveedor y modelo de texto autorizados, credencial de TEXTO (la de Render IA no sirve), tarifa
     verificada, tope de gasto, límites durables por usuario y proyecto, y esta comprobación de sesión.
   - Una línea JSON por petición en el registro de la función: método, estado y motivo cerrado. Nunca el cuerpo, la
     pregunta, el proyecto, cabeceras de autorización ni direcciones. */
'use strict';
const MAX_BYTES=16*1024;
function sameSite(req){
 const origin=req.headers.origin;if(origin===undefined)return true;
 const host=req.headers['x-forwarded-host']||req.headers.host;
 try{return typeof origin==='string'&&!!host&&new URL(origin).host===String(host).split(',')[0].trim();}catch{return false;}
}
function send(res,status,body,log){
 res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(body));
 log?.(JSON.stringify({fn:'assistant',status,reason:body.error||'ok'}));
}
async function readBody(req){
 if(req.body!==undefined)return typeof req.body==='string'?req.body:JSON.stringify(req.body);
 let size=0;const chunks=[];
 for await(const c of req){size+=c.length;if(size>MAX_BYTES)throw Object.assign(new Error('too large'),{code:413});chunks.push(c);}
 return Buffer.concat(chunks).toString('utf8');
}
async function handler(req,res,{env=process.env,log=console.log}={}){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'method'},log);}
 if(!sameSite(req))return send(res,403,{error:'origin'},log);
 if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return send(res,415,{error:'content_type'},log);
 const declared=Number(req.headers['content-length']);if(Number.isFinite(declared)&&declared>MAX_BYTES)return send(res,413,{error:'too_large'},log);
 let raw;try{raw=await readBody(req);}catch(e){return send(res,e.code===413?413:400,{error:e.code===413?'too_large':'body'},log);}
 if(Buffer.byteLength(raw,'utf8')>MAX_BYTES)return send(res,413,{error:'too_large'},log);
 try{const v=JSON.parse(raw);if(v===null||typeof v!=='object'||Array.isArray(v))throw 0;}catch{return send(res,400,{error:'invalid_json'},log);}
 if(env.RUBIK_ASSISTANT_ENABLED!=='1')return send(res,503,{error:'provider_disabled',message:'El asistente de texto no está activado en este despliegue.'},log);
 return send(res,501,{error:'auth_unavailable',message:'Faltan sesiones autenticadas y cuotas por profesional (GOV-06a): no se atiende ninguna consulta con modelo.'},log);
}
module.exports=(req,res)=>handler(req,res);
module.exports.handler=handler;module.exports.MAX_BYTES=MAX_BYTES;
