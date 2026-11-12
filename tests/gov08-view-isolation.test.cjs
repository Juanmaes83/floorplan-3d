// GOV-08 · aislamiento de /api/view — what the change must NOT alter (11/11/2026). Complements
// tests/gov08-view-isolation.browser.test.cjs (which proves the isolation in a real browser). Written before the change
// and run against 9c00c81: the cases tagged [defect] failed there, the rest passed there and still pass. Fictitious
// store; no network; nothing is published or deleted.
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const View=require('../api/view.js');
const env={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_AbC123_secret'},HOST='abc123.public.blob.vercel-storage.com';
const page=n=>`https://${HOST}/rubik-share/casa-${n}-Xy12.html`;
// The policy every link carried before this cut (B4/S2), verbatim.
const BEFORE=`default-src 'none'; img-src data:; media-src https://${HOST}; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'`;
const DOC='<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'"></head><body><p>Propuesta ✓</p><script>1</script></body></html>';
function res(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}
const store=files=>async u=>files.has(u)?{ok:true,status:200,text:async()=>files.get(u)}:{ok:false,status:404};
async function view(path,files){const out=res();await View.handler({method:'GET',url:path},out,{env,fetchImpl:store(files)});return out;}
const directives=csp=>csp.split(';').map(s=>s.trim()).filter(Boolean);

test('[defect] the policy adds exactly «sandbox allow-scripts allow-downloads»: no same origin, popups, navigation, forms or modals',()=>{
 const csp=View.csp(HOST),sb=directives(csp).filter(d=>/^sandbox(\s|$)/.test(d));
 assert.equal(sb.length,1,'one sandbox directive');assert.deepEqual(sb[0].split(/\s+/).slice(1).sort(),['allow-downloads','allow-scripts']);
 for(const flag of ['allow-same-origin','allow-popups','allow-popups-to-escape-sandbox','allow-top-navigation','allow-top-navigation-by-user-activation','allow-forms','allow-modals','allow-storage-access-by-user-activation'])assert.ok(!csp.includes(flag),flag);
});
test('every directive of the previous policy is kept verbatim (the change only adds the sandbox)',()=>{
 assert.deepEqual(directives(View.csp(HOST)).filter(d=>!d.startsWith('sandbox')),directives(BEFORE));
});
test('existing links keep opening: both link builders\' formats answer 200 with the stored document byte for byte',async()=>{
 const files=new Map([[page(1),DOC]]);
 // js/share-link-ui.js and evolucion/delivery-ui.js both build «/api/view?f=» + encodeURIComponent(blob url).
 for(const p of ['/api/view?f='+encodeURIComponent(page(1)),'/api/view?f='+page(1)]){
  const out=await view(p,files);assert.equal(out.statusCode,200,p);assert.equal(out.body,DOC,'the stored document is served unchanged');
  assert.equal(out.headers['content-type'],'text/html; charset=utf-8');assert.equal(out.headers['content-security-policy'],View.csp(HOST));}
});
test('privacy, cache and withdrawal policies are unchanged',async()=>{
 const files=new Map([[page(2),DOC]]),ok=await view('/api/view?f='+encodeURIComponent(page(2)),files);
 assert.deepEqual([ok.headers['cache-control'],ok.headers['x-robots-tag'],ok.headers['referrer-policy'],ok.headers['x-content-type-options']],['no-store','noindex, nofollow','no-referrer','nosniff']);
 files.delete(page(2));const gone=await view('/api/view?f='+encodeURIComponent(page(2)),files);
 assert.equal(gone.statusCode,404);assert.equal(gone.headers['cache-control'],'no-store');assert.match(gone.body,/ya no está disponible/);
 // Still not a general proxy: other stores, folders, extensions, queries and methods are refused before any fetch.
 const none=async()=>assert.fail('no storage call');
 for(const f of [`https://evil.public.blob.vercel-storage.com/rubik-share/a.html`,`https://${HOST}/otra/a.html`,`https://${HOST}/rubik-share/a.mp4`,page(3)+'?x=1',page(3)+'#x','javascript:alert(1)']){
  const out=res();await View.handler({method:'GET',url:'/api/view?f='+encodeURIComponent(f)},out,{env,fetchImpl:none});assert.equal(out.statusCode,404,f);}
 const post=res();await View.handler({method:'POST',url:'/api/view?f='+encodeURIComponent(page(1))},post,{env,fetchImpl:none});assert.equal(post.statusCode,405);
 const off=res();await View.handler({method:'GET',url:'/api/view?f='+encodeURIComponent(page(1))},off,{env:{},fetchImpl:none});assert.equal(off.statusCode,503);
});

// ---------- Cierre #195: aviso universal de observaciones (documentos anteriores a #195) ----------
// Documents published before #195 carry no notice of their own, and in the isolated page their observations no longer
// survive a reload. /api/view adds ONE fixed paragraph (no input of any kind) right before the form; nothing else changes.
const FORM_DOC=(lang='es',own='')=>`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"><title>Casa · Propuesta</title></head><body class="rubik-client-file"><p class="share-top">Documento</p><article class="dossier-paper"><section class="dossier-page share-review" id="shareReview"><h2>Tus observaciones</h2><p class="dossier-note">Escribe…</p>${own}<div class="share-form"><label><span>Tu nombre</span><input id="shareReviewer"></label></div></section></article><script type="application/json" id="rubik-share">{"projectId":"p","versionCode":"v1"}</script><script>/* form script: <div class="share-form"> in a string */</script></body></html>`;
const CONTRACT={es:/^Las observaciones de esta página no se guardan automáticamente\. Antes de cerrar o recargar, descarga el archivo de observaciones y envíalo al profesional\.$/,en:/^Observations on this page are not saved automatically\./,zh:/不会自动保存/};
const strip=html=>html.replace(/<p id="rubikViewNotice"[^>]*>[^<]*<\/p>/,'');
test('[defect] a document from before #195 is served with the observations notice, once, right before the form; nothing else changes',async()=>{
 for(const lang of ['es','en','zh']){const stored=FORM_DOC(lang),files=new Map([[page(5),stored]]);const out=await view('/api/view?f='+encodeURIComponent(page(5)),files);
  assert.equal(out.statusCode,200);const m=out.body.match(/<p id="rubikViewNotice"[^>]*>([^<]*)<\/p>/g)||[];assert.equal(m.length,1,lang+': one notice');
  assert.ok(out.body.indexOf('id="rubikViewNotice"')<out.body.indexOf('<div class="share-form">'),'before the form');
  assert.match(out.body.match(/<p id="rubikViewNotice"[^>]*>([^<]*)<\/p>/)[1],CONTRACT[lang]);
  assert.equal(strip(out.body),stored,'removing the notice gives back the stored document byte for byte');
  assert.equal(files.get(page(5)),stored,'the stored copy is never touched');
  assert.equal(out.headers['content-security-policy'],View.csp(HOST),'the isolation is unchanged');}
});
test('documents that need no notice are served byte for byte: a new one (own notice) and one without observations form',async()=>{
 const own='<p class="share-volatile" id="shareVolatile" role="note" hidden="">Las observaciones…</p>';
 for(const stored of [FORM_DOC('es',own),'<!doctype html><html lang="es"><body><h1>La obra de tu casa</h1><p>Documento de solo lectura</p></body></html>',DOC]){
  const out=await view('/api/view?f='+encodeURIComponent(page(6)),new Map([[page(6),stored]]));assert.equal(out.body,stored);}
});
test('the notice is fixed text: an unknown language falls back to Spanish and nothing from the document is copied into it',async()=>{
 const stored=FORM_DOC('fr" onload="x').replace('<title>','<title><p id="rubikViewNotice">');
 const out=await view('/api/view?f='+encodeURIComponent(page(7)),new Map([[page(7),stored]]));
 const notice=out.body.match(/<p id="rubikViewNotice" role="note" style="[^"]*">([^<]*)<\/p><div class="share-form">/);assert.ok(notice,'inserted before the form');assert.match(notice[1],CONTRACT.es);
 assert.ok(!/onload/.test(out.body.match(/<p id="rubikViewNotice" role="note"[^>]*>/)[0]));
});
test('the server notice and the new template notice say the same, in the three languages',()=>{
 const tpl=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','js','client-share-ui.js'),'utf8');
 for(const lang of ['es','en','zh']){assert.match(View.NOTICE[lang],CONTRACT[lang]);assert.ok(tpl.includes(`'${View.NOTICE[lang]}'`),lang+' text in js/client-share-ui.js');}
});
