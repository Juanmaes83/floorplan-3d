/* Phase B2: AI render of a real Rubik view (Vercel Node function, POST /api/render).
   The browser sends ONE prepared 3D view (JPEG/PNG data URL) and a style key; this function forwards it to OpenAI's
   image edit endpoint with a fixed, server-side prompt that keeps the view's geometry, and returns the image.
   - OPENAI_API_KEY never reaches the browser (Vercel environment secret).
   - RUBIK_RENDER_TOKEN: shared access token the professional enters once in Rubik; without it the endpoint refuses,
     so nobody can spend the owner's OpenAI credit through the public URL.
   - Only the image and a style are sent: no project data, location or contact. Nothing is stored here.
   The Rubik geometry stays the authority: the AI only changes the presentation of one image.
   RENDER AI D1 · access and spending guards (server side, before any provider call):
   - RUBIK_RENDER_ENABLED must be exactly '1'. Without it the endpoint answers 503 'disabled': a deployment never
     spends by accident because a key happens to be configured.
   - A request that declares an Origin from another site is refused (403 'origin'); same-site calls are unchanged.
   - Wrong access codes are counted: after RUBIK_RENDER_MAX_TOKEN_FAILS per hour the endpoint stops comparing (429).
   - Provider calls are capped per hour and per day (RUBIK_RENDER_MAX_PER_HOUR / _PER_DAY; 429 'limit').
     These counters live in the memory of one function instance (no database, no paid service), so they are a
     best-effort brake; the binding monthly budget is the one set on the provider account. See docs/render-ai/.
   RENDER AI D1 · IMG-02 · usage and cost per generation:
   - The provider's `usage` (tokens) is read from a closed list of integer fields and returned with the image.
   - A cost is estimated ONLY when the owner sets the tariff in the environment (USD per million tokens:
     RUBIK_RENDER_PRICE_INPUT_TEXT, RUBIK_RENDER_PRICE_INPUT_IMAGE, RUBIK_RENDER_PRICE_OUTPUT). No price is hard-coded:
     prices change and the binding figure is the provider's bill.
   - One JSON line per provider call goes to the function log (Vercel runtime logs): model, style, finishes, status,
     duration, usage and estimated cost. Never the image, the access code, the key or the client's address. */
'use strict';
const {timingSafeEqual}=require('node:crypto');
const same=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
const MODEL=process.env.RUBIK_RENDER_MODEL||'gpt-image-2.5-sunburst';
const MAX_BYTES=3.5*1024*1024;
// Catálogo canónico compartido con el cliente y Home (js/render-styles.js): mismos ids, alias de versiones anteriores.
const CATALOG=require('../js/render-styles.js'),Ledger=require('./_spend-ledger.js'),crypto=require('crypto');
const STYLES=CATALOG.prompts;
// B8: material alternatives. Closed lists: the professional picks one, the server writes the words (no free text).
const FLOORS={
 'light-oak':'light natural oak wooden plank floor',
 walnut:'dark walnut wooden plank floor',
 microcement:'seamless light grey microcement floor',
 marble:'polished white marble floor with soft grey veins',
 terrazzo:'light terrazzo floor with small coloured chips',
 'large-tile':'large-format light beige porcelain tile floor'};
const WALLS={
 white:'smooth matte white painted walls',
 'warm-white':'warm off-white painted walls',
 sage:'soft sage green painted walls',
 'sand-plaster':'sand-coloured lime plaster walls',
 'grey-blue':'muted grey-blue painted walls'};
function prompt(style,{floor=null,walls=null}={}){
 return 'Turn this 3D view of a home into a photorealistic architectural visualization. '
  +'Keep EXACTLY the same camera angle, walls, wall positions, doors, windows, room layout, proportions and furniture placement. '
  +'Do not add or remove rooms, walls, openings or large furniture. Do not add text, logos or people. '
  +(floor||walls?'Change ONLY these finishes and nothing else: '+[floor&&`floor: ${FLOORS[floor]}`,walls&&`walls: ${WALLS[walls]}`].filter(Boolean).join('; ')+'. ':'')
  +`Style: ${STYLES[style]}.`;
}
// D1 limits. Integers from the environment, clamped; absent or invalid values fall back to conservative defaults.
const DEFAULT_LIMITS={perHour:10,perDay:30,tokenFailsPerHour:20};
function intEnv(v,fallback){if(typeof v!=='string'||!/^[0-9]{1,5}$/.test(v))return fallback;const n=Number(v);return n<=10000?n:fallback;}
function limits(env){return {perHour:intEnv(env.RUBIK_RENDER_MAX_PER_HOUR,DEFAULT_LIMITS.perHour),perDay:intEnv(env.RUBIK_RENDER_MAX_PER_DAY,DEFAULT_LIMITS.perDay),tokenFailsPerHour:intEnv(env.RUBIK_RENDER_MAX_TOKEN_FAILS,DEFAULT_LIMITS.tokenFailsPerHour)};}
const HOUR=3600e3,DAY=24*HOUR;
// Fixed windows per function instance. A meter is injectable so the tests control time and start clean.
function createMeter(){
 const w={hour:{start:-Infinity,count:0},day:{start:-Infinity,count:0},fails:{start:-Infinity,count:0}};
 const roll=(slot,size,now)=>{if(now-slot.start>=size){slot.start=now;slot.count=0;}return slot;};
 return {
  blockedByFails(now,max){return roll(w.fails,HOUR,now).count>=max;},
  fail(now){roll(w.fails,HOUR,now).count++;},
  // Reserves one provider call when both windows have room; otherwise says how long to wait (seconds).
  reserve(now,{perHour,perDay}){const h=roll(w.hour,HOUR,now),d=roll(w.day,DAY,now);
   if(d.count>=perDay)return {ok:false,retryAfter:Math.ceil((d.start+DAY-now)/1000)};
   if(h.count>=perHour)return {ok:false,retryAfter:Math.ceil((h.start+HOUR-now)/1000)};
   h.count++;d.count++;return {ok:true};},
  snapshot(){return {hour:{...w.hour},day:{...w.day},fails:{...w.fails}};}};
}
const defaultMeter=createMeter();
// Same-site check: browsers send Origin on cross-site POSTs. No Origin (server-to-server, old clients) is allowed:
// the access code still applies. A malformed Origin is refused.
function sameSite(req){
 const origin=req.headers.origin;if(origin===undefined)return true;
 const host=req.headers['x-forwarded-host']||req.headers.host;
 try{return typeof origin==='string'&&!!host&&new URL(origin).host===String(host).split(',')[0].trim();}catch{return false;}
}
// IMG-02: usage from the provider, only known integer fields; anything else is ignored.
function usageOf(u){
 if(!u||typeof u!=='object')return null;
 const int=v=>Number.isSafeInteger(v)&&v>=0?v:null,d=u.input_tokens_details&&typeof u.input_tokens_details==='object'?u.input_tokens_details:{};
 const out={inputTokens:int(u.input_tokens),outputTokens:int(u.output_tokens),totalTokens:int(u.total_tokens),inputTextTokens:int(d.text_tokens),inputImageTokens:int(d.image_tokens)};
 return Object.values(out).some(v=>v!==null)?out:null;
}
// Tariff from the environment (USD per 1M tokens). Absent or invalid → no estimate.
function priceEnv(v){if(typeof v!=='string'||!/^\d{1,4}(\.\d{1,6})?$/.test(v.trim()))return null;return Number(v.trim());}
function tariff(env){const t={inputText:priceEnv(env.RUBIK_RENDER_PRICE_INPUT_TEXT),inputImage:priceEnv(env.RUBIK_RENDER_PRICE_INPUT_IMAGE),output:priceEnv(env.RUBIK_RENDER_PRICE_OUTPUT)};return Object.values(t).every(v=>v!==null)?t:null;}
function costOf(usage,t){
 if(!usage||!t||usage.outputTokens===null)return null;
 let text=usage.inputTextTokens,image=usage.inputImageTokens;
 if(text===null&&image===null){if(usage.inputTokens===null)return null;image=usage.inputTokens;text=0;} // undetailed input: priced as image (the dearer side) to never under-estimate
 const amount=((text||0)*t.inputText+(image||0)*t.inputImage+usage.outputTokens*t.output)/1e6;
 return {amount:Math.round(amount*1e6)/1e6,currency:'USD',basis:'tariff-env'};
}
function logCall(entry,log){try{log(JSON.stringify({event:'rubik-render',...entry}));}catch{}}
function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
function parseImage(dataUrl){
 const m=/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl||''));
 if(!m)return null;const bytes=Buffer.from(m[2],'base64');
 if(!bytes.length||bytes.length>MAX_BYTES)return null;return {type:m[1],bytes};
}
/* §3 · Cuota GLOBAL persistente (opcional, cerrada por defecto). Con RUBIK_RENDER_GLOBAL_QUOTA=1 cada imagen reserva, de
   forma atómica entre instancias, 1 unidad y un importe en el libro común (api/_spend-ledger.js, el mecanismo de reservas
   existente) ANTES de llamar al proveedor, y liquida después. Sin almacén → 503 store-not-configured (nunca se cae a la
   cuota por instancia). El contador por instancia (createMeter) se conserva como primera barrera.
   COBERTURA DEL COSTE MÁXIMO: la reserva por imagen es max(RUBIK_RENDER_RESERVE_USD, cota) con
   cota = MAX_INPUT_TOKENS·max(precio texto, precio imagen) + MAX_OUTPUT_TOKENS·precio salida. Sin tarifa o sin cotas de
   tokens configuradas la cuota NO arranca (503 quota-not-configured). Como el tope común se comprueba con la reserva, la
   suma de reservas en vuelo (concurrencia incluida) nunca pasa del tope; si una liquidación real superase su reserva
   (cota mal configurada) se registra 'render-overrun' y se DETIENE la cuota (bloqueo persistente) hasta revisión. */
// COTA VERIFICADA: la cuota solo arranca si el propietario declara, para el MODELO EXACTO en uso, que las cotas de tokens
// proceden de una fuente oficial o de una medición propia que garantiza el máximo (RUBIK_RENDER_QUOTA_BOUND_MODEL=<modelo>).
// Para gpt-image-2.5-* no hay hoy fuente que garantice un máximo antes de llamar (el calculador de GPT Image 2 no estima 2.5),
// así que la cuota queda CERRADA (503 quota-bound-unverified). Los controles quedan listos para cuando exista esa fuente.
function imageDims(bytes){
 if(bytes.length>=24&&bytes.readUInt32BE(0)===0x89504e47)return {w:bytes.readUInt32BE(16),h:bytes.readUInt32BE(20)};
 if(bytes[0]===0xff&&bytes[1]===0xd8){let i=2;while(i+9<bytes.length){if(bytes[i]!==0xff){i++;continue;}const m=bytes[i+1],len=bytes.readUInt16BE(i+2);
  if(m>=0xc0&&m<=0xcf&&m!==0xc4&&m!==0xc8&&m!==0xcc)return {w:bytes.readUInt16BE(i+7),h:bytes.readUInt16BE(i+5)};i+=2+len;}}
 return null;}
function globalQuota(env,model=MODEL){if(env.RUBIK_RENDER_GLOBAL_QUOTA!=='1')return null;
 const n=(v,d)=>{const x=Number(v);return Number.isFinite(x)&&x>0?x:d;},t=tariff(env);
 const maxIn=n(env.RUBIK_RENDER_MAX_INPUT_TOKENS,null),maxOut=n(env.RUBIK_RENDER_MAX_OUTPUT_TOKENS,null);
 const verified=typeof env.RUBIK_RENDER_QUOTA_BOUND_MODEL==='string'&&env.RUBIK_RENDER_QUOTA_BOUND_MODEL===model;
 const bound=verified&&t&&maxIn&&maxOut?+((maxIn*Math.max(t.inputText,t.inputImage)+maxOut*t.output)/1e6).toFixed(6):null;
 return {verified,maxImages:Math.floor(n(env.RUBIK_RENDER_GLOBAL_MAX_IMAGES,30)),capUsd:n(env.RUBIK_RENDER_GLOBAL_CAP_USD,5),
  maxInputPx:Math.floor(n(env.RUBIK_RENDER_MAX_INPUT_PX,1536)),size:'1536x1024',n:1,
  bound,reserveUsd:bound===null?null:Math.max(n(env.RUBIK_RENDER_RESERVE_USD,0),bound)};}
const HALT='render-ia:halt';
async function handler(req,res,{fetchImpl=globalThis.fetch,env=process.env,meter=defaultMeter,now=Date.now,log=console.log,clock=Date.now,store}={}){
 if(req.method!=='POST')return send(res,405,{error:'method'});
 if(env.RUBIK_RENDER_ENABLED!=='1')return send(res,503,{error:'disabled'});
 if(!env.OPENAI_API_KEY||!env.RUBIK_RENDER_TOKEN)return send(res,503,{error:'not-configured'});
 if(!sameSite(req))return send(res,403,{error:'origin'});
 const lim=limits(env);
 if(meter.blockedByFails(now(),lim.tokenFailsPerHour)){res.setHeader('Retry-After','3600');return send(res,429,{error:'limit'});}
 const token=req.headers['x-rubik-render-token'];
 if(typeof token!=='string'||token.length>200||!same(token,env.RUBIK_RENDER_TOKEN)){meter.fail(now());return send(res,401,{error:'token'});}
 let body=req.body;if(typeof body==='string'){try{body=JSON.parse(body);}catch{return send(res,400,{error:'json'});}}
 const style=CATALOG.canonical(body?.style);if(!style)return send(res,400,{error:'style'});
 const floor=body?.floor??null,walls=body?.walls??null;
 if((floor!==null&&!Object.hasOwn(FLOORS,floor))||(walls!==null&&!Object.hasOwn(WALLS,walls)))return send(res,400,{error:'finish'});
 const image=parseImage(body?.image);if(!image)return send(res,400,{error:'image'});
 const slot=meter.reserve(now(),lim);
 if(!slot.ok){res.setHeader('Retry-After',String(slot.retryAfter));return send(res,429,{error:'limit',retryAfter:slot.retryAfter});}
 const gq=globalQuota(env);let settle=async()=>{};
 if(gq){if(!gq.verified)return send(res,503,{error:'quota-bound-unverified'});if(gq.reserveUsd===null)return send(res,503,{error:'quota-not-configured'});
  const d=imageDims(image.bytes);if(!d||d.w<1||d.h<1||Math.max(d.w,d.h)>gq.maxInputPx)return send(res,413,{error:'image-dimensions',maxInputPx:gq.maxInputPx});
  if(store===undefined)store=Ledger.storeFromEnv(env);if(!store)return send(res,503,{error:'store-not-configured'});
  const id='render-'+crypto.randomUUID();let r0;
  try{if(await store.get(HALT))return send(res,503,{error:'global-halted'});
   r0=await store.reserve({id,family:'image',usd:gq.reserveUsd,capUsd:gq.capUsd,units:1,maxUnits:gq.maxImages,subject:'render-ia',maxSubjectUnits:gq.maxImages,meta:{kind:'render-ia'}});}
  catch{return send(res,503,{error:'store-unavailable'});}
  if(!r0.ok)return send(res,429,{error:'global-limit',reason:r0.reason});
  // Nunca se silencia: un fallo de liquidación se registra, se marca en la respuesta y la reserva queda ABIERTA (sigue
  // contando contra el tope y aparece como 'open-reservations' en la conciliación).
  settle=async(ok,cost)=>{const known=cost&&Number.isFinite(cost.amount);
   const usd=ok?(known?cost.amount:gq.reserveUsd):(known?cost.amount:0);
   if(known&&cost.amount>gq.reserveUsd){logCall({status:'render-overrun',id,reservedUsd:gq.reserveUsd,actualUsd:cost.amount},log);
    try{await store.set(HALT,{at:new Date(now()).toISOString(),id,reservedUsd:gq.reserveUsd,actualUsd:cost.amount});}catch{logCall({status:'render-halt-not-stored',id},log);}}
   if(ok&&!known)logCall({status:'render-cost-unknown',id,settledUsd:usd},log);
   let r;try{r=await store.settle(id,{usd,units:ok?1:0,subject:'render-ia',basis:known?cost.basis:(ok?'reserve-bound':null)});}catch(e){r={settled:false,reason:'store-error'};}
   if(!r||!r.settled){logCall({status:'ledger-settle-failed',id,reason:r&&r.reason||'unknown',usd},log);res.setHeader('x-rubik-ledger','unsettled');}};}
 const form=new FormData();form.append('model',MODEL);form.append('prompt',prompt(style,{floor,walls}));form.append('n','1');form.append('size','1536x1024');form.append('quality','high');
 form.append('image',new Blob([image.bytes],{type:image.type}),image.type==='image/png'?'view.png':'view.jpg');
 const started=clock(),base={model:MODEL,style,floor,walls};
 let r;try{r=await fetchImpl('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`},body:form});}
 catch{logCall({...base,status:'provider-unreachable',ms:clock()-started,usage:null,cost:null},log);await settle(false,null);return send(res,502,{error:'provider-unreachable'});}
 const out=await r.json().catch(()=>null),usage=usageOf(out?.usage),cost=costOf(usage,tariff(env)),ms=clock()-started;
 if(!r.ok){const code=r.status===429?'provider-rate-limit':r.status===400?'provider-rejected':'provider-error';logCall({...base,status:code,providerStatus:r.status,ms,usage,cost},log);await settle(false,cost);return send(res,502,{error:code});}
 const b64=out?.data?.[0]?.b64_json;if(!b64){logCall({...base,status:'provider-empty',ms,usage,cost},log);await settle(false,cost);return send(res,502,{error:'provider-empty'});}
 logCall({...base,status:'ok',ms,usage,cost},log);await settle(true,cost);
 return send(res,200,{image:`data:image/png;base64,${b64}`,model:MODEL,style,floor,walls,usage,cost,generatedAt:new Date().toISOString()});
}
module.exports=(req,res)=>handler(req,res);
module.exports.handler=handler;module.exports.STYLES=STYLES;module.exports.FLOORS=FLOORS;module.exports.WALLS=WALLS;module.exports.prompt=prompt;
module.exports.createMeter=createMeter;module.exports.limits=limits;module.exports.DEFAULT_LIMITS=DEFAULT_LIMITS;module.exports.globalQuota=globalQuota;module.exports.imageDims=imageDims;module.exports.MODEL=MODEL;
module.exports.usageOf=usageOf;module.exports.tariff=tariff;module.exports.costOf=costOf;
