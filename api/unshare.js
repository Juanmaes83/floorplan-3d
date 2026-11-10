/* GOV-08 / ENT-02 S2: withdraw a published client link (POST /api/unshare). Deletes the named files — the client
   page and, if it had one, its tour video — from the owner's own Vercel Blob store, so /api/view answers «no longer
   available» for that link. Recovered selectively from PR #166 and adapted to S1:
   - Same authorisation as publishing (api/_share-auth.js): RUBIK_SHARE_TOKEN only, never the AI render code; same
     origin rule; constant-time comparison; the code is never logged nor returned.
   - Only files of THIS store under rubik-share/ with the extensions /api/share writes (.html, .mp4, .webm) can be
     named: no other Blob object can be deleted. At most 8 distinct files per call. POST with a JSON body only.
   - Each file is deleted on its own so a partial failure is reported file by file (200 all removed, 207 partial,
     502 none). Deleting a file that is already gone succeeds (Vercel Blob delete is idempotent): withdrawing twice
     is safe.
   Limits (documented, not solved here): the Blob CDN may keep serving its cached copy for up to 60 s (the max-age
   set at upload), so /api/view can still show it during that window; copies kept by the recipient, and anyone who downloaded the file, keep them; this removes the stored object, it is not an access
   control system nor a per-professional permission. */
'use strict';
const Auth=require('./_share-auth.js');
const {storeHost}=require('./view.js');
const MAX_FILES=8,MAX_BODY=8192;
function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
async function readBody(req){
 if(req.body&&typeof req.body==='object'&&!Buffer.isBuffer(req.body))return req.body;
 let raw='';if(typeof req.body==='string')raw=req.body;else if(Buffer.isBuffer(req.body))raw=req.body.toString('utf8');
 else{for await(const c of req){raw+=c;if(raw.length>MAX_BODY)return null;}}
 if(raw.length>MAX_BODY)return null;try{return JSON.parse(raw);}catch{return null;}
}
// Only a file /api/share could have written to this store: https, this host, /rubik-share/<slug-random>.<html|mp4|webm>.
function ownFile(raw,host){
 let u;try{u=new URL(String(raw||''));}catch{return null;}
 if(u.protocol!=='https:'||u.hostname!==host||u.username||u.password||u.port||u.search||u.hash)return null;
 return /^\/rubik-share\/[\w-]+\.(html|mp4|webm)$/.test(u.pathname)?u.href:null;
}
async function handler(req,res,{fetchImpl=globalThis.fetch,env=process.env}={}){
 if(req.method!=='POST')return send(res,405,{error:'method'});
 const denied=Auth.authorize(req,env);if(denied)return send(res,denied.status,{error:denied.error});
 const host=storeHost(env.BLOB_READ_WRITE_TOKEN);if(!host)return send(res,503,{error:'not-configured'});
 const ct=String(req.headers['content-type']||'');if(!/^application\/json\b/i.test(ct))return send(res,415,{error:'content-type'});
 const b=await readBody(req);
 if(!b||!Array.isArray(b.urls)||!b.urls.length)return send(res,400,{error:'urls'});
 const urls=[...new Set(b.urls.map(u=>ownFile(u,host)))];
 if(urls.some(u=>!u))return send(res,400,{error:'urls'});
 if(urls.length>MAX_FILES)return send(res,400,{error:'too-many'});
 const removed=[],failed=[];
 for(const url of urls){
  let r;try{r=await fetchImpl('https://blob.vercel-storage.com/delete',{method:'POST',headers:{authorization:`Bearer ${env.BLOB_READ_WRITE_TOKEN}`,'x-api-version':'7','content-type':'application/json'},body:JSON.stringify({urls:[url]})});}
  catch{failed.push({url,error:'storage-unreachable'});continue;}
  if(r.ok)removed.push(url);else failed.push({url,error:'storage-error'});
 }
 return send(res,!failed.length?200:removed.length?207:502,{removed,failed});
}
module.exports=(req,res)=>handler(req,res);
module.exports.handler=handler;module.exports.ownFile=ownFile;module.exports.MAX_FILES=MAX_FILES;
