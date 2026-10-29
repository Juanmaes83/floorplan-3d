/* Phase B4: publish the client file (B1) behind a hard-to-guess link (Vercel Node function, POST /api/share).
   The browser sends ONE file: the self-contained client HTML, or the tour video it links to. This function stores it
   in the owner's Vercel Blob store with a random suffix and returns its public URL. Nothing else is stored.
   - BLOB_READ_WRITE_TOKEN (Vercel Blob) never reaches the browser.
   - The same access code as the AI render (RUBIK_RENDER_TOKEN) is required, so the public URL of Rubik cannot be used
     to store files in the owner's account.
   - Anyone with the link can open it: it is read-only, carries no editable project, and the owner removes it from the
     Vercel Blob dashboard. Vercel limits a function request to 4.5 MB, so files are capped at 4 MB. */
'use strict';
const LIMIT=4*1024*1024;
const KINDS={html:{type:'text/html; charset=utf-8',ext:'html'},mp4:{type:'video/mp4',ext:'mp4'},webm:{type:'video/webm',ext:'webm'}};
function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
async function bodyBytes(req){
 if(Buffer.isBuffer(req.body))return req.body;if(typeof req.body==='string')return Buffer.from(req.body);
 const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>LIMIT)return null;chunks.push(c);}return Buffer.concat(chunks);
}
const slug=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,50)||'proyecto';
const decodeName=v=>{try{return decodeURIComponent(String(v||''));}catch{return '';}};
async function handler(req,res,{fetchImpl=globalThis.fetch,env=process.env}={}){
 if(req.method!=='POST')return send(res,405,{error:'method'});
 if(!env.BLOB_READ_WRITE_TOKEN||!env.RUBIK_RENDER_TOKEN)return send(res,503,{error:'not-configured'});
 const token=req.headers['x-rubik-render-token'];
 if(typeof token!=='string'||token.length>200||token!==env.RUBIK_RENDER_TOKEN)return send(res,401,{error:'token'});
 const kind=String(req.headers['x-rubik-share-kind']||'');if(!Object.hasOwn(KINDS,kind))return send(res,400,{error:'kind'});
 const bytes=await bodyBytes(req);if(!bytes||!bytes.length||bytes.length>LIMIT)return send(res,413,{error:'size'});
 if(kind==='html'&&!bytes.subarray(0,200).toString('utf8').toLowerCase().startsWith('<!doctype html>'))return send(res,400,{error:'file'});
 const pathname=`rubik-share/${slug(decodeName(req.headers['x-rubik-share-name']))}.${KINDS[kind].ext}`;
 let r;try{r=await fetchImpl('https://blob.vercel-storage.com/'+pathname,{method:'PUT',headers:{authorization:`Bearer ${env.BLOB_READ_WRITE_TOKEN}`,'x-api-version':'7','x-content-type':KINDS[kind].type,'x-add-random-suffix':'1','x-cache-control-max-age':'60'},body:bytes});}
 catch{return send(res,502,{error:'storage-unreachable'});}
 const out=await r.json().catch(()=>null);
 if(!r.ok||typeof out?.url!=='string'||!out.url.startsWith('https://'))return send(res,502,{error:'storage-error'});
 return send(res,200,{url:out.url,kind,bytes:bytes.length});
}
module.exports=(req,res)=>handler(req,res);
module.exports.handler=handler;module.exports.LIMIT=LIMIT;
module.exports.config={api:{bodyParser:false}};
