/* RUBIK · Asistente generativo · interfaz (sobre el panel del Asistente RUBIK V2, js/assistant-ui.js).
   Añade el modo «Conversación con IA» junto a la «Consulta guiada»:
   - Estado REAL del servicio, preguntado a /api/assistant (action:'status'): desactivado, falta código, falta almacén o
     conectado (modelo, tope y gastado). Si no está disponible, el modo IA no se puede elegir y se explica por qué; la
     consulta guiada sigue funcionando igual.
   - Código de acceso del asistente (no el de Render IA): se guarda solo en esta pestaña (sessionStorage).
   - Consentimiento explícito antes de enviar nada: la pregunta y los datos del proyecto que el asistente consulte
     (estancias, medidas, presupuesto, productos). RUBIK no adjunta fotos ni contactos, pero la pregunta es texto libre:
     se ocultan correos, teléfonos y enlaces reconocibles y se avisa de no pegar datos personales (no se promete más).
   - AISLAMIENTO: la conversación, los resultados de herramientas, las propuestas y rutas pendientes y el consentimiento
     pertenecen a UN ámbito (estudio + proyecto). Si cambia el ámbito: se corta la petición en curso, se borra el historial,
     se invalidan propuestas y rutas, y el consentimiento debe darse de nuevo. Una respuesta que llega de otro ámbito se
     descarta sin mostrarse ni guardarse.
   - Cada turno (RubikAssistantAgent.runTurn): herramientas consultadas con su fuente, respuesta, aviso si alguna cifra
     no está verificada por RUBIK, coste estimado del turno y gasto acumulado frente al tope.
   - Propuestas: la MISMA tarjeta AG-2/AG-3 (Aplicar/Descartar, un paso de deshacer). Rutas ofrecidas: botones que abren
     los flujos reales; ninguno gasta por sí mismo.
   Expone window.RubikAssistantGenUI (lecturas de estado para la QA). */
(function(){
 'use strict';
 const A=window.RubikAssistantAgent,T=window.RubikAssistantDomainTools;if(!A||!T)return;
 const L=()=>typeof LANG==='string'&&['es','en','zh'].includes(LANG)?LANG:'es';
 const tx=(es,en,zh)=>({es,en,zh})[L()];
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const ss=(()=>{try{const s=window.sessionStorage;s.getItem('x');return s;}catch{return {getItem:()=>null,setItem(){},removeItem(){}};}})();
 const CODE_KEY='rubik-assistant-code',CONSENT_KEY='rubik-assistant-consent';
 const state={mode:'guided',status:null,history:[],historyRevision:null,last:null,checking:null,scope:null,resets:0};
 // Scope = studio + project. Everything the generative mode keeps belongs to exactly one scope.
 const scopeNow=()=>{
  let studio='local';try{studio=window.RubikCat04?.studioId?.()||window.RubikCatalogUI?.studioId||studio;}catch{}
  return T.projectScope(window.FloorPlanApp,studio);
 };
 const consent=()=>{try{const c=JSON.parse(ss.getItem(CONSENT_KEY));const sc=scopeNow();return c&&sc&&c.scope===sc&&c.question===true&&c.projectData===true?{question:true,projectData:true}:null;}catch{return null;}};
 let qBox=null,dBox=null;
 // Called before every send, on open, on mode change and on the app's project-switch event.
 function enforceScope(reason='scope-changed'){const sc=scopeNow();if(state.scope===sc)return sc;const had=state.scope!==null;state.scope=sc;
  if(had){state.resets++;clear();
   try{const c=JSON.parse(ss.getItem(CONSENT_KEY));if(c&&c.scope!==sc)ss.removeItem(CONSENT_KEY);}catch{ss.removeItem(CONSENT_KEY);}
   if(qBox)qBox.checked=false;if(dBox)dBox.checked=false;
   window.RubikAssistantUI?.invalidate?.(reason);
   dispatchEvent(new CustomEvent('rubik-assistant',{detail:{type:'gen-scope-reset',reason,at:Date.now()}}));}
  return sc;}
 const adapter=()=>A.httpAdapter({fetch:(u,i)=>window.fetch(u,i),accessCode:()=>ss.getItem(CODE_KEY),consent});
 const unavailable=()=>tx('La conversación con IA no está disponible en este entorno. Puedes seguir con Consulta guiada.','Conversation with AI is unavailable in this environment. You can continue with Guided query.','此环境暂不可使用 AI 对话。你可以继续使用引导式查询。');
 const paused=()=>tx('La conversación con IA está pausada. Puedes seguir con Consulta guiada.','Conversation with AI is paused. You can continue with Guided query.','AI 对话已暂停。你可以继续使用引导式查询。');
 const REASON=()=>({beta_disabled:unavailable(),'beta-store-disabled':paused(),'store-unavailable':paused(),breaker:paused(),provider_disabled:tx('IA generativa preparada, pero desactivada en este despliegue: falta la autorización del propietario (modelo, clave propia, tarifa y tope).','Generative AI is prepared but disabled in this deployment: the owner’s authorisation is pending (model, own key, price and cap).','生成式 AI 已就绪，但在此部署中停用：等待所有者授权。'),
  auth_unavailable:tx('IA generativa sin control de acceso configurado.','Generative AI without an access control configured.','未配置访问控制。'),'code-required':tx('Introduce el código de acceso del asistente para conversar con la IA.','Enter the assistant access code to talk to the AI.','请输入助手访问码。'),
  'store-not-configured':tx('IA configurada, pero falta el almacén persistente del gasto: no se puede garantizar el tope.','AI configured, but the persistent spend store is missing: the cap cannot be guaranteed.','缺少持久化费用存储。'),
  production_not_authorized:tx('No autorizada en Production.','Not authorised in Production.','未在生产环境授权。'),unreachable:tx('No se puede consultar el servicio de IA desde esta página.','The AI service cannot be reached from this page.','无法连接 AI 服务。')});
 const CTXT=()=>({assistantConsentQuestion:tx('Envío mi pregunta al proveedor de IA de texto.','I send my question to the text AI provider.','我同意将问题发送给文本 AI 服务商。'),
  assistantConsentData:tx('Permito enviar los datos de ESTE proyecto que el asistente consulte (estancias, medidas, presupuesto, productos). RUBIK no adjunta fotos ni contactos.','I allow sending the data of THIS project that the assistant looks up (rooms, measures, budget, products). RUBIK attaches no photos or contacts.','我允许发送助手查询的“此项目”数据（房间、尺寸、预算、产品）。RUBIK 不附加照片或联系方式。'),
  assistantGenPrivacy:tx('Tu pregunta se envía como la escribas: RUBIK oculta correos, teléfonos y enlaces que reconoce, pero no puede detectar nombres, direcciones u otros datos personales. No los pegues. En las pruebas, usa solo proyectos sintéticos. El proveedor recibe store:false, pero se aplican sus condiciones de retención.','Your question is sent as you write it: RUBIK hides emails, phone numbers and links it recognises, but it cannot detect names, addresses or other personal data. Do not paste them. In tests, use synthetic projects only. The provider receives store:false, but its retention terms apply.','您的问题会按原样发送：RUBIK 会隐藏可识别的邮箱、电话和链接，但无法识别姓名、地址等个人数据。请勿粘贴。测试时仅使用合成项目。已向服务商发送 store:false，但仍适用其数据保留条款。')});
 let bar=null,modes=null,statusLine=null,codeRow=null,consentRow=null,guidedBtn=null,genBtn=null,modeRequest=0;
 function mount(){const panel=document.getElementById('assistantPanel');if(!panel||document.getElementById('assistantGenBar'))return;
  bar=el('div',undefined,null,'assistant-genbar');bar.id='assistantGenBar';
  modes=el('div',undefined,bar,'assistant-modes');modes.setAttribute('role','radiogroup');
  guidedBtn=el('button',undefined,modes,'btn chip');guidedBtn.type='button';guidedBtn.id='assistantModeGuided';guidedBtn.setAttribute('role','radio');
  genBtn=el('button',undefined,modes,'btn chip');genBtn.type='button';genBtn.id='assistantModeGen';genBtn.setAttribute('role','radio');
  statusLine=el('p','',bar,'assistant-gen-status');statusLine.id='assistantGenStatus';statusLine.setAttribute('role','status');
  codeRow=el('form',undefined,bar,'assistant-gen-code');codeRow.id='assistantGenCodeForm';codeRow.hidden=true;
  const ci=el('input',undefined,codeRow);ci.type='password';ci.id='assistantGenCode';ci.autocomplete='off';ci.setAttribute('aria-label',tx('Código de acceso del asistente','Assistant access code','助手访问码'));
  const cb=el('button',tx('Guardar','Save','保存'),codeRow,'btn');cb.type='submit';codeRow.onsubmit=async e=>{e.preventDefault();if(ci.value.trim())ss.setItem(CODE_KEY,ci.value.trim());ci.value='';await chooseGenerative();};
  consentRow=el('div',undefined,bar,'assistant-gen-consent');consentRow.id='assistantGenConsent';consentRow.hidden=true;
  const mk=(id,text)=>{const l=el('label',undefined,consentRow,'assistant-check');const i=el('input',undefined,l);i.type='checkbox';i.id=id;const sp=el('span',text,l);sp.dataset.i18n=id;return i;};
  const q=mk('assistantConsentQuestion',CTXT().assistantConsentQuestion);
  const d=mk('assistantConsentData',CTXT().assistantConsentData);
  const warn=el('p',CTXT().assistantGenPrivacy,consentRow,'assistant-gen-warn');warn.id='assistantGenPrivacy';
  qBox=q;dBox=d;
  const sync=()=>{
   const sc=enforceScope();ss.setItem(CONSENT_KEY,JSON.stringify({scope:sc,question:q.checked,projectData:d.checked}));
   if(!q.checked||!d.checked){clear();window.RubikAssistantUI?.invalidate?.('consent-revoked');}
  };q.onchange=sync;d.onchange=sync;
  state.scope=scopeNow();const c0=consent();q.checked=!!c0;d.checked=!!c0;
  // The service is asked ONLY when the person chooses the AI mode: no request leaves the page otherwise.
  guidedBtn.onclick=()=>{modeRequest++;setMode('guided');};genBtn.onclick=chooseGenerative;
  modes.onkeydown=e=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
   e.preventDefault();const next=e.target===guidedBtn?genBtn:guidedBtn;next.focus();next.click();
  };
  document.getElementById('assistantMode')?.after(bar);labels();}
 async function chooseGenerative(){const request=++modeRequest;enforceScope('mode');await check();if(modeRequest===request)setMode('generative');}
 function labels(){if(!bar)return;modes.setAttribute('aria-label',tx('Modo del asistente','Assistant mode','助手模式'));const T=CTXT();for(const sp of consentRow.querySelectorAll('[data-i18n]'))sp.textContent=T[sp.dataset.i18n];const pw=document.getElementById('assistantGenPrivacy');if(pw)pw.textContent=T.assistantGenPrivacy;guidedBtn.textContent=tx('Consulta guiada','Guided query','引导式查询');genBtn.textContent=tx('Conversación con IA','Conversation with AI','AI 对话');
  for(const [b,m] of [[guidedBtn,'guided'],[genBtn,'generative']]){b.setAttribute('aria-checked',String(state.mode===m));b.tabIndex=state.mode===m?0:-1;}
  const ok=state.status?.enabled===true&&state.status.reason==='ok';bar.dataset.mode=state.mode;bar.dataset.reason=state.status?.reason||'unchecked';
  statusLine.textContent=!state.status?tx('Pulsa «Conversación con IA» para comprobar si está disponible (no se envía nada hasta que preguntes).','Press «Conversation with AI» to check whether it is available (nothing is sent until you ask).','点击“AI 对话”检查是否可用（提问前不发送任何内容）。'):ok?tx(`IA conectada: modelo ${state.status.model} · tarifa del ${state.status.priceDate} · gastado ${fmt(state.status.spentUsd)} de ${fmt(state.status.capUsd)} USD de tope.`,`AI connected: model ${state.status.model} · price of ${state.status.priceDate} · spent ${fmt(state.status.spentUsd)} of a ${fmt(state.status.capUsd)} USD cap.`,`AI 已连接：模型 ${state.status.model} · 已用 ${fmt(state.status.spentUsd)} / 上限 ${fmt(state.status.capUsd)} USD。`):(REASON()[state.status.reason]||unavailable());
  codeRow.hidden=state.status?.reason!=='code-required';consentRow.hidden=state.mode!=='generative';
 }
 const fmt=v=>v===null||v===undefined?'—':Number(v).toFixed(4);
 async function check(){if(state.checking)return state.checking;state.checking=(async()=>{try{state.status=await adapter().status();}catch{state.status={enabled:false,reason:'unreachable'};}
  if(!(state.status?.enabled===true&&state.status.reason==='ok')&&state.mode==='generative')setMode('guided');else labels();state.checking=null;})();return state.checking;}
 function setMode(m){
  if(m==='generative'&&!(state.status?.enabled===true&&state.status.reason==='ok'))return;
  if(state.mode==='generative'&&m==='guided')window.RubikAssistantUI?.cancel();
  state.mode=m;labels();
  dispatchEvent(new CustomEvent('rubik-assistant',{detail:{type:'mode',mode:m,at:Date.now()}}));}
 // Route buttons: open the REAL flows; nothing is spent from here.
 function openRoute(route){const go={'budget-edit':()=>window.FloorPlanBudgetUI?.open(),'reference-prices':()=>window.FloorPlanReferencePricesUI?.open(),'economic-dossier':()=>window.FloorPlanEconomicDossierUI?.open(),
  'image-studio':()=>window.RubikVisualStudio?.open(),'render-ai':()=>{window.FloorPlanProfessionalUI?.open('deliver');document.querySelector('#professionalWorkspace [data-route="images"]')?.click();},
  'my-catalogues':()=>window.RubikCatalogUI?.open(),'place-catalogue-product':()=>window.RubikCatalogUI?.open(),'layout-review':()=>window.FloorPlanProfessionalUI?.open('analyze')}[route];try{go?.();}catch(e){console.warn('[Asistente IA] ruta:',e?.message||e);}}
 const TOOL_LABEL=()=>({get_project_summary:tx('resumen del proyecto','project summary','项目摘要'),list_rooms:tx('estancias','rooms','房间'),get_room:tx('estancia','room','房间'),get_quantities:tx('cantidades','quantities','工程量'),get_budget_summary:tx('presupuesto','budget','预算'),
  get_layout_review:tx('revisión de la distribución','layout review','布局检查'),list_materials:tx('materiales','materials','材料'),list_objects:tx('mobiliario','furniture','家具'),list_catalog_products:tx('Mis catálogos','My catalogues','我的目录'),get_placed_products:tx('productos colocados','placed products','已放置产品'),
  get_visual_references:tx('referencias visuales','visual references','视觉参考'),propose_floor_material:tx('propuesta de suelo','floor proposal','地面建议'),propose_move_object:tx('propuesta de mover','move proposal','移动建议'),offer_route:tx('acceso a un flujo','route to a flow','流程入口'),list_capabilities:tx('capacidades','capabilities','能力')});
 /* One generative turn, called by assistant-ui's ask() when this mode is active. helpers: {ctx, signal, push, emit, showProposal}. */
 async function ask(text,{ctx,signal,push,emit,showProposal}){
  const sc0=enforceScope();const c=consent();if(!c){push('assistant',tx('Para conversar con la IA, marca los dos consentimientos de arriba. Mientras tanto, usa la consulta guiada.','To talk to the AI, tick both consents above. Meanwhile, use the guided query.','请先勾选上方两项同意。'));emit('gen-refused',{code:'consent_required'});return;}
  const revision=T.revision(ctx.project);
  const isCurrent=()=>scopeNow()===sc0&&T.revision(window.FloorPlanApp.project)===revision&&!!consent();
  const prior=state.historyRevision===revision?state.history:[];
  const r=await A.runTurn({question:text,history:prior,ctx,adapter:adapter(),consent:c,signal,isCurrent});
  // The scope changed while the turn was running: discard everything (no answer, no history, no proposal, no route).
  if(scopeNow()!==sc0){enforceScope();emit('gen-discarded',{reason:'scope-changed',providerCalls:r.providerCalls||0});return;}
  if(signal?.aborted){
   push('assistant',tx('Consulta detenida. El proyecto sigue intacto.','Query stopped. The project is unchanged.','查询已停止。项目保持原样。'));
   emit('gen-discarded',{reason:'cancelled',providerCalls:r.providerCalls||0});return;
  }
  if(!isCurrent()){
   clear();
   push('assistant',tx('La consulta se detuvo porque cambió el proyecto o el consentimiento. El asistente no modificó tu proyecto. Vuelve a preguntar para revisar el estado actual.','The query stopped because the project or consent changed. The assistant left your project unchanged. Ask again to review its current state.','项目或同意状态已更改，查询已停止。助手未修改项目。请重新提问以查看当前状态。'));
   emit('gen-discarded',{reason:'revision-or-consent-changed',providerCalls:r.providerCalls||0});return;
  }
  state.last=r;
  if(!r.ok){const M={budget_exceeded:tx('Se ha alcanzado el tope de gasto aprobado: no se ha enviado nada más.','The approved spending cap has been reached: nothing else was sent.','已达批准的费用上限。'),consent_required:tx('Falta tu consentimiento.','Your consent is missing.','缺少同意。'),code:tx('El código de acceso no es correcto.','The access code is not correct.','访问码不正确。'),
    cancelled:tx('Consulta detenida. El proyecto sigue intacto.','Query stopped. The project is unchanged.','查询已停止。项目保持原样。'),rate_limited:tx('Demasiadas consultas seguidas: espera un minuto.','Too many queries in a row: wait a minute.','请求过多，请稍候。'),step_limit:r.error.message};
   push('assistant',(M[r.error.code]||tx('La IA no ha podido responder: ','The AI could not answer: ','AI 无法回答：')+r.error.message)+' '+tx('La consulta guiada sigue disponible.','The guided query is still available.','引导式查询仍可用。'));emit('gen-error',{code:r.error.code,providerCalls:r.providerCalls||0});if(r.error.code==='code')ss.removeItem(CODE_KEY);check();return;}
  state.history=r.history;state.historyRevision=revision;
  const used=[...new Set(r.steps.filter(s=>s.ok).map(s=>TOOL_LABEL()[s.tool]||s.tool))];
  const src=(used.length?tx('Consultado en RUBIK: ','Looked up in RUBIK: ','已在 RUBIK 中查询：')+used.join(' · '):tx('Sin consultas a RUBIK','No RUBIK lookups','未查询 RUBIK'))
   +` · ${tx('IA','AI','AI')}: ${r.usage.inputTokens+r.usage.outputTokens} tokens · ${tx('coste estimado','estimated cost','估算费用')} ${r.usage.costKnown?fmt(r.usage.costUsd)+' USD':tx('desconocido','unknown','未知')}`
   +' · '+tx('comprobación parcial de cifras: no certifica a qué partida se atribuye cada una','partial figure check: it does not certify which item each figure belongs to','数字仅部分核对：不保证每个数字对应的条目');
  const red=r.redacted?.length?'\n'+tx('ℹ Se ocultaron en tu pregunta antes de enviarla: ','ℹ Hidden from your question before sending: ','ℹ 发送前已从问题中隐藏：')+r.redacted.join(', ')+'.':'';
  push('assistant',r.answer.text+red+(r.answer.grounded?'':'\n'+tx('⚠ Cifras que no aparecen en los datos consultados en RUBIK: ','⚠ Figures not found in the data looked up in RUBIK: ','⚠ 在 RUBIK 查询数据中未找到的数字：')+r.answer.unverified.join(', ')+tx('. Compruébalas antes de usarlas.','. Check them before using them.','。使用前请核实。')),src);
  emit('gen-answer',{tools:r.steps.map(s=>s.tool),grounded:r.answer.grounded,unverified:r.answer.unverified,providerCalls:r.providerCalls,usage:r.usage,proposals:r.proposals.length,actions:r.actions.map(a=>a.route)});
  if(r.proposals.length)showProposal(r.proposals[0].proposal);
  if(r.actions.length){const box=el('div',undefined,null,'assistant-actions assistant-gen-routes');box.id='assistantGenRoutes';
   for(const a of r.actions){const b=el('button',a.reason||a.route,box,'btn');b.type='button';b.dataset.route=a.route;b.onclick=()=>{if(!isCurrent()){b.disabled=true;push('assistant',tx('El contexto cambió. Vuelve a preguntar para obtener un acceso vigente.','The context changed. Ask again for a current link.','上下文已更改。请重新提问以获取有效入口。'));return;}emit('gen-route',{route:a.route});openRoute(a.route);};}
   document.getElementById('assistantGenRoutes')?.remove();document.getElementById('assistantLog')?.after(box);}
  check();
 }
 function clear(){state.history=[];state.historyRevision=null;state.last=null;document.getElementById('assistantGenRoutes')?.remove();}
 addEventListener('floorplan-project-switched',()=>enforceScope('project-switched'));
 addEventListener('floorplan-level-switched',()=>enforceScope('level-switched'));
 document.addEventListener('change',e=>{if(e.target.id==='catalogStudio')enforceScope('studio-changed');});
 new MutationObserver(()=>mount()).observe(document.body,{childList:true});mount();
 addEventListener('rubik-assistant',e=>{if(e.detail?.type==='open'){mount();enforceScope('panel-open');labels();}});
 document.getElementById('langBtn')?.addEventListener('click',()=>setTimeout(labels,0));
 window.RubikAssistantGenUI={active:()=>state.mode==='generative',ask,check,clear,setMode,enforceScope,scope:scopeNow,get state(){return state;}};
})();
