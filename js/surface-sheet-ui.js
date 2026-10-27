/* Professional area schedule. All area figures and completeness come from FloorPlanSurfaceMetrics. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,metrics=window.FloorPlanSurfaceMetrics;
 const t=(es,en,zh)=>({es,en,zh})[LANG]||es;
 const locale=()=>({es:'es-ES',en:'en-GB',zh:'zh-CN'})[LANG]||'es-ES';
 const el=(tag,content,parent,cls)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(content!==undefined)node.textContent=content;parent?.append(node);return node;};
 const area=value=>value===null?t('No disponible','Unavailable','暂无数据'):value.toLocaleString(locale(),{minimumFractionDigits:2,maximumFractionDigits:2})+' m²';
 const status=value=>({measured:t('Medido / calibrado','Measured / calibrated','已测量 / 已校准'),estimated:t('Estimado','Estimated','估算'),unavailable:t('No disponible','Unavailable','暂无数据')})[value];
 const explanation=value=>({measured:t('Escala real o calibrada confirmada en el modelo.','Real or calibrated scale confirmed in the model.','模型中的实际比例或已确认校准比例。'),estimated:t('Cifra derivada del modelo disponible sin calibración confirmada.','Figure derived from the available model without confirmed calibration.','基于现有模型得出，尚未确认校准。'),unavailable:t('No hay información suficiente para obtener una cifra válida.','There is not enough information for a valid figure.','缺少足够信息，无法得出有效数值。')})[value];
 const excludedText=()=>t('Excluida del cómputo','Excluded from total','不计入总面积');
 const source=()=>{
  const building=window.FloorPlanBuildingUI?.presentationSources?.();
  if(building){
   const levels=building.levels.map(level=>({id:level.levelId,name:level.name,order:level.order,project:level.project}));
   return {name:building.building.name,levels,summary:metrics.home({levels})};
  }
  return {name:app.project.name,levels:[{id:null,name:null,project:app.project}],summary:metrics.home(app.project)};
 };
 function finishRows(data){
  const groups=new Map();
  for(const level of data.summary.levels){
   const project=data.levels.find(item=>item.id===level.levelId)?.project;
   for(const item of level.rooms){
    if(!item.counted)continue;
    const room=project?.rooms.find(r=>r.id===item.id),material=project?.materials.find(m=>m.id===room?.floorMaterialId);
    if(!material)continue;
    const key=material.id+'\u0000'+material.name;
    if(!groups.has(key))groups.set(key,{name:material.name,areaM2:null,missing:0,status:'unavailable'});
    const group=groups.get(key);
    if(item.areaM2===null)group.missing++;
    else{group.areaM2=(group.areaM2??0)+item.areaM2;group.status=item.status==='estimated'?'estimated':group.status==='unavailable'?'measured':group.status;}
   }
  }
  return [...groups.values()];
 }
 const dialog=el('dialog',undefined,document.body,'surface-sheet-dialog');dialog.id='surfaceSheetDialog';dialog.setAttribute('aria-labelledby','surfaceSheetTitle');
 const toolbar=el('div',undefined,dialog,'surface-sheet-toolbar');
 const title=el('h2','',toolbar);title.id='surfaceSheetTitle';
 const printButton=el('button','',toolbar,'btn primary');printButton.id='surfaceSheetPrint';printButton.type='button';
 const closeButton=el('button','',toolbar,'btn');closeButton.id='surfaceSheetClose';closeButton.type='button';
 const scroll=el('div',undefined,dialog,'surface-sheet-scroll');
 const paper=el('article',undefined,scroll,'surface-sheet-paper');paper.id='surfaceSheetDocument';
 const entry=el('button','',undefined,'btn');entry.id='openSurfaceSheet';entry.type='button';
 (document.querySelector('#openSheet')||document.querySelector('#exportPng')).after(entry);
 let returnFocus=null,openedSource=null;
 function rowTable(parent,items,project,excluded=false){
  const table=el('table',undefined,parent,'surface-sheet-table');
  const head=el('thead',undefined,table),headers=el('tr',undefined,head);
  for(const label of [t('Estancia','Room','房间'),t('Tipo','Type','类型'),t('Pavimento','Floor finish','地面材料'),t('Superficie útil','Net area','使用面积'),t('Estado','Status','状态')])el('th',label,headers);
  const body=el('tbody',undefined,table);
  for(const item of items){
   const room=project.rooms.find(r=>r.id===item.id),material=project.materials.find(m=>m.id===room?.floorMaterialId),tr=el('tr',undefined,body,excluded?'surface-sheet-excluded':'');
   const name=el('td',undefined,tr,'surface-sheet-room');el('strong',roomDisplay(room),name);
   const type=el('td',familyTypeLabel(room?.family||'unspecified'),tr,'surface-sheet-type');type.dataset.label=t('Tipo','Type','类型');
   const finish=el('td',material?nm(material.name):t('No asignado','Not assigned','未指定'),tr,'surface-sheet-finish');finish.dataset.label=t('Pavimento','Floor finish','地面材料');
   const number=el('td',area(item.areaM2),tr,'surface-sheet-number');number.dataset.label=t('Superficie útil','Net area','使用面积');
   const note=el('td',excluded?excludedText()+(item.status==='unavailable'?'': ' · '+status(item.status)):status(item.status),tr,'surface-sheet-status');note.dataset.label=t('Estado','Status','状态');
  }
 }
 function render(){
  const data=source(),summary=data.summary,brand=window.FloorPlanBrandUI?.snapshot()||null;
  openedSource=data;paper.replaceChildren();paper.lang=LANG==='zh'?'zh-CN':LANG;
  const mast=el('header',undefined,paper,'surface-sheet-mast');
  const identity=el('div',undefined,mast,'surface-sheet-identity');
  el('span',t('RUBIK SOTA · DOCUMENTACIÓN','RUBIK SOTA · DOCUMENTATION','RUBIK SOTA · 项目文件'),identity,'surface-sheet-kicker');
  el('h1',t('Ficha de superficies','Area schedule','面积明细表'),identity);
  el('p',data.name?nm(data.name):t('Proyecto sin nombre','Untitled project','未命名项目'),identity,'surface-sheet-project');
  if(brand){
   const mark=el('div',undefined,mast,'surface-sheet-brand');
   if(brand.profile.logo){const image=el('img',undefined,mark);image.src=brand.profile.logo;image.alt='';}
   const words=el('div',undefined,mark);el('strong',brand.profile.name,words);if(brand.profile.tagline)el('small',brand.profile.tagline,words);
  }
  const date=el('p',undefined,paper,'surface-sheet-date');
  date.textContent=t('Fecha de emisión','Issued','出具日期')+' · '+new Date().toLocaleDateString(locale(),{day:'2-digit',month:'long',year:'numeric'});
  const hero=el('section',undefined,paper,'surface-sheet-hero');
  const heroMain=el('div',undefined,hero);
  el('p',summary.complete?t('SUPERFICIE ÚTIL TOTAL','TOTAL NET AREA','总使用面积'):t('TOTAL PARCIAL DISPONIBLE','AVAILABLE PARTIAL TOTAL','可用部分总面积'),heroMain,'surface-sheet-hero-label');
  el('strong',area(summary.areaM2),heroMain,'surface-sheet-total');
  const heroAside=el('div',undefined,hero,'surface-sheet-hero-aside');
  el('strong',status(summary.status),heroAside,'surface-sheet-state');
  el('p',explanation(summary.status),heroAside);
  if(!summary.complete){
   const warning=el('p',t('Hay estancias computables sin superficie disponible. El total mostrado es parcial.','Some counted rooms have no available area. The shown total is partial.','部分计入面积的房间缺少面积数据，所示总计为部分数据。'),paper,'surface-sheet-warning');
   warning.setAttribute('role','note');warning.dataset.missing=String(summary.missing.length);
  }
  for(const [index,level] of summary.levels.entries()){
   const project=data.levels.find(item=>item.id===level.levelId)?.project;
   const section=el('section',undefined,paper,'surface-sheet-level');section.dataset.level=level.levelId||'single';
   const heading=el('div',undefined,section,'surface-sheet-level-head');
   const caption=el('div',undefined,heading);
   el('span',t('PLANTA','LEVEL','楼层')+' '+String(index+1).padStart(2,'0'),caption,'surface-sheet-section-number');
   el('h2',level.name||t('Planta única','Single level','单层'),caption);
   const subtotal=el('div',undefined,heading,'surface-sheet-subtotal');
   el('span',level.complete?t('Subtotal útil','Net subtotal','使用面积小计'):t('Subtotal parcial','Partial subtotal','部分小计'),subtotal);
   el('strong',area(level.areaM2),subtotal);
   el('small',status(level.status),subtotal);
   rowTable(section,level.rooms.filter(room=>room.counted),project);
   const excluded=level.rooms.filter(room=>!room.counted);
   if(excluded.length){
    const out=el('div',undefined,section,'surface-sheet-outside');
    el('h3',t('Zonas fuera del cómputo','Areas outside the total','不计入总面积的区域'),out);
    rowTable(out,excluded,project,true);
   }
   if(!level.complete)el('p',t('Este subtotal es parcial: faltan superficies de estancias incluidas.','This subtotal is partial: some included rooms have no area.','此小计为部分数据：部分计入的房间缺少面积。'),section,'surface-sheet-level-warning');
  }
  const finishes=finishRows(data);
  if(finishes.length){
   const section=el('section',undefined,paper,'surface-sheet-finishes');
   el('h2',t('Pavimentos','Floor finishes','地面材料'),section);
   el('p',t('Superficie asociada a acabados de estancias incluidas; no es una medición contractual.','Area associated with finishes in included rooms; not a contractual measurement.','计入房间关联的地面材料面积，并非合同测量。'),section,'surface-sheet-section-note');
   const list=el('div',undefined,section,'surface-sheet-finish-list');
   for(const finish of finishes){
    const row=el('div',undefined,list,'surface-sheet-finish-row');
    el('span',nm(finish.name),row);
    el('strong',area(finish.areaM2),row);
    el('small',finish.missing?t('Parcial · faltan superficies','Partial · areas missing','部分数据 · 缺少面积'):status(finish.status),row);
   }
  }
  const lower=el('section',undefined,paper,'surface-sheet-lower');
  el('h2',t('Alcance de la ficha','About these figures','面积说明'),lower);
  const built=el('p',undefined,lower);el('strong',t('Superficie construida','Gross built area','建筑面积')+' · ',built);built.append(t('No disponible. No existe una fuente contractual válida en este proyecto.','Unavailable. This project has no valid contractual source for it.','暂无数据。本项目没有有效的合同数据来源。'));
  el('p',t('Superficies obtenidas del modelo disponible. Las cifras estimadas u orientativas deben verificarse cuando se requiera una medición profesional o documentación contractual.','Areas are derived from the available model. Estimated or indicative figures should be verified when a professional measurement or contractual document is required.','面积来自现有模型。需要专业测量或合同文件时，应核实估算或参考数值。'),lower,'surface-sheet-method');
  const foot=el('footer',undefined,paper,'surface-sheet-footer');
  el('span','Rubik Sota · Floor Plan 3D',foot);
  if(brand){const contact=window.FloorPlanBrand.contactLine(brand.profile);el('span',brand.profile.name+(contact?' · '+contact:''),foot);}
  return data;
 }
 function relang(){
  entry.textContent=t('Ficha de superficies','Area schedule','面积明细表');
  title.textContent=entry.textContent;
  printButton.textContent=t('Imprimir / Guardar PDF','Print / Save PDF','打印 / 保存 PDF');
  closeButton.textContent=t('Cerrar','Close','关闭');
  if(dialog.open)render();
 }
 function open(){
  returnFocus=document.activeElement;
  try{render();relang();dialog.showModal();closeButton.focus({preventScroll:true});}
  catch(error){toast(error.message||String(error),6000);}
 }
 async function print(){
  if(!openedSource)return;
  const win=window.open('','_blank');
  if(!win){toast(t('El navegador bloqueó la ventana de impresión.','The browser blocked the print window.','浏览器阻止了打印窗口。'),5000);return;}
  const css=new URL('css/surface-sheet.css',document.baseURI).href;
  win.document.open();
  win.document.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="'+css+'"></head><body class="surface-sheet-print"></body></html>');
  win.document.close();
  win.document.documentElement.lang=paper.lang;
  win.document.title=t('Ficha de superficies','Area schedule','面积明细表')+' · '+nm(openedSource.name);
  const tools=win.document.createElement('nav');tools.className='surface-sheet-print-tools';
  const button=win.document.createElement('button');button.textContent=t('Imprimir / Guardar PDF','Print / Save PDF','打印 / 保存 PDF');button.onclick=()=>win.print();tools.append(button);
  win.document.body.append(tools,paper.cloneNode(true));
  const link=win.document.querySelector('link');
  await Promise.race([new Promise(resolve=>{if(link.sheet)return resolve();link.onload=resolve;link.onerror=resolve;}),new Promise(resolve=>setTimeout(resolve,1800))]);
  win.focus();win.print();
 }
 entry.onclick=()=>{entry.closest('details')?.removeAttribute('open');open();};
 printButton.onclick=print;
 closeButton.onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>returnFocus?.focus?.({preventScroll:true}));
 document.querySelector('#langBtn')?.addEventListener('click',()=>queueMicrotask(relang));
 relang();
 window.FloorPlanSurfaceSheet={open,render,get active(){return dialog.open;}};
})();
