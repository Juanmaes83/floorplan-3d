/* MUE-01 «Traer mi mueble» · interfaz. Entrada: Editor → «Amueblar» → «Traer mi mueble».
   · El profesional da nombre, categoría, foto y medidas; RUBIK crea un VOLUMEN GENÉRICO con esas medidas exactas
     (FloorPlanApp.addOwnFurniture: colocación ordinaria, un paso del deshacer, guardado). Después se edita como
     cualquier mueble (mover, rotar, medidas, cotas UX-08, borrar).
   · La foto se lee en el navegador, se valida (formato real, tamaño, decodificación), se recompone en un lienzo sin
     metadatos (EXIF, GPS, cámara) y se guarda SOLO en este navegador (FloorPlanImages, IndexedDB). En el proyecto queda
     una referencia en extensions['x-mue01-furniture-photo'] (js/own-furniture-core.js). Nunca se envía a nadie y
     nunca se guarda el nombre del archivo.
   · Si la foto no puede conservarse, el mueble se crea igual y la interfaz lo dice. Si falta (otro navegador, datos
     borrados, proyecto importado), el volumen sigue funcionando y el panel lo advierte. */
(function(){
 'use strict';
 const C=window.RubikOwnFurnitureCore,app=window.FloorPlanApp;if(!C||!app)return;
 const $=s=>document.querySelector(s);
 const el=(tag,attrs={},parent,text)=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs))if(v!==undefined&&v!==null&&v!==false)n.setAttribute(k,v===true?'':v);if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 const notify=(text,ms=5000)=>{try{toast(text,ms);}catch{}};
 const shown=n=>{try{return nm(n);}catch{return n;}};
 const hex=buf=>[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');

 // Foto → copia recomprimida sin metadatos (o el motivo por el que no se acepta).
 async function processPhoto(file){
  if(!file)return {ok:false,reason:'missing',message:'Elige una foto del mueble.'};
  const head=new Uint8Array(await file.slice(0,16).arrayBuffer());
  const chk=C.checkPhoto({size:file.size,head});if(!chk.ok)return chk;
  let bmp;try{bmp=await createImageBitmap(file);}catch{return {ok:false,reason:'corrupt',message:'No se ha podido leer la foto: el archivo parece dañado.'};}
  const sz=C.fitSize(bmp.width,bmp.height);if(!sz){bmp.close?.();return {ok:false,reason:'corrupt',message:'No se ha podido leer la foto: el archivo parece dañado.'};}
  const c=document.createElement('canvas');c.width=sz.w;c.height=sz.h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,sz.w,sz.h);x.drawImage(bmp,0,0,sz.w,sz.h);bmp.close?.();
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.85));if(!blob)return {ok:false,reason:'corrupt',message:'No se ha podido preparar la foto.'};
  const sha=hex(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()));
  return {ok:true,blob,meta:{imageKey:'mue01/'+sha,sha256:sha,mediaType:'image/jpeg',widthPx:sz.w,heightPx:sz.h,bytes:blob.size,addedAt:new Date().toISOString()}};
 }
 async function storePhoto(p){try{if(!window.FloorPlanImages)throw Error('sin almacén');await FloorPlanImages.put([[p.meta.imageKey,p.blob]]);return true;}catch{return false;}}
 async function loadPhoto(key){try{const b=await window.FloorPlanImages?.get(key);return b instanceof Blob&&b.size?b:null;}catch{return null;}}

 // ── Entrada en «Amueblar» ────────────────────────────────────────────────────────────────────────────────────────
 const host=$('#paletteFurnish')||$('aside.lib');
 const entry=el('section',{id:'ownFurnEntry',class:'own-furn-entry','aria-labelledby':'ownFurnOpen'});
 const openBtn=el('button',{type:'button',id:'ownFurnOpen',class:'btn own-furn-open'},entry,'Traer mi mueble');
 el('p',{class:'own-furn-hint'},entry,'Tu mueble con su foto y tus medidas: RUBIK crea un volumen genérico con esas medidas.');
 if(host){const lib=$('#lib');if(lib&&lib.parentElement===host)host.insertBefore(entry,lib);else host.prepend(entry);}

 // ── Formulario ───────────────────────────────────────────────────────────────────────────────────────────────────
 const dlg=el('dialog',{id:'ownFurnDialog',class:'own-furn-dialog','aria-labelledby':'ownFurnTitle'},document.body);
 const form=el('form',{method:'dialog',novalidate:true},dlg);
 el('h2',{id:'ownFurnTitle'},form,'Traer mi mueble');
 el('p',{class:'own-furn-truth'},form,'RUBIK no mide la foto ni crea un modelo 3D fiel: crea un volumen genérico con TUS medidas. La foto es solo una referencia visual del mueble.');
 const fields={};
 const field=(key,label,input,help)=>{const w=el('div',{class:'own-furn-field','data-field':key},form);const id='ownFurn-'+key;el('label',{for:id},w,label);input.id=id;w.append(input);
  if(help)el('small',{class:'own-furn-help'},w,help);const err=el('p',{class:'own-furn-error',id:id+'-error',role:'alert'},w);input.setAttribute('aria-describedby',id+'-error');fields[key]={input,err};return input;};
 const name=field('name','Nombre',el('input',{type:'text',maxlength:String(C.LIMITS.nameMax),autocomplete:'off',placeholder:'Sofá de la abuela'}));
 const type=field('type','Categoría',el('select'));el('option',{value:''},type,'Elige una categoría…');for(const c of C.CATEGORIES)el('option',{value:c.type},type,c.label);
 const photo=field('photo','Fotografía del mueble',el('input',{type:'file',accept:'image/jpeg,image/png,image/webp'}),'JPEG, PNG o WebP, hasta 12 MB. Se guarda una copia sin metadatos (EXIF ni ubicación) solo en este navegador; no se envía a nadie.');
 const preview=el('figure',{class:'own-furn-preview',hidden:true},form);const previewImg=el('img',{alt:'Vista previa de la foto del mueble'},preview);el('figcaption',{},preview,'Copia que se guardará (sin metadatos)');
 const dims=el('div',{class:'own-furn-dims'},form);
 const num=(key,label,[lo,hi])=>{const i=field(key,label,el('input',{type:'number',inputmode:'numeric',min:String(lo),max:String(hi),step:'1'}),`${lo}–${hi} mm`);dims.append(i.parentElement);return i;};
 const w=num('widthMm','Anchura (mm)',C.LIMITS.widthMm),d=num('depthMm','Fondo (mm)',C.LIMITS.depthMm),h=num('heightMm','Altura (mm)',C.LIMITS.heightMm);
 const rot=field('rotationDeg','Rotación inicial (°)',el('input',{type:'number',inputmode:'numeric',min:'0',max:'359',step:'1',value:'0'}));
 const room=field('room','Colocar en',el('select'));
 const status=el('p',{id:'ownFurnStatus',class:'own-furn-status',role:'status','aria-live':'polite'},form);
 const actions=el('div',{class:'own-furn-actions'},form);
 const cancelBtn=el('button',{type:'button',class:'btn',id:'ownFurnCancel'},actions,'Cancelar');
 const createBtn=el('button',{type:'submit',class:'btn primary',id:'ownFurnCreate'},actions,'Crear mueble');
 let pending=null,previewUrl=null,busy=false;
 const setPreview=blob=>{if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=blob?URL.createObjectURL(blob):null;preview.hidden=!blob;if(blob)previewImg.src=previewUrl;else previewImg.removeAttribute('src');};
 function fillRooms(){room.replaceChildren();el('option',{value:''},room,'Donde estoy mirando ahora');
  for(const r of app.project.rooms){let label=r.name;try{label=roomDisplay(r);}catch{}el('option',{value:r.id},room,label);}
  const sel=(()=>{try{return ui.sel?.kind==='room'?ui.sel.id:'';}catch{return '';}})();room.value=sel||'';}
 function clearErrors(){for(const f of Object.values(fields)){f.err.textContent='';f.input.removeAttribute('aria-invalid');}status.textContent='';}
 function showErrors(errors){let first=null;for(const [k,msg] of Object.entries(errors)){const f=fields[k];if(!f)continue;f.err.textContent=msg;f.input.setAttribute('aria-invalid','true');first=first||f.input;}first?.focus();}
 function open(){form.reset();rot.value='0';clearErrors();pending=null;setPreview(null);fillRooms();busy=false;createBtn.disabled=false;dlg.showModal();name.focus();}
 openBtn.onclick=open;
 cancelBtn.onclick=()=>{dlg.close();setPreview(null);pending=null;};
 photo.onchange=async()=>{fields.photo.err.textContent='';photo.removeAttribute('aria-invalid');pending=null;setPreview(null);const file=photo.files?.[0];if(!file)return;
  status.textContent='Preparando la foto…';const r=await processPhoto(file);status.textContent='';
  if(!r.ok){fields.photo.err.textContent=r.message;photo.setAttribute('aria-invalid','true');photo.value='';return;}
  pending=r;setPreview(r.blob);};
 form.onsubmit=async e=>{
  e.preventDefault();if(busy)return;clearErrors();
  const v=C.validateSpec({name:name.value,type:type.value,widthMm:w.value,depthMm:d.value,heightMm:h.value,rotationDeg:rot.value});
  const errors=v.ok?{}:{...v.errors};if(!pending)errors.photo=photo.files?.length?(fields.photo.err.textContent||'La foto no es válida.'):'Elige una foto del mueble.';
  if(Object.keys(errors).length){showErrors(errors);status.textContent='Revisa los campos marcados.';return;}
  busy=true;createBtn.disabled=true;status.textContent='Creando el mueble…';
  const stored=await storePhoto(pending);
  const res=app.addOwnFurniture({...v.spec,roomId:room.value||undefined},(project,id)=>{
   const r=C.read(project);if(r.status==='future'||r.status==='invalid')return; // se conserva intacta: el mueble entra igual, sin anotar
   C.attach(project,id,stored?pending.meta:null);});
  busy=false;createBtn.disabled=false;
  if(!res?.ok){status.textContent=res?.message||'No se ha podido añadir el mueble: no hay sitio libre en esa estancia.';return;}
  dlg.close();setPreview(null);pending=null;
  // Como al añadir desde la biblioteca: en pantallas estrechas se cierran los cajones para ver el mueble en el plano.
  try{if(matchMedia('(max-width:1100px)').matches)closeDrawers();}catch{}
  const dimsText=`${v.spec.w} × ${v.spec.d} × ${v.spec.h} mm`;
  notify(`Añadido «${v.spec.name}» · ${dimsText}${res.note||''}`+(stored?'':' · No se ha podido guardar la foto en este navegador: el mueble se ha creado sin referencia fotográfica.'),stored?4500:8000);
 };

 // ── Panel del mueble: referencia fotográfica ────────────────────────────────────────────────────────────────────
 let panelUrl=null;
 const changeInput=el('input',{type:'file',accept:'image/jpeg,image/png,image/webp',id:'ownFurnChange',hidden:true,'aria-hidden':'true',tabindex:'-1'},document.body);
 let changeFor=null;
 changeInput.onchange=async()=>{const file=changeInput.files?.[0];const id=changeFor;changeInput.value='';if(!file||!id)return;
  const r=await processPhoto(file);if(!r.ok){notify(r.message,6000);return;}
  if(!await storePhoto(r)){notify('No se ha podido guardar la foto en este navegador.',6000);return;}
  const out=app.applyOwnFurniture(p=>({ok:true,project:C.attach(p,id,r.meta)}));notify(out?.ok?'Foto de referencia actualizada.':'No se ha podido cambiar la foto.');};
 function panel(container,objectId){
  if(panelUrl){URL.revokeObjectURL(panelUrl);panelUrl=null;}
  const project=app.project,first=C.photoStatus(project,objectId,true);
  if(first.state==='none')return;
  const body=container.querySelector('.panel-body');if(!body)return;
  const box=el('details',{class:'panel-group own-furn-panel','data-group':'own-furn',open:true});body.prepend(box);
  el('summary',{},box,'Tu mueble · foto de referencia');
  const o=project.objects.find(x=>x.id===objectId);
  if(o)el('p',{class:'own-furn-truth','data-own-dims':`${o.size.widthMm}x${o.size.depthMm}x${o.size.heightMm??''}`},box,`Volumen genérico con tus medidas: ${o.size.widthMm} × ${o.size.depthMm} × ${o.size.heightMm??'—'} mm. No es una reconstrucción 3D de la foto.`);
  const fig=el('figure',{class:'own-furn-photo'},box);const state=el('p',{class:'own-furn-photo-state',id:'ownFurnPhotoState',role:'status'},box);
  el('p',{class:'own-furn-help'},box,'La foto se guarda solo en este navegador: no viaja al exportar el proyecto ni a otros equipos.');
  const row=el('div',{class:'panel-foot-row'},box);
  const pick=label=>{const b=el('button',{type:'button',class:'btn',id:'ownFurnPick'},row,label);b.onclick=()=>{changeFor=objectId;changeInput.click();};};
  if(first.state==='unsupported'){state.textContent=first.message;state.dataset.state='unsupported';return;}
  if(first.state==='not-stored'){state.textContent=first.message;state.dataset.state='not-stored';pick('Añadir foto');return;}
  state.textContent='Comprobando la foto…';state.dataset.state='checking';
  loadPhoto(first.photo.imageKey).then(blob=>{
   if(!box.isConnected)return;
   const st=C.photoStatus(app.project,objectId,!!blob);state.dataset.state=st.state;
   if(st.state==='ok'){panelUrl=URL.createObjectURL(blob);el('img',{src:panelUrl,alt:`Foto de referencia de «${shown(o?.name||'')}»`},fig);state.textContent=`Foto de referencia guardada en este navegador (${st.photo.widthPx}×${st.photo.heightPx} px, sin metadatos).`;}
   else state.textContent=st.message||'';
   pick(st.state==='ok'?'Cambiar foto':'Volver a elegir la foto');
   const rm=el('button',{type:'button',class:'btn',id:'ownFurnRemovePhoto'},row,'Quitar foto');
   rm.onclick=()=>{const out=app.applyOwnFurniture(p=>({ok:true,project:C.attach(p,objectId,null)}));notify(out?.ok?'Foto quitada: el mueble y sus medidas no cambian.':'No se ha podido quitar la foto.');};
  });
 }
 window.RubikOwnFurniture={panel,open,processPhoto};
})();
