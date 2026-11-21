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
 // P0 · H-1: everything in this tab that may still cite a photo counts for the image collection (FloorPlanImages):
 // the project on screen, every project of the in-memory library and the undo/redo history (a removed photo can come back).
 window.FloorPlanImages?.holder?.(()=>[app.project,...(typeof library==='object'&&library?.projects?library.projects():[]),
  ...(typeof undoStack!=='undefined'?undoStack:[]),...(typeof redoStack!=='undefined'?redoStack:[])]);
 const $=s=>document.querySelector(s);
 // Language of the session (the app's global LANG; es by default). Texts that are built once are registered with `bind` and
 // re-applied on every language change; the core keeps its Spanish messages as its contract and `loc` presents them.
 const tx=(es,en,zh)=>{const l=typeof LANG==='string'?LANG:'es';return l==='en'?en:l==='zh'?zh:es;};
 const binds=[];
 const bind=(node,es,en,zh,attr)=>{binds.push([node,es,en,zh,attr]);attr?node.setAttribute(attr,tx(es,en,zh)):node.textContent=tx(es,en,zh);return node;};
 const relabel=()=>{for(const [n,es,en,zh,a] of binds)a?n.setAttribute(a,tx(es,en,zh)):n.textContent=tx(es,en,zh);};
 const CAT3={'Sofá':['Sofa','沙发'],'Butaca':['Armchair','扶手椅'],'Cama':['Bed','床'],'Mesa':['Table','桌子'],'Silla':['Chair','椅子'],'Escritorio':['Desk','书桌'],'Estantería':['Bookshelf','书架'],'Aparador o mueble alto':['Sideboard or tall unit','餐边柜或高柜'],'Cómoda':['Dresser','五斗柜'],'Mueble de TV':['TV stand','电视柜'],'Mesa de centro':['Coffee table','茶几'],'Mesa auxiliar':['Side table','边几'],'Mesilla':['Nightstand','床头柜']};
 const DIM3={'Anchura':['Width','宽度'],'Fondo':['Depth','深度'],'Altura':['Height','高度']};
 const loc=m=>{let t=String(m??'');if(tx('es','en','zh')==='es')return t;let r;
  if((r=t.match(/^Máximo (\d+) caracteres\.$/)))return tx(t,`Maximum ${r[1]} characters.`,`最多 ${r[1]} 个字符。`);
  if((r=t.match(/^(Anchura|Fondo|Altura): obligatoria\.$/)))return tx(t,`${DIM3[r[1]][0]}: required.`,`${DIM3[r[1]][1]}：必填。`);
  if((r=t.match(/^(Anchura|Fondo|Altura): escribe un número en milímetros\.$/)))return tx(t,`${DIM3[r[1]][0]}: enter a number in millimetres.`,`${DIM3[r[1]][1]}：请输入以毫米为单位的数字。`);
  if((r=t.match(/^(Anchura|Fondo|Altura): en milímetros enteros \(sin decimales\)\.$/)))return tx(t,`${DIM3[r[1]][0]}: in whole millimetres (no decimals).`,`${DIM3[r[1]][1]}：请使用整数毫米（不含小数）。`);
  if((r=t.match(/^(Anchura|Fondo|Altura): entre (\d+) y (\d+) mm\.$/)))return tx(t,`${DIM3[r[1]][0]}: between ${r[2]} and ${r[3]} mm.`,`${DIM3[r[1]][1]}：介于 ${r[2]} 与 ${r[3]} mm 之间。`);
  if((r=t.match(/^La foto pesa demasiado \(máximo (\d+) MB\)\.$/)))return tx(t,`The photo is too large (maximum ${r[1]} MB).`,`照片过大（最大 ${r[1]} MB）。`);
  const G={'Escribe un nombre.':['Enter a name.','请输入名称。'],'Elige una categoría de la lista.':['Choose a category from the list.','请从列表中选择类别。'],'Rotación: un número entero de 0 a 359 grados.':['Rotation: a whole number from 0 to 359 degrees.','旋转：0 至 359 度的整数。'],'El archivo está vacío.':['The file is empty.','文件为空。'],'Formato no admitido: usa una foto JPEG, PNG o WebP.':['Unsupported format: use a JPEG, PNG or WebP photo.','不支持该格式：请使用 JPEG、PNG 或 WebP 照片。'],
   'La referencia fotográfica es de una versión más nueva de RUBIK: se conserva sin cambios.':['The photo reference comes from a newer version of RUBIK: it is kept unchanged.','该照片引用来自更新版本的 RUBIK：保持不变。'],'La referencia fotográfica está dañada: se ignora y el mueble funciona igual.':['The photo reference is damaged: it is ignored and the piece of furniture works the same.','该照片引用已损坏：将被忽略，家具功能不受影响。'],
   'Este mueble no tiene foto conservada: el volumen y sus medidas funcionan igual.':['This piece of furniture has no stored photo: the volume and its dimensions work the same.','此家具没有保存的照片：体积及其尺寸功能不受影响。'],'Falta la foto en este navegador (no viaja al exportar ni a otros equipos). El volumen y sus medidas siguen intactos.':['The photo is missing in this browser (it does not travel when exporting or to other computers). The volume and its dimensions are intact.','此浏览器中缺少该照片（导出或在其他设备上不会随项目携带）。体积及其尺寸保持不变。'],
   'No se ha podido leer la foto: el archivo parece dañado.':['The photo could not be read: the file seems damaged.','无法读取照片：文件似乎已损坏。'],'No se ha podido preparar la foto.':['The photo could not be prepared.','无法处理照片。'],'Elige una foto del mueble.':['Choose a photo of the piece of furniture.','请选择家具的照片。'],'La foto no es válida.':['The photo is not valid.','照片无效。']};
  const hit=G[t];return hit?tx(t,hit[0],hit[1]):t;};
 const el=(tag,attrs={},parent,text)=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs))if(v!==undefined&&v!==null&&v!==false)n.setAttribute(k,v===true?'':v);if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 const lazyImg=(parent,attrs,before)=>{let img=null;return {get node(){return img;},set(src){if(!src){img?.remove();img=null;return;}if(!img){img=el('img',attrs);parent.insertBefore(img,before()||null);}img.src=src;}};};
 const notify=(text,ms=5000)=>{try{toast(text,ms);}catch{}};
 const shown=n=>{try{return nm(n);}catch{return n;}};
 // The placement note/message comes from FloorPlanApp.addOwnFurniture (placedNote): known sentences are presented here.
 const locPlace=t=>{t=String(t??'');if(tx('es','en','zh')==='es'||!t)return t;
  let r;if((r=t.match(/^ · no había sitio libre en «(.*)»(: se solapa con otros muebles)?\. Muévelo a su sitio\.$/)))return tx(t,` · there was no free place in "${r[1]}"${r[2]?': it overlaps other furniture':''}. Move it into place.`,` · 「${r[1]}」没有空闲位置${r[2]?'：与其他家具重叠':''}。请将其移到合适位置。`);
  if((r=t.match(/^ · en «(.*)», la estancia con sitio libre más cercana \(en «(.*)» no cabía\)$/)))return tx(t,` · in "${r[1]}", the nearest room with free space (it did not fit in "${r[2]}")`,` · 已放到「${r[1]}」，最近的有空位的房间（「${r[2]}」放不下）`);
  if((r=t.match(/^ · en el sitio libre más cercano de «(.*)» \(a (.*)\)$/)))return tx(t,` · in the nearest free place in "${r[1]}" (${r[2]} away)`,` · 已放到「${r[1]}」最近的空位（距离 ${r[2]}）`);
  return loc(t);};
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
 const guarded=fn=>window.FloorPlanImages?.guard?window.FloorPlanImages.guard(fn):fn();
 async function storePhoto(p){try{if(!window.FloorPlanImages)throw Error('sin almacén');await FloorPlanImages.put([[p.meta.imageKey,p.blob]]);return true;}catch{return false;}}
 async function loadPhoto(key){try{const b=await window.FloorPlanImages?.get(key);return b instanceof Blob&&b.size?b:null;}catch{return null;}}

 // ── Entrada en «Amueblar» ────────────────────────────────────────────────────────────────────────────────────────
 const host=$('#paletteFurnish')||$('aside.lib');
 const entry=el('section',{id:'ownFurnEntry',class:'own-furn-entry','aria-labelledby':'ownFurnOpen'});
 const openBtn=bind(el('button',{type:'button',id:'ownFurnOpen',class:'btn own-furn-open'},entry),'Traer mi mueble','Bring my furniture','带来我的家具');
 bind(el('p',{class:'own-furn-hint'},entry),'Tu mueble con su foto y tus medidas: RUBIK crea un volumen genérico con esas medidas.','Your furniture with its photo and your dimensions: RUBIK creates a generic volume with those dimensions.','带照片和你的尺寸的家具：RUBIK 按这些尺寸创建通用体块。');
 if(host){const lib=$('#lib');if(lib&&lib.parentElement===host)host.insertBefore(entry,lib);else host.prepend(entry);}

 // ── Formulario ───────────────────────────────────────────────────────────────────────────────────────────────────
 const dlg=el('dialog',{id:'ownFurnDialog',class:'own-furn-dialog','aria-labelledby':'ownFurnTitle'},document.body);
 const form=el('form',{method:'dialog',novalidate:true},dlg);
 bind(el('h2',{id:'ownFurnTitle'},form),'Traer mi mueble','Bring my furniture','带来我的家具');
 bind(el('p',{class:'own-furn-truth'},form),'RUBIK no mide la foto ni crea un modelo 3D fiel: crea un volumen genérico con TUS medidas. La foto es solo una referencia visual del mueble.','RUBIK does not measure the photo or create a faithful 3D model: it creates a generic volume with YOUR dimensions. The photo is only a visual reference of the furniture.','RUBIK 不会测量照片，也不会创建忠实的 3D 模型：它按「你的」尺寸创建通用体块。照片仅作为家具的视觉参考。');
 const fields={};
 const field=(key,label,input,help)=>{const w=el('div',{class:'own-furn-field','data-field':key},form);const id='ownFurn-'+key;bind(el('label',{for:id},w),...label);input.id=id;w.append(input);
  if(help)bind(el('small',{class:'own-furn-help'},w),...help);const err=el('p',{class:'own-furn-error',id:id+'-error',role:'alert'},w);input.setAttribute('aria-describedby',id+'-error');fields[key]={input,err};return input;};
 const name=field('name',['Nombre','Name','名称'],el('input',{type:'text',maxlength:String(C.LIMITS.nameMax),autocomplete:'off'}));bind(name,'Sofá de la abuela','Grandma\'s sofa','奶奶的沙发','placeholder');
 const type=field('type',['Categoría','Category','类别'],el('select'));bind(el('option',{value:''},type),'Elige una categoría…','Choose a category…','选择类别…');for(const c of C.CATEGORIES){const o=el('option',{value:c.type},type);bind(o,c.label,...(CAT3[c.label]||[c.label,c.label]));}
 const photo=field('photo',['Fotografía del mueble','Photo of the furniture','家具照片'],el('input',{type:'file',accept:'image/jpeg,image/png,image/webp'}),['JPEG, PNG o WebP, hasta 12 MB. Se guarda una copia sin metadatos (EXIF ni ubicación) solo en este navegador; no se envía a nadie.','JPEG, PNG or WebP, up to 12 MB. A copy without metadata (no EXIF or location) is stored only in this browser; it is not sent to anyone.','JPEG、PNG 或 WebP，最大 12 MB。仅在此浏览器中保存不含元数据（无 EXIF 或位置信息）的副本；不会发送给任何人。']);
 const preview=el('figure',{class:'own-furn-preview',hidden:true},form);// Las <img> solo existen mientras hay una foto que mostrar (ninguna imagen vacía en la página).
 const previewImg=lazyImg(preview,{alt:'Vista previa de la foto del mueble'},()=>preview.firstChild);bind(el('figcaption',{},preview),'Copia que se guardará (sin metadatos)','Copy that will be stored (without metadata)','将保存的副本（不含元数据）');
 const dims=el('div',{class:'own-furn-dims'},form);
 const num=(key,label,[lo,hi])=>{const i=field(key,label,el('input',{type:'number',inputmode:'numeric',min:String(lo),max:String(hi),step:'1'}),[`${lo}–${hi} mm`,`${lo}–${hi} mm`,`${lo}–${hi} mm`]);dims.append(i.parentElement);return i;};
 const w=num('widthMm',['Anchura (mm)','Width (mm)','宽度 (mm)'],C.LIMITS.widthMm),d=num('depthMm',['Fondo (mm)','Depth (mm)','深度 (mm)'],C.LIMITS.depthMm),h=num('heightMm',['Altura (mm)','Height (mm)','高度 (mm)'],C.LIMITS.heightMm);
 const rot=field('rotationDeg',['Rotación inicial (°)','Initial rotation (°)','初始旋转 (°)'],el('input',{type:'number',inputmode:'numeric',min:'0',max:'359',step:'1',value:'0'}));
 const room=field('room',['Colocar en','Place in','放置在'],el('select'));
 const status=el('p',{id:'ownFurnStatus',class:'own-furn-status',role:'status','aria-live':'polite'},form);
 const actions=el('div',{class:'own-furn-actions'},form);
 const cancelBtn=bind(el('button',{type:'button',class:'btn',id:'ownFurnCancel'},actions),'Cancelar','Cancel','取消');
 const createBtn=bind(el('button',{type:'submit',class:'btn primary',id:'ownFurnCreate'},actions),'Crear mueble','Create furniture','创建家具');
 let pending=null,previewUrl=null,busy=false,createOp=0;
 // Cancelar, Escape, abrir el diálogo o cambiar la foto invalidan la creación en curso (puede estar esperando el lock de la recogida).
 const abandon=()=>{createOp++;busy=false;createBtn.disabled=false;};
 const setPreview=blob=>{if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=blob?URL.createObjectURL(blob):null;preview.hidden=!blob;previewImg.set(previewUrl);};
 function fillRooms(){room.replaceChildren();el('option',{value:''},room,tx('Donde estoy mirando ahora','Where I am looking now','我当前查看的位置'));
  for(const r of app.project.rooms){let label=r.name;try{label=roomDisplay(r);}catch{}el('option',{value:r.id},room,label);}
  const sel=(()=>{try{return ui.sel?.kind==='room'?ui.sel.id:'';}catch{return '';}})();room.value=sel||'';}
 function clearErrors(){for(const f of Object.values(fields)){f.err.textContent='';f.input.removeAttribute('aria-invalid');}status.textContent='';}
 function showErrors(errors){let first=null;for(const [k,msg] of Object.entries(errors)){const f=fields[k];if(!f)continue;f.err.textContent=loc(msg);f.input.setAttribute('aria-invalid','true');first=first||f.input;}first?.focus();}
 function open(){relabel();abandon();form.reset();rot.value='0';clearErrors();pending=null;setPreview(null);fillRooms();dlg.showModal();name.focus();}
 openBtn.onclick=open;
 cancelBtn.onclick=()=>{abandon();setPreview(null);pending=null;dlg.close();};
 // Escape closes the dialog without «Cancelar»: the photo preview must not stay in the hidden dialog either.
 dlg.addEventListener('cancel',()=>{abandon();setPreview(null);pending=null;});
 photo.onchange=async()=>{if(busy)abandon();fields.photo.err.textContent='';photo.removeAttribute('aria-invalid');pending=null;setPreview(null);const file=photo.files?.[0];if(!file)return;
  status.textContent=tx('Preparando la foto…','Preparing the photo…','正在处理照片…');const r=await processPhoto(file);status.textContent='';
  if(!r.ok){fields.photo.err.textContent=loc(r.message);photo.setAttribute('aria-invalid','true');photo.value='';return;}
  pending=r;setPreview(r.blob);};
 form.onsubmit=async e=>{
  e.preventDefault();if(busy)return;clearErrors();
  const v=C.validateSpec({name:name.value,type:type.value,widthMm:w.value,depthMm:d.value,heightMm:h.value,rotationDeg:rot.value});
  const errors=v.ok?{}:{...v.errors};if(!pending)errors.photo=photo.files?.length?(fields.photo.err.textContent||tx('La foto no es válida.','The photo is not valid.','照片无效。')):tx('Elige una foto del mueble.','Choose a photo of the piece of furniture.','请选择家具的照片。');
  if(Object.keys(errors).length){showErrors(errors);status.textContent=tx('Revisa los campos marcados.','Check the marked fields.','请检查标记的字段。');return;}
  busy=true;createBtn.disabled=true;status.textContent=tx('Creando el mueble…','Creating the furniture…','正在创建家具…');
  // P0 · H-1: saving the bytes and committing the project that cites them run under the image collection's lock. The photo,
  // the measures and the room are fixed when «Crear» is pressed; the operation is re-checked before writing anything.
  const op=++createOp,shot=pending,spec={...v.spec,roomId:room.value||undefined},live=()=>op===createOp;
  let stored=false,res=null;
  try{
   await guarded(async()=>{if(!live())return;const release=window.FloorPlanImages?.pin?.(shot.meta.imageKey);
    try{stored=await storePhoto(shot);if(!live())return; // cancelada mientras se guardaban los bytes: nada entra en el proyecto
    res=app.addOwnFurniture(spec,(project,id)=>{
     const r=C.read(project);if(r.status==='future'||r.status==='invalid')return; // se conserva intacta: el mueble entra igual, sin anotar
     C.attach(project,id,stored?shot.meta:null);});
    }finally{release?.();}});
  }catch{
   if(live()){busy=false;createBtn.disabled=false;status.textContent=tx('No se ha podido crear el mueble: el almacenamiento de imágenes está ocupado. Vuelve a intentarlo.','The furniture could not be created: image storage is busy. Try again.','无法创建家具：图片存储正忙。请重试。');}
   return;
  }
  if(!res&&!live())return; // cancelada antes de confirmar: el formulario ya se cerró y el proyecto no cambió
  if(live()){busy=false;createBtn.disabled=false;}
  if(!res?.ok){if(live())status.textContent=res?.message?locPlace(res.message):tx('No se ha podido añadir el mueble: no hay sitio libre en esa estancia.','The furniture could not be added: there is no free space in that room.','无法添加家具：该房间没有空闲位置。');return;}
  if(dlg.open)dlg.close();if(live()){setPreview(null);pending=null;}
  // Como al añadir desde la biblioteca: en pantallas estrechas se cierran los cajones para ver el mueble en el plano.
  try{if(matchMedia('(max-width:1100px)').matches)closeDrawers();}catch{}
  const dimsText=`${v.spec.w} × ${v.spec.d} × ${v.spec.h} mm`;
  notify(tx(`Añadido «${v.spec.name}» · ${dimsText}${res.note||''}`,`Added "${v.spec.name}" · ${dimsText}${locPlace(res.note||'')}`,`已添加「${v.spec.name}」· ${dimsText}${locPlace(res.note||'')}`)+(stored?'':tx(' · No se ha podido guardar la foto en este navegador: el mueble se ha creado sin referencia fotográfica.',' · The photo could not be saved in this browser: the furniture was created without a photo reference.',' · 无法在此浏览器中保存照片：已创建家具但没有照片引用。')),stored?4500:8000);
 };

 // ── Panel del mueble: referencia fotográfica ────────────────────────────────────────────────────────────────────
 let panelUrl=null;
 const changeInput=el('input',{type:'file',accept:'image/jpeg,image/png,image/webp',id:'ownFurnChange',hidden:true,'aria-hidden':'true',tabindex:'-1'},document.body);
 let changeFor=null;
 changeInput.onchange=async()=>{const file=changeInput.files?.[0];const id=changeFor;changeInput.value='';if(!file||!id)return;
  const r=await processPhoto(file);if(!r.ok){notify(loc(r.message),6000);return;}
  let out,stored=true;
  try{await guarded(async()=>{const release=window.FloorPlanImages?.pin?.(r.meta.imageKey);
   try{if(!(stored=await storePhoto(r)))return;out=app.applyOwnFurniture(p=>({ok:true,project:C.attach(p,id,r.meta)}));}finally{release?.();}});
  }catch{notify(tx('No se ha podido cambiar la foto: el almacenamiento de imágenes está ocupado. Vuelve a intentarlo.','The photo could not be changed: image storage is busy. Try again.','无法更换照片：图片存储正忙。请重试。'),6000);return;}
  if(!stored){notify(tx('No se ha podido guardar la foto en este navegador.','The photo could not be saved in this browser.','无法在此浏览器中保存照片。'),6000);return;}notify(out?.ok?tx('Foto de referencia actualizada.','Reference photo updated.','参考照片已更新。'):tx('No se ha podido cambiar la foto.','The photo could not be changed.','无法更换照片。'));};
 function panel(container,objectId){
  if(panelUrl){URL.revokeObjectURL(panelUrl);panelUrl=null;}
  const project=app.project,first=C.photoStatus(project,objectId,true);
  if(first.state==='none')return;
  const body=container.querySelector('.panel-body');if(!body)return;
  const box=el('details',{class:'panel-group own-furn-panel','data-group':'own-furn',open:true});body.prepend(box);
  el('summary',{},box,tx('Tu mueble · foto de referencia','Your furniture · reference photo','你的家具 · 参考照片'));
  const o=project.objects.find(x=>x.id===objectId);
  if(o)el('p',{class:'own-furn-truth','data-own-dims':`${o.size.widthMm}x${o.size.depthMm}x${o.size.heightMm??''}`},box,tx(`Volumen genérico con tus medidas: ${o.size.widthMm} × ${o.size.depthMm} × ${o.size.heightMm??'—'} mm. No es una reconstrucción 3D de la foto.`,`Generic volume with your dimensions: ${o.size.widthMm} × ${o.size.depthMm} × ${o.size.heightMm??'—'} mm. It is not a 3D reconstruction of the photo.`,`带你的尺寸的通用体块：${o.size.widthMm} × ${o.size.depthMm} × ${o.size.heightMm??'—'} mm。不是照片的 3D 重建。`));
  const fig=el('figure',{class:'own-furn-photo'},box);const state=el('p',{class:'own-furn-photo-state',id:'ownFurnPhotoState',role:'status'},box);
  el('p',{class:'own-furn-help'},box,tx('La foto se guarda solo en este navegador: no viaja al exportar el proyecto ni a otros equipos.','The photo is stored only in this browser: it does not travel when the project is exported or to other computers.','照片仅保存在此浏览器中：导出项目或在其他设备上都不会随项目携带。'));
  const row=el('div',{class:'panel-foot-row'},box);
  const pick=label=>{const b=el('button',{type:'button',class:'btn',id:'ownFurnPick'},row,label);b.onclick=()=>{changeFor=objectId;changeInput.click();};};
  if(first.state==='unsupported'){state.textContent=loc(first.message);state.dataset.state='unsupported';return;}
  if(first.state==='not-stored'){state.textContent=loc(first.message);state.dataset.state='not-stored';pick(tx('Añadir foto','Add photo','添加照片'));return;}
  state.textContent=tx('Comprobando la foto…','Checking the photo…','正在检查照片…');state.dataset.state='checking';
  loadPhoto(first.photo.imageKey).then(blob=>{
   if(!box.isConnected)return;
   const st=C.photoStatus(app.project,objectId,!!blob);state.dataset.state=st.state;
   if(st.state==='ok'){panelUrl=URL.createObjectURL(blob);el('img',{src:panelUrl,alt:tx(`Foto de referencia de «${shown(o?.name||'')}»`,`Reference photo of "${shown(o?.name||'')}"`,`「${shown(o?.name||'')}」的参考照片`)},fig);state.textContent=tx(`Foto de referencia guardada en este navegador (${st.photo.widthPx}×${st.photo.heightPx} px, sin metadatos).`,`Reference photo stored in this browser (${st.photo.widthPx}×${st.photo.heightPx} px, without metadata).`,`参考照片已保存在此浏览器中（${st.photo.widthPx}×${st.photo.heightPx} px，不含元数据）。`);}
   else state.textContent=loc(st.message||'');
   pick(st.state==='ok'?tx('Cambiar foto','Change photo','更换照片'):tx('Volver a elegir la foto','Choose the photo again','重新选择照片'));
   const rm=el('button',{type:'button',class:'btn',id:'ownFurnRemovePhoto'},row,tx('Quitar foto','Remove photo','移除照片'));
   rm.onclick=()=>{const out=app.applyOwnFurniture(p=>({ok:true,project:C.attach(p,objectId,null)}));notify(out?.ok?tx('Foto quitada: el mueble y sus medidas no cambian.','Photo removed: the furniture and its dimensions do not change.','已移除照片：家具及其尺寸不变。'):tx('No se ha podido quitar la foto.','The photo could not be removed.','无法移除照片。'));};
  });
 }
 document.addEventListener('rubik:languagechange',relabel);
 window.RubikOwnFurniture={panel,open,processPhoto};
})();
