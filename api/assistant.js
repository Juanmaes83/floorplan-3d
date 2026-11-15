/* RUBIK · Asistente generativo · pasarela de servidor del MODELO DE TEXTO (Vercel Node function, POST /api/assistant).
   Contrato rubik-assistant/2. Diseño y decisiones: docs/product/assistant-ai-v3/01-diseno-asistente-generativo.md.
   CERRADO POR DEFECTO. Ningún camino llama al proveedor salvo que se cumpla TODO lo siguiente (nada más lo activa):
   1. RUBIK_ASSISTANT_ENABLED === '1'. Sin él: 503 'provider_disabled' (estado de este despliegue).
   2. Código de acceso propio RUBIK_ASSISTANT_TOKEN (32–200), distinto de RUBIK_RENDER_TOKEN, RUBIK_SHARE_TOKEN y
      RUBIK_PHOTO_REFORM_TOKEN; enviado en x-rubik-assistant-code y comparado en tiempo constante. Sin código configurado:
      501 'auth_unavailable' (no hay sesiones GOV-06a: el código es el control de acceso provisional, como en Render IA).
   3. Production solo con RUBIK_ASSISTANT_ALLOW_PRODUCTION === '1' (decisión expresa del propietario). Si no: 503.
   4. Proveedor de una lista CERRADA (PROVIDERS) con su endpoint https fijo, y CLAVE PROPIA RUBIK_ASSISTANT_PROVIDER_KEY,
      distinta de la clave de Render IA: contabilidad, límite en el proveedor y revocación separados.
   5. Modelo RUBIK_ASSISTANT_MODEL, tarifa FECHADA (RUBIK_ASSISTANT_PRICE_INPUT_PER_MTOK, _OUTPUT_PER_MTOK,
      _PRICE_DATE) y TOPE RUBIK_ASSISTANT_BUDGET_CAP_USD > 0 aprobado por el propietario. Ningún precio está en el código.
   6. Un ALMACÉN PERSISTENTE atómico inyectado (reserva/liquidación del gasto, idempotencia, límite por minuto). La función
      desplegada usa store:null → 503 'store-not-configured' hasta que el propietario conecte uno (decisión pendiente).
   Protocolo:
   - {version:2, action:'status'} → {enabled, reason}; con código válido, además modelo, tope y gastado (sin secretos).
   - {version:2, action:'step', conversationId, idempotencyKey, consent:{question:true, projectData:true}, context, tools,
     messages} → una llamada al modelo. Las DEFINICIONES de herramientas y la política del sistema las pone ESTE servidor
     (js/assistant-agent-core.js); el navegador solo elige nombres de la lista. Antes de llamar se reserva el PEOR caso
     (entrada estimada + máximo de salida a la tarifa) contra el tope; después se liquida con el `usage` real. Sin
     `usage` fiable se liquida el peor caso (nunca 0 ficticio). Una sola llamada, sin reintentos automáticos.
   - Respuesta: {type:'message', text, usage} o {type:'tool_calls', calls:[{id,name,arguments}], usage}; llamadas fuera
     de la lista o con argumentos inválidos se descartan y se avisa al navegador.
   Privacidad: el navegador envía solo la pregunta y resultados minimizados de herramientas, con consentimiento. El
   registro es UNA línea JSON por petición, sin cuerpo, pregunta, proyecto, código, clave, IP ni agente de usuario. */
'use strict';
const {timingSafeEqual,createHash}=require('node:crypto');
const Agent=require('../js/assistant-agent-core.js');
const MAX_BYTES=96*1024,MIN_CODE=32,MAX_CODE=200,CONTRACT='rubik-assistant/2',TIMEOUT_MS=30000;
// Closed list of text providers: id → fixed endpoint and request/response mapping. Adding one is a code change + review.
const PROVIDERS=Object.freeze({'openai-chat':{endpoint:'https://api.openai.com/v1/chat/completions'}});
const ROLE=new Set(['user','assistant','tool']);
function sameSite(req){const origin=req.headers.origin;if(origin===undefined)return true;const host=req.headers['x-forwarded-host']||req.headers.host;
 try{return typeof origin==='string'&&!!host&&new URL(origin).host===String(host).split(',')[0].trim();}catch{return false;}}
function send(res,status,body,log,extra={}){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(body));log?.(JSON.stringify({fn:'assistant',status,reason:body.error||body.type||'ok',...extra}));}
async function readBody(req){if(req.body!==undefined)return typeof req.body==='string'?req.body:JSON.stringify(req.body);let size=0;const chunks=[];
 for await(const c of req){size+=c.length;if(size>MAX_BYTES)throw Object.assign(new Error('too large'),{code:413});chunks.push(c);}return Buffer.concat(chunks).toString('utf8');}
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:NaN;};
// Every gate, in order. Returns {ok, s} or the closed refusal. Never reads a secret it does not need.
function settings(env){
 if(env.RUBIK_ASSISTANT_ENABLED!=='1')return {ok:false,status:503,error:'provider_disabled',message:'El asistente de texto no está activado en este despliegue.'};
 const code=env.RUBIK_ASSISTANT_TOKEN;
 if(typeof code!=='string'||code.length<MIN_CODE||code.length>MAX_CODE)return {ok:false,status:501,error:'auth_unavailable',message:'Falta el control de acceso del asistente (código propio; no hay sesiones GOV-06a).'};
 if([env.RUBIK_RENDER_TOKEN,env.RUBIK_SHARE_TOKEN,env.RUBIK_PHOTO_REFORM_TOKEN].includes(code))return {ok:false,status:503,error:'misconfigured',message:'El código del asistente debe ser propio.'};
 if(env.VERCEL_ENV==='production'&&env.RUBIK_ASSISTANT_ALLOW_PRODUCTION!=='1')return {ok:false,status:503,error:'production_not_authorized',message:'No autorizado en Production.'};
 const provider=PROVIDERS[env.RUBIK_ASSISTANT_PROVIDER];if(!provider)return {ok:false,status:503,error:'provider_not_configured',message:'Proveedor de texto no configurado.'};
 const key=env.RUBIK_ASSISTANT_PROVIDER_KEY;if(typeof key!=='string'||key.length<20)return {ok:false,status:503,error:'provider_not_configured',message:'Falta la clave propia del proveedor de texto.'};
 if(key===env.OPENAI_API_KEY)return {ok:false,status:503,error:'misconfigured',message:'La clave del asistente debe ser propia (no la de Render IA).'};
 const model=env.RUBIK_ASSISTANT_MODEL;if(!/^[a-z0-9][a-z0-9.\-:]{2,63}$/i.test(model||''))return {ok:false,status:503,error:'provider_not_configured',message:'Falta el modelo de texto.'};
 const pin=num(env.RUBIK_ASSISTANT_PRICE_INPUT_PER_MTOK),pout=num(env.RUBIK_ASSISTANT_PRICE_OUTPUT_PER_MTOK),date=env.RUBIK_ASSISTANT_PRICE_DATE,cap=num(env.RUBIK_ASSISTANT_BUDGET_CAP_USD);
 if(!(pin>0&&pout>0)||!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return {ok:false,status:503,error:'price_not_configured',message:'Falta la tarifa fechada del modelo de texto.'};
 if(!(cap>0))return {ok:false,status:503,error:'budget_not_configured',message:'Falta el tope de gasto aprobado.'};
 const maxOut=Math.min(4000,Math.max(100,num(env.RUBIK_ASSISTANT_MAX_OUTPUT_TOKENS)||800)),perMinute=Math.min(60,Math.max(1,num(env.RUBIK_ASSISTANT_MAX_PER_MINUTE)||6));
 return {ok:true,s:{code,provider:env.RUBIK_ASSISTANT_PROVIDER,endpoint:provider.endpoint,key,model,pin,pout,date,cap,maxOut,perMinute}};
}
const codeOk=(given,code)=>{if(typeof given!=='string'||given.length!==code.length)return false;try{return timingSafeEqual(Buffer.from(given),Buffer.from(code));}catch{return false;}};
// Validation of the conversation the browser sends: closed roles, sizes, tool names from the whitelist.
function checkMessages(messages,tools){
 if(!Array.isArray(messages)||!messages.length||messages.length>60)return 'messages';
 let chars=0;for(const m of messages){if(!m||!ROLE.has(m.role))return 'role';
  if(m.content!==null&&m.content!==undefined&&typeof m.content!=='string')return 'content';chars+=String(m.content||'').length;
  if(m.role==='tool'&&(typeof m.tool_call_id!=='string'||!tools.includes(m.name)))return 'tool-message';
  if(m.tool_calls){if(m.role!=='assistant'||!Array.isArray(m.tool_calls)||m.tool_calls.length>Agent.LIMITS.maxToolCallsPerStep)return 'tool-calls';
   for(const c of m.tool_calls){if(typeof c.id!=='string'||!tools.includes(c.name)||typeof c.arguments!=='string'||c.arguments.length>2000)return 'tool-call';chars+=c.arguments.length;}}}
 if(messages.at(-1).role==='assistant'&&!messages.at(-1).tool_calls)return 'last';
 return chars>80000?'too-long':null;
}
// Provider request/response mapping (OpenAI Chat Completions with function tools).
function providerBody(s,tools,messages,context){
 const defs=Agent.TOOLS.filter(t=>tools.includes(t.name)).map(t=>({type:'function',function:{name:t.name,description:t.description,parameters:t.parameters}}));
 const sys=Agent.SYSTEM_POLICY+`\nWork area now: ${Agent.AREAS.includes(context?.area)?context.area:'design'}. Reply language preference: ${['es','en','zh'].includes(context?.lang)?context.lang:'es'}.`;
 const msgs=[{role:'system',content:sys},...messages.map(m=>m.role==='tool'?{role:'tool',tool_call_id:m.tool_call_id,content:String(m.content||'')}
  :m.tool_calls?{role:'assistant',content:m.content??null,tool_calls:m.tool_calls.map(c=>({id:c.id,type:'function',function:{name:c.name,arguments:c.arguments}}))}:{role:m.role,content:String(m.content||'')})];
 return {model:s.model,messages:msgs,tools:defs,tool_choice:'auto',max_completion_tokens:s.maxOut};
}
function parseProvider(json,tools){
 const msg=json?.choices?.[0]?.message;const u=json?.usage||{};
 const usage={inputTokens:Number.isInteger(u.prompt_tokens)?u.prompt_tokens:null,outputTokens:Number.isInteger(u.completion_tokens)?u.completion_tokens:null};
 if(!msg)return {type:'error',code:'provider_error',usage};
 const raw=Array.isArray(msg.tool_calls)?msg.tool_calls:[],calls=[],dropped=[];
 for(const c of raw.slice(0,Agent.LIMITS.maxToolCallsPerStep)){const name=c?.function?.name,args=c?.function?.arguments;
  if(c?.type!=='function'||!tools.includes(name)||typeof args!=='string'||args.length>2000||typeof c.id!=='string'){dropped.push(String(name||'?').slice(0,40));continue;}
  let parsed;try{parsed=JSON.parse(args||'{}');}catch{dropped.push(name);continue;}
  if(!Agent.checkArgs(name,parsed).ok){dropped.push(name);continue;}calls.push({id:c.id.slice(0,64),name,arguments:args});}
 if(calls.length)return {type:'tool_calls',calls,dropped,usage};
 if(typeof msg.content==='string'&&msg.content.trim())return {type:'message',text:msg.content.slice(0,Agent.LIMITS.maxMessageChars),dropped,usage};
 return {type:'error',code:'provider_error',dropped,usage};
}
const costOf=(s,inTok,outTok)=>+((inTok*s.pin+outTok*s.pout)/1e6).toFixed(6);
async function handler(req,res,{env=process.env,log=console.log,store=null,fetch:f=globalThis.fetch,now=Date.now}={}){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'method'},log);}
 if(!sameSite(req))return send(res,403,{error:'origin'},log);
 if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return send(res,415,{error:'content_type'},log);
 const declared=Number(req.headers['content-length']);if(Number.isFinite(declared)&&declared>MAX_BYTES)return send(res,413,{error:'too_large'},log);
 let raw;try{raw=await readBody(req);}catch(e){return send(res,e.code===413?413:400,{error:e.code===413?'too_large':'body'},log);}
 if(Buffer.byteLength(raw,'utf8')>MAX_BYTES)return send(res,413,{error:'too_large'},log);
 let body;try{body=JSON.parse(raw);if(body===null||typeof body!=='object'||Array.isArray(body))throw 0;}catch{return send(res,400,{error:'invalid_json'},log);}
 const g=settings(env);
 if(body.action==='status'&&body.version===2){
  if(!g.ok)return send(res,200,{enabled:false,reason:g.error},log,{action:'status'});
  if(!codeOk(req.headers['x-rubik-assistant-code'],g.s.code))return send(res,200,{enabled:true,reason:'code-required',requiresCode:true},log,{action:'status'});
  const st=store?.snapshot?await store.snapshot('text'):null;
  return send(res,200,{enabled:!!store,reason:store?'ok':'store-not-configured',model:g.s.model,priceDate:g.s.date,capUsd:g.s.cap,spentUsd:st?.spentUsd??null},log,{action:'status'});}
 if(!g.ok)return send(res,g.status,{error:g.error,message:g.message},log);
 const s=g.s;
 if(req.headers['x-rubik-contract']!==CONTRACT||body.version!==2||body.action!=='step')return send(res,400,{error:'contract'},log);
 if(!codeOk(req.headers['x-rubik-assistant-code'],s.code)){const n=store?.fail?await store.fail('code',now()):0;return send(res,n>20?429:401,{error:n>20?'too_many_attempts':'code'},log);}
 if(!store||typeof store.reserve!=='function')return send(res,503,{error:'store-not-configured',message:'Falta el almacén persistente de gasto y límites.'},log);
 if(body.consent?.question!==true||body.consent?.projectData!==true)return send(res,400,{error:'consent_required'},log);
 const tools=Array.isArray(body.tools)?body.tools.filter(n=>Agent.NAMES.includes(n)):[];
 const bad=checkMessages(body.messages,tools);if(bad)return send(res,400,{error:'messages',detail:bad},log);
 const idem=String(body.idempotencyKey||'');if(!/^[A-Za-z0-9_.:-]{8,120}$/.test(idem))return send(res,400,{error:'idempotency'},log);
 if(!await store.setIfAbsent('idem:'+idem,{status:'in-progress'},24*3600e3))return send(res,409,{error:'already-processed'},log);
 if(!await store.rate('text',now(),s.perMinute))return send(res,429,{error:'rate_limited'},log);
 const pb=providerBody(s,tools,body.messages,body.context),estIn=Math.ceil(JSON.stringify(pb).length/3)+200,worst=costOf(s,estIn,s.maxOut);
 const id='txt_'+createHash('sha256').update(idem).digest('hex').slice(0,16),reservation=await store.reserve({id,family:'text',usd:worst,capUsd:s.cap});
 if(!reservation.ok){await store.set('idem:'+idem,{status:'refused-'+reservation.reason},24*3600e3);return send(res,402,{error:'budget_exceeded',message:'Se ha alcanzado el tope de gasto aprobado.',capUsd:s.cap},log,{model:s.model});}
 const t0=now(),ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),TIMEOUT_MS);let pres,json;
 try{pres=await f(s.endpoint,{method:'POST',signal:ctl.signal,headers:{'content-type':'application/json',authorization:'Bearer '+s.key},body:JSON.stringify(pb)});json=await pres.json().catch(()=>null);}
 catch{clearTimeout(timer);await store.settle(id,{usd:worst});await store.set('idem:'+idem,{status:'provider-unreachable-billing-unknown'},24*3600e3);
  return send(res,502,{error:'provider_unreachable',message:'El proveedor no ha respondido; se retiene el peor caso como gastado.'},log,{model:s.model,usd:worst,ms:now()-t0});}
 clearTimeout(timer);
 if(!pres.ok){const billedUnknown=pres.status>=500;await store.settle(id,{usd:billedUnknown?worst:0});await store.set('idem:'+idem,{status:'provider-'+pres.status},24*3600e3);
  return send(res,502,{error:'provider_error',status:pres.status},log,{model:s.model,pstatus:pres.status,usd:billedUnknown?worst:0});}
 const out=parseProvider(json,tools),inTok=out.usage.inputTokens,outTok=out.usage.outputTokens,known=inTok!==null&&outTok!==null,usd=known?costOf(s,inTok,outTok):worst;
 const st=await store.settle(id,{usd});await store.set('idem:'+idem,{status:out.type},24*3600e3);
 const usage={inputTokens:inTok,outputTokens:outTok,costUsd:usd,costBasis:known?`tarifa ${s.date}`:'peor caso (uso no informado)',spentUsd:st?.spentUsd??null,capUsd:s.cap};
 return send(res,out.type==='error'?502:200,{...out,usage,model:s.model},log,{model:s.model,type:out.type,inTok,outTok,usd,dropped:(out.dropped||[]).length,ms:now()-t0});
}
// In-memory store for TESTS ONLY (not durable across instances): same interface a persistent store must implement.
function memoryStore({now=Date.now}={}){
 const kv=new Map(),res=new Map(),spent={text:0,image:0},hits=[];let fails=0;
 return {async get(k){const v=kv.get(k);return v&&v.exp>now()?v.val:null;},async set(k,val,ttl){kv.set(k,{val,exp:now()+ttl});},
  async setIfAbsent(k,val,ttl){const v=kv.get(k);if(v&&v.exp>now())return false;kv.set(k,{val,exp:now()+ttl});return true;},
  async rate(family,t,perMinute){while(hits.length&&hits[0]<=t-60000)hits.shift();if(hits.length>=perMinute)return false;hits.push(t);return true;},
  async fail(){return ++fails;},
  async reserve({id,family,usd,capUsd}){const reserved=[...res.values()].filter(r=>!r.done).reduce((a,r)=>a+r.usd,0);if(spent.text+spent.image+reserved+usd>capUsd+1e-9)return {ok:false,reason:'cap'};res.set(id,{family,usd,done:false});return {ok:true};},
  async settle(id,{usd}){const r=res.get(id);if(r&&!r.done){r.done=true;spent[r.family]=+(spent[r.family]+usd).toFixed(6);}return {spentUsd:+(spent.text+spent.image).toFixed(6),text:spent.text,image:spent.image};},
  async snapshot(){return {spentUsd:+(spent.text+spent.image).toFixed(6),text:spent.text,image:spent.image};}};
}
module.exports=(req,res)=>handler(req,res,{store:null});
Object.assign(module.exports,{handler,settings,checkMessages,providerBody,parseProvider,memoryStore,PROVIDERS,CONTRACT,MAX_BYTES});
