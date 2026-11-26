/* UX-312 PERLA · U10 Semáforo + barra de progreso: la persona ve qué está hecho, qué está empezado y qué falta, y llega
   a lo que falta con un toque. Una sola fuente de estado por pantalla, sin inventar estados:
   - Editor (Diseñar): las «Tareas del proyecto» (FloorPlanGuideUI.progress): completed → verde · active/review → naranja ·
     pending → rojo. Porcentaje = tareas necesarias hechas / necesarias.
   - Entregar: el estado de cada ficha (data-perla-pill): ok «Listo» → verde · pend «Al pulsar» (tiene sus datos, falta
     generarla o validarla) → naranja · req «Falta» (le falta un requisito) → rojo.
   - Presupuestar: las filas del resumen (mismas tres clases).
   - Recorrido de obra: sus pasos (done → verde · next → naranja · todo → rojo).
   Accesible: color + icono + texto; cada punto es un botón con nombre («Crea las estancias: sin hacer»). */
(()=>{'use strict';
 const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 const tx=(es,en,zh)=>{const l=document.documentElement.lang||'es';return l.startsWith('en')?en:l.startsWith('zh')?zh:es;};
 const LABEL={ok:()=>tx('Hecho','Done','已完成'),pend:()=>tx('Empezado, sin terminar','Started, not finished','已开始，未完成'),req:()=>tx('Sin hacer','Not done','未完成')};
 const ICON={ok:'✓',pend:'◐',req:'○'};
 const el=(tag,cls,parent,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;parent?.append(e);return e;};
 const L=a=>a[(document.documentElement.lang||'es').startsWith('en')?1:(document.documentElement.lang||'').startsWith('zh')?2:0];

 // Barra común: porcentaje + segmentos (verde/naranja/rojo) + recuento en texto.
 function bar(host,counts,title,noun){let b=host.querySelector(':scope>.perla-sem');if(!b){b=el('div','perla-sem',null);b.setAttribute('role','group');host.prepend(b);}
  const total=counts.ok+counts.pend+counts.req,pct=total?Math.round(counts.ok/total*100):0;
  const sig=[counts.ok,counts.pend,counts.req,document.documentElement.lang,noun?noun():''].join('|');if(b.dataset.sig===sig)return b;b.dataset.sig=sig;
  b.setAttribute('aria-label',title);b.replaceChildren();
  const head=el('div','perla-sem-head',b);el('strong',null,head,`${pct} % `+tx('completado','complete','已完成'));
  // §5.3 · Qué cuenta el porcentaje y su denominador, en texto.
  if(noun){const d=el('span','perla-sem-base',head,tx(`${counts.ok} de ${total} ${noun()}`,`${counts.ok} of ${total} ${noun()}`,`${total} 项中 ${counts.ok} 项 ${noun()}`));d.dataset.base=`${counts.ok}/${total}`;}
  const leg=el('span','perla-sem-legend',head);for(const k of ['ok','pend','req'])if(counts[k]){const s=el('span','perla-sem-k '+k,leg);el('i',null,s,ICON[k]);s.append(` ${LABEL[k]()}: ${counts[k]}`);}
  const m=el('div','perla-sem-bar',b);m.setAttribute('role','progressbar');m.setAttribute('aria-valuemin','0');m.setAttribute('aria-valuemax','100');m.setAttribute('aria-valuenow',String(pct));m.setAttribute('aria-label',title);
  for(const k of ['ok','pend','req'])if(counts[k]){const seg=el('span','seg '+k,m);seg.style.flexGrow=String(counts[k]);}
  return b;}

 // ---- Editor: puntos por tarea junto a «Paso n de m» -------------------------------------------------------------
 const mapTask=s=>s==='completed'?'ok':(s==='active'||s==='review')?'pend':'req';
 function editor(){const prog=$('#perlaProgress'),G=window.FloorPlanGuideUI;if(!prog||!G?.progress)return;let p;try{p=G.progress();}catch{return;}
  const tasks=p.tasks.filter(t=>t.necessary&&!t.skipped);let dots=prog.querySelector(':scope>.perla-sem-dots');if(!dots){dots=el('div','perla-sem-dots',prog);dots.setAttribute('role','group');}
  const sig=tasks.map(t=>t.id+':'+t.status).join(',')+'|'+document.documentElement.lang;if(dots.dataset.sig===sig)return;dots.dataset.sig=sig;
  dots.setAttribute('aria-label',tx('Estado de las tareas del proyecto','Project task status','项目任务状态'));dots.replaceChildren();
  for(const t of tasks){const k=mapTask(t.status),b=el('button','perla-dot '+k,dots,ICON[k]);b.type='button';b.dataset.task=t.id;b.dataset.sem=k;
   const name=`${L(t.title)}: ${LABEL[k]().toLowerCase()}`;b.setAttribute('aria-label',name);b.title=name;b.onclick=()=>G.openDetails(t.id);}
  const done=tasks.filter(t=>t.status==='completed').length,pct=tasks.length?Math.round(done/tasks.length*100):0;prog.dataset.pct=String(pct);}

 // ---- Entregar y Presupuestar: barra en la cabecera del área ----------------------------------------------------
 function areas(){const ws=$('#professionalWorkspace');if(!ws||ws.hidden)return;const area=window.FloorPlanProfessionalUI?.area;
  if(area==='deliver'){const cards=$$('#professionalWorkspace [data-entrega-code][data-perla-pill]');if(!cards.length)return;
   const c={ok:0,pend:0,req:0};for(const x of cards)c[x.dataset.perlaPill]=(c[x.dataset.perlaPill]||0)+1;
   for(const x of cards){x.dataset.sem=x.dataset.perlaPill;}
   // Junto a su lista Listo / Al pulsar / Falta (no altera la composición de la cabecera).
   const list=$('#professionalWorkspace .hero-ent .listo');if(list){let w=list.previousElementSibling;if(!w?.classList.contains('perla-sem-host')){w=el('div','perla-sem-host',null);list.before(w);}bar(w,c,tx('Estado de las entregas','Delivery status','交付状态'),()=>tx('entregables listos','deliverables ready','交付物已就绪'));}}
  if(area==='budget'){const rows=$$('#professionalWorkspace .pres-listo li');if(!rows.length)return;const c={ok:0,pend:0,req:0};
   for(const r of rows){const k=r.querySelector('.ok')?'ok':r.querySelector('.pend,.draft')?'pend':'req';c[k]++;r.dataset.sem=k;}
   const host=$('#professionalWorkspace .pres-hero-txt');if(host)bar(host,c,tx('Estado del presupuesto','Budget status','预算状态'),()=>tx('piezas del presupuesto listas','budget parts ready','预算部分已就绪'));}
  // U12 · Analizar: cada ficha con estado real del proyecto (escala, norte, parcela, fachadas).
  if(area==='analyze'){const p=window.FloorPlanApp?.project,s=window.FloorPlanBuildingUI?.site||p?.site||{};if(!p)return;
   let ext=0;try{ext=window.FloorPlanExterior?.derive(p)?.walls?.filter(w=>w.status==='facade').length||0;}catch{}
   const conf=p.scale?.confidence;
   const STATES=[[/^(Medidas y superficies|Measurements and areas|Measurements and surfaces|尺寸)/,conf==='real'?'ok':conf==='estimated'?'pend':'req'],
    [/^(Orientación y sol|Orientation and sun|朝向)/,s.northOffsetDeg===undefined?'req':s.location?'ok':'pend'],
    [/^(Emplazamiento|Site context|场地)/,!s.parcel?'req':s.buildingPlacement?'ok':'pend'],
    [/^(Exterior|外部)/,ext>0?'ok':'req']];
   const c={ok:0,pend:0,req:0};
   for(const card of $$('#professionalWorkspace .professional-card')){const h=(card.querySelector('h2,h3')?.textContent||'').trim();const m=STATES.find(([re])=>re.test(h));if(!m)continue;
    c[m[1]]++;if(card.dataset.sem!==m[1])card.dataset.sem=m[1];
    // §5.3 · El color nunca va solo: etiqueta con texto junto al título de la ficha.
    const hd=card.querySelector('h2,h3');let tag=card.querySelector(':scope .perla-sem-tag');const want=LABEL[m[1]]();
    if(hd&&(!tag||tag.textContent!==want)){if(!tag){tag=el('span','perla-sem-tag',null);hd.after(tag);}tag.className='perla-sem-tag perla-pill '+m[1];tag.textContent=want;}}
   const intro=$('#professionalWorkspace .professional-intro');if(intro&&(c.ok+c.pend+c.req)){let w=intro.nextElementSibling;if(!w?.classList.contains('perla-sem-host')){w=el('div','perla-sem-host',null);intro.after(w);}bar(w,c,tx('Estado del análisis','Analysis status','分析状态'),()=>tx('comprobaciones hechas','checks done','检查已完成'));}}
  // Recorrido de obra: el semáforo refleja el estado de cada paso de la guía.
  for(const li of $$('#professionalWorkspace .cx-jstep')){const k=li.dataset.state==='done'?'ok':li.dataset.state==='next'?'pend':'req';if(li.dataset.sem!==k)li.dataset.sem=k;
   }}

 let q=0;const run=()=>{if(!q)q=requestAnimationFrame(()=>{q=0;try{editor();areas();}catch(e){console.warn('semáforo',e);}});};
 function start(){new MutationObserver(run).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-state','data-perla-pill','hidden','class']});
  addEventListener('rubik-guide',run);document.addEventListener('rubik:languagechange',()=>setTimeout(run,0));run();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
 window.FloorPlanPerlaSemaforo={refresh:run};
})();
