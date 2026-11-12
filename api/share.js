/* Phase B4: publish the client file (B1) behind a hard-to-guess link (Vercel Node function, POST /api/share).
   The browser sends ONE file: the self-contained client HTML, or the tour video it links to. This function stores it
   in the owner's Vercel Blob store with a random suffix and returns its public URL. Nothing else is stored.
   - BLOB_READ_WRITE_TOKEN (Vercel Blob) never reaches the browser.
   - GOV-08 S1: publishing needs its OWN code, RUBIK_SHARE_TOKEN (header x-rubik-share-token), independent of the AI
     render code. The render code (RUBIK_RENDER_TOKEN / x-rubik-render-token) is never accepted here, there is no
     fallback to it, and a configuration where both variables hold the same value is refused. The comparison is
     constant time (SHA-256 digests + timingSafeEqual) and the code is never logged nor returned.
   - Anyone with the link can open it: it is read-only, carries no editable project, and the owner removes it from the
     Vercel Blob dashboard. Vercel limits a function request to 4.5 MB, so files are capped at 4 MB. */
'use strict';
const Auth=require('./_share-auth.js');
const Delivery=require('./delivery.js'); // ENT-01: pure validation before any upload.
const {randomBytes}=require('node:crypto');
const LIMIT=4*1024*1024;
const KINDS={html:{type:'text/html; charset=utf-8',ext:'html'},mp4:{type:'video/mp4',ext:'mp4'},webm:{type:'video/webm',ext:'webm'},delivery:{type:'application/json; charset=utf-8',ext:'delivery.json'}};
function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
async function bodyBytes(req){
 if(Buffer.isBuffer(req.body))return req.body;if(typeof req.body==='string')return Buffer.from(req.body);
 const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>LIMIT)return null;chunks.push(c);}return Buffer.concat(chunks);
}
const slug=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,50)||'proyecto';
const decodeName=v=>{try{return decodeURIComponent(String(v||''));}catch{return '';}};
async function handler(req,res,{fetchImpl=globalThis.fetch,env=process.env}={}){
 if(req.method!=='POST')return send(res,405,{error:'method'});
 const denied=Auth.authorize(req,env);if(denied)return send(res,denied.status,{error:denied.error}); // GOV-08 S1: see api/_share-auth.js
 const kind=String(req.headers['x-rubik-share-kind']||'');if(!Object.hasOwn(KINDS,kind))return send(res,400,{error:'kind'});
 let bytes=await bodyBytes(req);if(!bytes||!bytes.length||bytes.length>LIMIT)return send(res,413,{error:'size'});
 if(kind==='html'&&!bytes.subarray(0,200).toString('utf8').toLowerCase().startsWith('<!doctype html>'))return send(res,400,{error:'file'});
 if(kind==='delivery'){
  // The editable project must NEVER be sent to Blob. Reject any non-minimal snapshot before upload.
  try{const snapshot=JSON.parse(bytes.toString('utf8'));Delivery.Core.validate(snapshot,{bytes:bytes.length});bytes=Buffer.from(JSON.stringify(snapshot),'utf8');}
  catch{return send(res,400,{error:'file'});}
 }
 // Vercel adds random suffixes before the final extension. For a double extension (.delivery.json)
 // generate 96 bits of randomness ourselves and turn off the provider suffix so the URL can be validated strictly.
 const pathname=`rubik-share/${slug(decodeName(req.headers['x-rubik-share-name']))}${kind==='delivery'?'-'+randomBytes(12).toString('hex'):''}.${KINDS[kind].ext}`;
 let r;try{r=await fetchImpl('https://blob.vercel-storage.com/'+pathname,{method:'PUT',headers:{authorization:`Bearer ${env.BLOB_READ_WRITE_TOKEN}`,'x-api-version':'7','x-content-type':KINDS[kind].type,'x-add-random-suffix':kind==='delivery'?'0':'1','x-cache-control-max-age':'60'},body:bytes});}
 catch{return send(res,502,{error:'storage-unreachable'});}
 const out=await r.json().catch(()=>null);
 if(!r.ok||typeof out?.url!=='string'||!out.url.startsWith('https://'))return send(res,502,{error:'storage-error'});
 if(kind==='delivery'&&!Delivery.target(out.url,Delivery.storeHost(env.BLOB_READ_WRITE_TOKEN)))return send(res,502,{error:'storage-error'});
 return send(res,200,{url:out.url,kind,bytes:bytes.length});
}
module.exports=(req,res)=>handler(req,res);
module.exports.handler=handler;module.exports.LIMIT=LIMIT;module.exports.MIN_CODE=Auth.MIN_CODE;
module.exports.config={api:{bodyParser:false}};
