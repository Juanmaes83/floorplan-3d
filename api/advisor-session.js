/* RUBIK · Asesor en vivo · inicio CONTROLADO POR EL SERVIDOR de una conversación Nuance Live (POST /api/advisor-session).
   CERRADO POR DEFECTO: sin TODAS estas condiciones responde 503 y no llama al proveedor.
   1. RUBIK_ADVISOR_ENABLED === '1' y VERCEL_ENV === 'preview' (nunca Production en este piloto).
   2. Código de operador propio RUBIK_ADVISOR_TOKEN (32–200), distinto de los demás códigos de RUBIK; cabecera
      x-rubik-advisor-code, comparado en tiempo constante. Es la autenticación provisional del operador del Preview.
   3. Clave de servidor RUBIK_ADVISOR_NUANCE_KEY (nk_…): nunca sale del servidor ni se registra.
   4. Topes aprobados: RUBIK_ADVISOR_DAILY_STARTS (1–200 inicios/día) y RUBIK_ADVISOR_MAX_SESSION_SECONDS (30–1800).
   5. Almacén atómico (RUBIK_SPEND_STORE_URL/_TOKEN, Redis): reserva de inicio diaria y UNA sesión activa por operador.
   Flujo de inicio (action:'start'), en este orden y todo en servidor:
     a) autenticar operador → b) reservar cuota (atómico; sesión activa en uso → 409) → c) GET /usage: available_credits>0
     → d) POST /session-tokens con end_user_id seudónimo, cámara del usuario desactivada (video.input.camera:false) y
     delegación «responses» con la lista EXPLÍCITA de herramientas del modo cliente → e) POST /conversation con ese token
     y max_session_seconds (el tope se fija aquí, en servidor) → f) solo entonces se devuelve al navegador
     {conversationId, sessionToken}: un token YA GASTADO que, según la documentación, solo alcanza esa conversación.
     Si algo falla tras crearla, se cierra desde servidor (POST /conversation/{id}/end) y se libera la reserva.
   Cierre (action:'end' | 'abandon'): el servidor llama a /end o /abandon con Content-Length: 0 y libera la sesión activa.
   Lo que NO acredita el tope: un temporizador de interfaz. El tope real es max_session_seconds fijado en (e) + el cierre
   de servidor; la reconciliación con GET /usage queda para el ensayo autorizado.
   Nota honesta: que el servidor llame a POST /conversation con el token es una inferencia de la documentación (no está
   prohibido ni descrito); se verifica en el primer ensayo privado. */
'use strict';
const {createHash}=require('node:crypto');
const {sameSite,sameCode,MIN_CODE,MAX_CODE}=require('./_share-auth.js');
const {restExec}=require('./_spend-ledger.js');
const API='https://api.nuancelabs.ai';
const MODES=['cliente'];
const PERSONAS=['sam','sonia','mira'];
// Reserva atómica: inicios del día (con tope) + bloqueo de sesión activa por operador (con caducidad = tope + margen).
const RESERVE="local n=tonumber(redis.call('GET',KEYS[1]) or '0'); if n>=tonumber(ARGV[1]) then return 0 end; if redis.call('SET',KEYS[2],ARGV[2],'NX','EX',ARGV[3])==false then return -1 end; redis.call('INCR',KEYS[1]); if n==0 then redis.call('EXPIRE',KEYS[1],172800) end; return 1";
const RELEASE="if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0";

function config(env){
 const code=env.RUBIK_ADVISOR_TOKEN,starts=Number(env.RUBIK_ADVISOR_DAILY_STARTS),secs=Number(env.RUBIK_ADVISOR_MAX_SESSION_SECONDS);
 if(env.RUBIK_ADVISOR_ENABLED!=='1'||env.VERCEL_ENV!=='preview'||typeof code!=='string'||code.length<MIN_CODE||code.length>MAX_CODE||
  [env.RUBIK_RENDER_TOKEN,env.RUBIK_SHARE_TOKEN,env.RUBIK_ASSISTANT_TOKEN,env.RUBIK_PHOTO_REFORM_TOKEN,env.RUBIK_CONTEXT_TOKEN].includes(code)||
  !/^nk_/.test(env.RUBIK_ADVISOR_NUANCE_KEY||'')||!env.RUBIK_SPEND_STORE_URL||!env.RUBIK_SPEND_STORE_TOKEN||
  !Number.isSafeInteger(starts)||starts<1||starts>200||!Number.isSafeInteger(secs)||secs<30||secs>1800)return null;
 // La base del proveedor es fija; solo una prueba local (VERCEL_ENV preview + RUBIK_ADVISOR_TEST_API) puede apuntar a un simulador.
 const api=env.RUBIK_ADVISOR_TEST_API&&/^http:\/\/127\.0\.0\.1:\d+$/.test(env.RUBIK_ADVISOR_TEST_API)?env.RUBIK_ADVISOR_TEST_API:API;
 return {code,starts,secs,key:env.RUBIK_ADVISOR_NUANCE_KEY,api};
}
function send(res,status,body,extra={}){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');for(const[k,v]of Object.entries(extra))res.setHeader(k,v);res.end(JSON.stringify(body));}
async function read(req){if(req.body!==undefined)return typeof req.body==='string'?JSON.parse(req.body):req.body;let n=0;const ch=[];for await(const c of req){n+=c.length;if(n>8192)throw Error('big');ch.push(c);}return JSON.parse(Buffer.concat(ch).toString('utf8')||'{}');}
const ID=/^[0-9a-f-]{36}$/;
const pseudo=code=>'op_'+createHash('sha256').update('rubik-advisor:'+code).digest('hex').slice(0,24);

// Lista EXPLÍCITA del modo cliente (la misma de labs/asesor-rubik/tools.js), en el formato plano de delegación.
function clientTools(){
 const none={type:'object',properties:{},required:[],additionalProperties:false};
 return [
  {type:'function',name:'consultar_superficies',description:'Usable floor area per room and total for the active project, each marked as measured or estimated.',parameters:none,annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true}},
  {type:'function',name:'enfocar_estancia',description:'Selects and shows one room in the viewer. Temporary view change; it never modifies the project.',parameters:{type:'object',properties:{roomName:{type:'string'}},required:['roomName'],additionalProperties:false},annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true}},
  {type:'function',name:'continuar_por_texto',description:'Offers to continue in the RUBIK text Assistant. Only the text the person authorizes is handed over.',parameters:{type:'object',properties:{pregunta:{type:'string'}},required:[],additionalProperties:false},annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true}}];
}
const TERMINAL=new Set(['ended','abandoned','failed','expired']);
// Cierre con reintento: /abandon con el token de sesión; /end con la clave de servidor. Si la respuesta no confirma un estado
// terminal (p. ej. 200 aún activa), se reconcilia llamando a /end con la clave de servidor. 404 = la conversación ya no existe.
async function finish(s,action,id,sessionToken,{fetch:f=globalThis.fetch,tries=3}={}){let last={status:0,state:null,terminal:false,retryable:true};
 for(let i=0;i<tries;i++){const act=i===0?action:'end',auth=act==='abandon'?sessionToken:s.key;
  let r;try{r=await call(s.fetch||f,s.api,`/conversation/${id}/${act}`,{auth});}catch{last={status:0,state:null,terminal:false,retryable:true};continue;}
  const state=r.body?.status||null;
  if(r.status===404)return {status:404,state:'not_found',terminal:true};
  if(r.status>=200&&r.status<300&&TERMINAL.has(state))return {status:r.status,state,terminal:true};
  last={status:r.status,state,terminal:false,retryable:r.status===0||r.status>=500||(r.status>=200&&r.status<300)};
  if(r.status===401||r.status===403)break;}
 return last;}
// Instrucciones al proveedor en inglés (contrato de Nuance); la interfaz de RUBIK se muestra en español.
const PROMPT='You are "RUBIK Advisor", an artificial intelligence assistant (say so if asked). This is a demonstration session with the sample home. Read-only: room areas, showing a room, and continuing in text. Do not give prices, do not modify the project, do not publish anything and do not give binding legal or tax advice. Be brief, honest and realistic; if you do not know, say so. Reply in the language the person speaks.';

async function call(fetch,api,path,{method='POST',auth,body}={}){
 const headers={Authorization:'Bearer '+auth};let payload;
 if(body===undefined){if(method==='POST')headers['Content-Length']='0';}else{headers['Content-Type']='application/json';payload=JSON.stringify(body);}
 const r=await fetch(api+path,{method,headers,body:payload});let j=null;try{j=await r.json();}catch{}
 return {status:r.status,body:j,retry:r.headers?.get?.('retry-after')||j?.retry_after_seconds||null};}
// Errores del proveedor → respuesta para el navegador (sin filtrar detalles internos ni secretos).
const MAP={401:'invalid_credential',403:'forbidden',409:'concurrency_limit',503:'unavailable'};
function providerError(r){const code=r.body?.code;const out=r.status===429?(code==='credits_spent'||code==='start_limit'||code==='capacity_unavailable'?code:'start_limit'):(MAP[r.status]||'provider');
 return {status:r.status===429?429:r.status===409?409:r.status===401||r.status===403?502:503,error:out,retryAfterSeconds:r.retry?Number(r.retry):undefined};}

function createHandler({env=process.env,fetch=globalThis.fetch,now=Date.now,store=null,log=()=>{}}={}){
 const exec=()=>store||restExec({url:env.RUBIK_SPEND_STORE_URL,token:env.RUBIK_SPEND_STORE_TOKEN,fetch});
 return async function handler(req,res){
  if(req.method!=='POST')return send(res,405,{error:'method'});
  if(!sameSite(req))return send(res,403,{error:'origin'});
  const s=config(env);if(!s)return send(res,503,{error:'unavailable'});s.fetch=fetch;
  const code=req.headers['x-rubik-advisor-code'];if(typeof code!=='string'||code.length>MAX_CODE||!sameCode(code,s.code))return send(res,401,{error:'code'});
  let input;try{input=await read(req);}catch{return send(res,400,{error:'input'});}
  const op=pseudo(code),lockKey='rubik:advisor:active:'+op,cancelKey='rubik:advisor:cancel:'+op;
  if(input?.action==='end'||input?.action==='abandon'){
   // Cancelación antes de que exista la conversación (coincide con el arranque): se anota y el arranque la cierra.
   if(input.action==='abandon'&&!input.conversationId){
    try{const cur=await exec()(['GET',lockKey]);if(typeof cur==='string'&&cur.startsWith('pending:')){await exec()(['SET',cancelKey,'1','EX',s.secs+120]);return send(res,202,{ended:false,pending:true,cancelled:true});}}catch{return send(res,503,{error:'store'});}
    return send(res,200,{ended:true,status:null});}
   if(!ID.test(input.conversationId||''))return send(res,400,{error:'input'});
   // /abandon: credencial del navegador (token de sesión de ESA conversación). /end: clave de servidor.
   if(input.action==='abandon'&&!/^st_[A-Za-z0-9]{8,200}$/.test(input.sessionToken||''))return send(res,400,{error:'input'});
   const r=await finish(s,input.action,input.conversationId,input.sessionToken);
   log(JSON.stringify({fn:'advisor',action:input.action,status:r.status,terminal:r.terminal}));
   // El bloqueo de sesión SOLO se libera con estado terminal confirmado (o reconciliado: 404 = ya no existe).
   if(r.terminal){try{await exec()(['EVAL',RELEASE,'1',lockKey,input.conversationId]);}catch{}return send(res,200,{ended:true,status:r.state});}
   return send(res,r.retryable?503:502,{ended:false,pending:true,status:r.state,retry:true});}
  if(input?.action!=='start'||!MODES.includes(input.mode)||(input.persona&&!PERSONAS.includes(input.persona)))return send(res,400,{error:'input'});
  // b) reserva atómica: inicio del día + sesión activa del operador.
  const day=new Date(now()).toISOString().slice(0,10),holder='pending:'+now();
  let reserved;try{reserved=Number(await exec()(['EVAL',RESERVE,'2','rubik:advisor:starts:'+day,lockKey,s.starts,holder,s.secs+120]));}catch{return send(res,503,{error:'store'});}
  if(reserved===0)return send(res,429,{error:'quota'});
  if(reserved===-1)return send(res,409,{error:'active_session'});
  const release=async()=>{try{await exec()(['EVAL',RELEASE,'1',lockKey,holder]);}catch{}};
  try{
   // c) saldo del proveedor antes de iniciar.
   const u=await call(fetch,s.api,'/usage',{method:'GET',auth:s.key});
   if(u.status!==200){await release();const e=providerError(u);return send(res,e.status,e);}
   if(!(u.body?.available_credits>0)){await release();return send(res,429,{error:'credits_spent'});}
   // d) token de sesión: persona, cámara del usuario apagada, herramientas explícitas del modo cliente.
   const t=await call(fetch,s.api,'/session-tokens',{auth:s.key,body:{end_user_id:op,personality:{system_prompt:PROMPT,persona_id:input.persona||'sam'},
    interface_setup:{video:{input:{camera:false}},delegation:{type:'responses',responses:{model:'default',tools:clientTools(),tool_choice:'auto',parallel_tool_calls:false}}}}});
   if(t.status!==201||!/^st_/.test(t.body?.token||'')){await release();const e=providerError(t);return send(res,e.status,e);}
   // e) el SERVIDOR crea la conversación con el tope de segundos.
   const c=await call(fetch,s.api,'/conversation',{auth:t.body.token,body:{timezone:'Europe/Madrid',max_session_seconds:s.secs}});
   if(c.status!==201||!ID.test(c.body?.id||'')){await release();const e=providerError(c);return send(res,e.status,e);}
   try{await exec()(['SET',lockKey,c.body.id,'XX','EX',s.secs+120]);}catch{}
   // ¿Se canceló mientras arrancaba? Se cierra desde servidor y no se entrega acceso al navegador.
   let cancelled=null;try{cancelled=await exec()(['GET',cancelKey]);}catch{}
   if(cancelled){try{await exec()(['DEL',cancelKey]);}catch{}const f=await finish(s,'end',c.body.id);
    if(f.terminal){try{await exec()(['EVAL',RELEASE,'1',lockKey,c.body.id]);}catch{}}
    log(JSON.stringify({fn:'advisor',action:'start_cancelled',terminal:f.terminal}));return send(res,409,{error:'cancelled',ended:f.terminal});}
   log(JSON.stringify({fn:'advisor',action:'start',status:201,warnings:(t.body.warnings||[]).length,tools:clientTools().map(x=>x.name)}));
   // f) acceso SOLO a esa conversación.
   return send(res,201,{conversationId:c.body.id,sessionToken:t.body.token,maxSessionSeconds:s.secs,api:s.api,tools:clientTools().map(x=>x.name)});
  }catch{await release();return send(res,503,{error:'unavailable'});}
 };}

module.exports=createHandler();
module.exports.createHandler=createHandler;
module.exports.clientTools=clientTools;
