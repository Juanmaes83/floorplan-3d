/* FT3D-8 · S1-D «Expediente del proyecto»: the professional loads the documents RUBIK really exports (project or
   building JSON, C1-C4 budget JSON, Catastro GML) plus the FT3D-8 plan, binding and brand, or a dossier package.
   FloorPlanConstructionDossier proves they belong to the same project; the Gantt, timelapse, video and delivery then
   use exactly that evaluation (window.__ft3dFidelity.show). Route S1: local files in this browser, nothing is sent
   and this is NOT yet the direct connection with the RUBIK library (that needs authorised shared changes, S4).
   A document is identified by its content (schema), never by its extension. A rejected file never replaces the
   previous valid state. Loading another project starts a new dossier: nothing of the previous one survives. */
const Dos=window.FloorPlanConstructionDossier,X=window.FT3D8DossierFixtures,S=window.FloorPlanConstructionSchedule,B=window.FloorPlanBudget,
  A=window.FloorPlanConstructionProject,P=window.FloorPlanConstructionLabPresenter,Cat=window.FloorPlanCatastroParcel,Fid=()=>window.__ft3dFidelity;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const short=h=>h?String(h).slice(0,12):'—';
const euro=v=>v===null||v===undefined?'desconocido':P.euro(v);
// seq counts every finished file load (accepted or rejected): a deterministic signal for whoever waits on a load.
const state={input:null,evaluation:null,previous:null,change:null,opened:null,origin:null,error:null,seq:0};
const api=window.__ft3dDossier={state};
const provider=Cat?.provider||null;

/* ---------- scenarios (synthetic, built with the real engines) ---------- */
const SCENARIOS={
  A:{label:'A · Vivienda de una planta (expediente coherente)',build:()=>base('A')},
  B:{label:'B · Edificio de dos plantas (presupuestos por planta)',build:()=>base('B')},
  C:{label:'C · Reforma (existente, nuevo y demolido)',build:()=>base('C')},
  D:{label:'D · Sin planificación ni parcela',build:()=>base('D')},
  E:{label:'E · Presupuesto de otra vivienda',build:async()=>{const i=await base('A');i.budgets=[(await X.dossier('C')).budgets[0]];return i;}},
  F:{label:'F · Plan de otra vivienda (tareas que se llaman igual)',build:async()=>{const i=await base('A');
    i.schedule={...structuredClone(i.schedule),id:'sch_fx-other',projectRef:{type:'project',id:'prj_fx-other-house',revision:'0'.repeat(64)}};return i;}},
  G:{label:'G · Parcela asociada explícitamente a otro proyecto',build:async()=>{const c=await X.dossier('A');
    return {...await base('A'),parcelDocument:await Dos.readParcelDocument(c.gml.text,{provider,fileName:c.gml.fileName,associatedWith:{type:'project',id:'prj_fx-reform-c'}})};}},
  H:{label:'H · Revisión obsoleta (muro movido tras fijar el vínculo)',build:async()=>{const i=await base('A'),p=structuredClone(i.project);
    p.walls[0].end={...p.walls[0].end,x:p.walls[0].end.x+10};i.project=p;return i;}},
  I:{label:'I · Datos incompletos (precios sin valor, repartos pendientes, sin vínculo)',build:async()=>{const i=await base('C');i.binding=null;i.brand=null;i.parcelDocument=null;return i;}},
  J:{label:'J · GML no válido (CRS no admitido): se rechaza y se conserva el estado',build:null}};
async function base(id){
  const c=await X.dossier(id);
  return {project:c.project,budgets:c.budgets,selectedBudgetIds:null,schedule:c.schedule,binding:c.binding,brand:c.brand,registeredParcel:null,
    parcelDocument:c.gml?await Dos.readParcelDocument(c.gml.text,{provider,fileName:c.gml.fileName,associatedWith:c.gml.associatedWith}):null};
}

/* ---------- evaluate + hand over to the timelapse / delivery ---------- */
async function apply(input,origin,{opened=null}={}){
  const ev=await Dos.evaluate({...input,opened});
  if(!ev.model)throw new Dos.DossierError('project-invalid',ev.issues[0]?.detail?.detail||'');
  state.previous=state.evaluation;state.change=state.previous?Dos.invalidation(state.previous,ev):null;
  state.input=input;state.evaluation=ev;state.opened=opened;state.origin=origin;state.error=null;
  const budget=ev.authorities.budget.adapterBudgetId?input.budgets.find(b=>b.id===ev.authorities.budget.adapterBudgetId):null;
  const levels=ev.authorities.budget.selected.filter(v=>v.role==='level').map(v=>({levelId:v.levelId,budget:input.budgets.find(b=>b.id===v.budgetId)}));
  await Fid().show({source:input.project,schedule:input.schedule,budget,budgets:levels,binding:input.binding},
    {caseId:origin.caseId||null,origin:origin.text,kind:origin.kind,dossierInput:input},ev.model,ev);
  render();return summary();
}
async function loadScenario(id){
  state.error=null;
  if(id==='J'){await loadScenario('A');$('dossierSel').value='J';
    const bad=X.gml(X.PARCELS.A.reference,X.PARCELS.A.ring,{crs:'4326'});
    try{await loadFiles([new File([bad],'FIXTURE-crs-4326.gml',{type:'application/gml+xml'})]);}catch{}
    return summary();}
  const input=await SCENARIOS[id].build();$('dossierSel').value=id;
  return apply(input,{caseId:'S1-'+id,text:'EXPEDIENTE DE PRUEBA · '+SCENARIOS[id].label,kind:'fixture'});
}
const kindLabel={project:'proyecto',building:'edificio',budget:'presupuesto',schedule:'planificación',binding:'vínculo',brand:'marca',dossier:'expediente',gml:'parcela GML'};
// Files are read in this browser only. Project/building or a dossier start a NEW dossier; the rest join the current one.
async function loadFiles(files){
  const list=[...files],read=[];state.error=null;
  try{
    for(const f of list){const text=await f.text();
      if(/^﻿?\s*</.test(text)){read.push({kind:'gml',name:f.name,text});continue;}
      const doc=Dos.readJson(text),kind=Dos.kindOf(doc);if(!kind)throw new Dos.DossierError('import-unknown-kind',f.name);read.push({kind,name:f.name,doc,text});}
    const head=read.find(r=>r.kind==='dossier')||read.find(r=>r.kind==='project'||r.kind==='building');
    let input=head?null:state.input?{...state.input,budgets:[...state.input.budgets]}:null,opened=null;
    if(!head&&!input)throw new Error('Carga primero el proyecto o el expediente.');
    if(head?.kind==='dossier'){const o=await Dos.openPackage(head.doc);opened=o;input={...o.input};}
    else if(head){A.validateSource(head.doc);input={project:head.doc,budgets:[],selectedBudgetIds:null,schedule:null,binding:null,brand:null,parcelDocument:null,registeredParcel:null};}
    const subject={type:A.validateSource(input.project),id:input.project.id};
    for(const r of read){if(r===head)continue;
      if(r.kind==='budget'){const b=B.parseBudget(r.text);input.budgets=[...input.budgets.filter(x=>x.id!==b.id),b];}
      else if(r.kind==='schedule')input.schedule=S.parse(r.text);
      else if(r.kind==='binding')input.binding=A.validateBinding(r.doc);
      // Loading a brand or a GML into this dossier IS the explicit association with its subject.
      else if(r.kind==='brand')input.brand={snapshot:r.doc,appliesTo:subject};
      else if(r.kind==='gml'){const pd=await Dos.readParcelDocument(r.text,{provider,fileName:r.name,associatedWith:subject});
        if(pd.result?.status!=='available')throw new Dos.DossierError('parcel-document-invalid',({'unsupported-source-crs':'sistema de coordenadas no admitido (solo EPSG:25829, 25830, 25831 o 32628)'})[pd.result?.reason]||pd.result?.reason);
        input.parcelDocument=pd;}
      else if(r.kind==='project'||r.kind==='building'||r.kind==='dossier')throw new Error('Carga un solo proyecto o expediente cada vez.');}
    const names=read.map(r=>kindLabel[r.kind]+' «'+r.name+'»').join(', ');
    $('dossierSel').value='';
    return await apply(input,{text:(opened?'Expediente abierto':'Documentos cargados')+' localmente (no se envían) · '+names,kind:'import'},{opened});
  }catch(e){
    // The previous valid dossier stays exactly as it was.
    state.error={code:e.code||'import-failed',message:e.message};render();throw e;
  }finally{state.seq++;}
}
async function savePackage(){
  if(!state.input)throw new Error('No hay expediente');
  const pkg=await Dos.assemble({...state.input,selectedBudgetIds:state.input.selectedBudgetIds});
  const blob=new Blob([JSON.stringify(pkg,null,1)],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='expediente-'+pkg.id+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);
  return pkg;
}

/* ---------- rendering (human messages; codes in the diagnostics panel) ---------- */
const CHIP={ok:'Verificado',valid:'Válido',available:'Disponible',declared:'Declarado',partial:'Parcial',estimated:'Estimado',pending:'Pendiente',missing:'No disponible',obsolete:'Desactualizado',conflict:'Incompatible',unverifiable:'No verificable'};
const chip=k=>`<span class="dchip d-${k}">${CHIP[k]}</span>`;
const msgs=(ev,codes)=>{const list=ev.issues.filter(i=>codes.some(c=>typeof c==='string'?i.code===c:c.test(i.code)));
  return list.length?`<ul class="dmsg">${list.map(i=>`<li class="sev-${i.severity}">${esc(i.message)}</li>`).join('')}</ul>`:'';};
const has=(ev,code)=>ev.issues.some(i=>i.code===code);
function stepProject(ev){
  const s=ev.subject,a=ev.authorities.project,cov=ev.model.coverage.elements.byEvidence;
  const k=has(ev,'dossier-altered')||has(ev,'dossier-other-subject')?'conflict':'valid';
  return [k,`<p><strong>${esc(s.name)}</strong></p>
    <p>${s.type==='building'?`Edificio <code>${esc(s.id)}</code> · ${s.levels.length} plantas: ${s.levels.map(l=>`${esc(l.name)} (<code>${esc(l.projectId)}</code>)`).join(', ')}`:`Proyecto de una planta <code>${esc(s.id)}</code>`} · esquema ${esc(a.schemaVersion)}</p>
    <p>Revisión de geometría <code>${short(a.geometryRevision)}</code> · documento <code>${short(a.fingerprint)}</code> · guardado ${esc(a.updatedAt)}</p>
    <p>Geometría: ${cov.verified} elementos con escala real, ${cov.estimated} estimados, ${cov.pending} pendientes</p>`+msgs(ev,['dossier-altered','dossier-other-subject'])];
}
function stepPlace(ev){
  const t=ev.authorities.territory;let k='missing';
  if(t.status==='conflict'||t.evidence?.status==='other-project'||t.evidence?.status==='rejected')k='conflict';
  else if(t.status==='project-site')k=t.placement.status==='placed'?(t.placement.scaleEvidence==='verified'?'ok':'estimated'):t.placement.status==='invalid'?'conflict':'pending';
  else if(t.status==='candidate-unplaced')k='pending';
  const lic={restricted:'restringida: se puede ver aquí, no se incluye en el archivo del cliente','not-applicable':'sin restricción',verified:'verificada',unknown:'desconocida: no se exporta'};
  const ok=t.placement.checks?.filter(c=>c.ok).length||0,all=t.placement.checks?.length||0;
  const ev2=t.evidence?`<p>Archivo GML «${esc(t.evidence.fileName||'registrado')}»: ${esc(({match:'coincide con la parcela guardada',candidate:'recibido, sin parcela guardada en el proyecto','other-project':'asociado a otro proyecto',conflict:'referencia distinta de la guardada','geometry-differs':'geometría distinta de la guardada',rejected:'rechazado','registered-not-loaded':'registrado en el expediente; vuelve a cargarlo para comprobarlo',unassociated:'sin asociar'})[t.evidence.status]||t.evidence.status)}</p>`:'';
  return [k,(t.parcel?`<p>Parcela catastral <strong>${esc(t.parcel.reference)}</strong> · ${esc(t.parcel.sourceCrs)} · fuente ${esc(t.parcel.attribution||t.parcel.providerId)}</p>
    <p>Licencia ${esc(lic[t.parcel.licenseStatus]||t.parcel.licenseStatus)}</p>
    <p>${t.placement.status==='placed'?`Colocación indicada por el profesional · norte ${t.placement.northOffsetDeg}° · ${ok}/${all} comprobaciones numéricas correctas (tolerancia ${Dos.TOLERANCE_MM} mm)`:t.placement.status==='invalid'?'Colocación no válida':'Edificio sin colocar en la parcela: RUBIK no la propone'}</p>${ev2}`
    :`<p>${t.status==='candidate-unplaced'?`Parcela ${esc(t.evidence.reference)} recibida, pero el proyecto no la tiene guardada: no se coloca`:'Este proyecto no tiene parcela. No se inventa ninguna.'}</p>${ev2}`)+
    (t.layers.orthophoto||t.layers.terrain?`<p>Ortofoto/terreno: solo metadatos guardados; las imágenes no forman parte del expediente</p>`:'')+
    msgs(ev,[/^parcel-(other|reference|geometry|document|candidate|association)/,/^placement-/,'territory-not-exportable'])];
}
function stepBudget(ev){
  const b=ev.authorities.budget;let k='declared';
  if(has(ev,'budget-other-project')||has(ev,'budget-selection-invalid'))k='conflict';
  else if(ev.correspondence.some(c=>c.authority==='binding'&&c.against==='budget'&&c.result==='obsolete'))k='obsolete';
  else if(b.scope==='none')k='missing';
  else if(b.scope!=='project'&&b.scope!=='building')k='partial';
  else if(b.selected.some(v=>!v.totals.net.complete))k='partial';
  // A C1-C4 price review is a declaration of the professional: a budget is never shown as «verified».
  else k='declared';
  const rows=b.selected.map(v=>{const o={};for(const p of v.provenance)o[p.origin]=(o[p.origin]||0)+1;
    return `<div class="dbud"><p><strong>${esc(v.title)}</strong> <code>${esc(v.budgetId)}</code> · ${v.role==='level'?'planta '+esc(v.levelId):'todo el '+(ev.subject.type==='building'?'edificio':'proyecto')}</p>
      <p>Neto ${euro(v.totals.net.amount)}${v.totals.net.complete?'':' (incompleto)'} · IVA ${euro(v.totals.tax.amount)} · Total ${euro(v.totals.gross.amount)}${v.totals.gross.complete?'':' (incompleto)'}</p>
      <p>${v.items} partidas · ${v.unpricedItemIds.length} sin precio · ${v.unreviewedPriceItemIds.length} precio sin revisar · origen: ${Object.entries(o).map(([k2,n])=>`${n} ${({manual:'manual',none:'sin precio','user-bc3':'BC3 del estudio','bcca-es':'BCCA'})[k2]||k2}`).join(', ')}</p></div>`;}).join('');
  return [k,(rows||'<p>Sin presupuesto de este proyecto. No se muestran importes.</p>')+(b.message?`<p class="dnote">${esc(b.message)}</p>`:'')+
    (b.selected.length?'<p class="dnote">Revisión del proyecto en el presupuesto: no verificable (C1–C4 no la guarda)</p>':'')+
    msgs(ev,['budget-other-project','budget-selection-required','budget-selection-invalid','budget-revision-obsolete','budget-invalid'])];
}
function stepPlan(ev){
  const m=ev.model,sch=state.input.schedule;let k='missing';
  if(m.planning.status==='rejected')k='conflict';
  else if(m.planning.status==='available')k=ev.correspondence.some(c=>c.authority==='schedule'&&c.result==='obsolete')?'obsolete':m.planning.reviewed?'declared':'pending';
  if(m.planning.status!=='available')return [k,`<p>${m.planning.status==='rejected'?esc(Dos.human(m.planning.reason)):'Todavía no hay una planificación asociada. No se inventan fechas ni semanas.'}</p>`+msgs(ev,['schedule-other-project','schedule-invalid'])];
  const s=S.canonical(sch),bd=S.bounds(s),types={};for(const t of s.tasks)for(const d of t.dependsOn)types[d.type]=(types[d.type]||0)+1;
  const links=m.links.length,broken=m.links.filter(l=>l.status==='broken').length;
  return [k,`<p><strong>${esc(s.id)}</strong> · ${s.tasks.length} tareas · ${esc(P.dateLabel(bd.startDate))} → ${esc(P.dateLabel(bd.endDate))}</p>
    <p>Dependencias: ${Object.entries(types).map(([t,n])=>`${n} ${t}`).join(', ')||'ninguna'} · ${links} vínculos con elementos${broken?` · <span class="bad">${broken} a elementos inexistentes</span>`:''}</p>
    <p>${m.planning.reviewed?`Revisión declarada por ${esc(s.review.by)} (no acreditada)`:'Plan en borrador'}</p>`+msgs(ev,['schedule-project-revision-obsolete','schedule-revision-obsolete','link-unknown-element','project-revision-obsolete'])];
}
function stepEvolution(ev){
  return ev.usable.timelapse?['available','<p>El timelapse y el Gantt usan este modelo y este plan. La animación es ilustrativa: no es obra ejecutada.</p><div class="dactions"><button type="button" class="btn" data-go="stage">Ver evolución</button><button type="button" class="btn" data-go="gantt">Ver Gantt</button></div>']
    :['missing','<p>Sin una planificación válida de este proyecto se muestra el modelo estático, sin fechas inventadas.</p>'];
}
function stepDelivery(ev){
  const blockers=ev.issues.filter(i=>i.severity==='error');
  const terr=ev.exportPolicy.html;
  return [ev.usable.delivery?(ev.delivery.level==='orientative'?'pending':'declared'):blockers.length?'conflict':'missing',
    `<p>${ev.usable.delivery?esc(ev.delivery.label):blockers.length?'No se puede entregar: corrige las incompatibilidades del expediente':'No se puede entregar sin una planificación válida'}</p>
    ${blockers.length?`<ul class="dmsg">${blockers.map(i=>`<li class="sev-error">${esc(i.message)}</li>`).join('')}</ul>`:''}
    <p class="dnote">Vídeo y presentación: ${terr.parcelGeometry?'con la parcela':'sin geometría de parcela'}${terr.parcelReferenceText?' · referencia catastral y atribución como texto':''} · enlace público no activado en S1</p>
    <div class="dactions"><button type="button" class="btn" data-go="deliverPanel">Ir a la entrega</button></div>`];
}
function render(){
  const ev=state.evaluation,err=state.error;
  $('dossierError').textContent=err?`${err.message}${state.evaluation?' · El expediente anterior se conserva sin cambios.':''}`:'';
  $('dossierError').dataset.code=err?.code||'';
  if(!ev){$('dossierFlow').innerHTML='';return;}
  const c=state.change;
  $('dossierId').innerHTML=`<strong>Expediente <code>${esc(ev.dossier.id)}</code></strong> · ${esc(ev.subject.type==='building'?'edificio':'proyecto')} <code>${esc(ev.subject.id)}</code> · ${esc(({'local-documents':'documentos locales','local-package':'paquete local'})[ev.dossier.route])}${ev.dossier.integrity==='verified'?' · integridad verificada':ev.dossier.integrity==='altered'?' · <span class="bad">modificado después de prepararlo</span>':''}`;
  $('dossierChange').innerHTML=!c?'':c.subjectChanged?'Has cambiado de expediente: se han descartado el presupuesto, el plan, la parcela y la marca del anterior. Las entregas ya descargadas no cambian.'
    :!c.changed.length&&ev.issues.some(i=>i.severity==='error')?'Los documentos que no pertenecen a este expediente no se han incorporado: el expediente no cambia.'
    :c.changed.length?`Cambios desde la evaluación anterior: ${c.changed.map(x=>({geometry:'geometría',project:'proyecto',site:'parcela o colocación',parcelEvidence:'evidencia de parcela',schedule:'planificación',binding:'vínculo',brand:'marca',budget:'presupuesto'})[x]||x).join(', ')} → se invalida la entrega preparada${c.invalidates.links?', se recomprueban los vínculos':''}${c.invalidates.costs?', se recalculan los costes':''}. Las entregas descargadas se conservan.`:'Sin cambios respecto a la evaluación anterior.';
  const steps=[['Proyecto',stepProject],['Ubicación',stepPlace],['Presupuesto',stepBudget],['Plan de obra',stepPlan],['Evolución',stepEvolution],['Entrega',stepDelivery]];
  $('dossierFlow').innerHTML=steps.map(([t,f],i)=>{const [k,html]=f(ev);return `<li class="dstep" data-step="${i+1}" data-status="${k}"><h3><span>${i+1}</span>${t}${chip(k)}</h3>${html}</li>`;}).join('');
  const sel=ev.issues.find(i=>i.code==='budget-selection-required');
  $('budgetPick').hidden=!sel;if(sel)$('budgetPickSel').innerHTML=sel.detail.budgetIds.map(id=>`<option>${esc(id)}</option>`).join('');
  $('dossierDiag').innerHTML=`<table><caption>Correspondencias comprobadas</caption><tr><th>Autoridad</th><th>Frente a</th><th>Resultado</th><th>Código</th></tr>${ev.correspondence.map(r=>`<tr data-result="${r.result}"><td>${esc(r.authority)}</td><td>${esc(r.against)}</td><td>${esc(r.result)}</td><td><code>${esc(r.code)}</code></td></tr>`).join('')}</table>
    <table><caption>Avisos</caption><tr><th>Nivel</th><th>Código</th><th>Mensaje</th></tr>${ev.issues.map(i=>`<tr class="sev-${i.severity}"><td>${i.severity}</td><td><code>${esc(i.code)}</code></td><td>${esc(i.message)}${i.technical&&i.technical!==i.message?` <small>(${esc(i.technical)})</small>`:''}</td></tr>`).join('')}</table>
    <p><b>Conflictos</b> (ninguna fuente se impone): ${ev.conflicts.length?ev.conflicts.map(x=>`<code>${esc(x.code)}</code> ${esc(JSON.stringify(x.values))}`).join(' · '):'ninguno'}</p>
    <p><b>Huellas</b>: ${Object.entries(ev.fingerprints).map(([k2,v])=>`${k2} <code>${esc(typeof v==='string'?short(v):JSON.stringify(Object.fromEntries(Object.entries(v||{}).map(([a,b2])=>[a,short(b2)]))))}</code>`).join(' · ')}</p>`;
}
function summary(){const ev=state.evaluation;return ev?{id:ev.dossier.id,subject:ev.subject.id,usable:ev.usable,level:ev.delivery.level,errors:ev.issues.filter(i=>i.severity==='error').map(i=>i.code),
  steps:[...document.querySelectorAll('#dossierFlow .dstep')].map(s=>s.dataset.status),change:state.change,error:state.error}:{error:state.error};}

/* ---------- wiring ---------- */
$('dossierSel').innerHTML='<option value="" disabled>— documentos cargados por ti —</option>'+Object.entries(SCENARIOS).map(([id,s])=>`<option value="${id}">${esc(s.label)}</option>`).join('');
$('dossierSel').onchange=()=>loadScenario($('dossierSel').value).catch(e=>{state.error={code:e.code,message:e.message};render();});
$('dossierFiles').onchange=async()=>{const f=$('dossierFiles').files;try{if(f.length)await loadFiles(f);}catch{}finally{$('dossierFiles').value='';}};
$('dossierSave').onclick=()=>savePackage().catch(e=>{state.error={code:e.code,message:e.message};render();});
$('budgetPickGo').onclick=()=>apply({...state.input,selectedBudgetIds:[$('budgetPickSel').value]},{...state.origin,text:state.origin.text+' · presupuesto elegido'});
$('dossierFlow').onclick=e=>{const b=e.target.closest('[data-go]');if(b)$(b.dataset.go)?.scrollIntoView({behavior:'smooth',block:'start'});};
// defineProperties, not Object.assign: the getter must stay live (Object.assign would copy its current value).
Object.defineProperties(api,Object.getOwnPropertyDescriptors({loadScenario,loadFiles,savePackage,summary,get evaluation(){return state.evaluation;},scenarios:Object.keys(SCENARIOS)}));
const q=new URLSearchParams(location.search);
if(!q.get('case')){const id=SCENARIOS[q.get('dossier')]?q.get('dossier'):'A';
  loadScenario(id).then(()=>{const f=Fid();if(q.get('date')&&f.ctx?.timeline)f.setDate(q.get('date'));if(q.get('end')==='1'&&f.ctx?.timeline)f.end();})
    .catch(e=>{state.error={code:e.code,message:e.message};render();document.body.classList.add('ready');});}
else{$('dossierPanel').dataset.mode='fidelity';$('dossierId').textContent='Modo fidelidad (?case=): casos A–D sin expediente. Quita «?case» para usar el expediente.';}
window.addEventListener('ft3d8-selection',e=>{if(!e.detail.dossier&&state.evaluation){state.evaluation=null;state.input=null;state.change=null;$('dossierFlow').innerHTML='';
  $('dossierId').textContent='Fuente individual cargada desde «Proyecto de prueba» o importación suelta: sin expediente.';}});
