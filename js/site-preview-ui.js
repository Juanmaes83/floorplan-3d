/* Project-First A3: visual Analyze and the orientation/sun/site report. Draws FloorPlanSiteVisual data (facades by
   orientation, sun path, parcel + placed footprint) next to the project's own plan. Read-only SVG with equivalent
   text; it never edits the site or the project. Orientative: not a thermal, daylight or planning certificate. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,SV=window.FloorPlanSiteVisual,Preview=window.FloorPlanProjectPreview;if(!app||!SV||!Preview)return;
 const NS='http://www.w3.org/2000/svg';
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const node=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs||{}))n.setAttribute(k,v);parent?.append(n);return n;};
 const svg=(parent,viewBox,cls,label)=>{const n=node('svg',{viewBox,class:cls},parent);if(label){n.setAttribute('role','img');n.setAttribute('aria-label',label);}else n.setAttribute('aria-hidden','true');return n;};
 const m=v=>(v/1000).toLocaleString(({es:'es-ES',en:'en-GB',zh:'zh-CN'})[typeof LANG==='string'?LANG:'es']||'es-ES',{maximumFractionDigits:1});
 const SECTOR_NAMES=()=>({N:tx('Norte','North','北'),NE:tx('Noreste','North-east','东北'),E:tx('Este','East','东'),SE:tx('Sureste','South-east','东南'),S:tx('Sur','South','南'),SO:tx('Suroeste','South-west','西南'),O:tx('Oeste','West','西'),NO:tx('Noroeste','North-west','西北')});
 const SHORT=()=>({N:'N',NE:tx('NE','NE','东北'),E:tx('E','E','东'),SE:tx('SE','SE','东南'),S:tx('S','S','南'),SO:tx('SO','SW','西南'),O:tx('O','W','西'),NO:tx('NO','NW','西北')});
 const site=()=>window.FloorPlanBuildingUI?.site||app.project.site||{};
 function data(){
  const s=site(),exterior=FloorPlanExterior.derive(app.project);
  const facades=SV.facades({project:app.project,exterior,northOffsetDeg:s.northOffsetDeg});
  const sun=SV.sunPath({site:s,Solar:window.FloorPlanSolar,stepMin:5});
  // Same footprint the placement editor uses: the building's ground level, or the single project's footprint.
  let footprint=null;try{if(app.levelContext&&typeof library!=='undefined'&&library?.building){const b=FloorPlanBuilding.setProject(library.building(),library.activeLevelId(),app.project),r=FloorPlanRoof.deriveBuilding(b,FloorPlanExterior,FloorPlanBuilding);footprint=r.status==='available'?r.levels[0].polygon:null;}else{const r=FloorPlanRoof.footprint(app.project,FloorPlanExterior);footprint=r.status==='available'?r.polygon:null;}}catch{}
  const siteView=SV.siteView({site:s,footprint,Parcel:window.FloorPlanParcelCore,Territory:window.FloorPlanTerritoryIntegration});
  return {site:s,facades,sun,siteView,exterior};
 }
 // Plan of the active floor with the declared north: the arrow points to true north (northOffsetDeg clockwise).
 function orientedPlan(parent,north,{label}={}){
  const box=el('div',undefined,parent,'site-plan');Preview.plan(box,{label:label||tx('Planta activa con el norte declarado','Active floor with the declared north','带已声明北向的当前楼层'),cls:'project-plan site-plan-drawing'});
  if(Number.isFinite(north)){const a=svg(box,'-20 -20 40 40','site-north',null);const g=node('g',{transform:`rotate(${north})`},a);node('path',{d:'M0 -15 L7 10 L0 5 L-7 10 Z',class:'site-north-arrow'},g);node('text',{x:0,y:-16.5,class:'site-north-label','text-anchor':'middle'},g).textContent='N';}
  return box;
 }
 // Facades and windows by orientation: true-north rose, bar length = window length; wall length as a faint band.
 function rose(parent,f){
  const sectors=f.sectors||[],maxW=Math.max(1,...sectors.map(s=>s.windowMm)),maxL=Math.max(1,...sectors.map(s=>s.lengthMm)),names=SECTOR_NAMES();
  const text=sectors.filter(s=>s.walls).map(s=>`${names[s.sector]}: ${m(s.windowMm)} m ${tx('de ventana','of window','窗')} / ${m(s.lengthMm)} m ${tx('de fachada','of facade','立面')}`).join('; ');
  const r=svg(parent,'-120 -120 240 240','site-rose',tx('Ventanas y fachadas por orientación. ','Windows and facades by orientation. ','按朝向的窗与立面。')+text);
  for(const rr of [30,60,90])node('circle',{r:rr,class:'site-rose-ring'},r);
  sectors.forEach((s,i)=>{const a=(i*45-90)*Math.PI/180,w=Math.PI/180*16;
   const wedge=(len,cls)=>{if(len<=0)return;const p=(ang,rad)=>`${(Math.cos(ang)*rad).toFixed(1)} ${(Math.sin(ang)*rad).toFixed(1)}`;node('path',{d:`M0 0 L${p(a-w,len)} A${len} ${len} 0 0 1 ${p(a+w,len)} Z`,class:cls},r);};
   wedge(s.lengthMm/maxL*90,'site-rose-wall');wedge(s.windowMm/maxW*90,'site-rose-window');
   const t=node('text',{x:(Math.cos(a)*106).toFixed(1),y:(Math.sin(a)*106+4).toFixed(1),'text-anchor':'middle',class:'site-rose-label'+(s.sector==='N'?' is-north':'')},r);t.textContent=SHORT()[s.sector];});
  return r;
 }
 // Sun path chart: zenith at the centre, horizon at the edge, true north up; the footprint rotated to true north.
 function sunChart(parent,sun,{label}={}){
  const R=100,pos=(az,alt)=>{const r=(90-Math.max(0,alt))/90*R,a=(az-90)*Math.PI/180;return [Math.cos(a)*r,Math.sin(a)*r];};
  const c=svg(parent,'-125 -125 250 250','site-sun',label||tx('Recorrido del sol en los días de referencia sobre la vivienda orientada al norte','Sun path on reference days over the home oriented to north','参考日太阳轨迹'));
  for(const alt of [0,30,60]){const r=(90-alt)/90*R;node('circle',{r,class:'site-sun-ring'+(alt===0?' is-horizon':'')},c);if(alt)node('text',{x:3,y:-r+9,class:'site-sun-ring-label'},c).textContent=alt+'°';}
  for(const [lab,az] of [['N',0],[tx('E','E','东'),90],['S',180],[tx('O','W','西'),270]]){const [x,y]=pos(az,-8);node('text',{x:x.toFixed(1),y:(y+4).toFixed(1),'text-anchor':'middle',class:'site-sun-cardinal'+(az===0?' is-north':'')},c).textContent=lab;}
  // Footprint: plan points rotated by −north so true north is up, scaled into the centre.
  const g=app.geometry,polys=(g?.rooms||[]).map(r=>r.poly).filter(p=>p?.length>=3);
  if(polys.length&&Number.isFinite(sun.northOffsetDeg)){const pts=polys.flat(),cx=(Math.min(...pts.map(p=>p[0]))+Math.max(...pts.map(p=>p[0])))/2,cy=(Math.min(...pts.map(p=>p[1]))+Math.max(...pts.map(p=>p[1])))/2,t=-sun.northOffsetDeg*Math.PI/180;
   const rot=([x,y])=>[(x-cx)*Math.cos(t)-(y-cy)*Math.sin(t),(x-cx)*Math.sin(t)+(y-cy)*Math.cos(t)],rotated=polys.map(p=>p.map(rot)),ext=Math.max(...rotated.flat().map(([x,y])=>Math.hypot(x,y))),k=30/ext;
   for(const p of rotated)node('polygon',{points:p.map(([x,y])=>`${(x*k).toFixed(1)},${(y*k).toFixed(1)}`).join(' '),class:'site-sun-home'},c);}
  for(const d of sun.days){const up=d.points.filter(p=>p.altitudeDeg>0);if(up.length<2)continue;
   node('path',{d:'M'+up.map(p=>pos(p.azimuthDeg,p.altitudeDeg).map(v=>v.toFixed(1)).join(' ')).join(' L'),class:'site-sun-path is-'+d.key},c);
   for(const p of up.filter(p=>/^(09|12|15|18):00$/.test(p.time))){const [x,y]=pos(p.azimuthDeg,p.altitudeDeg);node('circle',{cx:x.toFixed(1),cy:y.toFixed(1),r:2.2,class:'site-sun-hour is-'+d.key},c);if(d.key==='summer')node('text',{x:(x+4).toFixed(1),y:(y-3).toFixed(1),class:'site-sun-hour-label'},c).textContent=p.time.slice(0,2)+'h';}}
  return c;
 }
 const DAY_NAMES=()=>({summer:tx('21 de junio','21 June','6月21日'),equinox:tx('20 de marzo','20 March','3月20日'),winter:tx('21 de diciembre','21 December','12月21日')});
 const hm=min=>`${Math.floor(min/60)} h ${String(min%60).padStart(2,'0')} min`;
 function sunTable(parent,sun){
  const t=el('table',undefined,parent,'site-table');const head=el('tr',undefined,el('thead',undefined,t));
  for(const h of [tx('Día','Day','日期'),tx('Sale','Rises','日出'),tx('Se pone','Sets','日落'),tx('Horas de sol','Daylight','日照'),tx('Altura máxima','Max. height','最高高度')])el('th',h,head);
  const body=el('tbody',undefined,t);for(const d of sun.days){const r=el('tr',undefined,body);el('td',DAY_NAMES()[d.key],r,'site-day is-'+d.key);el('td',d.sunrise?'≈ '+d.sunrise:'—',r);el('td',d.sunset?'≈ '+d.sunset:'—',r);el('td',hm(d.daylightMin),r);el('td',d.maxAltitudeDeg===null?'—':`${Math.round(d.maxAltitudeDeg)}° · ${d.maxAt}`,r);}
  return t;
 }
 function siteDiagram(parent,view,{label}={}){
  const [x,y,w,h]=view.viewBox,d=svg(parent,`${x} ${y} ${w} ${h}`,'site-parcel',label||(view.building?tx('Parcela con la huella del edificio colocada','Parcel with the placed building footprint','地块及已定位建筑轮廓'):tx('Parcela; el edificio aún no está colocado','Parcel; the building is not placed yet','地块；建筑尚未定位')));
  for(const p of view.polygons)node('path',{d:p.rings.map(r=>'M'+r.map(v=>v.join(' ')).join(' L')+' Z').join(' '),class:'site-parcel-shape','fill-rule':'evenodd'},d);
  if(view.building)node('polygon',{points:view.building.map(v=>v.join(',')).join(' '),class:'site-parcel-building'},d);
  const s=Math.max(w,h)*.06,nx=x+w-s*1.4,ny=y+s*1.6,g=node('g',{transform:`translate(${nx} ${ny}) scale(${s/15})`},d);node('path',{d:'M0 -15 L7 10 L0 5 L-7 10 Z',class:'site-north-arrow'},g);node('text',{x:0,y:-17,class:'site-north-label','text-anchor':'middle'},g).textContent='N';
  return d;
 }
 const facadeLine=f=>{if(f.status==='unavailable')return tx('Sin fachadas identificadas en el plano.','No facades identified in the plan.','平面中未识别立面。');const names=SECTOR_NAMES();
  if(f.status==='relative')return tx(`${f.walls.length} muros de fachada · ${m(f.totalWindowMm)} m de ventana. Configura el norte para orientarlos.`,`${f.walls.length} facade walls · ${m(f.totalWindowMm)} m of window. Set north to orient them.`,`${f.walls.length} 面立面墙 · ${m(f.totalWindowMm)} 米窗。设置北向后可定向。`);
  const top=[...f.sectors].filter(s=>s.windowMm>0).sort((a,b)=>b.windowMm-a.windowMm);
  return top.length?tx('Más ventana hacia ','Most window towards ','窗最多朝向 ')+top.slice(0,2).map(s=>`${names[s.sector].toLowerCase()} (${m(s.windowMm)} m)`).join(tx(' y ',' and ',' 和 ')):tx('Sin ventanas en las fachadas identificadas.','No windows on the identified facades.','已识别立面无窗。');};
 // Report (§7.6): one printable document with the same diagrams and their sources. Orientative, never certified.
 const css=document.createElement('link');css.rel='stylesheet';css.href='css/site-report.css';document.head.append(css);
 const dialog=el('dialog',undefined,document.body,'site-report-dialog');dialog.id='siteReportDialog';dialog.setAttribute('aria-labelledby','siteReportTitle');
 const tools=el('div',undefined,dialog,'site-report-tools'),heading=el('h2',undefined,tools);heading.id='siteReportTitle';
 const printButton=el('button',undefined,tools,'btn');printButton.type='button';printButton.id='siteReportPrint';const closeButton=el('button',undefined,tools,'btn');closeButton.type='button';closeButton.id='siteReportClose';
 const paper=el('article',undefined,dialog,'site-report-paper');paper.id='siteReportDocument';let returnFocus=null;
 function section(title){const s=el('section',undefined,paper,'site-report-section');el('h2',title,s);return s;}
 function renderReport(){
  paper.replaceChildren();paper.lang=typeof LANG==='string'?LANG:'es';const d=data(),s=d.site,snap=window.FloorPlanBrandUI?.snapshot()||null,p=snap?.profile;
  heading.textContent=tx('Informe de orientación y emplazamiento','Orientation and site report','朝向与场地报告');printButton.textContent=tx('Imprimir / Guardar PDF','Print / Save PDF','打印 / 保存 PDF');closeButton.textContent=tx('Cerrar','Close','关闭');
  const head=el('header',undefined,paper,'site-report-head');const titles=el('div',undefined,head);el('small',tx('Informe de orientación y emplazamiento','Orientation and site report','朝向与场地报告'),titles);el('h1',snap?.title||(typeof nm==='function'?nm(app.project.name):app.project.name),titles);
  el('p',new Date().toLocaleDateString(({es:'es-ES',en:'en-GB',zh:'zh-CN'})[paper.lang]||'es-ES',{day:'numeric',month:'long',year:'numeric'}),titles,'site-report-date');
  if(p){const b=el('div',undefined,head,'site-report-brand');if(p.logo){const i=el('img',undefined,b);i.src=p.logo;i.alt=tx('Logo de ','Logo of ','标志：')+p.name;}el('strong',p.name,b);if(p.person)el('span',p.person,b);if(p.email)el('span',p.email,b);}
  const o=section(tx('Orientación y fachadas','Orientation and facades','朝向与立面')),og=el('div',undefined,o,'site-report-grid');orientedPlan(og,s.northOffsetDeg);
  const ot=el('div',undefined,og);if(d.facades.sectors){rose(ot,d.facades);const t=el('table',undefined,ot,'site-table'),hr=el('tr',undefined,el('thead',undefined,t));for(const h of [tx('Orientación','Orientation','朝向'),tx('Fachada','Facade','立面'),tx('Ventanas','Windows','窗')])el('th',h,hr);const body=el('tbody',undefined,t);for(const x of d.facades.sectors.filter(x=>x.walls)){const r=el('tr',undefined,body);el('td',SECTOR_NAMES()[x.sector],r);el('td',m(x.lengthMm)+' m',r);el('td',m(x.windowMm)+' m',r);}}
  el('p',facadeLine(d.facades),ot,'site-report-note');el('p',Number.isFinite(s.northOffsetDeg)?tx(`Norte declarado: ${s.northOffsetDeg}° respecto a la parte superior del plano.`,`Declared north: ${s.northOffsetDeg}° from the top of the plan.`,`已声明北向：相对平面上方 ${s.northOffsetDeg}°。`):tx('Norte sin configurar: las orientaciones no se pueden indicar.','North not configured: orientations cannot be stated.','未配置北向：无法标注朝向。'),ot,'site-report-note');
  if(d.facades.classification!=='available')el('p',tx('Algunos muros no se pudieron clasificar como fachada o interior; las cifras recogen sólo las fachadas identificadas.','Some walls could not be classified as facade or interior; figures only cover the identified facades.','部分墙体无法分类，数据仅含已识别立面。'),ot,'site-report-note');
  const su=section(tx('Recorrido del sol','Sun path','太阳轨迹'));
  if(d.sun.status==='available-orientative'){const sg=el('div',undefined,su,'site-report-grid');sunChart(sg,d.sun);const st=el('div',undefined,sg);sunTable(st,d.sun);el('p',tx(`Ubicación del proyecto (privada, en este archivo). Cálculo astronómico SunCalc 2.1.1 cada ${d.sun.stepMin} min, hora local ${d.sun.timeZone}. No considera relieve, edificios vecinos ni sombras.`,`Project location (private, in this file). SunCalc 2.1.1 astronomical calculation every ${d.sun.stepMin} min, local time ${d.sun.timeZone}. Terrain, neighbouring buildings and shadows are not considered.`,`项目位置（私有）。SunCalc 2.1.1 每 ${d.sun.stepMin} 分钟计算，当地时间 ${d.sun.timeZone}。不考虑地形、邻近建筑及阴影。`),st,'site-report-note');}
  else el('p',d.sun.reason==='north'?tx('Configura el norte para dibujar el recorrido del sol sobre la vivienda.','Set north to draw the sun path over the home.','设置北向以绘制太阳轨迹。'):tx('Configura la ubicación del proyecto para calcular el recorrido del sol.','Set the project location to calculate the sun path.','设置项目位置以计算太阳轨迹。'),su,'site-report-note');
  const e=section(tx('Emplazamiento','Site','场地'));
  if(d.siteView.status!=='unavailable'){const eg=el('div',undefined,e,'site-report-grid');siteDiagram(eg,d.siteView);const et=el('div',undefined,eg);const dl=el('dl',undefined,et,'site-facts');
   const fact=(k,v)=>{el('dt',k,dl);el('dd',v,dl);};fact(tx('Parcela','Parcel','地块'),d.siteView.parcelAreaM2.toLocaleString('es-ES',{maximumFractionDigits:1})+' m²');
   fact(tx('Huella colocada','Placed footprint','已定位轮廓'),d.siteView.building?d.siteView.footprintAreaM2.toLocaleString('es-ES',{maximumFractionDigits:1})+' m²':d.siteView.reason==='footprint'?tx('Sin huella demostrable','No provable footprint','无可证明轮廓'):tx('Edificio sin colocar','Building not placed','建筑未定位'));
   fact(tx('Cota del terreno','Ground level','地面标高'),d.siteView.vertical?tx('Configurada','Set','已配置'):tx('Sin configurar','Not set','未配置'));fact(tx('Ortofoto','Orthophoto','正射影像'),d.siteView.orthophoto?tx('Referencia guardada','Reference saved','已保存参考'):tx('Sin configurar','Not set','未配置'));fact(tx('Terreno','Terrain','地形'),d.siteView.terrain?tx('Referencia guardada','Reference saved','已保存参考'):tx('Sin configurar','Not set','未配置'));
   el('p',tx('Colocación contextual introducida por la persona. No es un informe urbanístico, catastral ni topográfico certificado.','Contextual placement entered by the person. Not a certified planning, cadastral or survey report.','用户输入的场地定位，非经认证的规划、地籍或测绘报告。'),et,'site-report-note');}
  else el('p',tx('Sin parcela configurada. Puedes añadirla en Analizar → Emplazamiento.','No parcel configured. Add it in Analyze → Site.','未配置地块。可在分析 → 场地中添加。'),e,'site-report-note');
  const x=section(tx('Exterior','Exterior','外部'));let roof=null;try{roof=FloorPlanRoof.deriveProject(app.project,FloorPlanExterior);}catch{}
  el('p',tx(`${d.exterior.walls.filter(w=>w.status==='facade').length} muros de fachada identificados a partir del plano. Cubierta: ${roof?.status==='available'?'derivada de la huella demostrable':'no disponible con la geometría actual'}.`,`${d.exterior.walls.filter(w=>w.status==='facade').length} facade walls identified from the plan. Roof: ${roof?.status==='available'?'derived from the provable footprint':'not available with the current geometry'}.`,`从平面识别出 ${d.exterior.walls.filter(w=>w.status==='facade').length} 面立面墙。`),x,'site-report-note');
  el('p',tx('Análisis contextual y orientativo generado por Rubik Sota a partir del proyecto. No sustituye un estudio de soleamiento, eficiencia energética, urbanismo ni topografía.','Contextual, orientative analysis generated by Rubik Sota from the project. It does not replace a sunlight, energy, planning or survey study.','由 Rubik Sota 根据项目生成的参考性分析，不替代日照、能效、规划或测绘研究。')+(p?' '+FloorPlanBrand.credit(p):''),paper,'site-report-foot');
 }
 function open(){returnFocus=document.activeElement;try{renderReport();dialog.showModal();closeButton.focus({preventScroll:true});}catch(e){toast(e.message||String(e),6000);}}
 async function print(){const win=window.open('','_blank');if(!win){toast(tx('El navegador bloqueó la ventana de impresión.','The browser blocked the print window.','浏览器阻止了打印窗口。'),5000);return;}
  const href=new URL('css/site-report.css',document.baseURI).href;win.document.open();win.document.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="'+href+'"></head><body class="site-report-print"></body></html>');win.document.close();
  win.document.title=heading.textContent;const b=win.document.createElement('button');b.textContent=printButton.textContent;b.className='site-report-print-button';b.onclick=()=>win.print();win.document.body.append(b,paper.cloneNode(true));
  const link=win.document.querySelector('link');await Promise.race([new Promise(r=>{if(link.sheet)return r();link.onload=r;link.onerror=r;}),new Promise(r=>setTimeout(r,1800))]);win.focus();win.print();}
 printButton.onclick=print;closeButton.onclick=()=>dialog.close();dialog.addEventListener('close',()=>returnFocus?.focus?.({preventScroll:true}));
 window.FloorPlanSitePreview={data,orientedPlan,rose,sunChart,sunTable,siteDiagram,facadeLine,SECTOR_NAMES,DAY_NAMES,openReport:open,get reportOpen(){return dialog.open;}};
})();
