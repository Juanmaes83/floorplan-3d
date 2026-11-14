/* FOT-01 «Reformar desde fotografía» · interfaz. Entradas: «Entregar» → tarjeta «Imágenes» y menú «Archivo».
   No es «Desde una imagen» (eso importa o calca un PLANO): aquí se prepara una propuesta visual ilustrativa sobre una
   foto. Recorrido: elegir foto → validar (formato real, tamaño, dimensiones, decodificación) → original sin metadatos →
   intención (opciones cerradas) → qué se enviaría → proveedor real BLOQUEADO (GOV-05 / IMG-04) → consentimiento →
   alternativas con el adaptador SIMULADO (local, sin red, sin coste) → comparar antes/después → descartar.
   El resultado simulado lleva SIEMPRE el rótulo «SIMULACIÓN · no generada por IA» (también dentro de la imagen) y no se
   puede descargar. Nada se guarda: la foto y los resultados viven en memoria mientras el diálogo está abierto. El
   proyecto no se toca. */
(function(){
 'use strict';
 const C=window.RubikPhotoReformCore;if(!C)return;
 const $=s=>document.querySelector(s);
 const el=(tag,attrs={},parent,text)=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs))if(v!==undefined&&v!==null&&v!==false)n.setAttribute(k,v===true?'':v);if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 // Estado del proveedor real en ESTE despliegue: ninguno configurado ni autorizado; gobierno pendiente.
 const PROVIDER=Object.freeze({configured:false,authorized:false}),GOVERNANCE=Object.freeze({gov05:false,img04:false});

 const dlg=el('dialog',{id:'photoReformDialog',class:'photo-reform-dialog','aria-labelledby':'photoReformTitle'},document.body);
 const wrap=el('div',{class:'photo-reform'},dlg);
 const head=el('div',{class:'photo-reform-head'},wrap);
 el('h2',{id:'photoReformTitle'},head,'Reformar desde fotografía');
 const closeBtn=el('button',{type:'button',class:'btn',id:'photoReformClose'},head,'Cerrar');
 el('p',{class:'photo-reform-truth'},wrap,'Propuesta visual ILUSTRATIVA sobre una foto: no mide, no cambia tu proyecto y no sustituye al plano. Para importar o calcar un plano usa «Subir plano» o «Desde una imagen».');
 // 1 · Foto
 const s1=el('section',{class:'photo-reform-step','aria-labelledby':'pr1'},wrap);el('h3',{id:'pr1'},s1,'1 · Fotografía');
 const file=el('input',{type:'file',id:'photoReformFile',accept:'image/jpeg,image/png,image/webp','aria-describedby':'photoReformFileHelp photoReformFileError'},s1);
 el('small',{id:'photoReformFileHelp'},s1,'JPEG, PNG o WebP · hasta 10 MB · lado menor ≥ 320 px. Se eliminan los metadatos (EXIF, ubicación) y no se guarda.');
 const fileErr=el('p',{id:'photoReformFileError',class:'photo-reform-error',role:'alert'},s1);
 const original=el('figure',{class:'photo-reform-original',id:'photoReformOriginal',hidden:true},s1);const originalImg=el('img',{alt:'Fotografía original (copia sin metadatos)'},original);const originalCap=el('figcaption',{},original);
 // 2 · Intención
 const s2=el('section',{class:'photo-reform-step','aria-labelledby':'pr2'},wrap);el('h3',{id:'pr2'},s2,'2 · Intención de reforma');
 const intentSel=el('select',{id:'photoReformIntent','aria-label':'Intención de reforma'},s2);el('option',{value:''},intentSel,'Elige qué quieres ver…');for(const i of C.INTENTS)el('option',{value:i.id},intentSel,i.label);
 const finishSel=el('select',{id:'photoReformFinish','aria-label':'Acabado',hidden:true},s2);
 const altSel=el('select',{id:'photoReformAlternatives','aria-label':'Número de alternativas'},s2);for(let n=1;n<=3;n++)el('option',{value:String(n)},altSel,`${n} alternativa${n>1?'s':''}`);
 // 3 · Qué se enviaría
 const s3=el('section',{class:'photo-reform-step','aria-labelledby':'pr3'},wrap);el('h3',{id:'pr3'},s3,'3 · Qué se enviaría a un proveedor');
 const sends=el('ul',{id:'photoReformSends'},s3);el('p',{class:'photo-reform-never-title'},s3,'Nunca se envía:');const never=el('ul',{id:'photoReformNever'},s3);
 // 4 · Proveedor y consentimiento
 const s4=el('section',{class:'photo-reform-step','aria-labelledby':'pr4'},wrap);el('h3',{id:'pr4'},s4,'4 · Proveedor y consentimiento');
 const provider=el('div',{class:'photo-reform-provider',id:'photoReformProvider',role:'note'},s4);el('strong',{},provider,'Proveedor real: BLOQUEADO');const blockList=el('ul',{},provider);
 for(const r of C.gate({mode:'real',consent:true,provider:PROVIDER,governance:GOVERNANCE}).reasons)el('li',{},blockList,r);
 el('p',{},provider,'No se envía ninguna foto, no se usan credenciales y no hay gasto.');
 const consentLabel=el('label',{class:'photo-reform-consent'},s4);const consent=el('input',{type:'checkbox',id:'photoReformConsent'},consentLabel);
 consentLabel.append(' Entiendo que el resultado es una imagen ilustrativa, no medible, y doy mi consentimiento para procesar esta foto.');
 const scenario=el('select',{id:'photoReformScenario','aria-label':'Escenario de la simulación'},s4);for(const [v,t] of [['ok','Simulación: respuesta correcta'],['error','Simulación: el proveedor devuelve un error'],['slow','Simulación: respuesta lenta (para probar «Cancelar»)']])el('option',{value:v},scenario,t);
 const row=el('div',{class:'photo-reform-actions'},s4);
 const realBtn=el('button',{type:'button',class:'btn',id:'photoReformReal',disabled:true,'aria-describedby':'photoReformProvider'},row,'Generar con proveedor real');
 const simBtn=el('button',{type:'button',class:'btn primary',id:'photoReformSimulate'},row,'Probar con simulación');
 const cancelBtn=el('button',{type:'button',class:'btn',id:'photoReformCancel',hidden:true},row,'Cancelar');
 const status=el('p',{id:'photoReformStatus',class:'photo-reform-status',role:'status','aria-live':'polite'},s4);
 // 5 · Resultado
 const s5=el('section',{class:'photo-reform-step',id:'photoReformResults','aria-labelledby':'pr5',hidden:true},wrap);el('h3',{id:'pr5'},s5,'5 · Resultado y comparación');
 const altList=el('div',{class:'photo-reform-alts',id:'photoReformAlts'},s5);
 const compare=el('figure',{class:'photo-reform-compare',id:'photoReformCompare',hidden:true},s5);
 const cmpBase=el('img',{alt:'Original',class:'photo-reform-cmp-base'},compare),cmpTop=el('img',{alt:'Resultado simulado',class:'photo-reform-cmp-top'},compare);
 el('span',{class:'photo-reform-tag photo-reform-tag-before'},compare,'Original');const cmpTag=el('span',{class:'photo-reform-tag photo-reform-tag-after',id:'photoReformCmpTag'},compare,'SIMULACIÓN');
 const slider=el('input',{type:'range',min:'0',max:'100',value:'50',id:'photoReformSlider','aria-label':'Comparar original y resultado'},s5);
 const resultNote=el('p',{id:'photoReformResultNote',class:'photo-reform-result-note'},s5);
 const rrow=el('div',{class:'photo-reform-actions'},s5);
 const dlBtn=el('button',{type:'button',class:'btn',id:'photoReformDownload',disabled:true},rrow,'Descargar');
 const discardBtn=el('button',{type:'button',class:'btn',id:'photoReformDiscard'},rrow,'Descartar');
 el('small',{id:'photoReformDownloadWhy'},s5,'La descarga solo se habilitará con un proveedor autorizado: una simulación no es una propuesta para entregar.');

 let image=null,origUrl=null,results=[],runState=null,abort=null,selected=0;
 const revoke=()=>{if(origUrl)URL.revokeObjectURL(origUrl);origUrl=null;for(const r of results)if(r.url)URL.revokeObjectURL(r.url);results=[];};
 function reset(){abort?.abort();abort=null;revoke();image=null;runState=null;file.value='';fileErr.textContent='';original.hidden=true;originalImg.removeAttribute('src');intentSel.value='';finishSel.hidden=true;finishSel.replaceChildren();altSel.value='1';consent.checked=false;scenario.value='ok';status.textContent='';s5.hidden=true;altList.replaceChildren();compare.hidden=true;simBtn.hidden=false;cancelBtn.hidden=true;refresh();}
 function refresh(){
  const r=C.request({image,intent:intentSel.value,finish:finishSel.hidden?null:finishSel.value,alternatives:altSel.value});
  sends.replaceChildren();never.replaceChildren();
  const sum=r.ok?r.summary:{sends:['Nada todavía: elige una foto válida y una intención.'],never:['El proyecto, sus planos, medidas o datos','El nombre del archivo','Los metadatos de la foto (EXIF, GPS, cámara)','Texto libre']};
  for(const t of sum.sends)el('li',{},sends,t);for(const t of sum.never)el('li',{},never,t);
  simBtn.disabled=!r.ok||runState?.status==='running';return r;
 }
 intentSel.onchange=()=>{const i=C.INTENTS.find(x=>x.id===intentSel.value);finishSel.replaceChildren();finishSel.hidden=!i?.finishes.length;if(i?.finishes.length){for(const f of i.finishes)el('option',{value:f.id},finishSel,f.label);}refresh();};
 finishSel.onchange=altSel.onchange=refresh;
 file.onchange=async()=>{
  fileErr.textContent='';file.removeAttribute('aria-invalid');revoke();image=null;original.hidden=true;s5.hidden=true;refresh();
  const f=file.files?.[0];if(!f)return;
  const chk=C.checkFile({size:f.size,head:new Uint8Array(await f.slice(0,16).arrayBuffer())});
  if(!chk.ok){fileErr.textContent=chk.message;file.setAttribute('aria-invalid','true');file.value='';return;}
  let bmp;try{bmp=await createImageBitmap(f);}catch{bmp=null;}
  const dims=C.checkDimensions(bmp?.width,bmp?.height);
  if(!dims.ok){bmp?.close?.();fileErr.textContent=dims.message;file.setAttribute('aria-invalid','true');file.value='';return;}
  // Copia de trabajo sin metadatos: se dibuja el píxel, no el archivo.
  const c=document.createElement('canvas');c.width=dims.work.w;c.height=dims.work.h;c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);bmp.close?.();
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.88));
  image={mediaType:'image/jpeg',width:c.width,height:c.height,bytes:blob.size,canvas:c};origUrl=URL.createObjectURL(blob);
  originalImg.src=origUrl;originalCap.textContent=`Original · ${c.width}×${c.height} px · sin metadatos`;original.hidden=false;refresh();
 };
 consent.onchange=()=>{if(consent.checked&&/consentimiento/.test(status.textContent))status.textContent='';};

 // Adaptador SIMULADO: transforma la propia foto en el navegador. No llama a nada fuera y no tiene coste.
 const FINISH_COLOR={'light-oak':'#c9a77a',walnut:'#6b4a33',microcement:'#b9b4ab','grey-porcelain':'#9a9c9e',white:'#f4f4f2','warm-white':'#f3eadb',sage:'#9fb39a',sand:'#d8c3a0'};
 function simulate(req,index,signal,scn){
  return new Promise((resolve,reject)=>{
   const wait=scn==='slow'?2500:500;const t=setTimeout(()=>{
    if(scn==='error'&&index===Math.min(1,req.alternatives-1)){reject(Error('El proveedor (simulado) ha devuelto un error: no se ha generado ninguna imagen y no hay coste.'));return;}
    const src=image.canvas,c=document.createElement('canvas');c.width=src.width;c.height=src.height;const x=c.getContext('2d');
    const k=.25+index*.15;
    x.filter=req.intent==='light'?`brightness(${1.1+index*.06}) contrast(1.05) saturate(.92)`:req.intent==='warm'?`sepia(${.2+index*.12}) saturate(1.15)`:'none';
    x.drawImage(src,0,0);x.filter='none';
    if(req.finish&&FINISH_COLOR[req.finish]){x.globalAlpha=k;x.globalCompositeOperation='multiply';x.fillStyle=FINISH_COLOR[req.finish];
     if(req.intent==='floor')x.fillRect(0,c.height*.62,c.width,c.height*.38);else x.fillRect(0,0,c.width,c.height*.62);x.globalAlpha=1;x.globalCompositeOperation='source-over';}
    // Rótulo dentro de la imagen: aunque se recorte o se capture, sigue diciendo que es una simulación.
    const fs=Math.max(14,Math.round(c.width/26));x.save();x.font=`700 ${fs}px sans-serif`;x.fillStyle='rgba(176,0,32,.85)';x.fillRect(0,0,c.width,fs*1.8);x.fillStyle='#fff';x.textBaseline='middle';x.fillText('SIMULACIÓN · no generada por IA',fs*.6,fs*.9);
    x.translate(c.width/2,c.height/2);x.rotate(-Math.PI/7);x.globalAlpha=.22;x.font=`800 ${fs*2.2}px sans-serif`;x.textAlign='center';x.fillStyle='#b00020';for(let y=-2;y<=2;y++)x.fillText('SIMULACIÓN',0,y*fs*4);x.restore();
    c.toBlob(b=>resolve({kind:'simulated',blob:b}),'image/jpeg',.88);
   },wait);
   signal.addEventListener('abort',()=>{clearTimeout(t);reject(Object.assign(Error('cancelado'),{name:'AbortError'}));},{once:true});
  });
 }
 function renderAlts(){
  altList.replaceChildren();
  for(const it of runState.items){const card=el('figure',{class:'photo-reform-alt','data-status':it.status,'data-index':String(it.index)},altList);
   const r=results[it.index];
   if(r?.url){const b=el('button',{type:'button',class:'photo-reform-alt-pick','aria-pressed':String(selected===it.index),'aria-label':`Comparar alternativa ${it.index+1} (simulación)`},card);el('img',{src:r.url,alt:`Alternativa ${it.index+1} · SIMULACIÓN`},b);b.onclick=()=>{selected=it.index;showCompare();renderAlts();};}
   el('figcaption',{},card,`Alternativa ${it.index+1} · ${({pending:'en espera',running:'preparando…',done:it.result?.badge,error:'error',cancelled:'cancelada',skipped:'no generada'})[it.status]||it.status}`);}
 }
 function showCompare(){const r=results[selected];if(!r?.url){compare.hidden=true;return;}cmpBase.src=origUrl;cmpTop.src=r.url;compare.hidden=false;cmpTag.textContent=r.label.badge;compare.style.setProperty('--cut',slider.value+'%');
  resultNote.textContent=`${r.label.badge}. Imagen ilustrativa, no medible. ${r.label.costText}`;dlBtn.disabled=!r.label.downloadable;}
 slider.oninput=()=>compare.style.setProperty('--cut',slider.value+'%');
 realBtn.onclick=()=>{const g=C.gate({mode:'real',consent:consent.checked,provider:PROVIDER,governance:GOVERNANCE});status.textContent='Bloqueado: '+g.reasons.join(' ');};
 simBtn.onclick=async()=>{
  const r=refresh();if(!r.ok){status.textContent=r.message;return;}
  const g=C.gate({mode:'simulated',consent:consent.checked});
  if(!g.allowed){status.textContent='No se procesa: '+g.reasons.join(' ');consent.focus();return;}
  for(const x of results)if(x.url)URL.revokeObjectURL(x.url);results=[];selected=0;compare.hidden=true;
  abort=new AbortController();const sig=abort.signal,scn=scenario.value;
  runState=C.start(C.run(r.request.alternatives));s5.hidden=false;simBtn.hidden=true;cancelBtn.hidden=false;status.textContent='Simulación en curso (local, sin envíos ni coste)…';renderAlts();
  for(let i=0;i<r.request.alternatives;i++){
   try{const out=await simulate(r.request,i,sig,scn);runState=C.itemDone(runState,i,{kind:out.kind});results[i]={url:URL.createObjectURL(out.blob),label:runState.items[i].result};if(i===0)showCompare();}
   catch(e){if(e.name==='AbortError'){runState=C.cancel(runState);status.textContent='Cancelado: no se ha generado nada más y no hay coste.';}
    else{runState=C.itemError(runState,i,e.message);status.textContent=e.message;}break;}
   renderAlts();
  }
  renderAlts();abort=null;simBtn.hidden=false;cancelBtn.hidden=true;refresh();
  if(runState.status==='done')status.textContent=`Simulación terminada: ${results.filter(Boolean).length} alternativa(s), rotuladas como SIMULACIÓN. No se ha llamado a ningún proveedor.`;
  dlg.dataset.run=runState.status;
 };
 cancelBtn.onclick=()=>abort?.abort();
 discardBtn.onclick=()=>{for(const x of results)if(x.url)URL.revokeObjectURL(x.url);results=[];runState=null;s5.hidden=true;compare.hidden=true;status.textContent='Resultado descartado. La foto original sigue solo en esta ventana.';};
 dlBtn.onclick=()=>{};// nunca habilitado para simulaciones
 closeBtn.onclick=()=>{dlg.close();};
 dlg.addEventListener('close',reset);
 function open(){reset();dlg.showModal();file.focus();}

 // ── Entradas ────────────────────────────────────────────────────────────────────────────────────────────────────
 const entryButton=id=>{const b=el('button',{type:'button',class:'btn photo-reform-open',id},undefined,'Reformar desde fotografía');b.onclick=open;return b;};
 // Menú «Archivo» del editor.
 const menu=document.querySelector('details.menu .menu-pop');
 if(menu){const b=entryButton('photoReformMenu');b.addEventListener('click',()=>{b.closest('details').open=false;});menu.append(b);}
 // Tarjeta «Imágenes» de «Entregar» (se vuelve a pintar al cambiar de área: se añade si falta).
 const addToCard=()=>{const card=document.querySelector('.professional-card[data-module="images"]');if(card&&!card.querySelector('#photoReformCard')){const b=entryButton('photoReformCard');const wrap=el('div',{class:'photo-reform-card-entry'});wrap.append(b);el('small',{},wrap,'Propuesta visual ilustrativa sobre una foto (simulación; sin envíos).');card.append(wrap);}};
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;addToCard();});}).observe(document.body,{childList:true,subtree:true});addToCard();
 window.RubikPhotoReform={open,get state(){return runState&&structuredClone({status:runState.status,items:runState.items.map(i=>({index:i.index,status:i.status,kind:i.result?.kind||null}))});}};
})();
