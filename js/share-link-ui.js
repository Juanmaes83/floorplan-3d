/* Phase B4: «Publicar enlace para el cliente». Publishes the same read-only client file as B1 (FloorPlanClientShare)
   through this deployment's /api/share into the owner's Vercel Blob store, optionally with the tour video (B3), and
   gives a link that opens it through /api/view. Before publishing the dialog says what becomes visible, to whom and
   how to remove it, and asks for the PUBLISHING code. GOV-08 S1: that code (RUBIK_SHARE_TOKEN, header
   x-rubik-share-token) is independent of the AI render code: this dialog never reads, copies or sends the render code
   stored by the AI render dialog, and keeps the publishing code only in memory for this page (never in localStorage),
   so a shared computer does not keep it. The project is never sent: only the finished client file and, if chosen,
   the video. Owner decision 29-10-2026: images, areas, location/site and signature contact may be shared.
   GOV-08 / ENT-02 S2: «Mis publicaciones» lists what was published FROM THIS BROWSER (FloorPlanShareRegistry, local,
   not authoritative, never stores a code) and withdraws a link through /api/unshare with the same publishing code,
   after an explicit confirmation.
   GOV-08 S3: every new link expires — 7, 30 (default) or 90 days, never unlimited. The first upload of a publication
   asks the server for that TTL; the next uploads of the same publication send back the publication header the server
   returned, so the page, its video and its 3D visit share one date. «Mis publicaciones» shows the date and the state
   (active, expired, withdrawn, partial, or «sin caducidad» for links published before S3), and «Almacén de
   publicaciones» lists the whole store through /api/publications and purges the expired files after a dry run and an
   explicit confirmation. Legacy links are only identified: nothing published before S3 is expired or deleted here. */
(function(){
 'use strict';
 const app=window.FloorPlanApp;if(!app||!window.FloorPlanClientShare)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const LIMIT=4*1024*1024;let sessionCode='',typedCode=null,ttlChoice=window.FloorPlanShareExpiry?.DEFAULT_TTL||30; // publishing code: memory only, cleared when the page closes; typedCode keeps what is typed across redraws
 const ERRORS=()=>({'not-configured':tx('Los enlaces no están configurados en este servidor. Crea un almacén Vercel Blob en el proyecto (BLOB_READ_WRITE_TOKEN) y define el código de publicación RUBIK_SHARE_TOKEN. Mientras tanto, descarga el archivo para el cliente y envíalo.','Links are not configured on this server. Create a Vercel Blob store in the project (BLOB_READ_WRITE_TOKEN) and set the publishing code RUBIK_SHARE_TOKEN. Meanwhile, download the client file and send it.','此服务器未配置链接。'),misconfigured:tx('El código de publicación del servidor no es válido (es demasiado corto o coincide con el del Render IA). Lo corrige el propietario en Vercel; mientras tanto, descarga el archivo para el cliente y envíalo.','The server publishing code is not valid (too short or equal to the AI render code). The owner fixes it in Vercel; meanwhile, download the client file and send it.','服务器发布码无效。'),origin:tx('La publicación solo se acepta desde la propia aplicación Rubik.','Publishing is only accepted from the Rubik app itself.','只接受来自 Rubik 应用的发布。'),token:tx('El código de publicación no es correcto. Es distinto del código del Render IA; si acabas de recibir uno nuevo, recarga la página e introdúcelo.','The publishing code is not correct. It is different from the AI render code; if you just received a new one, reload the page and enter it.','发布码不正确。它与 AI 渲染码不同。'),size:tx('El archivo supera 4 MB y no se puede publicar. Prepara menos vistas o publica sin vídeo; también puedes descargar el archivo y enviarlo.','The file is over 4 MB and cannot be published. Prepare fewer views or publish without video; you can also download the file and send it.','文件超过 4 MB，无法发布。'),'storage-unreachable':tx('No se pudo contactar con el almacenamiento. Vuelve a intentarlo.','Storage could not be reached. Try again.','无法连接存储，请重试。'),'storage-error':tx('El almacenamiento rechazó el archivo. Revisa el almacén Vercel Blob del proyecto.','Storage rejected the file. Check the project Vercel Blob store.','存储拒绝了文件。'),unavailable:tx('Publicar enlaces no está disponible en este servidor (la función /api/share no existe aquí). Descarga el archivo y envíalo.','Publishing links is not available on this server (/api/share does not exist here). Download the file and send it.','此服务器不提供链接发布。'),
  // GOV-08 S3
  ttl:tx('Elige cuánto tiempo estará disponible el enlace: 7, 30 o 90 días.','Choose how long the link stays available: 7, 30 or 90 days.','请选择链接有效期：7、30 或 90 天。'),
  publication:tx('La publicación no es válida o su fecha de caducidad no se admite. Vuelve a publicar.','The publication is not valid or its expiry date is not accepted. Publish again.','发布无效或到期日期不被接受。请重新发布。'),
  expiry:tx('Este servidor no aplica la caducidad de enlaces: no se publica nada sin fecha de caducidad.','This server does not apply link expiry: nothing is published without an expiry date.','此服务器未启用链接到期：不会发布没有到期日期的内容。'),
  action:tx('Petición no válida.','Invalid request.','请求无效。'),'content-type':tx('Petición no válida.','Invalid request.','请求无效。')});
 const EXPIRY=window.FloorPlanShareExpiry;
 const fmtDate=d=>{try{return new Date(d).toLocaleString(typeof LANG==='string'&&LANG==='en'?'en-GB':'es-ES',{dateStyle:'short',timeStyle:'short'});}catch{return String(d);}};
 const name=()=>typeof nm==='function'?nm(app.project.name):app.project.name;
 const video=()=>{const r=window.FloorPlanTourVideo?.result;return r&&r.blob.size<=LIMIT?r:null;};
 // GOV-08 S3: `pub` carries the TTL of a new publication ({ttl}) or the header of the one already started ({header}).
 async function upload(kind,body,code,pub){
  const expiry=pub.header?{'x-rubik-share-publication':pub.header}:{'x-rubik-share-ttl':String(pub.ttl)};
  let r;try{r=await fetch('api/share',{method:'POST',headers:{'Content-Type':kind==='html'?'text/html; charset=utf-8':kind==='delivery'?'application/json; charset=utf-8':'application/octet-stream','x-rubik-share-token':code,'x-rubik-share-kind':kind,'x-rubik-share-name':encodeURIComponent(name()).slice(0,120),...expiry},body});}
  catch{throw Error(ERRORS()['storage-unreachable']);}
  if(r.status===404)throw Error(ERRORS().unavailable);
  const out=await r.json().catch(()=>null);if(!r.ok||!out?.url)throw Error(ERRORS()[out?.error]||ERRORS()['storage-error']);
  // A server without S3 returns no publication: the link would never expire, so it is refused and cleaned up.
  if(!out.publication?.header||!out.publication?.expiresAt){const e=Error(ERRORS().expiry);e.stored=out.url;throw e;}
  if(!pub.header){pub.header=out.publication.header;pub.expiresAt=out.publication.expiresAt;}
  return out.url;
 }
 // Video first (the page links to it), then the page itself. The link opens the page through /api/view.
 async function publish({withVideo,with3d=false,code,ttl=EXPIRY?.DEFAULT_TTL||30}){
  const stored=[];let tour=null,delivery=null;const pub={ttl};
  try{
   if(!EXPIRY||!EXPIRY.TTL_DAYS.includes(ttl))throw Error(ERRORS().ttl);
   const v=withVideo?video():null;
   if(v){const url=await upload(v.extension,v.blob,code,pub).catch(e=>{if(e.stored)stored.push(e.stored);throw e;});stored.push(url);tour={url,host:new URL(url).hostname,type:v.blob.type};}
   if(with3d){
    const snap=window.FloorPlanDeliveryPreview?.snapshot();if(!snap)throw Error('Visita 3D no disponible');
    const body=JSON.stringify(snap);if(new Blob([body]).size>LIMIT)throw Error(ERRORS().size);
    delivery=await upload('delivery',body,code,pub).catch(e=>{if(e.stored)stored.push(e.stored);throw e;});stored.push(delivery);
   }
   const experience=delivery?{url:new URL('./?entrega='+encodeURIComponent(delivery)+'#desde-documento',location.href).href}:null;
   const out=await FloorPlanClientShare.build({...(tour?{video:tour}:{}),...(experience?{experience}:{})});
   if(out.bytes>LIMIT)throw Error(ERRORS().size);
   const page=await upload('html',new Blob([out.html],{type:'text/html'}),code,pub).catch(e=>{if(e.stored)stored.push(e.stored);throw e;});
   return {link:new URL('api/view?f='+encodeURIComponent(page),location.href).href,page,delivery,video:!!tour,videoUrl:tour?.url||null,bytes:out.bytes,versionCode:out.versionCode,expiresAt:pub.expiresAt,ttlDays:ttl};
  }catch(e){
   if(stored.length===1&&tour&&!delivery)throw Error(e.message+' '+await cleanOrphanVideo(tour.url,code));
   let untracked=[];
   if(stored.length){try{const out=await unshareUrls(stored,code);const left=out.failed.map(f=>f?.url||f);if(left.length&&!REG.save(store(),REG.addOrphanFiles(REG.load(store()),{files:left,project:name()})))untracked=left;}
    catch{if(!REG.save(store(),REG.addOrphanFiles(REG.load(store()),{files:stored,project:name()})))untracked=stored;}}
   throw Error(e.message+(untracked.length?' '+tx('No se pudieron guardar los archivos pendientes de retirada; retíralos en Vercel Blob: ','Pending files could not be recorded; withdraw them in Vercel Blob: ','无法记录待撤回文件；请在 Vercel Blob 中撤回：')+untracked.join(' '):''));
  }
 }
 // S2: local register and withdrawal. The register keeps no code; the code typed above is sent only in the header.
 const REG=window.FloorPlanShareRegistry,store=()=>{try{return window.localStorage;}catch{return null;}};
 const WITHDRAW_ERRORS=()=>({...ERRORS(),urls:tx('Ese enlace no pertenece al almacén de este proyecto: no se puede retirar desde aquí.','That link does not belong to this project store: it cannot be withdrawn from here.','该链接不属于本项目存储。'),'too-many':tx('Demasiados archivos en una sola retirada.','Too many files in one withdrawal.','一次撤回的文件过多。'),unavailable:tx('Retirar enlaces no está disponible en este servidor (/api/unshare no existe aquí). Bórralo desde el panel de Vercel Blob.','Withdrawing links is not available on this server (/api/unshare does not exist here). Delete it from the Vercel Blob dashboard.','此服务器不提供撤回链接。')});
 async function withdraw(entry,code){return unshareUrls(REG.toRemove(entry),code);}
 // S2: the tour video was uploaded but its page was not published. Remove THAT video only (its exact URL, nothing
 // else); if the removal fails, keep it in «Mis publicaciones» as a pending «vídeo sin documento» to withdraw later.
 async function cleanOrphanVideo(videoUrl,code){
  try{const out=await unshareUrls([videoUrl],code);if(out.removed.includes(videoUrl))return tx('El vídeo que ya se había subido se ha borrado: no ha quedado nada publicado.','The video already uploaded was deleted: nothing was left published.','已上传的视频已删除。');}catch{}
  const kept=!!REG&&REG.save(store(),REG.addOrphan(REG.load(store()),{video:videoUrl,project:name()}))&&REG.load(store()).some(e=>e.id===videoUrl);
  if(!kept)return tx(`El vídeo que ya se había subido no se pudo borrar ni guardar en este navegador. Bórralo desde el panel de Vercel Blob: ${videoUrl}`,`The video already uploaded could not be deleted nor saved in this browser. Delete it from the Vercel Blob dashboard: ${videoUrl}`,`已上传的视频未能删除：${videoUrl}`);
  return tx('El vídeo que ya se había subido no se pudo borrar: aparece en «Mis publicaciones» como «Vídeo sin documento» para que lo retires.','The video already uploaded could not be deleted: it appears in «My publications» as «Video without document» so you can withdraw it.','已上传的视频未能删除，可在「我的发布」中撤回。');
 }
 async function unshareUrls(urls,code){
  let r;try{r=await fetch('api/unshare',{method:'POST',headers:{'Content-Type':'application/json','x-rubik-share-token':code},body:JSON.stringify({urls})});}
  catch{throw Error(ERRORS()['storage-unreachable']);}
  if(r.status===404)throw Error(WITHDRAW_ERRORS().unavailable);
  const out=await r.json().catch(()=>null);
  if((r.status===200||r.status===207||r.status===502)&&out&&Array.isArray(out.removed)&&Array.isArray(out.failed))return out;
  throw Error(WITHDRAW_ERRORS()[out?.error]||ERRORS()['storage-error']);
 }
 let confirming=null;
 // Audit 11/11/2026: every redraw rebuilds the dialog, so focus fell to <body> — outside the modal dialog — and the
 // dialog scrolled back to the top. After an action, focus returns next to what was acted on and is scrolled into view.
 const focusAfter=sel=>{const t=dialog.querySelector(sel);if(t){t.focus({preventScroll:true});t.scrollIntoView({block:'nearest'});}};
 const focusEntry=id=>{const q=`[data-pub="${CSS.escape(id)}"]`;dialog.querySelector(q+' [data-action="withdraw"]')?focusAfter(q+' [data-action="withdraw"]'):focusAfter(q);};
 const dialog=el('dialog',undefined,document.body,'ai-render-dialog share-link-dialog');dialog.id='shareLinkDialog';dialog.setAttribute('aria-labelledby','shareLinkTitle');
 let returnFocus=null,last=null;
 dialog.addEventListener('close',()=>returnFocus?.focus?.({preventScroll:true}));
 function open(){returnFocus=document.activeElement;draw();dialog.showModal();dialog.querySelector('#shareLinkAgree')?.focus();}
 function draw(message=''){
  dialog.replaceChildren();const head=el('div',undefined,dialog,'ai-render-head');el('h2',tx('Enlace para el cliente','Link for the client','客户链接'),head).id='shareLinkTitle';
  const close=btn(tx('Cerrar','Close','关闭'),head);close.id='shareLinkClose';close.onclick=()=>dialog.close();
  const note=el('p',undefined,dialog,'ai-render-note');note.id='shareLinkNote';
  note.textContent=tx('Se publica el mismo documento de sólo lectura que el archivo para el cliente: vistas, plano firmado, superficies, orientación, emplazamiento, tu firma y el formulario de observaciones. Cualquiera que tenga el enlace podrá verlo; no aparece en buscadores. Se guarda en el almacén Vercel Blob de este proyecto. Los enlaces publicados desde este navegador se pueden retirar en «Mis publicaciones», más abajo; los publicados desde otro equipo o navegador se retiran desde el panel de Vercel Blob. Al retirar un enlace se borran sus archivos, pero pueden quedar durante un tiempo copias en caché, y los archivos que el destinatario haya descargado siguen en su poder. Cada enlace caduca en la fecha que elijas (7, 30 o 90 días): desde ese momento deja de abrirse, y sus archivos se borran del almacén al retirarlo o al limpiar los caducados. El proyecto editable no se envía.','The same read-only document as the client file is published: views, signed plan, areas, orientation, site, your signature and the observations form. Anyone with the link can see it; it is not indexed. It is stored in this project\'s Vercel Blob store. Links published from this browser can be withdrawn in «My publications», below; those published from another computer or browser are withdrawn from the Vercel Blob dashboard. Withdrawing a link deletes its files, but cached copies may remain for a while, and files the recipient downloaded stay with them. Every link expires on the date you choose (7, 30 or 90 days): from then on it no longer opens, and its files are deleted from the store when you withdraw it or purge the expired ones. The editable project is not sent.','发布与客户文件相同的只读文档。从此浏览器发布的链接可在「我的发布」中撤回；其他设备发布的链接需在 Vercel Blob 面板中删除。撤回会删除文件，但缓存副本可能暂时保留，收件人已下载的文件仍归其所有。每个链接在您选择的日期到期（7、30 或 90 天）。不发送可编辑项目。');
  const form=el('div',undefined,dialog,'ai-render-form');
  const tl=el('label',undefined,form);el('span',tx('Código de publicación de enlaces','Link publishing code','链接发布码'),tl);const ti=el('input',undefined,tl);ti.type='password';ti.id='shareLinkToken';ti.autocomplete='off';ti.value=typedCode??sessionCode;ti.addEventListener('input',()=>{typedCode=ti.value;});
  const th=el('small',tx('Es distinto del código del Render IA. Solo se recuerda mientras esta página esté abierta.','It is different from the AI render code. It is only remembered while this page is open.','与 AI 渲染码不同，仅在此页面打开期间保留。'),tl);th.id='shareLinkTokenHint';ti.setAttribute('aria-describedby','shareLinkTokenHint');
  // GOV-08 S3: how long the link stays available. 30 days by default; there is no «no expiry» option.
  const fs=el('fieldset',undefined,form,'share-link-ttl');fs.id='shareLinkTtl';el('legend',tx('Caducidad del enlace','Link expiry','链接有效期'),fs);
  for(const d of EXPIRY?.TTL_DAYS||[]){const l=el('label',undefined,fs),r=el('input',undefined,l);r.type='radio';r.name='shareLinkTtl';r.value=String(d);r.id='shareLinkTtl'+d;r.checked=d===ttlChoice;r.addEventListener('change',()=>{ttlChoice=d;});
   el('span',d===EXPIRY.DEFAULT_TTL?tx(`${d} días (recomendado)`,`${d} days (recommended)`,`${d} 天（推荐）`):tx(`${d} días`,`${d} days`,`${d} 天`),l);}
  el('small',tx('Pasada la fecha, el enlace deja de abrirse. Puedes retirarlo antes en «Mis publicaciones».','After the date, the link no longer opens. You can withdraw it earlier in «My publications».','到期后链接将无法打开。可提前在「我的发布」中撤回。'),fs);
  const v=window.FloorPlanTourVideo?.result,vl=el('label',undefined,form,'ai-render-consent');const vc=el('input',undefined,vl);vc.type='checkbox';vc.id='shareLinkVideo';
  if(v&&v.blob.size<=LIMIT){vc.checked=true;el('span',tx(`Incluir el vídeo del recorrido (${v.extension.toUpperCase()}, ${(v.blob.size/1048576).toFixed(1).replace('.',',')} MB)`,`Include the tour video (${v.extension.toUpperCase()}, ${(v.blob.size/1048576).toFixed(1)} MB)`,'包含漫游视频'),vl);}
  else{vc.disabled=true;el('span',v?tx('El vídeo supera 4 MB: se publica sin vídeo.','The video is over 4 MB: published without video.','视频超过 4 MB，将不含视频发布。'):tx('Sin vídeo: grábalo en la presentación («Grabar vídeo») si quieres incluirlo.','No video: record it in the presentation («Record video») to include it.','无视频：可在展示中录制。'),vl);}
  const dl=el('label',undefined,form,'ai-render-consent'),dc=el('input',undefined,dl);dc.type='checkbox';dc.id='shareLink3d';
  dc.disabled=!window.FloorPlanDeliveryPreview?.eligible?.();
  el('span',dc.disabled?tx('Visita 3D no disponible para este proyecto.','3D visit unavailable for this project.','此项目无法进行三维参观。'):tx('Incluir visita 3D de solo lectura (necesita conexión).','Include a read-only 3D visit (needs a connection).','包含只读三维参观（需要联网）。'),dl);
  const ok=el('label',undefined,form,'ai-render-consent');const cb=el('input',undefined,ok);cb.type='checkbox';cb.id='shareLinkAgree';el('span',tx('Entiendo que cualquiera con el enlace podrá ver este documento y, si la incluyo, una copia 3D de esta versión.','I understand anyone with the link can see this document and, if included, a 3D copy of this version.','我了解任何持有链接的人都可查看文档及所选的三维副本。'),ok);
  const go=btn(tx('Publicar enlace','Publish link','发布链接'),form,'btn primary');go.id='shareLinkGo';
  const status=el('p',message,dialog,'ai-render-status');status.id='shareLinkStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  if(last){const box=el('div',undefined,dialog,'share-link-result');const out=el('input',undefined,box);out.id='shareLinkUrl';out.readOnly=true;out.value=last.link;out.setAttribute('aria-label',tx('Enlace para el cliente','Link for the client','客户链接'));
   const copy=btn(tx('Copiar enlace','Copy link','复制链接'),box,'btn primary');copy.id='shareLinkCopy';copy.onclick=async()=>{try{await navigator.clipboard.writeText(last.link);status.textContent=tx('Enlace copiado.','Link copied.','链接已复制。');}catch{out.select();status.textContent=tx('Selecciona el enlace y cópialo.','Select the link and copy it.','请选择链接并复制。');}};
   const a=el('a',tx('Abrir','Open','打开'),box,'btn');a.id='shareLinkOpen';a.href=last.link;a.target='_blank';a.rel='noopener noreferrer';
   el('p',tx(`Versión ${last.versionCode}${last.video?' · con vídeo':''} · caduca el ${fmtDate(last.expiresAt)}. Si cambias el proyecto, publica un enlace nuevo: este no se actualiza solo.`,`Version ${last.versionCode}${last.video?' · with video':''} · expires on ${fmtDate(last.expiresAt)}. If you change the project, publish a new link: this one does not update itself.`,`版本 ${last.versionCode} · ${fmtDate(last.expiresAt)} 到期。项目更改后请发布新链接。`),dialog,'share-link-meta').id='shareLinkMeta';}
  if(REG)drawPublications(ti,status);
  drawStore(ti,status);
  go.onclick=async()=>{
   if(!cb.checked){status.textContent=tx('Confirma que entiendes quién podrá verlo.','Confirm you understand who can see it.','请确认您了解谁可以查看。');cb.focus();return;}
   const code=ti.value.trim();if(!code){status.textContent=tx('Introduce el código de publicación.','Enter the publishing code.','请输入发布码。');ti.focus();return;}
   sessionCode=code;go.disabled=true;status.textContent=tx('Publicando…','Publishing…','正在发布…');
   try{last=await publish({withVideo:vc.checked,with3d:dc.checked&&!dc.disabled,code,ttl:ttlChoice});if(REG)REG.save(store(),REG.add(REG.load(store()),{page:last.page,video:last.videoUrl,delivery:last.delivery,link:last.link,project:name(),versionCode:last.versionCode,expiresAt:last.expiresAt,ttlDays:last.ttlDays}));draw(tx('Enlace publicado. Ábrelo para comprobarlo antes de enviarlo.','Link published. Open it to check before sending it.','链接已发布。发送前请先打开检查。'));dialog.querySelector('#shareLinkCopy')?.focus();}
   catch(e){if(e.message.startsWith(ERRORS().token)){sessionCode='';typedCode=null;}draw(e.message);}
  };
 }
 // «Mis publicaciones»: what this browser published, with Open and Withdraw (confirmation first).
 function drawPublications(ti,status){
  const list=REG.load(store()),sec=el('section',undefined,dialog,'share-publications');sec.id='sharePublications';sec.setAttribute('aria-labelledby','sharePublicationsTitle');
  const title=el('h3',tx('Mis publicaciones (este navegador)','My publications (this browser)','我的发布（此浏览器）'),sec);title.id='sharePublicationsTitle';title.tabIndex=-1;
  el('p',tx('Solo aparecen los enlaces publicados desde este navegador: no es un registro completo y otro equipo o navegador no los ve. Los demás se retiran desde el panel de Vercel Blob. Retirar borra los archivos del almacén, pero pueden quedar durante un tiempo copias en caché, y quien ya lo descargó conserva su copia.','Only links published from this browser appear: it is not a complete record and another computer or browser does not see them. The others are withdrawn from the Vercel Blob dashboard. Withdrawing deletes the files from the store, but cached copies may remain for a while, and anyone who downloaded it keeps a copy.','仅显示从此浏览器发布的链接。'),sec,'share-publications-note');
  if(!list.length){el('p',tx('Todavía no hay publicaciones desde este navegador.','No publications from this browser yet.','此浏览器尚无发布。'),sec,'share-publications-empty');return;}
  // «Borrar historial»: forgets this browser's list only — no file is deleted, no link is withdrawn.
  const hist=el('div',undefined,sec,'share-publications-history');
  if(confirming!=='history'){const c=btn(tx('Borrar historial de este navegador','Clear this browser\'s history','清除此浏览器的记录'),hist);c.id='sharePublicationsClear';c.dataset.action='clear-history';c.onclick=()=>{confirming='history';draw();dialog.querySelector('#sharePublicationsClearConfirm')?.focus();};}
  else{el('p',tx('Solo se borra la lista de este navegador: no se retira ningún enlace ni se borra ningún archivo, y los enlaces siguen abriéndose. Después ya no podrás retirarlos desde aquí; tendrás que hacerlo desde el panel de Vercel Blob. ¿Borrar el historial?','Only this browser\'s list is cleared: no link is withdrawn and no file is deleted, and the links keep opening. Afterwards you can no longer withdraw them from here; you will have to use the Vercel Blob dashboard. Clear the history?','仅清除此浏览器的列表：不会撤回链接或删除文件。之后无法在此撤回。确定清除？'),hist,'share-publication-confirm').id='sharePublicationsClearWarning';
   const yes=btn(tx('Sí, borrar solo el historial','Yes, clear only the history','确定仅清除记录'),hist,'btn');yes.id='sharePublicationsClearConfirm';
   const no=btn(tx('Cancelar','Cancel','取消'),hist);no.id='sharePublicationsClearCancel';no.onclick=()=>{confirming=null;draw();focusAfter('#sharePublicationsClear');};
   yes.onclick=()=>{confirming=null;const ok=REG.clear(store());draw(ok?tx('Historial borrado en este navegador. Los enlaces siguen publicados.','History cleared in this browser. The links remain published.','已清除此浏览器的记录。链接仍然有效。'):tx('No se pudo borrar el historial de este navegador.','The history of this browser could not be cleared.','无法清除记录。'));focusAfter('#sharePublicationsTitle');};}
  const ul=el('ul',undefined,sec,'share-publications-list');
  const fmt=d=>{try{return new Date(d).toLocaleString(typeof LANG==='string'&&LANG==='en'?'en-GB':'es-ES',{dateStyle:'short',timeStyle:'short'});}catch{return d;}};
  for(const e of list){
   const li=el('li',undefined,ul,'share-publication');li.dataset.pub=e.id;li.dataset.state=e.state;li.tabIndex=-1;
   el('strong',`${e.project||tx('Proyecto','Project','项目')}${e.versionCode?' · '+tx('versión','version','版本')+' '+e.versionCode:''}`,li);
   el('span',`${tx('Publicado','Published','发布于')} ${fmt(e.publishedAt)} · ${e.kind==='orphan-video'?tx('Vídeo sin documento (la publicación falló)','Video without document (publishing failed)','无文档的视频（发布失败）'):e.kind==='orphan-files'?tx('Archivos sin documento (la publicación falló)','Files without document (publishing failed)','无文档文件（发布失败）'):e.kind==='html+video'?tx('Documento para el cliente con vídeo','Client document with video','含视频的客户文档'):tx('Documento para el cliente','Client document','客户文档')}`,li,'share-publication-meta');
   // GOV-08 S3: the state shown comes from statusAt(): active / expired by date, legacy without a date.
   const life=REG.statusAt?REG.statusAt(e,Date.now()):e.state;li.dataset.expiry=life;
   const st=life==='withdrawn'?tx(`Retirado el ${fmt(e.withdrawnAt)}`,`Withdrawn on ${fmt(e.withdrawnAt)}`,'已撤回'):life==='partial'?tx(`Retirada incompleta: faltan ${e.pending.length} archivo(s). Vuelve a pulsar «Retirar».`,`Incomplete withdrawal: ${e.pending.length} file(s) left. Press «Withdraw» again.`,'撤回未完成')
    :life==='expired'?tx(`Caducado el ${fmt(e.expiresAt)}: el enlace ya no se abre. Sus archivos siguen en el almacén hasta que lo retires o limpies los caducados.`,`Expired on ${fmt(e.expiresAt)}: the link no longer opens. Its files stay in the store until you withdraw it or purge the expired ones.`,'已到期：链接无法打开。')
    :life==='legacy'?tx('Publicado · sin fecha de caducidad (publicado antes de la caducidad de enlaces): sigue abriéndose hasta que lo retires.','Published · no expiry date (published before link expiry): it keeps opening until you withdraw it.','已发布 · 无到期日期（早于链接到期功能）')
    :tx(`Publicado · caduca el ${fmt(e.expiresAt)}`,`Published · expires on ${fmt(e.expiresAt)}`,`已发布 · ${fmt(e.expiresAt)} 到期`);
   el('span',st,li,'share-publication-state');
   if(e.state==='withdrawn')continue;
   const actions=el('div',undefined,li,'share-publication-actions');
   if(e.link){const a=el('a',tx('Abrir','Open','打开'),actions,'btn');a.href=e.link;a.target='_blank';a.rel='noopener noreferrer';}
   if(confirming!==e.id){const w=btn(tx('Retirar','Withdraw','撤回'),actions);w.dataset.action='withdraw';w.onclick=()=>{confirming=e.id;draw();dialog.querySelector(`[data-pub="${CSS.escape(e.id)}"] [data-action="confirm"]`)?.focus();};continue;}
   el('p',tx('El cliente dejará de poder abrir este enlace y los archivos se borran del almacén. No se puede deshacer. ¿Retirarlo?','The client will no longer be able to open this link and the files are deleted from the store. This cannot be undone. Withdraw it?','客户将无法再打开此链接，文件将被删除，无法撤销。确定撤回？'),actions,'share-publication-confirm');
   const yes=btn(tx('Sí, retirar enlace','Yes, withdraw link','确定撤回'),actions,'btn primary');yes.dataset.action='confirm';
   const no=btn(tx('Cancelar','Cancel','取消'),actions);no.dataset.action='cancel';no.onclick=()=>{confirming=null;draw();focusEntry(e.id);};
   yes.onclick=async()=>{
    const code=ti.value.trim();if(!code){status.textContent=tx('Introduce el código de publicación para retirar el enlace.','Enter the publishing code to withdraw the link.','请输入发布码以撤回链接。');ti.focus();return;}
    sessionCode=code;yes.disabled=true;status.textContent=tx('Retirando…','Withdrawing…','正在撤回…');
    try{const out=await withdraw(e,code);REG.save(store(),REG.applyWithdrawal(REG.load(store()),e.id,out));confirming=null;
     draw(out.failed.length?tx(`Retirada incompleta: ${out.removed.length} archivo(s) borrado(s) y ${out.failed.length} sin borrar. Vuelve a intentarlo.`,`Incomplete withdrawal: ${out.removed.length} file(s) deleted and ${out.failed.length} not deleted. Try again.`,'撤回未完成。'):tx('Enlace retirado: los archivos se han borrado del almacén. Pueden quedar durante un tiempo copias en caché, y quien lo descargara conserva su copia.','Link withdrawn: the files were deleted from the store. Cached copies may remain for a while, and anyone who downloaded it keeps a copy.','链接已撤回。缓存副本可能暂时保留。'));focusEntry(e.id);}
    catch(err){const wrongCode=err.message===ERRORS().token;if(wrongCode){sessionCode='';typedCode=null;}confirming=null;draw(err.message);wrongCode?focusAfter('#shareLinkToken'):focusEntry(e.id);}
   };
  }
 }
 // GOV-08 S3 · «Almacén de publicaciones»: the whole store, whatever browser published it (/api/publications). It
 // lists publications by state, identifies the legacy files (published before S3, no date — never deleted here),
 // and purges the expired files: first a dry run that says exactly what would be deleted, then an explicit
 // confirmation. A partial purge is reported and can be repeated.
 let storeView=null;
 async function publications(body,code){
  let r;try{r=await fetch('api/publications',{method:'POST',headers:{'Content-Type':'application/json','x-rubik-share-token':code},body:JSON.stringify(body)});}
  catch{throw Error(ERRORS()['storage-unreachable']);}
  if(r.status===404)throw Error(tx('Revisar el almacén no está disponible en este servidor.','Reviewing the store is not available on this server.','此服务器不提供存储检查。'));
  const out=await r.json().catch(()=>null);
  if((r.status===200||r.status===207||r.status===502)&&out&&out.counts)return out;
  throw Error(ERRORS()[out?.error]||ERRORS()['storage-error']);
 }
 function drawStore(ti,status){
  const sec=el('section',undefined,dialog,'share-store');sec.id='shareStore';sec.setAttribute('aria-labelledby','shareStoreTitle');
  const h=el('h3',tx('Almacén de publicaciones','Publications store','发布存储'),sec);h.id='shareStoreTitle';h.tabIndex=-1;
  el('p',tx('Consulta todo lo publicado en el almacén de este proyecto, desde cualquier navegador, y borra los archivos de los enlaces caducados. Los enlaces publicados antes de la caducidad no tienen fecha: solo se identifican, no se borran.','See everything published in this project store, from any browser, and delete the files of expired links. Links published before expiry existed have no date: they are only identified, never deleted.','查看本项目存储中的全部发布，并删除已到期链接的文件。早于到期功能的链接仅被识别，不会删除。'),sec,'share-publications-note');
  const row=el('div',undefined,sec,'share-store-actions');
  const need=()=>{const code=ti.value.trim();if(!code){status.textContent=tx('Introduce el código de publicación para revisar el almacén.','Enter the publishing code to review the store.','请输入发布码以检查存储。');ti.focus();}return code;};
  const review=btn(tx('Revisar el almacén','Review the store','检查存储'),row);review.id='shareStoreReview';
  review.onclick=async()=>{const code=need();if(!code)return;sessionCode=code;review.disabled=true;status.textContent=tx('Revisando…','Reviewing…','正在检查…');
   try{storeView=await publications({action:'list'},code);confirming=null;draw(tx('Almacén revisado.','Store reviewed.','存储已检查。'));focusAfter('#shareStoreTitle');}
   catch(err){if(err.message===ERRORS().token){sessionCode='';typedCode=null;}draw(err.message);}};
  if(!storeView)return;
  const c=storeView.counts;
  const sum=el('p',tx(`${c.active} activa(s) · ${c.expired} caducada(s) · ${c.legacy} archivo(s) sin fecha de caducidad (publicados antes de la caducidad)${storeView.truncated?' · lista incompleta: el almacén es demasiado grande para una sola revisión':''}.`,
   `${c.active} active · ${c.expired} expired · ${c.legacy} file(s) without expiry date (published before expiry)${storeView.truncated?' · incomplete list':''}.`,`${c.active} 个有效 · ${c.expired} 个已到期 · ${c.legacy} 个无到期日期的文件`),sec,'share-store-summary');sum.id='shareStoreSummary';
  if(c.legacy)el('p',tx('Los archivos sin fecha de caducidad siguen abriéndose. Retirarlos exige una decisión expresa: se retiran uno a uno desde «Mis publicaciones» (si se publicaron desde este navegador) o desde el panel de Vercel Blob.','Files without an expiry date keep opening. Withdrawing them needs an explicit decision: from «My publications» (if published from this browser) or from the Vercel Blob dashboard.','无到期日期的文件仍可打开，撤回需明确决定。'),sec,'share-store-legacy').id='shareStoreLegacy';
  if(!c.expired)return;
  if(confirming!=='purge'){const p=btn(tx(`Borrar los archivos de ${c.expired} enlace(s) caducado(s)`,`Delete the files of ${c.expired} expired link(s)`,'删除已到期链接的文件'),row);p.id='shareStorePurge';
   p.onclick=async()=>{const code=need();if(!code)return;sessionCode=code;p.disabled=true;status.textContent=tx('Comprobando qué se borraría…','Checking what would be deleted…','正在检查…');
    try{const dry=await publications({action:'purge-expired'},code);storeView={...storeView,counts:dry.counts,dryRun:dry};confirming='purge';draw();dialog.querySelector('#shareStorePurgeConfirm')?.focus();}
    catch(err){draw(err.message);}};return;}
  const n=storeView.dryRun?.wouldRemove?.length||0;
  el('p',tx(`Se borrarán ${n} archivo(s) de enlaces caducados. Los enlaces sin fecha de caducidad y los que siguen activos no se tocan. No se puede deshacer. ¿Borrarlos?`,`${n} file(s) of expired links will be deleted. Links without an expiry date and active links are not touched. This cannot be undone. Delete them?`,`将删除 ${n} 个已到期链接的文件，无法撤销。确定删除？`),sec,'share-publication-confirm').id='shareStorePurgeWarning';
  const yes=btn(tx('Sí, borrar los caducados','Yes, delete the expired ones','确定删除已到期'),sec,'btn primary');yes.id='shareStorePurgeConfirm';
  const no=btn(tx('Cancelar','Cancel','取消'),sec);no.id='shareStorePurgeCancel';no.onclick=()=>{confirming=null;draw();focusAfter('#shareStoreTitle');};
  yes.onclick=async()=>{const code=need();if(!code)return;yes.disabled=true;status.textContent=tx('Borrando…','Deleting…','正在删除…');
   try{const out=await publications({action:'purge-expired',confirm:true},code);confirming=null;
    // Entries of this browser whose files were all removed by the purge are marked as withdrawn in «Mis publicaciones».
    if(REG){let list=REG.load(store());for(const e of list){if(e.files.length&&e.files.every(f=>out.removed.includes(f)))list=REG.applyWithdrawal(list,e.id,{removed:e.files,failed:[]});}REG.save(store(),list);}
    storeView=await publications({action:'list'},code).catch(()=>null);
    draw(out.failed.length?tx(`Limpieza incompleta: ${out.removed.length} archivo(s) borrado(s) y ${out.failed.length} sin borrar. Vuelve a intentarlo.`,`Incomplete purge: ${out.removed.length} deleted, ${out.failed.length} not deleted. Try again.`,'清理未完成。')
     :tx(`Caducados borrados: ${out.removed.length} archivo(s).${out.more?' Quedan más: vuelve a pulsar «Borrar».':''} Pueden quedar durante un tiempo copias en caché.`,`Expired files deleted: ${out.removed.length}.${out.more?' More remain: press «Delete» again.':''} Cached copies may remain for a while.`,'已删除到期文件。'));
    focusAfter('#shareStoreTitle');}
   catch(err){confirming=null;draw(err.message);}};
 }
 window.FloorPlanShareLink={open,publish,withdraw,get last(){return last;}};
})();
