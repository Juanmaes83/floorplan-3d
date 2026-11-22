/* RUBIK SOTA · M03 · «Entregar → Escena para Blender → Revisar render…» (interfaz).
   La persona elige la carpeta resultados/<perfil> que creó el kit del ZIP. RUBIK lee SÓLO los informes y las imágenes
   (nunca el .blend), comprueba que es un render completo de este proyecto y de esta escena, lo compara con la vista de
   RUBIK y prepara la entrega: originales limpios byte a byte, copias de presentación con el contrato existente
   (FloorPlanDeliveryImage + «Firmar con» de FloorPlanBrandUI, sin datos de contacto), comparación e informes. Todo en
   este navegador: nada se envía ni se guarda; el proyecto no cambia. Estados: inicial · leyendo · revisado · componiendo
   · lista · error · cancelada. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,R=window.RubikBlenderReviewCore,D=window.RubikSceneDelivery;if(!app||!R||!D)return;
 const lang=()=>typeof LANG==='string'?LANG:'es',tx=(es,en,zh)=>({es,en,zh})[lang()]||es;
 const el=(tag,attrs,parent,text)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(attrs||{}))n.setAttribute(k,v);if(text!=null)n.textContent=text;parent?.append(n);return n;};
 const hex=b=>[...new Uint8Array(b)].map(n=>n.toString(16).padStart(2,'0')).join(''),digest=async bytes=>hex(await crypto.subtle.digest('SHA-256',bytes));
 const roomLabel=r=>{try{if(typeof roomDisplay==='function')return roomDisplay(r);}catch{}return window.FloorPlanDisplayName?window.FloorPlanDisplayName(r.name,'room'):r.id;};
 const visible=(value,type)=>{const label=window.FloorPlanDisplayName?.(String(value??''),type)||String(value??'');return lang()!=='zh'&&/[㐀-鿿]/.test(label)?'':label;};
 const NEEDED=new Set([R.REPORT,R.MANIFEST,R.REFERENCE,R.REOPEN,R.ROOMS]),MAX_FILE=64*1024*1024,MAX_JSON=2*1024*1024;

 const dlg=el('dialog',{id:'blenderReviewDialog',class:'scene-export-dialog blender-review','aria-labelledby':'brTitle','aria-describedby':'brLead'},document.body);
 const wrap=el('div',{class:'scene-export'},dlg),head=el('div',{class:'se-head'},wrap),title=el('h2',{id:'brTitle'},head);
 const lead=el('p',{id:'brLead',class:'se-lead'},wrap),status=el('p',{id:'brStatus',class:'se-status',role:'status','aria-live':'polite'},wrap),detail=el('div',{class:'se-detail'},wrap);
 const actions=el('div',{class:'se-actions'},wrap),primary=el('button',{type:'button',class:'btn primary',id:'brPrimary'},actions),secondary=el('button',{type:'button',class:'btn',id:'brSecondary'},actions);
 const picker=el('input',{type:'file',id:'brFolder',multiple:'',webkitdirectory:'',hidden:''},wrap),pickerFiles=el('input',{type:'file',id:'brFiles',multiple:'',accept:'.png,.json',hidden:''},wrap);
 const originalPicker=el('input',{type:'file',id:'brOriginal',accept:'.json',hidden:''},wrap);
 let state='idle',checked=null,files=null,urls=[],delivery=null,abort=null,error=null,blendBytes=0,originalSha=null,scope=null,generation=0,brandId=null;
 const revoke=()=>{for(const u of urls)URL.revokeObjectURL(u);urls=[];};
 const blobUrl=b=>{const u=URL.createObjectURL(new Blob([b],{type:'image/png'}));urls.push(u);return u;};
 const levelId=()=>app.levelContext?.activeLevelId??null;
 const scopeKey=()=>JSON.stringify([app.entryId,levelId(),D.canonical(app.project)]);
 const textError=code=>R.explain({code},lang());
 function reset(code){
  ++generation;abort?.abort();abort=null;revoke();checked=files=delivery=originalSha=scope=brandId=null;blendBytes=0;
  error=code?textError(code):null;state=code?'error':'idle';if(dlg.open)render();
 }
 function current(){
  if(scope!==null&&scope!==scopeKey()){reset('PROJECT_CHANGED');return false;}
  return true;
 }

 async function read(list){
  const m=new Map(),names=new Set();let total=0,images=0,editable=0;
  for(const f of list){
   const n=f.name;if(n==='review.blend'){editable=f.size;continue;}
   if(!(NEEDED.has(n)||/^[A-Za-z0-9_-]{1,64}\.png$/.test(n))||n.startsWith('_'))continue;
   if(names.has(n))throw Error(textError('DUPLICATE_FILES'));
   names.add(n);total+=f.size;if(n.endsWith('.png'))images++;
   if(f.size>(n.endsWith('.json')?MAX_JSON:MAX_FILE)||total>192*1024*1024||images>33)throw Error(textError('FILE_LIMIT'));
  }
  for(const f of list)if(names.has(f.name))m.set(f.name,new Uint8Array(await f.arrayBuffer()));
  return {files:m,editable};
 }
 async function load(list){
  if(!current())return;
  if(!originalSha){state='error';error=textError('OTHER_CAPTURE');render();return;}
  const token=++generation,project=app.project,capturedLevel=levelId(),anchor=originalSha;
  revoke();checked=files=delivery=null;error=null;state='reading';render();
  try{
   const [input,projectSha]=await Promise.all([read(list),digest(new TextEncoder().encode(D.canonical(project)))]);
   const labels=Object.fromEntries((project.rooms||[]).map(r=>[r.id,roomLabel(r)]));
   const verified=await R.verify({files:input.files,digest,project,projectSha,labels,originalManifestSha:anchor,levelId:capturedLevel});
   if(token!==generation||!current())return;
   if(verified.canDeliver){
    const images=verified.views.map(v=>input.files.get(v.file));
    if(verified.hasReference)images.push(input.files.get(R.REFERENCE));
    for(const bytes of images){
     try{(await createImageBitmap(new Blob([bytes],{type:'image/png'}))).close();}
     catch{throw Error(textError('ALTERED_IMAGE'));}
     if(token!==generation||!current())return;
    }
   }
   files=input.files;blendBytes=input.editable;checked=verified;
   if(!checked.canDeliver)checked.views=[];state='checked';
  }catch(e){if(token!==generation||!current())return;error=e.message||String(e);state='error';}
  render();(primary.hidden?secondary:primary).focus({preventScroll:true});
 }
 originalPicker.onchange=async()=>{
  const selected=originalPicker.files[0];originalPicker.value='';if(!selected)return;
  reset();const token=generation;scope=scopeKey();
  try{
   if(selected.name!==R.MANIFEST||selected.size>MAX_JSON)throw Error(textError('OTHER_CAPTURE'));
   const sha=await digest(await selected.arrayBuffer());
   if(token!==generation||!current())return;originalSha=sha;
  }catch(e){if(token!==generation||!current())return;error=e.message;state='error';}
  render();primary.focus({preventScroll:true});
 };
 function render(){
  title.textContent=tx('Revisar render de Blender','Review Blender render','审阅 Blender 渲染');
  lead.textContent=tx('Primero elige manifest.json del ZIP original. Después elige resultados/<perfil>, la carpeta que creó Blender. La revisión se hace en este navegador y tu proyecto sigue intacto.','First choose manifest.json from the original ZIP. Then choose resultados/<profile>, the folder Blender created. Review stays in this browser and your project is unchanged.','先选择原始 ZIP 中的 manifest.json，再选择 Blender 生成的 resultados/<配置> 文件夹。审阅在此浏览器中进行，项目不会更改。');
  revoke();detail.replaceChildren();primary.hidden=secondary.hidden=false;primary.disabled=false;dlg.dataset.state=state;
  secondary.textContent=tx('Cerrar','Close','关闭');secondary.onclick=()=>dlg.close();
  if(state==='idle'||state==='error'){
   status.textContent=state==='error'?error:tx('Aún no has elegido ninguna carpeta.','No folder chosen yet.','尚未选择文件夹。');
   if(!originalSha){
    primary.textContent=tx('Elegir manifiesto original…','Choose original manifest…','选择原始清单…');primary.onclick=()=>originalPicker.click();
   }else{
    primary.textContent=tx('Elegir carpeta de resultados…','Choose results folder…','选择结果文件夹…');primary.onclick=()=>picker.click();
   }
  }else if(state==='reading'){
   status.textContent=tx('Leyendo y comprobando las imágenes…','Reading and checking the images…','正在读取并检查图像…');primary.hidden=true;
  }else if(state==='checked'){
   const c=checked;
   c.views=R.paths(c.views.map(v=>{const room=(app.project.rooms||[]).find(r=>r.id===v.view);return {...v,label:room?roomLabel(room):v.view};}),lang());
   const errors=c.issues.filter(i=>i.severity==='error'),warnings=c.issues.filter(i=>i.severity==='warning');
   status.textContent=c.canDeliver?tx(`Render comprobado: ${c.views.length} imágenes de este proyecto, sin alteraciones.`,`Render checked: ${c.views.length} images of this project, unaltered.`,`渲染已检查：本项目 ${c.views.length} 张图像，未被修改。`)
    :tx('El render no se puede entregar todavía.','The render cannot be delivered yet.','该渲染暂时无法交付。');
   if(c.issues.length){const ul=el('ul',{class:'br-issues',id:'brIssues'},detail);for(const i of [...errors,...warnings]){const li=el('li',{'data-severity':i.severity,'data-code':i.code},ul,R.explain(i,lang()));}}
   if(c.report){const r=c.report,dl=el('dl',{class:'se-summary'},detail);
    for(const[k,v]of [[tx('Blender','Blender','Blender'),r.blender],[tx('Motor','Engine','引擎'),r.renderer],[tx('Perfil','Profile','配置'),r.profile],[tx('Escena editable','Editable scene','可编辑场景'),blendBytes?tx('review.blend en la carpeta','review.blend in the folder','文件夹中的 review.blend'):tx('review.blend (no elegido)','review.blend (not chosen)','review.blend（未选择）')]]){el('dt',{},dl,k);el('dd',{},dl,visible(v));}}
   const viewer=c.views.find(v=>v.view==='viewer'),ref=files.get(R.REFERENCE);
   if(viewer&&ref){const cmp=el('figure',{class:'br-compare',id:'brCompare'},detail);const a=el('div',{},cmp),b=el('div',{},cmp);
    el('img',{src:blobUrl(ref),alt:tx('Vista 3D de RUBIK','RUBIK 3D view','RUBIK 3D 视图')},a);el('span',{},a,tx('RUBIK · vista 3D','RUBIK · 3D view','RUBIK · 3D 视图'));
    el('img',{src:blobUrl(files.get(viewer.file)),alt:tx('Render Blender Cycles con la misma cámara','Blender Cycles render with the same camera','相同相机的 Blender Cycles 渲染')},b);el('span',{},b,tx('Blender Cycles · misma cámara','Blender Cycles · same camera','Blender Cycles · 相同相机'));}
   const gal=el('ul',{class:'br-gallery',id:'brGallery'},detail);
   for(const v of c.views){const li=el('li',{},gal);el('img',{src:blobUrl(files.get(v.file)),alt:v.title,loading:'lazy'},li);el('span',{},li,`${v.title} · ${v.width}×${v.height}`);}
   const diff=el('div',{class:'br-diff',id:'brDiff'},detail);el('p',{class:'se-paths-title'},diff,tx('Qué es del proyecto y qué se ha añadido para el render:','What comes from the project and what was added for the render:','哪些来自项目、哪些为渲染添加：'));
   const ul=el('ul',{},diff);for(const d of R.differences(c,lang())){const li=el('li',{'data-kind':d.kind},ul);el('strong',{},li,{kept:tx('Del proyecto: ','From the project: ','来自项目：'),added:tx('Añadido: ','Added: ','添加：'),missing:tx('No representado: ','Not represented: ','未体现：')}[d.kind]);li.append(d.text);}
   if(c.canDeliver){
    const brandUI=window.FloorPlanBrandUI,brand=window.FloorPlanBrand;
    if(brandUI&&brand){
     const box=el('div',{class:'br-sign',id:'brSign'},detail);
     const label=el('label',{class:'brand-sign'},box);el('span',{},label,tx('Firmar con','Sign with','签名'));
     const select=el('select',{class:'brand-select'},label);
     el('option',{value:''},select,tx('Sin marca','No brand','无品牌'));
     for(const profile of brand.readProfiles(brandUI.store).profiles)el('option',{value:profile.id},select,visible(profile.name)||tx('Estudio','Studio','工作室'));
     select.value=brandId??brandUI.snapshot()?.profile?.id??'';
     if(select.selectedIndex<0)select.value='';
     select.addEventListener('change',()=>{brandId=select.value;});
     el('p',{class:'se-note'},box,tx('Las copias de presentación llevan el nombre y el logo del estudio elegido, nunca teléfono, correo ni persona. Los originales no se tocan.','Presentation copies carry the chosen studio name and logo, never phone, e-mail or person. Originals are untouched.','展示副本带有所选工作室的名称和标志，不含电话、邮箱或个人。原图不会更改。'));
    }
    primary.textContent=tx('Preparar entrega','Prepare delivery','准备交付');primary.onclick=compose;}
   else{primary.textContent=tx('Elegir otros resultados…','Choose other results…','选择其他结果…');primary.onclick=()=>picker.click();}
  }else if(state==='composing'){
   primary.hidden=true;secondary.textContent=tx('Cancelar','Cancel','取消');secondary.onclick=()=>abort?.abort();
  }else if(state==='ready'){
   status.textContent=tx(`Entrega lista: ${delivery.count} archivos (${(delivery.bytes.size/1048576).toFixed(1)} MB). El proyecto no se ha modificado.`,`Delivery ready: ${delivery.count} files (${(delivery.bytes.size/1048576).toFixed(1)} MB). The project was not modified.`,`交付已就绪：${delivery.count} 个文件（${(delivery.bytes.size/1048576).toFixed(1)} MB）。项目未被修改。`);
   const ul=el('ul',{class:'se-facts',id:'brContents'},detail);for(const t of [tx('originales/ · los PNG de Cycles sin modificar','originales/ · the Cycles PNGs unmodified','originales/ · 未修改的 Cycles PNG'),tx('presentacion/ · copias para el cliente','presentacion/ · client copies','presentacion/ · 客户副本')+(delivery.brand?` (${delivery.brand.name})`:tx(' (sin marca)',' (no brand)','（无品牌）')),...(checked.hasReference?[tx('comparacion/ · RUBIK frente a Cycles','comparacion/ · RUBIK versus Cycles','comparacion/ · RUBIK 与 Cycles 对比')]:[]),tx('informes/ y entrega.json · procedencia y huellas','informes/ and entrega.json · provenance and fingerprints','informes/ 和 entrega.json · 来源和指纹')])el('li',{},ul,t);
   primary.textContent=tx('Descargar entrega (ZIP)','Download delivery (ZIP)','下载交付（ZIP）');primary.onclick=download;secondary.textContent=tx('Volver a revisar','Review again','重新审阅');secondary.onclick=()=>{state='checked';render();};
  }else if(state==='cancelled'){
   status.textContent=tx('Preparación cancelada. No se ha generado nada.','Preparation cancelled. Nothing was generated.','已取消准备，未生成任何内容。');primary.textContent=tx('Preparar entrega','Prepare delivery','准备交付');primary.onclick=compose;
  }
  if(originalSha&&(state==='idle'||state==='error'||state==='checked')){
   if(!checked?.canDeliver){
    const alt=el('button',{type:'button',class:'btn link',id:'brPickFiles'},detail,tx('Elegir archivos de resultados','Choose result files','选择结果文件'));alt.onclick=()=>pickerFiles.click();
   }
   const change=el('button',{type:'button',class:'btn link'},detail,tx('Cambiar manifiesto original','Change original manifest','更换原始清单'));change.onclick=()=>originalPicker.click();
  }
 }
 const dataUrl=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(new Blob([b],{type:'image/png'}));});
 const bytesOf=async url=>new Uint8Array(await (await fetch(url)).arrayBuffer());
 async function comparison(ref,cycles){
  const [a,b]=await Promise.all([ref,cycles].map(x=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(new Blob([x],{type:'image/png'}));})));
  const w=1600,h=Math.round(w/2*Math.max(a.height/a.width,b.height/b.width)),band=56,c=document.createElement('canvas');c.width=w;c.height=h+band;const g=c.getContext('2d');
  g.fillStyle='#f3f4f4';g.fillRect(0,0,c.width,c.height);for(const[i,img]of [a,b].entries()){const s=Math.min(w/2/img.width,h/img.height),dw=img.width*s,dh=img.height*s;g.drawImage(img,i*w/2+(w/2-dw)/2,(h-dh)/2,dw,dh);URL.revokeObjectURL(img.src);}
  g.fillStyle='#1f2326';g.font='600 22px system-ui,sans-serif';g.fillText(tx('RUBIK · vista 3D','RUBIK · 3D view','RUBIK · 3D 视图'),20,h+36);g.fillText(tx('Blender Cycles · misma cámara','Blender Cycles · same camera','Blender Cycles · 相同相机'),w/2+20,h+36);
  return new Uint8Array(await (await new Promise(r=>c.toBlob(r,'image/png'))).arrayBuffer());
 }
 async function compose(){
  if(!current()||!checked?.canDeliver)return;abort=new AbortController();const {signal}=abort,token=generation,input=files,verified=checked;state='composing';render();
  try{
   const brandUI=window.FloorPlanBrandUI,snap=brandUI?.snapshot()||null;
   const p=brandId===null?snap?.profile:window.FloorPlanBrand?.readProfiles(brandUI.store).profiles.find(profile=>profile.id===brandId);
   const brand=p?.name?{name:visible(p.name)||tx('Estudio','Studio','工作室'),logo:p.logo||null}:null;
   // Título visible: nunca chino en ES/EN (regla de idioma). Los nombres guardados pueden estarlo (proyecto de ejemplo, fixtures).
   const projectTitle=visible(snap?.title||app.project.name)||tx('Proyecto','Project','项目');
   const entries=new Map(),views=verified.views;
   for(const[i,v]of views.entries()){
    if(signal.aborted)throw Object.assign(Error('cancelled'),{code:'CANCELLED'});
    status.textContent=tx(`Componiendo ${i+1}/${views.length}: ${v.title}…`,`Composing ${i+1}/${views.length}: ${v.title}…`,`正在合成 ${i+1}/${views.length}：${v.title}…`);
    const original=input.get(v.file);entries.set(v.original,original);
    const data=FloorPlanDeliveryImage.content({title:projectTitle,view:tx('Render Blender · ','Blender render · ','Blender 渲染 · ')+v.title,rooms:[],brand:brand?{name:brand.name,logo:brand.logo,contact:''}:null});
    data.note=tx('Render Cycles de la escena de RUBIK · cámaras interiores y luz de relleno añadidas para el render','Cycles render of the RUBIK scene · interior cameras and fill light added for the render','RUBIK 场景的 Cycles 渲染 · 为渲染添加了室内相机和补光');
    const out=await FloorPlanDeliveryImage.compose({image:await dataUrl(original),format:'landscape',layout:'band',data});
    entries.set(v.presentation,await bytesOf(out.dataUrl));v.presentationPath=v.presentation;await new Promise(r=>setTimeout(r));
   }
   const viewer=views.find(v=>v.view==='viewer'),ref=input.get(R.REFERENCE);
   if(viewer&&ref)entries.set('comparacion/rubik-vs-cycles.png',await comparison(ref,input.get(viewer.file)));
   for(const n of [R.REPORT,R.MANIFEST,R.REOPEN,R.ROOMS])if(input.get(n))entries.set('informes/'+n,input.get(n));
   entries.set('LEEME-ENTREGA.txt',new TextEncoder().encode(R.readme({verified,brand,lang:lang()})));
   const manifest=await R.deliveryManifest({verified,entries,digest,project:app.project,brand,createdAt:new Date().toISOString(),lang:lang()});
   entries.set('entrega.json',new TextEncoder().encode(JSON.stringify(manifest,null,1)+'\n'));
   if(signal.aborted)throw Object.assign(Error('cancelled'),{code:'CANCELLED'});
   if(token!==generation||!current())return;
   const zip=window.FloorPlanPackage.zip(entries,{check:R.checkName});
   delivery={bytes:new Blob([zip],{type:'application/zip'}),count:entries.size,brand,name:`rubik-entrega-blender-${D.safeName(app.project.id)}.zip`,manifest};state='ready';
  }catch(e){if(token!==generation||!current())return;if(e.code==='CANCELLED')state='cancelled';else{error=e.message||String(e);state='error';}}
  finally{if(token===generation)abort=null;}
  render();primary.focus({preventScroll:true});
 }
 function download(){if(!current()||!delivery)return;const url=URL.createObjectURL(delivery.bytes),a=el('a',{href:url,download:delivery.name},document.body);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent=tx('Descarga iniciada: ','Download started: ','已开始下载：')+delivery.name;}
 picker.onchange=()=>{if(picker.files.length)load([...picker.files]);picker.value='';};
 pickerFiles.onchange=()=>{if(pickerFiles.files.length)load([...pickerFiles.files]);pickerFiles.value='';};
 dlg.addEventListener('cancel',e=>{if(state==='composing'){e.preventDefault();abort?.abort();}});
 dlg.addEventListener('close',()=>{abort?.abort();});
 for(const event of ['floorplan-project-switched','floorplan-level-switched'])window.addEventListener(event,()=>{if(scope!==null)reset('PROJECT_CHANGED');});
 function open(){current();if(state==='composing')return;render();dlg.showModal();(primary.hidden?secondary:primary).focus({preventScroll:true});}
 window.RubikBlenderReview=Object.freeze({open,load,get state(){current();return state;},get checked(){return current()&&checked&&{canDeliver:checked.canDeliver,issues:checked.issues,views:checked.views.map(v=>({view:v.view,title:v.title,width:v.width,height:v.height,sha256:v.sha256}))};},
  get delivery(){return current()&&delivery&&{name:delivery.name,count:delivery.count,size:delivery.bytes.size,brand:delivery.brand,manifest:delivery.manifest};},bytes:async()=>current()&&delivery&&new Uint8Array(await delivery.bytes.arrayBuffer())});
})();
