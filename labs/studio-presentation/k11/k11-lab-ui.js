/* K11 · DEMOSTRACIÓN DE LABORATORIO en una copia aislada del producto (no es una propuesta de interfaz productiva).
 * Recorrido: vista real (FloorPlanProjectViews, con takeId) → resultado (proveedor SIMULADO, rotulado; ninguna IA real) →
 * ficha trazable → conservación → recuperación (tras recargar) → comparación de variantes y favorito.
 * Autoridades reutilizadas: FloorPlanProjectViews (toma), RubikStudioE3 (lectura confirmada, contentId con bytes efectivos,
 * revisión), FloorPlanImages vía el adaptador E3 (lectura sin creación), la transformación de envío de ai-render-ui (jpeg 0,9).
 * Conservación: ADAPTADOR AISLADO sobre una base propia «rubik-lab-k11-v1» que imita el contrato K11-C (metadatos en la
 * extensión del proyecto + bytes por contenido). No escribe en la biblioteca, en F0, en FloorPlanImages ni en localStorage.
 * Textos nuevos en ES/EN/ZH. Se abre con RubikK11Lab.abrir(); en producto, la conexión prevista es desde «Imágenes». */
(function(){
 'use strict';
 const K=window.RubikK11,E3=window.RubikStudioE3,V=window.FloorPlanProjectViews;if(!K||!E3||!V)return;
 const lang=()=>(typeof LANG==='string'&&K.LANGS.includes(LANG)?LANG:'es');
 const tx=(es,en,zh)=>({es,en,zh})[lang()];
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,id)=>{const b=el('button',text,parent,'btn');b.type='button';if(id)b.id=id;return b;};
 const hex=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const css=document.createElement('style');css.textContent=`
 .k11{box-sizing:border-box;width:min(1100px,calc(100vw - 32px));max-height:calc(100dvh - 32px);border:1px solid var(--line,#e3dccf);border-radius:14px;padding:0;background:var(--panel,#fffdf9);color:var(--ink,#2b2824)}
 .k11::backdrop{background:rgba(30,26,22,.42)}.k11-shell{display:flex;flex-direction:column;max-height:calc(100dvh - 34px)}
 .k11-head{flex:0 0 auto;display:flex;flex-wrap:wrap;gap:8px 12px;justify-content:space-between;align-items:flex-start;padding:14px 18px;border-bottom:1px solid var(--line,#e3dccf)}
 .k11-head>div{flex:1 1 240px;min-width:0}.k11-head h2{margin:0;font-size:19px}.k11-head p{margin:4px 0 0;font-size:13px;color:#5c5449;max-width:min(70ch,100%)}
 .k11-body{overflow:auto;padding:14px 18px 96px;display:grid;gap:14px}
 .k11-lab{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.06em;color:#7a3d00;border:1px solid #7a3d00;border-radius:999px;padding:1px 8px;margin-left:6px;vertical-align:middle}
 .k11-row{display:flex;flex-wrap:wrap;gap:8px;align-items:end}.k11-row label{display:flex;flex-direction:column;font-size:12px;color:#5c5449;gap:2px}
 .k11 select,.k11 .btn{min-height:44px;min-width:44px;font:inherit}.k11 select{border:1px solid #8f8576;border-radius:8px;padding:4px 8px;background:#fff;color:var(--ink,#2b2824)}
 .k11-imgs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.k11-imgs figure{margin:0;border:1px solid var(--line,#e3dccf);border-radius:10px;padding:8px;background:#fff}
 .k11-imgs img{width:100%;height:auto;display:block;border-radius:6px;background:#eee}.k11-imgs figcaption{font-size:12px;margin-top:6px;line-height:1.35;overflow-wrap:anywhere}
 .k11-ficha dl{display:grid;grid-template-columns:max-content 1fr;gap:3px 12px;margin:0;font-size:13px}.k11-ficha dt{color:#5c5449}.k11-ficha dd{margin:0;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
 .k11-estado{font-weight:700}.k11-ok{color:#1f6a3a}.k11-warn{color:#8a5300}.k11-no{color:#9b2c1f}
 .k11-notice{border-left:4px solid #8a5300;background:#fbf4e8;padding:10px 12px;border-radius:6px;font-size:13px}.k11-notice dl{display:grid;grid-template-columns:max-content 1fr;gap:2px 10px;margin:4px 0 0}.k11-notice dt{font-weight:600}.k11-notice dd{margin:0}
 .k11-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}.k11-list li{display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:center;border:1px solid var(--line,#e3dccf);border-radius:10px;padding:8px;background:#fff}
 .k11-list img{width:64px;height:auto;border-radius:4px}.k11-list small{display:block;color:#5c5449}
 .k11 :focus-visible{outline:3px solid #1f4fb5;outline-offset:2px}
 @media(max-width:760px){.k11{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border-radius:0;margin:0}.k11-shell{height:100dvh;max-height:100dvh}.k11-imgs{grid-template-columns:1fr}.k11-list li{grid-template-columns:48px 1fr}.k11-list li>.btn{grid-column:1/-1}}
 @media(prefers-reduced-motion:reduce){.k11,.k11 *{transition:none!important;animation:none!important}}`;document.head.append(css);

 // ---------------------------------------------------------------- adaptador AISLADO (base propia del laboratorio)
 const DBN='rubik-lab-k11-v1';let dbp=null;
 const db=()=>dbp||(dbp=new Promise((res,rej)=>{const r=indexedDB.open(DBN,1);r.onupgradeneeded=()=>{r.result.createObjectStore('bytes');r.result.createObjectStore('proyectos');};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}));
 const tx_=async(store,mode,fn)=>{const d=await db();return new Promise((res,rej)=>{const t=d.transaction(store,mode),s=t.objectStore(store);let out;try{out=fn(s);}catch(e){t.abort();rej(e);return;}t.oncomplete=()=>res(out?.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error('abort'));});};
 const bytes={get:async ref=>{const v=await tx_('bytes','readonly',s=>s.get(ref));return v?new Uint8Array(v):null;},put:(ref,b)=>tx_('bytes','readwrite',s=>{s.put(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),ref);}),remove:ref=>tx_('bytes','readwrite',s=>{s.delete(ref);})};
 // «Proyecto» del laboratorio: copia de la extensión K11 por id de proyecto. Imita el commit del editor sin tocar el proyecto real.
 let extCache={};
 const proyectoLab=pid=>({leer:()=>({id:pid,extensions:{[K.EXT]:extCache[pid]||{version:K.EXT_VERSION,results:{},favoritos:{}}}}),
  commit:async next=>{const e=next.extensions[K.EXT];await tx_('proyectos','readwrite',s=>{s.put(e,pid);});extCache[pid]=e;}});
 async function cargarExt(pid){extCache[pid]=await tx_('proyectos','readonly',s=>s.get(pid))||undefined;}

 // ---------------------------------------------------------------- contexto real (E3) y envío (ai-render-ui)
 async function sujetoConfirmado(){
  const l=await E3.leerConfirmado(window.FloorPlanPersistence);if(l.estado!=='confirmado')return {motivo:l.motivo};
  const A=E3.analizar(l,{Core:window.FloorPlanCore,Budget:window.FloorPlanBudget});if(!A.ok)return {motivo:A.motivo};
  if(E3.cambiosSinGuardar(A,window.FloorPlanApp.project))return {motivo:'cambios-sin-guardar'};
  const img=await E3.comprobarImagenes(A.project,{leer:E3.adaptadorImagenes({Images:window.FloorPlanImages}),digest:hex});
  const I=await E3.identidad(A,{X:window.FloorPlanExpediente,digest:hex,imagenes:img});
  return {sujeto:{projectId:A.project.id,entryId:A.entryId,levelId:window.FloorPlanApp.levelContext?.activeLevelId||null,contentId:I.trabajo.contentId,revision:I.revisionLocal.revision}};}
 // Transformación de envío de js/ai-render-ui.js (función privada jpeg(): canvas, fondo blanco, JPEG 0,9). Se replica aquí
 // porque no se exporta; contrato para Codex: exportarla para que el envío conservado sea exactamente el del producto.
 async function jpeg(src){const img=new Image();img.src=src;await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0);return c.toDataURL('image/jpeg',.9);}
 // Proveedor SIMULADO: tono por estilo + rótulo visible «SIMULADO». Ninguna red, ningún coste, ninguna IA.
 const TONO={natural:'sepia(.25) saturate(1.1)',warm:'sepia(.55) saturate(1.3) hue-rotate(-10deg)',scandinavian:'brightness(1.08) saturate(.75) contrast(.95)',premium:'contrast(1.12) saturate(1.2) brightness(.97)'};
 async function simulado({image,style}){const img=new Image();img.src=image;await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');
  x.filter=TONO[style]||'none';x.drawImage(img,0,0);x.filter='none';const h=Math.max(18,Math.round(c.height*.07));x.fillStyle='rgba(122,61,0,.86)';x.fillRect(0,c.height-h,c.width,h);
  x.fillStyle='#fff';x.font=`700 ${Math.round(h*.55)}px system-ui,sans-serif`;x.textBaseline='middle';x.fillText('SIMULADO · LABORATORIO · '+String(style).toUpperCase(),Math.round(h*.4),c.height-h/2);
  return {image:c.toDataURL('image/png'),model:null,usage:null,cost:null,generatedAt:null};}

 // ---------------------------------------------------------------- estado y render
 const STYLES=[['natural',tx('Luz natural','Natural light','自然光')],['warm',tx('Cálido','Warm','温暖')],['scandinavian',tx('Escandinavo','Scandinavian','北欧')],['premium',tx('Premium','Premium','高端')]];
 const st={vista:0,estilo:'natural',actual:null,ficha:null,datos:null,aviso:null,lista:[],ocupado:false,cmp:null,lecturas:0};
 const gen=K.generador(),cache=new Map(),datosPorId=new Map();let dlg,refs;window.__k11=st;// diagnóstico de laboratorio
 const short=h=>h?h.slice(0,12)+'…':'—';
 const clsE=e=>e==='integro'||e==='vigente'||e==='vigente-restaurado'?'k11-ok':e==='invalido'||e==='otro-proyecto'?'k11-no':'k11-warn';
 function aviso(parent,code){const t=K.T[code]?K.texto(code,lang()):E3.T?.[code]?E3.texto(code,lang()):null;const box=el('div',undefined,parent,'k11-notice');box.setAttribute('role','status');box.dataset.code=code;
  if(!t){el('b',code,box);return;}el('b',t.causa,box);const dl=el('dl',undefined,box);for(const [k,v] of [[tx('Siguiente paso','Next step','下一步'),t.siguiente],[tx('Alternativa segura','Safe alternative','安全替代'),t.alternativa],[tx('Tus datos','Your data','您的数据'),t.datos]])if(v&&v!=='—'){el('dt',k,dl);el('dd',v,dl);}}
 const url=(b,t)=>K.bytesADataUrl(t,b);
 function render(){const b=refs.body;b.replaceChildren();
  const items=V.status?.()==='ready'?V.current():[];
  const row=el('div',undefined,b,'k11-row');
  const lv=el('label',tx('Vista real (toma actual)','Real view (current take)','真实视图（当前拍摄）'),row);const sv=el('select',undefined,lv);sv.id='k11Vista';items.forEach((v,i)=>{el('option',v.label,sv).value=String(i);});sv.value=String(st.vista);sv.onchange=()=>{st.vista=+sv.value;st.ficha=null;render();};
  const ls=el('label',tx('Estilo','Style','风格'),row);const ss=el('select',undefined,ls);ss.id='k11Estilo';for(const [k,l] of STYLES)el('option',l,ss).value=k;ss.value=st.estilo;ss.onchange=()=>{st.estilo=ss.value;st.ficha=null;render();};
  const g=btn(tx('Generar resultado simulado','Generate simulated result','生成模拟结果'),row,'k11Generar');g.disabled=st.ocupado||!items.length;g.onclick=generar;
  const c=btn(tx('Conservar','Keep','保存'),row,'k11Conservar');c.disabled=st.ocupado||!st.ficha;c.onclick=conservar;
  const r=btn(tx('Recuperar y verificar','Recover and verify','恢复并验证'),row,'k11Recuperar');r.disabled=st.ocupado;r.onclick=recuperar;
  el('p',tx(`Toma ${V.takeId?short(V.takeId):'—'} · ${items.length} vistas`,`Take ${V.takeId?short(V.takeId):'—'} · ${items.length} views`,`拍摄 ${V.takeId?short(V.takeId):'—'} · ${items.length} 个视图`),b,'k11-sub').id='k11Toma';
  if(st.aviso)aviso(b,st.aviso);
  if(st.ficha)ficha(b,st.ficha,st.datos,st.verif);
  if(st.lista.length){el('h3',tx('Resultados conservados','Kept results','已保存结果'),b);const ul=el('ul',undefined,b,'k11-list');ul.id='k11Lista';
   for(const f of st.lista){const li=el('li',undefined,ul);li.dataset.id=f.ficha.id;li.dataset.integridad=f.verificacion.integridad;li.dataset.vigencia=f.verificacion.vigencia;
    const im=el('img',undefined,li);im.alt='';im.src=f.thumb||'';const d=el('div',undefined,li);el('b',`${f.ficha.toma.viewLabel} · ${f.ficha.estilo.style}${f.favorito?' · ★':''}`,d);
    el('small',`${K.estado(f.verificacion.integridad,lang())} · ${K.estado(f.verificacion.vigencia,lang())} · ${tx('toma','take','拍摄')} ${short(f.ficha.toma.takeId)}`,d).className='k11-estado '+clsE(f.verificacion.vigencia==='vigente'?f.verificacion.integridad:f.verificacion.vigencia);
    const fb=btn(f.favorito?tx('Quitar favorito','Remove favourite','取消收藏'):tx('Marcar favorito','Mark favourite','设为收藏'),li);fb.onclick=()=>favorito(f.ficha.id,!f.favorito);}
   if(st.lista.length>1){const cb=btn(tx('Comparar los dos últimos','Compare the last two','比较最后两个'),b,'k11Comparar');cb.onclick=()=>{const [a,z]=st.lista.slice(-2);st.cmp=K.comparar(a.ficha,z.ficha);render();};}
   if(st.cmp){const p=el('p',undefined,b);p.id='k11Cmp';p.textContent=tx(`Misma toma: ${st.cmp.mismaToma?'sí':'no'} · mismo original: ${st.cmp.mismoOriginal?'sí':'no'} · cambia: ${st.cmp.cambia.join(', ')||'nada'}`,`Same take: ${st.cmp.mismaToma?'yes':'no'} · same original: ${st.cmp.mismoOriginal?'yes':'no'} · changes: ${st.cmp.cambia.join(', ')||'nothing'}`,`同一拍摄：${st.cmp.mismaToma?'是':'否'} · 同一原图：${st.cmp.mismoOriginal?'是':'否'} · 变化：${st.cmp.cambia.join(', ')||'无'}`);}}
  el('p',tx('Favorito = preferencia del profesional; no es una aceptación del cliente. La huella acredita integridad local, no autoría ni aceptación.','Favourite = the professional\'s preference; it is not client acceptance. The fingerprint proves local integrity, not authorship or acceptance.','收藏 = 专业人员的偏好，不等于客户验收。指纹仅证明本地完整性，不代表作者身份或验收。'),b,'k11-sub');
 }
 function ficha(parent,f,datos,verif){const box=el('section',undefined,parent,'k11-ficha');box.id='k11Ficha';box.dataset.clase=f.clase;
  el('h3',tx('Ficha trazable','Traceable sheet','可追溯卡片'),box).append(Object.assign(document.createElement('span'),{className:'k11-lab',textContent:tx('SIMULADO','SIMULATED','模拟')}));
  const imgs=el('div',undefined,box,'k11-imgs');
  for(const [k,lab] of [['original',tx('Vista real (original)','Real view (original)','真实视图（原图）')],['enviada',tx('Bytes exactos enviados al proveedor','Exact bytes sent to the provider','发送给提供方的确切字节')],['resultado',tx('Resultado simulado','Simulated result','模拟结果')]]){
   const r=f.recursos[k];if(!r)continue;const fig=el('figure',undefined,imgs);const im=el('img',undefined,fig);im.alt=lab;if(datos?.[k])im.src=url(datos[k],r.mediaType);
   el('figcaption',`${lab} · ${r.mediaType} · ${r.bytes} B · sha256 ${short(r.sha256)}${r.transformacion?' · '+r.transformacion:''}`,fig);}
  const dl=el('dl',undefined,box);const add=(k,v,id)=>{el('dt',k,dl);const d=el('dd',v,dl);if(id)d.id=id;};
  add(tx('Resultado','Result','结果'),f.id,'k11Id');add(tx('Clase','Class','类别'),f.clase);
  add(tx('Proyecto · entrada','Project · entry','项目 · 条目'),`${f.sujeto.projectId} · ${f.sujeto.entryId||'—'}`);
  add(tx('Trabajo (contentId) · revisión','Work (contentId) · revision','作品 · 版本'),`${short(f.sujeto.contentId)} · #${f.sujeto.revision}`);
  add(tx('Toma · vista','Take · view','拍摄 · 视图'),`${short(f.toma.takeId)} · ${f.toma.viewLabel} · ${f.toma.takenAt}`);
  add(tx('Estilo','Style','风格'),[f.estilo.style,f.estilo.floor,f.estilo.walls].filter(Boolean).join(' · '));
  add(tx('Procedencia','Provenance','来源'),`${f.procedencia.proveedor}${f.procedencia.modelo?' · '+f.procedencia.modelo:''}`);
  add(tx('No acreditado','Not accredited','未认证'),f.noAcreditado.join(', ')||'—','k11NoAcreditado');
  add(tx('Destinos permitidos','Allowed destinations','允许的用途'),f.derechos.destinos.join(', '));
  add(tx('Huella local','Local fingerprint','本地指纹'),short(f.huella));
  if(verif){add(tx('Integridad','Integrity','完整性'),K.estado(verif.integridad,lang()),'k11Integridad');add(tx('Vigencia','Currency','有效性'),K.estado(verif.vigencia,lang()),'k11Vigencia');}
 }

 // ---------------------------------------------------------------- acciones (cancelables; resultados tardíos descartados)
 async function generar(){
  const items=V.current();const v=items[st.vista];if(!v)return;st.ocupado=true;st.aviso=null;render();
  const s=await sujetoConfirmado();if(!s.sujeto){st.ocupado=false;st.aviso=s.motivo;render();return;}
  st.actual={...s.sujeto,takeId:V.takeId};
  const contexto=()=>({...st.actual,projectId:window.FloorPlanApp.project?.id===st.actual.projectId?st.actual.projectId:window.FloorPlanApp.project?.id,takeId:V.takeId});
  const t=gen.iniciar();
  const r=await K.generar({vista:{...v,takeId:V.takeId,takenAt:V.takenAt.toISOString(),source:V.source??null},estilo:{style:st.estilo}},
   {digest:hex,nuevoId:()=>'vr_'+crypto.randomUUID().replace(/-/g,''),ahora:()=>new Date().toISOString(),contexto,convertir:jpeg,proveedor:simulado,transformacion:'jpeg q=0.9 fondo blanco (ai-render-ui.jpeg)',clase:'simulado-laboratorio',cache},t,gen);
  if(!gen.vigente(t)&&r.motivo!=='cancelada')return;// otra generación tomó el relevo
  st.ocupado=false;
  if(!r.ok){st.aviso=r.motivo;render();return;}
  if(r.datos)datosPorId.set(r.ficha.id,r.datos);// un acierto de caché reutiliza los bytes de SU resultado, nunca otros
  st.ficha=r.ficha;st.datos=datosPorId.get(r.ficha.id)||null;
  const porRef=new Map(Object.entries(r.ficha.recursos).filter(([,x])=>x).map(([k,x])=>[x.storage.ref,st.datos?.[k]||null]));
  st.verif=await K.verificar(r.ficha,{digest:hex,leerBytes:async ref=>porRef.get(ref)||null,actual:contexto()});st.desdeCache=!!r.cache;
  render();document.getElementById('k11Ficha')?.focus?.();
 }
 async function conservar(){if(!st.ficha||!st.datos)return;st.ocupado=true;render();await cargarExt(st.ficha.sujeto.projectId);
  const ad=K.adaptadorLaboratorio({bytes,proyecto:proyectoLab(st.ficha.sujeto.projectId)});const r=await ad.conservar(st.ficha,st.datos);
  st.ocupado=false;st.aviso=r.ok?(r.duplicado?'duplicado':null):r.motivo;await recuperar();}
 // Cada lectura lleva su secuencia: una lectura anterior que termine más tarde no pisa la lista ni el estado (como E3-C).
 let seqRec=0;
 async function recuperar(){const n=++seqRec;st.ocupado=true;render();const s=await sujetoConfirmado();const pid=window.FloorPlanApp.project?.id;await cargarExt(pid);
  const ad=K.adaptadorLaboratorio({bytes,proyecto:proyectoLab(pid)});const actual=s.sujeto?{...s.sujeto,takeId:V.takeId}:null;
  const rec=await ad.recuperar({digest:hex,actual});if(n!==seqRec)return;st.ocupado=false;if(!rec.ok){st.aviso=rec.motivo;st.lista=[];st.lecturas++;render();return;}
  for(const f of rec.fichas){const b=await bytes.get(f.ficha.recursos.resultado.storage.ref);f.thumb=b?url(b,f.ficha.recursos.resultado.mediaType):'';}
  if(n!==seqRec)return;st.lista=rec.fichas;if(!s.sujeto&&!st.aviso)st.aviso=s.motivo;st.lecturas++;render();}
 async function favorito(id,on){await cargarExt(window.FloorPlanApp.project.id);const ad=K.adaptadorLaboratorio({bytes,proyecto:proyectoLab(window.FloorPlanApp.project.id)});await ad.favorito(id,on,{ahora:new Date().toISOString()});await recuperar();}

 function abrir(){dlg?.remove();dlg=el('dialog',undefined,document.body,'k11');dlg.id='k11Dialog';dlg.setAttribute('aria-labelledby','k11Title');
  const sh=el('div',undefined,dlg,'k11-shell');const h=el('header',undefined,sh,'k11-head');const t=el('div',undefined,h);const h2=el('h2',tx('Resultado visual trazable','Traceable visual result','可追溯视觉结果'),t);h2.id='k11Title';
  h2.append(Object.assign(document.createElement('span'),{className:'k11-lab',textContent:tx('LABORATORIO K11','K11 LAB','K11 实验室')}));
  el('p',tx('Demostración aislada: proveedor simulado (sin IA ni coste), conservación en una base de laboratorio separada; no cambia el proyecto.','Isolated demo: simulated provider (no AI, no cost), kept in a separate lab store; the project is not changed.','隔离演示：模拟提供方（无 AI、无费用），保存在独立的实验室存储中；不更改项目。'),t);
  const close=btn(tx('Cerrar','Close','关闭'),h,'k11Cerrar');close.onclick=()=>dlg.close();
  refs={body:el('div',undefined,sh,'k11-body')};dlg.addEventListener('close',()=>{gen.cancelar();});
  st.ficha=null;st.aviso=null;st.cmp=null;st.lista=[];dlg.showModal();render();recuperar();}
 window.RubikK11Lab={abrir,get estado(){return st;},DB:DBN};
})();
