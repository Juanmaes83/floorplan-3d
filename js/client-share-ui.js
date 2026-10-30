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
 // B4: the tour video section (only in a published link; a downloaded file stays without network).
 function tour(parent,video){
  const s=el('section',undefined,undefined,'dossier-page share-tour');const foot=parent.querySelector('.dossier-foot');foot?parent.insertBefore(s,foot):parent.append(s);s.id='shareTour';
  el('h2',tx('Recorrido en vídeo','Video tour','视频漫游'),s);const v=el('video',undefined,s);v.controls=true;v.playsInline=true;v.preload='metadata';v.src=video.url;v.setAttribute('aria-label',tx('Recorrido de la vivienda','Tour of the home','住宅漫游'));
  el('p',tx('Recorrido por las estancias de la propuesta, grabado desde el modelo 3D del proyecto.','Tour of the proposal rooms, recorded from the project 3D model.','根据项目三维模型录制的方案房间漫游。'),s,'share-tour-note');
 }
 // The client's observations form, as DOM (labels in the project's language). Its behaviour is the inline script.
 function form(parent){
  const s=el('section',undefined,undefined,'dossier-page share-review');const foot=parent.querySelector('.dossier-foot');foot?parent.insertBefore(s,foot):parent.append(s);s.id='shareReview';el('h2',tx('Tus observaciones','Your observations','您的意见'),s);
  el('p',tx('Escribe lo que quieras comentar de la vivienda o de una estancia. Al terminar, guarda el archivo de observaciones y envíaselo al profesional: no se envía nada automáticamente.','Write what you want to comment on the home or a room. When you finish, save the observations file and send it to the professional: nothing is sent automatically.','写下您对住宅或某个房间的意见。完成后保存意见文件并发送给专业人员：不会自动发送任何内容。'),s,'dossier-note');
  const f=el('div',undefined,s,'share-form');
  const who=el('label',undefined,f);el('span',tx('Tu nombre (opcional)','Your name (optional)','您的姓名（可选）'),who);const wi=el('input',undefined,who);wi.id='shareReviewer';wi.maxLength=80;wi.autocomplete='name';
  const where=el('label',undefined,f);el('span',tx('Sobre','About','关于'),where);const sel=el('select',undefined,where);sel.id='shareAnchor';
  // B6: the same anchors as in Rubik — rooms, elements named with their room, images — each option carries its anchor.
  const names={project:tx('Toda la vivienda','The whole home','整个住宅'),rooms:tx('Estancias','Rooms','房间'),elements:tx('Muebles, puertas y ventanas','Furniture, doors and windows','家具、门窗'),images:tx('Imágenes','Images','图片'),image:tx('Imagen','Image','图片'),point:tx('Punto del plano','Point on the plan','平面图上的点'),door:tx('Puerta','Door','门'),window:tx('Ventana','Window','窗'),room:roomLabel,object:o=>typeof nm==='function'?nm(o.name||o.type):(o.name||o.type)};
  const views=(window.FloorPlanProjectViews?.current()||[]).map(v=>({id:v.id,label:v.label}));
  for(const g of FloorPlanReviewAnchors.groups(app.project,{names,views})){const parent=g.key==='project'?sel:el('optgroup',undefined,sel);if(g.key!=='project')parent.label=g.label;
   for(const it of g.items){const o=el('option',it.label,parent);o.value=g.key==='project'?'':JSON.stringify(it.anchor);}}
  // A point on the plan: the client taps the drawing; the room under the tap names it.
  const pick=el('figure',undefined,f,'share-pick is-wide');el('figcaption',tx('O toca el plano para señalar un punto concreto.','Or tap the plan to mark a precise point.','或点击平面图标记一个具体位置。'),pick);
  const svg=window.FloorPlanProjectPreview?.plan(pick,{label:tx('Plano para señalar un punto','Plan to mark a point','用于标记位置的平面图'),cls:'project-plan share-pick-plan'});
  if(svg){svg.id='sharePlanPick';const data=FloorPlanProjectVisual.plan(app.geometry);svg.querySelectorAll('.preview-room').forEach((poly,i)=>{const r=app.project.rooms.find(x=>x.id===data.rooms[i]?.id);if(r){poly.dataset.room=r.id;poly.dataset.label=roomLabel(r);}});}else pick.remove();
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
function draw(){var list=$('shareNotes');list.textContent='';doc.notes.forEach(function(n){var li=document.createElement('li'),b=document.createElement('b'),p=document.createElement('p'),x=document.createElement('button');b.textContent=n.anchor.kind==='project'?C.text.home:(n.anchor.label||C.text.home);p.textContent=n.text;x.type='button';x.textContent=C.text.remove;x.onclick=function(){doc=R.remove(doc,n.id);persist();draw()};li.append(b,p,x);list.append(li)});
$('shareSave').disabled=!doc.notes.length;$('shareStatus').textContent=doc.notes.length?C.text.count.replace('{n}',doc.notes.length):''}
$('shareReviewer').value=doc.reviewer||'';
$('shareAdd').onclick=function(){var s=$('shareAnchor'),o=s.options[s.selectedIndex];try{doc=R.add(doc,{anchor:s.value?JSON.parse(s.value):{kind:'project'},text:$('shareText').value});doc.reviewer=$('shareReviewer').value.trim().slice(0,80);$('shareText').value='';persist();draw();$('shareText').focus()}catch(e){$('shareStatus').textContent=e.message}};
$('shareSave').onclick=function(){doc.reviewer=$('shareReviewer').value.trim().slice(0,80);var blob=new Blob([JSON.stringify(R.read(doc),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='observaciones-'+doc.versionCode+'.json';document.body.append(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},2000);$('shareStatus').textContent=C.text.saved};
var plan=$('sharePlanPick'),NS='http://www.w3.org/2000/svg';
function choose(value,label){var s=$('shareAnchor'),o=null;for(var i=0;i<s.options.length;i++)if(s.options[i].value===value)o=s.options[i];if(!o){o=document.getElementById('sharePointOption')||document.createElement('option');o.id='sharePointOption';o.value=value;o.textContent=label;if(!o.parentNode)s.options[0].after(o)}o.value=value;o.textContent=label;s.value=value;$('shareText').focus()}
if(plan)plan.addEventListener('click',function(e){var m=plan.getScreenCTM();if(!m)return;var p=plan.createSVGPoint();p.x=e.clientX;p.y=e.clientY;p=p.matrixTransform(m.inverse());var room=e.target.closest&&e.target.closest('[data-room]'),a={kind:'point',x:Math.round(p.x),y:Math.round(p.y),label:C.text.point+(room?' · '+room.getAttribute('data-label'):'')};if(room)a.roomId=room.getAttribute('data-room');
 var mark=document.getElementById('sharePointMark');if(!mark){mark=document.createElementNS(NS,'circle');mark.id='sharePointMark';mark.setAttribute('class','share-point-mark');plan.append(mark)}var vb=plan.viewBox.baseVal;mark.setAttribute('cx',a.x);mark.setAttribute('cy',a.y);mark.setAttribute('r',Math.max(vb.width,vb.height)/50);
 choose(JSON.stringify(a),a.label);$('shareStatus').textContent=C.text.marked});
document.querySelectorAll('.share-comment-view').forEach(function(b){b.onclick=function(){var a=JSON.parse(b.getAttribute('data-anchor'));choose(JSON.stringify(a),a.label);$('shareReview').scrollIntoView({block:'start'});$('shareText').focus()}});
draw()})();`;
 const SHARE_CSS=`body{margin:0;background:#efeae0}.dossier-paper{max-width:960px;margin:0 auto;padding:12px}.share-top{max-width:960px;margin:0 auto;padding:14px 12px 0;font:12px/1.4 system-ui,sans-serif;color:#626457}
.share-form{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin:12px 0}.share-form label{display:grid;gap:4px;font-size:13px;font-weight:600}.share-form .is-wide{grid-column:1/-1}
.share-form input,.share-form select,.share-form textarea{font:inherit;font-weight:400;padding:9px;border:1px solid #978b79;border-radius:4px;background:#fffdf8;min-height:44px;box-sizing:border-box;width:100%}
.share-actions{display:flex;gap:10px;flex-wrap:wrap}.share-actions button,.share-notes button{font:600 14px system-ui,sans-serif;min-height:44px;padding:8px 14px;border:1px solid #2d332f;border-radius:4px;background:#fffdf8;color:#2d332f;cursor:pointer}
.share-actions #shareSave{background:#205b60;border-color:#205b60;color:#fff}.share-actions button:disabled{opacity:.45;cursor:default}
.share-notes{display:grid;gap:8px;padding-left:20px}.share-notes li{background:#f6f2e9;padding:10px;border-radius:4px}.share-notes p{margin:4px 0}.share-status{font-weight:600;font-size:13px}
\n.share-pick{margin:0}.share-pick figcaption{font-size:13px;color:#626457;margin-bottom:4px}.share-pick-plan{display:block;width:100%;max-height:340px;background:#f6f2e9;border:1px solid #d8d0c2;border-radius:4px;cursor:crosshair}.share-pick-plan .preview-room{fill:#e9dfcd;stroke:#b8ab94;stroke-width:20}.share-pick-plan .preview-wall{fill:#2d332f}.share-point-mark{fill:#b0442c;stroke:#fff;stroke-width:30}.share-comment-view{margin-top:6px;min-height:40px;padding:0 12px;border:1px solid #978b79;border-radius:4px;background:#fffcf6;font:inherit;cursor:pointer}@media print{.share-comment-view{display:none}}\n.share-tour video{display:block;width:100%;max-height:70vh;background:#111;border-radius:4px}.share-tour-note{font-size:13px;color:#626457}@media(max-width:700px){.share-form{grid-template-columns:minmax(0,1fr)}}@media print{.share-review{display:none}}`;
 // opts.video {url,host,type}: B4 link only — the published tour video, played from the owner's Blob store (media-src).
 // Each project image in the file gets «Comentar esta imagen», which selects that image as the anchor.
 function commentViews(paper){paper.querySelectorAll('.dossier-views figure').forEach((fig,i)=>{const v=(window.FloorPlanProjectViews?.current()||[])[i];if(!v)return;const b=el('button',tx('Comentar esta imagen','Comment on this image','评论此图片'),fig,'share-comment-view');b.type='button';b.dataset.anchor=JSON.stringify({kind:'view',viewId:v.id,label:tx('Imagen: ','Image: ','图片：')+v.label});});}
 async function build(opts={}){
  const v=window.FloorPlanProjectViews,views=v?.current()||[];
  const paper=el('article',undefined,undefined,'dossier-paper');const bag=FloorPlanDossier.compose(paper,'client');
  try{
   for(const img of paper.querySelectorAll('img')){if(img.src.startsWith('blob:'))img.src=await blobToData(await (await fetch(img.src)).blob());else if(img.src.startsWith('data:image/png'))img.src=await jpeg(img.src);}
  }finally{for(const u of bag)URL.revokeObjectURL(u);}
  // The client never sees instructions meant for the professional: an images page without images is left out.
  paper.querySelectorAll('.dossier-views').forEach(p=>{if(!p.querySelector('img'))p.remove();});
  if(opts.video)tour(paper,opts.video);
  form(paper);commentViews(paper);
  const [dossierCss,siteCss,reviewCore]=await Promise.all(['css/project-dossier.css','css/site-report.css','js/review-notes-core.js'].map(text));
  const config={projectId:app.project.id,projectName:name(),versionCode:FloorPlanReviewNotes.versionCode(revision()),text:{point:tx('Punto del plano','Point on the plan','平面图上的点'),marked:tx('Punto marcado. Escribe tu observación sobre él.','Point marked. Write your observation about it.','已标记位置，请写下意见。'),home:tx('Toda la vivienda','The whole home','整个住宅'),remove:tx('Quitar','Remove','删除'),count:tx('{n} observaciones preparadas. Guarda el archivo y envíaselo al profesional.','{n} observations ready. Save the file and send it to the professional.','已准备 {n} 条意见。请保存文件并发送给专业人员。'),saved:tx('Archivo guardado. Envíaselo al profesional por el canal que uséis.','File saved. Send it to the professional through your usual channel.','文件已保存，请通过常用渠道发送给专业人员。')}};
  const brand=window.FloorPlanBrandUI?.snapshot()?.profile,lang=typeof LANG==='string'?LANG:'es',title=`${name()} · ${tx('Propuesta','Proposal','方案')}${brand?.name?' · '+brand.name:''}`;
  const top=tx(`Documento de sólo lectura preparado con Rubik Sota${brand?.name?' por '+brand.name:''} el ${new Date().toLocaleDateString(({es:'es-ES',en:'en-GB',zh:'zh-CN'})[lang]||'es-ES')}. Versión ${config.versionCode}. No necesita conexión ni instalar nada.`,`Read-only document prepared with Rubik Sota${brand?.name?' by '+brand.name:''}. Version ${config.versionCode}. No connection or installation needed.`,`由 Rubik Sota 准备的只读文档。版本 ${config.versionCode}。无需联网或安装。`);
  // A published link plays its video from the store: it does need a connection, so the line says so.
  const topLine=opts.video?top.replace(tx('No necesita conexión ni instalar nada.','No connection or installation needed.','无需联网或安装。'),tx('No necesita instalar nada; el vídeo necesita conexión.','No installation needed; the video needs a connection.','无需安装；视频需要联网。')):top;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  const html=`<!doctype html><html lang="${esc(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${opts.video?CSP.replace("img-src data:;",`img-src data:; media-src https://${opts.video.host};`):CSP}"><meta name="generator" content="Rubik Sota"><meta name="robots" content="noindex"><title>${esc(title)}</title><style>${dossierCss}\n${siteCss}\n${SHARE_CSS}</style></head><body class="rubik-client-file"><p class="share-top">${esc(topLine)}</p>${paper.outerHTML}<script type="application/json" id="rubik-share">${safe(JSON.stringify(config))}</script><script>${reviewCore}</script><script>${SCRIPT}</script></body></html>`;
  return {html,bytes:new Blob([html]).size,views:views.length,versionCode:config.versionCode};
 }
 const slug=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,60)||'proyecto';
 async function download(){const out=await build(),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.html],{type:'text/html;charset=utf-8'}));a.download=`rubik-sota-${slug(name())}-para-el-cliente.html`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);return out;}
 window.FloorPlanClientShare={build,download,CSP};
})();
