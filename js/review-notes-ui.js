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
 function slot(){const all=load(),id=app.project.id;all[id]=all[id]||{draft:null,received:[]};return {all,s:all[id]};}
 function draft(s){if(!s.draft||s.draft.versionCode!==R.versionCode(revision()))s.draft=R.create(app.project,revision(),{reviewer:s.draft?.reviewer||''});return s.draft;}

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
  const nameLabel=el('label',tx('Tu nombre (opcional)','Your name (optional)','你的名字（可选）'),write);const name=el('input',undefined,nameLabel);name.id='reviewName';name.maxLength=80;name.value=d.reviewer;name.onchange=()=>{d.reviewer=name.value.trim().slice(0,80);save(all);};
  const anchorLabel=el('label',tx('Sobre','About','关于'),write);const anchor=el('select',undefined,anchorLabel);anchor.id='reviewAnchor';
  el('option',tx('Toda la vivienda','The whole home','整个住宅'),anchor).value='';
  for(const r of app.project.rooms){const o=el('option',roomName(r),anchor);o.value=r.id;}
  anchor.value=presetRoom&&app.project.rooms.some(r=>r.id===presetRoom)?presetRoom:'';
  const textLabel=el('label',tx('Observación','Observation','意见'),write);const text=el('textarea',undefined,textLabel);text.id='reviewText';text.maxLength=R.MAX_TEXT;text.rows=3;
  const row=el('div',undefined,write,'review-actions');
  button(tx('Añadir observación','Add observation','添加意见'),row,()=>{try{const r=app.project.rooms.find(x=>x.id===anchor.value);s.draft=R.add(d,{anchor:r?{kind:'room',roomId:r.id,label:roomName(r)}:{kind:'project'},text:text.value});save(all);presetRoom=anchor.value||null;render();dialog.querySelector('#reviewText').focus();}catch(e){say(e.message,5000);}}).id='reviewAdd';
  const list=el('ol',undefined,write,'review-list');list.id='reviewMine';
  for(const n of d.notes){const li=el('li',undefined,list);el('strong',(n.anchor.kind==='room'?n.anchor.label:tx('Toda la vivienda','The whole home','整个住宅'))+': ',li);el('span',n.text,li);
   button(tx('Quitar','Remove','删除'),li,()=>{s.draft=R.remove(d,n.id);save(all);render();},'btn review-small');}
  const dl=button(tx(`Descargar observaciones (${d.notes.length})`,`Download observations (${d.notes.length})`,`下载意见（${d.notes.length}）`),row,()=>{
   const blob=new Blob([JSON.stringify({...d,reviewer:name.value.trim().slice(0,80)},null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`observaciones-${d.versionCode}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
   say(tx('Envía este archivo al profesional. Tu vivienda no ha cambiado.','Send this file to the professional. Your home has not changed.','请将此文件发送给专业人士。你的住宅未更改。'),6000);});
  dl.id='reviewDownload';dl.disabled=!d.notes.length;
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
  const current=R.versionCode(revision()),rooms=new Set(app.project.rooms.map(r=>r.id));
  s.received.forEach((entry,i)=>{const box=el('div',undefined,recv,'review-received');box.dataset.index=i;
   const who=entry.doc.reviewer||tx('Cliente','Client','客户');
   el('p',`${who} · ${tx('versión','version','版本')} ${entry.doc.versionCode} · ${entry.doc.notes.length} ${tx('observaciones','observations','条意见')}`,box,'review-from');
   const v=el('p',entry.doc.versionCode===current?tx('Se refieren a la versión abierta.','They refer to the open version.','针对当前版本。'):tx(`Se refieren a la versión ${entry.doc.versionCode}; la vivienda ha cambiado desde entonces (ahora ${current}).`,`They refer to version ${entry.doc.versionCode}; the home has changed since (now ${current}).`,`针对版本 ${entry.doc.versionCode}；住宅此后已更改（现为 ${current}）。`),box,entry.doc.versionCode===current?'review-ok':'review-warn');v.setAttribute('role','status');
   const ul=el('ul',undefined,box,'review-list');
   for(const n of entry.doc.notes){const li=el('li',undefined,ul);li.dataset.note=n.id;const where=n.anchor.kind==='room'?n.anchor.label+(rooms.has(n.anchor.roomId)?'':tx(' (ya no existe)',' (no longer exists)','（已不存在）')):tx('Toda la vivienda','The whole home','整个住宅');
    el('strong',where+': ',li);el('span',n.text,li);const acts=el('span',undefined,li,'review-decide');
    for(const [k,label] of [['incorporate',tx('Incorporar','Incorporate','采纳')],['discard',tx('Descartar','Discard','放弃')]]){const b=button(label,acts,()=>{entry.decisions[n.id]=entry.decisions[n.id]===k?'pending':k;save(all);render();},'btn review-small');b.dataset.decision=k;b.setAttribute('aria-pressed',String(entry.decisions[n.id]===k));}}
   const counts=Object.values(entry.decisions).reduce((c,k)=>(c[k]=(c[k]||0)+1,c),{});
   el('p',tx(`Por incorporar: ${counts.incorporate||0} · descartadas: ${counts.discard||0} · pendientes: ${counts.pending||0}`,`To incorporate: ${counts.incorporate||0} · discarded: ${counts.discard||0} · pending: ${counts.pending||0}`,`待采纳：${counts.incorporate||0} · 已放弃：${counts.discard||0} · 待定：${counts.pending||0}`),box,'review-counts');
   button(tx('Quitar este archivo','Remove this file','移除此文件'),box,()=>{s.received.splice(i,1);save(all);render();},'btn review-small');
  });
  // The professional who has received observations sees them first; writing stays below.
  if(s.received.length)write.before(recv);
  save(all);
 }
 function open(roomId=null){presetRoom=roomId;render();if(!dialog.open)dialog.showModal();dialog.querySelector('#reviewTitle').focus();}
 // Entries: the file menu (next to «Abrir lámina») and the presentation, anchored to the room on screen.
 const menuEntry=document.createElement('button');menuEntry.type='button';menuEntry.className='btn';menuEntry.id='reviewNotesBtn';
 (document.querySelector('#openSheet')||document.querySelector('#exportPng'))?.after(menuEntry);
 menuEntry.onclick=()=>{menuEntry.closest('details')?.removeAttribute('open');open();};
 const controls=document.querySelector('.presentation-controls');let presEntry=null;
 if(controls){presEntry=document.createElement('button');presEntry.type='button';presEntry.className='btn';presEntry.id='presentationNote';controls.append(presEntry);
  presEntry.onclick=()=>{const stop=window.FloorPlanPresentation?.current;open(stop?.kind==='room'?stop.roomId:null);};}
 function relang(){menuEntry.textContent=tx('Observaciones del cliente…','Client observations…','客户意见…');if(presEntry)presEntry.textContent=tx('Añadir observación','Add observation','添加意见');}
 relang();document.querySelector('#langBtn')?.addEventListener('click',()=>queueMicrotask(()=>{relang();if(dialog.open)render();}));
 window.FloorPlanReviewUI={open,get open_(){return dialog.open;}};
})();
