/* CAT-01 + FOT-01 visual · «Entregar → Estudio de imágenes» (interfaz). Recorrido: imagen de partida (foto sin
   metadatos) → receta PromptRecipeV1 → zona revisable (rectángulos dibujados con ratón o dedo, o atajos de teclado) →
   conservar / cambiar → 1–3 referencias de «Mis catálogos» con permiso de referencia → intensidad Fiel / Equilibrado /
   Creativo y 1 o 3 opciones → coste: la generación real está BLOQUEADA (STOP_GASTO: photo-reform/1 cerrado) y la
   simulación local no tiene coste («no aplica», nunca 0 ficticio) → consentimiento → alternativas → comparar →
   revisión de fidelidad (medida automática fuera de la zona + huecos y geometría) → aceptar o rechazar → ficha.
   Una simulación nunca se descarga como imagen ni se entrega. El proyecto no se toca. Nada sale del navegador. */
(function(){
 'use strict';
 const V=window.RubikVisualReform,PC=window.RubikPhotoReformCore,CP=window.RubikCatalogProduct,P=window.RubikPhotoReformProvider;if(!V||!PC||!CP)return;
 const lang=()=>typeof LANG==='string'&&['es','en','zh'].includes(LANG)?LANG:'es';
 const tx=(es,en,zh)=>({es,en,zh})[lang()]||es;const lab=o=>o?.[lang()]||o?.es||'';
 const el=(tag,attrs={},parent,text)=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs))if(v!==undefined&&v!==null&&v!==false)n.setAttribute(k,v===true?'':v);if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 const storage=(()=>{try{const s=window.localStorage;s.getItem('x');return s;}catch{return {getItem:()=>null,setItem(){},removeItem(){}};}})();
 const CFG=P?P.config():{configured:false};

 const dlg=el('dialog',{id:'visualStudioDialog',class:'visual-studio-dialog','aria-labelledby':'vsTitle'},document.body);
 const wrap=el('div',{class:'visual-studio'},dlg);const head=el('div',{class:'vs-head'},wrap);const title=el('h2',{id:'vsTitle'},head);const closeBtn=el('button',{type:'button',class:'btn',id:'vsClose'},head);
 const truth=el('p',{class:'vs-truth',id:'vsTruth'},wrap);
 const step=(id)=>{const s=el('section',{class:'vs-step','aria-labelledby':id+'T',id},wrap);const h=el('h3',{id:id+'T'},s);return [s,h];};
 // 1 · Imagen de partida
 const [s1,h1]=step('vsStep1');const file=el('input',{type:'file',id:'vsFile',accept:'image/jpeg,image/png,image/webp'},s1);const fileHelp=el('small',{},s1);const fileErr=el('p',{id:'vsFileError',class:'vs-error',role:'alert'},s1);
 const stage=el('div',{class:'vs-stage',id:'vsStage',hidden:true},s1);const stageCanvas=el('canvas',{id:'vsStageCanvas','aria-describedby':'vsMaskHelp'},stage);const maskHelp=el('small',{id:'vsMaskHelp'},s1);
 // 2 · Receta, zona, intensidad, opciones
 const [s2,h2]=step('vsStep2');const rRow=el('div',{class:'vs-row'},s2);
 const field=(parent,id)=>{const l=el('label',{class:'vs-field'},parent);const t=el('span',{},l);const sel=el('select',{id},l);return [t,sel];};
 const [recipeT,recipeSel]=field(rRow,'vsRecipe'),[zoneT,zoneSel]=field(rRow,'vsZone'),[altT,altSel]=field(rRow,'vsAlternatives');
 const intensity=el('fieldset',{class:'vs-intensity',id:'vsIntensity'},s2);const intensityLegend=el('legend',{},intensity);
 // 3 · Zona revisable
 const [s3,h3]=step('vsStep3');const presets=el('div',{class:'vs-row'},s3);const maskList=el('ul',{id:'vsMaskList',class:'vs-mask-list'},s3);const clearMask=el('button',{type:'button',class:'btn',id:'vsMaskClear'},s3);
 // 4 · Conservar / cambiar
 const [s4,h4]=step('vsStep4');const keep=el('div',{class:'vs-keep',id:'vsKeep'},s4);const changeNote=el('p',{id:'vsChangeNote',class:'vs-note'},s4);
 // 5 · Referencias del catálogo
 const [s5,h5]=step('vsStep5');const refNote=el('p',{id:'vsRefNote',class:'vs-note'},s5);const refList=el('ul',{id:'vsRefList',class:'vs-ref-list'},s5);const openCat=el('button',{type:'button',class:'btn',id:'vsOpenCatalogs'},s5);
 // 6 · Coste, consentimiento, generar
 const [s6,h6]=step('vsStep6');const cost=el('div',{id:'vsCost',class:'vs-cost',role:'note'},s6);
 const consentL=el('label',{class:'vs-consent'},s6);const consent=el('input',{type:'checkbox',id:'vsConsent'},consentL);const consentT=el('span',{},consentL);
 const [scnT,scenario]=field(s6,'vsScenario');const actions=el('div',{class:'vs-actions'},s6);
 const realBtn=el('button',{type:'button',class:'btn',id:'vsReal',disabled:true,'aria-describedby':'vsCost'},actions),simBtn=el('button',{type:'button',class:'btn primary',id:'vsSimulate'},actions),cancelBtn=el('button',{type:'button',class:'btn',id:'vsCancel',hidden:true},actions);
 const status=el('p',{id:'vsStatus',class:'vs-status',role:'status','aria-live':'polite'},s6);
 // 7 · Resultados, comparación y revisión
 const [s7,h7]=step('vsStep7');s7.hidden=true;const alts=el('div',{id:'vsAlts',class:'vs-alts'},s7);
 const cmp=el('figure',{id:'vsCompare',class:'vs-compare'},s7);const cmpA=el('canvas',{id:'vsCmpBefore'},cmp),cmpB=el('canvas',{id:'vsCmpAfter'},cmp);const cmpTag=el('span',{class:'vs-tag',id:'vsCmpTag'},cmp);
 const slider=el('input',{type:'range',min:'0',max:'100',value:'50',id:'vsSlider'},s7);
 const auto=el('p',{id:'vsAuto',class:'vs-auto'},s7);
 const review=el('fieldset',{id:'vsReview',class:'vs-review'},s7);const reviewLegend=el('legend',{},review);
 const yesNo=(name,parent)=>{const row=el('div',{class:'vs-yesno',role:'radiogroup'},parent);const t=el('span',{},row);const opts={};for(const v of ['yes','no']){const l=el('label',{},row);opts[v]=el('input',{type:'radio',name,id:`${name}-${v}`,value:v},l);el('span',{},l);}return {row,t,opts};};
 const qOpen=yesNo('vsOpenings',review),qGeo=yesNo('vsGeometry',review);
 const matchRow=el('div',{class:'vs-yesno'},review);const matchT=el('span',{},matchRow);const matchSel=el('select',{id:'vsMatch'},matchRow);
 const verdict=el('p',{id:'vsVerdict',class:'vs-verdict',role:'status','aria-live':'polite'},s7);
 const ractions=el('div',{class:'vs-actions'},s7);
 const acceptBtn=el('button',{type:'button',class:'btn primary',id:'vsAccept',disabled:true},ractions),rejectBtn=el('button',{type:'button',class:'btn',id:'vsReject'},ractions),dlImg=el('button',{type:'button',class:'btn',id:'vsDownloadImage',disabled:true},ractions),
  dlSheet=el('button',{type:'button',class:'btn',id:'vsSheet',disabled:true},ractions),discardBtn=el('button',{type:'button',class:'btn',id:'vsDiscard'},ractions);
 const decisionNote=el('p',{id:'vsDecision',class:'vs-note'},s7);

 let src=null,mask=[],refs=[],results=[],selected=0,abort=null,sheet=null,drawing=null,lastRatios=null;
 const recipeNow=()=>V.recipe(recipeSel.value)||V.RECIPES[0];
 function catalogs(){try{const id=window.RubikCatalogUI?.studioId||'local';return CP.loadCatalogs(storage,id);}catch{return [];}}
 function labels(){
  title.textContent=tx('Estudio de imágenes','Image studio','图像工作室');closeBtn.textContent=tx('Cerrar','Close','关闭');
  truth.textContent=tx('Propuesta visual ILUSTRATIVA sobre una imagen: no mide, no cambia tu proyecto y un parecido no certifica el producto (SKU). La generación real está bloqueada hasta aprobar el gasto; aquí puedes probar el recorrido con una simulación local rotulada.','ILLUSTRATIVE visual proposal on an image: it does not measure, does not change your project and a resemblance does not certify the product (SKU). Real generation is blocked until spending is approved; here you can try the journey with a labelled local simulation.','图像上的示意性视觉方案：不测量、不修改项目，相似不代表产品（SKU）一致。真实生成在批准费用前被锁定；此处可用标注的本地模拟体验流程。');
  h1.textContent=tx('1 · Imagen de partida','1 · Source image','1 · 源图像');fileHelp.textContent=tx('JPEG, PNG o WebP · hasta 10 MB. Se eliminan los metadatos (EXIF, ubicación); no se guarda.','JPEG, PNG or WebP · up to 10 MB. Metadata (EXIF, location) is removed; nothing is stored.','JPEG、PNG 或 WebP · 最大 10 MB。移除元数据，不保存。');
  maskHelp.textContent=tx('Dibuja la zona que se puede cambiar arrastrando sobre la imagen (ratón o dedo), o usa los atajos del paso 3.','Draw the zone that may change by dragging on the image (mouse or finger), or use the shortcuts in step 3.','在图像上拖动绘制可修改区域，或使用第 3 步快捷方式。');
  h2.textContent=tx('2 · Receta, zona e intensidad','2 · Recipe, zone and intensity','2 · 配方、区域与强度');recipeT.textContent=tx('Receta','Recipe','配方');zoneT.textContent=tx('Qué se cambia','What changes','修改内容');altT.textContent=tx('Opciones','Options','方案数');intensityLegend.textContent=tx('Intensidad','Intensity','强度');
  h3.textContent=tx('3 · Zona revisable','3 · Reviewable zone','3 · 可审核区域');clearMask.textContent=tx('Borrar zonas','Clear zones','清除区域');
  h4.textContent=tx('4 · Conservar y cambiar','4 · Keep and change','4 · 保留与修改');h5.textContent=tx('5 · Referencias del catálogo (1–3)','5 · Catalogue references (1–3)','5 · 目录参考（1–3）');openCat.textContent=tx('Abrir Mis catálogos','Open My catalogues','打开我的目录');
  h6.textContent=tx('6 · Coste y consentimiento','6 · Cost and consent','6 · 费用与同意');consentT.textContent=tx(' Entiendo que el resultado es ilustrativo y no medible, y consiento procesar esta imagen.',' I understand the result is illustrative and not measurable, and I consent to process this image.',' 我理解结果仅为示意且不可测量，并同意处理此图像。');
  scnT.textContent=tx('Escenario de la simulación','Simulation scenario','模拟场景');
  realBtn.textContent=tx('Generar con proveedor real','Generate with real provider','使用真实服务生成');simBtn.textContent=tx('Probar con simulación','Try with simulation','模拟试用');cancelBtn.textContent=tx('Cancelar','Cancel','取消');
  h7.textContent=tx('7 · Comparar y revisar','7 · Compare and review','7 · 对比与审核');slider.setAttribute('aria-label',tx('Comparar original y resultado','Compare original and result','对比原图与结果'));
  reviewLegend.textContent=tx('Revisión de fidelidad','Fidelity review','保真审核');qOpen.t.textContent=tx('Ventanas, puertas y huecos intactos','Windows, doors and openings intact','门窗洞口完好');qGeo.t.textContent=tx('Geometría intacta (muros, perspectiva, volúmenes)','Geometry intact (walls, perspective, volumes)','几何完好');
  for(const q of [qOpen,qGeo]){q.opts.yes.nextSibling.textContent=tx('Sí','Yes','是');q.opts.no.nextSibling.textContent=tx('No','No','否');}
  matchT.textContent=tx('Parecido con la referencia (no certifica el SKU)','Resemblance to the reference (does not certify the SKU)','与参考相似度（不认证 SKU）');
  acceptBtn.textContent=tx('Aceptar','Accept','接受');rejectBtn.textContent=tx('Rechazar','Reject','拒绝');dlImg.textContent=tx('Descargar imagen','Download image','下载图像');dlSheet.textContent=tx('Descargar ficha (JSON)','Download sheet (JSON)','下载资料（JSON）');discardBtn.textContent=tx('Descartar','Discard','丢弃');
  const opts=(sel,items)=>{const v=sel.value;sel.replaceChildren();for(const[val,t]of items)el('option',{value:val},sel,t);if([...sel.options].some(o=>o.value===v))sel.value=v;};
  opts(recipeSel,V.RECIPES.map(r=>[r.id,lab(r.title)]));opts(scenario,[['ok',tx('Correcta','Correct','正常')],['slow',tx('Lenta (para cancelar)','Slow (to cancel)','缓慢（可取消）')],['error',tx('Error del proveedor','Provider error','服务错误')],['drift',tx('Deriva: borra una ventana','Drift: erases a window','偏移：抹去窗户')]]);
  opts(matchSel,[['not-assessable',tx('No evaluable','Not assessable','无法评估')],['similar',tx('Parecido','Similar','相似')],['different',tx('Distinto','Different','不同')]]);
  presets.replaceChildren();for(const[id,rect,t]of [['vsPresetRight',[0.5,0.25,0.45,0.6],tx('Mitad derecha','Right half','右半部分')],['vsPresetLeft',[0.05,0.25,0.45,0.6],tx('Mitad izquierda','Left half','左半部分')],['vsPresetBottom',[0,0.67,1,0.33],tx('Tercio inferior','Bottom third','下三分之一')],['vsPresetCenter',[0.3,0.3,0.4,0.4],tx('Centro','Centre','中央')]]){const b=el('button',{type:'button',class:'btn',id},presets,t);b.onclick=()=>{addRect(rect);};}
 }
 function fillRecipe(){const r=recipeNow();const z=zoneSel.value;zoneSel.replaceChildren();for(const id of r.zones)el('option',{value:id},zoneSel,lab(V.ZONES[id].label));if(r.zones.includes(z))zoneSel.value=z;
  const a=altSel.value;altSel.replaceChildren();for(const n of r.outputs)el('option',{value:String(n)},altSel,String(n));altSel.value=r.outputs.includes(+a)?a:'1';
  const cur=intensity.querySelector('input:checked')?.value;intensity.querySelectorAll('label').forEach(n=>n.remove());
  for(const id of r.intensities){const l=el('label',{},intensity);const i=el('input',{type:'radio',name:'vsIntensity',value:id,id:'vsIntensity-'+id},l);el('span',{},l,lab(V.INTENSITY[id].label));if(id===(r.intensities.includes(cur)?cur:r.intensities[0]))i.checked=true;i.onchange=refresh;}
  renderKeep();renderRefs();refresh();}
 function renderKeep(){keep.replaceChildren();const zone=zoneSel.value;
  for(const id of V.PRESERVE_MANDATORY){const l=el('label',{class:'vs-keep-item locked'},keep);el('input',{type:'checkbox',checked:true,disabled:true,'data-preserve':id},l);el('span',{},l,lab(V.PRESERVE_LABEL[id]));}
  for(const id of V.PRESERVE_OPTIONAL){const l=el('label',{class:'vs-keep-item'},keep);const i=el('input',{type:'checkbox','data-preserve':id,id:'vsKeep-'+id,checked:id==='furniture-layout'&&zone!=='furniture'},l);if(id===zone){i.checked=false;i.disabled=true;}el('span',{},l,lab(V.PRESERVE_LABEL[id]));i.onchange=refresh;}
  changeNote.textContent=tx(`Se cambia: ${lab(V.ZONES[zone]?.label)} dentro de la zona marcada. Lo bloqueado se conserva siempre.`,`Changes: ${lab(V.ZONES[zone]?.label)} inside the marked zone. Locked items are always kept.`,`修改：标记区域内的${lab(V.ZONES[zone]?.label)}。锁定项始终保留。`);}
 function renderRefs(){refList.replaceChildren();const r=recipeNow(),cats=catalogs();refs=refs.filter(x=>r.families.includes(x.product.family));
  const products=cats.flatMap(c=>c.products.map(p=>({c,p}))).filter(({p})=>r.families.includes(p.family));
  refNote.textContent=!cats.length?tx('No hay catálogos en este navegador: abre «Mis catálogos» e importa una colección.','No catalogues in this browser: open «My catalogues» and import a collection.','此浏览器无目录：请打开“我的目录”并导入。')
   :products.length?tx(`Elige hasta ${r.maxReferences}. Solo imágenes con permiso de referencia.`,`Choose up to ${r.maxReferences}. Only images licensed as references.`,`最多选择 ${r.maxReferences} 个，仅限有参考授权的图片。`):tx('Ningún producto del catálogo encaja con esta receta.','No catalogue product fits this recipe.','没有符合此配方的目录产品。');
  openCat.hidden=!!products.length;
  for(const {c,p} of products){const img=p.imageRefs.find(i=>i.license.scope.includes('reference-image'));const li=el('li',{},refList);const l=el('label',{},li);
   const key=c.catalogId+'|'+CP.keyOf(p);const cb=el('input',{type:'checkbox',value:key,'data-sku':p.sku,disabled:!img},l);cb.checked=refs.some(x=>x.key===key);
   el('span',{},l,`${p.displayName} · ${p.sku}`+(img?'':' · '+tx('sin permiso de referencia','not licensed as reference','无参考授权')));
   cb.onchange=async()=>{if(cb.checked){if(refs.length>=r.maxReferences){cb.checked=false;status.textContent=tx(`Máximo ${r.maxReferences} referencias en esta receta.`,`At most ${r.maxReferences} references in this recipe.`,`此配方最多 ${r.maxReferences} 个参考。`);return;}
     const blob=await loadRef(img);if(!blob){cb.checked=false;status.textContent=tx('La imagen de referencia no coincide con su huella: no se usa.','The reference image does not match its hash: not used.','参考图片哈希不符，未使用。');return;}
     refs.push({key,product:p,catalog:c,image:img,blob});}else refs=refs.filter(x=>x.key!==key);refresh();};}}
 async function loadRef(img){try{const r=await fetch(img.path,{credentials:'same-origin'});const b=new Uint8Array(await r.arrayBuffer());return CP.sha256(b)===img.sha256?new Blob([b],{type:img.mediaType}):null;}catch{return null;}}
 // Zone drawing (pointer events: mouse, pen and touch).
 const norm=v=>Math.round(Math.min(1,Math.max(0,v))*1e4)/1e4;
 function addRect([x,y,w,h]){if(mask.length>=8)return;const r=[norm(x),norm(y),norm(Math.min(w,1-x)),norm(Math.min(h,1-y))];if(r[2]<0.02||r[3]<0.02)return;mask.push(r);drawStage();renderMask();refresh();}
 function renderMask(){maskList.replaceChildren();mask.forEach((m,i)=>{const li=el('li',{},maskList);el('span',{},li,tx('Zona','Zone','区域')+` ${i+1}: x ${Math.round(m[0]*100)} % · y ${Math.round(m[1]*100)} % · ${Math.round(m[2]*100)} × ${Math.round(m[3]*100)} %`);
  const b=el('button',{type:'button',class:'btn small','aria-label':tx(`Quitar zona ${i+1}`,`Remove zone ${i+1}`,`删除区域 ${i+1}`)},li,'×');b.onclick=()=>{mask.splice(i,1);drawStage();renderMask();refresh();};});
  if(!mask.length)el('li',{class:'vs-empty'},maskList,tx('Sin zona: dibuja o elige un atajo.','No zone: draw one or pick a shortcut.','无区域：请绘制或选择快捷方式。'));}
 function drawStage(){if(!src)return;const c=stageCanvas,x=c.getContext('2d');x.drawImage(src.canvas,0,0,c.width,c.height);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,0,c.width,c.height);
  for(const [mx,my,mw,mh] of [...mask,...(drawing?[drawing]:[])]){x.drawImage(src.canvas,mx*src.canvas.width,my*src.canvas.height,mw*src.canvas.width,mh*src.canvas.height,mx*c.width,my*c.height,mw*c.width,mh*c.height);x.strokeStyle='#ffd23f';x.lineWidth=3;x.setLineDash([8,5]);x.strokeRect(mx*c.width,my*c.height,mw*c.width,mh*c.height);}}
 stageCanvas.addEventListener('pointerdown',e=>{if(!src)return;const b=stageCanvas.getBoundingClientRect();const p0=[(e.clientX-b.left)/b.width,(e.clientY-b.top)/b.height];stageCanvas.setPointerCapture(e.pointerId);
  const move=ev=>{const p=[(ev.clientX-b.left)/b.width,(ev.clientY-b.top)/b.height];drawing=[Math.min(p0[0],p[0]),Math.min(p0[1],p[1]),Math.abs(p[0]-p0[0]),Math.abs(p[1]-p0[1])];drawStage();};
  const up=()=>{stageCanvas.removeEventListener('pointermove',move);stageCanvas.removeEventListener('pointerup',up);stageCanvas.removeEventListener('pointercancel',up);const d=drawing;drawing=null;if(d)addRect(d);else drawStage();};
  stageCanvas.addEventListener('pointermove',move);stageCanvas.addEventListener('pointerup',up);stageCanvas.addEventListener('pointercancel',up);e.preventDefault();});
 clearMask.onclick=()=>{mask=[];drawStage();renderMask();refresh();};
 // The closed request (same validator as the server).
 function request(){const r=recipeNow();return {version:1,mode:'catalog',recipeId:r.id,recipeVersion:r.version,zone:zoneSel.value,intensity:intensity.querySelector('input:checked')?.value,alternatives:+altSel.value,
  preserve:[...keep.querySelectorAll('input[data-preserve]:not([disabled]):checked')].map(i=>i.dataset.preserve),mask:mask.map(m=>[...m]),references:refs.map(x=>({family:x.product.family,kind:x.product.kind,sha256:x.image.sha256}))};}
 function refresh(){const req=request(),c=V.checkRequest(req);
  cost.replaceChildren();el('strong',{},cost,tx('Generación real: BLOQUEADA (STOP_GASTO)','Real generation: BLOCKED (STOP_GASTO)','真实生成：已锁定（STOP_GASTO）'));
  el('p',{},cost,CFG.configured?'':tx('photo-reform/1 está cerrado en este despliegue: falta un tope de gasto aprobado por el propietario, el precio vigente y un almacén persistente. No se envía nada ni hay gasto.','photo-reform/1 is closed in this deployment: an owner-approved spending cap, the current price and a persistent store are missing. Nothing is sent and nothing is spent.','此部署中 photo-reform/1 已关闭：缺少业主批准的费用上限、当前价格和持久存储。不发送、不产生费用。'));
  el('p',{id:'vsCostSim'},cost,tx(`Simulación local: ${req.alternatives} opción(es); coste: no aplica (no se llama a ningún proveedor).`,`Local simulation: ${req.alternatives} option(s); cost: not applicable (no provider is called).`,`本地模拟：${req.alternatives} 个方案；费用：不适用（不调用任何服务）。`));
  const why=!src?tx('Elige una imagen.','Choose an image.','请选择图像。'):!c.ok?({mask:tx('Marca al menos una zona.','Mark at least one zone.','请至少标记一个区域。'),references:tx('Demasiadas referencias.','Too many references.','参考过多。')}[c.code]||tx('Revisa la receta.','Check the recipe.','请检查配方。')):'';
  simBtn.disabled=!!why||!!abort;if(why&&!abort)status.dataset.why=why;else delete status.dataset.why;return {req,ok:c.ok&&!!src,why};}
 [recipeSel].forEach(s=>s.onchange=()=>{fillRecipe();});zoneSel.onchange=()=>{renderKeep();refresh();};altSel.onchange=refresh;
 openCat.onclick=()=>{dlg.close();window.RubikCatalogUI?.open();};
 file.onchange=async()=>{fileErr.textContent='';src=null;mask=[];stage.hidden=true;hideResults();renderMask();refresh();const f=file.files?.[0];if(!f)return;
  const chk=PC.checkFile({size:f.size,head:new Uint8Array(await f.slice(0,16).arrayBuffer())});if(!chk.ok){fileErr.textContent=chk.message;file.value='';return;}
  let bmp;try{bmp=await createImageBitmap(f);}catch{bmp=null;}const dims=PC.checkDimensions(bmp?.width,bmp?.height);if(!dims.ok){bmp?.close?.();fileErr.textContent=dims.message;file.value='';return;}
  const c=document.createElement('canvas');c.width=dims.work.w;c.height=dims.work.h;c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);bmp.close?.();
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));const bytes=new Uint8Array(await blob.arrayBuffer());src={canvas:c,blob,sha256:CP.sha256(bytes),width:c.width,height:c.height};
  stageCanvas.width=Math.min(960,c.width);stageCanvas.height=Math.round(stageCanvas.width*c.height/c.width);stage.hidden=false;drawStage();refresh();};
 // Simulated adapter: draws the reference (or a zone colour) inside the zone only, with the SIMULATION label.
 const ZCOLOR={floor:'#8a6a4f',walls:'#9fb39a',ceiling:'#f1efe8',cabinetry:'#2f4858',worktop:'#3b3b3b',appliance:'#c7cbd1',furniture:'#7a5c43',lighting:'#e3b24f'};
 async function simulate(req,index,signal,scn){
  await new Promise((res,rej)=>{const t=setTimeout(res,scn==='slow'?2500:400);signal.addEventListener('abort',()=>{clearTimeout(t);rej(new DOMException('Cancelado','AbortError'));},{once:true});});
  if(scn==='error'&&index===0)throw Error(tx('El proveedor (simulado) ha devuelto un error: no se ha generado nada y no hay coste.','The (simulated) provider returned an error: nothing was generated and there is no cost.','（模拟）服务返回错误：未生成任何内容，无费用。'));
  const s=src.canvas,c=document.createElement('canvas');c.width=s.width;c.height=s.height;const x=c.getContext('2d');x.drawImage(s,0,0);
  const alpha={faithful:.9,balanced:.75,creative:.6}[req.intensity];const ref=refs[index%Math.max(1,refs.length)];let rb=null;if(ref){try{rb=await createImageBitmap(ref.blob);}catch{}}
  for(const [mx,my,mw,mh] of req.mask){const X=mx*c.width,Y=my*c.height,W=mw*c.width,H=mh*c.height;x.save();x.beginPath();x.rect(X,Y,W,H);x.clip();x.globalAlpha=alpha;
   if(rb)x.drawImage(rb,X,Y,W,H);else{x.fillStyle=ZCOLOR[req.zone];x.fillRect(X,Y,W,H);}x.globalAlpha=.12*index;x.fillStyle='#ffffff';x.fillRect(X,Y,W,H);x.restore();}
  rb?.close?.();
  if(scn==='drift'){x.fillStyle='#d9d4c7';x.fillRect(c.width*.04,c.height*.12,c.width*.22,c.height*.38);} // erases a window outside the zone
  x.font=`700 ${Math.round(c.height/18)}px sans-serif`;x.fillStyle='rgba(180,0,0,.85)';x.fillText(tx('SIMULACIÓN · no generada por IA','SIMULATION · not generated by AI','模拟 · 非 AI 生成'),c.width*.03,c.height*.95);
  return c;
 }
 function ratiosOf(result,req){const w=Math.min(320,src.canvas.width),h=Math.round(w*src.canvas.height/src.canvas.width);const rd=cv=>{const t=document.createElement('canvas');t.width=w;t.height=h;const g=t.getContext('2d',{willReadFrequently:true});g.drawImage(cv,0,0,w,h);return g.getImageData(0,0,w,h).data;};
  // The simulation label is drawn by RUBIK, not by the provider: it is excluded from the measure.
  const a=rd(src.canvas),b=rd(result);for(let y=Math.floor(h*.88);y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;b[i]=a[i];b[i+1]=a[i+1];b[i+2]=a[i+2];}
  return V.changeRatios(a,b,w,h,req.mask);}
 simBtn.onclick=async()=>{const {req,ok,why}=refresh();if(!ok){status.textContent=why;return;}if(!consent.checked){status.textContent=tx('Falta el consentimiento.','Consent is missing.','缺少同意。');consent.focus();return;}
  hideResults();abort=new AbortController();const signal=abort.signal,scn=scenario.value;simBtn.disabled=true;cancelBtn.hidden=false;status.textContent=tx('Preparando la simulación…','Preparing the simulation…','正在准备模拟…');dlg.dataset.run='running';
  try{for(let i=0;i<req.alternatives;i++){const c=await simulate(req,i,signal,scn);results.push({canvas:c,req,ratios:ratiosOf(c,req),kind:'simulated'});renderAlts();}
   status.textContent=tx(`Simulación terminada: ${results.length} opción(es), rotuladas como SIMULACIÓN. No se ha llamado a ningún proveedor.`,`Simulation finished: ${results.length} option(s), labelled SIMULATION. No provider was called.`,`模拟完成：${results.length} 个方案，已标注为模拟。未调用任何服务。`);dlg.dataset.run='done';}
  catch(e){if(e?.name==='AbortError'){status.textContent=tx('Cancelado: no queda ningún resultado.','Cancelled: no result is kept.','已取消：不保留任何结果。');hideResults();dlg.dataset.run='cancelled';}else{status.textContent=e.message;dlg.dataset.run='error';if(results.length)renderAlts();}}
  finally{abort=null;cancelBtn.hidden=true;refresh();}};
 cancelBtn.onclick=()=>abort?.abort();
 function hideResults(){results=[];selected=0;sheet=null;s7.hidden=true;alts.replaceChildren();auto.textContent='';verdict.textContent='';decisionNote.textContent='';for(const q of [qOpen,qGeo])for(const o of Object.values(q.opts))o.checked=false;matchSel.value='not-assessable';acceptBtn.disabled=true;dlImg.disabled=true;dlSheet.disabled=true;delete dlg.dataset.verdict;delete dlg.dataset.decision;}
 function renderAlts(){s7.hidden=false;alts.replaceChildren();results.forEach((r,i)=>{const b=el('button',{type:'button',class:'vs-alt','aria-pressed':String(i===selected),id:'vsAlt'+i},alts,tx('Opción ','Option ','方案 ')+(i+1));b.onclick=()=>{selected=i;renderAlts();};});showSelected();}
 function showSelected(){const r=results[selected];if(!r)return;for(const [cv,from] of [[cmpA,src.canvas],[cmpB,r.canvas]]){cv.width=Math.min(960,from.width);cv.height=Math.round(cv.width*from.height/from.width);cv.getContext('2d').drawImage(from,0,0,cv.width,cv.height);}
  cmpTag.textContent=tx('SIMULACIÓN','SIMULATION','模拟');slider.oninput();
  auto.textContent=tx(`Cambios fuera de la zona: ${(r.ratios.outside*100).toFixed(1)} % (tolerancia ${(V.INTENSITY[r.req.intensity].outsideTolerance*100).toFixed(0)} %) · dentro: ${(r.ratios.inside*100).toFixed(0)} %`,`Changes outside the zone: ${(r.ratios.outside*100).toFixed(1)} % (tolerance ${(V.INTENSITY[r.req.intensity].outsideTolerance*100).toFixed(0)} %) · inside: ${(r.ratios.inside*100).toFixed(0)} %`,`区域外变化：${(r.ratios.outside*100).toFixed(1)}%（容差 ${(V.INTENSITY[r.req.intensity].outsideTolerance*100).toFixed(0)}%）· 区域内：${(r.ratios.inside*100).toFixed(0)}%`);
  updateVerdict();}
 slider.oninput=()=>{cmpB.style.clipPath=`inset(0 0 0 ${slider.value}%)`;};
 const answer=q=>q.opts.yes.checked?true:q.opts.no.checked?false:null;
 function currentReview(){const r=results[selected];return r?V.review({ratios:r.ratios,intensity:r.req.intensity,human:{openingsIntact:answer(qOpen),geometryIntact:answer(qGeo),productMatch:matchSel.value}}):null;}
 function updateVerdict(){const rv=currentReview();if(!rv)return;dlg.dataset.verdict=rv.status;
  verdict.textContent=`${rv.status}${rv.reasons.length?' · '+rv.reasons.map(x=>lab(V.REVIEW_TEXT[x])).join(' '):''}`;verdict.dataset.status=rv.status;
  acceptBtn.disabled=!rv.deliverable;}
 for(const q of [qOpen,qGeo])for(const o of Object.values(q.opts))o.onchange=updateVerdict;matchSel.onchange=updateVerdict;
 function decide(decision){const r=results[selected];if(!r)return;const rv=currentReview();
  sheet=V.resultSheet({source:{kind:'photo',sha256:src.sha256,width:src.width,height:src.height},request:r.req,references:refs.map(x=>({catalogId:x.catalog.catalogId,catalogRevision:x.catalog.revision,productId:x.product.productId,variantId:x.product.variantId,sku:x.product.sku,displayName:x.product.displayName,family:x.product.family,imageSha256:x.image.sha256,license:x.image.license})),
   result:{kind:r.kind,index:selected},review:rv,decision,lang:lang()});
  dlg.dataset.decision=decision;dlSheet.disabled=false;dlImg.disabled=!sheet.deliverable; // a simulation is never deliverable
  decisionNote.textContent=decision==='accepted'?tx('Aceptada como prueba de recorrido. Es una SIMULACIÓN: no se descarga ni se entrega como imagen.','Accepted as a journey test. It is a SIMULATION: it is not downloaded or delivered as an image.','已作为流程测试接受。这是模拟：不下载也不交付图像。')
   :tx(`Rechazada${rv?.reasons?.length?': '+rv.reasons.map(x=>lab(V.REVIEW_TEXT[x])).join(' '):''}. No se entrega.`,`Rejected${rv?.reasons?.length?': '+rv.reasons.map(x=>lab(V.REVIEW_TEXT[x])).join(' '):''}. Not delivered.`,`已拒绝。不交付。`);}
 acceptBtn.onclick=()=>{if(currentReview()?.deliverable)decide('accepted');};rejectBtn.onclick=()=>decide('rejected');
 dlSheet.onclick=()=>{if(!sheet)return;const url=URL.createObjectURL(new Blob([JSON.stringify(sheet,null,1)],{type:'application/json'}));const a=el('a',{href:url,download:`rubik-estudio-imagenes-${sheet.decision}.json`},document.body);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 dlImg.onclick=()=>{/* only a generated, accepted result: never reached with the simulation */};
 discardBtn.onclick=()=>{hideResults();status.textContent=tx('Resultado descartado.','Result discarded.','结果已丢弃。');};
 closeBtn.onclick=()=>dlg.close();dlg.addEventListener('close',()=>{abort?.abort();});
 function open(){labels();fillRecipe();renderMask();refresh();dlg.showModal();file.focus();}
 // Entry: «Entregar» → card «Imágenes» (repainted when the area changes: added if missing).
 const addToCard=()=>{const card=document.querySelector('.professional-card[data-module="images"]');if(card&&!card.querySelector('#visualStudioCard')){const w=el('div',{class:'vs-card-entry'});const b=el('button',{type:'button',class:'btn primary',id:'visualStudioCard'},w,tx('Estudio de imágenes','Image studio','图像工作室'));b.onclick=open;el('small',{},w,tx('Propuesta visual con referencias de tu catálogo y revisión de fidelidad (simulación; generación real bloqueada).','Visual proposal with references from your catalogue and fidelity review (simulation; real generation blocked).','使用目录参考与保真审核的视觉方案（模拟；真实生成已锁定）。'));card.append(w);}};
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;addToCard();});}).observe(document.body,{childList:true,subtree:true});addToCard();
 window.RubikVisualStudio={open,get sheet(){return sheet;},get request(){return request();}};
})();
