/* Project-First A1: reusable, read-only project previews (context strip, plan, axonometric scheme, real sheet,
   signature). They draw FloorPlanProjectVisual data and existing outputs (FloorPlanSheet.preview, brand snapshot);
   they never write to the project, never pick, and are rebuilt by their host on every render. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,V=window.FloorPlanProjectVisual;if(!app||!V)return;
 const NS='http://www.w3.org/2000/svg';
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const node=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs||{}))n.setAttribute(k,v);parent?.append(n);return n;};
 const name=()=>typeof nm==='function'?nm(app.project.name):app.project.name;
 let urls=[];
 // Blob URLs of earlier sheet previews are released when the host renders again.
 function release(){for(const u of urls)URL.revokeObjectURL(u);urls=[];}
 function read(metrics){return V.summary({project:app.project,geometry:app.geometry,metrics,levelContext:app.levelContext,brand:window.FloorPlanBrandUI?.snapshot()||null});}
 // Accessible SVG: a short label when it carries meaning, aria-hidden when the text next to it already says it all.
 function frame(parent,viewBox,cls,label){const n=node('svg',{viewBox:viewBox.join(' '),class:cls,preserveAspectRatio:'xMidYMid meet'},parent);if(label){n.setAttribute('role','img');n.setAttribute('aria-label',label);}else n.setAttribute('aria-hidden','true');return n;}
 function plan(parent,{label,cls='project-plan'}={}){
  const data=V.plan(app.geometry);if(data.status!=='available')return null;
  const n=frame(parent,data.viewBox,cls,label);
  for(const r of data.rooms)node('polygon',{points:r.points,class:'preview-room'+(r.counted?'':' preview-excluded')},n);
  for(const w of data.walls)node('polygon',{points:w.points,class:'preview-wall'+(w.demolished?' preview-demolished':'')},n);
  return n;
 }
 function axonometric(parent,{label,cls='project-axo'}={}){
  const data=V.axonometric(app.geometry);if(data.status!=='available')return null;
  const n=frame(parent,data.viewBox,cls,label);
  for(const f of data.faces)node('polygon',{points:f.points,class:'axo-'+f.kind+(f.kind==='floor'&&!f.counted?' axo-excluded':'')},n);
  return n;
 }
 // The real «Ajustar a la hoja» sheet of FloorPlanSheet, as an image. If the 2D drawing is not ready it says so.
 function sheet(parent){
  let svg;try{svg=window.FloorPlanSheet?.preview?.();}catch(e){return {ok:false,reason:e.message};}
  if(!svg)return {ok:false,reason:tx('La lámina no está disponible en esta versión.','The sheet is not available in this version.','此版本不提供图纸。')};
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'}));urls.push(url);
  const img=el('img',undefined,parent,'project-sheet-image');img.src=url;img.alt=tx('Vista previa de la lámina de distribución de este proyecto','Preview of this project\'s floor plan sheet','本项目平面图纸预览');img.decoding='async';
  return {ok:true,img};
 }
 function signature(parent,brand,{caption}={}){
  const s=el('div',undefined,parent,'project-signature');if(caption)el('small',caption,s);
  if(brand){if(brand.logo){const img=el('img',undefined,s,'project-signature-logo');img.src=brand.logo;img.alt=tx('Logo de ','Logo of ','标志：')+brand.name;}
   el('strong',brand.name,s);const line=[brand.person,brand.email||brand.phone].filter(Boolean).join(' · ');if(line)el('span',line,s);}
  else{s.classList.add('is-empty');el('strong',tx('Sin firma profesional','No professional signature','无专业签名'),s);el('span',tx('La entrega saldrá sin tu marca.','The delivery will go out without your brand.','交付成果将不带您的品牌。'),s);}
  return s;
 }
 const statusText=s=>({measured:tx('Medido / calibrado','Measured / calibrated','已测量 / 已校准'),estimated:tx('Estimado','Estimated','估算'),unavailable:tx('No disponible','Unavailable','暂无数据')})[s.status]||s.status;
 const areaNumber=s=>s.areaM2===null?tx('Superficie no disponible','Area unavailable','面积暂无'):s.areaM2.toLocaleString(({es:'es-ES',en:'en-GB',zh:'zh-CN'})[typeof LANG==='string'?LANG:'es']||'es-ES',{maximumFractionDigits:2,minimumFractionDigits:2})+' m²';
 // Permanent project context: the same house in Analyze, Deliver and My studio. Text carries every fact; the
 // plan is a labelled image of the active floor.
 function context(parent,s,{variant='hero',caption,extra}={}){
  const c=el('section',undefined,parent,'project-context project-context-'+variant);c.setAttribute('aria-label',tx('Proyecto en curso','Current project','当前项目'));
  const drawing=el('div',undefined,c,'project-context-drawing');
  plan(drawing,{label:tx('Vista esquemática de la planta activa','Schematic of the active floor','当前楼层示意图'),cls:'project-plan professional-plan-preview'})||el('span',tx('Sin geometría para dibujar todavía','No geometry to draw yet','暂无可绘制的几何'),drawing,'project-context-empty');
  const copy=el('div',undefined,c,'project-context-copy');
  el('small',caption||tx('Proyecto en curso','Current project','当前项目'),copy);el('strong',name(),copy,'project-context-name');
  const facts=el('p',undefined,copy,'project-context-facts');
  el('span',areaNumber(s),facts,'project-context-area');el('span',statusText(s)+(s.complete?'':tx(' · cómputo incompleto',' · incomplete total',' · 汇总不完整')),facts,'professional-status-chip');
  const meta=el('p',undefined,copy,'project-context-meta');
  meta.textContent=[tx(`${s.roomsCounted} estancias en el cómputo`,`${s.roomsCounted} rooms in the total`,`${s.roomsCounted} 个计入房间`),s.roomsExcluded?tx(`${s.roomsExcluded} fuera`,`${s.roomsExcluded} excluded`,`${s.roomsExcluded} 个排除`):'',s.level?tx(`${s.level.name} (${s.level.index} de ${s.level.count})`,`${s.level.name} (${s.level.index} of ${s.level.count})`,`${s.level.name}（${s.level.index}/${s.level.count}）`):tx('Planta única','Single level','单层'),s.scale==='real'?tx('Escala confirmada','Scale confirmed','比例已确认'):tx('Medidas orientativas','Indicative dimensions','尺寸仅供参考')].filter(Boolean).join(' · ');
  if(extra)extra(copy);
  return c;
 }
 window.FloorPlanProjectPreview={read,plan,axonometric,sheet,signature,context,release,areaNumber,statusText};
})();
