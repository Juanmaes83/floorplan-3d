/* Delivery 3D Client Experience V1 — the professional's side, inside «Entregar».
   - status(): what the 3D delivery would carry right now (free exploration, the prepared presentation with its rooms and
     levels, the real overview image), and whether the last publication still matches the project;
   - snapshot(): the authorised, versioned, read-only delivery (FloorPlanDelivery.buildSnapshot) of the current project
     or building, with the presentation decision the professional saved («Presentar mi vivienda»: rooms and order per
     level). No decision saved → no prepared presentation in the delivery: Rubik never invents a selection;
   - preview(): opens the client view in a new tab with this snapshot (postMessage, same origin; nothing is uploaded);
   - publications: what was published from this browser (link and the files behind it) so it can be withdrawn —
     /api/unshare deletes the files from the owner's store, the link then answers «no longer available»;
   - card(): the «Visita 3D para tu cliente» card of the «La vivienda, para tu cliente» group.
   Publishing itself stays in the existing «Enlace para el cliente» dialog (share-link-ui.js), which now adds the visit. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,Delivery=window.FloorPlanDelivery;
 if(!app||!Delivery||window.RUBIK_DELIVERY)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const PUB_KEY='rubik-delivery-publications',TOKEN_KEY='rubik-render-token';
 const localName=s=>typeof nm==='function'?nm(s||''):(s||'');
 const building=()=>app.levelContext?.levels>1?window.FloorPlanBuildingUI?.building||null:null;
 function projects(){const b=building();return b?b.levels.map(l=>({levelId:l.id,project:l.project})):[{levelId:null,project:app.project}];}
 // A short, stable code per level version (the same code the client file and the observations already use).
 function revision(){return projects().map(x=>window.FloorPlanReviewNotes?FloorPlanReviewNotes.versionCode(FloorPlanGuide.revision(x.project)):String(x.project.updatedAt)).join('+');}
 // The presentation decision Rubik already stores per project («Presentar mi vivienda»), nothing else.
 function decision(){
  const Core=window.FloorPlanPresentationCore;if(!Core)return [];
  const out=[];for(const {levelId,project} of projects()){let saved=null;try{saved=JSON.parse(localStorage.getItem(Core.key(app.entryId,project.id))||'null');}catch{}
   const known=new Set(project.rooms.map(r=>r.id)),ids=(saved?.roomIds||[]).filter(id=>known.has(id));if(ids.length)out.push({projectId:project.id,levelId,roomIds:ids});}
  return out;
 }
 function overview(){return (window.FloorPlanProjectViews?.current()||[]).find(v=>v.kind==='overview')||null;}
 async function jpeg(src,maxW=1280,q=.82){const img=new Image();img.src=src;await img.decode();const s=Math.min(1,maxW/img.naturalWidth),c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*s);c.height=Math.round(img.naturalHeight*s);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',q);}
 function status(){
  const list=projects(),dec=decision(),rooms=dec.reduce((n,s)=>n+s.roomIds.length,0);
  const walk=list.some(x=>x.project.walls.some(w=>w.status!=='demolished')&&x.project.rooms.length>0);
  const pub=publications().find(p=>p.projectId===(building()?.id||app.project.id))||null;
  return {walk,guided:rooms>0,rooms,levels:list.length,decisionLevels:dec.length,hero:!!overview(),publication:pub,changed:!!pub&&pub.revision!==revision(),revision:revision()};
 }
 async function snapshot(){
  const b=building(),brand=window.FloorPlanBrandUI?.snapshot()?.profile||null,view=overview();
  let hero=null;if(view){try{hero=await jpeg(view.dataUrl);if(hero.length>Delivery.MAX_HERO)hero=await jpeg(view.dataUrl,960,.74);}catch{hero=null;}}
  const rev=revision(),lang=typeof LANG==='string'?LANG:'es';
  const snap=Delivery.buildSnapshot({...(b?{building:b}:{project:app.project}),presentation:{sidecars:decision()},revision:rev,
   versionCode:rev.split('+')[0],studio:{name:brand?.name||'',logo:brand?.logo||null},hero,title:localName(b?.name||app.project.name),lang});
  return Delivery.validate(snap,{bytes:new Blob([JSON.stringify(snap)]).size});
 }
 // ── Preview: the client view, in a new tab, fed by this tab (nothing uploaded) ───────────────────────────────────
 let previewSnap=null;
 addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='rubik-delivery-ready'||!previewSnap||e.source!==previewSnap.win)return;e.source.postMessage({type:'rubik-delivery-snapshot',snapshot:previewSnap.snap},location.origin);});
 async function preview(){
  const win=window.open('./?entrega=vista-previa','_blank');if(!win)throw Error(tx('El navegador bloqueó la vista previa. Permite ventanas emergentes para Rubik.','The browser blocked the preview. Allow pop-ups for Rubik.','浏览器阻止了预览，请允许弹出窗口。'));
  previewSnap={win,snap:await snapshot()};return win;
 }
 // ── Publications made from this browser (to withdraw them) ───────────────────────────────────────────────────────
 function publications(){try{const v=JSON.parse(localStorage.getItem(PUB_KEY)||'[]');return Array.isArray(v)?v:[];}catch{return [];}}
 function record(p){const list=[p,...publications().filter(x=>x.link!==p.link)].slice(0,12);try{localStorage.setItem(PUB_KEY,JSON.stringify(list));}catch{}listeners.forEach(fn=>fn());}
 async function withdraw(p,code){
  const urls=[p.page,p.delivery,p.video].filter(Boolean);
  let r;try{r=await fetch('api/unshare',{method:'POST',headers:{'Content-Type':'application/json','x-rubik-render-token':code},body:JSON.stringify({urls})});}catch{throw Error(tx('No se pudo contactar con el servidor. Vuelve a intentarlo.','The server could not be reached. Try again.','无法连接服务器，请重试。'));}
  if(r.status===401)throw Error(tx('El código de acceso no es correcto.','The access code is not correct.','访问码不正确。'));
  if(!r.ok)throw Error(tx('No se pudo retirar la entrega. Vuelve a intentarlo.','The delivery could not be withdrawn. Try again.','无法撤回交付，请重试。'));
  try{localStorage.setItem(PUB_KEY,JSON.stringify(publications().filter(x=>x.link!==p.link)));}catch{}listeners.forEach(fn=>fn());return true;
 }
 const listeners=new Set();
 // ── Card in «Entregar» ───────────────────────────────────────────────────────────────────────────────────────────
 function card(container){
  if(!container)return null;container.querySelector('[data-module="client-3d"]')?.remove();
  const s=status(),c=el('article',undefined,undefined,'professional-card delivery3d-card');c.dataset.module='client-3d';c.id='delivery3dCard';container.prepend(c);
  const view=overview(),f=el('figure',undefined,c);
  if(view){const img=el('img',undefined,f);img.src=view.dataUrl;img.alt=tx('Vista general real de la vivienda en 3D','Real 3D overview of the home','住宅真实三维总览');el('figcaption',tx('Esta vista real abre la visita de tu cliente.','This real view opens your client\'s visit.','此真实视图将作为客户参观的封面。'),f);}
  else{f.classList.add('is-scheme');if(!window.FloorPlanProjectPreview?.axonometric(f))el('span',tx('Sin vista preparada','No prepared view','无准备好的视图'),f);el('figcaption',tx('Prepara las vistas en «Imágenes» para usar una vista real como portada.','Prepare the views in «Images» to use a real view as the cover.','在“图像”中准备视图，以真实视图作为封面。'),f);}
  const body=el('div',undefined,c,'delivery3d-body');
  const tone=!s.walk?'warn':s.publication?(s.changed?'warn':'live'):'ready';
  const chip=el('span',!s.walk?tx('Falta completar la geometría','Geometry to complete','几何待完善'):s.publication?(s.changed?tx('La vivienda cambió desde la última entrega','The home changed since the last delivery','自上次交付后住宅已更改'):tx('Enlace publicado','Link published','链接已发布')):tx('Visita 3D disponible','3D visit available','三维参观可用'),body,'delivery3d-chip');chip.dataset.tone=tone;chip.id='delivery3dState';
  el('h3',tx('Tu proyecto, listo para recorrer','Your project, ready to explore','您的项目，可供漫游'),body);
  el('p',tx('Comparte una visita 3D interactiva: tu cliente explora la vivienda a su ritmo, desde el móvil o el ordenador, y sigue la presentación que has preparado.','Share an interactive 3D visit: your client explores the home at their own pace, on a phone or a computer, and follows the presentation you prepared.','分享交互式三维参观：客户可在手机或电脑上按自己的节奏探索住宅，并观看您准备的展示。'),body,'delivery3d-lead');
  const list=el('ul',undefined,body,'delivery3d-list');list.id='delivery3dIncluded';
  const li=(text,on)=>{const x=el('li',text,list);if(!on)x.classList.add('is-off');};
  li(s.walk?tx('Exploración libre por las estancias (puertas y colisiones reales)','Free exploration of the rooms (real doors and collisions)','自由探索各房间（真实门与碰撞）'):tx('Exploración libre: dibuja estancias con muros en Distribuir','Free exploration: draw rooms with walls in Layout','自由探索：请先绘制带墙房间'),s.walk);
  li(s.guided?tx(`Presentación preparada: ${s.rooms} ${s.rooms===1?'estancia':'estancias'}${s.levels>1?` · ${s.decisionLevels} de ${s.levels} plantas`:''}`,`Prepared presentation: ${s.rooms} room${s.rooms===1?'':'s'}`,`预设展示：${s.rooms} 个房间`):tx('Presentación: elige y ordena las estancias en «Presentar mi vivienda»','Presentation: choose and order the rooms in «Present my home»','展示：请在“展示我的住宅”中选择房间'),s.guided);
  li(s.hero?tx('Portada con la vista real del modelo','Cover with the real model view','以模型真实视图为封面'):tx('Portada: sin vista real preparada (se muestra el nombre)','Cover: no real view prepared (the name is shown)','封面：无真实视图（显示名称）'),s.hero);
  const actions=el('div',undefined,body,'delivery3d-actions');const msg=el('p','',body,'delivery3d-meta');msg.id='delivery3dMessage';msg.setAttribute('role','status');
  const rev=btn(tx('Revisar como cliente','Review as your client','以客户身份预览'),actions,'btn primary');rev.id='delivery3dPreview';rev.disabled=!s.walk;
  rev.onclick=async()=>{msg.textContent=tx('Abriendo la vista previa…','Opening the preview…','正在打开预览…');try{await preview();msg.textContent=tx('Vista previa abierta en otra pestaña. No se ha publicado nada.','Preview opened in another tab. Nothing has been published.','预览已在新标签页打开，尚未发布任何内容。');}catch(e){msg.textContent=e.message;}};
  const pub=btn(s.publication?tx('Gestionar el enlace','Manage the link','管理链接'):tx('Publicar para tu cliente','Publish for your client','为客户发布'),actions);pub.id='delivery3dPublish';pub.disabled=!s.walk||!window.FloorPlanShareLink;pub.onclick=()=>window.FloorPlanShareLink?.open({include3d:true});
  if(s.publication){const p=s.publication;const meta=el('p',tx(`Publicado el ${new Date(p.at).toLocaleString(({es:'es-ES',en:'en-GB',zh:'zh-CN'})[LANG]||'es-ES',{dateStyle:'medium',timeStyle:'short'})} · versión ${p.versionCode}. Cualquiera con el enlace puede verlo; lo retiras desde «Gestionar el enlace».`,`Published ${new Date(p.at).toLocaleString('en-GB')} · version ${p.versionCode}. Anyone with the link can see it; withdraw it from «Manage the link».`,`已发布 · 版本 ${p.versionCode}`),body,'delivery3d-meta');meta.id='delivery3dPublished';
   if(s.changed)el('p',tx('Publica de nuevo para que tu cliente vea los cambios: el enlace anterior sigue mostrando la versión entregada.','Publish again so your client sees the changes: the previous link keeps showing the delivered version.','重新发布以让客户看到更改：旧链接仍显示已交付版本。'),body,'delivery3d-meta');}
  else el('p',tx('Necesita conexión a internet. El archivo descargable para el cliente sigue funcionando sin conexión, sin visita 3D.','Needs an internet connection. The downloadable client file still works offline, without the 3D visit.','需要联网。可下载的客户文件仍可离线使用，但不含三维参观。'),body,'delivery3d-meta');
  return c;
 }
 window.FloorPlanDeliveryUI={status,snapshot,preview,card,publications,record,withdraw,revision,onChange(fn){listeners.add(fn);},TOKEN_KEY};
})();
