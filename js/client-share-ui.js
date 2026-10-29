/* Phase B1: «Archivo para tu cliente». One self-contained, read-only HTML file the professional sends by e-mail,
   WhatsApp or any channel: the client-style dossier (FloorPlanDossier.compose: real views, sheet, areas, orientation,
   site, signature) plus an observations form that runs Rubik's own FloorPlanReviewNotes and saves the
   `observaciones-<versión>.json` the professional already imports in «Observaciones del cliente».
   No server, no upload: every image is inlined, a Content-Security-Policy forbids any network request, and the file
   carries no editable project. Owner decision 29-10-2026: images, areas, location/site and signature contact may be
   included. */
(function(){
 'use strict';
 const app=window.FloorPlanApp;if(!app||!window.FloorPlanDossier||!window.FloorPlanReviewNotes)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const name=()=>typeof nm==='function'?nm(app.project.name):app.project.name;
 const revision=()=>FloorPlanGuide.revision(app.project);
 const CSP="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'none'; base-uri 'none'";
 async function text(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw Error(tx('No se pudo preparar el archivo. Vuelve a intentarlo.','The file could not be prepared. Try again.','无法准备文件，请重试。'));return r.text();}
 const blobToData=blob=>new Promise((res,rej)=>{const f=new FileReader();f.onload=()=>res(f.result);f.onerror=()=>rej(f.error);f.readAsDataURL(blob);});
 // Views are 1600×820 PNG frames: re-encoded as JPEG so the file stays easy to send; the sheet stays vector (SVG).
 async function jpeg(src,quality=.86){const img=new Image();img.src=src;await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0);return c.toDataURL('image/jpeg',quality);}
 const roomLabel=r=>typeof roomDisplay==='function'?roomDisplay(r):typeof nm==='function'?nm(r.name):r.name;
 const safe=s=>String(s).replace(/</g,'\\u003c');
 // The client's observations form, as DOM (labels in the project's language). Its behaviour is the inline script.
 function form(parent){
  const s=el('section',undefined,undefined,'dossier-page share-review');const foot=parent.querySelector('.dossier-foot');foot?parent.insertBefore(s,foot):parent.append(s);s.id='shareReview';el('h2',tx('Tus observaciones','Your observations','您的意见'),s);
  el('p',tx('Escribe lo que quieras comentar de la vivienda o de una estancia. Al terminar, guarda el archivo de observaciones y envíaselo al profesional: no se envía nada automáticamente.','Write what you want to comment on the home or a room. When you finish, save the observations file and send it to the professional: nothing is sent automatically.','写下您对住宅或某个房间的意见。完成后保存意见文件并发送给专业人员：不会自动发送任何内容。'),s,'dossier-note');
  const f=el('div',undefined,s,'share-form');
  const who=el('label',undefined,f);el('span',tx('Tu nombre (opcional)','Your name (optional)','您的姓名（可选）'),who);const wi=el('input',undefined,who);wi.id='shareReviewer';wi.maxLength=80;wi.autocomplete='name';
  const where=el('label',undefined,f);el('span',tx('Sobre','About','关于'),where);const sel=el('select',undefined,where);sel.id='shareAnchor';
  el('option',tx('Toda la vivienda','The whole home','整个住宅'),sel).value='';
  for(const r of app.project.rooms){const o=el('option',roomLabel(r),sel);o.value=r.id;}
  const what=el('label',undefined,f,'is-wide');el('span',tx('Observación','Observation','意见'),what);const ta=el('textarea',undefined,what);ta.id='shareText';ta.maxLength=FloorPlanReviewNotes.MAX_TEXT;ta.rows=4;
  const actions=el('div',undefined,f,'share-actions is-wide');const add=el('button',tx('Añadir observación','Add observation','添加意见'),actions);add.type='button';add.id='shareAdd';
  const save=el('button',tx('Guardar archivo de observaciones','Save observations file','保存意见文件'),actions);save.type='button';save.id='shareSave';save.disabled=true;
  const status=el('p','',s,'share-status');status.id='shareStatus';status.setAttribute('role','status');
  el('ol',undefined,s,'share-notes').id='shareNotes';
  return s;
 }
 const SCRIPT=`(function(){'use strict';var R=window.FloorPlanReviewNotes,C=JSON.parse(document.getElementById('rubik-share').textContent),$=function(i){return document.getElementById(i)};
var KEY='rubik-share-notes:'+C.projectId+':'+C.versionCode,doc;try{doc=R.read(localStorage.getItem(KEY)||'null')}catch(e){doc=null}
if(!doc||doc.versionCode!==C.versionCode){doc=R.create({id:C.projectId,name:C.projectName},'x');doc.versionCode=C.versionCode}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(doc))}catch(e){}}
function draw(){var list=$('shareNotes');list.textContent='';doc.notes.forEach(function(n){var li=document.createElement('li'),b=document.createElement('b'),p=document.createElement('p'),x=document.createElement('button');b.textContent=n.anchor.kind==='room'?n.anchor.label:C.text.home;p.textContent=n.text;x.type='button';x.textContent=C.text.remove;x.onclick=function(){doc=R.remove(doc,n.id);persist();draw()};li.append(b,p,x);list.append(li)});
$('shareSave').disabled=!doc.notes.length;$('shareStatus').textContent=doc.notes.length?C.text.count.replace('{n}',doc.notes.length):''}
$('shareReviewer').value=doc.reviewer||'';
$('shareAdd').onclick=function(){var s=$('shareAnchor'),o=s.options[s.selectedIndex];try{doc=R.add(doc,{anchor:s.value?{kind:'room',roomId:s.value,label:o.textContent}:{kind:'project'},text:$('shareText').value});doc.reviewer=$('shareReviewer').value.trim().slice(0,80);$('shareText').value='';persist();draw();$('shareText').focus()}catch(e){$('shareStatus').textContent=e.message}};
$('shareSave').onclick=function(){doc.reviewer=$('shareReviewer').value.trim().slice(0,80);var blob=new Blob([JSON.stringify(R.read(doc),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='observaciones-'+doc.versionCode+'.json';document.body.append(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},2000);$('shareStatus').textContent=C.text.saved};
draw()})();`;
 const SHARE_CSS=`body{margin:0;background:#efeae0}.dossier-paper{max-width:960px;margin:0 auto;padding:12px}.share-top{max-width:960px;margin:0 auto;padding:14px 12px 0;font:12px/1.4 system-ui,sans-serif;color:#626457}
.share-form{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin:12px 0}.share-form label{display:grid;gap:4px;font-size:13px;font-weight:600}.share-form .is-wide{grid-column:1/-1}
.share-form input,.share-form select,.share-form textarea{font:inherit;font-weight:400;padding:9px;border:1px solid #978b79;border-radius:4px;background:#fffdf8;min-height:44px;box-sizing:border-box;width:100%}
.share-actions{display:flex;gap:10px;flex-wrap:wrap}.share-actions button,.share-notes button{font:600 14px system-ui,sans-serif;min-height:44px;padding:8px 14px;border:1px solid #2d332f;border-radius:4px;background:#fffdf8;color:#2d332f;cursor:pointer}
.share-actions #shareSave{background:#205b60;border-color:#205b60;color:#fff}.share-actions button:disabled{opacity:.45;cursor:default}
.share-notes{display:grid;gap:8px;padding-left:20px}.share-notes li{background:#f6f2e9;padding:10px;border-radius:4px}.share-notes p{margin:4px 0}.share-status{font-weight:600;font-size:13px}
@media(max-width:700px){.share-form{grid-template-columns:minmax(0,1fr)}}@media print{.share-review{display:none}}`;
 async function build(){
  const v=window.FloorPlanProjectViews,views=v?.current()||[];
  const paper=el('article',undefined,undefined,'dossier-paper');const bag=FloorPlanDossier.compose(paper,'client');
  try{
   for(const img of paper.querySelectorAll('img')){if(img.src.startsWith('blob:'))img.src=await blobToData(await (await fetch(img.src)).blob());else if(img.src.startsWith('data:image/png'))img.src=await jpeg(img.src);}
  }finally{for(const u of bag)URL.revokeObjectURL(u);}
  form(paper);
  const [dossierCss,siteCss,reviewCore]=await Promise.all(['css/project-dossier.css','css/site-report.css','js/review-notes-core.js'].map(text));
  const config={projectId:app.project.id,projectName:name(),versionCode:FloorPlanReviewNotes.versionCode(revision()),text:{home:tx('Toda la vivienda','The whole home','整个住宅'),remove:tx('Quitar','Remove','删除'),count:tx('{n} observaciones preparadas. Guarda el archivo y envíaselo al profesional.','{n} observations ready. Save the file and send it to the professional.','已准备 {n} 条意见。请保存文件并发送给专业人员。'),saved:tx('Archivo guardado. Envíaselo al profesional por el canal que uséis.','File saved. Send it to the professional through your usual channel.','文件已保存，请通过常用渠道发送给专业人员。')}};
  const brand=window.FloorPlanBrandUI?.snapshot()?.profile,lang=typeof LANG==='string'?LANG:'es',title=`${name()} · ${tx('Propuesta','Proposal','方案')}${brand?.name?' · '+brand.name:''}`;
  const top=tx(`Documento de sólo lectura preparado con Rubik Sota${brand?.name?' por '+brand.name:''} el ${new Date().toLocaleDateString(({es:'es-ES',en:'en-GB',zh:'zh-CN'})[lang]||'es-ES')}. Versión ${config.versionCode}. No necesita conexión ni instalar nada.`,`Read-only document prepared with Rubik Sota${brand?.name?' by '+brand.name:''}. Version ${config.versionCode}. No connection or installation needed.`,`由 Rubik Sota 准备的只读文档。版本 ${config.versionCode}。无需联网或安装。`);
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  const html=`<!doctype html><html lang="${esc(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${CSP}"><meta name="generator" content="Rubik Sota"><meta name="robots" content="noindex"><title>${esc(title)}</title><style>${dossierCss}\n${siteCss}\n${SHARE_CSS}</style></head><body class="rubik-client-file"><p class="share-top">${esc(top)}</p>${paper.outerHTML}<script type="application/json" id="rubik-share">${safe(JSON.stringify(config))}</script><script>${reviewCore}</script><script>${SCRIPT}</script></body></html>`;
  return {html,bytes:new Blob([html]).size,views:views.length,versionCode:config.versionCode};
 }
 const slug=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,60)||'proyecto';
 async function download(){const out=await build(),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.html],{type:'text/html;charset=utf-8'}));a.download=`rubik-sota-${slug(name())}-para-el-cliente.html`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);return out;}
 window.FloorPlanClientShare={build,download,CSP};
})();
