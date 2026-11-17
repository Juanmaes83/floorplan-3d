/* GOV-08 S3 / ENT-02 · Register of the store and controlled purge of expired files (POST /api/publications).
   The authoritative list of what is published is the store itself: this function lists rubik-share/ in the owner's
   own Vercel Blob store and groups the files by publication, using only what their stored names say
   (js/share-expiry-core.js). Nothing else is kept anywhere: no project data, no client data, no code, no extra index.
   - Same authorisation as publishing and withdrawing (api/_share-auth.js): RUBIK_SHARE_TOKEN only, same origin, JSON
     body only. The code and the Blob token are never logged nor returned.
   - {"action":"list"} → every publication with its state (active / expired / legacy), expiry date and files
     (URL, size, upload date). Files published before S3 carry no date: they are reported as LEGACY, one by one.
   - {"action":"purge-expired"} is a DRY RUN by default: it reports what would be deleted. Only with "confirm":true
     does it delete, and ONLY files whose stored name says they have expired. Legacy files are never deleted here:
     that needs a specific decision of the owner (and then S2's /api/unshare).
   - Deletion is file by file, page first (the link stops opening even if a later file fails), then the 3D visit, then
     the video, each with one retry. 200 all removed · 207 partial · 502 none; running it again finishes what is left
     (deleting a missing file succeeds). At most MAX_DELETE files per call: `more` says to call again.
   Limits: the Blob CDN may keep serving a deleted file for up to a minute; copies already downloaded stay with
   whoever downloaded them. This is not GOV-08 S5 (private Blob) nor per-professional identity (GOV-06a). */
'use strict';
const Auth=require('./_share-auth.js');
const {storeHost}=require('./view.js');
const Expiry=require('../js/share-expiry-core.js');
const MAX_BODY=1024,MAX_PAGES=20,PAGE_SIZE=1000,MAX_DELETE=200;
const ORDER={html:0,'delivery.json':1,webm:2,mp4:2};
function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');res.end(JSON.stringify(body));}
async function readBody(req){
 if(req.body&&typeof req.body==='object'&&!Buffer.isBuffer(req.body)){try{return Buffer.byteLength(JSON.stringify(req.body))<=MAX_BODY?req.body:null;}catch{return null;}}
 let raw;if(typeof req.body==='string')raw=Buffer.from(req.body);else if(Buffer.isBuffer(req.body))raw=req.body;
 else{const chunks=[];let size=0;for await(const c of req){const b=Buffer.isBuffer(c)?c:Buffer.from(String(c));size+=b.length;if(size>MAX_BODY)return null;chunks.push(b);}raw=Buffer.concat(chunks);}
 if(raw.length>MAX_BODY)return null;try{return JSON.parse(raw.toString('utf8'));}catch{return null;}
}
// Every rubik-share/ file of THIS store (paginated). Anything that is not https on the store host, or not a name
// /api/share writes, is ignored: it can never be deleted from here.
async function listStore(env,fetchImpl,host){
 const files=[];let cursor='',truncated=false;
 for(let page=0;;page++){
  if(page>=MAX_PAGES){truncated=true;break;}
  const q=new URLSearchParams({prefix:'rubik-share/',limit:String(PAGE_SIZE)});if(cursor)q.set('cursor',cursor);
  const r=await fetchImpl('https://blob.vercel-storage.com/?'+q,{method:'GET',headers:{authorization:`Bearer ${env.BLOB_READ_WRITE_TOKEN}`,'x-api-version':'7'}});
  const out=await r.json().catch(()=>null);
  if(!r.ok||!out||!Array.isArray(out.blobs))throw Error('storage-error');
  for(const b of out.blobs){
   let u;try{u=new URL(String(b.url));}catch{continue;}
   if(u.protocol!=='https:'||u.hostname!==host||u.search||u.hash)continue;
   const info=Expiry.parse(u.pathname);if(!info)continue;
   const at=new Date(b.uploadedAt);
   files.push({url:`https://${host}${u.pathname}`,size:Number.isFinite(b.size)?b.size:null,uploadedAt:Number.isFinite(at.getTime())?at.toISOString():null,info});
  }
  if(!out.hasMore||!out.cursor)break;cursor=String(out.cursor);
 }
 return {files,truncated};
}
function group(files,now){
 const pubs=new Map(),legacy=[];
 for(const f of files){
  const file={url:f.url,size:f.size,uploadedAt:f.uploadedAt};
  if(f.info.legacy){legacy.push({id:f.url,state:'legacy',expiresAt:null,files:[file]});continue;}
  const p=pubs.get(f.info.publicationId)||{id:f.info.publicationId,expiresAt:f.info.expiresAt,files:[]};
  p.expiresAt=Math.min(p.expiresAt,f.info.expiresAt);p.files.push({...file,order:ORDER[f.info.ext]??3});pubs.set(p.id,p);
 }
 const list=[...pubs.values()].map(p=>({id:p.id,state:now>=p.expiresAt?'expired':'active',expiresAt:new Date(p.expiresAt).toISOString(),
  files:p.files.sort((a,b)=>a.order-b.order||a.url.localeCompare(b.url)).map(({order,...f})=>f)}));
 list.sort((a,b)=>a.expiresAt.localeCompare(b.expiresAt));
 return [...list,...legacy];
}
async function remove(url,env,fetchImpl){
 for(let attempt=0;attempt<2;attempt++){
  try{const r=await fetchImpl('https://blob.vercel-storage.com/delete',{method:'POST',headers:{authorization:`Bearer ${env.BLOB_READ_WRITE_TOKEN}`,'x-api-version':'7','content-type':'application/json'},body:JSON.stringify({urls:[url]})});
   if(r.ok)return null;if(attempt)return 'storage-error';}
  catch{if(attempt)return 'storage-unreachable';}
 }
 return 'storage-error';
}
async function handler(req,res,{fetchImpl=globalThis.fetch,env=process.env,now=Date.now}={}){
 if(req.method!=='POST')return send(res,405,{error:'method'});
 const denied=Auth.authorize(req,env);if(denied)return send(res,denied.status,{error:denied.error});
 const host=storeHost(env.BLOB_READ_WRITE_TOKEN);if(!host)return send(res,503,{error:'not-configured'});
 if(!/^application\/json\b/i.test(String(req.headers['content-type']||'')))return send(res,415,{error:'content-type'});
 const b=await readBody(req);
 if(!b||typeof b!=='object'||!['list','purge-expired'].includes(b.action))return send(res,400,{error:'action'});
 if(b.action==='purge-expired'&&b.confirm!==undefined&&typeof b.confirm!=='boolean')return send(res,400,{error:'confirm'});
 const t=now();let listed;
 try{listed=await listStore(env,fetchImpl,host);}catch{return send(res,502,{error:'storage-error'});}
 const pubs=group(listed.files,t);
 const counts={active:pubs.filter(p=>p.state==='active').length,expired:pubs.filter(p=>p.state==='expired').length,legacy:pubs.filter(p=>p.state==='legacy').length};
 if(b.action==='list')return send(res,200,{checkedAt:new Date(t).toISOString(),counts,truncated:listed.truncated,publications:pubs});
 const expiredFiles=pubs.filter(p=>p.state==='expired').flatMap(p=>p.files.map(f=>f.url));
 const batch=expiredFiles.slice(0,MAX_DELETE),more=expiredFiles.length>MAX_DELETE||listed.truncated;
 if(b.confirm!==true)return send(res,200,{dryRun:true,checkedAt:new Date(t).toISOString(),counts,wouldRemove:batch,more,legacyUntouched:counts.legacy});
 const removed=[],failed=[];
 for(const url of batch){const error=await remove(url,env,fetchImpl);if(error)failed.push({url,error});else removed.push(url);}
 const status=!batch.length||!failed.length?200:removed.length?207:502;
 return send(res,status,{dryRun:false,checkedAt:new Date(t).toISOString(),counts,removed,failed,more,legacyUntouched:counts.legacy});
}
module.exports=(req,res)=>handler(req,res);
module.exports.handler=handler;module.exports.group=group;module.exports.MAX_DELETE=MAX_DELETE;module.exports.MAX_PAGES=MAX_PAGES;
