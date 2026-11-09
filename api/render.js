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
     best-effort brake; the binding monthly budget is the one set on the provider account. See docs/render-ai/. */
'use strict';
const {timingSafeEqual}=require('node:crypto');
const same=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
const MODEL=process.env.RUBIK_RENDER_MODEL||'gpt-image-1';
const MAX_BYTES=3.5*1024*1024;
const STYLES={
 natural:'natural daylight, soft realistic shadows, neutral contemporary finishes',
 warm:'warm evening light, cosy atmosphere, warm wood and textile tones',
 scandinavian:'Scandinavian style, light oak, white walls, soft textiles, bright diffuse daylight',
 premium:'premium real-estate photography look, refined materials, balanced high-end lighting'};
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
function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
function parseImage(dataUrl){
 const m=/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl||''));
 if(!m)return null;const bytes=Buffer.from(m[2],'base64');
 if(!bytes.length||bytes.length>MAX_BYTES)return null;return {type:m[1],bytes};
}
async function handler(req,res,{fetchImpl=globalThis.fetch,env=process.env,meter=defaultMeter,now=Date.now}={}){
 if(req.method!=='POST')return send(res,405,{error:'method'});
 if(env.RUBIK_RENDER_ENABLED!=='1')return send(res,503,{error:'disabled'});
 if(!env.OPENAI_API_KEY||!env.RUBIK_RENDER_TOKEN)return send(res,503,{error:'not-configured'});
 if(!sameSite(req))return send(res,403,{error:'origin'});
 const lim=limits(env);
 if(meter.blockedByFails(now(),lim.tokenFailsPerHour)){res.setHeader('Retry-After','3600');return send(res,429,{error:'limit'});}
 const token=req.headers['x-rubik-render-token'];
 if(typeof token!=='string'||token.length>200||!same(token,env.RUBIK_RENDER_TOKEN)){meter.fail(now());return send(res,401,{error:'token'});}
 let body=req.body;if(typeof body==='string'){try{body=JSON.parse(body);}catch{return send(res,400,{error:'json'});}}
 const style=body?.style;if(!Object.hasOwn(STYLES,style))return send(res,400,{error:'style'});
 const floor=body?.floor??null,walls=body?.walls??null;
 if((floor!==null&&!Object.hasOwn(FLOORS,floor))||(walls!==null&&!Object.hasOwn(WALLS,walls)))return send(res,400,{error:'finish'});
 const image=parseImage(body?.image);if(!image)return send(res,400,{error:'image'});
 const slot=meter.reserve(now(),lim);
 if(!slot.ok){res.setHeader('Retry-After',String(slot.retryAfter));return send(res,429,{error:'limit',retryAfter:slot.retryAfter});}
 const form=new FormData();form.append('model',MODEL);form.append('prompt',prompt(style,{floor,walls}));form.append('n','1');form.append('size','1536x1024');
 form.append('image',new Blob([image.bytes],{type:image.type}),image.type==='image/png'?'view.png':'view.jpg');
 let r;try{r=await fetchImpl('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`},body:form});}
 catch{return send(res,502,{error:'provider-unreachable'});}
 const out=await r.json().catch(()=>null);
 if(!r.ok){const code=r.status===429?'provider-rate-limit':r.status===400?'provider-rejected':'provider-error';return send(res,502,{error:code});}
 const b64=out?.data?.[0]?.b64_json;if(!b64)return send(res,502,{error:'provider-empty'});
 return send(res,200,{image:`data:image/png;base64,${b64}`,model:MODEL,style,floor,walls,generatedAt:new Date().toISOString()});
}
module.exports=(req,res)=>handler(req,res);
module.exports.handler=handler;module.exports.STYLES=STYLES;module.exports.FLOORS=FLOORS;module.exports.WALLS=WALLS;module.exports.prompt=prompt;
module.exports.createMeter=createMeter;module.exports.limits=limits;module.exports.DEFAULT_LIMITS=DEFAULT_LIMITS;
