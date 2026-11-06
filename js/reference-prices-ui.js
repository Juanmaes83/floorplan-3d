/* FT3D-8 · M2 (S2 inside Presupuestar): reference prices over the AUTHENTIC budget of the open project.
   Reuses M1 FloorPlanCostCatalog (search by code/text/family, provenance, compare, explicit apply, edition update,
   strict units) over the existing providers (BC3 reader, BCCA adapter, budget bridge, C1–C4). The budget is read and
   written only through FloorPlanBudgetUI (same storage and validation as Presupuestar); every applied change is also
   kept in the construction record history (before/after, revision tags). Managed BCCA stays blocked (legal gate).
   Files are read locally: RUBIK neither uploads nor stores them. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,Cat=window.FloorPlanCostCatalog,B=window.FloorPlanBudget,UI=window.FloorPlanBudgetUI,Ctx=window.FloorPlanConstructionContext;
 if(!app||!Cat||!B||!UI||!Ctx)return;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const chip=(text,parent,tone='')=>el('span',text,parent,'cx-chip'+(tone?' '+tone:''));
 const eur=v=>v===null||v===undefined?'desconocido':v.toLocaleString('es-ES',{style:'currency',currency:'EUR'});
 const UNIT={m2:'m²',m:'m',unit:'ud',ud:'ud',ml:'m','m²':'m²'},uq=u=>UNIT[u]||u;
 const fmtDate=d=>d?new Date(d+'T00:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'sin fecha';
 const licenseText=l=>({'not-applicable':'no aplica (datos de prueba)',unknown:'desconocida: responde quien aporta el archivo',verified:'verificada',restricted:'restringida'})[l]||l;
 const nice=l=>/^SYNTHETIC TEST ONLY/.test(l||'')?'BCCA de prueba · datos inventados':l;
 const BLOCK={'unit-incompatible':Cat.STATES['unit-incompatible'].detail,'currency-mismatch':Cat.STATES['currency-mismatch'].detail,unauthorized:Cat.STATES.unauthorized.detail,
  'active-reference-price':'Esta partida ya usa un precio de referencia: para cambiarlo, usa «Usar como precio».','budget-upgrade-required':'El presupuesto necesita actualizarse a la versión 1.1 para guardar referencias.','invalid-quote':'La referencia no es válida.'};
 // Sources live only for this session (files are never stored): the budget keeps what was applied, with provenance.
 const state={budget:null,projectId:null,selected:null,sources:[],columns:{},quotes:[],preview:null,proposal:null,msg:'',err:''};
 const dialog=el('dialog',undefined,document.body,'cx-dialog');dialog.id='pricesDialog';dialog.setAttribute('aria-labelledby','pricesTitle');
 const item=id=>state.budget?.items.find(i=>i.id===id);

 function open({itemId=null}={}){
  const c=UI.current();if(!c?.budget){window.toast?.('El presupuesto no está disponible para este proyecto.',5000);return;}
  if(state.projectId!==app.project.id){state.sources=[];state.columns={};state.proposal=null;}   // never carry sources across projects
  state.budget=c.budget;state.projectId=app.project.id;state.selected=itemId||state.selected&&item(state.selected)?.id||c.budget.items[0]?.id||null;state.quotes=[];state.preview=null;state.msg='';state.err='';
  draw();if(!dialog.open)dialog.showModal();dialog.querySelector('#pricesTitle').focus();
 }
 async function record(change,label){
  try{const snap=await Ctx.snapshot();Ctx.store().addPriceChange(snap.entry.id,snap.subject,app.project.id,{label,...change});}catch(e){state.err='El cambio se aplicó al presupuesto, pero no se pudo anotar en el historial: '+(window.FloorPlanConstructionRecord?.human(e)||e.message);}
 }
 function commit(next){state.budget=UI.commit(next);}

 function draw(){
  const keep=dialog.querySelector('.cx-body')?.scrollTop||0;dialog.replaceChildren();
  const head=el('div',undefined,dialog,'cx-head'),hl=el('div',undefined,head);const h=el('h2','Precios de referencia',hl);h.id='pricesTitle';h.tabIndex=-1;
  const sub=el('p',undefined,hl,'cx-subject');el('b',typeof nm==='function'?nm(app.project.name):app.project.name,sub);el('span','· presupuesto de este proyecto · versión '+Cat.revisionTag(state.budget),sub).id='pricesRevision';
  btn('Cerrar',head).onclick=()=>dialog.close();
  const body=el('div',undefined,dialog,'cx-body');
  const cov=Cat.coverage(state.budget),bn=el('div',undefined,body,'cx-banner'+(cov.netComplete?'':' warn'));bn.id='pricesCoverage';
  el('b',cov.netKnown===null?'Todavía no hay ninguna partida con precio: no hay importe conocido.':`${cov.label}: ${eur(cov.netKnown)} sin IVA`,bn);
  if(!cov.netComplete)el('span',`${cov.unpriced.length} ${cov.unpriced.length===1?'partida':'partidas'} sin precio: el importe conocido no es el total de la obra.`,bn);
  const grid=el('div',undefined,body);grid.style.cssText='display:grid;grid-template-columns:minmax(260px,1fr) minmax(320px,1.4fr);gap:16px;align-items:start';grid.className='cx-prices-grid';
  const left=el('div',undefined,grid),right=el('div',undefined,grid);
  // Items of the real budget
  el('h3','Partidas del presupuesto',left);const ul=el('div',undefined,left,'cx-links');ul.style.flexDirection='column';ul.style.alignItems='stretch';ul.id='pricesItems';
  const calc=B.calculateBudget(state.budget),lines=new Map(calc.lines.map(l=>[l.id,l]));
  for(const it of state.budget.items){const b=btn('',ul,'cx-link');b.style.cssText='text-align:left;border-radius:6px;padding:8px 10px';b.dataset.item=it.id;b.setAttribute('aria-pressed',String(it.id===state.selected));
   if(it.id===state.selected)b.style.background='var(--action-soft)';el('strong',it.description,b).style.display='block';
   const ref=it.priceReference,src=it.priceSource?.type==='provider-reference'?'Precio de referencia · '+(ref?.code||''):it.priceSource?.type==='manual'?it.priceSource.label||'Precio propio':'Sin precio';
   el('small',`${it.unitPrice===null?'Sin precio':eur(it.unitPrice)+' / '+uq(it.quantity.unit)} · ${src} · importe ${lines.get(it.id).subtotalNet===null?'desconocido':eur(lines.get(it.id).subtotalNet)}${it.unitPrice!==null&&it.review.status!=='reviewed'?' · sin revisar':''}`,b).style.display='block';
   b.onclick=()=>{state.selected=it.id;state.quotes=[];state.preview=null;draw();};}
  // Sources
  el('h3','Fuentes de precios',right);
  const srow=el('div',undefined,right);srow.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
  const fileBtn=(label,id,make,what)=>{const l=el('label',label,srow,'btn');const i=el('input',undefined,l);i.type='file';i.accept='.bc3,.BC3';i.hidden=true;i.id=id;
   i.onchange=async()=>{const f=i.files[0];i.value='';if(!f)return;if(f.size>Cat.LIMITS.fileBytes){state.err=`${what}: el archivo supera ${Cat.LIMITS.fileBytes/1048576} MB.`;draw();return;}
    const made=make(new Uint8Array(await f.arrayBuffer()),f.name);if(made.status!=='available'){const d=Cat.describe(made.state||'catalog-unavailable');state.err=`${what}: ${d.title}. ${d.detail}`;draw();return;}
    state.err='';state.sources.push(made);if(made.source.column!==null)state.columns[made.source.id]=made.source.column;state.msg=`${what} cargado: ${made.source.count} partidas con precio.`;draw();};};
  fileBtn('BC3 de la BCCA aportado por ti','pricesBcca',(bytes,name)=>Cat.bccaSource({bytes,fileName:name,datasetMode:'user-supplied',source:{label:`BCCA · ${name}`,sourceName:'Base de Costes de la Construcción de Andalucía (BC3 aportado por el profesional)',sourceUrl:null,edition:null,attribution:null,licenseName:null,licenseUrl:null}}),'BC3 de la BCCA');
  fileBtn('Otro BC3','pricesBc3',(bytes,name)=>Cat.bc3Source({bytes,fileName:name,kind:'bc3'}),'BC3');
  fileBtn('Tarifa del estudio (BC3)','pricesTariff',(bytes,name)=>Cat.bc3Source({bytes,fileName:name,kind:'tariff'}),'Tarifa');
  el('p','Los archivos se leen en este navegador: RUBIK no los sube ni los guarda. Cuando aportas un BC3, tú respondes de su licencia de uso.',right,'cx-status').style.color='var(--ink-muted)';
  const managed=Cat.managedStatus(),mg=el('div',undefined,right,'cx-banner warn');mg.id='pricesManaged';mg.dataset.enabled=String(managed.enabled);
  el('b','Catálogo BCCA gestionado por RUBIK: no disponible',mg);el('span',`RUBIK no descarga, aloja ni actualiza la BCCA mientras el permiso de ese uso no esté documentado (estado legal: ${managed.legal==='UNKNOWN'?'sin acreditar':managed.legal}). Puedes usar el BC3 de la BCCA que tú obtengas.`,mg);
  if(state.sources.length){const sl=el('ul',undefined,right);sl.id='pricesSources';
   for(const s of state.sources){const src=s.source,li=el('li',undefined,sl);li.dataset.source=src.id;chip(src.kind==='bcca'?'BCCA':src.kind==='tariff'?'Tarifa propia':'BC3',li,'info');el('b',' '+nice(src.label),li);
    el('small',` · ${src.edition?'edición '+src.edition+' · ':''}precios a ${fmtDate(src.asOf)} · ${src.count} partidas · licencia ${licenseText(src.license.status)}`,li);
    if(src.columns.length>1){const l=el('label',undefined,li,'cx-field');el('span','Columna de precios',l);const sel=el('select',undefined,l);sel.dataset.col=src.id;el('option','Elige una columna…',sel).value='';src.columns.forEach((c,i)=>{const o=el('option',c,sel);o.value=String(i);});sel.value=state.columns[src.id]===undefined||state.columns[src.id]===null?'':String(state.columns[src.id]);sel.onchange=()=>{state.columns[src.id]=sel.value===''?null:Number(sel.value);};}
    if(src.edition){const u=btn('Comprobar actualización con esta edición',li,'cx-link');u.dataset.update=src.id;u.onclick=async()=>{state.proposal=await Cat.proposeEditionUpdate(state.budget,s);draw();dialog.querySelector('#pricesUpdates')?.scrollIntoView({block:'nearest'});};}}}
  // Search for the selected item
  const it=item(state.selected);el('h3',it?`Buscar referencia para «${it.description}»`:'Buscar referencia',right);
  const form=el('form',undefined,right,'cx-row');form.id='pricesSearch';form.setAttribute('role','search');
  const lq=el('label',undefined,form,'cx-field');el('span','Código o texto',lq);const q=el('input',undefined,lq);q.type='search';q.id='pricesQuery';q.minLength=2;q.value=state.lastQuery||(it?it.description.replace(/\(.*\)/,'').trim().split(/\s+/).slice(0,2).join(' '):'');
  const lf=el('label',undefined,form,'cx-field');el('span','Familia',lf);const fam=el('select',undefined,lf);fam.id='pricesFamily';el('option','Todas',fam).value='';for(const f of [...new Set(state.sources.flatMap(s=>s.source.families))].sort((a,b)=>a.localeCompare(b,'es')))el('option',f,fam).value=f;
  const lu=el('label',undefined,form,'cx-check');const su=el('input',undefined,lu);su.type='checkbox';su.id='pricesSameUnit';su.checked=true;el('span','Solo la unidad de la partida',lu);
  const go=btn('Buscar',form,'btn primary');go.type='submit';
  const ss=el('p',state.searchStatus||'',right,'cx-status');ss.id='pricesSearchStatus';ss.setAttribute('role','status');
  const res=el('div',undefined,right);res.id='pricesResults';if(state.groups)results(res);
  form.onsubmit=async e=>{e.preventDefault();state.lastQuery=q.value.trim();
   if(!state.sources.length){state.searchStatus='Carga primero una fuente de precios (BC3).';draw();return;}
   if(state.lastQuery.length<Cat.LIMITS.queryMinChars){state.searchStatus='Escribe al menos dos caracteres.';draw();return;}
   const r=await Cat.searchAll(state.sources,{text:state.lastQuery,family:fam.value||null});
   // Same unit by NOTATION only (ud ≡ unit, m² ≡ m2): never a conversion.
   if(su.checked&&it)for(const g of r.groups){if(g.status!=='available')continue;g.items=g.items.filter(x=>Cat.unitCheck(it.quantity.unit,x.unit).ok);g.state=g.items.length?'found':'not-found';}
   const n=r.groups.reduce((a,g)=>a+g.items.length,0);state.groups=r.groups;state.searchStatus=n?`${n} ${n===1?'referencia encontrada':'referencias encontradas'}.`:'No hay referencias con esos criterios.';draw();};
  if(state.quotes.length&&it)compare(right,it);
  if(state.proposal)updates(right);
  history(body);
  const foot=el('div',undefined,dialog,'cx-foot');const st=el('p',state.msg,foot,'cx-status cx-grow');st.id='pricesStatus';st.setAttribute('role','status');st.setAttribute('aria-live','polite');const er=el('p',state.err,foot,'cx-err cx-grow');er.id='pricesError';er.setAttribute('role','alert');
  const ob=btn('Abrir presupuesto',foot);ob.onclick=()=>{dialog.close();UI.open();};
  dialog.querySelector('.cx-body').scrollTop=keep;
 }
 function results(res){
  for(const g of state.groups){const sec=el('section',undefined,res);sec.dataset.group=g.source.id;const h=el('h4',nice(g.source.label),sec);if(g.source.edition)chip('ed. '+g.source.edition,h);if(g.state!=='found')chip(Cat.describe(g.state).title,h,Cat.STATES[g.state]?.tone==='bad'?'bad':'warn');
   const ul=el('ul',undefined,sec);for(const x of g.items){const li=el('li',undefined,ul);el('code',x.code,li);el('span',` ${x.description}${x.family?' · '+x.family:''} · ${uq(x.unit)} `,li);
    const b=btn('Ver precio',li,'cx-link');b.dataset.quote=x.code;b.dataset.src=g.source.id;b.onclick=async()=>{const s=state.sources.find(z=>z.source.id===g.source.id),r=await s.quote(x.code,{column:state.columns[s.source.id]??null});
     state.quotes=state.quotes.filter(z=>!(z.source.id===s.source.id&&z.code===x.code));state.quotes.push({source:s.source,code:x.code,state:r.state,quote:r.quote||null});state.preview=null;draw();dialog.querySelector('#pricesCompare')?.scrollIntoView({block:'nearest'});};}}
 }
 function compare(parent,it){
  const box=el('section',undefined,parent);box.id='pricesCompare';el('h3','Comparar y decidir',box);
  const latest=state.sources.filter(s=>s.source.providerId==='bcca-es'&&s.source.edition).map(s=>s.source.edition).sort().at(-1)||null;
  const cmp=Cat.compare(state.budget,it.id,state.quotes.map(q=>({source:q.source,quote:q.quote,state:q.state})),{today:new Date().toISOString().slice(0,10),latestEdition:latest});
  el('p',`Precio actual: ${eur(cmp.current.unitPrice)}${cmp.current.label?' ('+cmp.current.label+')':''}. Comparar no cambia nada.`,box,'cx-status').style.color='var(--ink-muted)';
  const t=el('table',undefined,el('div',undefined,box,'cx-scroll'),'cx-table');const hr=el('tr',undefined,el('thead',undefined,t));for(const x of ['Fuente','Código','Precio','Diferencia','Estado',''])el('th',x,hr);
  const tb=el('tbody',undefined,t);cmp.options.forEach((o,i)=>{const tr=el('tr',undefined,tb);el('td',nice(o.label)+(o.edition?' · ed. '+o.edition:''),tr);el('td',o.code||state.quotes[i].code,tr);
   el('td',o.unitPrice===null||o.unitPrice===undefined?'Desconocido':eur(o.unitPrice)+(o.unit?' / '+uq(o.unit):''),tr,'num');el('td',o.delta===null||o.delta===undefined?'—':(o.delta>0?'+':'')+eur(o.delta),tr,'num');
   const sc=el('td',undefined,tr);chip(Cat.describe(o.state).title,sc,Cat.STATES[o.state]?.tone==='ok'?'ok':'warn');const ac=el('td',undefined,tr);
   if(o.unitPrice!==null&&o.unitPrice!==undefined){const b=btn('Procedencia y decisión',ac,'cx-link');b.dataset.detail=String(i);b.onclick=()=>{state.detail=i;draw();};}});
  if(state.detail!==undefined&&state.quotes[state.detail]?.quote){const q=state.quotes[state.detail],s=q.quote.source,u=Cat.unitCheck(it.quantity.unit,q.quote.unit),dl=el('dl',undefined,box,'cx-prov');dl.id='pricesProvenance';
   for(const [k,v] of [['Fuente',nice(s.label)],['Tipo',q.source.kindLabel],['Código',q.quote.code],['Descripción',q.quote.description],['Unidad',uq(q.quote.unit)+(u.ok?'':' · distinta de la partida')],['Moneda',q.quote.currency],['Precio',eur(q.quote.unitPrice)+' sin IVA'],['Edición',s.edition||'no indicada'],['Región o columna',s.region||'no indicada'],['Fecha del precio',fmtDate(s.asOf)],['Licencia',licenseText(s.licenseStatus)],['Atribución',s.attribution||'no indicada por la fuente']]){el('dt',k,dl);el('dd',v,dl);}
   el('p','Es un precio de referencia: no es una oferta ni un coste de obra ejecutada.',box,'cx-status').style.color='var(--ink-muted)';
   const acts=el('div',undefined,box);acts.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
   const asP=btn('Usar como precio de la partida…',acts,'btn primary');asP.id='pricesAsPrice';asP.onclick=()=>{state.preview=Cat.previewApply(state.budget,it.id,q.quote,{as:'price',upgrade:true});draw();dialog.querySelector('#pricesPreview')?.scrollIntoView({block:'nearest'});};
   const asR=btn('Guardar solo como referencia…',acts);asR.id='pricesAsReference';asR.onclick=()=>{state.preview=Cat.previewApply(state.budget,it.id,q.quote,{as:'reference',upgrade:true});draw();};}
  const p=state.preview;if(!p)return;const pv=el('div',undefined,box,'cx-form');pv.id='pricesPreview';
  if(!p.ok){el('h3','No se puede aplicar',pv);el('p',p.blockers.map(b=>BLOCK[b]||b).join(' '),pv);el('p','Tu presupuesto no ha cambiado.',pv,'cx-status');return;}
  el('h3',p.as==='price'?'Vas a usar este precio en la partida':'Vas a guardar esta referencia junto a la partida',pv);
  const ba=el('div',undefined,pv,'cx-ba');for(const [k,v] of [['Ahora',p.before],['Después',p.after]]){const d=el('div',undefined,ba);el('b',k,d);el('span',eur(v.unitPrice),d);el('small',' · importe '+(v.subtotalNet===null?'desconocido':eur(v.subtotalNet)+' sin IVA'),d);}
  el('p',`${p.as==='price'?'El precio quedará «sin revisar» hasta que lo revises en el presupuesto.':'El precio actual de la partida no cambia.'} Importe conocido después: ${eur(p.after.coverage.netKnown)}${p.after.coverage.netComplete?'':' (presupuesto parcial)'}.`,pv,'cx-status').style.color='var(--ink-muted)';
  let consent=null;if(p.requiresConsent){const l=el('label',undefined,pv,'cx-check');consent=el('input',undefined,l);consent.type='checkbox';consent.id='pricesConsent';el('span','Sustituir el precio que ya había revisado',l);}
  const acts=el('div',undefined,pv);acts.style.cssText='display:flex;gap:8px';const ok=btn('Confirmar',acts,'btn primary');ok.id='pricesConfirm';btn('Cancelar',acts).onclick=()=>{state.preview=null;draw();};
  ok.onclick=async()=>{try{const before=Cat.revisionTag(state.budget),out=Cat.apply(state.budget,p,{confirmed:true,replaceReviewed:!!consent?.checked,decidedAt:new Date().toISOString()});commit(out.budget);
    await record({itemId:p.itemId,description:item(p.itemId).description,as:p.as,before:{unitPrice:p.before.unitPrice},after:{unitPrice:p.after.unitPrice},code:p.quote?.code||null,source:p.quote?.source?.label||null,revBefore:before,revAfter:Cat.revisionTag(state.budget)},p.as==='price'?'Precio aplicado':'Referencia guardada');
    state.preview=null;state.quotes=[];state.detail=undefined;state.msg='Cambio aplicado al presupuesto del proyecto. La versión anterior queda en el historial.';draw();}
   catch(err){state.err=/explicit consent/.test(err.message)?'Marca la casilla para sustituir un precio revisado.':/changed since/.test(err.message)?'El presupuesto cambió mientras tanto: prepara de nuevo la decisión.':err.message;draw();}};
 }
 function updates(parent){
  const p=state.proposal,box=el('section',undefined,parent);box.id='pricesUpdates';el('h3',`Actualización de edición: ${p.newEdition}`,box);
  el('p',Cat.STATES['update-available'].detail,box,'cx-banner');
  if(!p.rows.length){el('p','Ninguna partida del presupuesto usa precios de esta fuente.',box);return;}
  const ROW={'price-changed':['Precio distinto','info'],unchanged:['Sin cambios','ok'],'unit-incompatible':['Unidad cambiada: no aplicable','bad'],'missing-in-new':['No existe en la edición nueva','warn'],'no-price':['Sin precio en la edición nueva','warn']};
  const t=el('table',undefined,el('div',undefined,box,'cx-scroll'),'cx-table'),tb=el('tbody',undefined,t);
  for(const r of p.rows){const tr=el('tr',undefined,tb),c=el('td',undefined,tr),cb=el('input',undefined,c);cb.type='checkbox';cb.dataset.accept=r.itemId;cb.disabled=!(r.applicable&&r.state==='price-changed');cb.setAttribute('aria-label','Aceptar '+(item(r.itemId)?.description||r.itemId));
   el('td',item(r.itemId)?.description||r.itemId,tr);el('td',r.code,tr);el('td',eur(r.oldPrice),tr,'num');el('td',eur(r.newPrice),tr,'num');chip(...(ROW[r.state]||[r.state,'']),el('td',undefined,tr));}
  const l=el('label',undefined,box,'cx-check'),conf=el('input',undefined,l);conf.type='checkbox';conf.id='pricesUpdateConfirm';el('span','He revisado los cambios y quiero aplicar los seleccionados',l);
  const acts=el('div',undefined,box);acts.style.cssText='display:flex;gap:8px';const ok=btn('Aplicar seleccionados',acts,'btn primary');ok.id='pricesUpdateApply';btn('Ahora no',acts).onclick=()=>{state.proposal=null;draw();};
  ok.onclick=async()=>{const ids=[...box.querySelectorAll('[data-accept]:checked')].map(x=>x.dataset.accept);if(!ids.length){state.err='Selecciona al menos una partida.';draw();return;}if(!conf.checked){state.err='Confirma que has revisado los cambios.';draw();return;}
   try{const before=Cat.revisionTag(state.budget),out=Cat.applyEditionUpdate(state.budget,p,ids,{confirmed:true,decidedAt:new Date().toISOString()});commit(out.budget);
    await record({edition:p.newEdition,items:out.change.changes.map(c=>c.itemId),revBefore:before,revAfter:Cat.revisionTag(state.budget)},`Edición ${p.newEdition} aplicada`);state.proposal=null;state.err='';state.msg=`Edición ${p.newEdition} aplicada a ${out.change.changes.length} ${out.change.changes.length===1?'partida':'partidas'}.`;draw();}
   catch(err){state.err=/changed since/.test(err.message)?'El presupuesto cambió: vuelve a preparar la actualización.':err.message;draw();}};
 }
 function history(body){
  const box=el('details',undefined,body);box.id='pricesHistory';box.style.marginTop='14px';const sm=el('summary','Historial de cambios de precio',box);sm.style.cssText='font-weight:700;cursor:pointer;min-height:36px';
  Ctx.snapshot().then(snap=>{const list=(snap.record?.priceHistory?.[app.project.id]||[]).slice().reverse();sm.textContent=`Historial de cambios de precio (${list.length})`;
   if(!list.length){el('p','Todavía no hay cambios aplicados desde aquí.',box);return;}const ol=el('ol',undefined,box);
   for(const h of list)el('li',`${new Date(h.at).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'})} · ${h.label}${h.description?' · '+h.description:''}${h.after?` · ${eur(h.before?.unitPrice)} → ${eur(h.after.unitPrice)}`:''} · ${h.revBefore} → ${h.revAfter}`,ol);}).catch(()=>{});
 }
 window.FloorPlanReferencePricesUI={open,get state(){return state;}};
})();
