/* RUBIK · Asistente IA V2 · interfaz: un único panel contextual, accesible desde Diseñar, Analizar, Presupuestar y
   Entregar (botón «Asistente» en la navegación de áreas). Consulta guiada SIN modelo de lenguaje: cada respuesta sale
   de RubikAssistantSession y muestra su fuente (motor, estado medido/estimado y revisión).
   Las propuestas (AG-2) no tocan el proyecto: se muestran como diff con «Aplicar» y «Descartar». «Aplicar» (AG-3)
   revalida contra el proyecto ACTUAL y entra en un solo paso del commit del editor (FloorPlanApp.applyAssistant):
   validación, guarda BW5, extensiones R03/R02-A, deshacer y guardado son los de siempre. «Deshacer» y «Rehacer» son los
   mismos botones del editor (#undo / #redo).
   Visual (AG-4): solo abre el flujo existente (Render IA en Entregar); el gasto lo confirma ese diálogo.
   Nada se envía fuera del navegador. La conversación se guarda solo en este navegador (por proyecto) y se puede borrar.
   Para la QA: cada paso emite el evento `rubik-assistant` y window.RubikAssistantUI expone lecturas de estado. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,Sess=window.RubikAssistantSession,Prop=window.RubikAssistantProposals,RT=window.RubikAssistantRuntime,T=window.RubikAssistantDomainTools,K=window.RubikAssistantContracts;
 if(!app||!Sess||!Prop||!RT||!T||!K)return;
 const L=()=>typeof LANG==='string'&&['es','en','zh'].includes(LANG)?LANG:'es';
 const tx=(es,en,zh)=>({es,en,zh})[L()];
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const Journey=window.RubikAssistantJourney;
 const STORE='rubik-assistant-v1',MAX_LOG=40;
 const state={open:false,pending:null,proposal:null,applied:null,trace:[],latencyMs:0,log:[]};
 const emit=(type,detail={})=>{const e={type,at:Date.now(),...detail};state.trace.push(e);if(state.trace.length>200)state.trace.shift();dispatchEvent(new CustomEvent('rubik-assistant',{detail:e}));};
 const read=()=>{try{const v=JSON.parse(localStorage.getItem(STORE));return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}};
 const write=v=>{try{localStorage.setItem(STORE,JSON.stringify(v));}catch{}};
 // ----- Context from the open project (read-only) -----
 const names=n=>{const out=[];if(typeof n!=='string'||!n)return out;for(const map of [typeof NAMES_ES==='object'?NAMES_ES:null,typeof NAMES_EN==='object'?NAMES_EN:null])if(map&&map[n])out.push(map[n]);out.push(n);return out;};
 const SYN=[[/parqu|madera|wood|roble|oak|nogal|walnut|木/i,['madera','wood','木地板','parquet']],[/m[áa]rmol|marble|大理石/i,['mármol','marble']],[/baldosa|tile|azulejo|砖/i,['baldosa','tile','瓷砖']],[/moqueta|alfombra|carpet|地毯/i,['moqueta','carpet','地毯']],[/terraz|水磨石/i,['terrazo','terrazzo']]];
 function context(){
  const p=app.project,disp=r=>{try{return typeof roomDisplay==='function'?roomDisplay(r):r.name;}catch{return r.name;}};
  const famLabel=r=>{try{return typeof familyLabel==='function'&&r.family?familyLabel(r.family):null;}catch{return null;}};
  const rooms={},objects={},materials={};
  for(const r of p.rooms)rooms[r.id]=[...new Set([disp(r),...names(r.name),famLabel(r)].filter(Boolean))];
  const shown=n=>{try{return typeof nm==='function'?nm(n):n;}catch{return n;}};
  for(const o of p.objects)objects[o.id]=[...new Set([window.FloorPlanDisplayName?.(o.name,o.type)||shown(o.name),...names(o.name),o.type].filter(Boolean))];
  // CAT-04: products of «Mis catálogos» (names, SKU, collection) and which object is linked to which product.
  const products={},objectProduct={};let catalog=null,catalogReport=null,visualRefs=null;
  try{const C4=window.RubikCat04;if(C4){const ac=C4.assistantContext(),cats=C4.catalogs(),P=window.RubikCatalogPlacement;
   const all=cats.flatMap(c=>c.products.map(x=>({key:P.itemIdOf({...x,studioId:c.studioId,catalogId:c.catalogId}),catalogId:c.catalogId,catalogRevision:c.revision,productId:x.productId,variantId:x.variantId||null,sku:x.sku,displayName:x.displayName,collection:x.collection||null,kind:x.kind,placeable:x.kind!=='material'&&x.dimensionsStatus==='verified',synthetic:x.source?.kind==='synthetic-fixture',
    sheetPrice:x.commercial?.netUnitPrice!=null?{unitPrice:x.commercial.netUnitPrice,unit:x.commercial.unit,label:x.commercial.priceSource,asOf:x.commercial.verifiedAt,edition:`rev ${c.revision} · ficha v${x.productVersion}`}:null})));
   for(const x of all)products[x.key]=[...new Set([shown(x.displayName),x.sku,x.collection].filter(Boolean))];
   for(const [oid,l] of Object.entries(P.links(p).active))objectProduct[oid]=P.itemIdOf(l);
   catalog={studioId:ac.studioId,catalogs:ac.catalogs,products:all};const sm=C4.summary();catalogReport=sm?sm.items:[];visualRefs=C4.visualRefs();}}catch(e){console.warn('[Asistente] CAT-04:',e?.message||e);}
  for(const m of p.materials||[]){const base=[...new Set([shown(m.name),...names(m.name)].filter(Boolean))];const extra=SYN.filter(([re])=>base.some(b=>re.test(b))).flatMap(([,w])=>w);materials[m.id]=[...base,...extra];}
  let budget=null,saved=false;try{const c=window.FloorPlanBudgetUI?.current?.();if(c){budget=c.budget;saved=!!c.saved;}}catch{}
  let selection=null;try{selection=app.capturePresentationEntry?.().selection||null;}catch{}
  const levels=window.FloorPlanBuildingUI?.presentationSources?.()?.levels||null;
  const caps=RT.capabilities({registry:window.FloorPlanCapabilities,modules:{render:!!window.FloorPlanAIRender,photoReform:!!window.RubikPhotoReformProvider||!!window.RubikPhotoReformCore,photoReformConfigured:false,catalog:!!window.RubikCat04}});
  return {project:p,budget,budgetSaved:saved,levels,selection,area:area(),lang:L(),labels:{rooms,objects,materials,products,objectProduct},caps,catalog,catalogReport,visualRefs,renderStyles:window.FloorPlanAIRender?.STYLES?.()||[]};
 }
 function area(){const cur=document.querySelector('[id^="workArea-"][aria-current="page"]');const k=cur?.id?.replace('workArea-','');return K.AREAS.includes(k)?k:'design';}
 // ----- Panel -----
 const panel=el('section',undefined,document.body,'assistant-panel');panel.id='assistantPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-labelledby','assistantTitle');
 const head=el('div',undefined,panel,'assistant-head');const title=el('h2',undefined,head);title.id='assistantTitle';
 const close=btn('×',head,'btn assistant-close');close.id='assistantClose';
 const mode=el('p',undefined,panel,'assistant-mode');mode.id='assistantMode';
 const ctxLine=el('p',undefined,panel,'assistant-context');ctxLine.id='assistantContext';
 const log=el('ol',undefined,panel,'assistant-log');log.id='assistantLog';log.setAttribute('aria-live','polite');
 const card=el('div',undefined,panel,'assistant-proposal');card.id='assistantProposal';card.hidden=true;
 const journey=el('details',undefined,panel,'assistant-journey');
 journey.id='assistantJourney';journey.hidden=!!window.RUBIK_DELIVERY;panel.insertBefore(journey,log);
 const journeyTitle=el('summary',undefined,journey);
 const journeyForm=el('div',undefined,journey,'assistant-journey-options');
 const phaseLabel=el('label',undefined,journeyForm);
 const phaseText=el('span',undefined,phaseLabel);
 const phaseSelect=el('select',undefined,phaseLabel);phaseSelect.id='assistantPhase';
 const stepLabel=el('label',undefined,journeyForm);
 const stepText=el('span',undefined,stepLabel);
 const stepSelect=el('select',undefined,stepLabel);stepSelect.id='assistantStep';
 const guideBtn=btn('',journeyForm,'btn');guideBtn.id='assistantGuideStep';
 const guidance=el('div',undefined,journey,'assistant-guidance');guidance.hidden=true;guidance.setAttribute('aria-live','polite');
 const chips=el('div',undefined,panel,'assistant-chips');chips.id='assistantSuggestions';
 const form=el('form',undefined,panel,'assistant-form');form.id='assistantForm';
 const input=el('textarea',undefined,form);input.id='assistantInput';input.rows=2;input.maxLength=500;
 const send=el('button',undefined,form,'btn primary');send.type='submit';send.id='assistantSend';
 const stop=btn('',form,'btn');stop.id='assistantStop';stop.hidden=true;
 const foot=el('div',undefined,panel,'assistant-foot');const clear=btn('',foot,'btn link');clear.id='assistantClear';
 const mcp=el('details',undefined,foot,'assistant-mcp');mcp.id='assistantMcp';foot.prepend(mcp);
 const mcpTitle=el('summary',undefined,mcp);
 const mcpInfo=el('p',undefined,mcp,'assistant-note');
 const mcpExport=btn('',mcp,'btn');
 mcpExport.onclick=()=>document.getElementById('exportJsonQuick')?.click();
 const opener=btn('',null,'btn assistant-open');opener.id='assistantOpen';
 // E2 · el asistente acompaña en TODA la plataforma, también con un diálogo modal abierto (presupuesto, obra, diseño, marca…).
 // Regla: NO se inserta nada visible para el código del diálogo. Dentro del diálogo solo hay un acceso encapsulado en un
 // shadow root CERRADO (las consultas genéricas «button», «form», «select,input,button» del diálogo no lo ven: no lo
 // desactivan, no le dan el foco, no lo cuentan). El panel se abre en su PROPIO diálogo modal (#assistantHost) por encima,
 // nunca dentro del diálogo de la aplicación. Fuera de diálogos: botón de la navegación de áreas, o flotante si no se ve.
 const fab=btn('',document.body,'assistant-fab');fab.id='assistantFab';fab.type='button';
 const access=document.createElement('rubik-assistant-access');access.id='assistantAccess';
 const accessRoot=access.attachShadow({mode:'closed'});
 const accessStyle=document.createElement('style');accessStyle.textContent=':host{display:block;position:sticky;bottom:8px;z-index:2;width:max-content;max-width:calc(100% - 36px);margin:8px 18px 8px auto}:host([data-inline]){position:static;margin:12px 0 4px auto}button{min-height:40px;padding:0 16px;border-radius:999px;border:1px solid #184e52;background:#184e52;color:#fff;font:700 15px/1 system-ui,sans-serif;cursor:pointer}button:hover{background:#0f3a3d}button:focus-visible{outline:3px solid #f3c969;outline-offset:2px}button[hidden]{display:none}@media print{:host{display:none}}';
 const accessBtn=document.createElement('button');accessBtn.type='button';accessRoot.append(accessStyle,accessBtn);
 const hostDlg=document.createElement('dialog');hostDlg.id='assistantHost';hostDlg.className='assistant-host';document.body.append(hostDlg);
 const where=el('p',undefined,null,'assistant-where');where.id='assistantWhere';panel.insertBefore(where,panel.children[1]||null);
 const hostDialog=()=>{const m=[...document.querySelectorAll('dialog[open]')].filter(d=>{if(d===hostDlg)return false;try{return d.matches(':modal');}catch{return false;}});return m[m.length-1]||null;};
 // Superficies NO modales a pantalla completa (la presentación): el flotante, fijo abajo a la derecha, taparía sus controles
 // (las paradas). La superficie se declara con [data-assistant-host]; mientras se ve, el acceso va EN FLUJO al final de ella
 // (sin sticky: no se superpone a nada) y el flotante se oculta. Un modal abierto tiene prioridad.
 const hostSurface=()=>[...document.querySelectorAll('[data-assistant-host]')].find(x=>x.getClientRects().length>0)||null;
 let ownCloses=0,lastHost=null;/* «close» de <dialog> llega en una tarea posterior: se cuentan los cierres propios */const watcher=new MutationObserver(()=>{if(lastHost&&lastHost.lastElementChild!==access)rehost();});
 const closeHost=()=>{if(hostDlg.open){ownCloses++;hostDlg.close();}};
 const own=n=>n===fab||n===access||n===hostDlg||panel.contains(n);
 function rehost(){const modal=hostDialog(),d=modal||hostSurface();access.toggleAttribute('data-inline',!modal&&!!d);
  if(d!==lastHost){watcher.disconnect();if(d)watcher.observe(d,{childList:true,subtree:true});if(hostDlg.open&&d)closeHost();lastHost=d;}
  const t=d?(d.querySelector('h1,h2,h3,[id$="Title"]')?.textContent||'').trim():'';
  where.hidden=!t;where.textContent=t?tx(`Estás en: ${t}`,`You are in: ${t}`,`当前位置：${t}`):'';
  // Acceso dentro del diálogo: ÚLTIMO elemento, pegado al borde inferior visible (sticky). No empuja el contenido (en la
  // bienvenida a 844×390 la primera entrada seguiría fuera de pantalla) ni entra en la fila de cabecera (la desbordaría en móvil).
  if(d){if(d.lastElementChild!==access)d.append(access);}
  else access.remove();
  // Panel: en su diálogo propio si hay un modal; si no, en el documento.
  const box=state.open&&d?hostDlg:document.body;if(panel.parentNode!==box)box.append(panel);panel.classList.toggle('in-dialog',!!d);
  if(state.open&&d&&!hostDlg.open)hostDlg.showModal();else if(!(state.open&&d))closeHost();
  accessBtn.hidden=state.open;
  const navVisible=opener.isConnected&&opener.offsetParent!==null&&!opener.closest('[inert]');
  fab.hidden=state.open||!!d||navVisible;}
 hostDlg.addEventListener('cancel',e=>{e.preventDefault();closePanel();});
 hostDlg.addEventListener('close',()=>{if(ownCloses>0){ownCloses--;return;}if(state.open)closePanel();});
 // Las mutaciones de los propios elementos del asistente no reprograman (evita un bucle: rehost escribe «hidden»).
 new MutationObserver(rs=>{if(rs.some(r=>!own(r.target)))rehost();}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','hidden']});
 document.addEventListener('close',e=>{if(e.target!==hostDlg)setTimeout(rehost,0);},true);addEventListener('resize',()=>rehost());
 function mountOpener(){const nav=document.querySelector('[data-assistant-opener-host]')||document.getElementById('professionalNav');if(nav&&!nav.contains(opener))nav.append(opener);else if(!nav&&!opener.isConnected)document.querySelector('header')?.append(opener);}
 function labels(){
  title.textContent=tx('Asistente RUBIK','RUBIK assistant','RUBIK 助手');close.setAttribute('aria-label',tx('Cerrar el asistente','Close the assistant','关闭助手'));
  mode.textContent=window.RubikAssistantGenUI?.active()
   ?tx('Pregunta en tus propias palabras. La IA consulta las herramientas de RUBIK. Tú confirmas cualquier cambio.','Ask in your own words. AI consults RUBIK tools. You confirm every change.','可用自己的语言提问。AI 查询 RUBIK 工具。任何更改均由你确认。')
   :tx('Consulta guiada sin modelo de lenguaje: responde con los datos del proyecto abierto y muestra la fuente. No envía nada fuera de este navegador.','Guided query without a language model: it answers with the open project data and shows the source. Nothing leaves this browser.','无语言模型的引导式查询：根据打开的项目数据回答并显示来源。不会发送到浏览器之外。');
  input.placeholder=tx('Pregunta por estancias, superficies, conflictos o presupuesto…','Ask about rooms, areas, conflicts or budget…','询问房间、面积、冲突或预算……');input.setAttribute('aria-label',tx('Tu consulta','Your question','你的问题'));
  journeyTitle.textContent=tx('Guía de las cinco fases','Guide to the five phases','五阶段指南');
  phaseText.textContent=tx('Fase','Phase','阶段');stepText.textContent=tx('Qué quieres hacer','What do you want to do?','想做什么');
  guideBtn.textContent=tx('Ver cómo','Show me how','查看操作');
  const phase=phaseSelect.value,step=stepSelect.value;
  phaseSelect.replaceChildren(...Journey.list(L()).map(p=>option(p.id,p.label)));
  if(phase)phaseSelect.value=phase;
  setJourneySteps(step);
  if(guidance.dataset.lang&&guidance.dataset.lang!==L())clearGuidance();
  mcp.hidden=!!window.RUBIK_DELIVERY;
  mcpTitle.textContent=tx('Revisar con MCP local','Review with local MCP','用本地 MCP 检查');
  mcpExport.textContent=tx('Guardar JSON para MCP','Save JSON for MCP','保存供 MCP 使用的 JSON');
  mcpExport.hidden=!!app.levelContext;
  mcpInfo.textContent=app.levelContext
   ?tx('MCP revisa una planta por archivo. Para revisar un edificio, exporta la planta que quieras analizar desde Plantas.','MCP reviews one floor per file. For a building, export the floor you want to analyse from Floors.','MCP 每个文件仅检查一个楼层。对于多层建筑，请从“楼层”导出要分析的楼层。')
   :tx('Guarda el JSON y selecciónalo en tu cliente MCP local. Allí puedes diagnosticar, proponer y simular. La variante se guarda aparte tras confirmarla en la terminal.','Save the JSON and select it in your local MCP client. There you can diagnose, propose and simulate. The variant is saved separately after you confirm it in the terminal.','保存 JSON 后，在本地 MCP 客户端选择文件，即可诊断、提出建议并模拟。终端确认后，方案将单独保存。');
  send.textContent=tx('Preguntar','Ask','提问');stop.textContent=tx('Detener','Stop','停止');clear.textContent=tx('Borrar conversación','Clear conversation','清除对话');
  for(const b of [fab,accessBtn]){b.textContent=tx('Asistente','Assistant','助手');b.setAttribute('aria-label',tx('Abrir el asistente RUBIK aquí','Open the RUBIK assistant here','在此打开 RUBIK 助手'));b.setAttribute('aria-expanded',String(state.open));}fab.setAttribute('aria-controls','assistantPanel');
  opener.textContent=tx('Asistente','Assistant','助手');opener.setAttribute('aria-label',tx('Abrir el asistente RUBIK','Open the RUBIK assistant','打开 RUBIK 助手'));opener.setAttribute('aria-expanded',String(state.open));opener.setAttribute('aria-controls','assistantPanel');
 }
 const SUGG={design:[['¿Cuántas estancias hay?','How many rooms are there?','有几个房间？'],['¿Qué conflictos tiene la distribución?','What conflicts does the layout have?','布局有什么冲突？'],['Mueve el sofá 20 cm a la izquierda','Move the sofa 20 cm left','把沙发向左移动20厘米']],
  analyze:[['¿Qué datos faltan?','What data is missing?','缺少哪些数据？'],['¿Qué superficie tiene el salón?','What is the area of the living room?','客厅面积多少？']],
  budget:[['¿Cuánto cuesta?','How much does it cost?','预算多少钱？'],['¿Qué datos faltan?','What data is missing?','缺少哪些数据？']],
  deliver:[['Prepara tres renders','Prepare three renders','准备三张渲染图'],['Reforma desde una foto','Reform from a photo','照片改造']],studio:[['¿Qué puedes hacer?','What can you do?','你能做什么？']]};
 function suggestions(){chips.replaceChildren();const a=area();for(const s of SUGG[a]||SUGG.design){const b=btn(tx(...s),chips,'chip');b.onclick=()=>ask(b.textContent);}
  ctxLine.textContent=tx('Área: ','Area: ','区域：')+({design:tx('Diseñar','Design','设计'),analyze:tx('Analizar','Analyze','分析'),budget:tx('Presupuestar','Budget','预算'),deliver:tx('Entregar','Deliver','交付'),studio:tx('Mi estudio','My studio','我的事务所')})[a]+' · '+tx('Revisión ','Revision ','版本 ')+T.revision(app.project).slice(4,12);}
 const logScope=()=>window.RubikAssistantGenUI?.scope()||T.projectScope(app);
 // Keep the project ID as the storage key. Only scoped messages can be restored.
 const projectLog=all=>Array.isArray(all[app.project.id])?all[app.project.id]:[];
 function restoreLog(){
  const scope=logScope();
  state.log=projectLog(read()).filter(m=>m?.scope===scope).slice(-MAX_LOG);
  render();
 }
 function persist(){
  const all=read(),scope=logScope();
  const older=projectLog(all).filter(m=>m?.scope!==scope);
  const current=state.log.filter(m=>!m.privateTurn).map(m=>({scope,role:m.role,text:String(m.text).slice(0,2000),source:m.source||null}));
  all[app.project.id]=[...older,...current].slice(-MAX_LOG);write(all);
 }
 function clearSavedLog(){
  const all=read(),id=app.project.id,scope=logScope();
  const otherScopes=projectLog(all).filter(m=>m?.scope&&m.scope!==scope);
  if(otherScopes.length)all[id]=otherScopes;else delete all[id];
  write(all);
 }
 function render(){log.replaceChildren();for(const m of state.log){const li=el('li',undefined,log,'assistant-msg '+m.role);el('p',m.text,li);if(m.source){const s=el('p',m.source,li,'assistant-source');s.dataset.source='1';}}log.scrollTop=log.scrollHeight;}
 const push=(role,text,source,privateTurn=!!window.RubikAssistantGenUI?.active())=>{
  state.log.push({role,text,source,...(privateTurn?{privateTurn:true}:{})});
  if(state.log.length>MAX_LOG)state.log.shift();
  if(!privateTurn)persist();render();
 };
 function sourceLine(reply){
  const pr=reply.answer?.provenance||[];if(!pr.length)return null;
  const ST={measured:tx('medido','measured','实测'),estimated:tx('estimado','estimated','估算'),unavailable:tx('no disponible','unavailable','不可用')};
  return tx('Fuente: ','Source: ','来源：')+pr.map(p=>`${p.engine||p.source}${p.status?' · '+(ST[p.status]||p.status):''}`).join(' + ')+' · '+tx('revisión ','revision ','版本 ')+(pr[0].revision||'').slice(4,12);
 }
 // ----- Workflow guidance. The guide hands off to the real module only on an explicit click. -----
 function option(value,text){const item=el('option',text);item.value=value;return item;}
 function setJourneySteps(selected){
  const steps=Journey.list(L()).find(x=>x.id===phaseSelect.value)?.steps||[];
  stepSelect.replaceChildren(...steps.map(x=>option(x.id,x.label)));
  if(steps.some(x=>x.id===selected))stepSelect.value=selected;
 }
 function clearGuidance(){guidance.hidden=true;guidance.replaceChildren();delete guidance.dataset.step;}
 phaseSelect.onchange=()=>{setJourneySteps();clearGuidance();};
 stepSelect.onchange=clearGuidance;
 guideBtn.onclick=()=>ask(Journey.guide(stepSelect.value,L())?.label,stepSelect.value);
 const routeNamed=id=>document.querySelector(`#professionalWorkspace [data-route="${id}"]`);
 const areas={design:txName('Ir a Diseñar','Go to Design','前往设计'),analyze:txName('Ir a Analizar','Go to Analyse','前往分析'),
  budget:txName('Ir a Presupuestar','Go to Budget','前往预算'),deliver:txName('Ir a Entregar','Go to Deliver','前往交付')};
 function txName(es,en,zh){return ()=>tx(es,en,zh);}
 const showArea=key=>window.FloorPlanProfessionalUI.open(key);
 function focusExisting(target){
  if(!target||target.disabled||!target.getClientRects().length)return false;
  target.focus();return true;
 }
 function guideRoute(step,planReady){
  const hasAreas=typeof window.FloorPlanProfessionalUI?.open==='function';
  const areaRoute=key=>hasAreas?{label:areas[key],open:()=>showArea(key)}:null;
  switch(step.route){
   case 'welcome':return window.FloorPlanGuideUI?.openWelcome?{label:txName('Abrir Inicio','Open Home','打开首页'),open:()=>FloorPlanGuideUI.openWelcome()}:null;
   case 'upload':return window.FloorPlanUpload?.pick?{label:txName('Elegir archivo','Choose file','选择文件'),open:()=>FloorPlanUpload.pick()}:null;
   case 'territory':return window.FloorPlanTerritoryUI?.open?{label:txName('Abrir Emplazamiento','Open Site context','打开场地环境'),open:()=>FloorPlanTerritoryUI.open()}:areaRoute('analyze');
   case 'presentation':return window.FloorPlanPresentation?.open?{label:txName('Preparar presentación','Prepare presentation','准备展示'),open:()=>FloorPlanPresentation.open()}:null;
   case 'furniture':return hasAreas&&window.FloorPlanGuideUI?.execute?{label:txName('Abrir biblioteca','Open library','打开家具库'),
    open:()=>{showArea('design');return FloorPlanGuideUI.execute({id:'furniture'});}}:areaRoute('design');
   case 'view3d':return hasAreas&&typeof setView==='function'?{label:txName('Abrir Escena 3D','Open 3D Scene','打开三维场景'),
    open:async()=>{showArea('design');await setView('3d');return app.viewMode==='3d';}}:null;
   case 'plan':case 'gantt':
    if(step.route==='gantt'&&planReady&&hasAreas)return areaRoute('budget');
    return window.FloorPlanConstructionPlanUI?.open?{label:txName('Abrir Plan de obra','Open Works plan','打开施工计划'),
     open:()=>FloorPlanConstructionPlanUI.open()}:areaRoute('budget');
   case 'render':return hasAreas?{label:txName('Ir a Imágenes','Go to Images','前往图片'),
    open:()=>{showArea('deliver');const route=routeNamed('images');if(!route||route.disabled)return false;route.click();return true;}}:null;
   case 'blender':return hasAreas&&window.RubikSceneExport?.open?{label:txName('Ver Escena para Blender','Find Scene for Blender','查看 Blender 场景'),
    open:async()=>{showArea('deliver');await new Promise(resolve=>requestAnimationFrame(resolve));return focusExisting(document.getElementById('sceneExportOpen'));}}:areaRoute('deliver');
   case 'deliver':return hasAreas?{label:areas.deliver,open:()=>{showArea('deliver');focusExisting(step.id==='client'?document.getElementById('delivery3dPreview'):routeNamed('client-link')||routeNamed('client-file'));}}:null;
   default:return areaRoute(step.route);
  }
 }
 function workflowLimit(step){
  if(step.id==='client'&&!window.FloorPlanDeliveryPreview?.eligible())return tx(
   'El visor privado no se habilita con este proyecto. Usa la vivienda de ejemplo, o revisa el archivo para tu cliente.',
   'The private viewer is disabled for this project. Use the example home or review the client file.',
   '当前项目无法启用私人查看器。请使用示例住宅或检查客户文件。');
  if(step.id==='share'&&!window.FloorPlanShareLink)return tx(
   'La publicación de enlaces no está disponible en esta página. Puedes revisar y descargar el archivo para el cliente en Entregar.',
   'Link publication is unavailable on this page. You can review and download the client file in Deliver.',
   '此页面无法发布链接。你可以在交付中查看并下载客户文件。');
  if(step.id==='render'&&!window.FloorPlanAIRender)return tx(
   'Esta página no permite Render IA. Usa las vistas locales de Imágenes.',
   'This page does not offer AI render. Use the local views in Images.',
   '此页面不支持 AI 渲染。请在图片中使用本地视图。');
  return '';
 }
 const readable=name=>L()==='zh'||!/\p{Script=Han}/u.test(name)?name:tx('Nombre de tarea sin traducir','Untranslated task name','任务名称');
 const guideQuestions={
  rooms:['¿Cuántas estancias hay?','How many rooms are there?','有几个房间？'],
  budget:['¿Cuánto cuesta?','How much does it cost?','预算多少钱？'],
  redistribute:['¿Qué conflictos tiene la distribución?','What conflicts does the layout have?','布局有什么冲突？']
 };
 function planDetails(snap,text){
  if(!snap||snap.recordError)return {message:tx('No se pudo leer el plan guardado. Abre Plan de obra, revisa el almacenamiento y comprueba la última copia disponible.',
   'The saved plan could not be read. Open Works plan, check storage and review your latest copy.','无法读取已保存的计划。请打开施工计划，检查存储及最新副本。')};
  const schedule=snap.record?.schedule;
  if(!schedule)return {message:tx('No hay plan guardado para este proyecto. Abre Plan de obra, añade tus tareas y guarda para consultar el Gantt.',
   'This project has no saved plan. Open Works plan, add your tasks and save to see the Gantt chart.','此项目没有已保存的计划。打开施工计划，添加任务并保存后查看甘特图。')};
  if(window.FloorPlanConstructionUI?.planState(snap).result!=='match')return {message:tx(
   'El plan guardado no corresponde a esta revisión. Revisa los vínculos en Plan de obra y confirma la revisión antes de usar sus fechas.',
   'The saved plan does not match this revision. Check the links in Works plan and confirm the revision before relying on its dates.',
   '已保存的计划与当前版本不符。请在施工计划中核对关联并确认版本后再使用日期。')};
  const tasks=window.FloorPlanConstructionSchedule.canonical(schedule).tasks;
  const source=tx('Plan de obra guardado · revisión ','Saved works plan · revision ','已保存的施工计划 · 版本 ')+snap.revision.slice(0,8);
  const date=text.match(/\b\d{4}-\d{2}-\d{2}\b/u)?.[0];
  const total=tx(`El plan guardado tiene ${tasks.length} tareas programadas.`,`The saved plan has ${tasks.length} scheduled tasks.`,`已保存的计划有 ${tasks.length} 项任务。`);
  if(!date)return {source,ready:tasks.length>0,message:total+' '+tx('Puedes preguntar con una fecha como 2026-11-21 para consultar los inicios posteriores.',
   'You can ask with a date such as 2026-11-21 to find later starts.','可用 2026-11-21 这样的日期查询之后开工的任务。')};
  const parsed=new Date(date+'T00:00:00Z');
  if(!Number.isFinite(+parsed)||parsed.toISOString().slice(0,10)!==date)return {source,ready:tasks.length>0,message:tx('La fecha no es válida. Usa una fecha de calendario en formato AAAA-MM-DD.','The date is invalid. Use a calendar date in YYYY-MM-DD format.','日期无效。请用 YYYY-MM-DD 格式输入有效日期。')};
  const next=tasks.filter(t=>t.startDate>date).sort((a,b)=>a.startDate.localeCompare(b.startDate));
  if(!next.length)return {source,ready:tasks.length>0,message:tx('No hay inicios programados después del '+date+'.','There are no scheduled starts after '+date+'.',date+' 之后没有计划开工项。')};
  const day=next[0].startDate,sameDay=next.filter(t=>t.startDate===day);
  const names=sameDay.slice(0,3).map(t=>readable(t.title)).join(' · ');
  return {source,ready:true,message:tx(
   `Siguiente inicio previsto el ${day} (${sameDay.length}): ${names}. Comprueba los vínculos y el avance real en la obra.`,
   `Next planned start on ${day} (${sameDay.length}): ${names}. Check dependencies and actual progress on site.`,
   `下一计划开工日期为 ${day}（${sameDay.length} 项）：${names}。请实地核对依赖关系与进度。`)};
 }
 async function showGuidance(id,text,active,privateTurn){
  const entry=app.entryId,projectId=app.project.id,level=app.levelContext?.levelId,lang=L();
  const isCurrent=()=>entry===app.entryId&&projectId===app.project.id&&level===app.levelContext?.levelId&&lang===L();
  const step=Journey.guide(id,lang);if(!step)return;
  let evidence={};
  if(id==='gantt'||id==='planning'){
   const revision=T.revision(app.project);
   try{evidence=planDetails(await window.FloorPlanConstructionContext?.snapshot(),text);}catch{evidence=planDetails(null,text);}
   if(revision!==T.revision(app.project))evidence={message:tx(
    'El proyecto cambió mientras leía el plan. Vuelve a preguntar para comprobar la revisión actual.',
    'The project changed while I was reading the plan. Ask again for the current revision.',
    '读取计划时项目已更改。请重新查询当前版本。')};
  }else if(guideQuestions[id]){
   const reply=Sess.handle(tx(...guideQuestions[id]),context());
   evidence={message:reply.messages[1].text,source:sourceLine(reply)};
  }
  if(!active()||!isCurrent())return;
  journey.open=true;phaseSelect.value=step.phase;setJourneySteps(id);
  guidance.replaceChildren();guidance.hidden=false;guidance.dataset.step=id;guidance.dataset.lang=lang;
  const heading=el('h3',step.label,guidance);heading.tabIndex=-1;
  if(evidence.message)el('p',evidence.message,guidance,'assistant-note');
  if(evidence.source)el('p',evidence.source,guidance,'assistant-source');
  const limit=workflowLimit(step);if(limit)el('p',limit,guidance,'assistant-note');
  const route=guideRoute(step,evidence.ready);
  const modal=hostDialog();
  const status=el('p','',guidance,'assistant-note');status.setAttribute('role','status');
  if(modal)status.textContent=tx(
   'Aquí tienes los pasos. Para ir a otra pantalla, cierra este diálogo con sus propios controles. Tu proyecto sigue intacto.',
   'These are the steps. To go to another screen, close this dialog using its own controls. Your project is unchanged.',
   '以上是操作步骤。使用当前对话框自身的控件关闭后，再前往其他页面。项目未变更。');
  else if(route){
   const b=btn(route.label(),guidance,'btn');
   b.onclick=async()=>{
    if(!isCurrent()||hostDialog()){
     status.textContent=tx('La pantalla o el proyecto cambió. Vuelve a abrir la guía para obtener un acceso vigente. No se ha modificado el proyecto.',
      'The screen or project changed. Reopen the guide for a current link. The project is unchanged.','页面或项目已更改。请重新打开指南获取有效入口。项目未修改。');return;
    }
    closePanel();
    try{if(await route.open()!==false){emit('workflow-opened',{id,route:step.route});return;}}catch{}
    openPanel();
    status.textContent=tx('No se pudo abrir esta pantalla. Sigue el recorrido indicado o vuelve a Diseñar. El proyecto sigue intacto.',
     'This screen could not be opened. Follow the steps above or return to Design. The project is unchanged.','无法打开此页面。请按上方步骤操作，或返回设计。项目未变更。');
   };
  }else status.textContent=tx('Esta pantalla no permite abrir el destino. Sigue los pasos en el editor. Tu proyecto sigue intacto.',
   'The destination cannot be opened here. Follow the steps in the editor. Your project is unchanged.','此处无法打开目标页面。请在编辑器中按步骤操作。项目未变更。');
  el('p',step.instructions,guidance);
  if(step.mcpTools.length)el('p',tx('MCP local · ','Local MCP · ','本地 MCP · ')+step.mcpTools.join(' · '),guidance,'assistant-note');
  push('assistant',evidence.message||step.instructions,evidence.source,privateTurn);
  emit('workflow-guidance',{id,providerCalls:0,opened:false,planReady:!!evidence.ready});
  heading.focus({preventScroll:true});guidance.scrollIntoView({block:'nearest',behavior:'instant'});
 }
 // ----- Ask -----
 async function ask(text,selectedStep=null){
  text=String(text||'').trim();window.RubikAssistantGenUI?.enforceScope();if(!text||state.pending)return;
  const ctl=new AbortController();state.pending=ctl;send.disabled=true;stop.hidden=false;input.value='';
  const active=()=>state.pending===ctl&&!ctl.signal.aborted;
  const G=window.RubikAssistantGenUI,generative=!!G?.active();
  push('user',text,undefined,generative);emit('ask',generative?{mode:'provider'}:{text:text.slice(0,120)});
  try{
   if(state.latencyMs)await new Promise((res,rej)=>{const t=setTimeout(res,state.latencyMs);ctl.signal.addEventListener('abort',()=>{clearTimeout(t);rej(new DOMException('aborted','AbortError'));},{once:true});});
   // GEN-AI: in «Conversación con IA» mode (js/assistant-gen-ui.js) a real text model answers through /api/assistant,
   // using the same tools, proposal card and apply/undo; otherwise the guided query below answers, as before.
   if(!active())return;
   const step=journey.hidden?null:selectedStep||Journey.match(text);
   if(step){await showGuidance(step,text,active,generative);return;}
   if(generative){await G.ask(text,{ctx:context(),signal:ctl.signal,
    push:(role,text,source)=>{if(state.pending===ctl)push(role,text,source,true);},emit,showProposal:p=>{if(active())showProposal(p);}});return;}
   const r=Sess.handle(text,context());
   push('assistant',r.messages[1].text,sourceLine(r));
   emit('answer',{intent:r.intent.intent,tools:r.audit.tools,providerCalls:r.audit.providerCalls,cost:r.audit.cost,figures:r.answer?.figures||[],provenance:r.answer?.provenance||[],error:r.audit.error||null,audit:r.audit});
   if(r.proposal)showProposal(r.proposal);
   if(r.service)showService(r.service);
  }catch(e){if(state.pending!==ctl)return;if(e.name==='AbortError'){push('assistant',tx('Consulta detenida: no se ha hecho nada.','Query stopped: nothing was done.','查询已停止：未执行任何操作。'));emit('cancelled');}else{push('assistant',tx('No se ha podido responder.','Could not answer.','无法回答。'));emit('error',{message:String(e.message).slice(0,120)});}}
  finally{if(state.pending===ctl){state.pending=null;send.disabled=false;stop.hidden=true;suggestions();}}
 }
 // ----- Proposal card (AG-2) and apply (AG-3) -----
 function changeValue(path,value,project){
  if(value===null||value===undefined)return '—';
  if(path.endsWith('.position'))return 'X '+value.x+' · Y '+value.y+' mm';
  if(path.endsWith('.rotationDeg'))return value+'°';
  if(path.endsWith('.roomId')){
   const room=project.rooms.find(item=>item.id===value);
   return room&&typeof roomDisplay==='function'?roomDisplay(room):room?.name||value;
  }
  const material=project.materials.find(item=>item.id===value);
  return material&&typeof nm==='function'?nm(material.name):material?.name||String(value);
 }
 function showProposal(p){
  state.proposal=p;state.applied=null;card.hidden=false;card.replaceChildren();card.dataset.state='proposed';
  el('h3',tx('Propuesta (sin aplicar)','Proposal (not applied)','建议（未应用）'),card);
  const current=app.project;
  const ul=el('ul',undefined,card,'assistant-diff');ul.id='assistantDiff';
  for(const d of p.diff){
   const li=el('li',d.label,ul);li.dataset.path=d.path;
   const values=el('dl',undefined,li,'assistant-diff-values');
   for(const [caption,value] of [[tx('Antes','Before','更改前'),d.before],[tx('Después','After','更改后'),d.after]]){
    const pair=el('div',undefined,values);el('dt',caption,pair);el('dd',changeValue(d.path,value,current),pair);
   }
  }
  if(p.warnings?.length){const w=el('ul',undefined,card,'assistant-warn');for(const x of p.warnings)el('li',x,w);}
  el('p',tx('Revisa el cambio. «Aplicar» lo valida otra vez con el proyecto actual y lo guarda en un paso que puedes deshacer.','Review the change. «Apply» validates it again against the current project and saves it in one step you can undo.','请检查更改。“应用”会再次按当前项目验证，并作为可撤销的一步保存。'),card,'assistant-note');
  const row=el('div',undefined,card,'assistant-actions');
  const ok=btn(tx('Aplicar','Apply','应用'),row,'btn primary');ok.id='assistantApply';const no=btn(tx('Descartar','Discard','放弃'),row,'btn');no.id='assistantDiscard';
  ok.onclick=()=>apply(ok);no.onclick=()=>{state.proposal=null;card.hidden=true;push('assistant',tx('Propuesta descartada: el proyecto no ha cambiado.','Proposal discarded: the project has not changed.','已放弃建议：项目未更改。'));emit('discard',{proposalId:p.id});};
  card.scrollIntoView({block:'nearest'});
  emit('proposal',{proposalId:p.id,operation:p.operation,diff:p.diff,baseRevision:p.baseRevision});
 }
 function apply(button){
  const p=state.proposal;if(!p||button.disabled)return;button.disabled=true;
  let applied=null;
  const r=app.applyAssistant?.(project=>{const a=Prop.apply(project,{...p,state:'confirmed'});applied=a;return a.ok?{ok:true,project:a.project}:{ok:false,explanation:[a.error.message]};});
  if(!r?.ok){const why=applied&&!applied.ok?applied.error.message:(r?.explanation||[]).join(' ')||tx('No se ha podido guardar el cambio. Tu proyecto sigue intacto. Revisa el almacenamiento y vuelve a pedir la propuesta.','Could not save the change. Your project is intact. Check storage and request the proposal again.','无法保存。项目保持原样。请检查存储，然后重新请求建议。');
   card.dataset.state=applied?.error?.code==='revision_mismatch'?'stale':'failed';button.disabled=true;push('assistant',tx('No aplicado: ','Not applied: ','未应用：')+why);emit('apply-refused',{proposalId:p.id,code:applied?.error?.code||'invalid'});return;}
  state.applied={proposalId:p.id,revisionAfter:T.revision(app.project),baseRevision:p.baseRevision};state.proposal=null;
  card.replaceChildren();card.dataset.state='applied';const heading=el('h3',tx('Cambio aplicado','Change applied','已应用更改'),card);
  el('p',tx('Es un solo paso del historial del editor.','It is a single step in the editor history.','这是编辑器历史中的一步。'),card,'assistant-note');
  const row=el('div',undefined,card,'assistant-actions');const u=btn(tx('Deshacer','Undo','撤销'),row,'btn');u.id='assistantUndo';const rd=btn(tx('Rehacer','Redo','重做'),row,'btn');rd.id='assistantRedo';
  const notice=el('p',undefined,card,'assistant-note');notice.setAttribute('role','status');
  rd.disabled=true;
  const history=action=>{
   const result=r.history(action);
   if(result!=='ok'){
    notice.textContent=result==='stale'
     ?tx('El historial ha cambiado. Usa los controles del editor para revisar los pasos posteriores.','The history has changed. Use the editor controls to review the later steps.','历史记录已更改。请使用编辑器控件查看后续步骤。')
     :tx('El guardado ha fallado. El proyecto sigue como estaba. Revisa el almacenamiento y vuelve a intentarlo.','Saving failed. The project is unchanged. Check storage and try again.','保存失败。项目保持原样。请检查存储后重试。');
    if(result==='stale')u.disabled=rd.disabled=true;
    emit('history-refused',{action,code:result});return;
   }
   const undone=action==='undo';
   heading.textContent=undone?tx('Cambio deshecho','Change undone','已撤销更改'):tx('Cambio aplicado','Change applied','已应用更改');
   notice.textContent='';card.dataset.state=undone?'undone':'applied';u.disabled=undone;rd.disabled=!undone;
   (undone?rd:u).focus();emit(action,{revision:T.revision(app.project)});suggestions();
  };
  u.onclick=()=>history('undo');rd.onclick=()=>history('redo');
  push('assistant',tx('Aplicado. Puedes deshacerlo aquí o con el botón «Deshacer» del editor.','Applied. You can undo it here or with the editor «Undo» button.','已应用。可在此或用编辑器的“撤销”按钮撤销。'));
  emit('applied',{proposalId:p.id,revision:state.applied.revisionAfter});suggestions();
 }
 // ----- Services (AG-4/AG-5): open the existing flow, never spend from here -----
 function showService(s){
  state.proposal=null;card.hidden=false;card.replaceChildren();card.dataset.state='service-'+s.state;
  el('h3',s.state==='available'?tx('Preparado, sin gasto','Prepared, no spending','已准备，未产生费用'):tx('No disponible','Not available','不可用'),card);
  if(s.id==='render_views'&&s.state==='available'){
   // The ONLY entry to Render IA is the existing one: Entregar → «Generar imágenes» → a real 3D view → «Render IA».
   el('p',tx('Te llevo a Imágenes en Entregar: elige una vista 3D real y pulsa «Render IA». Ese diálogo pide tu código de acceso y confirmación antes de cada imagen.','I take you to Images in Deliver: choose a real 3D view and press «AI render». That dialog asks for your access code and a confirmation before each image.','带你前往交付中的图片：选择真实三维视图并点击“AI 渲染”。该对话框在每张图片前要求访问码和确认。'),card,'assistant-note');
   const row=el('div',undefined,card,'assistant-actions');const b=btn(tx('Ir a Imágenes de Entregar','Go to Deliver images','前往交付图片'),row,'btn primary');b.id='assistantOpenRender';
   b.onclick=()=>{emit('open-render',{style:s.request?.style||null});try{if(window.FloorPlanProfessionalUI?.area!=='deliver')window.FloorPlanProfessionalUI?.open('deliver');
     const go=document.querySelector('#professionalWorkspace [data-route="images"]');if(!go)throw Error('sin ruta');go.click();go.scrollIntoView?.({block:'nearest'});}
    catch{push('assistant',tx('No encuentro Imágenes en Entregar en esta página.','I cannot find Images in Deliver on this page.','此页面找不到交付图片。'));}};}
  emit('service',{id:s.id,state:s.state});
 }
 // ----- Open / close -----
 // Scope isolation: changing project cuts the request in flight, pending proposal and undo.
 // The in-memory log must always belong to the current project, even while the panel is closed.
 let scopeProject=null;
 function invalidate(reason='scope-changed'){state.pending?.abort();state.pending=null;send.disabled=false;stop.hidden=true;state.proposal=null;state.applied=null;card.hidden=true;card.replaceChildren();card.dataset.state='invalidated';
  clearGuidance();scopeProject=logScope();restoreLog();if(state.open)labels();emit('invalidated',{reason});}
 addEventListener('floorplan-project-switched',()=>{if(logScope()!==scopeProject||state.pending||state.proposal)invalidate('project-switched');});
 function openPanel(){if(logScope()!==scopeProject)invalidate('project-switched');state.open=true;panel.hidden=false;rehost();document.body.classList.add('assistant-open');labels();suggestions();render();input.focus({preventScroll:true});emit('open',{area:area()});}
 function closePanel(){state.open=false;panel.hidden=true;rehost();document.body.classList.remove('assistant-open');labels();state.pending?.abort();(lastHost?accessBtn:fab.hidden?opener:fab).focus({preventScroll:true});emit('close');}
 opener.onclick=()=>state.open?closePanel():openPanel();fab.onclick=accessBtn.onclick=()=>state.open?closePanel():openPanel();close.onclick=closePanel;
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();e.preventDefault();closePanel();}}); // Escape cierra el panel, no el diálogo en el que está
 form.onsubmit=e=>{e.preventDefault();ask(input.value);};
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(input.value);}});
 const cancel=()=>state.pending?.abort();
 stop.onclick=cancel;
 clear.onclick=()=>{state.pending?.abort();state.pending=null;send.disabled=false;stop.hidden=true;state.log=[];clearSavedLog();clearGuidance();render();card.hidden=true;state.proposal=null;state.applied=null;window.RubikAssistantGenUI?.clear?.();emit('clear');};
 document.addEventListener('rubik:languagechange',()=>setTimeout(()=>{labels();if(state.open)suggestions();},0));
 addEventListener('rubik-assistant',e=>{if(e.detail?.type==='mode')labels();});
 mountOpener();labels();rehost();new MutationObserver(()=>{mountOpener();if(state.open)suggestions();}).observe(document.body,{childList:true,subtree:false});
 window.RubikAssistantUI=Object.freeze({open:openPanel,close:closePanel,ask,cancel,invalidate,
  get state(){return {open:state.open,pending:!!state.pending,proposal:state.proposal?structuredClone(state.proposal):null,applied:state.applied?{...state.applied}:null,log:state.log.map(m=>({...m}))};},
  get trace(){return state.trace.map(e=>structuredClone(e));},setLatency(ms){state.latencyMs=Math.max(0,Math.min(10000,Number(ms)||0));}});
})();
