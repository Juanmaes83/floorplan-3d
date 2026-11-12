/* ENT-01 I1A: read-only, strictly validated 3D delivery snapshot API.
   Anyone with a public link can inspect its minimal content. No authentication on read.
   Writes remain gated by GOV-08 S1; deletion by S2. No production rollout from this Draft branch. */
'use strict';
const Core=require('../js/client-delivery-core.js');
const {storeHost}=require('./view.js');
const MAX_BYTES=Core.MAX_BYTES,MAX_URL=2048;
function send(res,status,body){
 res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Referrer-Policy','no-referrer');
 res.end(JSON.stringify(body));
}
function target(raw,host){
 if(typeof raw!=='string'||!raw||raw.length>MAX_URL||!host||raw.includes('?')||raw.includes('#'))return null;
 let u;try{u=new URL(raw);}catch{return null;}
 if(u.protocol!=='https:'||u.hostname!==host||u.username||u.password||u.port||u.search||u.hash)return null;
 return /^\/rubik-share\/[\w-]+\.delivery\.json$/.test(u.pathname)?'https://'+host+u.pathname:null;
}
async function limitedBytes(response){
 const h=response.headers?.get?.('content-length');
 if(h!=null&&h!==''&&Number.isFinite(Number(h))&&Number(h)>MAX_BYTES)return null;
 if(response.body&&typeof response.body[Symbol.asyncIterator]==='function'){
  const chunks=[];let size=0;
  for await(const part of response.body){
   const b=Buffer.isBuffer(part)?part:Buffer.from(part);size+=b.length;
   if(size>MAX_BYTES)return null;chunks.push(b);
  }
  return Buffer.concat(chunks);
 }
 if(typeof response.text==='function'){
  const b=Buffer.from(await response.text(),'utf8');
  return b.length<=MAX_BYTES?b:null;
 }
 return null;
}
async function handler(req,res,{env=process.env,fetchImpl=globalThis.fetch}={}){
 if(req.method!=='GET')return send(res,405,{error:'method'});
 const host=storeHost(env.BLOB_READ_WRITE_TOKEN);if(!host)return send(res,503,{error:'not-configured'});
 let params;try{params=new URL(req.url,'http://local').searchParams;}catch{return send(res,404,{error:'not-available'});}
 const url=params.size===1&&params.getAll('f').length===1?target(params.get('f'),host):null;
 if(!url)return send(res,404,{error:'not-available'});
 let response;try{response=await fetchImpl(url,{cache:'no-store'});}catch{return send(res,502,{error:'storage-unreachable'});}
 if(!response?.ok)return send(res,404,{error:'not-available'});
 let bytes;try{bytes=await limitedBytes(response);}catch{return send(res,502,{error:'storage-unreachable'});}
 if(!bytes||!bytes.length)return send(res,422,{error:'invalid-delivery'});
 let snapshot;try{snapshot=JSON.parse(bytes.toString('utf8'));Core.validate(snapshot,{bytes:bytes.length});}
 catch{return send(res,422,{error:'invalid-delivery'});}
 return send(res,200,snapshot);
}
module.exports=(req,res)=>handler(req,res);
module.exports.handler=handler;module.exports.Core=Core;module.exports.target=target;
module.exports.storeHost=storeHost;module.exports.MAX_BYTES=MAX_BYTES;module.exports.MAX_URL=MAX_URL;
