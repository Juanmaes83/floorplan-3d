/* Delivery 3D V1: the client viewer reads its read-only 3D snapshot here (GET /api/delivery?f=<blob url>), same origin,
   so the app needs no new connect-src. Only snapshots published by /api/share (store of BLOB_READ_WRITE_TOKEN, folder
   rubik-share/, *.delivery.json) are served: it is not a general proxy. no-store: a withdrawn delivery stops at once. */
'use strict';
const Delivery=require('../js/delivery-core.js');
const {storeHost}=require('./view.js');
function fail(res,status,error){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error}));}
function target(raw,host){
 let u;try{u=new URL(String(raw||''));}catch{return null;}
 if(u.protocol!=='https:'||u.hostname!==host||u.search||u.hash)return null;
 return /^\/rubik-share\/[\w-]+\.delivery\.json$/.test(u.pathname)?u.href:null;
}
async function handler(req,res,{fetchImpl=globalThis.fetch,env=process.env}={}){
 if(req.method!=='GET')return fail(res,405,'method');
 const host=storeHost(env.BLOB_READ_WRITE_TOKEN);if(!host)return fail(res,503,'not-configured');
 const url=target(new URL(req.url,'http://local').searchParams.get('f'),host);if(!url)return fail(res,404,'not-found');
 let r;try{r=await fetchImpl(url,{cache:'no-store'});}catch{return fail(res,502,'storage-unreachable');}
 if(!r.ok)return fail(res,404,'not-found');
 const text=await r.text();let snap;try{snap=Delivery.validate(JSON.parse(text),{bytes:Buffer.byteLength(text)});}catch{return fail(res,422,'invalid');}
 res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Referrer-Policy','no-referrer');
 res.end(JSON.stringify(snap));
}
module.exports=(req,res)=>handler(req,res);
module.exports.handler=handler;module.exports.target=target;
