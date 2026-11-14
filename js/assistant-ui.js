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
  for(const o of p.objects)objects[o.id]=[...new Set([shown(o.name),...names(o.name),o.type].filter(Boolean))];
  for(const m of p.materials||[]){const base=[...new Set([shown(m.name),...names(m.name)].filter(Boolean))];const extra=SYN.filter(([re])=>base.some(b=>re.test(b))).flatMap(([,w])=>w);materials[m.id]=[...base,...extra];}
  let budget=null,saved=false;try{const c=window.FloorPlanBudgetUI?.current?.();if(c){budget=c.budget;saved=!!c.saved;}}catch{}
  let selection=null;try{selection=app.capturePresentationEntry?.().selection||null;}catch{}
  const levels=window.FloorPlanBuildingUI?.presentationSources?.()?.levels||null;
  const caps=RT.capabilities({registry:window.FloorPlanCapabilities,modules:{render:!!window.FloorPlanAIRender,photoReform:!!window.RubikPhotoReformProvider||!!window.RubikPhotoReformCore,photoReformConfigured:false,catalog:false}});
  return {project:p,budget,budgetSaved:saved,levels,selection,area:area(),lang:L(),labels:{rooms,objects,materials},caps,renderStyles:window.FloorPlanAIRender?.STYLES?.()||[]};
 }
 function area(){const cur=document.querySelector('#professionalNav [aria-current="page"]');const k=cur?.id?.replace('workArea-','');return K.AREAS.includes(k)?k:'design';}
 // ----- Panel -----
 const panel=el('section',undefined,document.body,'assistant-panel');panel.id='assistantPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-labelledby','assistantTitle');
 const head=el('div',undefined,panel,'assistant-head');const title=el('h2',undefined,head);title.id='assistantTitle';
 const close=btn('×',head,'btn assistant-close');close.id='assistantClose';
 const mode=el('p',undefined,panel,'assistant-mode');mode.id='assistantMode';
 const ctxLine=el('p',undefined,panel,'assistant-context');ctxLine.id='assistantContext';
 const log=el('ol',undefined,panel,'assistant-log');log.id='assistantLog';log.setAttribute('aria-live','polite');
 const card=el('div',undefined,panel,'assistant-proposal');card.id='assistantProposal';card.hidden=true;
 const chips=el('div',undefined,panel,'assistant-chips');chips.id='assistantSuggestions';
 const form=el('form',undefined,panel,'assistant-form');form.id='assistantForm';
 const input=el('textarea',undefined,form);input.id='assistantInput';input.rows=2;input.maxLength=500;
 const send=el('button',undefined,form,'btn primary');send.type='submit';send.id='assistantSend';
 const stop=btn('',form,'btn');stop.id='assistantStop';stop.hidden=true;
 const foot=el('div',undefined,panel,'assistant-foot');const clear=btn('',foot,'btn link');clear.id='assistantClear';
 const opener=btn('',null,'btn assistant-open');opener.id='assistantOpen';
 function mountOpener(){const nav=document.getElementById('professionalNav');if(nav&&!nav.contains(opener))nav.append(opener);else if(!nav&&!opener.isConnected)document.querySelector('header')?.append(opener);}
 function labels(){
  title.textContent=tx('Asistente RUBIK','RUBIK assistant','RUBIK 助手');close.setAttribute('aria-label',tx('Cerrar el asistente','Close the assistant','关闭助手'));
  mode.textContent=tx('Consulta guiada sin modelo de lenguaje: responde con los datos del proyecto abierto y muestra la fuente. No envía nada fuera de este navegador.','Guided query without a language model: it answers with the open project data and shows the source. Nothing leaves this browser.','无语言模型的引导式查询：根据打开的项目数据回答并显示来源。不会发送到浏览器之外。');
  input.placeholder=tx('Pregunta por estancias, superficies, conflictos o presupuesto…','Ask about rooms, areas, conflicts or budget…','询问房间、面积、冲突或预算……');input.setAttribute('aria-label',tx('Tu consulta','Your question','你的问题'));
  send.textContent=tx('Preguntar','Ask','提问');stop.textContent=tx('Detener','Stop','停止');clear.textContent=tx('Borrar conversación','Clear conversation','清除对话');
  opener.textContent=tx('Asistente','Assistant','助手');opener.setAttribute('aria-label',tx('Abrir el asistente RUBIK','Open the RUBIK assistant','打开 RUBIK 助手'));opener.setAttribute('aria-expanded',String(state.open));opener.setAttribute('aria-controls','assistantPanel');
 }
 const SUGG={design:[['¿Cuántas estancias hay?','How many rooms are there?','有几个房间？'],['¿Qué conflictos tiene la distribución?','What conflicts does the layout have?','布局有什么冲突？'],['Mueve el sofá 20 cm a la izquierda','Move the sofa 20 cm left','把沙发向左移动20厘米']],
  analyze:[['¿Qué datos faltan?','What data is missing?','缺少哪些数据？'],['¿Qué superficie tiene el salón?','What is the area of the living room?','客厅面积多少？']],
  budget:[['¿Cuánto cuesta?','How much does it cost?','预算多少钱？'],['¿Qué datos faltan?','What data is missing?','缺少哪些数据？']],
  deliver:[['Prepara tres renders','Prepare three renders','准备三张渲染图'],['Reforma desde una foto','Reform from a photo','照片改造']],studio:[['¿Qué puedes hacer?','What can you do?','你能做什么？']]};
 function suggestions(){chips.replaceChildren();const a=area();for(const s of SUGG[a]||SUGG.design){const b=btn(tx(...s),chips,'chip');b.onclick=()=>ask(b.textContent);}
  ctxLine.textContent=tx('Área: ','Area: ','区域：')+({design:tx('Diseñar','Design','设计'),analyze:tx('Analizar','Analyze','分析'),budget:tx('Presupuestar','Budget','预算'),deliver:tx('Entregar','Deliver','交付'),studio:tx('Mi estudio','My studio','我的事务所')})[a]+' · '+tx('Revisión ','Revision ','版本 ')+T.revision(app.project).slice(4,12);}
 function restoreLog(){state.log=(read()[app.project.id]||[]).slice(-MAX_LOG);render();}
 function persist(){const all=read();all[app.project.id]=state.log.slice(-MAX_LOG).map(m=>({role:m.role,text:String(m.text).slice(0,2000),source:m.source||null}));write(all);}
 function render(){log.replaceChildren();for(const m of state.log){const li=el('li',undefined,log,'assistant-msg '+m.role);el('p',m.text,li);if(m.source){const s=el('p',m.source,li,'assistant-source');s.dataset.source='1';}}log.scrollTop=log.scrollHeight;}
 const push=(role,text,source)=>{state.log.push({role,text,source});persist();render();};
 function sourceLine(reply){
  const pr=reply.answer?.provenance||[];if(!pr.length)return null;
  const ST={measured:tx('medido','measured','实测'),estimated:tx('estimado','estimated','估算'),unavailable:tx('no disponible','unavailable','不可用')};
  return tx('Fuente: ','Source: ','来源：')+pr.map(p=>`${p.engine||p.source}${p.status?' · '+(ST[p.status]||p.status):''}`).join(' + ')+' · '+tx('revisión ','revision ','版本 ')+(pr[0].revision||'').slice(4,12);
 }
 // ----- Ask -----
 async function ask(text){
  text=String(text||'').trim();if(!text||state.pending)return;
  const ctl=new AbortController();state.pending=ctl;send.disabled=true;stop.hidden=false;input.value='';
  push('user',text);emit('ask',{text:text.slice(0,120)});
  try{
   if(state.latencyMs)await new Promise((res,rej)=>{const t=setTimeout(res,state.latencyMs);ctl.signal.addEventListener('abort',()=>{clearTimeout(t);rej(new DOMException('aborted','AbortError'));},{once:true});});
   const r=Sess.handle(text,context());
   push('assistant',r.messages[1].text,sourceLine(r));
   emit('answer',{intent:r.intent.intent,tools:r.audit.tools,providerCalls:r.audit.providerCalls,cost:r.audit.cost,figures:r.answer?.figures||[],provenance:r.answer?.provenance||[],error:r.audit.error||null,audit:r.audit});
   if(r.proposal)showProposal(r.proposal);
   if(r.service)showService(r.service);
  }catch(e){if(e.name==='AbortError'){push('assistant',tx('Consulta detenida: no se ha hecho nada.','Query stopped: nothing was done.','查询已停止：未执行任何操作。'));emit('cancelled');}else{push('assistant',tx('No se ha podido responder.','Could not answer.','无法回答。'));emit('error',{message:String(e.message).slice(0,120)});}}
  finally{state.pending=null;send.disabled=false;stop.hidden=true;suggestions();}
 }
 // ----- Proposal card (AG-2) and apply (AG-3) -----
 function showProposal(p){
  state.proposal=p;state.applied=null;card.hidden=false;card.replaceChildren();card.dataset.state='proposed';
  el('h3',tx('Propuesta (sin aplicar)','Proposal (not applied)','建议（未应用）'),card);
  const ul=el('ul',undefined,card,'assistant-diff');ul.id='assistantDiff';for(const d of p.diff){const li=el('li',d.label,ul);li.dataset.path=d.path;}
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
  if(!r?.ok){const why=applied&&!applied.ok?applied.error.message:(r?.explanation||[]).join(' ')||tx('No se ha podido aplicar.','Could not apply.','无法应用。');
   card.dataset.state=applied?.error?.code==='revision_mismatch'?'stale':'failed';button.disabled=true;push('assistant',tx('No aplicado: ','Not applied: ','未应用：')+why);emit('apply-refused',{proposalId:p.id,code:applied?.error?.code||'invalid'});return;}
  state.applied={proposalId:p.id,revisionAfter:T.revision(app.project),baseRevision:p.baseRevision};state.proposal=null;
  card.replaceChildren();card.dataset.state='applied';el('h3',tx('Cambio aplicado','Change applied','已应用更改'),card);
  el('p',tx('Es un solo paso del historial del editor.','It is a single step in the editor history.','这是编辑器历史中的一步。'),card,'assistant-note');
  const row=el('div',undefined,card,'assistant-actions');const u=btn(tx('Deshacer','Undo','撤销'),row,'btn');u.id='assistantUndo';const rd=btn(tx('Rehacer','Redo','重做'),row,'btn');rd.id='assistantRedo';
  u.onclick=()=>{document.getElementById('undo')?.click();card.dataset.state='undone';emit('undo',{revision:T.revision(app.project)});suggestions();};
  rd.onclick=()=>{document.getElementById('redo')?.click();card.dataset.state='applied';emit('redo',{revision:T.revision(app.project)});suggestions();};
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
 function openPanel(){state.open=true;panel.hidden=false;document.body.classList.add('assistant-open');labels();suggestions();restoreLog();input.focus({preventScroll:true});emit('open',{area:area()});}
 function closePanel(){state.open=false;panel.hidden=true;document.body.classList.remove('assistant-open');labels();state.pending?.abort();opener.focus({preventScroll:true});emit('close');}
 opener.onclick=()=>state.open?closePanel():openPanel();close.onclick=closePanel;
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closePanel();}});
 form.onsubmit=e=>{e.preventDefault();ask(input.value);};
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(input.value);}});
 stop.onclick=()=>state.pending?.abort();
 clear.onclick=()=>{state.log=[];const all=read();delete all[app.project.id];write(all);render();card.hidden=true;state.proposal=null;emit('clear');};
 document.getElementById('langBtn')?.addEventListener('click',()=>setTimeout(()=>{labels();if(state.open)suggestions();},0));
 mountOpener();labels();new MutationObserver(()=>{mountOpener();if(state.open)suggestions();}).observe(document.body,{childList:true,subtree:false});
 window.RubikAssistantUI=Object.freeze({open:openPanel,close:closePanel,ask,
  get state(){return {open:state.open,pending:!!state.pending,proposal:state.proposal?structuredClone(state.proposal):null,applied:state.applied?{...state.applied}:null,log:state.log.map(m=>({...m}))};},
  get trace(){return state.trace.map(e=>structuredClone(e));},setLatency(ms){state.latencyMs=Math.max(0,Math.min(10000,Number(ms)||0));}});
})();
