/* C4 «Dossier económico» in Entregar. It presents, never edits: the budget is the one Presupuestar prepares
   (FloorPlanBudgetUI.current, the same draft summary() reads, never saved from here), the report is
   FloorPlanBudgetPresentation.buildReport, and the view model is FloorPlanEconomicDossier.view. Every figure comes
   from that report; nothing here measures, prices, totals or persists. Exports reuse the existing authorities:
   toCsv, serializeReport and FloorPlanBc3Budget.exportBudget. «Revisar presupuesto» goes back to Presupuestar.
   section() is the compact economic page that the A4 dossier (and through it the B1 client file) embeds. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,E=window.FloorPlanEconomicDossier,P=window.FloorPlanBudgetPresentation;if(!app||!E||!P)return;
 const css=document.createElement('link');css.rel='stylesheet';css.href='css/economic-dossier.css';document.head.append(css);
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const local=v=>typeof nm==='function'?nm(v):v;
 const loc=()=>({es:'es-ES',en:'en-GB',zh:'zh-CN'})[typeof LANG==='string'?LANG:'es']||'es-ES';
 const eur=v=>v===null||v===undefined?'—':v.toLocaleString(loc(),{style:'currency',currency:'EUR'});
 const num=(v,d=2)=>v===null||v===undefined?'—':v.toLocaleString(loc(),{minimumFractionDigits:d,maximumFractionDigits:d});
 const pct=v=>v===null||v===undefined?'—':num(v,v%1?2:0)+' %';
 const UNIT=()=>({m2:'m²',m:'m',unit:tx('ud','pcs','个')});
 const slug=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,50)||'proyecto';
 const ORIGIN=()=>({none:tx('Sin precio','No price','无价格'),reference:tx('Referencia','Reference','参考'),own:tx('Propio','Own','自有')});
 const REVIEW=()=>({pending:tx('Pendiente de revisar','Pending review','待审核'),reviewed:tx('Revisado','Reviewed','已审核')});
 const QSTATUS=()=>({measured:tx('medido','measured','已测量'),estimated:tx('estimado','estimated','估算'),unavailable:tx('no disponible','unavailable','不可用')});
 const WARN=()=>({'unpriced-items':n=>tx(`${n} partida(s) sin precio: el total no está completo.`,`${n} item(s) without price: the total is incomplete.`,`${n} 项无价格：总额不完整。`),
  'unavailable-quantities':n=>tx(`${n} partida(s) con medición no disponible.`,`${n} item(s) with unavailable quantity.`,`${n} 项数量不可用。`),
  'incomplete-quantities':n=>tx(`${n} partida(s) con medición incompleta.`,`${n} item(s) with incomplete quantity.`,`${n} 项数量不完整。`),
  'unreviewed-prices':n=>tx(`${n} precio(s) pendientes de revisar por el profesional.`,`${n} price(s) pending the professional's review.`,`${n} 个价格待审核。`),
  'tax-incomplete':n=>tx(`IVA no definido o incompleto en ${n} partida(s): no hay total con IVA definitivo.`,`VAT undefined or incomplete on ${n} item(s): no final total with VAT.`,`${n} 项增值税未定义：无最终含税总额。`)});
 const NOTE=()=>tx('Cifras orientativas preparadas por el profesional a partir del proyecto. No es un presupuesto certificado ni una oferta vinculante.','Indicative figures prepared by the professional from the project. Not a certified budget nor a binding offer.','专业人员根据项目准备的参考数字，非认证预算或有约束力的报价。');
 // The budget Presupuestar prepared for this project, read without saving; null when none was ever prepared.
 function current(){const cur=window.FloorPlanBudgetUI?.current?.();if(!cur||!cur.saved)return null;try{return {budget:cur.budget,report:P.buildReport(cur.budget)};}catch{return null;}}
 function contextName(c){if(!c)return '';if(c.scope==='home')return tx('Vivienda','Home','住宅');
  const pool=c.scope==='room'?(app.project.rooms||[]).concat(...(app.project.levels||[]).map(l=>l.rooms||[])):(app.project.levels||[]);
  const hit=c.id?pool.find(x=>x.id===c.id):null;return hit?.name?local(hit.name):(c.scope==='room'?tx('Estancia','Room','房间'):tx('Planta','Level','楼层'));}
 function taxText(t){return t.state==='undefined'||t.state==='incomplete'?tx('IVA no definido/incompleto','VAT undefined/incomplete','增值税未定义/不完整'):t.state==='zero'?tx('IVA 0 %','VAT 0 %','增值税 0 %'):t.mixed?tx('IVA (tipos por partida)','VAT (per-item rates)','增值税（按项）'):tx('IVA ','VAT ','增值税 ')+pct(t.ratePercent);}
 // Totals block: a gross total is shown as final only when the report says it is complete.
 function totals(v,parent){const s=v.summary,box=el('dl',undefined,parent,'econ-totals');
  const row=(k,val,cls)=>{const w=el('div',undefined,box,cls);el('dt',k,w);el('dd',val,w);return w;};
  row(tx('Base imponible','Net amount','税前'),s.net.complete?eur(s.net.amount):eur(s.net.amount)+' · '+tx('parcial','partial','部分'),s.net.complete?'':'econ-partial');
  row(taxText(s.tax),s.tax.complete?eur(s.tax.amount):tx('No definido','Undefined','未定义'),s.tax.complete?'':'econ-partial');
  if(s.gross.final)row(tx('Total con IVA','Total incl. VAT','含税总额'),eur(s.gross.amount),'econ-gross');
  else row(tx('Total con IVA','Total incl. VAT','含税总额'),tx('No definitivo','Not final','非最终'),'econ-gross econ-partial');
  return box;}
 function counts(v,parent){const s=v.summary;if(s.empty)return;const p=el('p',undefined,parent,'econ-counts');
  p.textContent=[tx(`${s.chapters} capítulo(s)`,`${s.chapters} chapter(s)`,`${s.chapters} 章`),tx(`${s.items} partida(s)`,`${s.items} item(s)`,`${s.items} 项`),
   tx(`${s.unpriced} sin precio`,`${s.unpriced} without price`,`${s.unpriced} 无价格`),tx(`${s.unavailable+s.incomplete} con medición no disponible o incompleta`,`${s.unavailable+s.incomplete} with unavailable or incomplete quantity`,`${s.unavailable+s.incomplete} 数量不完整`),
   ...(v.variant==='professional'?[s.reviewComplete?tx('revisión completa','review complete','审核完成'):tx(`${s.unreviewed} precio(s) pendientes de revisar`,`${s.unreviewed} price(s) pending review`,`${s.unreviewed} 待审核`)]:[])].join(' · ');}
 function warnings(v,parent){if(!v.warnings.length)return;const ul=el('ul',undefined,parent,'econ-warnings');ul.setAttribute('role','list');const W=WARN();
  for(const w of v.warnings){const li=el('li',W[w.code](w.count),ul);li.dataset.code=w.code;if(w.items?.length){el('small',' · '+w.items.slice(0,6).join(', ')+(w.items.length>6?'…':''),li);}}}
 function lineRow(l,tbody,pro){const tr=el('tr',undefined,tbody);tr.dataset.origin=l.origin;if(l.review)tr.dataset.review=l.review;
  const d=el('td',undefined,tr,'econ-desc');el('strong',l.description,d);const ctx=contextName(l.context);if(ctx)el('small',ctx,d);
  if(pro){const meta=[];if(l.quantity.source==='manual')meta.push(tx('Medición manual','Manual quantity','手动数量')+(l.quantity.sourceLabel?': '+l.quantity.sourceLabel:''));else meta.push(tx('Medición del proyecto','Project quantity','项目数量'));
   if(l.ownSource?.label)meta.push(tx('Precio: ','Price: ','价格：')+l.ownSource.label+(l.ownSource.asOf?' ('+l.ownSource.asOf+')':''));
   if(l.reference)meta.push(tx('Fuente: ','Source: ','来源：')+[l.reference.label,l.reference.code,l.reference.asOf].filter(Boolean).join(' · '));
   if(l.contrastReference)meta.push(tx('Referencia de contraste: ','Contrast reference: ','对照参考：')+[l.contrastReference.label,l.contrastReference.code,eur(l.contrastReference.unitPrice)].filter(Boolean).join(' · '));
   if(l.reviewNote)meta.push(tx('Nota de revisión: ','Review note: ','审核备注：')+l.reviewNote);
   for(const m of meta)el('small',m,d,'econ-meta');}
  else if(l.contrastReference)el('small',tx('Referencia de contraste: ','Contrast reference: ','对照参考：')+[l.contrastReference.label,eur(l.contrastReference.unitPrice)].filter(Boolean).join(' · '),d,'econ-meta');
  const q=l.quantity.value===null?tx('No disponible','Unavailable','不可用'):num(l.quantity.value)+' '+UNIT()[l.quantity.unit];
  const cell=(text,label)=>{const c=el('td',text,tr,'num');c.dataset.label=label;return c;};
  if(pro){cell(q+(l.quantity.status!=='measured'?' · '+QSTATUS()[l.quantity.status]:''),tx('Medición','Quantity','数量'));cell(pct(l.wastePercent),tx('Merma','Waste','损耗'));cell(num(l.budgetQuantity),tx('Cantidad','Budget qty','预算数量'));}
  else cell(l.budgetQuantity===null?tx('No disponible','Unavailable','不可用'):num(l.budgetQuantity)+' '+UNIT()[l.quantity.unit],tx('Cantidad','Quantity','数量'));
  cell(eur(l.unitPrice),tx('Precio','Price','单价'));
  const st=el('td',undefined,tr,'econ-state');el('span',ORIGIN()[l.origin],st,'econ-chip econ-origin-'+l.origin);if(l.review&&pro)el('span',REVIEW()[l.review],st,'econ-chip econ-review-'+l.review);
  const amount=cell(l.subtotalNet===null?'—':eur(l.subtotalNet),tx('Importe','Amount','金额'));amount.classList.add('econ-amount');
  if(pro&&l.subtotalNet!==null)el('small',l.taxComplete?tx('IVA ','VAT ','增值税 ')+pct(l.taxRatePercent)+' · '+eur(l.subtotalGross):tx('IVA no definido','VAT undefined','增值税未定义'),amount,'econ-meta');}
 function table(lines,parent,pro){const t=el('table',undefined,parent,'econ-table'),h=el('tr',undefined,el('thead',undefined,t));
  const heads=pro?[tx('Partida','Item','项目'),tx('Medición','Quantity','数量'),tx('Merma','Waste','损耗'),tx('Cantidad','Budget qty','预算数量'),tx('Precio','Price','单价'),tx('Estado','Status','状态'),tx('Importe','Amount','金额')]
   :[tx('Partida','Item','项目'),tx('Cantidad','Quantity','数量'),tx('Precio','Price','单价'),tx('Estado','Status','状态'),tx('Importe','Amount','金额')];
  heads.forEach((x,i)=>el('th',x,h,i&&i!==(pro?5:3)?'num':''));const tb=el('tbody',undefined,t);for(const l of lines)lineRow(l,tb,pro);return t;}
 function groupTotal(g,parent){const p=el('p',undefined,parent,'econ-group-total'+(g.complete?'':' econ-partial'));
  p.textContent=tx('Subtotal: ','Subtotal: ','小计：')+eur(g.net.amount)+(g.net.complete?'':' · '+tx('incompleto','incomplete','不完整'))+' · '+(g.tax.complete?tx('IVA ','VAT ','增值税 ')+eur(g.tax.amount)+' · '+tx('con IVA ','incl. VAT ','含税 ')+eur(g.gross.amount):tx('IVA no definido/incompleto','VAT undefined/incomplete','增值税未定义/不完整'));}
 // Full document for the dialog and for print: variant 'professional' or 'client'.
 function documentFor(paper,{budget,report},variant){paper.replaceChildren();paper.dataset.variant=variant;paper.lang=typeof LANG==='string'?LANG:'es';
  const v=E.view(report,{variant}),pro=variant==='professional';
  const head=el('header',undefined,paper,'econ-head');el('small',pro?tx('Dossier económico · Profesional','Economic dossier · Professional','经济资料 · 专业'):tx('Dossier económico · Cliente','Economic dossier · Client','经济资料 · 客户'),head,'econ-kicker');
  el('h1',local(app.project.name),head);el('p',local(v.title)||'',head,'econ-sub');
  const brand=window.FloorPlanBrandUI?.snapshot?.();if(brand?.name)el('p',brand.name+(brand.person?' · '+brand.person:''),head,'econ-brand');
  el('p',tx('Documento generado el ','Document generated on ','文件生成于 ')+new Date().toLocaleDateString(loc(),{day:'numeric',month:'long',year:'numeric'}),head,'econ-date');
  totals(v,paper);counts(v,paper);
  if(v.summary.empty){el('p',tx('El presupuesto no tiene partidas.','The budget has no items.','预算没有项目。'),paper,'econ-empty');}
  warnings(v,paper);
  for(const c of v.chapters){if(!c.lines.length)continue;const s=el('section',undefined,paper,'econ-chapter');el('h2',local(c.title),s);table(c.lines,s,pro);groupTotal(c.totals,s);}
  if(v.unassigned){const s=el('section',undefined,paper,'econ-chapter');el('h2',tx('Sin capítulo','No chapter','无章节'),s);table(v.unassigned.lines,s,pro);groupTotal(v.unassigned.totals,s);}
  if(pro){const s=el('section',undefined,paper,'econ-trace');el('h2',tx('Trazabilidad y fuentes','Traceability and sources','可追溯性与来源'),s);const ul=el('ul',undefined,s),t=v.trace;
   el('li',tx(`Mediciones: ${t.projectQuantities} del proyecto, ${t.manualQuantities} manuales.`,`Quantities: ${t.projectQuantities} from the project, ${t.manualQuantities} manual.`,`数量：项目 ${t.projectQuantities}，手动 ${t.manualQuantities}。`),ul);
   el('li',tx(`Precios: ${t.ownPrices} propios, ${t.referencePrices} de referencia, ${t.contrastReferences} referencia(s) de contraste.`,`Prices: ${t.ownPrices} own, ${t.referencePrices} reference, ${t.contrastReferences} contrast reference(s).`,`价格：自有 ${t.ownPrices}，参考 ${t.referencePrices}，对照 ${t.contrastReferences}。`),ul);
   for(const src of t.sources)el('li',[src.label,src.edition,src.region,src.asOf,src.attribution].filter(Boolean).join(' · ')+' — '+tx('licencia: ','licence: ','许可：')+(src.licenseName||src.licenseStatus||tx('sin declarar','not declared','未声明'))+(src.licenseUrl?' ('+src.licenseUrl+')':'')+' · '+tx(`${src.items} partida(s)`,`${src.items} item(s)`,`${src.items} 项`),ul);
   el('li',tx('Identificador del presupuesto: ','Budget id: ','预算编号：')+v.budgetId,ul,'econ-id');}
  el('p',NOTE(),paper,'econ-foot');return v;}
 // Compact economic page for the A4 dossier and the B1 client file (same C4 layer, same report).
 function section(page,variant='client'){const cur=current();
  if(!cur){el('p',tx('No se ha preparado presupuesto para este proyecto.','No budget has been prepared for this project.','尚未为此项目准备预算。'),page,'econ-none');return null;}
  const v=E.view(cur.report,{variant});totals(v,page);warnings(v,page);
  if(v.chapters.some(c=>c.lines.length)||v.unassigned){const t=el('table',undefined,page,'econ-table econ-compact'),tb=el('tbody',undefined,t);
   for(const c of [...v.chapters.filter(c=>c.lines.length),...(v.unassigned?[{title:tx('Sin capítulo','No chapter','无章节'),totals:v.unassigned.totals,lines:v.unassigned.lines}]:[])]){const tr=el('tr',undefined,tb);el('td',local(c.title)+' · '+c.lines.length,tr);el('td',eur(c.totals.net.amount)+(c.totals.net.complete?'':' · '+tx('incompleto','incomplete','不完整')),tr,'num');}}
  el('p',NOTE(),page,'econ-foot');return v;}
 // Dialog
 let variant='professional',state=null,returnFocus=null;
 const dialog=el('dialog',undefined,document.body,'econ-dialog');dialog.id='economicDossierDialog';dialog.setAttribute('aria-labelledby','economicDossierTitle');
 const tools=el('div',undefined,dialog,'econ-tools'),heading=el('h2',undefined,tools);heading.id='economicDossierTitle';
 const switcher=el('div',undefined,tools,'econ-switch');switcher.setAttribute('role','radiogroup');
 const vb={professional:btn('',switcher,'btn econ-variant'),client:btn('',switcher,'btn econ-variant')};vb.professional.id='econVariantProfessional';vb.client.id='econVariantClient';
 for(const [k,b] of Object.entries(vb)){b.setAttribute('role','radio');b.onclick=()=>{variant=k;draw();};}
 const actions=el('div',undefined,tools,'econ-actions'),printB=btn('',actions,'btn primary'),csvB=btn('',actions),jsonB=btn('',actions),bc3B=btn('',actions),reviewB=btn('',actions),closeB=btn('',actions);
 printB.id='econPrint';csvB.id='econCsv';jsonB.id='econJson';bc3B.id='econBc3';reviewB.id='econReview';closeB.id='econClose';
 const status=el('p',undefined,dialog,'econ-status');status.setAttribute('aria-live','polite');
 const paper=el('article',undefined,dialog,'econ-paper');paper.id='economicDossierPaper';
 function relang(){heading.textContent=tx('Dossier económico','Economic dossier','经济资料');vb.professional.textContent=tx('Profesional','Professional','专业');vb.client.textContent=tx('Cliente','Client','客户');
  printB.textContent=tx('Imprimir / Guardar PDF','Print / Save PDF','打印 / 保存 PDF');csvB.textContent=tx('CSV','CSV','CSV');jsonB.textContent=tx('JSON del informe','Report JSON','报告 JSON');bc3B.textContent='BC3';reviewB.textContent=tx('Revisar presupuesto','Review budget','审核预算');closeB.textContent=tx('Cerrar','Close','关闭');}
 function draw(){for(const [k,b] of Object.entries(vb)){b.setAttribute('aria-checked',String(k===variant));b.classList.toggle('active',k===variant);}
  if(!state){paper.replaceChildren();el('p',tx('No se ha preparado presupuesto para este proyecto. Prepáralo en Presupuestar.','No budget has been prepared for this project. Prepare it in Budget.','尚未准备预算。请在“预算”中准备。'),paper,'econ-none');[printB,csvB,jsonB,bc3B].forEach(b=>b.disabled=true);return;}
  [printB,csvB,jsonB].forEach(b=>b.disabled=false);bc3B.hidden=!window.FloorPlanBc3Budget;bc3B.disabled=false;documentFor(paper,state,variant);}
 function open(initial){returnFocus=document.activeElement;if(E.VARIANTS.includes(initial))variant=initial;relang();state=current();status.textContent='';draw();dialog.showModal();vb[variant].focus({preventScroll:true});}
 function download(blob,file){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
 const base=()=>`rubik-sota-presupuesto-${slug(local(app.project.name))}`;
 csvB.onclick=()=>download(new Blob([P.toCsv(state.budget,{delimiter:';',bom:true})],{type:'text/csv;charset=utf-8'}),base()+'.csv');
 jsonB.onclick=()=>download(new Blob([P.serializeReport(state.budget)],{type:'application/json'}),base()+'-informe.json');
 bc3B.onclick=()=>{try{const out=window.FloorPlanBc3Budget.exportBudget(state.budget,{title:local(app.project.name)});download(new Blob([out.bytes],{type:'application/octet-stream'}),base()+'.bc3');status.textContent=tx('BC3 generado.','BC3 generated.','BC3 已生成。');}catch(e){status.textContent=e.message;}};
 reviewB.onclick=()=>{dialog.close();window.FloorPlanProfessionalUI?.open?.('budget');};
 closeB.onclick=()=>dialog.close();dialog.addEventListener('close',()=>returnFocus?.focus?.({preventScroll:true}));
 // Print: the dossier pattern (own window, same stylesheet, the document cloned as shown).
 // The stylesheet is inlined so the print window never depends on a second request.
 async function print(){const win=window.open('','_blank');if(!win){status.textContent=tx('El navegador bloqueó la ventana de impresión.','The browser blocked the print window.','浏览器阻止了打印窗口。');return null;}
  let css='';try{css=await (await fetch(new URL('css/economic-dossier.css',document.baseURI).href)).text();}catch{}
  win.document.open();win.document.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="econ-print"></body></html>');win.document.close();
  const style=win.document.createElement('style');style.textContent=css;win.document.head.append(style);
  win.document.title=heading.textContent+' · '+local(app.project.name);const b=win.document.createElement('button');b.textContent=printB.textContent;b.className='econ-print-button';b.onclick=()=>win.print();
  win.document.body.append(b,paper.cloneNode(true));win.focus();win.print();return win;}
 printB.onclick=print;
 window.FloorPlanEconomicDossierUI={open,close:()=>dialog.close(),section,current,cardState:()=>{const c=current();return c?E.cardState(c.report):{state:'none'};},get variant(){return variant;},get active(){return dialog.open;}};
})();
