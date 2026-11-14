/* FOT-01 / CAT-01 · photo-reform/1: server for an illustrative visual reform of ONE photo or view
   (Vercel Node function, POST /api/photo-reform). Contract and decisions: docs/cat-ia/02-photo-reform-servidor-v1.md.
   It replaces the browser adapter that sent a provider Bearer token from JavaScript (defect found in V2): provider
   secrets live ONLY here, in the environment, and the browser talks same-origin to this function.
   FAIL-CLOSED. The endpoint refuses (503) unless ALL of these hold, and nothing else turns it on:
   - RUBIK_PHOTO_REFORM_ENABLED is exactly '1' and the deployment is not Production (VERCEL_ENV !== 'production');
   - its own access code RUBIK_PHOTO_REFORM_TOKEN (32–200 chars) that differs from RUBIK_RENDER_TOKEN and
     RUBIK_SHARE_TOKEN. The /api/render code, header and OPENAI_API_KEY NEVER activate or authorise this function;
   - its own provider key RUBIK_PHOTO_REFORM_PROVIDER_KEY, a provider from the closed list and its https endpoint;
   - an owner-approved spending cap RUBIK_PHOTO_REFORM_BUDGET_CAP_USD (> 0), a dated price per output image
     (RUBIK_PHOTO_REFORM_PRICE_PER_IMAGE_USD + RUBIK_PHOTO_REFORM_PRICE_DATE) and a total output limit (1–4);
   - a PERSISTENT store for nonces, idempotency, quota and spend (injected; none is configured in this repository,
     so a deployment answers 503 'store-not-configured'). Counters in memory are only for tests.
   Protocol (two steps, both POST JSON with x-rubik-contract: photo-reform/1 and the access code):
   1. {action:'quote', request, imageSha256, imageBytes} → a server-side estimate (price × outputs) and a single-use
      confirmation id bound to that request and image, valid 10 minutes. No provider call, no spend.
   2. {action:'generate', confirmationId, idempotencyKey, request, image} → checks the confirmation (once), the image
      bytes (magic bytes, size, SHA-256 equal to the quote), reserves the worst-case cost atomically against the cap
      and the output limit, calls the provider ONCE (no automatic retry), records the billed outputs and answers the
      strict v1 body. The same idempotencyKey again never calls the provider again (409 'already-processed').
   Privacy: no project data, file name, EXIF, free text or personal data is accepted; the image is sent to the
   provider and never stored here; logs are one JSON line without image, code, key, IP or user agent. */
'use strict';
const {createHash,createHmac,randomBytes,timingSafeEqual}=require('node:crypto');
const CONTRACT='photo-reform/1',MIN_CODE=32,MAX_CODE=200,MAX_IMAGE=4*1024*1024,QUOTE_TTL_MS=10*60e3,HARD_MAX_OUTPUTS=4;
// Closed lists, the SAME ids as the client (js/photo-reform-core.js INTENTS): the server writes the words, never the browser.
const INTENTS=Object.freeze({
 floor:{finishes:{'light-oak':'light natural oak wooden plank floor',walnut:'dark walnut wooden plank floor',microcement:'seamless light grey microcement floor','grey-porcelain':'large-format grey porcelain tile floor'},target:'the floor surface only'},
 walls:{finishes:{white:'smooth matte white painted walls','warm-white':'warm off-white painted walls',sage:'soft sage green painted walls',sand:'sand-coloured painted walls'},target:'the wall surfaces only'},
 light:{finishes:{},target:'the lighting only, brighter and tidier with more natural daylight'},
 warm:{finishes:{},target:'the atmosphere only, warmer and cosier with warm light and textiles'}});
const PROVIDERS=Object.freeze({'openai-images':{name:'OpenAI Images',hosts:['api.openai.com']}});
const digest=v=>createHash('sha256').update(String(v),'utf8').digest();
const sameCode=(a,b)=>timingSafeEqual(digest(a),digest(b));
const sha256=buf=>createHash('sha256').update(buf).digest('hex');
const isHex64=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
function send(res,status,body,headers={}){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');for(const[k,v]of Object.entries(headers))res.setHeader(k,v);res.end(JSON.stringify(body));}
function sameSite(req){
 const origin=req.headers.origin,site=req.headers['sec-fetch-site'];
 if(site!==undefined&&site!=='same-origin')return false;
 if(origin===undefined)return true; // server-to-server: the access code still applies
 const host=req.headers['x-forwarded-host']||req.headers.host;
 try{return typeof origin==='string'&&!!host&&new URL(origin).host===String(host).split(',')[0].trim();}catch{return false;}
}
function money(v){if(typeof v!=='string'||!/^\d{1,4}(\.\d{1,6})?$/.test(v.trim()))return null;const n=Number(v.trim());return n>0?n:null;}
// Configuration from the environment. Returns {ok:false,error} with the FIRST missing gate, or the settings.
function settings(env){
 if(env.RUBIK_PHOTO_REFORM_ENABLED!=='1')return {ok:false,error:'disabled'};
 if(env.VERCEL_ENV==='production')return {ok:false,error:'production-blocked'};
 const code=env.RUBIK_PHOTO_REFORM_TOKEN;if(!code)return {ok:false,error:'not-configured'};
 if(code.length<MIN_CODE||code.length>MAX_CODE||(env.RUBIK_RENDER_TOKEN&&sameCode(code,env.RUBIK_RENDER_TOKEN))||(env.RUBIK_SHARE_TOKEN&&sameCode(code,env.RUBIK_SHARE_TOKEN)))return {ok:false,error:'misconfigured'};
 const provider=PROVIDERS[env.RUBIK_PHOTO_REFORM_PROVIDER];const key=env.RUBIK_PHOTO_REFORM_PROVIDER_KEY;
 if(!provider||!key)return {ok:false,error:'provider-not-configured'};
 if(env.OPENAI_API_KEY&&sameCode(key,env.OPENAI_API_KEY))return {ok:false,error:'misconfigured'}; // never the /api/render key
 let endpoint;try{endpoint=new URL(env.RUBIK_PHOTO_REFORM_PROVIDER_URL||'');}catch{return {ok:false,error:'provider-not-configured'};}
 const local=env.RUBIK_PHOTO_REFORM_ALLOW_LOCAL_PROVIDER==='1'&&!env.VERCEL&&endpoint.protocol==='http:'&&endpoint.hostname==='127.0.0.1';
 if(!local&&!(endpoint.protocol==='https:'&&provider.hosts.includes(endpoint.hostname)&&!endpoint.username&&!endpoint.password))return {ok:false,error:'provider-not-configured'};
 const cap=money(env.RUBIK_PHOTO_REFORM_BUDGET_CAP_USD),price=money(env.RUBIK_PHOTO_REFORM_PRICE_PER_IMAGE_USD),priceDate=env.RUBIK_PHOTO_REFORM_PRICE_DATE;
 if(!cap)return {ok:false,error:'budget-not-approved'};
 if(!price||typeof priceDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(priceDate))return {ok:false,error:'price-unknown'};
 const maxOutputs=/^[1-4]$/.test(env.RUBIK_PHOTO_REFORM_MAX_OUTPUTS||'')?Number(env.RUBIK_PHOTO_REFORM_MAX_OUTPUTS):null;if(!maxOutputs)return {ok:false,error:'limit-not-configured'};
 return {ok:true,code,provider:{id:env.RUBIK_PHOTO_REFORM_PROVIDER,...provider},key,endpoint:endpoint.href,model:env.RUBIK_PHOTO_REFORM_MODEL||'gpt-image-1',cap,price,priceDate,maxOutputs,secret:digest('photo-reform-quote|'+code+'|'+key)};
}
// The request: closed keys and values only (no free text, no project, no file name).
function checkRequest(r){
 if(!r||typeof r!=='object'||Array.isArray(r))return null;
 const keys=Object.keys(r).sort().join(',');if(keys!=='alternatives,finish,intent,version')return null;
 if(r.version!==1||!Object.hasOwn(INTENTS,r.intent)||![1,2,3].includes(r.alternatives))return null;
 const f=INTENTS[r.intent].finishes;if(Object.keys(f).length?!(typeof r.finish==='string'&&Object.hasOwn(f,r.finish)):r.finish!==null)return null;
 return {version:1,intent:r.intent,finish:r.finish,alternatives:r.alternatives};
}
function sniff(bytes){
 if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
 if(bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))return 'image/png';
 if(bytes.length>=12&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return 'image/webp';
 return null;
}
function parseImage(dataUrl){
 const m=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(String(dataUrl||''));if(!m)return null;
 const bytes=Buffer.from(m[2],'base64');if(!bytes.length||bytes.length>MAX_IMAGE||sniff(bytes)!==m[1])return null;
 return {type:m[1],bytes,sha256:sha256(bytes)};
}
function prompt(r){
 const i=INTENTS[r.intent];
 return 'Edit this interior photo for an ILLUSTRATIVE visual proposal. '
  +(r.finish?`Change ${i.target}: ${i.finishes[r.finish]}. `:`Change ${i.target}. `)
  +'Keep EXACTLY the same camera, perspective, walls, ceiling, windows, doors and every opening, built-in elements, installations and furniture positions. '
  +'Do not add or remove openings, rooms or large objects. Do not add text, logos, brands or people.';
}
const canonicalRequest=r=>JSON.stringify([r.version,r.intent,r.finish,r.alternatives]);
function signQuote(s,body){return createHmac('sha256',s.secret).update(body).digest('base64url');}
// Store contract (async): get(key) → value|null; setIfAbsent(key,value,ttlMs) → boolean; reserve(spend) → {ok,state};
// settle(id,actual) → state. A real deployment must provide a persistent, atomic implementation.
function memoryStore({now=Date.now}={}){
 const kv=new Map(),ledger={spentUsd:0,reservedUsd:0,outputs:0,reservedOutputs:0,reservations:new Map()};
 const alive=k=>{const e=kv.get(k);if(!e)return null;if(e.exp&&e.exp<now()){kv.delete(k);return null;}return e;};
 return {kind:'memory-test-only',
  async get(k){return alive(k)?.v??null;},
  async setIfAbsent(k,v,ttl){if(alive(k))return false;kv.set(k,{v,exp:ttl?now()+ttl:0});return true;},
  async set(k,v,ttl){kv.set(k,{v,exp:ttl?now()+ttl:0});},
  async reserve({id,usd,outputs,capUsd,maxOutputs}){
   if(ledger.spentUsd+ledger.reservedUsd+usd>capUsd+1e-9)return {ok:false,reason:'budget',state:snap()};
   if(ledger.outputs+ledger.reservedOutputs+outputs>maxOutputs)return {ok:false,reason:'outputs',state:snap()};
   ledger.reservedUsd+=usd;ledger.reservedOutputs+=outputs;ledger.reservations.set(id,{usd,outputs});return {ok:true,state:snap()};},
  async settle(id,{billedOutputs,usd}){const r=ledger.reservations.get(id);if(!r)return snap();ledger.reservations.delete(id);ledger.reservedUsd-=r.usd;ledger.reservedOutputs-=r.outputs;ledger.outputs+=billedOutputs;ledger.spentUsd+=usd;return snap();},
  snapshot:()=>snap()};
 function snap(){return {spentUsd:+ledger.spentUsd.toFixed(6),reservedUsd:+ledger.reservedUsd.toFixed(6),outputs:ledger.outputs,reservedOutputs:ledger.reservedOutputs};}
}
function logLine(log,entry){try{log(JSON.stringify({event:'rubik-photo-reform',...entry}));}catch{}}
async function readBody(req){
 let body=req.body;if(typeof body==='string'){if(body.length>MAX_IMAGE*1.4+4096)return {error:'too-large'};try{body=JSON.parse(body);}catch{return {error:'json'};}}
 if(!body||typeof body!=='object'||Array.isArray(body))return {error:'json'};return {body};
}
async function handler(req,res,{env=process.env,store=null,fetchImpl=globalThis.fetch,now=Date.now,log=console.log,random=randomBytes}={}){
 if(req.method!=='POST')return send(res,405,{error:'method'},{Allow:'POST'});
 const s=settings(env);if(!s.ok)return send(res,503,{error:s.error});
 if(!store||typeof store.reserve!=='function')return send(res,503,{error:'store-not-configured'});
 if(!sameSite(req))return send(res,403,{error:'origin'});
 if(req.headers['x-rubik-contract']!==CONTRACT||!/^application\/json\b/.test(String(req.headers['content-type']||'')))return send(res,400,{error:'contract'});
 const token=req.headers['x-rubik-photo-reform-token']; // x-rubik-render-token and Authorization are ignored on purpose
 if(typeof token!=='string'||!token||token.length>MAX_CODE||!sameCode(token,s.code))return send(res,401,{error:'token'});
 const {body,error}=await readBody(req);if(error)return send(res,400,{error});
 const request=checkRequest(body.request);if(!request)return send(res,400,{error:'request'});
 const requestId=random(9).toString('base64url');
 if(body.action==='quote'){
  if(Object.keys(body).sort().join(',')!=='action,imageBytes,imageSha256,request'||!isHex64(body.imageSha256)||!Number.isSafeInteger(body.imageBytes)||body.imageBytes<=0||body.imageBytes>MAX_IMAGE)return send(res,400,{error:'quote'});
  const estimateUsd=+(s.price*request.alternatives).toFixed(6),state=store.snapshot?.()||null;
  const nonce=random(16).toString('base64url'),exp=now()+QUOTE_TTL_MS,payload=[nonce,exp,canonicalRequest(request),body.imageSha256].join('.');
  const confirmationId=`${nonce}.${exp}.${signQuote(s,payload)}`;
  logLine(log,{requestId,action:'quote',intent:request.intent,finish:request.finish,outputs:request.alternatives,estimateUsd,status:'ok'});
  return send(res,200,{version:1,contract:CONTRACT,confirmationId,expiresAt:new Date(exp).toISOString(),provider:{id:s.provider.id,name:s.provider.name},model:s.model,
   estimate:{amount:estimateUsd,currency:'USD',basis:'price-per-image-env',priceDate:s.priceDate,outputs:request.alternatives},
   budget:{capUsd:s.cap,maxOutputs:s.maxOutputs,spentUsd:state?.spentUsd??null,outputsUsed:state?.outputs??null}},{'x-rubik-request-id':requestId});
 }
 if(body.action!=='generate')return send(res,400,{error:'action'});
 if(Object.keys(body).sort().join(',')!=='action,confirmationId,idempotencyKey,image,request')return send(res,400,{error:'generate'});
 const idem=body.idempotencyKey;if(typeof idem!=='string'||!/^[A-Za-z0-9_-]{16,64}$/.test(idem))return send(res,400,{error:'idempotency'});
 const image=parseImage(body.image);if(!image)return send(res,400,{error:'image'});
 const m=/^([A-Za-z0-9_-]{16,32})\.(\d{13})\.([A-Za-z0-9_-]{43})$/.exec(String(body.confirmationId||''));
 if(!m)return send(res,400,{error:'confirmation'});
 const [ ,nonce,expS,sig]=m,exp=Number(expS),expected=signQuote(s,[nonce,exp,canonicalRequest(request),image.sha256].join('.'));
 if(!sameCode(sig,expected))return send(res,409,{error:'confirmation-mismatch'}); // other request, other image or forged
 if(exp<now())return send(res,409,{error:'confirmation-expired'});
 // Idempotency first: a repeated key never calls the provider again (and never bills again).
 const prior=await store.get('idem:'+idem);if(prior)return send(res,409,{error:'already-processed',status:prior.status,outputsBilled:prior.outputsBilled});
 if(!await store.setIfAbsent('idem:'+idem,{status:'in-progress',outputsBilled:0},24*3600e3))return send(res,409,{error:'already-processed'});
 if(!await store.setIfAbsent('nonce:'+nonce,1,QUOTE_TTL_MS*2)){await store.set('idem:'+idem,{status:'refused-replay',outputsBilled:0},24*3600e3);return send(res,409,{error:'confirmation-used'});}
 const worst=+(s.price*request.alternatives).toFixed(6),reservation=await store.reserve({id:requestId,usd:worst,outputs:request.alternatives,capUsd:s.cap,maxOutputs:s.maxOutputs});
 if(!reservation.ok){await store.set('idem:'+idem,{status:'refused-'+reservation.reason,outputsBilled:0},24*3600e3);logLine(log,{requestId,action:'generate',status:'refused-'+reservation.reason,outputs:request.alternatives});return send(res,402,{error:reservation.reason==='budget'?'budget-exceeded':'outputs-exceeded'});}
 const started=now(),base={requestId,action:'generate',provider:s.provider.id,model:s.model,intent:request.intent,finish:request.finish,outputs:request.alternatives};
 const form=new FormData();form.append('model',s.model);form.append('prompt',prompt(request));form.append('n',String(request.alternatives));
 form.append('image',new Blob([image.bytes],{type:image.type}),image.type==='image/png'?'photo.png':image.type==='image/webp'?'photo.webp':'photo.jpg');
 let r,out=null;
 try{r=await fetchImpl(s.endpoint,{method:'POST',headers:{Authorization:`Bearer ${s.key}`},body:form,redirect:'error',signal:AbortSignal.timeout?AbortSignal.timeout(120e3):undefined});out=await r.json().catch(()=>null);}
 catch{
  // Unknown outcome: the provider may have billed. Keep the worst case as spent (never a fictitious 0).
  await store.settle(requestId,{billedOutputs:request.alternatives,usd:worst});await store.set('idem:'+idem,{status:'provider-unreachable-billing-unknown',outputsBilled:null},24*3600e3);
  logLine(log,{...base,status:'provider-unreachable',ms:now()-started,billing:'unknown-worst-case-held'});return send(res,502,{error:'provider-unreachable'});
 }
 const data=Array.isArray(out?.data)?out.data.filter(d=>typeof d?.b64_json==='string'&&d.b64_json.length):[];
 if(!r.ok||!data.length){
  const code=r.status===429?'provider-rate-limit':r.status===400?'provider-rejected':r.status===402?'provider-payment':'provider-error';
  await store.settle(requestId,{billedOutputs:0,usd:0});await store.set('idem:'+idem,{status:code,outputsBilled:0},24*3600e3);
  logLine(log,{...base,status:code,providerStatus:r.status,ms:now()-started});return send(res,502,{error:code});
 }
 const alternatives=[];for(const [index,d] of data.slice(0,request.alternatives).entries()){const bytes=Buffer.from(d.b64_json,'base64'),type=sniff(bytes);if(type)alternatives.push({index,mediaType:type,data:d.b64_json});}
 const billed=data.length,usd=+(s.price*billed).toFixed(6);
 const state=await store.settle(requestId,{billedOutputs:billed,usd});await store.set('idem:'+idem,{status:'ok',outputsBilled:billed},24*3600e3);
 logLine(log,{...base,status:alternatives.length?'ok':'provider-empty',providerStatus:r.status,ms:now()-started,outputsBilled:billed,cost:{amount:usd,currency:'USD',basis:'price-per-image-env',priceDate:s.priceDate},budget:{spentUsd:state.spentUsd,outputs:state.outputs}});
 if(!alternatives.length)return send(res,502,{error:'provider-empty'});
 return send(res,200,{version:1,provider:{id:s.provider.id,name:s.provider.name},alternatives,cost:{amount:usd,currency:'USD'}},{'x-rubik-request-id':requestId,'x-rubik-outputs-billed':String(billed)});
}
// Production export: no persistent store is wired in this repository, so the endpoint stays closed (503).
module.exports=(req,res)=>handler(req,res,{store:null});
Object.assign(module.exports,{handler,settings,checkRequest,parseImage,sniff,prompt,memoryStore,sameSite,INTENTS,PROVIDERS,CONTRACT,MAX_IMAGE,HARD_MAX_OUTPUTS});
