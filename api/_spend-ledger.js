/* Libro de gasto común de IA (texto del Asistente + imágenes de Render IA) y almacén persistente ATÓMICO.
   Archivo con «_»: Vercel no lo publica como función; lo importan api/assistant.js y, cuando se apruebe, api/render.js.
   - Interfaz del almacén (la misma que memoryStore de api/assistant.js): get, set, setIfAbsent, rate, fail, reserve,
     settle, snapshot. Importes en micro-USD enteros dentro de Redis (sin errores de coma flotante).
   - reserve/settle son scripts Lua: Redis ejecuta cada script de forma atómica, así que dos instancias simultáneas no
     pueden pasar a la vez el tope común. Una reserva sin liquidar (función caída a mitad) SIGUE contando contra el tope:
     el error es siempre por exceso, nunca por defecto.
   - Cada reserva y liquidación añade una entrada al registro (rubik:spend:log) SIN contenido: familia, id, importe,
     base del cálculo, modelo, fecha de tarifa y hora. Es lo que se concilia con la factura del proveedor.
   - exec(cmd:Array) → Promise<result> es el único punto de E/S. restExec habla la API REST de Upstash Redis (POST con el
     comando como array JSON, cabecera Bearer); las pruebas usan un Redis local real. NADA aquí contrata ni activa un
     servicio: sin URL y token configurados por el propietario, no hay almacén y la pasarela responde 503. */
'use strict';
const DEFAULT_PREFIX='rubik:spend:';
const MICRO=1e6,toMicro=usd=>Math.round(Number(usd)*MICRO),toUsd=m=>+(Number(m||0)/MICRO).toFixed(6);
const FAMILIES=Object.freeze(['text','image']);
const LUA={
 reserve:`if redis.call('EXISTS',KEYS[2])==1 then return {0,'duplicate'} end
local spent=tonumber(redis.call('HGET',KEYS[1],'spent:text') or '0')+tonumber(redis.call('HGET',KEYS[1],'spent:image') or '0')
local reserved=tonumber(redis.call('HGET',KEYS[1],'reserved') or '0')
local u=tonumber(ARGV[2]) local cap=tonumber(ARGV[3])
if u<0 or spent+reserved+u>cap then return {0,'cap'} end
local units=tonumber(ARGV[5])
if units>0 then
 local total=tonumber(redis.call('HGET',KEYS[1],'units:image') or '0')+tonumber(redis.call('HGET',KEYS[1],'reserved:image-units') or '0')
 local own=tonumber(redis.call('HGET',KEYS[4],'used') or '0')+tonumber(redis.call('HGET',KEYS[4],'reserved') or '0')
 if total+units>tonumber(ARGV[6]) then return {0,'outputs'} end
 if own+units>tonumber(ARGV[7]) then return {0,'tester-outputs'} end
 redis.call('HINCRBY',KEYS[1],'reserved:image-units',units)
 redis.call('HINCRBY',KEYS[4],'reserved',units)
end
redis.call('HSET',KEYS[2],'family',ARGV[1],'micro',u,'state','open','units',units,'subjectKey',KEYS[4])
redis.call('HINCRBY',KEYS[1],'reserved',u)
redis.call('RPUSH',KEYS[3],ARGV[4])
return {1,'ok'}`,
 settle:`local st=redis.call('HGET',KEYS[2],'state')
if st~='open' then return {0,st or 'missing'} end
local fam=redis.call('HGET',KEYS[2],'family') local r=tonumber(redis.call('HGET',KEYS[2],'micro')) local u=tonumber(ARGV[1])
local units=tonumber(redis.call('HGET',KEYS[2],'units') or '0')
local billed=tonumber(ARGV[3])
if u<0 or billed<0 then return {0,'negative'} end
if units>0 then
 if redis.call('HGET',KEYS[2],'subjectKey')~=KEYS[4] then return {0,'subject'} end
 redis.call('HINCRBY',KEYS[1],'reserved:image-units',-units)
 redis.call('HINCRBY',KEYS[1],'units:image',billed)
 redis.call('HINCRBY',KEYS[4],'reserved',-units)
 redis.call('HINCRBY',KEYS[4],'used',billed)
end
redis.call('HINCRBY',KEYS[1],'reserved',-r)
redis.call('HINCRBY',KEYS[1],'spent:'..fam,u)
redis.call('HSET',KEYS[2],'state','settled','settled',u)
redis.call('RPUSH',KEYS[3],ARGV[2])
return {1,'ok'}`,
 rate:`redis.call('ZREMRANGEBYSCORE',KEYS[1],'-inf',tonumber(ARGV[1])-60000)
if redis.call('ZCARD',KEYS[1])>=tonumber(ARGV[2]) then return 0 end
redis.call('ZADD',KEYS[1],ARGV[1],ARGV[3])
redis.call('PEXPIRE',KEYS[1],120000)
return 1`,
 fail:`local n=redis.call('INCR',KEYS[1]) if n==1 then redis.call('PEXPIRE',KEYS[1],3600000) end return n`};
const validSubject=id=>/^[a-z0-9][a-z0-9-]{0,31}$/.test(id);
function redisStore({exec,now=Date.now,namespace,uid=()=>Math.random().toString(36).slice(2)}){
 if(namespace!==undefined&&!/^[a-z0-9][a-z0-9-]{2,47}$/.test(namespace))throw new Error('invalid spend namespace');
 const P=namespace?DEFAULT_PREFIX+namespace+':':DEFAULT_PREFIX;
 if(typeof exec!=='function')throw new Error('exec required');
 const entry=(o)=>JSON.stringify({...o,at:new Date(now()).toISOString()});
 const snap=async()=>{const [t,i,r,outputs,reservedOutputs]=await exec(['HMGET',P+'ledger','spent:text','spent:image','reserved','units:image','reserved:image-units']);const text=toUsd(t),image=toUsd(i);
  return {spentUsd:+(text+image).toFixed(6),text,image,reservedUsd:toUsd(r),outputs:Number(outputs||0),reservedOutputs:Number(reservedOutputs||0)};};
 return {
  kind:'redis',
  async remove(k){return Number(await exec(['DEL',P+'kv:'+k]));},
  async get(k){const v=await exec(['GET',P+'kv:'+k]);return v==null?null:JSON.parse(v);},
  async set(k,val,ttl){await exec(['SET',P+'kv:'+k,JSON.stringify(val),...(ttl===undefined?[]:['PX',String(Math.max(1,Math.round(ttl)))])]);},
  async setIfAbsent(k,val,ttl){return (await exec(['SET',P+'kv:'+k,JSON.stringify(val),'NX','PX',String(Math.max(1,Math.round(ttl)))]))==='OK';},
  async rate(family,t,perMinute){return Number(await exec(['EVAL',LUA.rate,'1',P+'rate:'+family,String(t),String(perMinute),t+':'+uid()]))===1;},
  async fail(kind){return Number(await exec(['EVAL',LUA.fail,'1',P+'fail:'+(kind||'code')]));},
  async reserve({id,family,usd,capUsd,meta={},units=0,maxUnits=0,subject='',maxSubjectUnits=0}){if(!FAMILIES.includes(family))return {ok:false,reason:'family'};
   const m=toMicro(usd),cap=toMicro(capUsd);if(!Number.isSafeInteger(m)||!Number.isSafeInteger(cap)||cap<1)return {ok:false,reason:'amount'};
   if(!Number.isSafeInteger(units)||units<0||units>0&&(family!=='image'||!validSubject(subject)||!Number.isSafeInteger(maxUnits)||maxUnits<1||!Number.isSafeInteger(maxSubjectUnits)||maxSubjectUnits<1))return {ok:false,reason:'units'};
   const [ok,reason]=await exec(['EVAL',LUA.reserve,'4',P+'ledger',P+'res:'+id,P+'log',P+'image-quota:'+subject,family,String(m),String(cap),entry({op:'reserve',id,family,usd:toUsd(m),...meta}),String(units),String(maxUnits),String(maxSubjectUnits)]);
   return {ok:Number(ok)===1,reason};},
  async settle(id,{usd,basis=null,meta={},units=0,subject=''}){const m=toMicro(usd);
   if(!Number.isSafeInteger(m)||m<0||!Number.isSafeInteger(units)||units<0||units>0&&!validSubject(subject))throw new Error('invalid settlement');
   const [ok,reason]=await exec(['EVAL',LUA.settle,'4',P+'ledger',P+'res:'+id,P+'log',P+'image-quota:'+subject,String(m),entry({op:'settle',id,usd:toUsd(m),basis,...meta}),String(units)]);
   return {...await snap(),settled:Number(ok)===1,reason};},
  snapshot:snap,
  async log(){return (await exec(['LRANGE',P+'log','0','-1'])||[]).map(s=>JSON.parse(s));}};
}
// Upstash Redis REST: POST <url> con el comando como array JSON; respuesta {result} o {error}. Sin URL/token → null.
function restExec({url,token,fetch=globalThis.fetch,timeoutMs=5000}){
 if(!/^https:\/\/[a-z0-9.-]+$/i.test(String(url||''))||typeof token!=='string'||token.length<20)return null;
 return async cmd=>{const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),timeoutMs);
  try{const r=await fetch(url,{method:'POST',signal:ctl.signal,redirect:'error',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(cmd)});
   const j=await r.json().catch(()=>null);if(!r.ok||!j||'error' in j)throw Object.assign(new Error('store'),{code:'store_error',status:r.status});return j.result;}
  finally{clearTimeout(t);}};
}
// Almacén desde el entorno: SOLO si el propietario configura RUBIK_SPEND_STORE_URL y _TOKEN (p. ej. Upstash Redis del
// Marketplace de Vercel, solo en Preview). Sin ellos devuelve null y la pasarela queda cerrada (503 store-not-configured).
function storeFromEnv(env,{fetch}={}){const exec=restExec({url:env.RUBIK_SPEND_STORE_URL,token:env.RUBIK_SPEND_STORE_TOKEN,fetch});return exec?redisStore({exec,namespace:env.RUBIK_BETA_LEDGER_NAMESPACE}):null;}
/* Conciliación verificable: libro (registro de reservas/liquidaciones) frente a costes del proveedor por día y familia.
   providerRows: [{date:'YYYY-MM-DD', family:'text'|'image', usd}] obtenidas del panel o la API de costes del proveedor
   (con proyectos separados por familia). Regla: el libro NUNCA debe quedar por debajo del proveedor (estimamos por
   exceso); una diferencia por debajo es un hallazgo bloqueante. Reservas abiertas = posible gasto sin liquidar. */
function reconcile(log,providerRows,{toleranceUsd=0.01}={}){
 const day=s=>String(s).slice(0,10),key=(d,f)=>d+'|'+f,rows=new Map(),res=new Map();
 for(const e of log){if(e.op==='reserve')res.set(e.id,{family:e.family,date:day(e.at),usd:e.usd,settled:null});else if(e.op==='settle'&&res.has(e.id))res.get(e.id).settled=e.usd;}
 const add=(d,f,k,v)=>{const r=rows.get(key(d,f))||{date:d,family:f,ledgerUsd:0,providerUsd:0,open:0,openUsd:0};r[k]=+(r[k]+v).toFixed(6);rows.set(key(d,f),r);};
 for(const r of res.values()){if(r.settled===null){add(r.date,r.family,'open',1);add(r.date,r.family,'openUsd',r.usd);}else add(r.date,r.family,'ledgerUsd',r.settled);}
 for(const p of providerRows||[])if(FAMILIES.includes(p.family))add(day(p.date),p.family,'providerUsd',Number(p.usd)||0);
 const out=[...rows.values()].sort((a,b)=>(a.date+a.family).localeCompare(b.date+b.family)).map(r=>{const diff=+(r.ledgerUsd+r.openUsd-r.providerUsd).toFixed(6);
  return {...r,diffUsd:diff,status:diff<-toleranceUsd?'ledger-below-provider':r.open?'open-reservations':'ok'};});
 const tot=f=>+out.filter(r=>!f||r.family===f).reduce((a,r)=>a+r.ledgerUsd,0).toFixed(6);
 return {rows:out,totals:{ledgerUsd:tot(),text:tot('text'),image:tot('image'),providerUsd:+out.reduce((a,r)=>a+r.providerUsd,0).toFixed(6)},
  verdict:out.some(r=>r.status==='ledger-below-provider')?'blocking':out.some(r=>r.status==='open-reservations')?'review':'ok'};
}
module.exports={redisStore,restExec,storeFromEnv,reconcile,LUA,FAMILIES,toMicro,toUsd};
