/* ENT-04 fase 2 · Coherencia entre dos revisiones de un proyecto y sus presupuestos C1–C4. Núcleo puro (UMD): no calcula
   precios, no completa importes, no guarda ni publica. Reutiliza las autoridades existentes:
   - FloorPlanBudgetPresentation.buildReport (importes, IVA y completitud de cada partida, informe C2);
   - FloorPlanBudgetDraft.lines (las cantidades que RUBIK justifica con la geometría de una revisión);
   - FloorPlanRevisionCompare (los cambios reales entre las dos revisiones, por identificador).

   Tres preguntas, tres respuestas honestas:
   1) revisionMatch: ¿sobre qué revisión está hecho un presupuesto? RUBIK no lo guarda (DEC-07). Se compara cada partida
      con las cantidades de «antes» y de «después»: before | after | both (las dos revisiones dan las mismas cantidades) |
      neither (ninguna: otra revisión, editado a mano o incompleto).
   2) compareBudgets: presupuesto de «antes» frente al de «después», partida a partida (mismo identificador estable de
      partida del borrador real). La diferencia TOTAL solo se da cuando los dos presupuestos están completos y cada uno
      corresponde a su revisión; si no, se dan los importes CONOCIDOS y la diferencia de las partidas comparables, con las
      partidas excluidas y el motivo, y nunca se presenta como la diferencia de coste.
   3) dependencias: qué partidas dependen de cada cambio real (relación de cálculo del borrador, NO reparto de coste) y
      qué variaciones de cantidad no explica ningún cambio. */
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const api=factory(node?require('./revision-compare-core.js'):root.FloorPlanRevisionCompare,node?require('./budget-presentation.js'):root.FloorPlanBudgetPresentation,node?require('./budget-draft-core.js'):root.FloorPlanBudgetDraft);
  if(node)module.exports=api;else root.FloorPlanRevisionBudget=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Compare,Presentation,Draft){
  'use strict';
  if(!Compare||!Presentation||!Draft)throw Error('FloorPlanRevisionBudget requiere FloorPlanRevisionCompare, FloorPlanBudgetPresentation y FloorPlanBudgetDraft.');
  const SCHEMA='rubik-sota.revision-budget-comparison',VERSION='1.0.0';
  const EPS=1e-6,r2=x=>Math.round(x*100)/100;
  const fail=(code,message)=>{const e=new Error(message||code);e.code=code;throw e;};
  // Etiquetas mínimas para Draft.lines: aquí solo cuentan las claves y las cantidades, no los textos.
  const QLABELS={title:'',floor:'',skirting:'',paint:'',newWalls:'',demolition:'',door:'',slidingDoor:'',window:'',tariff:'',chapters:{floors:'',walls:'',partitions:'',carpentry:''}};
  const expectedQuantities=project=>new Map(Draft.lines(project,{labels:QLABELS}).map(l=>[l.key,l.quantity]));

  function quantityDiff(report,project){
    const expected=expectedQuantities(project),out=[];
    for(const l of report.lines){const q=expected.get(l.id);
      if(!q)out.push({itemId:l.id,description:l.description,reason:'not-in-revision'});
      else if(l.quantity.unit!==q.unit||Math.abs(l.quantity.value-q.value)>EPS)out.push({itemId:l.id,description:l.description,reason:'quantity',budget:{value:l.quantity.value,unit:l.quantity.unit},revision:{value:q.value,unit:q.unit}});}
    for(const [key,q] of expected)if(!report.lines.some(l=>l.id===key))out.push({itemId:key,description:null,reason:'missing-in-budget',revision:{value:q.value,unit:q.unit}});
    return out;
  }
  const reportOf=budget=>{const r=Presentation.buildReport(budget);if(!r.lines.length)fail('budget-empty','El presupuesto no tiene partidas.');return r;};

  /* ¿Sobre qué revisión está hecho este presupuesto? Lanza budget-subject-mismatch si es de otro proyecto. */
  function revisionMatch(budget,{before,after}){
    const report=reportOf(budget),ids=new Set([before.id,after.id]);
    if(report.subject?.type!=='project'||!ids.has(report.subject.id))fail('budget-subject-mismatch','El presupuesto no es de ninguna de las dos revisiones.');
    const db=quantityDiff(report,before),da=quantityDiff(report,after);
    // Con identificadores distintos (variante), un presupuesto solo puede ser del proyecto que nombra.
    const canBefore=report.subject.id===before.id,canAfter=report.subject.id===after.id;
    const mb=canBefore&&!db.length,ma=canAfter&&!da.length;
    return {budgetId:report.budgetId,subjectId:report.subject.id,matches:mb&&ma?'both':mb?'before':ma?'after':'neither',
      before:{possible:canBefore,match:mb,differences:db},after:{possible:canAfter,match:ma,differences:da}};
  }

  // Partidas de las que depende cada tipo de cambio en el borrador real (FloorPlanBudgetDraft.lines). Dependencia de
  // cálculo, no reparto de coste: la pintura depende de todos los muros en pie y de todos los huecos.
  function dependsOn(change,before,after){
    const ids=new Set(),find=(p,list,id)=>(p[list]||[]).find(x=>x.id===id);
    if(change.entity==='room'){
      for(const p of [before,after]){const r=find(p,'rooms',change.entityId);if(r?.floorMaterialId)ids.add('floor:'+r.floorMaterialId);}
      if(change.change!=='modified'||change.fields.some(f=>f.field==='polygon'||f.field==='countsTowardArea'))ids.add('skirting');
    }else if(change.entity==='wall'){
      const wa=find(before,'walls',change.entityId),wb=find(after,'walls',change.entityId);
      for(const w of [wa,wb]){if(!w)continue;if(w.status==='new')ids.add('partition-new');if(w.status==='demolished')ids.add('demolition');if(w.status!=='demolished')ids.add('paint');}
    }else if(change.entity==='opening'){
      const oa=find(before,'openings',change.entityId),ob=find(after,'openings',change.entityId);
      for(const o of [oa,ob])if(o&&['door','sliding-door','window'].includes(o.kind))ids.add('opening:'+o.kind);
      ids.add('paint');
    }else if(change.entity==='material'){ids.add('floor:'+change.entityId);}
    return [...ids];
  }
  const side=line=>line?{quantity:{value:line.quantity.value,unit:line.quantity.unit,complete:!!line.quantity.complete},budgetQuantity:line.budgetQuantity,unitPrice:line.unitPrice,
    net:line.subtotalNet,gross:line.subtotalGross,taxRatePercent:line.effectiveTaxRatePercent,priced:line.subtotalNet!==null&&line.pricingComplete&&!!line.quantity.complete,reviewed:line.review?.status==='reviewed',priceSource:line.priceSource?.label||null}:null;

  /* Comparación de los presupuestos de dos revisiones. comparison: FloorPlanRevisionCompare.compare(before, after). Cualquiera
     de los dos presupuestos puede faltar (status 'one-sided' o 'none'); nunca se inventa el que falta. */
  function compareBudgets({comparison,beforeProject,afterProject,beforeBudget=null,afterBudget=null}){
    if(comparison?.schema!==Compare.SCHEMA)fail('comparison-required','Falta la comparación de las dos revisiones.');
    if(beforeProject?.id!==comparison.before.projectId||afterProject?.id!==comparison.after.projectId)fail('projects-mismatch','Los proyectos no son los de la comparación.');
    const sides={};
    for(const [key,budget,project] of [['before',beforeBudget,beforeProject],['after',afterBudget,afterProject]]){
      if(!budget){sides[key]=null;continue;}
      const report=reportOf(budget);
      if(report.subject?.type!=='project'||report.subject.id!==project.id)fail('budget-subject-mismatch',`El presupuesto de «${key==='before'?comparison.before.label:comparison.after.label}» no es de esa revisión.`);
      const match=revisionMatch(budget,{before:beforeProject,after:afterProject}),own=key==='before'?match.before:match.after,t=report.totals;
      sides[key]={budgetId:report.budgetId,title:report.title,taxRatePercent:report.taxRatePercent,currency:report.currency,report,
        complete:t.net.complete&&t.tax.complete&&t.gross.complete,net:t.net.amount,tax:t.tax.amount,gross:t.gross.amount,
        unpriced:[...t.unpricedItemIds],incompleteQuantity:[...t.incompleteQuantityItemIds,...t.unavailableQuantityItemIds],unreviewed:[...t.unreviewedPriceItemIds],
        matchesRevision:own.match,revisionMatch:match.matches,differences:own.differences};
    }
    const B=sides.before,A=sides.after;
    const status=!B&&!A?'none':!B||!A?'one-sided':!B.matchesRevision||!A.matchesRevision?'incoherent':B.complete&&A.complete?'complete':'partial';

    // Partida a partida (identificador estable del borrador).
    const lb=new Map((B?.report.lines||[]).map(l=>[l.id,l])),la=new Map((A?.report.lines||[]).map(l=>[l.id,l]));
    const ids=[...new Set([...lb.keys(),...la.keys()])];
    const deps=comparison.changes.map(c=>({change:c,items:dependsOn(c,beforeProject,afterProject)}));
    const lines=ids.map(id=>{
      const b=side(lb.get(id)),a=side(la.get(id)),src=la.get(id)||lb.get(id);
      const qChanged=!!(b&&a)&&(b.quantity.unit!==a.quantity.unit||Math.abs(b.quantity.value-a.quantity.value)>EPS);
      // Cambio de precio solo entre dos precios conocidos; una partida sin precio es «parcial», no un cambio de precio.
      const pChanged=!!(b&&a)&&b.unitPrice!==null&&a.unitPrice!==null&&b.unitPrice!==a.unitPrice;
      const change=!b?'added':!a?'removed':qChanged&&pChanged?'quantity-and-price':qChanged?'quantity':pChanged?'price':'same';
      // Comparable (diferencia exacta) solo con importe conocido en los lados que existen.
      const comparable=(!b||b.priced)&&(!a||a.priced)&&!!(B&&A);
      const reason=!B||!A?'budget-missing':b&&!b.priced?(b.quantity.complete?'unpriced-before':'quantity-incomplete-before'):a&&!a.priced?(a.quantity.complete?'unpriced-after':'quantity-incomplete-after'):null;
      const explainedBy=deps.filter(d=>d.items.includes(id)).map(d=>d.change.entity+':'+d.change.entityId);
      return {itemId:id,description:src.description,chapterId:src.chapterId,change,before:b,after:a,
        delta:comparable?{net:r2((a?.net||0)-(b?.net||0)),gross:r2((a?.gross||0)-(b?.gross||0))}:null,status:comparable?'exact':'partial',excludedReason:reason,
        explainedBy,unexplained:(change==='added'||change==='removed'||qChanged)&&!explainedBy.length};
    });
    const exact=lines.filter(l=>l.status==='exact'),excluded=lines.filter(l=>l.status!=='exact');
    const sum=(list,f)=>r2(list.reduce((n,l)=>n+(l.delta?.[f]||0),0));
    let totals;
    if(status==='complete')totals={status,net:{before:B.net,after:A.net,delta:r2(A.net-B.net)},gross:{before:B.gross,after:A.gross,delta:r2(A.gross-B.gross)},
      statement:'Los dos presupuestos están completos y cada uno corresponde a su revisión: la diferencia es la de los dos presupuestos.'};
    else if(status==='partial')totals={status,knownNet:{before:B.net,after:A.net},comparable:{items:exact.length,netDelta:sum(exact,'net'),grossDelta:sum(exact,'gross')},excluded:excluded.map(l=>({itemId:l.itemId,reason:l.excludedReason})),
      statement:'Algún presupuesto está incompleto: se dan los importes conocidos y la diferencia de las partidas comparables. No es la diferencia de coste total.'};
    else if(status==='incoherent')totals={status,statement:'Algún presupuesto no corresponde a su revisión (sus cantidades no coinciden): no se calcula ninguna diferencia de importes.',
      mismatched:[['before',B],['after',A]].filter(([,s])=>!s.matchesRevision).map(([k,s])=>({side:k,revisionMatch:s.revisionMatch,differences:s.differences.length}))};
    else if(status==='one-sided')totals={status,statement:`Solo hay presupuesto de «${B?comparison.before.label:comparison.after.label}»: no hay nada con qué compararlo.`};
    else totals={status,statement:'Sin presupuestos: no se muestran importes.'};
    const notes=[];
    if(B&&A&&B.taxRatePercent!==A.taxRatePercent)notes.push(`El tipo de IVA cambia (${B.taxRatePercent} % → ${A.taxRatePercent} %): compárese la diferencia sin IVA.`);
    if(B&&A&&(B.unreviewed.length||A.unreviewed.length))notes.push(`Hay precios sin revisar (${B.unreviewed.length} en «${comparison.before.label}», ${A.unreviewed.length} en «${comparison.after.label}»): son importes provisionales.`);
    const unexplained=lines.filter(l=>l.unexplained).map(l=>l.itemId);
    if(unexplained.length)notes.push(`${unexplained.length} partida(s) cambian sin ningún cambio del proyecto que lo explique: revisa si el presupuesto es de esa revisión.`);
    const dependencies=deps.map(d=>({entity:d.change.entity,entityId:d.change.entityId,summary:d.change.summary,items:d.items.filter(i=>lb.has(i)||la.has(i))}));
    const strip=s=>s&&(({report,...rest})=>rest)(s);
    return {schema:SCHEMA,version:VERSION,status,before:strip(B),after:strip(A),lines,totals,dependencies,unexplained,notes,
      counts:{items:lines.length,exact:exact.length,partial:excluded.length,changed:lines.filter(l=>l.change!=='same').length}};
  }
  return Object.freeze({SCHEMA,VERSION,revisionMatch,compareBudgets,dependsOn,quantityDiff});
});
