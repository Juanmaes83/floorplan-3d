/* UX-07 · Adaptador mínimo Variantes → comparador antes/después. Núcleo puro (UMD): no guarda, no publica y no crea un
   sistema paralelo de variantes. Toma EXACTAMENTE lo que el diálogo «Variantes» del editor ya tiene en la mano
   (index.html, renderVariants: library.group(activeId), el proyecto abierto y los presupuestos guardados) y prepara la
   comparación con los módulos existentes:
   - FloorPlanRevisionCompare.compare (cambios reales por identificador, encuadre común): relación 'library-variant', la
     del enlace local de variantes; nunca se declara una relación que la biblioteca no tenga;
   - FloorPlanRevisionBudget.compareBudgets (si hay presupuestos guardados de esos proyectos; si no, lo dice).

   Reglas:
   - las dos entradas deben pertenecer al MISMO grupo de variantes (original y sus variantes): fuera de él, error;
   - la distribución abierta usa lo que la persona ve (activeProject), igual que renderVariants;
   - edificios: se compara la planta del mismo orden en cada distribución (lo que ya hace library.group) y se dice;
   - presupuestos: solo se leen; un presupuesto que no es del proyecto se rechaza en compareBudgets.

   handoff(): parámetros de URL para abrir el comparador con esas dos entradas de la biblioteca (solo lectura). La conexión
   en el editor (un botón en cada tarjeta de variante) es una cirugía en index.html que NO se aplica aquí. */
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const api=factory(node?require('./revision-compare-core.js'):root.FloorPlanRevisionCompare,node?require('./revision-budget-core.js'):root.FloorPlanRevisionBudget);
  if(node)module.exports=api;else root.FloorPlanVariantsCompare=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Compare,RevisionBudget){
  'use strict';
  if(!Compare)throw Error('FloorPlanVariantsCompare requiere FloorPlanRevisionCompare.');
  const VERSION='1.0.0';
  const fail=(code,message)=>{const e=new Error(message||code);e.code=code;throw e;};
  const clone=v=>JSON.parse(JSON.stringify(v));

  /* Parejas que el diálogo puede ofrecer: el original frente a cada variante (antes = original), y la abierta primero. */
  function pairs(group,activeId){
    if(!Array.isArray(group)||group.length<2)return [];
    const original=group[0],out=group.slice(1).map(v=>({beforeId:original.id,afterId:v.id,label:`${original.name} → ${v.name}`,active:v.id===activeId||original.id===activeId}));
    return out.sort((a,b)=>Number(b.active)-Number(a.active));
  }

  function prepare({group,activeId=null,activeProject=null,beforeId,afterId,budgets=null,beforeLabel=null,afterLabel=null}={}){
    if(!Array.isArray(group)||!group.length)fail('group-required','Falta el grupo de variantes.');
    if(beforeId===afterId)fail('same-entry','Elige dos distribuciones distintas.');
    const find=id=>group.find(g=>g.id===id),b=find(beforeId),a=find(afterId);
    if(!b||!a)fail('not-in-group','Solo se comparan el original y sus variantes (el mismo grupo del diálogo «Variantes»).');
    const projectOf=g=>clone(g.id===activeId&&activeProject?activeProject:g.project);
    const before=projectOf(b),after=projectOf(a);
    const labels={before:beforeLabel||b.name,after:afterLabel||a.name};
    const comparison=Compare.compare(before,after,{relation:before.id===after.id?'same-project':'library-variant',beforeLabel:labels.before,afterLabel:labels.after});
    const notes=[];
    if(activeId&&(b.id===activeId||a.id===activeId)&&activeProject)notes.push(`«${(b.id===activeId?b:a).name}» está abierta: se compara lo que ves en el editor.`);
    if(b.levelName||a.levelName)notes.push(`Edificio: se compara la planta «${b.levelName||'—'}» con la planta «${a.levelName||'—'}» (mismo orden en cada distribución).`);
    const stored=id=>budgets&&typeof budgets==='object'&&Object.prototype.hasOwnProperty.call(budgets,id)?budgets[id]:null;
    const budgetBefore=stored(before.id),budgetAfter=stored(after.id);
    let budgetComparison=null;
    if(RevisionBudget&&(budgetBefore||budgetAfter))budgetComparison=RevisionBudget.compareBudgets({comparison,beforeProject:before,afterProject:after,beforeBudget:budgetBefore,afterBudget:budgetAfter});
    if(!budgetBefore&&!budgetAfter)notes.push('Ninguna de las dos distribuciones tiene presupuesto guardado: la comparación no muestra importes.');
    return {schema:'rubik-sota.variants-compare',version:VERSION,entries:{before:{id:b.id,name:b.name,levelName:b.levelName||null},after:{id:a.id,name:a.name,levelName:a.levelName||null}},
      before,after,relation:comparison.relation,labels,comparison,budgets:{before:budgetBefore,after:budgetAfter},budgetComparison,notes};
  }

  /* Para abrir el comparador con dos entradas de la biblioteca de este navegador (solo lectura). */
  function handoff({beforeId,afterId}){
    if(typeof beforeId!=='string'||typeof afterId!=='string'||!beforeId||!afterId)fail('ids-required','Faltan las dos entradas.');
    return 'src=library&before='+encodeURIComponent(beforeId)+'&after='+encodeURIComponent(afterId);
  }
  return Object.freeze({VERSION,pairs,prepare,handoff});
});
