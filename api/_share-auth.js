/* GOV-08 S1/S2: the single authorisation rule for publishing (api/share.js) and withdrawing (api/unshare.js) client
   links. The leading underscore keeps this file out of the routes: Vercel does not expose it as a function.
   - Code: RUBIK_SHARE_TOKEN only, sent in x-rubik-share-token. The AI render code (RUBIK_RENDER_TOKEN, header
     x-rubik-render-token) is never accepted and there is no fallback to it.
   - A missing code → 503 not-configured; a weak code (< 32 chars) or one equal to the render code → 503 misconfigured.
   - Same-origin rule as api/render.js: a browser request from another site → 403 origin.
   - Constant time on fixed-length SHA-256 digests: neither the content nor the length of the code leaks by timing.
   - The code is never logged nor returned. */
'use strict';
const {createHash,timingSafeEqual}=require('node:crypto');
const MIN_CODE=32,MAX_CODE=200;
const digest=v=>createHash('sha256').update(String(v),'utf8').digest();
const sameCode=(a,b)=>timingSafeEqual(digest(a),digest(b));
function sameSite(req){
 const origin=req.headers.origin;if(origin===undefined)return true;
 const host=req.headers['x-forwarded-host']||req.headers.host;
 try{return typeof origin==='string'&&!!host&&new URL(origin).host===String(host).split(',')[0].trim();}catch{return false;}
}
// Returns null when the request may proceed, or {status, error} to send back.
function authorize(req,env){
 const code=env.RUBIK_SHARE_TOKEN;
 if(!env.BLOB_READ_WRITE_TOKEN||!code)return {status:503,error:'not-configured'};
 if(code.length<MIN_CODE||code.length>MAX_CODE||(env.RUBIK_RENDER_TOKEN&&sameCode(code,env.RUBIK_RENDER_TOKEN)))return {status:503,error:'misconfigured'};
 if(!sameSite(req))return {status:403,error:'origin'};
 const token=req.headers['x-rubik-share-token']; // x-rubik-render-token is deliberately ignored
 if(typeof token!=='string'||!token||token.length>MAX_CODE||!sameCode(token,code))return {status:401,error:'token'};
 return null;
}
module.exports={authorize,sameSite,sameCode,MIN_CODE,MAX_CODE};
