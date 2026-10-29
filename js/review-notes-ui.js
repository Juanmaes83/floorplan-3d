/* «Observaciones del cliente» (FloorPlanReviewNotes): the client writes observations about the version they are
   viewing, anchored to the whole home or to a room (during the presentation, the room on screen), and downloads
   `observaciones-<versión>.json`. The professional imports that file into the same project and decides
   «Incorporar» or «Descartar» for each one. Nothing here edits the project; drafts and decisions stay in this
   browser (localStorage `rubik-review-v1`, per project). */
(function(){
 'use strict';
 const R=window.FloorPlanReviewNotes,app=window.FloorPlanApp,KEY='rubik-review-v1';
 if(!R||!app)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const button=(text,parent,fn,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';b.onclick=fn;return b;};
 const say=(m,d=4000)=>typeof toast==='function'?toast(m,d):void 0;
 const load=()=>{try{const v=JSON.parse(localStorage.getItem(KEY));return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}};
 const save=all=>{try{localStorage.setItem(KEY,JSON.stringify(all));}catch{say(tx('No se pudieron guardar las observaciones en este navegador.','Observations could not be saved in this browser.','无法在此浏览器中保存意见。'),6000);}};
 const revision=()=>FloorPlanGuide.revision(app.project);
 const local=v=>typeof nm==='function'?nm(v):v,roomName=r=>local(r.name);
 function slot(){const all=load(),id=app.project.id;all[id]=all[id]||{draft:null,received:[],answers:[]};all[id].answers=all[id].answers||[];return {all,s:all[id]};}
 const download=(obj,name)=>{const blob=new Blob([JSON.stringify(obj,null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);};
 const STATUS_TEXT=v=>({received:tx('Recibida, sin decidir','Received, not decided','已收到，未决定'),planned:tx('Se incorporará (aún no está en la vivienda)','Will be incorporated (not yet in the home)','将采纳（尚未体现在住宅中）'),discarded:tx('Descartada','Discarded','已放弃'),implemented:tx(`Implementada en la versión ${v}`,`Implemented in version ${v}`,`已在版本 ${v} 中实现`)});
 // B6: what an observation can point at (FloorPlanReviewAnchors) and how each anchor reads in a list.
 const NAMES=()=>({project:tx('Toda la vivienda','The whole home','整个住宅'),rooms:tx('Estancias','Rooms','房间'),elements:tx('Muebles, puertas y ventanas','Furniture, doors and windows','家具、门窗'),images:tx('Imágenes','Images','图片'),image:tx('Imagen','Image','图片'),point:tx('Punto del plano','Point on the plan','平面图上的点'),door:tx('Puerta','Door','门'),window:tx('Ventana','Window','窗'),room:roomName,object:o=>local(o.name||o.type)});
 const anchorViews=()=>[...(window.FloorPlanProjectViews?.current()||[]).map(v=>({id:v.id,label:v.label})),...(window.FloorPlanAIRender?.results||[]).map(r=>({id:['ai',r.viewId,r.style,r.floor,r.walls].filter(Boolean).join(':'),label:tx('Render IA · ','AI render · ','AI 渲染 · ')+r.label+(r.floor||r.walls?tx(' · alternativa',' · alternative',' · 替代'):'')}))];
 const anchorGroups=()=>window.FloorPlanReviewAnchors?FloorPlanReviewAnchors.groups(app.project,{names:NAMES(),views:anchorViews()}):[{key:'project',items:[{label:NAMES().project,anchor:{kind:'project'}}]},{key:'rooms',label:NAMES().rooms,items:app.project.rooms.map(r=>({label:roomName(r),anchor:{kind:'room',roomId:r.id,label:roomName(r)}}))}];
 const where=(a,missing=false)=>(a.kind==='project'?NAMES().project:a.label||NAMES().project)+(missing?tx(' (ya no existe)',' (no longer exists)','（已不存在）'):'');
 function draft(s){if(!s.draft||s.draft.versionCode!==R.versionCode(revision()))s.draft=R.create(app.project,revision(),{reviewer:s.draft?.reviewer||''});return s.draft;}

 // Points marked by the client, numbered as in the list, over the current plan (they keep their position in mm).
 function pointsMap(parent,notes){const P=window.FloorPlanProjectPreview;const pts=notes.map((n,i)=>({n,i})).filter(x=>x.n.anchor.kind==='point');if(!P||!pts.length)return;
  const fig=el('figure',undefined,parent,'review-points');const svg=P.plan(fig,{label:tx('Puntos señalados por el cliente','Points marked by the client','客户标记的点'),cls:'project-plan review-points-plan'});if(!svg)return fig.remove();
  const ns='http://www.w3.org/2000/svg',vb=svg.viewBox.baseVal,r=Math.max(vb.width,vb.height)/28;
  for(const {n,i} of pts){const g=document.createElementNS(ns,'g');g.setAttribute('class','review-point');const c=document.createElementNS(ns,'circle');c.setAttribute('cx',n.anchor.x);c.setAttribute('cy',n.anchor.y);c.setAttribute('r',r);const t=document.createElementNS(ns,'text');t.setAttribute('x',n.anchor.x);t.setAttribute('y',n.anchor.y);t.setAttribute('font-size',r*1.2);t.textContent=String(i+1);g.append(c,t);svg.append(g);}
  el('figcaption',tx('Números = observaciones sobre un punto del plano.','Numbers = observations on a point of the plan.','数字 = 平面图上某点的意见。'),fig);}
 const dialog=el('dialog',undefined,document.body,'review-dialog');dialog.id='reviewDialog';dialog.setAttribute('aria-labelledby','reviewTitle');
 let presetRoom=null;
 function render(){
  dialog.replaceChildren();const {all,s}=slot(),d=draft(s);
  const head=el('div',undefined,dialog,'review-head');const h=el('h2',tx('Observaciones del cliente','Client observations','客户意见'),head);h.id='reviewTitle';h.tabIndex=-1;
  button('×',head,()=>dialog.close(),'btn review-close').setAttribute('aria-label',tx('Cerrar','Close','关闭'));
  const id=el('p',undefined,dialog,'review-identity');id.id='reviewIdentity';
  id.textContent=tx(`«${local(app.project.name)}» · versión ${d.versionCode}. Las observaciones no cambian la vivienda.`,`“${local(app.project.name)}” · version ${d.versionCode}. Observations do not change the home.`,`“${local(app.project.name)}” · 版本 ${d.versionCode}。意见不会更改住宅。`);
  // Writing (client side).
  const write=el('section',undefined,dialog,'review-section');el('h3',tx('Escribir observaciones','Write observations','填写意见'),write);
  // A client who opened the professional's file works on a copy: say so, so edits are not mistaken for requests.
  el('p',tx('Si eres el cliente: esta es tu copia de la vivienda. Lo que cambies en ella no llega al profesional; para pedir un cambio, escríbelo aquí.','If you are the client: this is your copy of the home. What you change in it does not reach the professional; to ask for a change, write it here.','如果你是客户：这是你的住宅副本。你在其中的修改不会传给专业人士；如需修改，请在此写下。'),write,'review-note review-copy').id='reviewCopyNote';
  const nameLabel=el('label',tx('Tu nombre (opcional)','Your name (optional)','你的名字（可选）'),write);const name=el('input',undefined,nameLabel);name.id='reviewName';name.maxLength=80;name.value=d.reviewer;name.onchange=()=>{d.reviewer=name.value.trim().slice(0,80);save(all);};
  const anchorLabel=el('label',tx('Sobre','About','关于'),write);const anchor=el('select',undefined,anchorLabel);anchor.id='reviewAnchor';
  // Grouped: the whole home, rooms, elements (named with their room), images. Option values index this list.
  // Values stay readable and compatible: '' (whole home), the room id, or «element:<id>» / «view:<id>».
  const choices=new Map(),key=a=>a.kind==='project'?'':a.kind==='room'?a.roomId:`${a.kind}:${a.elementId||a.viewId}`;
  for(const g of anchorGroups()){const parent=g.key==='project'?anchor:el('optgroup',undefined,anchor);if(g.key!=='project')parent.label=g.label;for(const it of g.items){const o=el('option',it.label,parent);o.value=key(it.anchor);choices.set(o.value,it.anchor);}}
  anchor.value=presetRoom&&choices.has(presetRoom)?presetRoom:'';
  const textLabel=el('label',tx('Observación','Observation','意见'),write);const text=el('textarea',undefined,textLabel);text.id='reviewText';text.maxLength=R.MAX_TEXT;text.rows=3;
  const row=el('div',undefined,write,'review-actions');
  button(tx('Añadir observación','Add observation','添加意见'),row,()=>{try{const a=choices.get(anchor.value)||{kind:'project'};s.draft=R.add(d,{anchor:a,text:text.value});save(all);presetRoom=a.kind==='room'?a.roomId:null;render();dialog.querySelector('#reviewText').focus();}catch(e){say(e.message,5000);}}).id='reviewAdd';
  const list=el('ol',undefined,write,'review-list');list.id='reviewMine';
  for(const n of d.notes){const li=el('li',undefined,list);el('strong',where(n.anchor)+': ',li);el('span',n.text,li);
   button(tx('Quitar','Remove','删除'),li,()=>{s.draft=R.remove(d,n.id);save(all);render();},'btn review-small');}
  const dl=button(tx(`Descargar observaciones (${d.notes.length})`,`Download observations (${d.notes.length})`,`下载意见（${d.notes.length}）`),row,()=>{
   const blob=new Blob([JSON.stringify({...d,reviewer:name.value.trim().slice(0,80)},null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`observaciones-${d.versionCode}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
   say(tx('Envía este archivo al profesional. Tu vivienda no ha cambiado.','Send this file to the professional. Your home has not changed.','请将此文件发送给专业人士。你的住宅未更改。'),6000);});
  dl.id='reviewDownload';dl.disabled=!d.notes.length;
  // The professional's answer: what happened to each observation, and whether the open version contains the change.
  const ans=el('div',undefined,write,'review-answers');el('h4',tx('Respuesta del profesional','Answer from the professional','专业人士的回复'),ans);
  const afile=el('input',undefined,ans);afile.type='file';afile.accept='.json,application/json';afile.id='reviewAnswerFile';afile.hidden=true;
  button(tx('Abrir respuesta…','Open answer…','打开回复…'),ans,()=>afile.click()).id='reviewAnswerImport';
  afile.onchange=async()=>{const f=afile.files[0];afile.value='';if(!f)return;try{if(f.size>1024*1024)throw Error(tx('El archivo es demasiado grande.','The file is too large.','文件过大。'));
    const r=R.readResponse(await f.text());if(r.projectId!==app.project.id)throw Error(tx(`Esta respuesta es de otro proyecto («${r.projectName}»).`,`This answer belongs to another project (“${r.projectName}”).`,`此回复属于另一个项目（“${r.projectName}”）。`));
    s.answers=[r,...s.answers.filter(x=>x.answeredAt!==r.answeredAt)];save(all);render();}catch(e){say(e instanceof SyntaxError?tx('El archivo no es JSON válido.','The file is not valid JSON.','文件不是有效的 JSON。'):e.message,7000);}};
  const open_=R.versionCode(revision());
  for(const r of s.answers.slice(0,1)){const ul=el('ul',undefined,ans,'review-list');ul.id='reviewAnswerList';
   for(const it of r.items){const li=el('li',undefined,ul);li.dataset.answer=it.id;el('strong',where(it.anchor)+': ',li);el('span',it.text+' — ',li);
    const st=el('span',STATUS_TEXT(it.implementedIn)[it.status],li,'review-status');st.dataset.status=it.status;
    if(it.status==='implemented')el('span',it.implementedIn===open_?tx(' · Es la versión que tienes abierta: puedes verlo.',' · It is the version you have open: you can see it.','· 这是你当前打开的版本：可以查看。'):tx(` · Tienes abierta la versión ${open_}: pide al profesional el proyecto de la versión ${it.implementedIn}.`,` · You have version ${open_} open: ask the professional for the project of version ${it.implementedIn}.`,`· 你打开的是版本 ${open_}：请向专业人士索取版本 ${it.implementedIn} 的项目。`),li,it.implementedIn===open_?'review-ok':'review-warn');}}
  // Receiving (professional side).
  const recv=el('section',undefined,dialog,'review-section');el('h3',tx('Observaciones recibidas','Received observations','收到的意见'),recv);
  el('p',tx('Importa el archivo que te envió tu cliente. Tú decides qué incorporar; nada se aplica solo.','Import the file your client sent. You decide what to incorporate; nothing is applied by itself.','导入客户发送的文件。由你决定采纳哪些；不会自动应用。'),recv,'review-note');
  const file=el('input',undefined,recv);file.type='file';file.accept='.json,application/json';file.id='reviewImportFile';file.hidden=true;
  button(tx('Importar observaciones…','Import observations…','导入意见…'),recv,()=>file.click()).id='reviewImport';
  file.onchange=async()=>{const f=file.files[0];file.value='';if(!f)return;try{
    if(f.size>1024*1024)throw Error(tx('El archivo es demasiado grande.','The file is too large.','文件过大。'));
    const doc=R.read(await f.text()),m=R.match(doc,app.project,revision());
    if(!m.sameProject)throw Error(tx(`Estas observaciones son de otro proyecto («${doc.projectName}»). Ábrelo para revisarlas.`,`These observations belong to another project (“${doc.projectName}”). Open it to review them.`,`这些意见属于另一个项目（“${doc.projectName}”）。请打开该项目查看。`));
    s.received=s.received.filter(x=>!(x.doc.createdAt===doc.createdAt&&x.doc.reviewer===doc.reviewer&&x.doc.versionCode===doc.versionCode));
    s.received.push({doc,importedAt:new Date().toISOString(),decisions:Object.fromEntries(doc.notes.map(n=>[n.id,'pending']))});save(all);render();
    say(tx(`${doc.notes.length} observaciones importadas.`,`${doc.notes.length} observations imported.`,`已导入 ${doc.notes.length} 条意见。`));
   }catch(e){say(e instanceof SyntaxError?tx('El archivo no es JSON válido.','The file is not valid JSON.','文件不是有效的 JSON。'):e.message,7000);}};
  const current=R.versionCode(revision());
  s.received.forEach((entry,i)=>{const box=el('div',undefined,recv,'review-received');box.dataset.index=i;
   const who=entry.doc.reviewer||tx('Cliente','Client','客户');
   el('p',`${who} · ${tx('versión','version','版本')} ${entry.doc.versionCode} · ${entry.doc.notes.length} ${tx('observaciones','observations','条意见')}`,box,'review-from');
   const v=el('p',entry.doc.versionCode===current?tx('Se refieren a la versión abierta.','They refer to the open version.','针对当前版本。'):tx(`Se refieren a la versión ${entry.doc.versionCode}; la vivienda ha cambiado desde entonces (ahora ${current}).`,`They refer to version ${entry.doc.versionCode}; the home has changed since (now ${current}).`,`针对版本 ${entry.doc.versionCode}；住宅此后已更改（现为 ${current}）。`),box,entry.doc.versionCode===current?'review-ok':'review-warn');v.setAttribute('role','status');
   const gone=new Set(R.match(entry.doc,app.project,revision()).missing||[]);pointsMap(box,entry.doc.notes);
   const ul=el('ul',undefined,box,'review-list');
   for(const [k,n] of entry.doc.notes.entries()){const li=el('li',undefined,ul);li.dataset.note=n.id;
    el('strong',(n.anchor.kind==='point'?`${k+1}. `:'')+where(n.anchor,gone.has(n.id))+': ',li);el('span',n.text,li);const acts=el('span',undefined,li,'review-decide');
    entry.implemented=entry.implemented||{};const done=entry.implemented[n.id];
    const st=el('span',STATUS_TEXT(done)[done?'implemented':{pending:'received',incorporate:'planned',discard:'discarded'}[entry.decisions[n.id]]],li,'review-status');st.dataset.status=done?'implemented':entry.decisions[n.id];
    for(const [k,label] of [['incorporate',tx('Se incorporará','Will incorporate','将采纳')],['discard',tx('Descartar','Discard','放弃')]]){const b=button(label,acts,()=>{entry.decisions[n.id]=entry.decisions[n.id]===k?'pending':k;if(entry.decisions[n.id]!=='incorporate')delete entry.implemented[n.id];save(all);render();},'btn review-small');b.dataset.decision=k;b.setAttribute('aria-pressed',String(entry.decisions[n.id]===k));}
    // «Hecho en esta versión»: the professional declares it after making the change; the open version is recorded.
    const impl=button(tx('Hecho en esta versión','Done in this version','已在此版本完成'),acts,()=>{if(entry.implemented[n.id])delete entry.implemented[n.id];else entry.implemented[n.id]=current;save(all);render();},'btn review-small');impl.dataset.decision='implemented';impl.setAttribute('aria-pressed',String(!!done));impl.disabled=entry.decisions[n.id]!=='incorporate';
    impl.title=tx('Márcalo cuando hayas hecho el cambio en la vivienda. Pulsar «Se incorporará» no cambia nada.','Mark it once you have made the change in the home. «Will incorporate» changes nothing.','在住宅中完成修改后再标记。“将采纳”不会更改任何内容。');}
   const counts=Object.values(entry.decisions).reduce((c,k)=>(c[k]=(c[k]||0)+1,c),{});
   const doneCount=Object.keys(entry.implemented||{}).length;
   el('p',tx(`Implementadas: ${doneCount} · se incorporarán: ${(counts.incorporate||0)-doneCount} · descartadas: ${counts.discard||0} · sin decidir: ${counts.pending||0}`,`Implemented: ${doneCount} · to incorporate: ${(counts.incorporate||0)-doneCount} · discarded: ${counts.discard||0} · undecided: ${counts.pending||0}`,`已实现：${doneCount} · 将采纳：${(counts.incorporate||0)-doneCount} · 已放弃：${counts.discard||0} · 未决定：${counts.pending||0}`),box,'review-counts');
   button(tx('Descargar respuesta al cliente','Download answer for the client','下载给客户的回复'),box,()=>{try{const r=R.respond(entry.doc,entry.decisions,entry.implemented,app.project,revision());download(r,`respuesta-observaciones-${r.versionCode}.json`);say(tx('Envía al cliente esta respuesta y, si hay cambios hechos, el proyecto de esta versión.','Send the client this answer and, if changes were made, the project of this version.','请将此回复发送给客户；如有已完成的修改，请同时发送此版本的项目。'),7000);}catch(e){say(e.message,6000);}},'btn review-answer').dataset.index=i;
   button(tx('Quitar este archivo','Remove this file','移除此文件'),box,()=>{s.received.splice(i,1);save(all);render();},'btn review-small');
  });
  // A client with an answer sees it first, under the copy notice.
  if(s.answers.length)write.querySelector('#reviewCopyNote').after(ans);
  // The professional who has received observations sees them first; writing stays below.
  if(s.received.length)write.before(recv);
  save(all);
 }
 function open(roomId=null){presetRoom=roomId;render();if(!dialog.open)dialog.showModal();dialog.querySelector('#reviewTitle').focus();}
 // Entries: the file menu (next to «Abrir lámina») and the presentation, anchored to the room on screen.
 const menuEntry=document.createElement('button');menuEntry.type='button';menuEntry.className='btn';menuEntry.id='reviewNotesBtn';
 (document.querySelector('#openSheet')||document.querySelector('#exportPng'))?.after(menuEntry);
 menuEntry.onclick=()=>{menuEntry.closest('details')?.removeAttribute('open');open();};
 // A presentation tool: it joins the tools group of the card (one row on a phone), after the client's navigation.
 const controls=document.querySelector('#presentationTools')||document.querySelector('.presentation-controls');let presEntry=null;
 if(controls){presEntry=document.createElement('button');presEntry.type='button';presEntry.className='btn';presEntry.id='presentationNote';controls.append(presEntry);
  presEntry.onclick=()=>{const stop=window.FloorPlanPresentation?.current;open(stop?.kind==='room'?stop.roomId:null);};}
 function relang(){menuEntry.textContent=tx('Observaciones del cliente…','Client observations…','客户意见…');if(presEntry)presEntry.textContent=tx('Añadir observación','Add observation','添加意见');}
 relang();document.querySelector('#langBtn')?.addEventListener('click',()=>queueMicrotask(()=>{relang();if(dialog.open)render();}));
 window.FloorPlanReviewUI={open,get open_(){return dialog.open;}};
})();
