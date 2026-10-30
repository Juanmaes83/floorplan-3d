/* Phase B4: «Publicar enlace para el cliente». Publishes the same read-only client file as B1 (FloorPlanClientShare)
   through this deployment's /api/share into the owner's Vercel Blob store, optionally with the tour video (B3), and
   gives a link that opens it through /api/view. Before publishing the dialog says what becomes visible, to whom and
   how to remove it, and asks for the access code (the same one as the AI render). The project is never sent: only
   the finished client file and, if chosen, the video. Owner decision 29-10-2026: images, areas, location/site and
   signature contact may be shared. */
(function(){
 'use strict';
 const app=window.FloorPlanApp;if(!app||!window.FloorPlanClientShare)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const TOKEN_KEY='rubik-render-token',LIMIT=4*1024*1024;
 const ERRORS=()=>({'not-configured':tx('Los enlaces no están configurados en este servidor. Crea un almacén Vercel Blob en el proyecto (BLOB_READ_WRITE_TOKEN) y define RUBIK_RENDER_TOKEN.','Links are not configured on this server. Create a Vercel Blob store in the project (BLOB_READ_WRITE_TOKEN) and set RUBIK_RENDER_TOKEN.','此服务器未配置链接。'),token:tx('El código de acceso no es correcto.','The access code is not correct.','访问码不正确。'),size:tx('El archivo supera 4 MB y no se puede publicar. Prepara menos vistas o publica sin vídeo; también puedes descargar el archivo y enviarlo.','The file is over 4 MB and cannot be published. Prepare fewer views or publish without video; you can also download the file and send it.','文件超过 4 MB，无法发布。'),'storage-unreachable':tx('No se pudo contactar con el almacenamiento. Vuelve a intentarlo.','Storage could not be reached. Try again.','无法连接存储，请重试。'),'storage-error':tx('El almacenamiento rechazó el archivo. Revisa el almacén Vercel Blob del proyecto.','Storage rejected the file. Check the project Vercel Blob store.','存储拒绝了文件。'),unavailable:tx('Publicar enlaces no está disponible en este servidor (la función /api/share no existe aquí). Descarga el archivo y envíalo.','Publishing links is not available on this server (/api/share does not exist here). Download the file and send it.','此服务器不提供链接发布。')});
 const token=()=>{try{return localStorage.getItem(TOKEN_KEY)||'';}catch{return '';}};
 const setToken=v=>{try{v?localStorage.setItem(TOKEN_KEY,v):localStorage.removeItem(TOKEN_KEY);}catch{}};
 const name=()=>typeof nm==='function'?nm(app.project.name):app.project.name;
 const video=()=>{const r=window.FloorPlanTourVideo?.result;return r&&r.blob.size<=LIMIT?r:null;};
 async function upload(kind,body,code){
  let r;try{r=await fetch('api/share',{method:'POST',headers:{'Content-Type':kind==='html'?'text/html; charset=utf-8':'application/octet-stream','x-rubik-render-token':code,'x-rubik-share-kind':kind,'x-rubik-share-name':encodeURIComponent(name()).slice(0,120)},body});}
  catch{throw Error(ERRORS()['storage-unreachable']);}
  if(r.status===404)throw Error(ERRORS().unavailable);
  const out=await r.json().catch(()=>null);if(!r.ok||!out?.url)throw Error(ERRORS()[out?.error]||ERRORS()['storage-error']);return out.url;
 }
 // Video first (the page links to it), then the page itself. The link opens the page through /api/view.
 async function publish({withVideo,code}){
  let tour=null;const v=withVideo?video():null;
  if(v){const url=await upload(v.extension,v.blob,code);tour={url,host:new URL(url).hostname,type:v.blob.type};}
  const out=await FloorPlanClientShare.build(tour?{video:tour}:{});
  if(out.bytes>LIMIT)throw Error(ERRORS().size);
  const page=await upload('html',new Blob([out.html],{type:'text/html'}),code);
  return {link:new URL('api/view?f='+encodeURIComponent(page),location.href).href,page,video:!!tour,bytes:out.bytes,versionCode:out.versionCode};
 }
 const dialog=el('dialog',undefined,document.body,'ai-render-dialog share-link-dialog');dialog.id='shareLinkDialog';dialog.setAttribute('aria-labelledby','shareLinkTitle');
 let returnFocus=null,last=null;
 dialog.addEventListener('close',()=>returnFocus?.focus?.({preventScroll:true}));
 function open(){returnFocus=document.activeElement;draw();dialog.showModal();dialog.querySelector('#shareLinkAgree')?.focus();}
 function draw(message=''){
  dialog.replaceChildren();const head=el('div',undefined,dialog,'ai-render-head');el('h2',tx('Enlace para el cliente','Link for the client','客户链接'),head).id='shareLinkTitle';
  const close=btn(tx('Cerrar','Close','关闭'),head);close.id='shareLinkClose';close.onclick=()=>dialog.close();
  const note=el('p',undefined,dialog,'ai-render-note');note.id='shareLinkNote';
  note.textContent=tx('Se publica el mismo documento de sólo lectura que el archivo para el cliente: vistas, plano firmado, superficies, orientación, emplazamiento, tu firma y el formulario de observaciones. Cualquiera que tenga el enlace podrá verlo; no aparece en buscadores. Se guarda en el almacén Vercel Blob de este proyecto y se borra desde ese panel. El proyecto editable no se envía.','The same read-only document as the client file is published: views, signed plan, areas, orientation, site, your signature and the observations form. Anyone with the link can see it; it is not indexed. It is stored in this project\'s Vercel Blob store and removed from that dashboard. The editable project is not sent.','发布与客户文件相同的只读文档。任何拥有链接的人都可查看；不会被搜索引擎收录。存储于本项目的 Vercel Blob，可在其面板删除。不发送可编辑项目。');
  const form=el('div',undefined,dialog,'ai-render-form');
  const tl=el('label',undefined,form);el('span',tx('Código de acceso','Access code','访问码'),tl);const ti=el('input',undefined,tl);ti.type='password';ti.id='shareLinkToken';ti.autocomplete='off';ti.value=token();
  const v=window.FloorPlanTourVideo?.result,vl=el('label',undefined,form,'ai-render-consent');const vc=el('input',undefined,vl);vc.type='checkbox';vc.id='shareLinkVideo';
  if(v&&v.blob.size<=LIMIT){vc.checked=true;el('span',tx(`Incluir el vídeo del recorrido (${v.extension.toUpperCase()}, ${(v.blob.size/1048576).toFixed(1).replace('.',',')} MB)`,`Include the tour video (${v.extension.toUpperCase()}, ${(v.blob.size/1048576).toFixed(1)} MB)`,'包含漫游视频'),vl);}
  else{vc.disabled=true;el('span',v?tx('El vídeo supera 4 MB: se publica sin vídeo.','The video is over 4 MB: published without video.','视频超过 4 MB，将不含视频发布。'):tx('Sin vídeo: grábalo en la presentación («Grabar vídeo») si quieres incluirlo.','No video: record it in the presentation («Record video») to include it.','无视频：可在展示中录制。'),vl);}
  const ok=el('label',undefined,form,'ai-render-consent');const cb=el('input',undefined,ok);cb.type='checkbox';cb.id='shareLinkAgree';el('span',tx('Entiendo que cualquiera con el enlace podrá ver este documento.','I understand anyone with the link can see this document.','我了解任何拥有链接的人都可查看此文档。'),ok);
  const go=btn(tx('Publicar enlace','Publish link','发布链接'),form,'btn primary');go.id='shareLinkGo';
  const status=el('p',message,dialog,'ai-render-status');status.id='shareLinkStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  if(last){const box=el('div',undefined,dialog,'share-link-result');const out=el('input',undefined,box);out.id='shareLinkUrl';out.readOnly=true;out.value=last.link;out.setAttribute('aria-label',tx('Enlace para el cliente','Link for the client','客户链接'));
   const copy=btn(tx('Copiar enlace','Copy link','复制链接'),box,'btn primary');copy.id='shareLinkCopy';copy.onclick=async()=>{try{await navigator.clipboard.writeText(last.link);status.textContent=tx('Enlace copiado.','Link copied.','链接已复制。');}catch{out.select();status.textContent=tx('Selecciona el enlace y cópialo.','Select the link and copy it.','请选择链接并复制。');}};
   const a=el('a',tx('Abrir','Open','打开'),box,'btn');a.id='shareLinkOpen';a.href=last.link;a.target='_blank';a.rel='noopener noreferrer';
   el('p',tx(`Versión ${last.versionCode}${last.video?' · con vídeo':''}. Si cambias el proyecto, publica un enlace nuevo: este no se actualiza solo.`,`Version ${last.versionCode}${last.video?' · with video':''}. If you change the project, publish a new link: this one does not update itself.`,`版本 ${last.versionCode}。项目更改后请发布新链接。`),dialog,'share-link-meta').id='shareLinkMeta';}
  go.onclick=async()=>{
   if(!cb.checked){status.textContent=tx('Confirma que entiendes quién podrá verlo.','Confirm you understand who can see it.','请确认您了解谁可以查看。');cb.focus();return;}
   const code=ti.value.trim();if(!code){status.textContent=tx('Introduce el código de acceso.','Enter the access code.','请输入访问码。');ti.focus();return;}
   setToken(code);go.disabled=true;status.textContent=tx('Publicando…','Publishing…','正在发布…');
   try{last=await publish({withVideo:vc.checked,code});draw(tx('Enlace publicado. Ábrelo para comprobarlo antes de enviarlo.','Link published. Open it to check it before sending it.','链接已发布。发送前请先打开检查。'));dialog.querySelector('#shareLinkCopy')?.focus();}
   catch(e){if(/código de acceso|access code/i.test(e.message))setToken('');draw(e.message);}
  };
 }
 window.FloorPlanShareLink={open,publish,get last(){return last;}};
})();
