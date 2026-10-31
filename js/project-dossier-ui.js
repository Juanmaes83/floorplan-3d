/* Project-First A4: automatic professional dossier (§7.3) with professional styles (§7.7). It composes, for one
   printable document, the outputs Rubik already produces from the project: the real sheet (FloorPlanSheet.preview),
   the surface figures (FloorPlanSurfaceMetrics), orientation/sun/site (FloorPlanSitePreview), the prepared real 3D
   views (FloorPlanProjectViews) and the selected signature (FloorPlanBrandUI). Sections without data are left out or
   say what is missing; nothing is invented. A style changes the composition, never the project. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,Visual=window.FloorPlanProjectVisual,Preview=window.FloorPlanProjectPreview;if(!app||!Visual||!Preview)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const name=()=>typeof nm==='function'?nm(app.project.name):app.project.name;
 const locale=()=>({es:'es-ES',en:'en-GB',zh:'zh-CN'})[typeof LANG==='string'?LANG:'es']||'es-ES';
 // Styles: which sections, in which order, and the visual tone. Same data for every style.
 const STYLES={
  technical:{label:()=>tx('Técnico','Technical','技术'),sections:['cover','sheet','surfaces','orientation','site','exterior','views','review','economic','sources']},
  client:{label:()=>tx('Cliente','Client','客户'),sections:['cover','views','sheet','surfaces','orientation','review','economic']},
  realestate:{label:()=>tx('Inmobiliario','Real estate','房产'),sections:['cover','views','surfaces','sheet','site','orientation']},
  studio:{label:()=>tx('Estudio','Studio','事务所'),sections:['cover','sheet','views','surfaces','orientation','site','economic','sources']}};
 const css=document.createElement('link');css.rel='stylesheet';css.href='css/project-dossier.css';document.head.append(css);
 let style='technical',urls=[],returnFocus=null;
 function metrics(){const s=window.FloorPlanBuildingUI?.presentationSources?.();return FloorPlanSurfaceMetrics.home(s?{levels:s.levels.map(l=>({id:l.levelId,name:l.name,order:l.order,project:l.project}))}:app.project);}
 function reviewCounts(){try{const s=JSON.parse(localStorage.getItem('rubik-review-v1')||'{}')[app.project.id];return {pending:(s?.received||[]).reduce((n,r)=>n+r.doc.notes.filter(x=>r.decisions[x.id]==='pending').length,0),written:s?.draft?.notes?.length||0};}catch{return {pending:0,written:0};}}
 // What the dossier can contain right now, per section: ready (real content) or missing (said in the document).
 // known.sheet lets a host that already built the sheet preview skip a second build.
 function contents(known={}){
  const m=metrics(),summary=Visual.summary({project:app.project,geometry:app.geometry,metrics:m,levelContext:app.levelContext,brand:window.FloorPlanBrandUI?.snapshot()||null});
  let sheetOk=known.sheet;if(sheetOk===undefined){try{sheetOk=!!window.FloorPlanSheet?.preview?.();}catch{sheetOk=false;}}
  const site=window.FloorPlanSitePreview?.data(),views=window.FloorPlanProjectViews?.current()||[],review=reviewCounts();
  return {summary,metrics:m,sections:{cover:true,sheet:sheetOk,surfaces:m.areaM2!==null,orientation:!!site&&site.facades.status!=='unavailable',site:!!site&&site.siteView.status!=='unavailable',exterior:true,views:views.length>0,review:review.pending+review.written>0,sources:true},site,views,review};
 }
 function release(){for(const u of urls)URL.revokeObjectURL(u);urls=[];}
 // Own copy of the real sheet image: the workspace releases its previews on every render.
 function sheetImage(parent,bag=urls){let svg;try{svg=FloorPlanSheet.preview();}catch{return false;}const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'}));bag.push(url);
  const img=el('img',undefined,parent,'dossier-sheet-image');img.src=url;img.alt=tx('Lámina de distribución del proyecto','Project floor plan sheet','项目平面图纸');return true;}
 // bag: where the blob URLs of this composition are kept (the dialog's own list unless a host composes its copy).
 function render(paper,st=style,bag=null){
  if(!bag){release();bag=urls;}paper.replaceChildren();paper.dataset.style=st;paper.lang=typeof LANG==='string'?LANG:'es';
  const c=contents(),s=c.summary,b=s.brand,area=Preview.areaNumber(s),status=Preview.statusText(s);
  const page=(cls,title)=>{const p=el('section',undefined,paper,'dossier-page '+cls);if(title)el('h2',title,p);return p;};
  for(const key of STYLES[st].sections){
   if(key==='cover'){const p=page('dossier-cover');const head=el('header',undefined,p,'dossier-cover-head');
     if(b){const brand=el('div',undefined,head,'dossier-brand');if(b.logo){const i=el('img',undefined,brand);i.src=b.logo;i.alt=tx('Logo de ','Logo of ','标志：')+b.name;}el('strong',b.name,brand);if(b.person)el('span',b.person,brand);}
     el('small',tx('Dossier del proyecto','Project dossier','项目资料'),head,'dossier-kicker');
     el('h1',name(),p,'dossier-title');
     const overview=c.views.find(v=>v.kind==='overview');const visual=el('figure',undefined,p,'dossier-cover-visual');
     if(overview){const i=el('img',undefined,visual);i.src=overview.dataUrl;i.alt=tx('Vista general real de la vivienda en 3D','Real 3D overview of the home','住宅真实三维总览');}
     else Preview.plan(visual,{label:tx('Planta de la vivienda','Floor plan of the home','住宅平面'),cls:'project-plan dossier-plan'});
     const facts=el('dl',undefined,p,'dossier-facts');const fact=(k,v,cls)=>{const g=el('div',undefined,facts,cls);el('dt',k,g);el('dd',v,g);};
     fact(tx('Superficie útil','Net area','使用面积'),area);fact(tx('Certeza','Certainty','可信度'),status+(s.complete?'':tx(' · cómputo incompleto',' · incomplete total',' · 汇总不完整')));
     fact(tx('Estancias','Rooms','房间'),String(s.roomsCounted));fact(tx('Planta','Level','楼层'),s.level?`${s.level.name}`:tx('Planta única','Single level','单层'));
     fact(tx('Fecha','Date','日期'),new Date().toLocaleDateString(locale(),{day:'numeric',month:'long',year:'numeric'}));
     if(b&&(b.email||b.phone||b.web))fact(tx('Contacto','Contact','联系方式'),[b.email,b.phone,b.web].filter(Boolean).join(' · '),'is-wide');continue;}
   if(key==='sheet'){const p=page('dossier-sheet',tx('Plano de distribución','Floor plan','平面布置图'));if(!(c.sections.sheet&&sheetImage(el('div',undefined,p,'dossier-sheet-frame'),bag)))el('p',tx('El plano no está preparado: abre la planta 2D para generarlo.','The plan is not ready: open the 2D floor to generate it.','平面图未就绪：请打开二维楼层生成。'),p,'dossier-note');continue;}
   if(key==='surfaces'){const p=page('dossier-surfaces',tx('Superficies','Areas','面积'));
     if(!c.sections.surfaces){el('p',tx('Superficie no disponible con la geometría actual.','Area not available with the current geometry.','当前几何无法计算面积。'),p,'dossier-note');continue;}
     el('p',area+' · '+status,p,'dossier-total');const t=el('table',undefined,p,'dossier-table'),hr=el('tr',undefined,el('thead',undefined,t));
     for(const h of [tx('Estancia','Room','房间'),tx('Superficie','Area','面积')])el('th',h,hr);const body=el('tbody',undefined,t);
     for(const l of c.metrics.levels){if(c.metrics.levels.length>1){const r=el('tr',undefined,body,'dossier-level');el('td',l.name||'',r).colSpan=2;}
      for(const r of l.rooms){const row=el('tr',undefined,body,r.counted?'':'is-excluded');el('td',(typeof nm==='function'?nm(r.name):r.name)+(r.counted?'':tx(' (fuera del cómputo)',' (outside the total)',' (不计入)')),row);el('td',r.areaM2===null?tx('No disponible','Unavailable','暂无'):Preview.areaNumber({areaM2:r.areaM2}),row);}}
     el('p',tx('Superficies orientativas a partir del plano; verifica medidas in situ.','Indicative areas from the plan; verify on site.','面积仅供参考，请实地核验。'),p,'dossier-note');continue;}
   if(key==='orientation'){if(!c.sections.orientation)continue;const SP=FloorPlanSitePreview,d=c.site,p=page('dossier-orientation',tx('Orientación y sol','Orientation and sun','朝向与日照')),g=el('div',undefined,p,'dossier-grid');
     SP.orientedPlan(g,d.site.northOffsetDeg);const side=el('div',undefined,g);if(d.facades.sectors)SP.rose(side,d.facades);el('p',SP.facadeLine(d.facades),side,'dossier-note');
     if(d.sun.status==='available-orientative'){const g2=el('div',undefined,p,'dossier-grid');SP.sunChart(g2,d.sun);const st=el('div',undefined,g2);SP.sunTable(st,d.sun);el('p',tx('Recorrido orientativo del sol (SunCalc). No considera relieve ni edificios vecinos.','Orientative sun path (SunCalc). Terrain and neighbouring buildings are not considered.','参考太阳轨迹（SunCalc）。'),st,'dossier-note');}
     else el('p',tx('Sin ubicación o norte configurados: no se incluye el recorrido del sol.','Location or north not configured: the sun path is not included.','未配置位置或北向：不含太阳轨迹。'),p,'dossier-note');continue;}
   if(key==='site'){if(!c.sections.site)continue;const SP=FloorPlanSitePreview,v=c.site.siteView,p=page('dossier-site',tx('Emplazamiento','Site','场地')),g=el('div',undefined,p,'dossier-grid');SP.siteDiagram(g,v);
     el('p',tx(`Parcela de ${v.parcelAreaM2.toLocaleString(locale(),{maximumFractionDigits:1})} m². `,`${v.parcelAreaM2} m² parcel. `,`地块 ${v.parcelAreaM2} m²。`)+(v.building?tx('Huella colocada por el profesional.','Footprint placed by the professional.','轮廓由专业人员定位。'):tx('El edificio no está colocado.','The building is not placed.','建筑未定位。'))+' '+tx('No es un informe urbanístico ni catastral certificado.','Not a certified planning or cadastral report.','非经认证的规划或地籍报告。'),g,'dossier-note');continue;}
   if(key==='exterior'){const p=page('dossier-exterior',tx('Exterior','Exterior','外部'));let roof=null;try{roof=FloorPlanRoof.deriveProject(app.project,FloorPlanExterior);}catch{}
     const facades=FloorPlanExterior.derive(app.project).walls.filter(w=>w.status==='facade').length;el('p',tx(`${facades} muros de fachada identificados a partir del plano. Cubierta: ${roof?.status==='available'?'derivada de la huella':'no disponible con la geometría actual'}.`,`${facades} facade walls identified from the plan. Roof: ${roof?.status==='available'?'derived from the footprint':'not available with the current geometry'}.`,`识别出 ${facades} 面立面墙。`),p,'dossier-note');continue;}
   if(key==='views'){const p=page('dossier-views',tx('Imágenes de la vivienda','Images of the home','住宅图片'));
     if(!c.sections.views){el('p',tx('Sin vistas preparadas. Prepáralas en Entregar → Imágenes para incluirlas.','No views prepared. Prepare them in Deliver → Images to include them.','尚未准备视图。'),p,'dossier-note');continue;}
     const g=el('div',undefined,p,'dossier-gallery');for(const v of c.views){const f=el('figure',undefined,g);const i=el('img',undefined,f);i.src=v.dataUrl;i.alt=tx('Vista 3D real: ','Real 3D view: ','真实三维视图：')+v.label;el('figcaption',v.label,f);}
     el('p',tx('Vistas de la vista 3D real del proyecto. Imágenes orientativas.','Views from the project\'s real 3D view. Indicative images.','来自项目真实三维视图，仅供参考。'),p,'dossier-note');continue;}
   if(key==='review'){if(!c.sections.review)continue;const p=page('dossier-review',tx('Observaciones','Observations','意见'));el('p',c.review.pending?tx(`${c.review.pending} observaciones del cliente pendientes de decisión.`,`${c.review.pending} client observations pending a decision.`,`${c.review.pending} 条客户意见待决定。`):tx(`${c.review.written} observaciones redactadas para el cliente.`,`${c.review.written} observations written for the client.`,`已为客户撰写 ${c.review.written} 条意见。`),p,'dossier-note');continue;}
   // C4: compact economic page, only when a budget was prepared, from the same report as the economic dossier; the client style uses the client variant.
   if(key==='economic'&&window.FloorPlanEconomicDossierUI?.current()){const p=page('dossier-economic',tx('Presupuesto','Budget','预算'));FloorPlanEconomicDossierUI.section(p,st==='client'?'client':'professional');}
   if(key==='sources'){const p=page('dossier-sources',tx('Fuentes y alcance','Sources and scope','来源与范围'));const ul=el('ul',undefined,p);
     for(const line of [tx('Geometría, superficies y plano: el proyecto Rubik de este dossier.','Geometry, areas and plan: the Rubik project of this dossier.','几何、面积与平面：本资料对应的 Rubik 项目。'),s.scale==='real'?tx('Escala confirmada por el profesional.','Scale confirmed by the professional.','比例经专业人员确认。'):tx('Medidas orientativas: escala sin calibración confirmada.','Indicative dimensions: scale without confirmed calibration.','尺寸仅供参考：比例未确认。'),tx('Orientación, sol y emplazamiento: datos declarados por el profesional; cálculo solar SunCalc 2.1.1.','Orientation, sun and site: data declared by the professional; SunCalc 2.1.1 solar calculation.','朝向、日照与场地：专业人员声明的数据；SunCalc 2.1.1。'),(window.FloorPlanEconomicDossierUI?.current()?tx('Presupuesto: preparado por el profesional en Presupuestar; cifras orientativas, ver «Presupuesto».','Budget: prepared by the professional in Budget; indicative figures, see «Budget».','预算：由专业人员准备；参考数字。'):tx('No se ha preparado presupuesto para este proyecto.','No budget has been prepared for this project.','尚未为此项目准备预算。'))])el('li',line,ul);}
  }
  el('p',tx('Dossier generado por Rubik Sota a partir del proyecto. Documento orientativo; no es un proyecto técnico visado.','Dossier generated by Rubik Sota from the project. Orientative document; not a certified technical project.','由 Rubik Sota 根据项目生成的参考资料，非经审定的技术项目。')+(b?' '+FloorPlanBrand.credit({name:b.name}):''),paper,'dossier-foot');
  return c;
 }
 const dialog=el('dialog',undefined,document.body,'dossier-dialog');dialog.id='dossierDialog';dialog.setAttribute('aria-labelledby','dossierTitle');
 const tools=el('div',undefined,dialog,'dossier-tools'),heading=el('h2',undefined,tools);heading.id='dossierTitle';
 const styleLabel=el('label',undefined,tools,'dossier-style'),styleText=el('span',undefined,styleLabel),select=el('select',undefined,styleLabel);select.id='dossierStyle';
 const printButton=el('button',undefined,tools,'btn');printButton.type='button';printButton.id='dossierPrint';const closeButton=el('button',undefined,tools,'btn');closeButton.type='button';closeButton.id='dossierClose';
 const paper=el('article',undefined,dialog,'dossier-paper');paper.id='dossierDocument';
 function relang(){heading.textContent=tx('Dossier del proyecto','Project dossier','项目资料');styleText.textContent=tx('Estilo','Style','风格');printButton.textContent=tx('Imprimir / Guardar PDF','Print / Save PDF','打印 / 保存 PDF');closeButton.textContent=tx('Cerrar','Close','关闭');
  select.replaceChildren(...Object.entries(STYLES).map(([k,v])=>{const o=document.createElement('option');o.value=k;o.textContent=v.label();return o;}));select.value=style;}
 select.onchange=()=>{style=STYLES[select.value]?select.value:'technical';render(paper);};
 function open(initial){returnFocus=document.activeElement;if(initial&&STYLES[initial])style=initial;relang();try{render(paper);dialog.showModal();select.focus({preventScroll:true});}catch(e){toast(e.message||String(e),6000);}}
 async function print(){const win=window.open('','_blank');if(!win){toast(tx('El navegador bloqueó la ventana de impresión.','The browser blocked the print window.','浏览器阻止了打印窗口。'),5000);return;}
  const sheets=['css/project-dossier.css','css/site-report.css'].map(h=>new URL(h,document.baseURI).href);win.document.open();win.document.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+sheets.map(h=>'<link rel="stylesheet" href="'+h+'">').join('')+'</head><body class="dossier-print"></body></html>');win.document.close();
  win.document.title=heading.textContent+' · '+name();const b=win.document.createElement('button');b.textContent=printButton.textContent;b.className='dossier-print-button';b.onclick=()=>win.print();
  // The sheet preview is a blob image of this window: inline it as data so the print window owns its copy.
  const copy=paper.cloneNode(true);for(const img of copy.querySelectorAll('img[src^="blob:"]')){try{const blob=await (await fetch(img.src)).blob();img.src=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(blob);});}catch{}}
  win.document.body.append(b,copy);const links=[...win.document.querySelectorAll('link')];await Promise.race([Promise.all(links.map(l=>new Promise(r=>{if(l.sheet)return r();l.onload=r;l.onerror=r;}))),new Promise(r=>setTimeout(r,2000))]);win.focus();win.print();}
 printButton.onclick=print;closeButton.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{release();returnFocus?.focus?.({preventScroll:true});});
 // compose: the same document for another host (the client file); the caller owns and revokes `bag`.
 window.FloorPlanDossier={open,contents,STYLES,compose:(paper,st='client',bag=[])=>{render(paper,STYLES[st]?st:'client',bag);return bag;},get style(){return style;},get active(){return dialog.open;}};
})();
