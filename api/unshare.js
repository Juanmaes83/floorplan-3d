/* Delivery 3D V1: withdraw a publication (POST /api/unshare). Deletes the files of one delivery — client page, 3D
   snapshot, tour video — from the owner's own Vercel Blob store, so /api/view and /api/delivery answer «not available»
   for every one of them (not a hidden button: the files are gone). Same access code as publishing; only rubik-share/
   files of this store can be named; at most 8 per call. */
'use strict';
const {storeHost}=require('./view.js');
function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
async function body(req){if(req.body&&typeof req.body==='object'&&!Buffer.isBuffer(req.body))return req.body;let raw='';if(typeof req.body==='string')raw=req.body;else if(Buffer.isBuffer(req.body))raw=req.body.toString('utf8');else{for await(const c of req){raw+=c;if(raw.length>8192)return null;}}try{return JSON.parse(raw);}catch{return null;}}
const own=(raw,host)=>{let u;try{u=new URL(String(raw||''));}catch{return null;}return u.protocol==='https:'&&u.hostname===host&&!u.search&&!u.hash&&/^\/rubik-share\/[\w-]+\.(html|mp4|webm|delivery\.json)$/.test(u.pathname)?u.href:null;};
async function handler(req,res,{fetchImpl=globalThis.fetch,env=process.env}={}){
 if(req.method!=='POST')return send(res,405,{error:'method'});
 if(!env.BLOB_READ_WRITE_TOKEN||!env.RUBIK_RENDER_TOKEN)return send(res,503,{error:'not-configured'});
 const token=req.headers['x-rubik-render-token'];if(typeof token!=='string'||token.length>200||token!==env.RUBIK_RENDER_TOKEN)return send(res,401,{error:'token'});
 const host=storeHost(env.BLOB_READ_WRITE_TOKEN),b=await body(req);
 if(!b||!Array.isArray(b.urls)||!b.urls.length||b.urls.length>8)return send(res,400,{error:'urls'});
 const urls=b.urls.map(u=>own(u,host));if(urls.some(u=>!u))return send(res,400,{error:'urls'});
 let r;try{r=await fetchImpl('https://blob.vercel-storage.com/delete',{method:'POST',headers:{authorization:`Bearer ${env.BLOB_READ_WRITE_TOKEN}`,'x-api-version':'7','content-type':'application/json'},body:JSON.stringify({urls})});}
 catch{return send(res,502,{error:'storage-unreachable'});}
 if(!r.ok)return send(res,502,{error:'storage-error'});
 return send(res,200,{removed:urls.length});
}
module.exports=(req,res)=>handler(req,res);
module.exports.handler=handler;
