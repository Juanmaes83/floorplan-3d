/* Phase B4: open a published client file (GET /api/view?f=<blob url>). Vercel Blob serves HTML as a download, so this
   function reads the file from the owner's own Blob store and returns it as a web page, with the same strict
   Content-Security-Policy the file carries plus the tour video from that store. Only files published by /api/share
   (store of BLOB_READ_WRITE_TOKEN, folder rubik-share/, .html) are served: it is not a general proxy.
   GOV-08 S2: answers with Cache-Control: no-store, so neither the browser nor Vercel's edge keep THIS response.
   The file itself is read through the Blob CDN, which may keep serving its copy for up to the cache time set at
   upload (60 s, see api/share.js) after /api/unshare deletes it. Copies already downloaded by anyone are not reached.
   GOV-08 · aislamiento: the document is served under the app's own address, so the policy ends with `sandbox
   allow-scripts allow-downloads` and WITHOUT allow-same-origin: the browser runs it in an opaque origin of its own.
   Its inline script (the observations form) still runs and can still save the observations file, but it can no longer
   read or change what the app keeps in that browser (render code, projects, publications, images, other documents'
   observations), open windows, submit forms or navigate the page that opened it. Same URL, same stored file: existing
   links keep opening. Trade-off: the observations are no longer kept across a reload. See
   docs/security/gov08-aislamiento-api-view.md.
   Cierre #195 — universal notice: documents published before #195 carry no notice of their own, so this function
   inserts ONE fixed paragraph (NOTICE, no input of any kind) right before their observations form. Only documents with
   the form (id="shareReview" + <div class="share-form">) and without their own notice (id="shareVolatile") are touched;
   the stored copy is never changed, and removing the paragraph gives back the stored bytes exactly. */
'use strict';
function storeHost(token){const m=/^vercel_blob_rw_([a-z0-9]+)_/i.exec(String(token||''));return m?`${m[1].toLowerCase()}.public.blob.vercel-storage.com`:null;}
function csp(host){return `default-src 'none'; img-src data:; media-src https://${host}; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'; sandbox allow-scripts allow-downloads`;}
// The client-experience contract; js/client-share-ui.js shows the same text in documents built since #195.
const NOTICE=Object.freeze({es:'Las observaciones de esta página no se guardan automáticamente. Antes de cerrar o recargar, descarga el archivo de observaciones y envíalo al profesional.',en:'Observations on this page are not saved automatically. Before closing or reloading, download the observations file and send it to the professional.',zh:'本页面的意见不会自动保存。关闭或刷新前，请下载意见文件并发送给专业人员。'});
const FORM='<div class="share-form">',NOTICE_STYLE='margin:8px 0;padding:8px 10px;border-left:4px solid #b07a1c;background:#fff4d6;color:#4a3a12;font-weight:600;font-size:13px;line-height:1.4';
function withNotice(html){
 if(!html.includes('id="shareReview"')||html.includes('id="shareVolatile"'))return html;
 const at=html.indexOf(FORM);if(at<0)return html;
 const lang=(/^\s*<!doctype html>\s*<html lang="([a-z]{2})"/i.exec(html)||[])[1],text=NOTICE[lang]||NOTICE.es;
 return html.slice(0,at)+`<p id="rubikViewNotice" role="note" style="${NOTICE_STYLE}">${text}</p>`+html.slice(at);
}
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
 res.end(withNotice(html));
}
module.exports=(req,res)=>handler(req,res);
module.exports.handler=handler;module.exports.storeHost=storeHost;module.exports.csp=csp;module.exports.NOTICE=NOTICE;module.exports.withNotice=withNotice;
