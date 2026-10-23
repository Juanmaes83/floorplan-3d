/* Architectural sheet derived from the active project and the existing 2D drawing. */
(function(){
 'use strict';
 const NS='http://www.w3.org/2000/svg',app=window.FloorPlanApp;
 const tr=(es,en,zh)=>({es,en,zh})[LANG]||es;
 const localized=value=>typeof nm==='function'?nm(value):value;
 const svgNode=(tag,attributes={},parent)=>{const node=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attributes))node.setAttribute(key,String(value));parent?.append(node);return node;};
 const text=(parent,value,x,y,size=20,weight=400,fill='#302c28')=>{const node=svgNode('text',{x,y,'font-size':size,'font-weight':weight,fill,'font-family':'Arial, sans-serif'},parent);node.textContent=String(value);return node;};
 const area=poly=>Math.abs(poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2/1e6;
 const inside=(poly,x,y)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
 function labelPoint(room){
  if(room.at&&inside(room.poly,...room.at))return room.at;
  const xs=room.poly.map(p=>p[0]),ys=room.poly.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  let best=room.poly[0],score=-1;
  for(let row=0;row<=20;row++)for(let col=0;col<=20;col++){
   const x=minX+(maxX-minX)*(col+.5)/21,y=minY+(maxY-minY)*(row+.5)/21;if(!inside(room.poly,x,y))continue;
   let clearance=Infinity;
   for(let i=0;i<room.poly.length;i++){const a=room.poly[i],b=room.poly[(i+1)%room.poly.length],vx=b[0]-a[0],vy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy||1)));clearance=Math.min(clearance,Math.hypot(x-a[0]-t*vx,y-a[1]-t*vy));}
   if(clearance>score){score=clearance;best=[x,y];}
  }
  return best;
 }
 function revisionCode(value){let hash=2166136261;for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619);return (hash>>>0).toString(16).padStart(8,'0');}
 // Printable scale: the sheet is 1600×1100 units; with a scale it is drawn at 420 mm wide (fits A3 landscape at
 // 100 %), so one unit is 420/1600 mm and the plan box gets its exact paper size at 1:scale.
 const PAPER_W=420,UNIT=PAPER_W/1600,SCALES=[50,100,200];
 function build(scale=0){
  const project=app.project,geometry=app.geometry,source=document.querySelector('#plan');
  if(!project||!geometry||app.source2D!==project||!source)throw Error(tr('La planta 2D aún no está lista. Vuelve a abrir el editor.','The 2D plan is not ready yet. Return to the editor.','二维平面图尚未就绪，请返回编辑器。'));
  // Optional professional brand (FloorPlanBrandUI): a snapshot drawn into the title band and the credit line.
  const brand=window.FloorPlanBrandUI?.snapshot()||null;
  const revision=FloorPlanGuide.revision(project),sheet=svgNode('svg',{xmlns:NS,viewBox:'0 0 1600 1100',width:scale?PAPER_W+'mm':1600,height:scale?(1100*UNIT)+'mm':1100,'data-project-id':project.id,'data-revision':revisionCode(revision)});
  if(scale)sheet.setAttribute('data-scale','1:'+scale);
  svgNode('rect',{width:1600,height:1100,fill:'#fcfaf6'},sheet);
  svgNode('rect',{x:22,y:22,width:1556,height:1056,fill:'none',stroke:'#81796e','stroke-width':2},sheet);
  const title=brand?.title||localized(project.name||tr('Proyecto sin nombre','Untitled project','未命名项目')),maxTitle=brand?46:62,titleRoom=brand?950:1250;
  text(sheet,tr('LÁMINA DE DISTRIBUCIÓN','FLOOR PLAN SHEET','平面设计图'),50,66,20,700,'#1f5a66');
  text(sheet,title.length>maxTitle?title.slice(0,maxTitle-3)+'…':title,50,112,Math.max(23,Math.min(38,titleRoom/(title.length*.65||1))),700);
  if(brand){
   const p=brand.profile,cut=(v,n)=>v.length>n?v.slice(0,n-1)+'…':v;let x=1060;
   const g=svgNode('g',{'data-brand':'true'},sheet);
   if(p.logo){svgNode('image',{href:p.logo,x:1060,y:36,width:140,height:84,preserveAspectRatio:'xMinYMid meet'},g);x=1214;}
   // Name, then the contact in two short lines (person and phone; e-mail and web) so nothing is cut, then the motto.
   const chars=Math.floor((1550-x)/7.2);text(g,cut(p.name,Math.floor((1550-x)/11)),x,62,21,700,'#1f2326');
   const lines=[[p.person,p.phone],[p.email,p.web&&p.web.replace(/^https?:\/\//,'')]].map(l=>l.filter(Boolean).join(' · ')).filter(Boolean);
   lines.forEach((l,i)=>text(g,cut(l,chars),x,86+i*19,13.5,400,'#5b6266'));
   if(p.tagline)text(g,cut(p.tagline,chars),x,86+lines.length*19,12.5,400,'#5b6266');
  }
  svgNode('line',{x1:50,y1:132,x2:1550,y2:132,stroke:'#b9b1a5'},sheet);
  svgNode('rect',{x:45,y:154,width:1095,height:792,fill:'#f7f4ee',stroke:'#c8c0b5'},sheet);
  const drawing=source.cloneNode(true),bounds=geometry.bounds;
  for(const selector of ['#gSource','#gTrace','#gAssist','#gReview','#gSel','#gGrid','#gMeasure'])drawing.querySelector(selector)?.remove();
  drawing.querySelectorAll('image').forEach(node=>node.remove());
  drawing.querySelectorAll('foreignObject').forEach(node=>node.remove());
  drawing.querySelectorAll('#gFurn text').forEach(node=>node.remove());
  drawing.querySelector('#gLabels')?.replaceChildren();
  for(const id of ['gFurn','gDims','gLabels'])drawing.querySelector('#'+id)?.removeAttribute('display');
  drawing.removeAttribute('id');let box={x:55,y:164,w:1075,h:772};
  // The scale reproduces the MODEL's millimetres. An uncalibrated plan has no real dimensions to print at scale; an
  // estimated calibration is printed with that said on the sheet.
  const confidence=project.scale?.confidence||'pending';
  if(scale&&confidence==='pending')throw Error(tr('Este plano no está calibrado: sus medidas no son reales y no se puede imprimir a escala. Calíbralo con una medida conocida o usa «Ajustar a la hoja».','This plan is not calibrated: its dimensions are not real and it cannot be printed to scale. Calibrate it with a known length or use «Fit to sheet».','此平面图未校准：尺寸不真实，无法按比例打印。请用已知尺寸校准，或选择“适合图纸”。'));
  if(scale){const w=bounds.w/scale/UNIT,h=bounds.h/scale/UNIT;
   if(w>box.w+.01||h>box.h+.01)throw Error(tr(`El plano no cabe en la hoja a 1:${scale}. Elige una escala menor (por ejemplo 1:${SCALES.find(v=>v>scale)||scale*2}).`,`The plan does not fit the sheet at 1:${scale}. Choose a smaller scale (e.g. 1:${SCALES.find(v=>v>scale)||scale*2}).`,`按 1:${scale} 无法放入图纸，请选择更小的比例。`));
   box={x:box.x+(box.w-w)/2,y:box.y+(box.h-h)/2,w,h};}
  drawing.setAttribute('x',box.x);drawing.setAttribute('y',box.y);drawing.setAttribute('width',box.w);drawing.setAttribute('height',box.h);
  drawing.setAttribute('viewBox',`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`);drawing.setAttribute('preserveAspectRatio','xMidYMid meet');
  drawing.setAttribute('style','overflow:hidden');sheet.append(drawing);
  const labels=drawing.querySelector('#gLabels');
  for(const room of geometry.rooms){
   if(room.poly.length<3||area(room.poly)<=0)continue;
   const [x,y]=labelPoint(room),name=localized(room.name),xs=room.poly.map(p=>p[0]),width=Math.max(...xs)-Math.min(...xs),maxChars=Math.max(16,Math.min(26,Math.floor(width/125))),visible=name.length>maxChars?name.slice(0,maxChars-1)+'…':name;
   const size=Math.max(90,Math.min(220,width/(Math.max(5,visible.length)*.8)));
   const label=text(labels,visible,x,y,size,700);label.setAttribute('text-anchor','middle');label.setAttribute('paint-order','stroke');label.setAttribute('stroke','#fcfaf6');label.setAttribute('stroke-width','36');svgNode('title',{},label).textContent=name;
   const value=text(labels,`${area(room.poly).toFixed(2)} m²`,x,y+size*.95,Math.max(95,size*.72),400,'#625b53');value.setAttribute('text-anchor','middle');value.setAttribute('paint-order','stroke');value.setAttribute('stroke','#fcfaf6');value.setAttribute('stroke-width','28');
  }
  text(sheet,tr('ACABADOS DEL SUELO','FLOOR FINISHES','地面材料'),1170,188,20,700,'#315e62');
  const materialIds=[...new Set(project.rooms.map(room=>room.floorMaterialId))].filter(id=>project.materials.some(item=>item.id===id));
  if(!materialIds.length)text(sheet,tr('Sin acabados asignados','No finishes assigned','未指定材料'),1172,227,17,400,'#625b53');
  materialIds.slice(0,12).forEach((id,i)=>{const material=project.materials.find(item=>item.id===id),y=226+i*38;if(!material)return;svgNode('rect',{x:1172,y:y-18,width:22,height:22,rx:3,fill:material.appearance.color||'#ddd',stroke:'#8b8379'},sheet);const label=localized(material.name);text(sheet,label.length>27?label.slice(0,26)+'…':label,1207,y,18);});
  if(materialIds.length>12)text(sheet,tr(`+${materialIds.length-12} acabados más`,`+${materialIds.length-12} more finishes`,`另有 ${materialIds.length-12} 种材料`),1172,226+12*38,16);
  svgNode('line',{x1:1168,y1:750,x2:1544,y2:750,stroke:'#b9b1a5'},sheet);
  const used=geometry.rooms.filter(room=>room.counted!==false).reduce((sum,room)=>sum+area(room.poly),0);
  text(sheet,tr('SUPERFICIE ÚTIL APROX.','APPROX. NET AREA','约使用面积'),1170,792,16,700,'#625b53');text(sheet,`${used.toFixed(2)} m²`,1170,834,32,700);
  const scaleNote=project.scale?.confidence==='real'?tr('Escala confirmada por la persona','Scale confirmed by user','比例已由用户确认'):tr('Medidas orientativas','Indicative dimensions','尺寸仅供参考');
  text(sheet,scaleNote,1170,879,16,500,'#625b53');
  svgNode('line',{x1:50,y1:971,x2:1550,y2:971,stroke:'#b9b1a5'},sheet);
  text(sheet,tr('Proyecto','Project','项目')+`: ${project.id.length>48?project.id.slice(0,45)+'…':project.id}`,50,1007,16);
  text(sheet,tr('Revisión','Revision','修订')+`: ${revisionCode(revision)}`,50,1035,16);
  if(scale){
   // Graphic scale bar: the longest of 1, 2, 5 or 10 m that stays under 300 units, measured in the same paper units.
   const metres=[10,5,2,1].find(m=>m*1000/scale/UNIT<=300)||1,len=metres*1000/scale/UNIT,bar=svgNode('g',{'data-scale-bar':metres},sheet);
   const bx=1172;svgNode('rect',{x:bx,y:922,width:len/2,height:8,fill:'#1f2326'},bar);svgNode('rect',{x:bx+len/2,y:922,width:len/2,height:8,fill:'#ffffff',stroke:'#1f2326','stroke-width':1.5},bar);
   text(bar,'0',bx,916,13).setAttribute('text-anchor','middle');text(bar,`${metres} m`,bx+len,916,13).setAttribute('text-anchor','middle');text(bar,`1:${scale}`,bx+len+16,931,13,700);
   text(sheet,tr(`Escala 1:${scale} · hoja de 420 × ${(1100*UNIT).toFixed(2).replace('.',',')} mm (cabe en A3 apaisado): imprime al 100 % y comprueba la barra con una regla`,`Scale 1:${scale} · 420 × ${(1100*UNIT).toFixed(2)} mm sheet (fits A3 landscape): print at 100 % and check the bar with a ruler`,`比例 1:${scale} · 图纸 420 × ${(1100*UNIT).toFixed(2)} 毫米（适合 A3 横向）：按 100% 打印 · 模型单位：毫米`),780,1007,15);
   if(confidence!=='real'){const w=text(sheet,tr(`La escala reproduce las medidas del modelo. La calibración del inmueble es estimada: las medidas reales pueden diferir.`,`The scale reproduces the model's dimensions. The property's calibration is estimated: real dimensions may differ.`,`比例反映模型尺寸。房屋校准为估算：实际尺寸可能不同。`),780,1062,13,600,'#7a5200');w.setAttribute('data-scale-warning','estimated');}
  }else text(sheet,tr('Unidades del modelo: mm · Sin escala de impresión declarada','Model units: mm · No print scale declared','模型单位：毫米 · 未声明打印比例'),780,1007,15);
  text(sheet,tr('Cotas y superficies orientativas; verifica medidas in situ.','Dimensions and areas are indicative; verify on site.','尺寸和面积仅供参考，请实地核验。'),780,1035,15,'400','#625b53');
  if(brand)text(sheet,FloorPlanBrand.credit(brand.profile),50,1062,14,400,'#5b6266').setAttribute('data-brand-credit','true');
  return {sheet,projectId:project.id,revision};
 }
 const entry=document.createElement('button');entry.type='button';entry.id='openSheet';entry.className='btn';document.querySelector('#exportPng').after(entry);
 const dialog=document.createElement('dialog');dialog.id='sheetDialog';dialog.className='sheet-dialog';dialog.setAttribute('aria-labelledby','sheetTitle');
 const top=document.createElement('div');top.className='sheet-toolbar';dialog.append(top);
 const heading=document.createElement('h2');heading.id='sheetTitle';top.append(heading);
 const save=document.createElement('button'),zoom=document.createElement('button'),close=document.createElement('button');for(const button of [save,zoom,close]){button.type='button';button.className='btn';top.append(button);}save.id='sheetDownload';zoom.id='sheetZoom';close.id='sheetClose';
 // «Firmar con» in the toolbar rebuilds the preview, which is also what «Descargar SVG» saves.
 const sign=window.FloorPlanBrandUI?.profileSelect(()=>{if(!dialog.open)return;try{current=build(scaleValue());if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(current.sheet)],{type:'image/svg+xml;charset=utf-8'}));preview.src=previewUrl;}catch(error){toast(error.message||String(error),6000);}});if(sign){sign.element.id='sheetBrand';top.insertBefore(sign.element,save);}
 const scroll=document.createElement('div');scroll.className='sheet-scroll';const preview=document.createElement('img');preview.id='sheetPreview';preview.alt='';scroll.append(preview);dialog.append(scroll);document.body.append(dialog);
 let current=null,previewUrl=null,focus=null;
 // «Escala de impresión»: «Ajustar a la hoja» keeps the previous unscaled sheet; a scale that does not fit is refused
 // and the previous choice stays.
 const scaleLabel=document.createElement('label');scaleLabel.className='sheet-scale';const scaleText=document.createElement('span');const scaleSelect=document.createElement('select');scaleSelect.id='sheetScale';
 scaleLabel.append(scaleText,scaleSelect);top.insertBefore(scaleLabel,save);let scaleChoice='0';
 function scaleValue(){return Number(scaleSelect.value)||0;}
 scaleSelect.onchange=()=>{if(!dialog.open)return;try{current=build(scaleValue());scaleChoice=scaleSelect.value;if(scaleValue()&&app.project.scale?.confidence!=='real')toast(tr('Escala de impresión aplicada a las medidas del modelo. La calibración del inmueble es estimada: la lámina lo indica.','Print scale applied to the model dimensions. The calibration is estimated: the sheet says so.','打印比例应用于模型尺寸。校准为估算：图纸上已注明。'),7000);if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(current.sheet)],{type:'image/svg+xml;charset=utf-8'}));preview.src=previewUrl;}catch(error){scaleSelect.value=scaleChoice;toast(error.message||String(error),6000);}};
 function relang(){const v=scaleSelect.value;scaleText.textContent=tr('Escala de impresión','Print scale','打印比例');scaleSelect.replaceChildren(...[['0',tr('Ajustar a la hoja (sin escala)','Fit to sheet (no scale)','适合图纸（无比例）')],...SCALES.map(n=>[String(n),'1:'+n])].map(([value,label])=>{const o=document.createElement('option');o.value=value;o.textContent=label;return o;}));scaleSelect.value=v||'0';entry.textContent=tr('Abrir lámina','Open sheet','打开图纸');heading.textContent=tr('Lámina del proyecto','Project sheet','项目图纸');save.textContent=tr('Descargar SVG','Download SVG','下载 SVG');zoom.textContent=scroll.classList.contains('zoomed')?tr('Ajustar','Fit','适合窗口'):tr('Ampliar','Zoom','放大');close.textContent=tr('Cerrar','Close','关闭');preview.alt=tr('Lámina arquitectónica del proyecto activo','Architectural sheet of the active project','当前项目平面图');}
 // The «close» event is queued; if the sheet was opened again before it ran, the new preview stays.
 function clear(){if(dialog.open)return;scaleSelect.value=scaleChoice='0';if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;preview.removeAttribute('src');scroll.classList.remove('zoomed');current=null;focus?.focus?.({preventScroll:true});}
 function open(){if(window.FloorPlanBuildingUI&&!window.FloorPlanBuildingUI.gate('Lámina'))return;try{focus=document.activeElement;sign?.refresh();scaleSelect.value=scaleChoice='0';current=build(scaleValue());relang();const level=app.levelContext;if(level)heading.textContent=tr(`Lámina de la planta «${level.levelName}» · edificio «${level.buildingName}»`,`Sheet of level «${level.levelName}» · building «${level.buildingName}»`,`图纸：${level.levelName}`);const bytes=new XMLSerializer().serializeToString(current.sheet);if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(new Blob([bytes],{type:'image/svg+xml;charset=utf-8'}));preview.src=previewUrl;dialog.showModal();}catch(error){current=null;toast(error.message||String(error),6000);}}
 function download(){if(window.FloorPlanBuildingUI&&!window.FloorPlanBuildingUI.gate('Lámina')){dialog.close();return;}if(!current||current.projectId!==app.project.id||current.revision!==FloorPlanGuide.revision(app.project)){dialog.close();toast(tr('El proyecto cambió. Abre de nuevo la lámina.','The project changed. Open the sheet again.','项目已更改，请重新打开图纸。'),6000);return;}const name='rubik-sota-sheet-'+current.projectId.replace(/[^a-zA-Z0-9_-]/g,'_')+'.svg',link=document.createElement('a');link.href=previewUrl;link.download=name;link.click();}
 entry.onclick=()=>{entry.closest('details')?.removeAttribute('open');open();};save.onclick=download;zoom.onclick=()=>{scroll.classList.toggle('zoomed');relang();};close.onclick=()=>dialog.close();dialog.addEventListener('close',clear);document.querySelector('#langBtn')?.addEventListener('click',()=>queueMicrotask(relang));relang();
 window.FloorPlanSheet={open,get active(){return dialog.open;}};
})();
