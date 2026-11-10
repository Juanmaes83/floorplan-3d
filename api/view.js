/* Phase B4: open a published client file (GET /api/view?f=<blob url>). Vercel Blob serves HTML as a download, so this
   function reads the file from the owner's own Blob store and returns it as a web page, with the same strict
   Content-Security-Policy the file carries plus the tour video from that store. Only files published by /api/share
   (store of BLOB_READ_WRITE_TOKEN, folder rubik-share/, .html) are served: it is not a general proxy.
   GOV-08 S2: answers with Cache-Control: no-store, so neither the browser nor Vercel's edge keep THIS response.
   The file itself is read through the Blob CDN, which may keep serving its copy for up to the cache time set at
   upload (60 s, see api/share.js) after /api/unshare deletes it. Copies already downloaded by anyone are not reached. */
'use strict';
function storeHost(token){const m=/^vercel_blob_rw_([a-z0-9]+)_/i.exec(String(token||''));return m?`${m[1].toLowerCase()}.public.blob.vercel-storage.com`:null;}
function csp(host){return `default-src 'none'; img-src data:; media-src https://${host}; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'`;}
function fail(res,status,text){res.statusCode=status;res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(text);}
function target(raw,host){
 let u;try{u=new URL(String(raw||''));}catch{return null;}
 if(u.protocol!=='https:'||u.hostname!==host||u.search||u.hash)return null;
 return /^\/rubik-share\/[\w-]+\.html$/.test(u.pathname)?u.href:null;
}
async function handler(req,res,{fetchImpl=globalThis.fetch,env=process.env}={}){
 if(req.method!=='GET')return fail(res,405,'Método no permitido.');
 const host=storeHost(env.BLOB_READ_WRITE_TOKEN);if(!host)return fail(res,503,'Enlaces no configurados en este servidor.');
 const query=new URL(req.url,'http://local').searchParams,url=target(query.get('f'),host);
 if(!url)return fail(res,404,'Este enlace no existe o ya no está disponible.');
 let r;try{r=await fetchImpl(url);}catch{return fail(res,502,'No se pudo abrir el documento. Vuelve a intentarlo.');}
 if(!r.ok)return fail(res,404,'Este enlace no existe o ya no está disponible.');
 const html=await r.text();
 res.statusCode=200;res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',csp(host));
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store'); // GOV-08 S2: no cached copy of this response
 res.end(html);
}
module.exports=(req,res)=>handler(req,res);
module.exports.handler=handler;module.exports.storeHost=storeHost;module.exports.csp=csp;
