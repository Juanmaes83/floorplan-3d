/* ENT-04 · Dossier antes/después. Núcleo puro sobre la comparación de UX-07 (FloorPlanRevisionCompare) y, si existe,
   el presupuesto C1–C4 ya guardado del proyecto (FloorPlanBudgetPresentation.buildReport). No calcula precios, no
   completa importes, no publica ni crea enlaces: produce un borrador interno descargable (HTML autocontenido, sin
   scripts ni recursos externos) y su manifiesto con huellas SHA-256 para verificarlo después.

   Presupuesto (si se adjunta):
   - debe ser del mismo proyecto que «después» (subject.id); si no, no se adjunta;
   - rótulo «Presupuesto completo» solo si el informe dice que neto e IVA están completos; si no, «Presupuesto parcial»
     con el importe CONOCIDO, que nunca se presenta como total;
   - RUBIK no guarda sobre qué revisión se hizo un presupuesto (DEC-07): se comprueba que sus cantidades coinciden con
     las de «después» (mismo borrador real, FloorPlanBudgetDraft.lines) y se dice si no coinciden.

   Fase 2 (1.1.0): si además se da el presupuesto de «antes», se adjunta la comparación partida a partida de
   FloorPlanRevisionBudget (diferencia total solo con los dos completos y coherentes con su revisión). El manifiesto 1.1.0
   lleva también la huella de ese presupuesto; verify sigue aceptando los manifiestos 1.0.0. */
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const api=factory(node?require('./revision-compare-core.js'):root.FloorPlanRevisionCompare,node?require('./budget-presentation.js'):root.FloorPlanBudgetPresentation,node?require('./budget-draft-core.js'):root.FloorPlanBudgetDraft,node?require('./revision-budget-core.js'):root.FloorPlanRevisionBudget);
  if(node)module.exports=api;else root.FloorPlanBeforeAfterDossier=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Compare,Presentation,Draft,RevisionBudget){
  'use strict';
  if(!Compare||!Presentation||!Draft)throw Error('FloorPlanBeforeAfterDossier requiere FloorPlanRevisionCompare, FloorPlanBudgetPresentation y FloorPlanBudgetDraft.');
  const SCHEMA='rubik-sota.before-after-dossier',VERSION='1.1.0',VERSIONS=Object.freeze(['1.0.0','1.1.0']);
  const fail=(code,message)=>{const e=new Error(message||code);e.code=code;throw e;};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const eur=v=>v===null||v===undefined?'—':new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(v);
  const num=(v,d=2)=>new Intl.NumberFormat('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);
  const RELATION_ES={'same-project':'Dos revisiones del mismo proyecto (mismo identificador).','library-variant':'Original y variante enlazadas en la biblioteca de este navegador.','declared':'Dos proyectos distintos que el profesional declara como revisiones de la misma obra.'};
  const QLABELS={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'Tabiquería nueva',demolition:'Demolición',door:'Puerta',slidingDoor:'Puerta corredera',window:'Ventana',tariff:'Tarifa',chapters:{floors:'',walls:'',partitions:'',carpentry:''}};

  /* Bloque de presupuesto, o null. Lanza budget-subject-mismatch / budget-empty si no se puede adjuntar con honestidad. */
  function budgetBlock(budget,afterProject,beforeProject=null){
    if(!budget)return null;
    if(budget.subject?.type!=='project'||budget.subject.id!==afterProject.id)fail('budget-subject-mismatch','Este presupuesto no es del proyecto «después»: no se adjunta.');
    const report=Presentation.buildReport(budget),t=report.totals;
    if(!report.lines.length)fail('budget-empty','El presupuesto no tiene partidas: no hay nada que adjuntar.');
    const complete=t.net.complete&&t.gross.complete&&t.tax.complete;
    const expected=new Map(Draft.lines(afterProject,{labels:QLABELS}).map(l=>[l.key,l.quantity]));
    const differ=[];for(const l of report.lines){const q=expected.get(l.id);
      if(!q)differ.push({item:l.description,reason:'no existe en «después»'});
      else if(l.quantity.unit!==q.unit||Math.abs(l.quantity.value-q.value)>1e-6)differ.push({item:l.description,reason:`${num(l.quantity.value)} ${l.quantity.unit} en el presupuesto, ${num(q.value)} ${q.unit} en «después»`});}
    for(const [key] of expected)if(!report.lines.some(l=>l.id===key))differ.push({item:key,reason:'falta en el presupuesto'});
    // Fase 2: si no coincide con «después», ¿coincide con «antes»? (mismo proyecto: el presupuesto guardado puede ser anterior).
    const matches=RevisionBudget&&beforeProject?RevisionBudget.revisionMatch(budget,{before:beforeProject,after:afterProject}).matches:null;
    const sources=[...new Set(report.lines.filter(l=>l.unitPrice!==null).map(l=>l.priceSource?.label||(l.priceSource?.type==='provider-reference'?'Precio de referencia':'Precio propio')))];
    return {label:complete?'Presupuesto completo':'Presupuesto parcial',complete,budgetId:report.budgetId,title:report.title,currency:report.currency,
      net:{amount:t.net.amount,complete:t.net.complete},tax:complete?{amount:t.tax.amount}:null,gross:complete?{amount:t.gross.amount}:null,
      items:report.lines.length,unpriced:t.unpricedItemIds.length,unreviewed:t.unreviewedPriceItemIds.length,incomplete:t.incompleteQuantityItemIds.length,
      priceSources:sources,quantities:differ.length?'differ':'match',quantityDifferences:differ,revisionMatch:matches,
      revisionNote:'RUBIK no registra sobre qué revisión se hizo un presupuesto: se ha comprobado que sus cantidades coinciden con las de «después».'};
  }

  /* Modelo del dossier. comparison: FloorPlanRevisionCompare.compare(before, after). */
  function view(comparison,{beforeProject,afterProject,budget=null,beforeBudget=null,title=null,now=new Date().toISOString()}={}){
    if(comparison?.schema!==Compare.SCHEMA)fail('comparison-required','Falta la comparación de las dos revisiones.');
    if(beforeProject?.id!==comparison.before.projectId||afterProject?.id!==comparison.after.projectId)fail('projects-mismatch','Los proyectos no son los de la comparación.');
    const b=budgetBlock(budget,afterProject,beforeProject);
    if(beforeBudget&&!RevisionBudget)fail('revision-budget-required','Para comparar los dos presupuestos hace falta FloorPlanRevisionBudget.');
    if(beforeBudget&&!budget)fail('after-budget-required','Para comparar presupuestos hace falta también el de «después».');
    const bc=beforeBudget?RevisionBudget.compareBudgets({comparison,beforeProject,afterProject,beforeBudget,afterBudget:budget}):null;
    const groups={};for(const c of comparison.changes)(groups[c.entity]||=[]).push(c.summary);
    return {schema:SCHEMA,version:VERSION,status:'draft-internal',publication:'none',generatedAt:now,
      title:title||`Antes y después · ${comparison.after.name}`,relation:comparison.relation,relationLabel:RELATION_ES[comparison.relation],
      before:comparison.before,after:comparison.after,perspective:comparison.perspective.statement,
      counts:comparison.counts,identical:comparison.identical,changes:groups,materials:comparison.materials,illustrative:comparison.illustrative,
      metrics:comparison.metrics,limits:comparison.limits,budget:b,
      budgetAbsent:b?null:'Sin presupuesto adjunto: este dossier no muestra importes.',budgetComparison:bc};
  }

  const ENTITY_TITLE={wall:'Muros',opening:'Puertas y ventanas',room:'Estancias',object:'Muebles',material:'Definición de materiales'};
  function html(v,{beforeSvg,afterSvg}){
    const li=a=>a.map(x=>`<li>${esc(x)}</li>`).join('');
    const mat=m=>m?`${esc(m.name||m.id)}${m.color?` <span class="sw" style="background:${esc(m.color)}"></span>`:''}`:'<em>sin declarar</em>';
    const b=v.budget;
    const budget=b?`<section class="budget"><h2>${esc(b.label)}</h2>
<p>${esc(b.title)} · ${b.items} partidas${b.unpriced?` · <strong>${b.unpriced} sin precio</strong>`:''}${b.unreviewed?` · ${b.unreviewed} precio(s) sin revisar`:''}.</p>
${b.complete?`<table><tr><th>Sin IVA</th><td>${eur(b.net.amount)}</td></tr><tr><th>IVA</th><td>${eur(b.tax.amount)}</td></tr><tr><th>Total</th><td>${eur(b.gross.amount)}</td></tr></table>`
  :`<p><strong>Importe conocido sin IVA: ${eur(b.net.amount)}</strong>. No es el coste total: hay partidas sin precio o sin cantidad.</p>`}
<p class="small">Origen de los precios: ${esc(b.priceSources.join(' · ')||'—')}.</p>
<p class="small">${esc(b.revisionNote)} Resultado: ${b.quantities==='match'?'<strong>coinciden</strong>.':`<strong>no coinciden en ${b.quantityDifferences.length} partida(s)</strong>; ${b.revisionMatch==='before'?`<strong>sus cantidades son las de «${esc(v.before.label)}»</strong>: está hecho sobre la revisión anterior.`:'el presupuesto puede estar hecho sobre otra revisión.'}`}</p>
${b.quantities==='differ'?`<ul class="small">${li(b.quantityDifferences.map(d=>`${d.item}: ${d.reason}`))}</ul>`:''}</section>`
      :`<section class="budget"><h2>Presupuesto</h2><p>${esc(v.budgetAbsent)}</p></section>`;
    const bc=v.budgetComparison,CH={same:'igual',quantity:'cantidad',price:'precio','quantity-and-price':'cantidad y precio',added:'nueva',removed:'quitada'};
    const amt=s=>s?s.net===null?'<em>sin precio</em>':eur(s.net):'—',dl=l=>l.delta?`${l.delta.net>0?'+':''}${eur(l.delta.net)}`:'<em>no comparable</em>';
    const T=bc?.totals,comparisonSection=!bc?'':`<section class="budget-compare" data-status="${esc(bc.status)}"><h2>Presupuesto «${esc(v.before.label)}» frente a «${esc(v.after.label)}»</h2>
<p><strong>${esc({complete:'Comparación completa',partial:'Comparación parcial',incoherent:'Comparación no válida',['one-sided']:'Comparación no disponible',none:'Sin presupuestos'}[bc.status])}.</strong> ${esc(T.statement)}</p>
${bc.status==='complete'?`<table><tr><th></th><th>${esc(v.before.label)}</th><th>${esc(v.after.label)}</th><th>Diferencia</th></tr><tr><th>Sin IVA</th><td>${eur(T.net.before)}</td><td>${eur(T.net.after)}</td><td>${T.net.delta>0?'+':''}${eur(T.net.delta)}</td></tr><tr><th>Con IVA</th><td>${eur(T.gross.before)}</td><td>${eur(T.gross.after)}</td><td>${T.gross.delta>0?'+':''}${eur(T.gross.delta)}</td></tr></table>`
  :bc.status==='partial'?`<p>Importe conocido sin IVA: «${esc(v.before.label)}» ${eur(T.knownNet.before)} · «${esc(v.after.label)}» ${eur(T.knownNet.after)}. <strong>Diferencia de las ${T.comparable.items} partidas comparables: ${T.comparable.netDelta>0?'+':''}${eur(T.comparable.netDelta)} sin IVA</strong>; quedan fuera ${T.excluded.length} partida(s). No es la diferencia de coste total.</p>`
  :bc.status==='incoherent'?`<ul class="small">${li(T.mismatched.map(x=>`Presupuesto de «${x.side==='before'?v.before.label:v.after.label}»: sus cantidades ${x.revisionMatch==='neither'?'no corresponden a ninguna de las dos revisiones':`son las de «${x.revisionMatch==='before'?v.before.label:x.revisionMatch==='after'?v.after.label:'las dos'}»`} (${x.differences} diferencia(s)).`))}</ul>`:''}
${bc.status==='complete'||bc.status==='partial'?`<table class="small lines"><tr class="head"><th>Partida</th><th>Cambio</th><th>${esc(v.before.label)}</th><th>${esc(v.after.label)}</th><th>Diferencia</th><th>Depende de</th></tr>${bc.lines.filter(l=>l.change!=='same').map(l=>`<tr data-item="${esc(l.itemId)}"><td data-label="Partida">${esc(l.description)}</td><td data-label="Cambio">${esc(CH[l.change])}</td><td data-label="${esc(v.before.label)}">${amt(l.before)}</td><td data-label="${esc(v.after.label)}">${amt(l.after)}</td><td data-label="Diferencia">${dl(l)}</td><td data-label="Depende de">${l.explainedBy.length?esc(l.explainedBy.length+' cambio(s) del proyecto'):'<strong>ningún cambio</strong>'}</td></tr>`).join('')}</table>
<p class="small">«Depende de» es la relación de cálculo del borrador de RUBIK (qué datos del proyecto miden la partida), no un reparto del coste entre cambios. ${bc.counts.items-bc.counts.changed} partida(s) sin cambios no se listan.</p>`:''}
${bc.notes.length?`<ul class="small">${li(bc.notes)}</ul>`:''}</section>`;
    const m=v.metrics,row=(k,l,u='')=>`<tr><th>${l}</th><td>${m.before[k]}${u}</td><td>${m.after[k]}${u}</td><td>${m.delta[k]>0?'+':''}${m.delta[k]}${u}</td></tr>`;
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(v.title)}</title>
<style>body{margin:0;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1d2124;background:#fff}main{max-width:1100px;margin:0 auto;padding:20px}
.draft{background:#fff4e5;border:1px solid #e5c79f;padding:8px 12px;border-radius:6px}h1{font-size:1.5rem;margin:.4em 0}h2{font-size:1.1rem;margin:1.4em 0 .4em}
.plans{display:grid;grid-template-columns:1fr 1fr;gap:12px}.plans figure{margin:0;border:1px solid #d6d3cc;border-radius:6px;padding:8px}.plans svg{width:100%;height:auto;display:block}
figcaption{font-weight:600}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #e4e1da;padding:4px 8px;text-align:left}.small{font-size:.9em;color:#4c5257}
.sw{display:inline-block;width:.9em;height:.9em;border:1px solid #999;vertical-align:-.1em}.legend span{margin-right:1em}
@media (max-width:640px){.plans{grid-template-columns:1fr}table.lines tr.head{display:none}table.lines tr{display:block;border-bottom:1px solid #e4e1da;padding:6px 0}table.lines td{display:flex;justify-content:space-between;gap:12px;border:0;padding:2px 0;text-align:right}table.lines td::before{content:attr(data-label);font-weight:600;color:#4c5257;text-align:left}}@media print{.draft{border:1px solid #999}}</style></head><body><main>
<p class="draft"><strong>Borrador interno · no enviado al cliente.</strong> Generado ${esc(v.generatedAt)}. Comprobable con su manifiesto SHA-256.</p>
<h1>${esc(v.title)}</h1>
<p>${esc(v.relationLabel)} <strong>${esc(v.before.label)}:</strong> ${esc(v.before.name)} (${esc(v.before.updatedAt)}) · <strong>${esc(v.after.label)}:</strong> ${esc(v.after.name)} (${esc(v.after.updatedAt)}).</p>
<p>${esc(v.perspective)}</p>
<div class="plans"><figure>${beforeSvg}<figcaption>${esc(v.before.label)}</figcaption></figure><figure>${afterSvg}<figcaption>${esc(v.after.label)}</figcaption></figure></div>
<p class="legend small"><span>Verde: añadido</span><span>Rojo discontinuo: quitado o a demoler</span><span>Ámbar: cambiado</span><span>Relleno de estancia: color de su suelo declarado</span></p>
<h2>Cambios reales (${v.counts.total}): ${v.counts.added} añadidos, ${v.counts.removed} quitados, ${v.counts.modified} cambiados</h2>
${v.identical?'<p>Las dos revisiones son iguales en los datos del proyecto.</p>':Object.entries(v.changes).map(([k,a])=>`<h3>${ENTITY_TITLE[k]||k}</h3><ul>${li(a)}</ul>`).join('')}
<p class="small">Todos salen de los datos de las dos revisiones del proyecto.</p>
<h2>Materiales cambiados</h2>${v.materials.length?`<table><tr><th>Dónde</th><th>${esc(v.before.label)}</th><th>${esc(v.after.label)}</th></tr>${v.materials.map(x=>`<tr><td>${esc(x.scope==='room'?'Suelo':'Pared')} · ${esc(x.entityName)}</td><td>${mat(x.before)}</td><td>${mat(x.after)}</td></tr>`).join('')}</table>`:'<p>Ningún material declarado ha cambiado.</p>'}
<h2>Lo que es ilustrativo</h2><ul>${v.illustrative.map(i=>`<li><strong>${esc(i.what)}.</strong> ${esc(i.why)}</li>`).join('')}</ul>
<h2>Cifras del proyecto</h2><table><tr><th></th><th>${esc(v.before.label)}</th><th>${esc(v.after.label)}</th><th>Diferencia</th></tr>${row('netAreaM2','Superficie útil',' m²')}${row('rooms','Estancias')}${row('walls','Muros')}${row('openings','Huecos')}${row('objects','Muebles')}</table>
${budget}
${comparisonSection}
<h2>Límites</h2><ul class="small">${li(v.limits)}</ul>
</main></body></html>`;
  }

  async function sha256(text){const d=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
  const canonical=x=>JSON.stringify(x);
  /* Exporta el borrador: {html, manifest}. Nada se envía: el laboratorio solo ofrece descargarlos. */
  async function exportDossier(v,{beforeProject,afterProject,budget=null,beforeBudget=null,comparison,beforeSvg,afterSvg}){
    if(!!v.budgetComparison?.before!==!!beforeBudget)fail('before-budget-mismatch','El presupuesto de «antes» no es el del dossier.');
    const page=html(v,{beforeSvg,afterSvg});
    const manifest={schema:SCHEMA+'-manifest',version:VERSION,generatedAt:v.generatedAt,status:v.status,publication:'none',relation:v.relation,
      before:{projectId:beforeProject.id,name:beforeProject.name,updatedAt:beforeProject.updatedAt,sha256:await sha256(canonical(beforeProject))},
      after:{projectId:afterProject.id,name:afterProject.name,updatedAt:afterProject.updatedAt,sha256:await sha256(canonical(afterProject))},
      comparison:{schema:comparison.schema,version:comparison.version,changes:comparison.counts.total,sha256:await sha256(canonical(comparison.changes))},
      budget:v.budget?{budgetId:v.budget.budgetId,label:v.budget.label,quantities:v.budget.quantities,sha256:await sha256(canonical(budget))}:null,
      beforeBudget:v.budgetComparison?.before?{budgetId:v.budgetComparison.before.budgetId,status:v.budgetComparison.status,sha256:await sha256(canonical(beforeBudget))}:null,
      html:{bytes:new TextEncoder().encode(page).length,sha256:await sha256(page)}};
    return {html:page,manifest};
  }
  /* Comprueba un dossier descargado contra su manifiesto y, si se dan, contra los proyectos y el presupuesto actuales. */
  async function verify(page,manifest,{beforeProject,afterProject,budget,beforeBudget}={}){
    const checks=[];const add=(name,ok,detail='')=>checks.push({name,ok,detail});
    add('manifiesto',manifest?.schema===SCHEMA+'-manifest'&&VERSIONS.includes(manifest.version));
    add('sin publicación',manifest?.publication==='none'&&manifest?.status==='draft-internal');
    add('tamaño del HTML',new TextEncoder().encode(page).length===manifest?.html?.bytes);
    add('huella del HTML',await sha256(page)===manifest?.html?.sha256);
    add('sin scripts ni recursos externos',!/<script|<iframe|<link[^>]+href|src\s*=\s*["']?https?:|url\(\s*["']?https?:/i.test(page));
    if(beforeProject)add('revisión «antes» sin cambios',await sha256(canonical(beforeProject))===manifest?.before?.sha256);
    if(afterProject)add('revisión «después» sin cambios',await sha256(canonical(afterProject))===manifest?.after?.sha256);
    if(budget!==undefined)add('presupuesto sin cambios',budget?await sha256(canonical(budget))===manifest?.budget?.sha256:manifest?.budget===null);
    // 1.1.0: el presupuesto de «antes» (los manifiestos 1.0.0 no lo tienen: solo cabe «sin presupuesto de antes»).
    if(beforeBudget!==undefined)add('presupuesto de «antes» sin cambios',beforeBudget?await sha256(canonical(beforeBudget))===manifest?.beforeBudget?.sha256:!manifest?.beforeBudget);
    return {ok:checks.every(c=>c.ok),checks};
  }
  return Object.freeze({SCHEMA,VERSION,VERSIONS,view,budgetBlock,html,exportDossier,verify,sha256});
});
